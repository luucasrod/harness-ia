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

### ✅ Completo

1. **Login/Auth** → Dashboard funciona end-to-end
2. **PostgreSQL** → Schema completo, 11 módulos + 28 lições
3. **Enrollment** → Demo user inscrito em Course 1 (via `prisma/add-enrollment.ts`)
4. **API Courses** → `/api/courses/1` retorna `200 OK` com módulos + imageUrls
5. **Imagens** → Todas populadas (Unsplash URLs via `prisma/setup-images-safe.ts`)
6. **Dashboard view** → Módulos aparecem com progresso

### ⚠️ Em Andamento

- **Rotas dinâmicas** → `/dashboard/courses/[courseId]` retorna 404 no Vercel
  - API funciona, problema é rota RSC do Next.js
  - Alternativa: usar navegação via API em vez de rotas
  - **Próx.:** Debugar build Next.js ou corrigir route configuration

### 📊 Dados
- **11 módulos** com imagens temáticas (Unsplash)
- **28 lições** com conteúdo completo
- **Usuário demo:** 75% progresso (6/8 módulos iniciais completados)
- **Imagens:** Todas atualiz. (módulos 2-11), módulo 1 não existe no DB

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
