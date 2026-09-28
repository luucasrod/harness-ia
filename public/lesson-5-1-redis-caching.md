# LIÇÃO 5.1: Redis & Caching - Padrões e Estratégias

## SEÇÃO 1: INTRODUÇÃO (6 minutos)

### O Problema Real

Sua plataforma educacional está crescendo. No início, 100 alunos simultâneos consultando progresso funcionava perfeitamente. Hoje, 10 mil alunos. O banco de dados está respondendo, mas o tempo médio de requisição subiu de 50ms para 800ms. Você adicionou mais servidores, mas o gargalo é o banco. A observabilidade mostra: 85% das requisições são leitura de dados que **não mudam com frequência**.

Um aluno não muda seu progresso a cada segundo. Uma lição não muda seu conteúdo a cada hora. Mas você faz uma query pesada ao banco para cada requisição, mesmo que a resposta fosse idêntica 100 vezes.

Isso não é ineficiência de code. É falta de **camada de cache**. Um cache bem estruturado reduz carga do banco em 10-100x. Mal estruturado, causa corrupção de dados e bugs silenciosos.

### Por Que Caching É Arquitetura, Não Otimização

Caching não é um detalhe de performance. É uma decisão arquitetural:

- **Consistência vs Latência:** Você quer respostas rápidas ou dados sempre corretos? A maioria dos casos é um trade-off.
- **Falhas:** Quando o cache falha, o sistema degrada ou quebra completamente?
- **Escala:** Você consegue servir 100x mais usuários com a mesma infraestrutura usando cache?

Redis é a ferramenta mais comum porque não é só um cache — é um **data structure store** que permite padrões sofisticados. Mas você precisa entender **quando** cachear, **quanto tempo** manter, **como** invalidar.

### Objetivo da Lição

Nesta aula, você vai entender:

- Decisões arquiteturais por trás do caching.
- Padrões principais: cache-aside, write-through, write-behind.
- TTL, invalidação e cache stampede.
- Redis como ferramenta e seus padrões específicos.
- Como cache se integra em um sistema escalável.

Caching bem feito é invisível. Você percebe quando está quebrado.

---

## SEÇÃO 2: QUANDO E O QUÊ CACHEAR (12 minutos)

### A Equação do Cache

Nem tudo deve ser cacheado. A decisão depende de:

```
Benefício = Custo Computacional × Frequência de Acesso
Custo = Complexidade de Implementação + Risco de Inconsistência
Cache é vantajoso quando: Benefício >> Custo
```

#### Candidatos Ideais para Cache

1. **Dados que mudam pouco, são lidos muito:**
   - Conteúdo de aulas (lido 1000x/dia, muda 1x/mês)
   - Configurações (lido 100x/dia, muda raramente)
   - Dados de referência (lidos sempre, nunca mudam)

2. **Computações caras:**
   - Cálculo de progresso (múltiplas queries, lógica complexa)
   - Agregações (soma, contagem de muitos registros)
   - Processamento de IA (respostas de tutor, análise de resposta)

3. **Padrões de acesso previsíveis:**
   - "Top 10 alunos de hoje"
   - "Lições mais acessadas"
   - "Erros mais comuns por tópico"

#### Péssimos Candidatos para Cache

- **Dados críticos que devem estar sempre certos:** Saldo bancário, resultado de prova final
- **Dados que mudam constantemente:** Posição em tempo real de usuário online
- **Muito espaço:** Histórico completo de todas as interações de um usuário
- **Dados que precisam ser auditados:** Cada acesso deve ser registrado

### Exemplo Real 1: O Que Cachear em uma Plataforma Educacional

