# P0 Tasks - MVP Essencial

## Task P0-001: Project Setup (OpenCode)
**Status**: READY  
**Priority**: P0  
**Worker**: OpenCode/Qwen  

### Objective
Initialize a production-ready Next.js 14+ project with full TypeScript, Tailwind, Prisma setup.

### Deliverables
- [ ] `package.json` with all dependencies
- [ ] Next.js 14+ with App Router
- [ ] TypeScript with strict mode
- [ ] Tailwind CSS configured and working
- [ ] Prisma ORM with SQLite (dev), PostgreSQL ready
- [ ] `.env.example` with required vars
- [ ] `tsconfig.json` strict
- [ ] `prettier` and `eslint` configured
- [ ] `jest` and `react-testing-library` setup
- [ ] Initial project structure created
- [ ] `npm run dev` works without errors
- [ ] `npm run build` succeeds

### Acceptance Criteria
- Project runs on `http://localhost:3000`
- No TypeScript errors
- No linting errors
- Build completes successfully

### Commands Used
```bash
npm create next-app@latest harness-ia --typescript --tailwind --eslint --app
npm install -D prisma @prisma/client
npx prisma init
npm install -D jest @testing-library/react
# ... etc
```

---

## Task P0-002: Authentication Schema & Database (Gemini)
**Status**: BLOCKED (waits for P0-001)  
**Priority**: P0  
**Worker**: Gemini CLI  

### Objective
Create database schema for users, authentication, and course structure. Implement auth API endpoints.

### Deliverables
- [ ] Prisma schema with User, Course, Module, Lesson, Exercise models
- [ ] DB migrations generated
- [ ] NextAuth.js configured
- [ ] `/api/auth/[...nextauth]` endpoint
- [ ] Session handling
- [ ] Protected API middleware
- [ ] TypeScript types for DB entities
- [ ] Database seed script for testing

### Schema Entities
```prisma
- User (id, email, password, createdAt, updatedAt, role)
- Course (id, title, description, moduleCount)
- Module (id, courseId, title, order)
- Lesson (id, moduleId, title, order, content, type)
- Exercise (id, lessonId, type, question, options, correctAnswer)
- UserProgress (userId, lessonId, status, score, attempts)
- UserSkill (userId, skillName, proficiency, lastUpdated)
```

### Acceptance Criteria
- Schema compiles without errors
- Migrations work on fresh DB
- Auth endpoints respond correctly
- Session persists across requests
- Protected routes check auth

---

## Task P0-003: Auth UI & Login/Signup Pages (Codex)
**Status**: BLOCKED (waits for P0-002)  
**Priority**: P0  
**Worker**: Codex  

### Objective
Create beautiful, responsive authentication pages.

### Deliverables
- [ ] `/app/auth/login` page
- [ ] `/app/auth/signup` page
- [ ] `/app/auth/forgot-password` page
- [ ] Form validation with react-hook-form
- [ ] Error messaging
- [ ] Loading states
- [ ] Responsive design (mobile-first)
- [ ] Redirect to dashboard on success

### Design Requirements
- Modern, premium look
- Tailwind CSS (no external CSS)
- Loading skeleton if needed
- Error boundaries
- Accessible (WCAG 2.1 AA)
- Dark mode support (future-proof)

### Acceptance Criteria
- Pages render without errors
- Forms submit and handle errors
- Responsive on mobile, tablet, desktop
- Accessible color contrast
- Password fields masked

---

## Task P0-004: Dashboard Layout (Codex)
**Status**: BLOCKED (waits for P0-001, P0-003)  
**Priority**: P0  
**Worker**: Codex  

### Objective
Create main dashboard/app shell with navigation.

### Deliverables
- [ ] `/app/dashboard` layout component
- [ ] Sidebar navigation
- [ ] Top navigation bar
- [ ] User menu (profile, logout)
- [ ] Responsive layout (mobile menu)
- [ ] Breadcrumb navigation
- [ ] Active route highlighting

### Pages Structure
```
/dashboard
  ├── /courses          # Course list
  ├── /progress         # User progress
  ├── /skills           # Skill tracking
  └── /profile          # User settings
```

### Acceptance Criteria
- Navigation works on all breakpoints
- Responsive sidebar/menu
- User menu functional
- Logout works
- Protected routes check auth

---

