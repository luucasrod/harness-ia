# MÓDULO 7: SOLID & Design Patterns
## Índice de Estrutura e Planejamento

**Status:** Em Criação  
**Duração Total:** 22 horas (1320 minutos)  
**Número de Lições:** 6  
**Primeira Lição Completa:** 7.1 (SRP)  
**Data de Início:** 2026-09-27

---

## VISÃO GERAL DO MÓDULO

Este módulo fornece uma cobertura **profunda e prática** dos 5 princípios SOLID, três categorias de design patterns, Domain-Driven Design e técnicas de refactoring. O foco é sempre em **aplicação real**, não em memorização.

**Fio Condutor:** Plataforma educacional com tutor de IA. Cada lição mostra como os princípios e padrões resolvem problemas reais nesse contexto.

**Público-Alvo:** Developers com 2+ anos de experiência que entendem OOP básico.

**Pré-requisito Essencial:** Lição 1.1 (Engineering vs. Coding - Mentalidade Profissional)

---

## ESTRUTURA DE LIÇÕES

### LIÇÃO 7.1: Single Responsibility Principle (SRP)
**Status:** ✅ COMPLETO  
**Duração:** 200 minutos (~3h 20min)  
**Arquivo Markdown:** `public/lesson-7-1-srp.md`  
**Arquivo JSON:** `public/lesson-7-1-srp.json`

#### Objetivos de Aprendizado
- Entender a definição rigorosa de SRP: "uma classe deve ter uma razão para mudar"
- Identificar violações em código real (sinais de alerta: Manager, Processor, testes complexos)
- Refatorar código acoplado em componentes especializados
- Aplicar em contexto real (LessonManager → LessonRepository, LessonValidator, etc.)
- Entender trade-offs (quando separar, quando manter junto)

#### Conteúdo
1. **Introdução** - Por que SRP importa em escala (15 min)
2. **Definição Rigorosa** - "Uma classe, uma razão para mudar" (20 min)
3. **Identificando Violações** - Red flags e padrões de problema (25 min)
4. **Aplicando SRP** - Refatoração passo a passo (20 min)
5. **Trade-offs e Contexto** - Quando não separar (15 min)
6. **Padrões Práticos** - Repository, Service, Validator, Mapper (20 min)

#### Exercícios
- 5 questões variadas (multiple choice, code review, short answer)
- 1 exercício prático: Refatore LessonManager em 5 classes especializadas

#### Exemplos de Código
- UserManager (violação) → UserService (refatorado)
- PaymentProcessor (5 responsabilidades) → separado
- Testabilidade antes vs. depois
- Trade-offs: prototipagem, classes pequenas, conceitos acoplados

---

### LIÇÃO 7.2: SOLID Principles - Open/Closed, Liskov, Interface, Dependency Inversion
**Status:** ⏳ PLANEJADO  
**Duração:** 250 minutos (~4h 10min)  
**Arquivos:** `public/lesson-7-2-oclid.md` + `.json`

#### Objetivos de Aprendizado
- **Open/Closed (OCP):** Aberto para extensão, fechado para modificação. Adicionar novo tipo sem editar código.
- **Liskov Substitution (LSP):** Subclasses devem ser substituíveis. Quando herança quebra SRP.
- **Interface Segregation (ISP):** Não force implementação de métodos não usados. Interfaces pequenas e focadas.
- **Dependency Inversion (DIP):** Dependa de abstrações, não de implementações concretas.

#### Estrutura Planejada
1. **Open/Closed Principle** (50 min)
   - Estratégia vs. If-Else gigante
   - Factory Pattern como solução
   - Exemplo: ExerciseGrader (MultipleChoice, Essay, Code)

2. **Liskov Substitution** (50 min)
   - Contrato de subclasses
   - Quando herança quebra
   - Square é um Rectangle? (problema clássico)

3. **Interface Segregation** (50 min)
   - Interfaces gordas vs. focadas
   - Exemplo: PaymentProcessor (Card, Bank, Crypto)
   - Cliente só implementa o que precisa

4. **Dependency Inversion** (80 min)
   - IoC (Inversion of Control)
   - Dependency Injection (DI)
   - Service Locator vs. Constructor Injection
   - Exemplo: AiTutorService com múltiplos provedores

5. **Síntese:** Como SOLID se complementa (20 min)

#### Exercícios
- 5+ questões (design decisions, code review)
- Prático: Adicionar novo tipo de exercício sem editar código existente

---

### LIÇÃO 7.3: Creational Design Patterns
**Status:** ⏳ PLANEJADO  
**Duração:** 250 minutos (~4h 10min)  
**Arquivos:** `public/lesson-7-3-creational-patterns.md` + `.json`

#### Padrões Cobertos
1. **Singleton Pattern** (40 min)
   - Instância única garantida
   - Problema: Acoplamento global
   - Solução: Dependency Injection

2. **Factory Pattern** (60 min)
   - Simple Factory
   - Factory Method
   - Abstract Factory
   - Exemplo: ExerciseFactory (MultipleChoice, Essay, Code)