```typescript
// ✅ BOM CACHE: Conteúdo de aula
class LessonContentService {
  async getLesson(lessonId: string): Promise<Lesson> {
    // 1. Tenta cache (Redis em memória, ~1ms)
    const cached = await this.cache.get(`lesson:${lessonId}`);
    if (cached) return JSON.parse(cached);
    
    // 2. Cache miss → vai ao banco (~200ms)
    const lesson = await this.db.lessons.findById(lessonId);
    
    // 3. Armazena por 1 hora (muda raramente)
    await this.cache.set(`lesson:${lessonId}`, JSON.stringify(lesson), 3600);
    
    return lesson;
  }
}

// ⚠️ EVITAR: Dados em tempo real
class UserStatusService {
  // ❌ ERRADO: Cachear por quanto tempo?
  // User online → offline mudou agora, mas cache pode ter 5min de atraso
  async isUserOnline(userId: string): Promise<boolean> {
    const cached = await this.cache.get(`user:online:${userId}`);
    if (cached !== null) return cached === 'true';
    // ... banco de dados
  }
  
  // ✅ MELHOR: Redis como banco de dados principal para estado efêmero
  async markUserOnline(userId: string): Promise<void> {
    // Redis é o "source of truth" aqui, não cache
    await this.redis.setex(`user:online:${userId}`, 300, 'true'); // 5min TTL
  }
}

// ⚠️ CRÍTICO: Dados que afetam dinheiro
class PaymentService {
  async getUserBalance(userId: string): Promise<number> {
    // ❌ NUNCA cache para saldo real
    // Cache aqui = risco de duplicação de pagamento
    return await this.db.getUserBalance(userId);
  }
  
  // ✅ CACHE OK: Valor histórico para dashboard
  async getUserBalanceHistory(userId: string): Promise<Balance[]> {
    const key = `user:balance-history:${userId}`;
    const cached = await this.cache.get(key);
    if (cached) return JSON.parse(cached);
    
    const history = await this.db.getBalanceHistory(userId);
    await this.cache.set(key, JSON.stringify(history), 3600);
    return history;
  }
}
```

### Trade-offs de Caching: A Matriz de Decisão

| Tipo de Dado | Frequência | Mudança | Cache? | Padrão |
|---|---|---|---|---|
| Conteúdo de aula | 1000x/dia | 1x/mês | ✅ Sim | Cache-aside (1h) |
| Progresso de aluno | 100x/dia | 1x/hora | ⚠️ Talvez | Cache-aside (5min) + evento invalidação |
| Resultado de prova | 10x/dia | Nunca | ✅ Sim | Cache-aside (forever) |
| Posição de usuário | 10x/sec | 10x/sec | ❌ Não | Redis primary store |
| Saldo de crédito | 50x/dia | 50x/dia | ❌ Não | Sempre banco |
| Config de plataforma | 1000x/dia | 1x/semana | ✅ Sim | Cache-aside (1h) |

---

## SEÇÃO 3: PADRÕES DE CACHE (16 minutos)

### Padrão 1: Cache-Aside (Lazy Loading)

Cache é consultado **antes** do banco. Se não estiver lá, você busca, armazena e retorna.

```typescript
class CacheAsideService {
  async get<T>(key: string, loader: () => Promise<T>, ttlSeconds: number): Promise<T> {
    // 1. Tenta cache
    try {
      const cached = await this.redis.get(key);
      if (cached) {
        this.metrics.recordCacheHit();
        return JSON.parse(cached);
      }
    } catch (error) {
      this.logger.warn(`Cache read failed: ${error.message}`);
      // Não falha; segue para o banco
    }
    
    // 2. Cache miss → carrega dados
    this.metrics.recordCacheMiss();
    const data = await loader();
    
    // 3. Armazena (sem bloquear)
    this.redis.setex(key, ttlSeconds, JSON.stringify(data))
      .catch(error => this.logger.warn(`Cache write failed: ${error.message}`));
    
    return data;
  }
}

// Uso
const userProgress = await cacheService.get(
  `progress:${userId}:module:${moduleId}`,
  () => progressRepository.calculate(userId, moduleId),
  300 // 5 minutos
);
```

**Vantagens:**
- Simples de implementar
- Funciona mesmo se cache falha
- Evita invalidação complexa (TTL resolve)

**Desvantagens:**
- Cache stampede (todos fazem load no mesmo momento se expirar)
- Dados podem ficar desatualizados
- Warm-up lento na primeira requisição

### Padrão 2: Write-Through

Quando você escreve, atualiza cache **e depois** banco simultaneamente.

```typescript
class WriteThroughService {
  async updateLessonProgress(userId: string, lessonId: string, progress: number): Promise<void> {
    // 1. Valida
    if (progress < 0 || progress > 100) {
      throw new ValidationError('Progress must be 0-100');
    }
    
    // 2. Atualiza cache PRIMEIRO
    const key = `progress:${userId}:${lessonId}`;
    const data = { userId, lessonId, progress, updatedAt: new Date() };
    
    try {
      await this.redis.setex(key, 3600, JSON.stringify(data));
    } catch (error) {
      // Falha crítica: não pode continuar
      throw new CacheError(`Failed to write cache: ${error.message}`);
    }
    
    // 3. Depois persiste no banco
    try {
      await this.db.updateProgress(userId, lessonId, progress);
    } catch (error) {
      // ⚠️ Problema: cache tem dado certo, banco falhou
      // Solução: Rollback no cache
      await this.redis.del(key);
      throw error;
    }
  }
}
```

