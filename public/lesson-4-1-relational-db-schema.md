# LIÇÃO 4.1: Relational Databases & Schema Design

## SEÇÃO 1: INTRODUÇÃO (5 minutos)

### Por Que Schema Importa

Um banco de dados relacional é a espinha dorsal de quase toda aplicação não trivial. Mas muitos desenvolvedores tratam schema como detalhe administrativo: criam uma tabela, adicionam colunas conforme precisam, e meses depois descobrem que uma mudança simples de business rule força uma refatoração de dados que custa horas de downtime.

O schema não é só estrutura — é contrato. Define como dados se relacionam, como você faz queries eficientemente, como você evolui sem quebrar. Um bom schema economiza meses de trabalho futuro. Um ruim custa semanas corrigindo bugs relacionados a dados.

### O que Você Vai Aprender

- Fundamentos de modelos relacionais: tabelas, relações, normalização
- Quando normalizar, quando denormalizar; trade-offs reais
- Índices e como eles afetam leitura e escrita
- Constraints: chaves primárias, estrangeiras, unique, not null — quando usá-las
- Anti-patterns comuns e como evitá-los
- Projeto real: schema de plataforma educacional com autenticação, progresso e tutoria

---

## SEÇÃO 2: FUNDAMENTOS DE MODELO RELACIONAL (12 minutos)

### O Modelo Relacional

Um banco relacional organiza dados em tabelas. Cada tabela representa uma entidade (usuário, lição, resposta). Cada linha é uma instância. Cada coluna é um atributo. Relacionamentos são feitos via chaves estrangeiras.

#### Exemplo Simples: Usuário e Lição

```sql
-- Tabela de usuários
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Tabela de lições
CREATE TABLE lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL,
  title VARCHAR(255) NOT NULL,
  content_markdown TEXT NOT NULL,
  difficulty_level VARCHAR(50), -- 'beginner', 'intermediate', 'advanced'
  created_at TIMESTAMP DEFAULT now(),
  CONSTRAINT fk_lessons_module FOREIGN KEY (module_id) 
    REFERENCES modules(id) ON DELETE CASCADE
);

-- Tabela de progresso
CREATE TABLE user_lesson_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  lesson_id UUID NOT NULL,
  status VARCHAR(50) DEFAULT 'in_progress', -- 'in_progress', 'completed'
  completed_at TIMESTAMP,
  CONSTRAINT fk_progress_user FOREIGN KEY (user_id) 
    REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_progress_lesson FOREIGN KEY (lesson_id) 
    REFERENCES lessons(id) ON DELETE CASCADE,
  CONSTRAINT unique_user_lesson UNIQUE(user_id, lesson_id)
);
```

Observe:
- **Primary Key (id):** Identifica unicamente cada registro
- **Foreign Key (user_id, lesson_id):** Vincula tabelas
- **UNIQUE constraints:** Email não se repete; (user_id, lesson_id) é único
- **ON DELETE CASCADE:** Se usuário é deletado, seu progresso também é

### Relacionamentos de Dados

#### Um-para-Um (1:1)

Um usuário tem um perfil. Um perfil pertence a um usuário.

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) NOT NULL
);

CREATE TABLE user_profiles (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE, -- UNIQUE garante 1:1
  bio TEXT,
  avatar_url VARCHAR(255),
  CONSTRAINT fk_profile_user FOREIGN KEY (user_id) 
    REFERENCES users(id) ON DELETE CASCADE
);
```

Trade-off: Um-para-um pode estar na mesma tabela ou separada. Separe se:
- Dados do profile são grandes ou acessados raramente (economiza I/O)
- Profile é opcional (NULL vs coluna vazia)
- Profile tem sua própria ciclo de vida

#### Um-para-Muitos (1:N)

Uma lição tem muitas respostas. Uma resposta pertence a uma lição.

```sql
CREATE TABLE lessons (
  id UUID PRIMARY KEY,
  title VARCHAR(255)
);

