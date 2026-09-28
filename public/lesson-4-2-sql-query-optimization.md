# LIÇÃO 4.2: SQL Query Optimization

## SEÇÃO 1: INTRODUÇÃO (5 minutos)

### O Problema Real

Uma lição que parecia rápida começa a ficar lenta conforme mais alunos usam a plataforma. O tutor de IA que respondia em 2 segundos agora leva 30. Você investiga, acha uma query que roda em 2 milissegundos... mas é executada 1000 vezes por request. Ou pior: uma query está fazendo table scan completo que demora 10 segundos.

Otimização de SQL é diferente de otimização genérica. Não é sobre algoritmos mais inteligentes — é sobre entender como o banco *realmente* executa sua query, usar índices corretamente, e evitar padrões que disfarçam queries ruins.

### Por Que Importa

80% do tempo de resposta de uma aplicação está no banco de dados. Otimizar algoritmos Python 10% economiza 1% do tempo total. Otimizar uma query 10x economiza 8% do tempo total. Retorno de investimento é massivo — meia hora otimizando query rápida pode economizar segundos de latência por usuario diariamente.

### O que Você Vai Aprender

- EXPLAIN PLAN: como ler o que banco *realmente* faz
- N+1 problem: pattern que destrói performance silenciosamente
- Índices em queries: composite indexes, covering indexes
- Normalização vs denormalização: quando cada um é rápido
- Query patterns que escalam vs que explodem

---

## SEÇÃO 2: EXECUTAR, MEDIR, EXPLICAR (12 minutos)

### Princípio: Dados Ditam Decisão

Nunca otimize sem medir. A intuição é errada 80% das vezes. Uma query que parece óbvia rodar rápido pode fazer full table scan. Uma que parece cara pode estar em cache.

```sql
-- Para medir tempo
\timing ON -- PostgreSQL
-- ou use: EXPLAIN (ANALYZE, BUFFERS, TIMING)
```

### EXPLAIN PLAN

O comando EXPLAIN mostra *como* banco executará query sem executar.

```sql
-- Sem ANALYZE: plano estimado
EXPLAIN 
SELECT u.name, COUNT(p.id) as lessons_completed
FROM users u
LEFT JOIN user_lesson_progress p ON u.id = p.user_id 
  AND p.status = 'completed'
GROUP BY u.id;

-- Com ANALYZE: plano real (executa query!)
EXPLAIN ANALYZE
SELECT u.name, COUNT(p.id) as lessons_completed
FROM users u
LEFT JOIN user_lesson_progress p ON u.id = p.user_id 
  AND p.status = 'completed'
GROUP BY u.id;
```

Output (exemplo simplificado):
```
HashAggregate (cost=1500..1600 rows=50 width=32) (actual time=50.2..50.3 rows=50 loops=1)
  -> Hash Left Join (cost=100..1400 rows=5000) (actual time=2.1..40.5 rows=5000 loops=1)
        Hash Cond: (u.id = p.user_id)
        -> Seq Scan on users u (cost=0..50 rows=50) (actual time=0.1..0.5 rows=50 loops=1)
        -> Hash (cost=80..80 rows=400) (actual time=2..2 rows=400 loops=1)
              -> Seq Scan on user_lesson_progress p (cost=0..60 rows=400) (actual time=0.1..1.5 rows=400 loops=1)
```

Ler:
- `Seq Scan`: table scan (lê todas linhas)
- `Index Scan`: usa índice (rápido se seletivo)
- `cost=1500..1600`: custo estimado (unidades DB)
- `actual time=50.2..50.3`: tempo real (milissegundos)
- `rows=50`: quantas linhas retorna
- `loops=1`: quantas vezes executou

Vermelho em EXPLAIN ANALYZE: `Seq Scan on user_lesson_progress` — deveria ser `Index Scan`!

### Exemplo: Index Scan vs Seq Scan

SEM índice:
```sql
EXPLAIN ANALYZE
SELECT * FROM user_lesson_progress WHERE status = 'completed';

Seq Scan on user_lesson_progress (cost=0..500 rows=1000) (actual time=0.1..45.2 rows=1000 loops=1)
  Filter: (status = 'completed')
-- Lê 5000 linhas inteiras, filtra 1000 — caro
```

COM índice:
```sql
CREATE INDEX idx_progress_status ON user_lesson_progress(status);

EXPLAIN ANALYZE
SELECT * FROM user_lesson_progress WHERE status = 'completed';

Index Scan using idx_progress_status on user_lesson_progress (cost=0..100 rows=1000) (actual time=0.1..15.2 rows=1000 loops=1)
  Index Cond: (status = 'completed')
-- Salta direto para linhas relevantes — 3x mais rápido
```