**Vantagens:**
- Cache sempre consistente com banco
- Garante escrita (falha visível imediatamente)

**Desvantagens:**
- Mais lento (escreve 2 lugares)
- Falha do cache = falha da escrita
- Rollback é complexo

### Padrão 3: Write-Behind (Write-Back)

Escreve no cache **primeiro**, depois persiste em background.

```typescript
class WriteBehindService {
  constructor(
    private cache: RedisClient,
    private db: Database,
    private queue: MessageQueue
  ) {}
  
  async updateUserProgress(userId: string, lessonId: string, progress: number): Promise<void> {
    // 1. Escreve no cache imediatamente (rápido)
    const key = `progress:${userId}:${lessonId}`;
    const data = { userId, lessonId, progress, updatedAt: new Date() };
    
    await this.cache.setex(key, 3600, JSON.stringify(data));
    this.metrics.recordWriteThrough();
    
    // 2. Enfileira persistência em background
    // Não bloqueia; retorna imediatamente ao usuário
    await this.queue.enqueue('persist-progress', {
      key,
      data,
      retries: 3,
      deadlineSeconds: 60
    });
  }
  
  // Worker em background
  async persistProgress(task: Task): Promise<void> {
    const { key, data } = task;
    
    try {
      // Tenta persistir no banco
      await this.db.updateProgress(data.userId, data.lessonId, data.progress);
      this.logger.info(`Persisted ${key}`);
    } catch (error) {
      // Falha → enfileira retry ou envia para dead-letter
      if (task.retries > 0) {
        await this.queue.enqueue('persist-progress', {
          ...task,
          retries: task.retries - 1
        });
      } else {
        await this.queue.enqueueDeadLetter(task, error);
      }
    }
  }
}
```

**Vantagens:**
- Extremamente rápido (escreve só no cache)
- Melhor UX (feedback imediato)
- Não bloqueia por falhas do banco

**Desvantagens:**
- Pode perder dados se Redis cair antes de persistir
- Complexidade: precisa de fila + worker
- Debugging é mais difícil

### Quando Usar Cada Padrão

| Padrão | Caso de Uso | Exemplo |
|---|---|---|
| **Cache-Aside** | Leitura pesada, escrita rara | Conteúdo de aula, configurações |
| **Write-Through** | Dados críticos, baixa taxa de escrita | Resultado de prova, autenticação |
| **Write-Behind** | Alta taxa de escrita, data loss aceitável | Eventos de interação, analytics |

---

## SEÇÃO 4: INVALIDAÇÃO E TTL (14 minutos)

### O Problema Fundamental da Invalidação

Cache cria um problema: agora você tem **duas** sources of truth. Como garantir que não divergem?

```typescript
// Cenário: Dois bancos diferentes para progresso
// Cache (Redis): {userId:1, progress: 95}
// Database (PostgreSQL): {userId:1, progress: 85}
// Qual é correto? 🤔
```

#### Estratégia 1: TTL (Time-To-Live)

Dados expiram automaticamente. Simples, mas permite inconsistência temporária.

```typescript
class LessonService {
  async getLesson(lessonId: string): Promise<Lesson> {
    return this.cache.getOrLoad(
      `lesson:${lessonId}`,
      () => this.db.findLesson(lessonId),
      3600 // 1 hora
    );
  }
}

// Garantia: Máximo 1 hora de atraso
// Risco: Se aula mudar, alunos veem versão antiga por até 1h
```

**Quando usar TTL:**
- Dados que mudam lentamente
- Inconsistência temporária é aceitável
- Quer simplicidade

#### Estratégia 2: Event-Based Invalidation

Quando dados mudam, você **invalida** o cache manualmente.

```typescript
class LessonService {
  async updateLessonContent(lessonId: string, content: string): Promise<void> {
    // 1. Persiste
    await this.db.updateLesson(lessonId, content);
    
    // 2. Invalida cache imediatamente
    const key = `lesson:${lessonId}`;
    await this.cache.delete(key);
    this.logger.info(`Invalidated cache for lesson ${lessonId}`);
    
    // 3. Publica evento para outros serviços
    await this.eventBus.publish('lesson.updated', {
      lessonId,
      updatedAt: new Date()
    });
  }
  
  // Subscribers podem reagir
  @Subscribe('lesson.updated')
  async onLessonUpdated(event: LessonUpdatedEvent): Promise<void> {
    // Invalida cache em outro serviço também
    await this.cache.delete(`lesson:${event.lessonId}`);
  }
}
```