CREATE TABLE exercise_questions (
  id UUID PRIMARY KEY,
  lesson_id UUID NOT NULL, -- Foreign key aponta para lição
  question_text TEXT NOT NULL,
  CONSTRAINT fk_question_lesson FOREIGN KEY (lesson_id) 
    REFERENCES lessons(id) ON DELETE CASCADE
);
```

Não adicione chave única em lesson_id — uma lição tem *muitas* questões.

#### Muitos-para-Muitos (N:M)

Um aluno está em muitos cursos. Um curso tem muitos alunos. Precisa de tabela de junção.

```sql
CREATE TABLE courses (
  id UUID PRIMARY KEY,
  title VARCHAR(255)
);

CREATE TABLE students (
  id UUID PRIMARY KEY,
  name VARCHAR(255)
);

-- Tabela de junção
CREATE TABLE enrollments (
  id UUID PRIMARY KEY,
  student_id UUID NOT NULL,
  course_id UUID NOT NULL,
  enrolled_at TIMESTAMP DEFAULT now(),
  CONSTRAINT fk_enrollment_student FOREIGN KEY (student_id)
    REFERENCES students(id) ON DELETE CASCADE,
  CONSTRAINT fk_enrollment_course FOREIGN KEY (course_id)
    REFERENCES courses(id) ON DELETE CASCADE,
  CONSTRAINT unique_enrollment UNIQUE(student_id, course_id)
);
```

A tabela enrollments permite armazenar metadados (enrolled_at, progress, grade) se precisar.

---

## SEÇÃO 3: NORMALIZAÇÃO — TEORIA E PRÁTICA (15 minutos)

### O Problema: Redundância e Anomalias

Imagine esta tabela (NÃO NORMALIZADA):

```sql
CREATE TABLE user_lessons_flat (
  id UUID PRIMARY KEY,
  user_id UUID,
  user_email VARCHAR(255),
  user_name VARCHAR(255),
  lesson_id UUID,
  lesson_title VARCHAR(255),
  lesson_module_id UUID,
  lesson_module_name VARCHAR(255),
  progress_status VARCHAR(50),
  completed_at TIMESTAMP
);
```

Problemas:
- **Redundância:** Se usuário lucas@example.com tem 10 lições, seu email é armazenado 10 vezes
- **Anomalia de Atualização:** Mudar nome do usuário exige atualizar 10 linhas
- **Anomalia de Inserção:** Não posso inserir um usuário sem uma lição
- **Anomalia de Deleção:** Deletar última lição de um usuário apaga o usuário

### Formas Normais

#### Primeira Forma Normal (1NF)

*Cada célula contém um valor atômico, não uma lista.*

Ruim:
```sql
CREATE TABLE user_interests (
  user_id UUID,
  interests VARCHAR(500) -- "programação, design, dados" — lista em string
);
```

Bom:
```sql
CREATE TABLE user_interests (
  user_id UUID,
  interest_name VARCHAR(100),
  CONSTRAINT unique_interest UNIQUE(user_id, interest_name)
);
```

#### Segunda Forma Normal (2NF)

*Atributos não-chave dependem *completamente* da chave primária, não de parte dela.*

Ruim (chave composta):
```sql
CREATE TABLE enrollment_details (
  student_id UUID,
  course_id UUID,
  enrollment_date TIMESTAMP,
  course_name VARCHAR(255), -- Depende só de course_id, não de (student_id, course_id)
  PRIMARY KEY(student_id, course_id)
);
```

Bom:
```sql
CREATE TABLE courses (id UUID PRIMARY KEY, name VARCHAR(255));

CREATE TABLE enrollments (
  student_id UUID,
  course_id UUID,
  enrollment_date TIMESTAMP,
  PRIMARY KEY(student_id, course_id),
  FOREIGN KEY(course_id) REFERENCES courses(id)
);
```

#### Terceira Forma Normal (3NF)

*Atributos não-chave não dependem uns dos outros; só da chave primária.*

Ruim:
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  name VARCHAR(255),
  country_id UUID,
  country_name VARCHAR(100), -- Depende de country_id, não de id
  country_code VARCHAR(2)
);
```

Bom:
```sql
CREATE TABLE users (id UUID PRIMARY KEY, name VARCHAR(255), country_id UUID);
CREATE TABLE countries (id UUID PRIMARY KEY, name VARCHAR(100), code VARCHAR(2));
```

