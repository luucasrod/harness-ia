# TEMPLATE: Estrutura Padrão de Lição
## Para Criação de Lições 7.2-7.6 (e Futuras)

---

## RESUMO EXECUTIVO

Este documento define o padrão estrutural e de qualidade validado pela Lição 7.1. Use como checklist ao criar novas lições.

---

## ESTRUTURA MARKDOWN

```markdown
# LIÇÃO X.Y: [Título Completo]

## SEÇÃO 1: INTRODUÇÃO (15-20 minutos)

### O Problema Real
- Situação concreta que motiva o conceito
- Exemplo que falha sem o princípio/padrão
- Por que isso é importante

### Por Que [Conceito] Importa
- Impacto prático
- Consequências de não aplicar
- Escalabilidade, testabilidade, manutenibilidade

### Objetivo da Lição
- Bulleted list de 4-6 objetivos específicos
- Alcançáveis em 200-250 minutos

---

## SEÇÃO N: [Título Conceitual] (XX minutos)

### Subtítulo 1
Parágrafo explicativo.

```code
Exemplo de código antes/depois
```

### Subtítulo 2
Continuação de conceito.

### Padrão Identificado
Como isso aparece em código real.

---

## SEÇÃO FINAL: SÍNTESE E PADRÕES PRÁTICOS (20-30 minutos)

### Padrões Que Emergem
1. Padrão A: Descrição
2. Padrão B: Descrição

### Checklist de [Conceito]
- [ ] Item 1
- [ ] Item 2
- [ ] Item 3

---

## RESUMO EXECUTIVO

**[Conceito] em Uma Frase:**
Máximo de 15 palavras.

**Sintomas de Violação:**
- Bullet point 1
- Bullet point 2
- Bullet point 3

**Aplicação:**
Passo 1, Passo 2, Passo 3.

**Benefícios:**
- Bullet point 1
- Bullet point 2

**Trade-offs:**
- Quando separar / quando manter junto

**Próximo:**
Ligação com próxima lição.
```

### Diretrizes Markdown

- **Tamanho:** 6,000-9,000 palavras (200-250 min)
- **Seções:** 5-7 seções (intro + 3-5 conceituais + síntese)
- **Exemplos:** 4-5 exemplos de código/diagrama integrados
- **Código:** TypeScript por padrão, comentários explicativos
- **Trade-offs:** Sempre explícitos ("está OK quando...", "evite quando...")
- **Linguagem:** Português profissional, nenhum jargão sem explicação

---

## ESTRUTURA JSON

```json
{
  "lesson_id": "lesson-X-Y-slug",
  "module": X,
  "title": "SOLID - [Conceito] (SIGLA)",
  "description": "Descrição em 1-2 frases. O que o aluno aprenderá.",
  "duration_minutes": 200,
  "target_audience": "Developers com [pré-requisito]",
  "learning_objectives": [
    "Objetivo 1",
    "Objetivo 2",
    "Objetivo 3",
    "Objetivo 4",
    "Objetivo 5"
  ],
  "content_sections": [
    {
      "section_id": "intro",
      "title": "Introdução (15 minutos)",
      "key_points": [
        "Key point 1",
        "Key point 2",
        "Key point 3",
        "Key point 4"
      ]
    },
    {
      "section_id": "section2",
      "title": "[Título] (XX minutos)",
      "key_points": ["..."]
    }
  ],
  "examples": [
    {
      "id": "ex-X-Y-1",
      "title": "Violação: [Exemplo]",
      "description": "Descrição breve do exemplo",
      "code_or_diagram": "Código antes ou diagrama"
    },
    {
      "id": "ex-X-Y-2",
      "title": "Refatoração: [Exemplo]",
      "description": "Descrição breve",
      "code_or_diagram": "Código depois ou solução"
    }
  ],
  "exercises": [
    {
      "id": "ex-X-Y-q1",
      "type": "multiple_choice",
      "question": "Pergunta 1",
      "options": ["A", "B", "C", "D"],
      "correct_answer": "C",
      "explanation": "Por que C está correto"
    },
    {
      "id": "ex-X-Y-q2",
      "type": "code_review",
      "question": "Revise este código: [...]",
      "expected_answer": "Esperado que o aluno identifique...",
      "explanation": "Explicação de por que está errado"
    },
    {
      "id": "ex-X-Y-q3",
      "type": "short_answer",
      "question": "Por que [conceito] importa?",
      "expected_answer": "Resposta esperada em 1-2 frases",
      "explanation": "Contexto e detalhes"
    },
    {
      "id": "ex-X-Y-q4",
      "type": "prediction",
      "question": "Qual será o resultado de [ação]?",
      "expected_answer": "Predição esperada",
      "explanation": "Por que essa será a consequência"
    },
    {
      "id": "ex-X-Y-q5",
      "type": "multiple_choice",
      "question": "Em qual situação [conceito] é apropriado?",
      "options": ["A", "B", "C", "D"],
      "correct_answer": "B",
      "explanation": "Contexto importa"
    }
  ],
  "practical_exercise": {
    "id": "practical-X-Y",
    "title": "Refatore/Implemente [Tarefa]",
    "description": "O que o aluno fará: refatorar código, implementar padrão, etc.",
    "starting_code": "Código de partida (se aplicável)",
    "hints": [
      "Dica 1",
      "Dica 2",
      "Dica 3"
    ],
    "expected_output": "O que esperamos que o aluno entregue",
    "solution_outline": "Resumo da solução (não código completo)"
  },
  "summary": {
    "key_takeaways": [
      "Takeaway 1",
      "Takeaway 2",
      "Takeaway 3",
      "Takeaway 4",
      "Takeaway 5",
      "Takeaway 6"
    ],
    "next_lesson": "7.Y+1 - [Título]",
    "prerequisites_met": [
      "Lição 1.1: Engineering vs. Coding",
      "Lição 7.1: SRP (ou anterior no módulo)"
    ],
    "estimated_time_to_master": "X-Y horas de prática aplicando [conceito]"
  }
}
```

