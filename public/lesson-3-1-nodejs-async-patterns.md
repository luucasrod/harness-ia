# LIÇÃO 3.1: Node.js Async Patterns & Event Loop - Entendendo o Coração do Node

## SEÇÃO 1: INTRODUÇÃO (5 minutos)

### O Problema Real

Você escreve uma API Node.js que processa requisições de estudantes resolvendo exercícios. Cada requisição precisa validar a resposta, executar testes, atualizar o progresso no banco, enviar um webhook para analytics e registrar tudo em logs. No início, tudo funciona rápido. Depois, conforme cresce para 10 mil usuários simultâneos, a API começa a ficar lenta. Desenvolvedores adicionam mais workers. Ainda lento. Adiciona cache. Ainda lento. 

O problema não é falta de poder computacional. É que o código está usando callbacks no final dos anos 2010, misturando bloqueio com async, e desenvolvedores não entendem realmente como o event loop funciona. A maioria apenas "sabe que async/await é melhor que callbacks", mas não sabe por quê.

### Por Que Esse Entendimento Importa

Node.js é single-threaded. Diferente do Python Django ou Java Spring, que abrem threads para cada requisição, Node.js serve todas as requisições numa única thread. Isso é sua força e sua fraqueza. Se você entender como o event loop funciona, consegue escrever APIs que lidam com milhões de requisições. Se não entender, escreve código que trava a thread inteira com operações bloqueantes.

Esse não é conhecimento teórico. É a diferença entre uma API que degrada gracefully e uma que cai sob carga. É a diferença entre 100 requisições por segundo e 10 mil.

### Objetivo da Lição

Nesta aula, você vai entender:

- Como funciona o event loop do Node.js (não teórico, prático).
- A diferença entre blocking, non-blocking, callbacks, Promises e async/await.
- Padrões perigosos que travam a thread.
- Padrões corretos para máximo throughput.
- Como aplicar isso em APIs de produção.

---

## SEÇÃO 2: O EVENT LOOP - COMO NODE.JS REALMENTE FUNCIONA (20 minutos)

### A Mentira que Todos Acreditam

"Node.js é assincrono" é uma meia verdade. Na realidade, **o JavaScript em si é síncrono**. Node.js não é assincrono. O que Node.js fornece é um **ambiente que permite não-bloqueante**, através de callbacks e do event loop.

Então como funciona? Node.js roda um loop infinito chamado **event loop**. Este loop:

1. Verifica se há eventos (requisições HTTP, I/O completo, timers, etc.).
2. Executa callbacks para eventos prontos.
3. Volta ao início.

```javascript
// Simplificação MUITO básica do event loop
while (eventLoop.waitForTask()) {
  const nextTask = eventLoop.nextTask();
  nextTask.execute();
  
  if (eventLoop.nextTick()) {
    eventLoop.processNextTick();
  }
}
```

Tudo isso acontece em **uma única thread**. Não há paralelismo. Não há threads do Linux paralelizando seu código. Há apenas um loop processando tarefas sequencialmente.

### As Fases do Event Loop

Node.js não processa tudo igualmente. Há uma ordem específica (chamada event loop phases):

1. **timers**: Executa callbacks de `setTimeout` e `setInterval`.
2. **pending callbacks**: Executa callbacks de I/O atrasados.
3. **idle, prepare**: Apenas para uso interno.
4. **poll**: Aguarda por novos eventos I/O.
5. **check**: Executa callbacks de `setImmediate`.
6. **close callbacks**: Fecha conexões e executa callbacks de `on('close')`.

Isso importa porque você pode otimizar onde coloca seu código.

### Exemplo Visual: Entendendo a Sequência

```typescript
// Arquivo: examples/event-loop-phases.ts

console.log('COMEÇO');

setTimeout(() => {
  console.log('setTimeout (timers phase)');
}, 0);

setImmediate(() => {
  console.log('setImmediate (check phase)');
});

Promise.resolve()
  .then(() => {
    console.log('Promise microtask');
  });

process.nextTick(() => {
  console.log('nextTick microtask');
});

console.log('FIM');

/* Output:
COMEÇO
FIM
nextTick microtask
Promise microtask
setTimeout (timers phase)
setImmediate (check phase)
*/
```

**Por que essa ordem?**

- `console.log` é síncrono, roda primeiro.
- `process.nextTick` e Promises são **microtasks**, rodadas ao final de cada fase.
- `setTimeout` é uma macrotask, roda na próxima fase (timers).
- `setImmediate` é a fase check, que vem depois.

Isso é crítico em APIs. Se você não entender, pode colocar lógica importante no lugar errado e ela vai executar na ordem errada.