### Normalização vs. Denormalização

**Normalizar reduz anomalias mas pode aumentar queries (JOINs).** Às vezes é estratégico denormalizar.

Exemplo: Você normaliza (3 tabelas, 2 JOINs)

```sql
-- Normalizado
SELECT u.name, COUNT(p.id) as lesson_count
FROM users u
LEFT JOIN user_lesson_progress p ON u.id = p.user_id
WHERE p.status = 'completed'
GROUP BY u.id;
```

Mas se essa query roda a cada requisição e é critical para performance, denormalize:

```sql
-- Denormalizado
ALTER TABLE users ADD COLUMN completed_lesson_count INT DEFAULT 0;
-- Atualize via trigger ou batch job

SELECT u.name, u.completed_lesson_count
FROM users u;
```

Trade-off:
- **Normalizado:** Escrita simples, leitura complexa (JOINs), sem inconsistência
- **Denormalizado:** Escrita complexa (atualizar coluna + múltiplas tabelas), leitura rápida, risco de inconsistência

**Decisão:** Perfil de aplicação. Read-heavy (analytics, cache)? Denormalize. Write-heavy (transações)?  Normalize.

---

## SEÇÃO 4: ÍNDICES — O INVISÍVEL QUE MUDA TUDO (12 minutos)

### O Que é um Índice

Índice é uma estrutura (normalmente B-tree) que acelera buscas. Sem índice, SQL examina toda tabela (table scan). Com índice, SQL pula direto para registros relevantes.

```sql
-- Sem índice
SELECT * FROM users WHERE email = 'user@example.com';
-- Examina 1 milhão de linhas

-- Com índice
CREATE INDEX idx_users_email ON users(email);
SELECT * FROM users WHERE email = 'user@example.com';
-- Examina ~20 linhas (logarítmico)
```

### Tipos de Índices

#### Single-Column Index

```sql
CREATE INDEX idx_lessons_difficulty ON lessons(difficulty_level);
-- Acelera: WHERE difficulty_level = 'advanced'
```

#### Composite Index (Multi-Column)

```sql
CREATE INDEX idx_progress_user_status ON user_lesson_progress(user_id, status);
-- Acelera: WHERE user_id = X AND status = 'completed'
-- NÃO acelera bem: WHERE status = 'completed' (status não é primeira coluna)
```

Ordem importa. Coloque colunas mais seletivas primeiro.

#### Unique Index

```sql
CREATE UNIQUE INDEX idx_users_email ON users(email);
-- Força uniqueness e acelera buscas
```

#### Full-Text Index

```sql
CREATE INDEX idx_lessons_content_full_text ON lessons 
  USING GIN(to_tsvector('portuguese', content_markdown));
-- Acelera: WHERE to_tsvector('portuguese', content_markdown) 
           @@ plainto_tsquery('portuguese', 'algoritmo')
```

### Custos de Índices

Índices **aceleram leitura mas ralentam escrita.**

```sql
INSERT INTO users (email, name) VALUES (...);
-- Sem índices: 1 escrita
-- Com 5 índices: 5 escritas (manter índices)

UPDATE users SET name = '...' WHERE id = X;
-- Sem índices: 1 escrita
-- Com 5 índices: até 5 escritas
```

**Tradeoff:** Para cada índice, 5-10% de penalidade em inserts/updates.

### Quando Criar Índices

1. **WHERE clauses frequentes:** `WHERE user_id = X`
2. **JOINs:** Coluna chave estrangeira
3. **ORDER BY:** Ordenação frequente
4. **Agregações:** GROUP BY, COUNT

NÃO crie índices para:
- Colunas raramente consultadas
- Colunas com pouca seletividade (boolean, status com 2 valores)
- Dados que mudam constantemente

### Exemplo Real: Schema de Plataforma Educacional

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  created_at TIMESTAMP
);
CREATE UNIQUE INDEX idx_users_email ON users(email);
-- Email é PK implícito