### Diretrizes JSON

- **lesson_id:** `lesson-X-Y-slug` (sempre minúscula, hífens)
- **module:** Número do módulo (7 para Módulo 7)
- **duration_minutes:** 200-250 tipicamente
- **learning_objectives:** 5-6 objetivos específicos, mensuráveis
- **content_sections:** 5-7 seções, cada uma com 3-5 key_points
- **examples:** 4-5 exemplos, mínimo antes/depois
- **exercises:** Exatamente 5 questões variadas
- **practical_exercise:** 1 prático com hints e expected_output
- **summary:** key_takeaways (6), next_lesson, prerequisites, estimated_time

---

## TIPOS DE EXERCÍCIO

### 1. Multiple Choice
```json
{
  "type": "multiple_choice",
  "question": "O que é [Conceito]?",
  "options": ["A", "B", "C", "D"],
  "correct_answer": "B",
  "explanation": "B está correto porque..."
}
```
- 4 opções, 1 correta
- Explicação clara
- Use para: definições, reconhecimento de padrões

### 2. Code Review
```json
{
  "type": "code_review",
  "question": "Revise este código. Qual é o problema?\n\n[código]",
  "expected_answer": "O problema é...",
  "explanation": "Explicação completa"
}
```
- Aluno revisa código
- Identifica problema ou melhoria
- Explicação de por que está errado/certo

### 3. Short Answer
```json
{
  "type": "short_answer",
  "question": "Por que [Conceito] importa?",
  "expected_answer": "Porque...",
  "explanation": "Contexto adicional"
}
```
- Resposta dissertativa breve (1-2 frases)
- Aluno demonstra entendimento conceitual
- Explicação fornece contexto

### 4. Prediction
```json
{
  "type": "prediction",
  "question": "Se você [ação], qual será o resultado?",
  "expected_answer": "Resultado esperado",
  "explanation": "Por que esse resultado"
}
```
- Aluno prevê consequência
- Demonstra pensamento crítico
- Explicação mostra causalidade

### 5. Practical Exercise
```json
{
  "practical_exercise": {
    "title": "Refatore/Implemente [Tarefa]",
    "description": "O aluno fará...",
    "starting_code": "Código inicial",
    "hints": ["Dica 1", "Dica 2"],
    "expected_output": "O que esperamos",
    "solution_outline": "Como resolver"
  }
}
```
- Aplicação prática
- Hints guiam sem resolver
- Solution outline (não código completo)

---

## QUALIDADE: CHECKLIST POR LIÇÃO

### Antes de Publicar

- [ ] **Conteúdo**
  - [ ] 5-7 seções (intro + conceituais + síntese)
  - [ ] 6,000-9,000 palavras
  - [ ] 4-5 exemplos de código integrados
  - [ ] Trade-offs explícitos em cada seção