### Blocking vs Non-Blocking em Node.js

A diferença fundamental é simples:

**Blocking**: O código espera que uma operação termine antes de continuar.
**Non-blocking**: O código registra que quer ser notificado quando termina, e continua.

```typescript
// Arquivo: examples/blocking-vs-nonblocking.ts

import * as fs from 'fs';

// ❌ BLOCKING - Trava a thread
console.time('blocking');
const data = fs.readFileSync('/arquivo-grande.txt', 'utf-8');
console.log(`Leu ${data.length} caracteres`);
console.timeEnd('blocking');

// ✅ NON-BLOCKING - Não trava
console.time('nonblocking');
fs.readFile('/arquivo-grande.txt', 'utf-8', (err, data) => {
  if (err) throw err;
  console.log(`Leu ${data.length} caracteres`);
  console.timeEnd('nonblocking');
});
console.log('Registrou callback, continuou');
```

Se você usar `readFileSync` em uma API:

```typescript
// ❌ PÉSSIMO EM PRODUÇÃO
app.get('/api/lesson/:id', (req, res) => {
  const content = fs.readFileSync(`./lessons/${req.params.id}.md`);
  res.send(content);
});
```

Cada requisição trava a thread por ~100ms (leitura de disco). Com 1000 requisições simultâneas, sua API serve 10 requisições por segundo.

```typescript
// ✅ MELHOR
app.get('/api/lesson/:id', (req, res) => {
  fs.readFile(`./lessons/${req.params.id}.md`, (err, content) => {
    if (err) return res.status(500).send(err);
    res.send(content);
  });
});
```

Agora 1000 requisições são todas registradas no OS, e você serve ~500 requisições por segundo (limitado por I/O de disco).

---

## SEÇÃO 3: CALLBACKS, PROMISES, ASYNC/AWAIT (25 minutos)

### Callbacks: O Começo (e o Problema)

Callbacks foi a primeira forma de lidar com operações não-bloqueantes:

```typescript
// Arquivo: examples/callback-pattern.ts

function handleStudentAnswer(
  studentId: string,
  exerciseId: string,
  answer: string,
  callback: (err: Error | null, result?: any) => void
) {
  // 1. Valida a resposta
  if (!answer || answer.length === 0) {
    return callback(new Error('Resposta vazia'));
  }

  // 2. Busca o exercício no banco
  db.query(
    `SELECT * FROM exercises WHERE id = $1`,
    [exerciseId],
    (err, result) => {
      if (err) return callback(err);
      const exercise = result.rows[0];

      // 3. Executa testes
      runTests(answer, exercise.testCases, (err, testResult) => {
        if (err) return callback(err);

        // 4. Atualiza progresso
        db.query(
          `UPDATE student_progress SET answers = array_append(answers, $1)
           WHERE student_id = $2`,
          [answer, studentId],
          (err) => {
            if (err) return callback(err);

            // 5. Envia webhook
            fetch('/api/analytics/track', {
              method: 'POST',
              body: JSON.stringify({
                event: 'exercise_submitted',
                studentId,
                passed: testResult.passed
              })
            }).then(() => {
              callback(null, testResult);
            }).catch((err) => {
              callback(err);
            });
          }
        );
      });
    }
  );
}

// Uso
handleStudentAnswer('s1', 'ex1', 'console.log("hello")', (err, result) => {
  if (err) {
    console.error('Erro:', err);
  } else {
    console.log('Resultado:', result);
  }
});
```

**Problemas:**

- **Callback Hell**: Cada operação async gera uma função que precisa de callback, e se há muitas, o código fica horizontal e ilegível.
- **Erro Handling Ruim**: É fácil esquecer de tratar erros, e quando trata, fica repetitivo.
- **Sem Forma de Sequenciar**: Se precisa fazer operação A, depois B, depois C, o código fica complicado.

### Promises: Estrutura Melhor

Promises encapsulam uma operação que pode suceder ou falhar:

```typescript
// Arquivo: examples/promise-pattern.ts

function handleStudentAnswer(
  studentId: string,
  exerciseId: string,
  answer: string
): Promise<TestResult> {
  return (
    // 1. Valida
    Promise.resolve()
      .then(() => {
        if (!answer || answer.length === 0) {
          throw new Error('Resposta vazia');
        }
      })
      // 2. Busca exercício
      .then(() => db.query(`SELECT * FROM exercises WHERE id = $1`, [exerciseId]))
      .then((result) => result.rows[0])
      // 3. Executa testes
      .then((exercise) => runTests(answer, exercise.testCases))
      // 4. Atualiza progresso
      .then((testResult) =>
        db.query(
          `UPDATE student_progress SET answers = array_append(answers, $1)
           WHERE student_id = $2`,
          [answer, studentId]
        ).then(() => testResult)
      )
      // 5. Envia webhook
      .then((testResult) =>
        fetch('/api/analytics/track', {
          method: 'POST',
          body: JSON.stringify({
            event: 'exercise_submitted',
            studentId,
            passed: testResult.passed
          })
        }).then(() => testResult)
      )
  );
}

// Uso
handleStudentAnswer('s1', 'ex1', 'console.log("hello")')
  .then((result) => console.log('Resultado:', result))
  .catch((err) => console.error('Erro:', err));
```