**Quando usar invalidação por evento:**
- Mudanças críticas precisam ser visíveis imediatamente
- Você controla quando dados mudam
- Sistema tem comunicação entre serviços

#### Estratégia 3: Soft Invalidation (Lazy Expiration)

Marque como "vencido" mas continue servindo enquanto recarrega em background.

```typescript
class SmartCacheService {
  async getWithStaleReload<T>(
    key: string,
    loader: () => Promise<T>,
    freshTtl: number = 300,
    staleTtl: number = 3600
  ): Promise<T> {
    const cached = await this.cache.get(key);
    const metadata = await this.cache.get(`${key}:meta`);
    
    if (cached && metadata) {
      const age = Date.now() - JSON.parse(metadata).createdAt;
      
      if (age < freshTtl) {
        // ✅ Fresco: retorna do cache
        return JSON.parse(cached);
      } else if (age < staleTtl) {
        // ⚠️ Vencido mas ainda aceitável
        // Retorna valor velho imediatamente, recarrega em background
        this.reloadInBackground(key, loader, staleTtl);
        return JSON.parse(cached);
      }
    }
    
    // ❌ Completamente expirado: carrega de forma síncrona
    const fresh = await loader();
    await this.cache.setex(key, staleTtl, JSON.stringify(fresh));
    return fresh;
  }
  
  private async reloadInBackground<T>(
    key: string,
    loader: () => Promise<T>,
    ttl: number
  ): Promise<void> {
    // Não bloqueia; faz em background
    loader()
      .then(data => this.cache.setex(key, ttl, JSON.stringify(data)))
      .catch(error => this.logger.warn(`Background reload failed for ${key}`));
  }
}

// Uso
const lesson = await smartCache.getWithStaleReload(
  `lesson:${lessonId}`,
  () => db.findLesson(lessonId),
  300,  // Fresco por 5 minutos
  3600  // Aceita até 1 hora
);
```

---

## SEÇÃO 5: CACHE STAMPEDE E ESCALABILIDADE (12 minutos)

### O Problema: Cache Stampede (Thundering Herd)

Quando um cache expira em high traffic:

```
1:00:00 → Cache expira para lesson:123
1:00:01 → 1000 requisições simultâneas chegam
1:00:02 → Todas fazem SELECT * FROM lessons WHERE id=123
         (Banco leva 1 segundo com 1000 queries paralelas)
1:00:03 → Timeout! Requisições falham
```

#### Solução 1: Probabilistic Early Expiration

Antes do TTL acabar, recarrega com probabilidade crescente.

```typescript
class ResilienceCacheService {
  private readonly BETA = 1; // Ajustar empiricamente
  
  async getWithEarlyReload<T>(
    key: string,
    loader: () => Promise<T>,
    ttl: number
  ): Promise<T> {
    const result = await this.cache.get(key);
    
    if (!result) {
      return this.load(key, loader, ttl);
    }
    
    const metadata = JSON.parse(result).meta;
    const age = Date.now() - metadata.createdAt;
    const delta = Date.now() - metadata.loadTime;
    
    // Probabilidade de recarregar aumenta com a idade
    const expiration = Math.exp(
      (age - ttl) / (this.BETA * (Math.log(Math.random()) * delta))
    );
    
    if (Math.random() < expiration) {
      // Recarrega em background, não bloqueia
      this.load(key, loader, ttl).catch(e => this.logger.warn(e));
    }
    
    return JSON.parse(result).data;
  }
  
  private async load<T>(key: string, loader: () => Promise<T>, ttl: number): Promise<T> {
    const data = await loader();
    await this.cache.setex(key, ttl, JSON.stringify({
      data,
      meta: { createdAt: Date.now(), loadTime: Date.now() }
    }));
    return data;
  }
}
```

#### Solução 2: Probabilistic Locking

Apenas uma requisição recarrega; outras esperam.

```typescript
class LockedCacheService {
  async getWithLock<T>(
    key: string,
    loader: () => Promise<T>,
    ttl: number
  ): Promise<T> {
    const cached = await this.cache.get(key);
    if (cached) return JSON.parse(cached);
    
    // Tenta adquirir lock
    const lockKey = `${key}:lock`;
    const lockId = crypto.randomUUID();
    
    const acquired = await this.cache.set(
      lockKey,
      lockId,
      { nx: true, ex: 10 } // 10 segundo max
    );
    
    if (acquired) {
      try {
        // Este thread recarrega
        const data = await loader();
        await this.cache.setex(key, ttl, JSON.stringify(data));
        return data;
      } finally {
        // Libera lock
        await this.cache.del(lockKey);
      }
    } else {
      // Outro thread está recarregando; espera
      let retries = 0;
      while (retries < 50) {
        await this.sleep(100);
        const fresh = await this.cache.get(key);
        if (fresh) return JSON.parse(fresh);
        retries++;
      }
      
      // Timeout esperando; carrega mesmo assim (fallback)
      return await loader();
    }
  }
  
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

### Escala Horizontal: Distribuindo Cache

```typescript
// ❌ PROBLEMA: Cache local (cada servidor tem sua própria memória)
class LocalCacheService {
  private cache = new Map<string, any>();
  