CREATE TABLE lessons (
  id UUID PRIMARY KEY,
  module_id UUID NOT NULL,
  title VARCHAR(255),
  difficulty_level VARCHAR(50),
  created_at TIMESTAMP
);
CREATE INDEX idx_lessons_module ON lessons(module_id);
-- Acelera: SELECT * FROM lessons WHERE module_id = X
CREATE INDEX idx_lessons_difficulty ON lessons(difficulty_level);
-- Acelera: WHERE difficulty_level = 'advanced'

CREATE TABLE user_lesson_progress (
  user_id UUID NOT NULL,
  lesson_id UUID NOT NULL,
  status VARCHAR(50),
  completed_at TIMESTAMP,
  PRIMARY KEY(user_id, lesson_id)
);
-- Primary key implicitamente indexa (user_id, lesson_id)
CREATE INDEX idx_progress_status ON user_lesson_progress(status);
-- Acelera: WHERE status = 'completed'

CREATE TABLE exercise_answers (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  lesson_id UUID NOT NULL,
  question_id UUID NOT NULL,
  user_answer TEXT,
  is_correct BOOLEAN,
  answered_at TIMESTAMP
);
CREATE INDEX idx_answers_user_lesson ON exercise_answers(user_id, lesson_id);
-- Acelera: SELECT * FROM answers WHERE user_id = X AND lesson_id = Y
```

---

## SEÇÃO 5: CONSTRAINTS E INTEGRIDADE (10 minutos)

### Chaves Primárias (Primary Key)

Identifica unicamente cada linha. Nunca NULL, nunca duplicada.

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255)
);
```

**Duas opções: Natural vs Surrogate**

Natural key:
```sql
CREATE TABLE countries (
  iso_code CHAR(2) PRIMARY KEY, -- 'BR', 'US'
  name VARCHAR(100)
);
```

Surrogate key (artificial):
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE
);
```

**Quando usar:**
- Natural: Dados estáveis, chave curta (códigos, SKUs)
- Surrogate: Dados mutáveis, chave composta, referências externas

### Chaves Estrangeiras (Foreign Key)

Força relacionamento. Impede dados órfãos.

```sql
CREATE TABLE user_lesson_progress (
  user_id UUID NOT NULL,
  lesson_id UUID NOT NULL,
  CONSTRAINT fk_progress_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_progress_lesson FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE
);
```

**ON DELETE options:**
- `CASCADE`: Deleta progresso se usuário é deletado
- `SET NULL`: Coloca NULL em user_id se usuário é deletado
- `RESTRICT`: Recusa deletar usuário se tem progresso
- `NO ACTION`: Como RESTRICT, mais explícito

**Quando usar CASCADE:** Dados dependentes (progressos sem usuários não fazem sentido)
**Quando usar RESTRICT:** Dados independentes (deletar módulo não deve deletar lições)

### Unique Constraints

Força que valor não se repita (exceto NULL).

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  CONSTRAINT unique_email UNIQUE(email)
);

-- Permite múltiplos NULL (NULL não é igual a NULL em SQL)
INSERT INTO users VALUES (id1, NULL);
INSERT INTO users VALUES (id2, NULL); -- Aceito

-- Se não quer duplicatas NI de NULL:
ALTER TABLE users ADD CONSTRAINT unique_email_not_null 
  CHECK(email IS NOT NULL);
```

### Check Constraints

Valida valores.

```sql
CREATE TABLE user_lesson_progress (
  user_id UUID,
  lesson_id UUID,
  progress_percentage INT,
  CONSTRAINT check_progress_range CHECK (progress_percentage >= 0 AND progress_percentage <= 100)
);

CREATE TABLE modules (
  id UUID PRIMARY KEY,
  difficulty_level VARCHAR(50),
  CONSTRAINT check_difficulty 
    CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced'))
);
```

### Not Null Constraints

Força coluna ter valor.

```sql
CREATE TABLE users (
  id UUID NOT NULL PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  bio TEXT, -- Permite NULL (biografia é opcional)
  created_at TIMESTAMP NOT NULL DEFAULT now()
);
```

---

## SEÇÃO 6: ANTI-PATTERNS COMUNS (10 minutos)

### Anti-Pattern 1: Usar String em Vez de Enum/Reference

