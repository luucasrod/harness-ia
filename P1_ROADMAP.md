# P1 - Production Ready Phase

## Priority 1: NextAuth Setup (CRITICAL)
- [ ] Create auth config (`app/api/auth/[...nextauth]/route.ts`)
- [ ] Implement credentials provider
- [ ] Fix hardcoded userId=1 → session-based auth
- [ ] Test login/logout flow

## Priority 2: Database Seeding (HIGH)
- [ ] Load real Module 1 content to database
- [ ] Create test user enrollment
- [ ] Initialize progress records

## Priority 3: OpenAI Integration (HIGH)
- [ ] Create tutor service wrapper
- [ ] Add API key configuration
- [ ] Implement chat endpoint (`app/api/ai/chat`)

## Priority 4: E2E Testing (MEDIUM)
- [ ] Create test suite (login → course → exercise)
- [ ] Verify full flow works
- [ ] Fix any remaining TypeScript errors

## Priority 5: Deployment (MEDIUM)
- [ ] Configure Vercel/Railway
- [ ] Set up environment variables
- [ ] Deploy MVP to staging

## Timeline
- P1-001 (NextAuth): ~30 min
- P1-002 (Seeding): ~20 min
- P1-003 (OpenAI): ~30 min
- P1-004 (E2E): ~20 min
- P1-005 (Deploy): ~15 min

**Total**: ~2 hours to production-ready MVP
