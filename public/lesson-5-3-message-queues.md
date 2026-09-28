# LIÇÃO 5.3: Message Queues - Async em Escala

## SEÇÃO 1: INTRODUÇÃO (6 minutos)

### O Problema Real

Um aluno submete uma resposta de exercício. Você precisa:
1. Validar a resposta (100ms)
2. Persistir no banco (200ms)
3. Gerar feedback com IA (2000ms)
4. Enviar email (500ms)
5. Registrar analytics (100ms)

Sequencial = 2900ms. Usuário espera 3 segundos por feedback!

Com message queues, você faz:
1. Valida e persiste (300ms) → retorna imediatamente ao usuário
2. Enfileira "gerar feedback", "enviar email", "registrar analytics"
3. Workers processam em background enquanto usuário já vê a resposta

Latência percebida: 300ms em vez de 2900ms. 10x mais rápido.

### Arquitetura

```
Cliente → API (persistir resposta) → Retorna 300ms
                    ↓
             Enfileira eventos
                    ↓
          Message Queue (RabbitMQ/SQS)
                    ↓
    Workers assíncronos processam
```

### Objetivo da Lição

Nesta aula, você vai entender:
- Por que "fast at the happy path, slow for background"
- Padrões: at-least-once, exactly-once, event sourcing
- Dead letter queues para falhas
- Idempotência (processar 2x = resultado igual a processar 1x)
- Implementação com TypeScript + Node.js

---

## SEÇÃO 2: ASYNC PATTERNS (12 minutos)

### Padrão 1: Fire-and-Forget (At-Least-Once)

Enfileira tarefa, retorna imediatamente. Worker processa depois.

```typescript
async submitExerciseAnswer(userId: string, exerciseId: string, answer: string): Promise<void> {
  // 1. Valida
  validateAnswer(answer);
  
  // 2. Persiste resposta (rápido)
  const response = await db.insertResponse({
    userId,
    exerciseId,
    answer,
    submittedAt: new Date()
  });
  
  // 3. Enfileira processamento (não bloqueia)
  await queue.enqueue('grade-exercise', {
    responseId: response.id,
    userId,
    exerciseId,
    answer
  });
  
  // 4. Retorna AGORA, antes de processar
  return { responseId: response.id, status: 'submitted' };
}

// Worker (em outro processo/servidor)
queue.subscribe('grade-exercise', async (message) => {
  try {
    // Gera feedback com IA (pode levar segundos)
    const feedback = await aiTutor.grade(message.answer);
    
    // Persiste feedback
    await db.insertFeedback({
      responseId: message.responseId,
      feedback,
      generatedAt: new Date()
    });
    
    // Notifica cliente em real-time
    await pubsub.publish(`response:${message.responseId}`, { feedback });
    
  } catch (error) {
    // Enfileira retry com backoff
    await queue.enqueueRetry(message, error);
  }
});
```

**Vantagem:** Usuário tem feedback imediato  
**Risco:** Se worker falha, feedback não é gerado

### Padrão 2: Exactly-Once Semantics

Garantir que mensagem é processada exatamente uma vez (não 0, não 2).

```typescript
class ExactlyOnceQueue {
  async process(message: Message): Promise<void> {
    // 1. Marcar como "processando"
    const processId = crypto.randomUUID();
    await this.redis.setex(
      `processing:${message.id}:${processId}`,
      300, // 5 minutos
      'true'
    );
    
    // 2. Processar
    try {
      await this.handler(message);
      
      // 3. Marcar como "processado com sucesso"
      await this.redis.set(
        `processed:${message.id}`,
        processId,
        { nx: true } // Só se não existir
      );
      
      // 4. Remover da fila
      await this.queue.delete(message);
      
    } catch (error) {
      // Se falha, não marcar como processado
      // Próxima tentativa vai ver que não foi e tenta novamente
      await this.queue.enqueueRetry(message);
    }
  }
  
  // Idempotência: se tenta novamente
  async onMessage(message: Message): Promise<void> {
    const alreadyProcessed = await this.redis.get(`processed:${message.id}`);
    if (alreadyProcessed) {
      // Já foi processado, ignora
      return;
    }
    
    await this.process(message);
  }
}
```

### Padrão 3: Dead Letter Queues (DLQ)

Quando uma mensagem falha N vezes, move para fila especial.

```typescript
async enqueueWithRetry(
  queue: string,
  message: any,
  maxRetries: number = 3
): Promise<void> {
  const attemptCount = (message._attempts || 0) + 1;
  
  if (attemptCount > maxRetries) {
    // Excedeu retries, envia para DLQ
    await this.queue.enqueue(`${queue}-dlq`, {
      originalMessage: message,
      failureReason: 'Max retries exceeded',
      timestamp: new Date()
    });
    
    // Alerta ops
    await this.alerting.sendAlert({
      level: 'ERROR',
      message: `Message failed after ${maxRetries} retries`,
      queue,
      messageId: message.id
    });
    
    return;
  }
  
  // Retry com backoff exponencial
  const delaySeconds = Math.pow(2, attemptCount - 1); // 1, 2, 4, 8...
  await this.queue.enqueue(queue, {
    ...message,
    _attempts: attemptCount
  }, { delaySeconds });
}

// Monitorar DLQ
queue.subscribe('grade-exercise-dlq', async (message) => {
  console.error('Dead letter:', message);
  // Investigar, corrigir, re-enfileirar manualmente
});
```

---

## SEÇÃO 3: IDEMPOTÊNCIA (10 minutos)

