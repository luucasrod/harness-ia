# LIÇÃO 4.5: Migrations — Schema Evolution

## SEÇÃO 1: INTRODUÇÃO (5 minutos)

### O Problema

Você implantou aplicação com schema V1. Seis meses depois, novo requisito exige nova coluna em 50M de linhas. Opções:

1. **Downtime:** Migrar offline, aplicação indisponível 2 horas
2. **Sem downtime:** Estratégia zero-downtime, mas complexa
3. **Sem migração:** Adicionar coluna nullable, preenchê-la gradualmente (risk de bugs)

Engenheiros experientes planejam migrations desde o início. Cada schema change é versionado, reversível, testável.

### O Que Você Vai Aprender

- Estratégias de migration: big bang, blue-green, shadow writes
- Ferramentas: Flyway, Liquibase, Prisma Migrate
- Rollback seguro: reversibilidade garantida
- Teste de migration: validar dados antes e depois

---

## SEÇÃO 2: ESTRATÉGIAS DE MIGRATION (15 minutos)

### Estratégia 1: Big Bang (Simples, Arriscado)

```sql
-- v1: tabela antigo
CREATE TABLE users (id UUID PRIMARY KEY, email VARCHAR(255), name VARCHAR(255));

-- v2: DOWNTIME de 1-2 horas
ALTER TABLE users ADD COLUMN age INT;
ALTER TABLE users ADD COLUMN bio TEXT;
-- Aplicação offline enquanto migra
```

Problema: Aplicação indisponível, impossível reverter, tudo-ou-nada.

Uso: Dados pequenos (<100M linhas), downtime aceitável, schema simples.

### Estratégia 2: Zero-Downtime (Complexa, Profissional)

Passo 1: Adicionar coluna com default
```sql
ALTER TABLE users ADD COLUMN age INT DEFAULT 0;
-- Rápido (~0.1s), não reescreve todas linhas
```

Passo 2: Aplicação preenche novos registros
```typescript
// Aplicação v2
const user = { email, name, age }; // age é novo
await db.users.create(user);
```

Passo 3: Backfill dados antigos (background job)
```sql
-- Executar em background, sem lock
UPDATE users SET age = 18 WHERE age = 0 AND created_at < '2024-01-01';
```

Passo 4: Validar completude
```sql
SELECT COUNT(*) FROM users WHERE age IS NULL OR age = 0;
-- Se zero, backfill completo
```

Passo 5: Remover DEFAULT (opcional)
```sql
ALTER TABLE users ALTER COLUMN age DROP DEFAULT;
```

Benefício: Zero downtime, reversível em qualquer passo, seguro.

### Estratégia 3: Blue-Green com Espelhamento

```
[Aplicação V1] → [DB Blue (Antigo)]
             ↘ → [DB Green (Novo)] ← Sincronizando
[Aplicação V2] → [DB Green]
```

1. Criar banco Green com novo schema
2. Replicar dados de Blue para Green
3. Aplicação V1 escreve em ambos (dual-writes)
4. Green fica sincronizado
5. Aplicação V2 lê/escreve só Green
6. Desligar Blue

Benefício: Rollback instantâneo (volta para Blue).
Custo: Dupla escrita por tempo, sincronização complexa.

---

## SEÇÃO 3: FERRAMENTAS E VERSIONAMENTO (12 minutos)

### Flyway (Standard em Produção)

```
migrations/
├── V001__create_users.sql
├── V002__add_user_email_index.sql
├── V003__add_lesson_progress_table.sql
└── V004__add_progress_percentage_column.sql
```

```sql
-- V001__create_users.sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT now()
);

-- V002__add_user_email_index.sql
CREATE INDEX idx_users_email ON users(email);

-- V003__add_lesson_progress_table.sql
CREATE TABLE lesson_progress (
  user_id UUID NOT NULL,
  lesson_id UUID NOT NULL,
  status VARCHAR(50),
  CONSTRAINT fk_progress_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- V004__add_progress_percentage_column.sql (zero-downtime)
ALTER TABLE lesson_progress ADD COLUMN progress_percentage INT DEFAULT 0;
-- Depois: backfill em background
```

Execução:
```bash
# Aplicar todas migrações em ordem
./flyway migrate

# Informações de histórico
./flyway info

# Rollback (undo última — caro)
./flyway undo
```