Melhor que callbacks, mas ainda sente-se como código "em cascata". Há muito `.then()`.

### Async/Await: Código Como Se Fosse Síncrono

Async/await permite escrever código assincrono que parece síncrono:

```typescript
// Arquivo: examples/async-await-pattern.ts

async function handleStudentAnswer(
  studentId: string,
  exerciseId: string,
  answer: string
): Promise<TestResult> {
  // 1. Valida
  if (!answer || answer.length === 0) {
    throw new Error('Resposta vazia');
  }

  // 2. Busca exercício
  const result = await db.query(
    `SELECT * FROM exercises WHERE id = $1`,
    [exerciseId]
  );
  const exercise = result.rows[0];

  // 3. Executa testes
  const testResult = await runTests(answer, exercise.testCases);

  // 4. Atualiza progresso
  await db.query(
    `UPDATE student_progress SET answers = array_append(answers, $1)
     WHERE student_id = $2`,
    [answer, studentId]
  );

  // 5. Envia webhook
  await fetch('/api/analytics/track', {
    method: 'POST',
    body: JSON.stringify({
      event: 'exercise_submitted',
      studentId,
      passed: testResult.passed
    })
  });

  return testResult;
}

// Uso
try {
  const result = await handleStudentAnswer('s1', 'ex1', 'console.log("hello")');
  console.log('Resultado:', result);
} catch (err) {
  console.error('Erro:', err);
}
```

**Por que é melhor:**

- ✅ Legível: Parece código síncrono, fácil de seguir.
- ✅ Erro handling: `try/catch` funciona como esperado.
- ✅ Sequencial: Operações rodam na ordem que aparecem.
- ✅ Menos boilerplate: Sem `.then()` repetido.

### O Segredo: Async/Await é Apenas Syntax Sugar

Importante: `async/await` **não é mais rápido** que Promises. É apenas mais legível. Embaixo, é Promises:

```typescript
// Essas duas funções fazem EXATAMENTE o mesmo
async function withAsync() {
  const result = await fetch('/api/data');
  return result.json();
}

// É equivalente a:
function withPromise() {
  return fetch('/api/data').then((result) => result.json());
}
```

---

## SEÇÃO 4: PADRÕES DE PRODUÇÃO E ARMADILHAS (20 minutos)

### Armadilha 1: Await Sequencial Quando Poderia Ser Paralelo

```typescript
// ❌ LENTO - Operações sequenciais
async function getStudentData(studentId: string) {
  const profile = await fetchProfile(studentId); // ~100ms
  const progress = await fetchProgress(studentId); // ~100ms
  const certificates = await fetchCertificates(studentId); // ~100ms
  
  return { profile, progress, certificates };
  // Total: ~300ms
}

// ✅ RÁPIDO - Operações paralelas
async function getStudentDataFast(studentId: string) {
  const [profile, progress, certificates] = await Promise.all([
    fetchProfile(studentId),
    fetchProgress(studentId),
    fetchCertificates(studentId)
  ]);
  
  return { profile, progress, certificates };
  // Total: ~100ms (a operação mais lenta)
}
```

Se essas operações são independentes (não usam o resultado uma da outra), **sempre use Promise.all ou Promise.allSettled**.

### Armadilha 2: Não Lidar com Rejeições Não Capturadas

```typescript
// ❌ PERIGOSO - Promise rejeição fica sem handler
app.get('/api/lesson/:id', async (req, res) => {
  // Se fetchLesson() rejeita e não há catch, a requisição fica pendurada
  const lesson = await fetchLesson(req.params.id);
  res.json(lesson);
});

// ✅ SEGURO - Sempre captura
app.get('/api/lesson/:id', async (req, res) => {
  try {
    const lesson = await fetchLesson(req.params.id);
    res.json(lesson);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
```

Em produção, uma Promise não tratada faz o processo Node.js registrar um `UnhandledPromiseRejection`. Se não tiver um handler global, o processo pode ficar em estado ruim.