---

## SEÇÃO 3: N+1: O ASSASSINO SILENCIOSO (15 minutos)

### O Padrão

```typescript
// Aplicação
const users = await db.query("SELECT * FROM users LIMIT 10");

for (const user of users) {
  // N queries adicionais! (N = número de usuários)
  const progress = await db.query(
    "SELECT COUNT(*) as lessons_completed FROM user_lesson_progress WHERE user_id = $1",
    [user.id]
  );
  user.lessonsCompleted = progress.count;
}
```

SQL real:
```sql
SELECT * FROM users LIMIT 10;                                      -- 1 query
SELECT COUNT(*) FROM user_lesson_progress WHERE user_id = 'id1';   -- +1
SELECT COUNT(*) FROM user_lesson_progress WHERE user_id = 'id2';   -- +1
SELECT COUNT(*) FROM user_lesson_progress WHERE user_id = 'id3';   -- +1
... (10 vezes)
-- Total: 11 queries em vez de 1
```

Impacto: 11 round-trips de rede, 11 parse de query, 11 execuções. Típico: +1000% latência.

### Solução 1: JOIN (Melhor)

```sql
SELECT u.*, COUNT(p.id) as lessons_completed
FROM users u
LEFT JOIN user_lesson_progress p ON u.id = p.user_id AND p.status = 'completed'
GROUP BY u.id;
-- 1 query, 1 round-trip, resultado completo
```

### Solução 2: IN Clause (Para Agregações Complexas)

```sql
-- Primeiro: pegar IDs
const userIds = await db.query("SELECT id FROM users LIMIT 10");

-- Depois: uma query com IN
const progressCounts = await db.query(
  "SELECT user_id, COUNT(*) as lessons_completed FROM user_lesson_progress WHERE user_id = ANY($1) AND status = 'completed' GROUP BY user_id",
  [userIds.map(u => u.id)]
);
```

### Solução 3: Batch Loading (GraphQL Pattern)

```typescript
// DataLoader: bateia múltiplas queries iguais
import DataLoader from 'dataloader';

const progressLoader = new DataLoader(async (userIds) => {
  const progressMap = await db.query(
    "SELECT user_id, COUNT(*) as count FROM user_lesson_progress WHERE user_id = ANY($1) GROUP BY user_id",
    [userIds]
  );
  return userIds.map(id => progressMap[id] || 0);
});

// Uso
const users = await db.query("SELECT * FROM users LIMIT 10");
const progressCounts = await Promise.all(
  users.map(u => progressLoader.load(u.id))
);
```

---

## SEÇÃO 4: ÍNDICES INTELIGENTES (12 minutos)

### Índice Simples vs Composite

Simples (1 coluna):
```sql
CREATE INDEX idx_lessons_difficulty ON lessons(difficulty_level);
-- Rápido para: WHERE difficulty_level = 'advanced'
-- Lento para: WHERE difficulty_level = 'advanced' AND module_id = X
```

Composite (2+ colunas):
```sql
CREATE INDEX idx_lessons_module_difficulty ON lessons(module_id, difficulty_level);
-- Rápido para:
--   WHERE module_id = X
--   WHERE module_id = X AND difficulty_level = 'advanced'
-- Lento para: WHERE difficulty_level = 'advanced' (sem module_id)
```

Ordem importa! Coloque colunas mais seletivas (menos duplicatas) primeiro.

### Covering Index

Índice que contém TODAS colunas da query — não precisa ler tabela.

```sql
-- Sem covering index
CREATE INDEX idx_progress_user_status ON user_lesson_progress(user_id, status);
SELECT * FROM user_lesson_progress WHERE user_id = X AND status = 'completed';
-- Lê índice, depois tabela (2 acessos)

-- Com covering index
CREATE INDEX idx_progress_user_status_covering ON user_lesson_progress(user_id, status)
  INCLUDE (completed_at, progress_percentage); -- PostgreSQL 11+
SELECT user_id, status, completed_at, progress_percentage FROM user_lesson_progress WHERE user_id = X AND status = 'completed';
-- Lê índice só (1 acesso, mais rápido)
```

### Partial Index

Índice apenas em subset de dados.