### O Problema

Worker processa mensagem. Falha ao persistir no banco, mas consegue reconhecer que persistiu. Fila tenta novamente. Agora você persiste 2x.

```typescript
// ❌ NÃO IDEMPOTENTE
async processFeedback(message: Message): Promise<void> {
  const feedback = await ai.generate(message.exerciseId);
  
  // Se falha aqui, mensagem reentra na fila
  // Próxima tentativa vai gerar feedback NOVAMENTE
  // Resultado: 2 respostas para 1 exercício
  await db.insertFeedback(feedback);
}

// ✅ IDEMPOTENTE
async processFeedback(message: Message): Promise<void> {
  // Gera ID determinístico baseado em input
  const feedbackId = crypto.createHash('sha256')
    .update(`${message.exerciseId}:${message.responseId}`)
    .digest('hex');
  
  // Tenta inserir, com feedbackId único
  try {
    await db.insertFeedback({
      id: feedbackId,
      responseId: message.responseId,
      feedback: await ai.generate(message.exerciseId)
    });
  } catch (error) {
    if (error.code === 'UNIQUE_VIOLATION') {
      // Já foi inserido em tentativa anterior, ignora
      console.log('Feedback já existe, ignorando');
      return;
    }
    throw error;
  }
}
```

**Regra de Ouro:** Processe 2x = resultado igual a processar 1x

---

## SEÇÃO 4: IMPLEMENTAÇÃO COMPLETA (12 minutos)

```typescript
// Arquivo: services/exercise-processor.ts
import Bull from 'bull';

const gradeQueue = new Bull('grade-exercise', {
  redis: { host: 'localhost', port: 6379 },
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 1000 },
    removeOnComplete: true
  }
});

// API endpoint
app.post('/api/exercise/submit', async (req, res) => {
  const { userId, exerciseId, answer } = req.body;
  
  // 1. Validar
  if (!answer) throw new ValidationError('Answer required');
  
  // 2. Persistir resposta (rápido)
  const response = await db.responses.create({
    userId,
    exerciseId,
    answer,
    submittedAt: new Date()
  });
  
  // 3. Enfileira processamento (não bloqueia)
  await gradeQueue.add({
    responseId: response.id,
    userId,
    exerciseId,
    answer
  }, { jobId: `grade:${response.id}` });
  
  // 4. Retorna imediatamente
  return res.json({
    responseId: response.id,
    status: 'submitted',
    feedbackUrl: `/api/feedback/${response.id}`
  });
});

// Worker: processa de forma assíncrona
gradeQueue.process(async (job) => {
  const { responseId, exerciseId, answer } = job.data;
  
  try {
    // Gera feedback com IA
    const feedback = await aiTutor.explainError(exerciseId, answer);
    
    // Salva feedback
    await db.feedback.create({
      responseId,
      feedback,
      generatedAt: new Date()
    });
    
    // Notifica cliente em real-time
    await pubsub.publish(`response:${responseId}`, {
      type: 'feedback-ready',
      feedback
    });
    
    console.log(`✅ Graded ${responseId}`);
    
  } catch (error) {
    console.error(`❌ Failed to grade ${responseId}:`, error);
    
    if (job.attemptsMade >= job.opts.attempts) {
      // Excedeu tentativas
      await db.feedback.create({
        responseId,
        feedback: { error: 'Feedback generation failed', fallback: true },
        generatedAt: new Date()
      });
      
      // Registra no DLQ
      await dlqQueue.add({
        originalJobId: job.id,
        error: error.message
      });
    }
    
    throw error; // Bull vai retentar
  }
});

// Monitorar DLQ
app.get('/api/admin/dlq', async (req, res) => {
  const failed = await dlqQueue.getJobs(['failed']);
  return res.json(failed);
});
```

---

## SEÇÃO 5: MÚLTIPLAS FILAS E PRIORIDADES (8 minutos)

```typescript
// Filas com diferentes prioridades
const criticalQueue = new Bull('critical', redisConfig);
const normalQueue = new Bull('normal', redisConfig);
const backgroundQueue = new Bull('background', redisConfig);

// Exemplos de jobs em cada fila
if (isUserPayment) {
  // Crítico: processar pagamento
  await criticalQueue.add(jobData, { priority: 1 });
} else if (isGradingExercise) {
  // Normal: gerar feedback
  await normalQueue.add(jobData, { priority: 10 });
} else if (isAggregatingAnalytics) {
  // Background: analytics
  await backgroundQueue.add(jobData, { priority: 100 });
}

// Workers para cada fila
criticalQueue.process(1, async (job) => { /* process */ }); // 1 worker
normalQueue.process(4, async (job) => { /* process */ }); // 4 workers
backgroundQueue.process(2, async (job) => { /* process */ }); // 2 workers
```

---

## Resumo

Message queues transformam operações síncronas lentas em respostas rápidas com processamento em background. Mas trazem complexidade: idempotência, dead letter queues, retry policies.

Padrão: "Fast at the happy path, slow for background tasks."

Na próxima lição, veremos como distribuir **assets e conteúdo** globalmente usando **CDN**, mantendo cache inteligente.

---

### Pontos-Chave

1. **Async = UX melhor** — resposta rápida, processamento lento em background
2. **At-least-once vs exactly-once** — escolher baseado em risco de duplicação
3. **Idempotência é obrigatória** — se processa 2x, resultado = processar 1x
4. **Dead letter queues salvam** — quando falha, não perde mensagem
5. **Prioridades importam** — crítico vs normal vs background