### Armadilha 3: Bloqueio na Thread Principal

```typescript
// ❌ BLOQUEIA - Crypto síncrono trava tudo
app.post('/api/login', async (req, res) => {
  const passwordHash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512');
  // Se há 1000 requisições simultâneas, cada uma trava por ~10ms
  // Total: ~10 segundos de latência
  
  res.json({ success: true });
});

// ✅ NÃO BLOQUEIA - Async worker ou thread pool
app.post('/api/login', async (req, res) => {
  const passwordHash = await crypto.pbkdf2(password, salt, 100000, 64, 'sha512');
  // Node.js delegua para thread pool (não trava)
  
  res.json({ success: true });
});
```

O módulo `crypto` tem versões sync e async. Sempre use async em APIs. Operações CPU-heavy (hash, compressão, parsing) devem ir para worker threads.

### Padrão Correto: Rate Limiting com Async

```typescript
// Arquivo: examples/rate-limiting-pattern.ts

import pLimit from 'p-limit';

// Limita a 5 operações simultâneas (como pool de workers)
const limit = pLimit(5);

async function processStudentAnswers(
  answers: Array<{ studentId: string; answer: string; exerciseId: string }>
): Promise<void> {
  const tasks = answers.map((item) =>
    limit(() => handleStudentAnswer(item.studentId, item.exerciseId, item.answer))
  );

  await Promise.all(tasks);
}

// Uso: 1000 respostas processos 5 de cada vez
processStudentAnswers(allAnswers);
```

Isso garante que você nunca tem mais de 5 requisições ao banco ao mesmo tempo, evitando gargalo.

---

## SEÇÃO 5: SÍNTESE E BOAS PRÁTICAS (10 minutos)

### Checklist para Seu Código Async

1. **Use async/await**, não callbacks (exceto quando legado exigir).
2. **Paralelize operações independentes** com `Promise.all`.
3. **Sempre capture erros** com try/catch.
4. **Não bloqueie a thread** (use async versions ou worker threads).
5. **Use rate limiting** se fizer muitas operações I/O.
6. **Entenda o event loop** (saber em qual phase seu código roda ajuda otimização).
7. **Perfil seu código** (veja se realmente está paralelo).

---

## QUIZ: 5 Perguntas para Consolidar

### Pergunta 1: Event Loop Phases

**O que acontece ANTES de `setImmediate` ser executado?**

A) `setTimeout` com delay 0  
B) `process.nextTick` e Promises (microtasks)  
C) Nada, setImmediate sempre executa primeiro  
D) Operações I/O do poll phase

**Resposta Correta:** B  
**Explicação:** Microtasks (nextTick, Promises) sempre executam antes de macrotasks (setImmediate, setTimeout). setImmediate é check phase, que vem depois de timers.

---

### Pergunta 2: Blocking vs Non-Blocking

**Por que `fs.readFileSync` é perigoso em uma API Node.js?**

A) Porque é mais lento.  
B) Porque trava a thread, bloqueando todas as outras requisições.  
C) Porque não funciona em produção.  
D) Porque consome mais memória.

**Resposta Correta:** B  
**Explicação:** Node.js é single-threaded. `readFileSync` trava a única thread, fazendo todas as requisições aguardarem.

---

### Pergunta 3: Promise.all vs Sequential Await

**Se você tem 3 operações async independentes, qual é mais rápida?**

```javascript
// Opção A
const a = await fetchA();
const b = await fetchB();
const c = await fetchC();

// Opção B
const [a, b, c] = await Promise.all([fetchA(), fetchB(), fetchC()]);
```

A) São igualmente rápidas.  
B) A Opção A (await sequencial) é mais rápida.  
C) A Opção B (Promise.all) é mais rápida.  
D) Depende da rede.

**Resposta Correta:** C  
**Explicação:** Promise.all inicia todas as 3 operações ao mesmo tempo. Await sequencial espera a primeira terminar para iniciar a segunda. Se cada uma leva 100ms, Promise.all = 100ms, sequential = 300ms.

---

### Pergunta 4: Unhandled Promise Rejection

**Qual é o risco de não ter um catch() em uma Promise em uma API?**

A) Nenhum, JavaScript ignora.  
B) A Promise fica eternamente pendente.  
C) O processo Node.js registra erro e pode ficar em estado ruim.  
D) A próxima requisição fica com erro.

**Resposta Correta:** C  
**Explicação:** Unhandled rejections são registradas e podem causar problemas ao longo do tempo se não tratadas.

---

### Pergunta 5: Crypto Síncrono vs Async

**Por que `crypto.pbkdf2Sync` é ruim em uma API com 1000 requisições simultâneas?**