3. **Builder Pattern** (70 min)
   - Construir objetos complexos passo a passo
   - Versão fluente
   - Exemplo: QueryBuilder, LessonBuilder

4. **Prototype Pattern** (40 min)
   - Clonar objetos
   - Deep vs. Shallow copy
   - Exemplo: Duplicar lição com todas as configurações

5. **Síntese e Trade-offs** (40 min)

#### Exercícios
- 5+ questões (when to use, trade-offs)
- Prático: Implementar Factory para criar diferentes tipos de exercícios

---

### LIÇÃO 7.4: Structural & Behavioral Design Patterns
**Status:** ⏳ PLANEJADO  
**Duração:** 250 minutos (~4h 10min)  
**Arquivos:** `public/lesson-7-4-structural-behavioral.md` + `.json`

#### Structural Patterns (120 min)
1. **Adapter Pattern** (30 min)
   - Compatibilizar interfaces diferentes
   - Exemplo: Integrar novo provedor de IA (OpenAI, Claude, Gemini)

2. **Decorator Pattern** (40 min)
   - Adicionar comportamento dinamicamente
   - Exemplo: AiTutorService com cache, retry, rate limiting

3. **Facade Pattern** (30 min)
   - Simplificar interface complexa
   - Exemplo: LessonFacade (coordena repository, validator, analytics)

4. **Proxy Pattern** (20 min)
   - Controlar acesso (lazy loading, cache, logging)

#### Behavioral Patterns (100 min)
1. **Strategy Pattern** (30 min)
   - Algoritmo intercambiável
   - Exemplo: GradingStrategy (MultipleChoice vs. Essay)

2. **Observer/Pub-Sub Pattern** (30 min)
   - Notificação de eventos
   - Exemplo: LessonCompleted → dispara e-mail, analytics, certificado

3. **Command Pattern** (20 min)
   - Encapsular ação como objeto
   - Exemplo: Undo/Redo para edição de lição

4. **State Pattern** (20 min)
   - Comportamento muda com estado
   - Exemplo: LessonState (Draft, Published, Archived)

#### Exercícios
- 5+ questões (pattern selection, trade-offs)
- Prático: Implementar Observer para eventos de lição

---

### LIÇÃO 7.5: Domain-Driven Design (DDD)
**Status:** ⏳ PLANEJADO  
**Duração:** 250 minutos (~4h 10min)  
**Arquivos:** `public/lesson-7-5-ddd.md` + `.json`

#### Conceitos Cobertos
1. **Ubiquitous Language** (40 min)
   - Linguagem comum entre negócio e código
   - Exemplo: "Lição", "Pré-requisito", "Completada" no código e na conversa

2. **Entities e Value Objects** (60 min)
   - Entity: identidade única (Lesson, Student)
   - Value Object: igualdade por valor (Score, Progress)
   - Exemplo: LessonProgress é Value Object, não Entity

3. **Aggregates** (50 min)
   - Agrupar entidades com raiz agregada
   - Exemplo: Lesson (raiz) + Exercise (filho)
   - Limites de transação

4. **Domain Events** (60 min)
   - Eventos como fatos importantes
   - LessonCompleted, ScoreRecalculated
   - Event Sourcing introdução

5. **Bounded Contexts** (40 min)
   - Delimitar domínios (Learning, Billing, Notification)
   - Anti-Corruption Layer

#### Exercícios
- 5+ questões (model design, bounded contexts)
- Prático: Modelar agregates para sistema educacional

---

### LIÇÃO 7.6: Refactoring Profundo
**Status:** ⏳ PLANEJADO  
**Duração:** 200 minutos (~3h 20min)  
**Arquivos:** `public/lesson-7-6-refactoring.md` + `.json`

#### Técnicas de Refactoring
1. **Extract Method** (30 min)
   - Dividir método grande em métodos menores
   - Saúde do método: máximo 15 linhas

2. **Move Method** (30 min)
   - Mover método para classe mais apropriada
   - Reduzir acoplamento

3. **Extract Class** (40 min)
   - Dividir classe grande
   - Exemplo: LessonManager → 5 classes

4. **Replace Temp with Query** (20 min)
   - Remover variáveis temporárias
   - Melhorar legibilidade

5. **Introduce Parameter Object** (20 min)
   - Agrupar parâmetros relacionados
   - Exemplo: CreateLessonDTO

6. **Refactoring com Testes** (40 min)
   - TDD Red-Green-Refactor
   - Refactoring de forma segura
   - Golden Master testing

#### Exercícios
- 5+ questões (refactoring decisions)
- Prático: Refatore código real aplicando múltiplas técnicas

---

## DEPENDÊNCIAS E SEQUÊNCIA RECOMENDADA

```
Lição 1.1 (Engineering vs. Coding)
    ↓
Lição 7.1 (SRP) ← COMPLETO
    ↓
Lição 7.2 (O, L, I, D)
    ↓
Lição 7.3 (Creational Patterns)
    ↓
Lição 7.4 (Structural/Behavioral Patterns)
    ↓
Lição 7.5 (DDD)
    ↓
Lição 7.6 (Refactoring)
```

