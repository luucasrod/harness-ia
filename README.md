# Harness IA - Plataforma Educacional Adaptativa com Tutor Inteligente

## Visão Geral

Plataforma educacional premium de código aberto que ensina **Programação e Engenharia de Software** com IA como multiplicador.

**Objetivo**: Levar alunos de "consigo pedir código pra IA" para "consigo construir, entender, revisar, debugar e colocar software em produção com IA".

**Primeiro beta**: O criador da plataforma é o primeiro usuário, fazendo o Módulo 1.

## Stack

- **Frontend**: Next.js 14+ (App Router), React 18+, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL (prod), SQLite (dev)
- **ORM**: Prisma
- **Auth**: NextAuth.js
- **AI**: OpenAI API (tutor contextual)
- **Testing**: Jest, React Testing Library
- **CI/CD**: GitHub Actions (later)

## Princípios Pedagógicos

### 1. Evitar Paredes de Texto
Priorizar visual → intuição → explicação → exemplo → pergunta → prática → feedback → aplicação

### 2. Interação Constante
Aluno deve **fazer**, não apenas consumir passivamente

### 3. Conteúdo Visual-First
Diagramas, fluxogramas, animações simples, exemplos reais

### 4. IA na Educação
- Aluno **pode** usar IA
- Plataforma testa compreensão além da sintaxe
- Tutor IA conhece contexto pedagógico do aluno
- Comportamento socráxico: pergunta → dica → progressão gradual

### 5. Aprendizagem Real
Não usar toy examples. Conectar com software real.

## MVP - Estrutura

### Dashboard
```
CONTINUE APRENDENDO
[Módulo atual com capa + progresso]

MÓDULOS DISPONÍVEIS
[Módulo 1] 82% ███████░░
[Módulo 2] 🔒 LOCKED
...
```

### Aula
```
SIDEBAR (Outline do Módulo)
    ↓
CONTEÚDO (Visual-rich, blocos pedagógicos)
    ↓
TUTOR IA (Persistente, contextual)
```

### Blocos Pedagógicos
- [ENTENDA] - Explicação visual
- [VEJA] - Exemplo
- [PREVEJA] - Predição
- [EXECUTE] - Código executável
- [POR QUÊ?] - Pergunta conceitual
- [COMPARE] - Lado a lado
- [QUEBRE] - Modificar propositalmente
- [DEBUG] - Encontrar problema
- [FAÇA VOCÊ MESMO] - Exercício
- [USE IA] - Permissão explícita
- [PROVE] - Perguntas sobre código com IA
- [DESAFIO] - Problema maior
- [RECAP] - Resumo visual

## Módulo 1: Fundamentos de Engenharia

**Tema**: Arquitetura, padrões, boas práticas, debugging, projeto contínuo

**Duração**: ~8-12 horas (estimado)

**Conteúdo Real**:
1. Arquitetura de Sistemas
2. Padrões de Design
3. Boas Práticas de Código
4. Debugging & Troubleshooting
5. Projeto Contínuo (Task Manager em Python)

**Exercícios**: Quizzes, predições, debugging, code review, projeto

**Tutor IA**: Conhece progresso, aulas feitas, erros recentes, conceitos fracos → feedback contextual

## Critério de MVP

Aluno consegue:
1. ✅ Criar conta / entrar
2. ✅ Ver curso + módulos
3. ✅ Abrir Módulo 1
4. ✅ Abrir aula
5. ✅ Consumir conteúdo visual
6. ✅ Responder quiz
7. ✅ Executar exercício
8. ✅ Errar & receber feedback
9. ✅ Pedir ajuda à IA
10. ✅ Receber dica contextual
11. ✅ Concluir aula & progresso salvo
12. ✅ Sair e voltar & continuar
13. ✅ Ver competências evoluindo
14. ✅ Fazer projeto contínuo
15. ✅ Enviar feedback beta

## Experiência Visual

- **Premium**: Moderno, adulto, tecnológico, bem acabado
- **NÃO**: Projeto escolar, boilerplate, dashboard admin, claramente IA gerado
- **Referência conceitual**: Hotmart (organização), mas design próprio