Ruim:
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  role VARCHAR(100) -- "admin", "teacher", "student", "admin " (typo)
);
-- Difícil validar, espaços extras quebram queries
```

Bom:
```sql
CREATE TABLE roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE
);
INSERT INTO roles(name) VALUES ('admin'), ('teacher'), ('student');

CREATE TABLE users (
  id UUID PRIMARY KEY,
  role_id INT NOT NULL,
  CONSTRAINT fk_user_role FOREIGN KEY (role_id) REFERENCES roles(id)
);
-- Validação garantida, sem typos
```

Melhor (PostgreSQL enums):
```sql
CREATE TYPE user_role AS ENUM ('admin', 'teacher', 'student');
CREATE TABLE users (
  id UUID PRIMARY KEY,
  role user_role NOT NULL
);
```

### Anti-Pattern 2: Armazenar Agregações Sem Atualizar

Ruim:
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  name VARCHAR(255),
  total_lessons_completed INT -- Não atualiza quando progresso muda!
);
```

Melhor:
```sql
-- Calcular quando precisa
SELECT u.id, COUNT(p.id) as completed_lessons
FROM users u
LEFT JOIN user_lesson_progress p ON u.id = p.user_id 
  AND p.status = 'completed'
GROUP BY u.id;

-- Ou denormalizar com trigger
CREATE TRIGGER update_user_lesson_count
AFTER INSERT ON user_lesson_progress
FOR EACH ROW
WHEN (NEW.status = 'completed')
EXECUTE FUNCTION increment_user_lesson_count();
```

### Anti-Pattern 3: Não Validar em Banco

Ruim:
```sql
CREATE TABLE exercise_questions (
  id UUID PRIMARY KEY,
  question_text TEXT, -- Pode ser vazio!
  difficulty_level VARCHAR(100) -- Pode ser qualquer string
);
```

Bom:
```sql
CREATE TABLE exercise_questions (
  id UUID PRIMARY KEY,
  question_text TEXT NOT NULL CHECK (LENGTH(TRIM(question_text)) > 0),
  difficulty_level VARCHAR(50) NOT NULL 
    CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  order_index INT NOT NULL CHECK (order_index > 0)
);
```

### Anti-Pattern 4: Chave Estrangeira Sem ON DELETE

Ruim:
```sql
CREATE TABLE user_lesson_progress (
  user_id UUID,
  lesson_id UUID,
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id)
  -- Sem ON DELETE — se deletar usuário, row fica órfão!
);
```

Bom:
```sql
CREATE TABLE user_lesson_progress (
  user_id UUID,
  lesson_id UUID,
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

---

## SEÇÃO 7: SÍNTESE — BOAS PRÁTICAS (5 minutos)

**Resumo de Design Relacional:**

1. **Normalize até 3NF** (elimina redundância e anomalias)
2. **Denormalize estrategicamente** (não uniformemente; medir impacto)
3. **Índice frequentes:** WHERE, JOIN, ORDER BY, GROUP BY
4. **Não índice:** Dados raros, pouco seletivos, write-heavy
5. **Constraints em banco:** NOT NULL, UNIQUE, FOREIGN KEY, CHECK
6. **Evite strings onde enums servem** (validação em banco)
7. **Foreign keys com ON DELETE** (integridade garantida)

---

## EXERCÍCIO PRÁTICO

### Projeto: Schema de Plataforma Educacional

Você está construindo uma plataforma de cursos online. Requisitos:

- Usuários com email único e nome
- Módulos com título e descrição
- Lições dentro de módulos
- Exercícios de tipo múltipla escolha, resposta curta, código
- Alunos completam lições e resolvem exercícios
- Sistema de progresso (% por módulo, % total)
- Tutoria de IA: cada resposta errada gera uma dúvida, tutor propõe explicação

**Tarefas:**

1. **Desenhe o schema** em SQL (CREATE TABLE)
   - Inclua tipos de dados apropriados
   - Índices nas colunas que serão consultadas
   - Constraints para garantir integridade
   - Foreign keys com ON DELETE appropriado

2. **Normalize até 3NF**
   - Não armazene dados redundantes
   - Separe responsabilidades de tabelas

3. **Identifique 3 índices críticos** e explique por quê

4. **Teste anomalias:** Simule deletar usuário. Progresso é deletado? Lições ficam órfãs?

### Solução

Veja ao final deste documento.

---

## RESUMO

Um schema bem desenhado é invisível — a aplicação cresce sem dor. Um ruim custa meses corrigindo. Invista em design relacional desde o início: normalização reduz bugs, índices corretos economizam latência, constraints garantem integridade em banco, não em aplicação.

Próxima lição: como consultar esse schema eficientemente — SQL Query Optimization.

---

## SOLUÇÃO DO EXERCÍCIO

```sql
-- Tabela de usuários
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);
CREATE INDEX idx_users_email ON users(email);