- [ ] **Código**
  - [ ] TypeScript moderno (TS 4.9+)
  - [ ] Padrões aplicáveis hoje
  - [ ] Sempre antes/depois quando possível
  - [ ] Comentários explicativos

- [ ] **Exercícios**
  - [ ] 5 questões variadas (types diferentes)
  - [ ] 1 prático com hints
  - [ ] Respostas esperadas claras
  - [ ] Explicações pedagógicas

- [ ] **Formato**
  - [ ] Markdown legível (headers, listas, código)
  - [ ] JSON válido (sem erros de sintaxe)
  - [ ] Nenhum lorem ipsum ou placeholder

- [ ] **Português**
  - [ ] Profissional (sem coloquialismo)
  - [ ] Claro (sem jargão sem explicação)
  - [ ] Sem erros de ortografia/gramática

- [ ] **Pedagogia**
  - [ ] Objetivos claros (o que aluno aprenderá)
  - [ ] Contexto real (plataforma educacional)
  - [ ] Profundidade apropriada (200-250 min)
  - [ ] Próximo passo claro (qual lição vem depois)

- [ ] **Validação**
  - [ ] Renderização Markdown (sem erros)
  - [ ] JSON válido contra schema
  - [ ] Exercícios testáveis
  - [ ] Peer review (outro especialista)

---

## PADRÃO DE NOMES

### Arquivos

- **Markdown:** `public/lesson-X-Y-slug.md`
  - Exemplo: `public/lesson-7-1-srp.md`
  - slug = primeiras 1-2 palavras-chave em lowercase, hífens

- **JSON:** `public/lesson-X-Y-slug.json`
  - Exemplo: `public/lesson-7-1-srp.json`
  - Mesmo slug do Markdown

- **ID da Lição:** `lesson-X-Y-slug` (no JSON)
  - Deve coincidir com arquivo

### IDs de Exercício

```
ex-X-Y-1, ex-X-Y-2, ..., ex-X-Y-5 (questões)
practical-X-Y (prático)
```

---

## CONTEXTO UNIFICADOR

Todas as lições do Módulo 7 devem referenciar **plataforma educacional com tutor de IA**. Use esse contexto para:

- Tornar exemplos reais
- Conectar conceitos entre lições
- Demonstrar como padrões se complementam

**Elementos Reutilizados:**
- User, Lesson, Exercise, Student
- LessonManager, UserManager, ExerciseGrader (começam acoplados)
- AiTutorService, LessonAnalyticsService, ProgressTracker
- Eventos: LessonCompleted, ScoreRecalculated, ExerciseSubmitted

---

## PRÓXIMA LIÇÃO: 7.2 (Open/Closed, Liskov, Interface, Dependency Inversion)

### Estrutura Esperada

**Duração:** 250 minutos  
**Seções:** 5 (Open/Closed, Liskov, Interface Segregation, Dependency Inversion, Síntese)  
**Exemplos:** 5-6 (ExerciseGrader strategy, payment processors, AI providers)  
**Exercícios:** 5 questões variadas + 1 prático

### Fio Narrativo

Lição 7.1 separa responsabilidades (UserManager → UserService). Lição 7.2 adiciona flexibilidade:
- **OCP:** ExerciseGrader com novos tipos sem modificar código
- **DIP:** AiTutorService com múltiplos provedores de IA

---

## RECURSOS E REFERÊNCIAS

- **Bob Martin SOLID:** https://en.wikipedia.org/wiki/SOLID
- **Design Patterns:** Gang of Four (1994)
- **Clean Code:** Robert Martin (2008)
- **Refactoring:** Martin Fowler (2018)
- **TypeScript Handbook:** https://www.typescriptlang.org/docs/

---

## DÚVIDAS FREQUENTES

### "Quanto deve ter de código?"
Mínimo 40% do Markdown deve ser código/diagrama. Máximo 50%. Resto é prosa explicativa.

### "Qual é o tom certo?"
Profissional, didático, nunca condescendente. Assume que o leitor é competente mas novo no conceito.

### "Posso usar diagrama em vez de código?"
Sim, para concepts de alto nível. Mas sempre mostre código TypeScript também.

### "E se o prático for muito difícil?"
Use hints generosos. Objetivo é aprender, não testar limites.

### "Como valido a qualidade?"
Use o checklist acima. Depois faça peer review com outro especialista.

---

**Última Atualização:** 2026-09-27  
**Versão:** 1.0  
**Status:** Template Finalizado