  get(key: string) {
    return this.cache.get(key);
  }
}

// Servidor 1 cache: { lesson:1 → versão A }
// Servidor 2 cache: { lesson:1 → versão B }
// Inconsistência!

// ✅ SOLUÇÃO: Cache distribuído (Redis central)
class DistributedCacheService {
  constructor(private redis: RedisCluster) {}
  
  async get(key: string): Promise<any> {
    // Todos os servidores consultam o mesmo Redis
    return this.redis.get(key);
  }
}

// 100 servidores → 1 Redis cluster
// Consistência garantida
```

---

## SEÇÃO 6: IMPLEMENTAÇÃO COMPLETA - TUTOR DE IA COM CACHE (10 minutos)

```typescript
// Arquivo: services/ai-tutor-with-cache.ts
import Redis from 'ioredis';

interface AiExplanation {
  questionId: string;
  explanation: string;
  examples: string[];
  generatedAt: Date;
}

class AiTutorCachedService {
  private redis: Redis;
  private readonly EXPLANATION_TTL = 7 * 24 * 3600; // 7 dias (não muda)
  private readonly QUOTA_CHECK_TTL = 3600; // 1 hora
  
  async explainError(
    questionId: string,
    studentError: string
  ): Promise<AiExplanation> {
    // 1. Cache-aside pattern
    const cacheKey = `explanation:${questionId}`;
    const cached = await this.getCached(cacheKey);
    if (cached) return cached;
    
    // 2. Verificar quota (write-through)
    const quotaKey = `quota:${new Date().toISOString().slice(0, 10)}`;
    const todayUsed = await this.redis.get(quotaKey) || '0';
    
    if (parseInt(todayUsed) >= 10000) {
      return {
        questionId,
        explanation: 'Limite diário atingido',
        examples: [],
        generatedAt: new Date()
      };
    }
    
    // 3. Chamar IA (operação cara)
    const explanation = await this.generateWithAi(questionId, studentError);
    
    // 4. Persistir em background (write-behind)
    this.persistExplanationAsync(questionId, explanation);
    
    // 5. Atualizar cache e quota
    await Promise.all([
      this.redis.setex(cacheKey, this.EXPLANATION_TTL, JSON.stringify(explanation)),
      this.redis.incr(quotaKey),
      this.redis.expire(quotaKey, this.QUOTA_CHECK_TTL)
    ]);
    
    return explanation;
  }
  
  private async getCached(key: string): Promise<AiExplanation | null> {
    try {
      const cached = await this.redis.get(key);
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  }
  
  private async generateWithAi(questionId: string, error: string): Promise<AiExplanation> {
    // Chamada ao OpenAI/Claude
    return {
      questionId,
      explanation: '...',
      examples: [],
      generatedAt: new Date()
    };
  }
  
  private async persistExplanationAsync(
    questionId: string,
    explanation: AiExplanation
  ): Promise<void> {
    // Enfileira para persistir depois
    await this.queue.enqueue('persist-explanation', {
      questionId,
      explanation
    });
  }
}
```

---

## Resumo e Próximas Lições

Caching é a diferença entre um sistema que aguenta 100 requisições/segundo e um que aguenta 10.000. Mas com poder vem complexidade. A regra de ouro:

**Comece simples (Cache-Aside + TTL). Adicione complexidade apenas quando métricas mostram que precisa.**

Na próxima lição, veremos como coordenar múltiplos servidores em **tempo real** usando **WebSockets**, mantendo consistência e performance.

---

### Pontos-Chave

1. **Não todo dado deve ser cacheado** — decida baseado em frequência de leitura vs. mudança
2. **Padrões existem** — Cache-Aside, Write-Through, Write-Behind resolvem casos específicos
3. **TTL vs. Invalidação** — escolha baseado em quanto pode estar desatualizado
4. **Cache Stampede é real** — use probabilistic early expiration ou locking
5. **Distribuído é necessário** — cache local não funciona em escala
