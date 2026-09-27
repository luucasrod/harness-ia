# E2E Testing Checklist - Harness IA MVP

**How to Run Tests:**

```bash
# 1. Setup
npm install
npm run db:setup

# 2. Start dev server
npm run dev
# Keep running in terminal 1

# 3. In terminal 2, run tests:
npm test -- __tests__/e2e/complete-flow.test.ts
```

---

## Manual Testing (Visual Verification)

### 1. Authentication Flow ✓
- [ ] Navigate to http://localhost:3000/auth/signup
- [ ] Fill form: Name, Email, Password
- [ ] Click "Criar Conta"
- [ ] Should redirect to /auth/login
- [ ] Log in with new email/password
- [ ] Should redirect to /dashboard

### 2. Dashboard Experience ✓
- [ ] See "Cursos Disponíveis" heading
- [ ] See course cards with:
  - [ ] Course title
  - [ ] Progress bar
  - [ ] Status badge (In Progress / Not Started / Completed)
  - [ ] Lesson count
- [ ] Cards are responsive (scales on mobile/tablet/desktop)

### 3. Course Navigation ✓
- [ ] Click a course card
- [ ] Should show modules and lessons
- [ ] Click on a lesson
- [ ] Should display lesson content (markdown rendered)
- [ ] Sidebar shows lesson outline
- [ ] Can navigate to prev/next lessons

### 4. Lesson Features ✓
- [ ] Lesson content renders with proper formatting
- [ ] Can scroll through content
- [ ] "Marcar como concluído" button visible
- [ ] Click completion button
- [ ] Button shows loading state
- [ ] Page updates to show progress

### 5. Exercise Submission ✓
- [ ] See exercise section in lesson
- [ ] Can submit an answer
- [ ] Receive feedback (or placeholder message)
- [ ] Progress bar updates

### 6. AI Tutor Chat ✓
- [ ] Scroll to bottom of lesson page
- [ ] See tutor chat widget
- [ ] Type a question: "What is architecture?"
- [ ] Click send
- [ ] See loading indicator
- [ ] Tutor responds with helpful message
- [ ] Response includes:
  - [ ] Clear explanation
  - [ ] Relevant to lesson topic
  - [ ] Constructive and encouraging

### 7. Progress Tracking ✓
- [ ] Complete a lesson
- [ ] Check dashboard
- [ ] Course progress bar increases
- [ ] Status updates if all lessons done

### 8. Responsive Design ✓
- [ ] Open DevTools (F12)
- [ ] Toggle Device Toolbar (Ctrl+Shift+M)
- [ ] Test at: 360px (mobile), 768px (tablet), 1200px (desktop)
- [ ] All elements visible and usable at each size
- [ ] Forms are touch-friendly (large inputs)
- [ ] Navigation collapses properly

### 9. Error Handling ✓
- [ ] Try signing up with existing email
- [ ] Should show error message
- [ ] Try accessing course without enrollment
- [ ] Should show 403 or redirect
- [ ] Try asking tutor without API key configured
- [ ] Should show graceful fallback message

### 10. Performance ✓
- [ ] Page loads in < 3 seconds
- [ ] Navigation between lessons is smooth
- [ ] No console errors (F12 → Console)
- [ ] Images load properly
- [ ] Animations are smooth (not janky)

---

## API Testing (Terminal)

```bash
# Test signup
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "name": "Test User",
    "password": "password123"
  }'

# Test login (will fail without session setup)
curl -X POST http://localhost:3000/api/auth/callback/credentials \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@example.com",
    "password": "password123"
  }'

# Test courses endpoint (may require auth cookie)
curl http://localhost:3000/api/courses

# Test tutor (requires auth)
curl -X POST http://localhost:3000/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What is a design pattern?",
    "lessonId": 1
  }'
```

---

## Known Issues & Workarounds

### Issue: "Cannot find module 'next-auth'"
**Fix**: Run `npm install` again to ensure all deps are installed

### Issue: "NEXTAUTH_SECRET not configured"
**Fix**: Already in `.env.local`, should work

### Issue: Tutor returns placeholder message
**Fix**: Add your OpenAI API key to `.env.local`:
```
OPENAI_API_KEY=sk-your-key-here
```

### Issue: Database locked
**Fix**: Delete `prisma/dev.db` and run `npm run db:setup` again

---

## Sign-Off Criteria

**MVP E2E Testing PASSED if:**
- ✅ Can sign up and log in
- ✅ Can view courses and lessons
- ✅ Can submit exercises
- ✅ Tutor responds to questions
- ✅ Progress tracks correctly
- ✅ No console errors
- ✅ Responsive on all sizes
- ✅ All APIs return 200/401/404 (no 500 errors)

**Current Status**: Ready for manual testing  
**Next**: Deploy to staging and collect user feedback

---

**Test Date**: ___________  
**Tester**: ___________  
**Result**: ✅ PASS / ❌ FAIL  
**Issues Found**: _______________________________