**Nota:** Lições 7.3 e 7.4 podem ser alternadas, mas 7.2 deve vir após 7.1.

---

## PADRÃO DE CONTEÚDO POR LIÇÃO

Cada lição segue este padrão (validado em Lição 1.1 e 7.1):

### Estrutura Markdown
1. **SEÇÃO 1:** Introdução e motivação (15-20 min)
2. **SEÇÃO 2-4:** Conceitos profundos com exemplos (60-100 min)
3. **SEÇÃO 5:** Trade-offs e contexto (15-20 min)
4. **SEÇÃO 6:** Padrões práticos e síntese (20-30 min)
5. **RESUMO:** Checklist e próximos passos

### Estrutura JSON
- `lesson_id`, `module`, `title`, `description`
- `duration_minutes`, `target_audience`, `learning_objectives`
- `content_sections` (com `key_points`)
- `examples` (4-5 exemplos de código/diagramas)
- `exercises` (5 questões variadas + 1 prático)
- `practical_exercise` (com hints e expected output)
- `summary` (key takeaways, next lesson, estimated time to master)

### Tipos de Exercício
- **multiple_choice:** 4 opções, resposta única
- **short_answer:** resposta dissertativa, esperada ~ 1-2 frases
- **code_review:** revisar código, identificar problema
- **prediction:** prever resultado ou consequência
- **practical:** implementar, refatorar, ou resolver problema

### Quantidade de Exemplos
- 4-5 exemplos por lição
- Mínimo: Antes/Depois
- Máximo: Antes/Depois + Variação + Trade-off + Contexto Real

---

## CONTEXTO UNIFICADOR

Todas as lições usam a **plataforma educacional com tutor de IA** como contexto unificador:

- **Lição 7.1:** UserManager → UserService (SRP)
- **Lição 7.2:** ExerciseGrader → Strategy com Factory (OCP)
- **Lição 7.3:** ExerciseFactory, LessonBuilder (Creational)
- **Lição 7.4:** AiTutorService com Decorator, LessonCompleted events (Structural/Behavioral)
- **Lição 7.5:** Lesson aggregate, LessonCompleted event, bounded contexts (DDD)
- **Lição 7.6:** Refatore sistema inteiro com técnicas aprendidas

Isso cria um fio narrativo: começamos com uma classe grande e acoplada (UserManager), aplicamos SRP, depois OCP, depois patterns, depois DDD, e finalmente refatoramos tudo junto.

---

## CONTAGEM DE CONTEÚDO

| Lição | Duração | Seções | Exemplos | Exercícios | Status |
|-------|---------|--------|----------|-----------|--------|
| 7.1   | 200 min | 6      | 5        | 5 + prático | ✅ COMPLETO |
| 7.2   | 250 min | 5      | 5+       | 5 + prático | ⏳ Próxima |
| 7.3   | 250 min | 5      | 5+       | 5 + prático | ⏳ Planejado |
| 7.4   | 250 min | 6      | 5+       | 5 + prático | ⏳ Planejado |
| 7.5   | 250 min | 5      | 5+       | 5 + prático | ⏳ Planejado |
| 7.6   | 200 min | 6      | 5+       | 5 + prático | ⏳ Planejado |
| **TOTAL** | **1400 min (23h)** | **33** | **30+** | **30+ questões** | - |

---

## PRÓXIMOS PASSOS

### Imediato (Hoje - 27/09)
- [x] Criar Lição 7.1 (SRP) - Markdown + JSON
- [ ] Validar renderização em LMS
- [ ] Feedback da estrutura

### Curto Prazo (Próximas 48h)
- [ ] Criar Lição 7.2 (O, L, I, D)
- [ ] Criar Lição 7.3 (Creational Patterns)
- [ ] Validar padrão de conteúdo (profundo o suficiente?)

### Médio Prazo (Esta semana)
- [ ] Lições 7.4, 7.5, 7.6
- [ ] Integração com UI do LMS
- [ ] Testes de renderização Markdown + JSON
- [ ] Peer review (rigor profissional)

### Longo Prazo
- [ ] Gravar screencasts (opcional)
- [ ] Adicionar diagramas Mermaid (opcional)
- [ ] Integração com banco de dados Prisma

---

## NOTAS IMPORTANTES

1. **Profundidade > Amplitude:** Cada lição explora poucos conceitos, mas profundamente.
2. **Código Real:** Exemplos em TypeScript/JavaScript, padrões práticos aplicáveis hoje.
3. **Trade-offs Explícitos:** Nunca "receita mágica". Sempre "isso é bom quando..." e "evite quando...".
4. **Contexto Unificado:** A plataforma educacional ligará todas as lições.
5. **Português Profissional:** Claro, sem jargão sem explicação.
6. **Rigor:** Cada lição foi revisada para ser ensinável e aplicável.

---

**Última Atualização:** 2026-09-27 (Lição 7.1 completa, estrutura 7.2-7.6 planejada)