-- Tabela de módulos
CREATE TABLE modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  order_index INT NOT NULL CHECK (order_index > 0),
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

-- Tabela de lições
CREATE TABLE lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL,
  title VARCHAR(255) NOT NULL,
  content_markdown TEXT NOT NULL,
  difficulty_level VARCHAR(50) NOT NULL 
    CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  order_index INT NOT NULL CHECK (order_index > 0),
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  CONSTRAINT fk_lesson_module FOREIGN KEY (module_id) 
    REFERENCES modules(id) ON DELETE CASCADE
);
CREATE INDEX idx_lessons_module ON lessons(module_id);
CREATE INDEX idx_lessons_difficulty ON lessons(difficulty_level);

-- Tabela de questões de exercício
CREATE TABLE exercise_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL,
  question_type VARCHAR(50) NOT NULL 
    CHECK (question_type IN ('multiple_choice', 'short_answer', 'code', 'essay')),
  question_text TEXT NOT NULL CHECK (LENGTH(TRIM(question_text)) > 0),
  correct_answer TEXT NOT NULL,
  order_index INT NOT NULL CHECK (order_index > 0),
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  CONSTRAINT fk_question_lesson FOREIGN KEY (lesson_id) 
    REFERENCES lessons(id) ON DELETE CASCADE
);
CREATE INDEX idx_questions_lesson ON exercise_questions(lesson_id);

-- Tabela de respostas do usuário
CREATE TABLE user_exercise_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  question_id UUID NOT NULL,
  user_answer TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL,
  answered_at TIMESTAMP NOT NULL DEFAULT now(),
  CONSTRAINT fk_answer_user FOREIGN KEY (user_id) 
    REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_answer_question FOREIGN KEY (question_id) 
    REFERENCES exercise_questions(id) ON DELETE CASCADE
);
CREATE INDEX idx_answers_user_question ON user_exercise_answers(user_id, question_id);

-- Tabela de progresso por lição
CREATE TABLE user_lesson_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  lesson_id UUID NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'not_started' 
    CHECK (status IN ('not_started', 'in_progress', 'completed')),
  progress_percentage INT NOT NULL DEFAULT 0 
    CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT now(),
  CONSTRAINT fk_progress_user FOREIGN KEY (user_id) 
    REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_progress_lesson FOREIGN KEY (lesson_id) 
    REFERENCES lessons(id) ON DELETE CASCADE,
  CONSTRAINT unique_user_lesson UNIQUE(user_id, lesson_id)
);
CREATE INDEX idx_progress_user ON user_lesson_progress(user_id);
CREATE INDEX idx_progress_status ON user_lesson_progress(status);

-- Tabela de dúvidas geradas por IA
CREATE TABLE ai_tutor_queries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  answer_id UUID NOT NULL,
  question_topic TEXT NOT NULL,
  ai_explanation TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  CONSTRAINT fk_query_user FOREIGN KEY (user_id) 
    REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_query_answer FOREIGN KEY (answer_id) 
    REFERENCES user_exercise_answers(id) ON DELETE CASCADE
);
CREATE INDEX idx_queries_user ON ai_tutor_queries(user_id);
```

Índices críticos:
1. `idx_users_email`: Login por email é operação frequente
2. `idx_lessons_module`: Listar lições de um módulo é comum
3. `idx_progress_user`: Carregar progresso do usuário é critical path