Vantagem: Versionamento claro, ordem garantida, reversibilidade parcial.

### Prisma Migrate (TypeScript-native)

```bash
# Editar schema.prisma
# Adicionar coluna, modelo, etc.

# Criar migration
npx prisma migrate dev --name add_completed_at

# Prisma gera
# prisma/migrations/20240101120000_add_completed_at/migration.sql
# e aplica
```

Migration gerada:
```sql
ALTER TABLE LessonProgress ADD COLUMN completedAt TIMESTAMP;
```

Em produção:
```bash
npx prisma migrate deploy
```

---

## SEÇÃO 4: ROLLBACK E DISASTER RECOVERY (12 minutos)

### Rollback Planejado

```sql
-- Se migration causou problema, rollback SQL é limpo:
DROP INDEX idx_users_email;
ALTER TABLE users DROP COLUMN age;

-- Ou reverter via Flyway:
./flyway undo
```

Mas: **Reversão de dados é arriscada.** Melhor estratégia:

1. **Não deletar dados** na migration
2. **Manter coluna antiga** em paralelo durante transição
3. **Remover depois** que aplicação antigo não usa

Exemplo:
```sql
-- Migration 1: Adicionar nova coluna
ALTER TABLE users ADD COLUMN email_normalized VARCHAR(255);

-- Migration 2: Aplicação preenche nova coluna durante transição (semanas)
UPDATE users SET email_normalized = LOWER(email);

-- Migration 3: Remover coluna antiga depois
ALTER TABLE users DROP COLUMN email;
```

### Disaster Recovery (Data Corruption)

```bash
# Backup antes de migration crítica
pg_dump -Fc production_db > backup_before_v3.dump

# Se corruption detectada
pg_restore -d production_db backup_before_v3.dump
# Volta para versão anterior + reaplica data loss (horas)
```

---

## SEÇÃO 5: TESTE DE MIGRATIONS (10 minutos)

### Teste Estrutura

```bash
# 1. Setup: cópia de production em staging
pg_dump -Fc production > staging.dump
psql staging < staging.dump

# 2. Executar migration em staging
./flyway migrate

# 3. Validar
SELECT COUNT(*) FROM users; -- Números compatíveis?
SELECT COUNT(*) FROM users WHERE age IS NULL; -- Backfill completo?

# 4. Performance
EXPLAIN ANALYZE SELECT * FROM users WHERE email = 'test@example.com';
-- Usa índice novo?

# 5. Teste de aplicação
# Rodar testes com staging (queries, criar usuários, etc.)
npm test -- --env=staging
```

### Teste de Rollback

```bash
# Se rollback é possível:
./flyway undo

# Validar estado antigo
SELECT COUNT(*) FROM lesson_progress; -- Dados preservados?

# Re-aplicar
./flyway migrate

# Deve ser idempotente (3x executar = mesmo estado)
```

---

## SEÇÃO 6: SÍNTESE — BOAS PRÁTICAS (6 minutos)

**Checklist de Migration:**

1. ✅ Migração é reversível? (dados não deletados, schema não simplificado)
2. ✅ Zero-downtime possível? (não lock tabela grande)
3. ✅ Testado em staging? (com dados reais de volume)
4. ✅ Índices adicionados? (novo schema precisa índices)
5. ✅ Validação pós-migration? (dados intactos, performance OK)
6. ✅ Rollback plan? (se der erro, volta rápido)

---

## EXERCÍCIO PRÁTICO

### Projeto: Evoluir Schema de Plataforma Educacional

Cenário:
- Plataforma tem 50M registros em user_lesson_progress
- Novo requisito: adicionar grade (A/B/C/F) baseado em acertos
- Requisito: zero downtime, aplicação segue online

Tarefas:

1. **V001:** Criar schema inicial (users, lessons, progress)
2. **V002:** Adicionar coluna `grade` com default (zero-downtime)
3. **V003:** Criar índice em (userId, status) (caro em tabela grande, fazer em background)
4. **V004:** Backfill grades baseado em acertos (batch job)
5. **V005:** Validar integridade
6. **Rollback Test:** Reversão segura sem data loss

---

## RESUMO

Migrations profissionais não são "ALTER TABLE" rápido. São planejadas, versionadas, testadas, reversíveis. Zero-downtime é padrão em produção — big bang é só para dados pequenos.

Próxima lição: proteger dados contra perda — Backup & HA.
