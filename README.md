# Harness IA - Plataforma Educacional com Tutor Inteligente

## Visão Geral

Plataforma educacional moderna que integra:
- **Cursos estruturados** em módulos e aulas
- **Exercises interativos** (quizzes, código, debugging)
- **Tutor IA** contextual para ajudar o aluno
- **Skill tracking** para acompanhar proficiência
- **Progresso persistente** com salve automático
- **Responsivo e moderno** - experiência premium de educação

## Stack

- **Frontend**: Next.js 14+ (React 18+), TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes / Node.js
- **Database**: PostgreSQL ou SQLite (development)
- **Auth**: NextAuth.js
- **ORM**: Prisma
- **Testing**: Jest, React Testing Library
- **CI/CD**: GitHub Actions
- **AI Integration**: OpenAI API (tutor inteligente)

## Estrutura do Projeto

```
.
├── apps/
│   └── web/                    # Next.js application
│       ├── app/               # App router (Next.js 13+)
│       │   ├── auth/
│       │   ├── dashboard/
│       │   ├── courses/
│       │   ├── admin/
│       │   └── api/
│       ├── components/
│       ├── lib/
│       ├── styles/
│       ├── types/
│       └── public/
│
├── packages/
│   ├── database/              # Prisma schema & migrations
│   ├── types/                 # Shared TypeScript types
│   └── config/                # Shared configuration
│
├── docs/
│   ├── ARCHITECTURE.md
│   ├── MODULE_1.md
│   ├── API.md
│   └── DEPLOYMENT.md
│
├── scripts/
│   └── seed.ts               # Database seeding
│
├── package.json
├── tsconfig.json
└── README.md
```

## Módulo 1: Fundação de Engenharia

O MVP focará no **Módulo 1** com conteúdo real sobre:
- Arquitetura de sistemas
- Padrões de design
- Boas práticas de código
- Debugging e troubleshooting
- Projeto contínuo

## Fases de Desenvolvimento

### P0 - MVP Essencial
- ✅ Autenticação básica
- ✅ Estrutura de cursos/módulos/aulas
- ✅ Interface de reprodução de aula
- ✅ Exercise engine (quiz básico)
- ✅ Progress tracking
- ✅ Persistência de dados

### P1 - Experiência Completa
- Tutor IA contextual
- Múltiplos tipos de exercises
- Skill assessment
- Código execution (sandboxed)
- Feedback automático

### P2 - Qualidade & UX
- Mobile responsiveness
- Dark mode
- Performance optimization
- Testes completos
- Analytics básico

### P3 - Polish & Scale
- Design system refinado
- Acessibilidade
- Internacionalização
- Admin panel
- Relatórios pedagógicos

## Como Começar

```bash
# Setup
npm install

# Development
npm run dev

# Test
npm test

# Build
npm run build
```

## Decisões Arquiteturais

Ver `docs/ARCHITECTURE.md` para detalhes sobre:
- Por que Next.js
- Organização de componentes
- Padrões de API
- Estratégia de database
- Integração de IA
- Security & auth flow

## Development Guide

Ver `WORK_PROTOCOL.md` para:
- Como tarefas são organizadas
- Como agentes trabalham
- Como fazer review
- Como integrar
- Como testar

## Roadmap

1. **Semana 1**: MVP do Módulo 1 funcional
2. **Semana 2**: Tutor IA integrado
3. **Semana 3**: Polish e primeira beta
4. **Semana 4**: Feedback e iteração

---

**Maintained by**: Lucas (AI Harness Development)  
**License**: MIT  
**Status**: 🚀 In Active Development