A) Porque é menos seguro.  
B) Porque é mais lento.  
C) Porque trava a thread única de Node.js.  
D) Porque consome muita memória.

**Resposta Correta:** C  
**Explicação:** pbkdf2Sync leva ~10ms e trava a thread. Com 1000 requisições, tudo fica esperando essa operação CPU-heavy.

---

## EXERCÍCIO PRÁTICO: Refatore uma API Bloqueante

### Desafio

Você recebeu esse código que **funciona mas é lento**:

```typescript
// ❌ CÓDIGO LENTO
import express from 'express';
import * as fs from 'fs';
import crypto from 'crypto';
import fetch from 'node-fetch';

const app = express();

app.post('/api/submit-exercise', (req, res) => {
  // 1. Lê arquivo com testes de um disco (BLOQUEANTE!)
  const testFile = fs.readFileSync(`./exercises/${req.body.exerciseId}.test.txt`);
  
  // 2. Faz hash da resposta com Crypto síncrono (BLOQUEANTE!)
  const answerHash = crypto.pbkdf2Sync(
    req.body.answer,
    'salt',
    100000,
    64,
    'sha512'
  );
  
  // 3. Faz 3 chamadas HTTP sequencialmente (LENTO!)
  fetch(`/validate/${answerHash}`)
    .then((r) => r.json())
    .then((validation) => {
      fetch(`/track-event/${req.body.studentId}`)
        .then((r) => r.json())
        .then(() => {
          fetch(`/send-notification/${req.body.studentId}`)
            .then((r) => r.json())
            .then(() => {
              res.json({ success: true });
            });
        });
    });
});

app.listen(3000);
```

### Sua Missão

Refatore o código acima aplicando:

1. **Async/await em vez de callbacks**.
2. **Operações paralelas com Promise.all** onde possível.
3. **Non-blocking I/O** (fs.readFile em vez de readFileSync).
4. **Async crypto** (usar promises do módulo crypto).
5. **Tratamento de erro decente**.

### Gabarito

```typescript
// ✅ CÓDIGO RÁPIDO E SEGURO
import express from 'express';
import * as fs from 'fs/promises';
import crypto from 'crypto/promises';
import fetch from 'node-fetch';
import pLimit from 'p-limit';

const app = express();

// Limita a 5 operações HTTP simultâneas (evita sobrecarregar API)
const httpLimit = pLimit(5);

app.post('/api/submit-exercise', async (req, res) => {
  try {
    // Valida entrada
    if (!req.body.exerciseId || !req.body.answer || !req.body.studentId) {
      return res.status(400).json({ error: 'Missing fields' });
    }

    // 1. Lê arquivo de forma não-bloqueante
    const testFile = await fs.readFile(
      `./exercises/${req.body.exerciseId}.test.txt`,
      'utf-8'
    );

    // 2. Faz hash com async crypto
    const answerHash = await crypto.pbkdf2(
      req.body.answer,
      'salt',
      100000,
      64,
      'sha512'
    );

    // 3. Faz 3 chamadas HTTP em paralelo
    const [validation, , notification] = await Promise.all([
      httpLimit(() =>
        fetch(`/validate/${answerHash.toString('hex')}`).then((r) => r.json())
      ),
      httpLimit(() =>
        fetch(`/track-event/${req.body.studentId}`).then((r) => r.json())
      ),
      httpLimit(() =>
        fetch(`/send-notification/${req.body.studentId}`).then((r) =>
          r.json()
        )
      )
    ]);

    res.json({ success: true, validation });
  } catch (err) {
    console.error('Error processing exercise:', err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(3000);
```

### Pontos-Chave da Refatoração

- ✅ `fs/promises` em vez de readFileSync (não bloqueia).
- ✅ `crypto/promises` em vez de pbkdf2Sync (usa thread pool).
- ✅ `Promise.all` para executar 3 fetches em paralelo.
- ✅ `pLimit` para nunca ter mais de 5 HTTP requests simultâneos.
- ✅ `try/catch` para erro handling.
- ✅ Validação de entrada antes de processar.

**Performance esperada:**

- ❌ Código original: ~30ms (read) + 10ms (hash) + 100ms (3 fetches sequenciais) = ~140ms
- ✅ Código refatorado: max(30ms, 10ms, 100ms paralelo) = ~100ms

**Com 1000 requisições simultâneas:**

- ❌ Original: Trava a thread, pode levar minutos.
- ✅ Refatorado: Processa em ~1 segundo (1000 * 100ms / concorrência).

---

**Dica:** Use `console.time()` e `console.timeEnd()` para medir antes/depois!