## Task P0-005: Course & Module Listing (Codex)
**Status**: BLOCKED (waits for P0-002, P0-004)  
**Priority**: P0  
**Worker**: Codex  

### Objective
Display available courses and modules in a card-based grid.

### Deliverables
- [ ] `/app/dashboard/courses` page
- [ ] Course cards with images
- [ ] Progress bar per course
- [ ] Module count
- [ ] Click to enter course
- [ ] Loading skeleton
- [ ] Empty state
- [ ] Responsive grid (1-4 columns)

### Components
```
CourseCard
  ├── image
  ├── title
  ├── description
  ├── progress bar
  └── module count
```

### Acceptance Criteria
- Courses load from DB
- Cards display correctly
- Click navigates to course
- Mobile responsive
- Images load properly

---

## Task P0-006: Course Structure API (Gemini)
**Status**: BLOCKED (waits for P0-002)  
**Priority**: P0  
**Worker**: Gemini CLI  

### Objective
Create API endpoints for fetching courses, modules, lessons.

### Deliverables
- [ ] `GET /api/courses` - list all courses
- [ ] `GET /api/courses/[id]` - get course with modules
- [ ] `GET /api/modules/[id]` - get module with lessons
- [ ] `GET /api/lessons/[id]` - get lesson with content
- [ ] `GET /api/progress/[userId]` - get user progress
- [ ] `POST /api/progress` - update progress
- [ ] Error handling
- [ ] Type-safe responses

### Response Format
```json
{
  "course": {
    "id": "...",
    "title": "...",
    "description": "...",
    "modules": [
      {
        "id": "...",
        "title": "...",
        "lessons": [
          {
            "id": "...",
            "title": "...",
            "order": 1
          }
        ]
      }
    ]
  }
}
```

### Acceptance Criteria
- All endpoints return correct data
- Error handling works
- Types match frontend
- Pagination ready (even if not used yet)

---

## Task P0-007: Lesson Viewer (Codex)
**Status**: BLOCKED (waits for P0-006)  
**Priority**: P0  
**Worker**: Codex  

### Objective
Create beautiful lesson content viewer.

### Deliverables
- [ ] `/app/dashboard/courses/[courseId]/modules/[moduleId]/lessons/[lessonId]` page
- [ ] Lesson title and description
- [ ] Rich content renderer (markdown or blocks)
- [ ] Video embed support (future)
- [ ] Code blocks with syntax highlighting
- [ ] Progress bar (current lesson in module)
- [ ] Navigation (prev/next lesson)
- [ ] "Complete lesson" button
- [ ] Sidebar with module outline

### Components
```
LessonViewer
  ├── Sidebar (module outline)
  ├── LessonHeader
  ├── LessonContent (markdown renderer)
  ├── CompleteButton
  └── LessonNavigation (prev/next)
```

### Acceptance Criteria
- Lesson content displays correctly
- Markdown renders properly
- Code blocks have syntax highlighting
- Navigation works
- Completion tracked in DB

---

## Task P0-008: Exercise/Quiz Engine (Codex + Gemini)
**Status**: BLOCKED (waits for P0-007)  
**Priority**: P0  
**Worker**: Codex (UI) + Gemini (API)  

### Objective
Create exercise/quiz functionality.

### Deliverables (Codex)
- [ ] `/app/dashboard/.../exercises/[exerciseId]` page
- [ ] Question renderer
- [ ] Multiple choice UI
- [ ] Text input for answers
- [ ] Code input (syntax highlighting)
- [ ] Submit button
- [ ] Loading state during submission
- [ ] Feedback display (correct/incorrect)
- [ ] Hint system
- [ ] Show correct answer option

### Deliverables (Gemini)
- [ ] `POST /api/exercises/[id]/submit` endpoint
- [ ] Answer validation logic
- [ ] Score calculation
- [ ] Hint retrieval
- [ ] Attempt tracking
- [ ] Feedback generation

### Exercise Types
```
- MultipleChoice
- ShortAnswer
- CodePrediction (choose output)
- Debugging (fix the code)
- FreeForm (open-ended)
```

### Acceptance Criteria
- Exercises load and display
- Answers submit correctly
- Feedback shows immediately
- Score calculated
- Progress saved

---

## Task P0-009: Module 1 Content (Content Team - AI Generated)
**Status**: READY  
**Priority**: P0  
**Worker**: Codex/Gemini (for seeding)  