## Roadmap (Futuro)

| Módulo | Tema |
|--------|------|
| 1 | Fundação de Engenharia ✅ (MVP) |
| 2 | Git & GitHub |
| 3 | Web, HTTP, APIs |
| 4 | SQL & Databases |
| 5 | Testes & QA |
| 6 | Linux & Terminal |
| 7 | Docker |
| 8 | CI/CD |
| 9 | Cloud & Deploy |
| 10 | LLMs & APIs de IA |
| 11 | RAG & Vectors |
| 12 | AI Agents |
| 13 | Tool Use & MCP |
| 14 | Production Systems |
| 15 | Final Project |
| 16 | Capstone |

**Importante**: Arquitetura deve permitir adicionar módulos sem reconstruir plataforma.

## Estrutura do Repositório

```
.
├── app/                       # Next.js App Router
│   ├── (auth)/               # Public routes
│   │   ├── login/
│   │   ├── signup/
│   │   └── layout.tsx
│   ├── (dashboard)/          # Protected routes
│   │   ├── dashboard/        # Home
│   │   ├── courses/          # Course list & view
│   │   ├── lessons/          # Lesson viewer
│   │   ├── exercises/        # Exercise/quiz engine
│   │   ├── progress/         # Progress tracking
│   │   ├── skills/           # Skill assessment
│   │   └── layout.tsx        # Protected layout
│   ├── api/                  # API routes
│   │   ├── auth/
│   │   ├── courses/
│   │   ├── lessons/
│   │   ├── exercises/
│   │   ├── progress/
│   │   ├── skills/
│   │   └── ai/
│   ├── components/           # Reusable React components
│   ├── lib/                  # Utilities, helpers, Prisma client
│   ├── types/                # TypeScript types
│   └── styles/               # Global CSS
│
├── prisma/
│   ├── schema.prisma         # Database schema
│   └── migrations/           # Database migrations
│
├── public/                   # Static assets, content JSON
│   └── module-1-content.json # Curated Module 1 content
│
├── docs/
│   ├── ARCHITECTURE.md       # Technical architecture
│   ├── MODULE_1.md           # Pedagogy & content spec
│   └── API.md                # API documentation
│
├── __tests__/                # Tests
├── package.json
├── tsconfig.json
├── next.config.ts
├── tailwind.config.ts
└── README.md
```

## Getting Started

### Setup
```bash
# Clone & install
git clone <repo>
cd harness-ia
npm install

# Setup database
npx prisma migrate dev
npx prisma db seed

# Development
npm run dev
# Open http://localhost:3000
```

### Database
```bash
# Create migration after schema change
npx prisma migrate dev --name <description>

# View data
npx prisma studio
```

### Testing
```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## Development Workflow

**P0 (MVP Must-Have)**:
- [x] Project setup
- [ ] Auth (login/signup)
- [ ] Dashboard layout
- [ ] Course structure
- [ ] Lesson viewer
- [ ] Exercise engine
- [ ] Progress tracking
- [ ] Module 1 content
- [ ] Tutor IA (contextual)

**P1 (Experience)**:
- Skill tracking
- Code execution
- Mobile polish
- Analytics basics

**P2 (Quality)**:
- Test coverage
- Performance
- Accessibility
- Responsive design

**P3 (Polish)**:
- Design refinement
- Animations
- Dark mode toggle
- Internationalization

## Autonomy Mode

This project runs with **autonomous CLI workers** (Codex, Gemini, OpenCode) coordinated by Claude Haiku.

- Code pushed to feature branches automatically
- Reviews done by Claude before merging
- No human approval needed for reversible decisions

## Contributing

Contributions welcome. See `WORK_PROTOCOL.md` for development guidelines.

## License

MIT

---

**Status**: 🚀 P0-001 Complete - Setup Ready  
**Next**: P0-002 (Auth Database) + P0-004 (Dashboard) in parallel  
**Target MVP**: September 27, 2026

Built with ❤️ for people learning engineering with AI
