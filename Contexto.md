# Harness IA - Contexto do Projeto

**Data:** 2026-09-30  
**Status:** Em produção (Neon PostgreSQL + Vercel)  
**URL Production:** https://harness-ia-psi.vercel.app

## Decisões Técnicas

### Database
- **Provider:** Neon PostgreSQL (antes: SQLite)
- **Razão:** Vercel não persiste arquivos; PostgreSQL é persistente
- **Connection:** `DATABASE_URL` (env var em Vercel)

### Auth
- **Provider:** NextAuth com Credentials
- **Admin Test:** demo@example.com / harness@123
- **Hash:** bcryptjs

## Status Atual

### ✅ Completo (2026-09-30)

1. **Login/Auth** → Dashboard funciona end-to-end
2. **PostgreSQL** → Schema completo, 11 módulos + **58 lições**
3. **Enrollment** → Demo user inscrito em Course 1 (via `prisma/add-enrollment.ts`)
4. **API Courses** → `/api/courses/1` retorna `200 OK` com módulos + imageUrls
5. **Imagens** → Todas populadas (Unsplash URLs via `prisma/setup-images-safe.ts`)
6. **Dashboard view** → Módulos aparecem com progresso real
7. **Rotas dinâmicas** → `/dashboard/courses/[courseId]/modules/[moduleId]/lessons/[lessonId]` funciona em produção ✓
   - Movido `app/(dashboard)/dashboard/` → `app/dashboard/` (fora do layout group)
   - Rotas agora servem em `/dashboard/*` corretamente
   - Navegação Cursos → Módulos → Lições funciona 100%
8. **Lições completas** → Módulos 7-12 populados (Codex, 2026-09-30 07:34)
   - 30 aulas novas criadas: 5 por módulo vazio
   - Cada aula com título, conteúdo, duração (35-55min), type e order
9. **Marcação de conclusão** → Botão "Marcar como concluída" funciona
   - Progress updates refletem em tempo real no dashboard
   - Testado: Aula 1 do Módulo 7 → 20% progresso (1/5)

### 📊 Dados
- **11 módulos** com imagens temáticas (Unsplash)
- **58 lições** com conteúdo completo em português
  - Módulos 2-6: 5-6 lições cada (já existentes)
  - Módulos 7-12: 5 lições cada (criadas 2026-09-30)
- **Usuário demo:** Progresso rastreado corretamente
- **Imagens:** Todas atualiz. (módulos 2-11)

## Scripts Criados

- `prisma/add-enrollment.ts` → Enrola usuário em course
- `prisma/setup-images-safe.ts` → Atualiza imageUrls (seguro, pula missing)

## Próximos Passos

1. Debugar `/dashboard/courses/[courseId]` 404 (Next.js routing)
2. Testar navegação via cliques em módulos (deve usar API corretamente)
3. Opcionalmente: pré-render rotas dinâmicas em build

## Commits

- `e706040` - Refactor module route to shared Prisma client
- `cd824ca` - Add enrollment and image setup scripts
- `(master merged)` - Consolidation to master branch