### Objective
Create real, pedagogically sound content for Module 1.

### Deliverables
```
Module 1: Fundação de Engenharia

Lesson 1: Arquitetura de Sistemas
  ├── Conteúdo: Introdução (800 words)
  ├── Exemplo: Diagrama C4
  ├── Quiz: 3 perguntas
  └── Exercise: Prediction (escolher componente)

Lesson 2: Padrões de Design
  ├── Conteúdo: Design patterns (1000 words)
  ├── Exemplos: MVC, Singleton, Factory
  ├── Quiz: 3 perguntas
  └── Exercise: Debugging (completar padrão)

Lesson 3: Boas Práticas
  ├── Conteúdo: Best practices (800 words)
  ├── Exemplos: SOLID, DRY, KISS
  ├── Quiz: 3 perguntas
  └── Exercise: Code review (avaliar código)

Lesson 4: Projeto Prático
  ├── Briefing: Build a tiny app
  ├── Rubric: 5 critérios
  ├── Submission: Git link or code
  └── Feedback: Auto + AI tutor
```

### Content Must Include
- Real examples
- Diagrams (ASCII or SVG)
- Code snippets
- Clear learning objectives
- Progressive difficulty

### Acceptance Criteria
- All lessons have content
- Images/diagrams render
- Quizzes work
- Exercises have clear prompts
- Rubric is clear

---

## Task P0-010: Progress Tracking & Persistence (Gemini)
**Status**: BLOCKED (waits for P0-008)  
**Priority**: P0  
**Worker**: Gemini CLI  

### Objective
Ensure all user progress is saved and retrievable.

### Deliverables
- [ ] Lesson completion tracking
- [ ] Exercise score tracking
- [ ] Module completion calculation
- [ ] Skill proficiency updates
- [ ] Session persistence
- [ ] Auto-save on exercise submit
- [ ] Progress API endpoints
- [ ] Dashboard stats calculation

### Tracked Metrics
```
- Lessons completed per module
- Exercises attempted/passed
- Current skill level per domain
- Time spent per lesson (future)
- Accuracy per exercise type
```

### Acceptance Criteria
- Progress persists across sessions
- Stats update correctly
- Dashboard shows accurate progress
- No data loss on browser crash

---

## Dependency Graph

```
P0-001 (Setup)
  ├─→ P0-002 (Auth DB)
  │    ├─→ P0-003 (Auth UI)
  │    └─→ P0-004 (Dashboard Layout)
  │         ├─→ P0-005 (Course Listing)
  │         └─→ P0-006 (Course API) ────┐
  │              ├─→ P0-007 (Lesson UI) ┤ P0-008 (Exercises)
  │              └─→ P0-008 (Exercise)  ┤
  │                   └─→ P0-010 (Progress)
  │
  └─→ P0-009 (Module 1 Content - PARALLEL)
```

## Parallelism Opportunity

Can start in parallel after P0-001:
- **Stream A**: OpenCode → Gemini (Auth + DB) → Gemini (APIs)
- **Stream B**: Codex (Auth UI) → Codex (Dashboard) → Codex (Lessons) → Codex (Exercises)
- **Stream C**: Content creation (AI generated) and Module 1 seeding

---

## Current Status

```
✅ P0-001: READY (assigned to OpenCode)
⏳ P0-002: BLOCKED (waiting for P0-001)
⏳ P0-003: BLOCKED (waiting for P0-002)
⏳ P0-004: BLOCKED (waiting for P0-001)
⏳ P0-005: BLOCKED (waiting for P0-004, P0-002)
⏳ P0-006: BLOCKED (waiting for P0-002)
⏳ P0-007: BLOCKED (waiting for P0-006)
⏳ P0-008: BLOCKED (waiting for P0-007)
✅ P0-009: READY (can start anytime, independent)
⏳ P0-010: BLOCKED (waiting for P0-008)
```

## Next Action

**Dispatch P0-001 to OpenCode NOW** (doesn't block anything)  
**Dispatch P0-009 to Codex/Content NOW** (independent)

After P0-001 completes:
- Dispatch P0-002 to Gemini
- Dispatch P0-004 to Codex
- Dispatch P0-009 content seeding to Gemini

---

**Created**: 2026-09-26  
**Next Review**: After P0-001 completion