```sql
-- Índice completo (todas 1M de linhas)
CREATE INDEX idx_progress_incomplete ON user_lesson_progress(user_id, status);
-- Índice parcial (apenas 100k em_progresso)
CREATE INDEX idx_progress_incomplete_partial ON user_lesson_progress(user_id) 
  WHERE status = 'in_progress';
-- Parcial é menor, mais rápido INSERT/UPDATE, suficiente para queries de in_progress
```

---

## SEÇÃO 5: PADRÕES QUE ESCALAM VS QUE EXPLODEM (10 minutos)

### PADRÃO: Aggregate Com Índice

Escala:
```sql
CREATE INDEX idx_answers_user_correct ON user_exercise_answers(user_id) 
  WHERE is_correct = true;

SELECT COUNT(*) FROM user_exercise_answers WHERE user_id = X AND is_correct = true;
-- Index scan, muito rápido mesmo com 1M de respostas
```

Explode:
```sql
SELECT COUNT(*) FROM user_exercise_answers WHERE user_id = X AND is_correct = true;
-- Sem índice, table scan 1M de linhas toda vez
```

### PADRÃO: OFFSET Grande

Escala:
```sql
SELECT * FROM lessons WHERE difficulty_level = 'advanced' 
ORDER BY created_at DESC LIMIT 10 OFFSET 0;
-- Índice em difficulty_level, rápido
```

Explode:
```sql
SELECT * FROM lessons WHERE difficulty_level = 'advanced' 
ORDER BY created_at DESC LIMIT 10 OFFSET 10000;
-- Pula 10000 registros mesmo com índice — caro
-- Alternativa: SELECT * FROM lessons WHERE created_at < (SELECT created_at FROM lessons WHERE id = X) ...
```

### PADRÃO: LIKE sem Índice

Escala:
```sql
SELECT * FROM lessons WHERE title LIKE 'Algorithm%';
-- Índice pode ser usado (começa com)
```

Explode:
```sql
SELECT * FROM lessons WHERE title LIKE '%algorithm%';
-- Full-text search precisa, não wildcard
-- Solução: CREATE INDEX ... USING GIN(to_tsvector(...))
```

### PADRÃO: Denormalização Sincronizada

Escala:
```sql
ALTER TABLE users ADD COLUMN completed_lessons INT DEFAULT 0;

CREATE TRIGGER update_user_lesson_count
AFTER INSERT ON user_lesson_progress
WHEN (NEW.status = 'completed')
EXECUTE FUNCTION increment_user_lesson_count();

SELECT * FROM users WHERE completed_lessons > 100;
-- 1 query, sem JOIN, rápido
```

Explode:
```sql
-- Sem trigger, completed_lessons fica desincronizado
SELECT u.*, COUNT(p.id) as completed_lessons FROM users u
LEFT JOIN user_lesson_progress p ON u.id = p.user_id AND p.status = 'completed'
GROUP BY u.id WHERE COUNT(p.id) > 100;
-- JOIN + GROUP BY + HAVING sempre, lento
```

---

## SEÇÃO 6: SÍNTESE — OTIMIZAR COM DADOS (5 minutos)

**Checklist:**

1. Use EXPLAIN ANALYZE: meça antes de otimizar
2. Procure Seq Scans em tabelas grandes — adicione índice
3. Procure N+1: múltiplas queries iguais — use JOIN ou batch
4. Índices em WHERE, JOIN, ORDER BY, GROUP BY
5. Índices compostos: ordem importa
6. LIMIT com OFFSET grande: use keyset pagination
7. Denormalização com triggers: mantém sincronizado
8. Teste com dados reais: volume muda tudo

---

## EXERCÍCIO PRÁTICO

### Projeto: Otimizar Queries de Plataforma Educacional

Você descobriu que dashboard de professor está lento. Tem queries:

1. Listar alunos com progresso em cada módulo
2. Contar respostas corretas por aluno
3. Encontrar lições mais difíceis (mais erros)

**Tarefas:**

1. **Escrever queries** (sem otimização)
2. **EXPLAIN ANALYZE** cada uma — identifique Seq Scans
3. **Adicione índices** onde faltam
4. **Reescreva se N+1** — use JOINs em vez de loops
5. **Medir antes/depois** — quanto melhorou?

---

## RESUMO

Otimização SQL não é magia — é medir, ler EXPLAIN, identificar Seq Scans e N+1, adicionar índices, reescrever queries. Uma query otimizada economiza horas de desenvolvimento em features futuras.

Próxima lição: como evitar otimização prematura — usando ORM (Prisma) que trata alguns casos automaticamente.
