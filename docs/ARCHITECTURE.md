# Architecture - Harness IA Platform

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    STUDENT FACING                           │
│  (React/Next.js: Auth, Courses, Lessons, Exercises)        │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   API LAYER                                 │
│  (Next.js API Routes: /api/auth, /api/courses, /api/ai)    │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                 BUSINESS LOGIC                              │
│  (Prisma models, auth, progress calculation, AI context)   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   DATABASE                                  │
│  (PostgreSQL/SQLite: users, courses, progress, skills)     │
└─────────────────────────────────────────────────────────────┘
```

## Technology Decisions

### Frontend: Next.js 14+ (App Router)

**Why Next.js?**
- Server components for performance (SSR by default)
- API routes eliminate need for separate backend
- TypeScript built-in
- Deployment simplicity (Vercel, Railway, etc)
- File-based routing (no router config)
- Built-in image optimization
- Modern DX (fast refresh, turbopack)

**Architecture**:
```
app/
  ├── (auth)/                    # Auth layout group
  │   ├── login/page.tsx
  │   ├── signup/page.tsx
  │   └── layout.tsx
  ├── (dashboard)/               # Protected layout group
  │   ├── dashboard/page.tsx
  │   ├── courses/
  │   │   ├── page.tsx           # Course list
  │   │   └── [courseId]/
  │   │       └── modules/[moduleId]/
  │   │           └── lessons/[lessonId]/
  │   │               ├── page.tsx
  │   │               └── exercises/[exerciseId]/
  │   └── layout.tsx
  ├── api/
  │   ├── auth/[...nextauth]/
  │   ├── courses/
  │   ├── progress/
  │   └── ai/
  ├── components/
  ├── lib/
  ├── types/
  └── styles/
```

### Backend: Next.js API Routes

**Why not separate Node/Express server?**
- Monolithic is simpler for MVP
- Easier deployment (single container)
- Shared types with frontend
- Faster development

**API Structure**:
```
/api/auth/[...nextauth]      # Session management
/api/auth/profile             # Get current user

/api/courses                  # GET: list all courses
/api/courses/[id]            # GET: course with modules
/api/courses/[id]/progress   # GET: user progress in course

/api/modules/[id]            # GET: module with lessons
/api/lessons/[id]            # GET: lesson content
/api/lessons/[id]/complete   # POST: mark as complete

/api/exercises/[id]          # GET: exercise details
/api/exercises/[id]/submit   # POST: submit answer

/api/progress                # GET: user progress summary
/api/progress/update         # POST: update progress

/api/skills                  # GET: user skills
/api/skills/assess           # POST: assess skill

/api/ai/tutor                # POST: get AI help on exercise
/api/ai/chat                 # POST: chat with tutor
```

### Database: Prisma ORM

**Why Prisma?**
- Type-safe queries (generates types from schema)
- Database agnostic (SQLite → PostgreSQL seamless)
- Migrations (versioned, git-trackable)
- Seed scripts (reproducible test data)
- Performance (N+1 query prevention with includes)
- Relations handling (auto-resolved)

**Schema Structure**:
```prisma
model User {
  id        String    @id @default(cuid())
  email     String    @unique
  name      String?
  password  String    // hashed
  role      Role      @default(STUDENT)
  
  enrollments   Enrollment[]
  progress      UserProgress[]
  skills        UserSkill[]
  submissions   ExerciseSubmission[]
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Course {
  id          String    @id @default(cuid())
  title       String
  description String?
  imageUrl    String?
  order       Int       @default(0)
  
  modules    Module[]
  enrollments Enrollment[]
}

model Module {
  id        String    @id @default(cuid())
  courseId  String
  course    Course    @relation(fields: [courseId], references: [id], onDelete: Cascade)
  title     String
  order     Int
  
  lessons   Lesson[]
}

model Lesson {
  id        String    @id @default(cuid())
  moduleId  String
  module    Module    @relation(fields: [moduleId], references: [id], onDelete: Cascade)
  title     String
  type      LessonType  @default(CONTENT)
  content   String      // markdown
  duration  Int?        // minutes
  order     Int
  
  exercises   Exercise[]
  progress    UserProgress[]
}

model Exercise {
  id        String    @id @default(cuid())
  lessonId  String
  lesson    Lesson    @relation(fields: [lessonId], references: [id], onDelete: Cascade)
  type      ExerciseType
  question  String
  options   String[]  // JSON array
  correct   String
  hints     String[]  // JSON array
  
  submissions ExerciseSubmission[]
}

model UserProgress {
  id        String    @id @default(cuid())
  userId    String
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  lessonId  String
  lesson    Lesson    @relation(fields: [lessonId], references: [id], onDelete: Cascade)
  
  status    ProgressStatus  @default(NOT_STARTED)
  score     Int?
  attempts  Int             @default(0)
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@unique([userId, lessonId])
}

model UserSkill {
  id        String    @id @default(cuid())
  userId    String
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  skillName String
  
  proficiency Float  @default(0)  // 0-100
  level       Level  @default(BEGINNER)
  
  updatedAt DateTime @updatedAt
  
  @@unique([userId, skillName])
}

model ExerciseSubmission {
  id        String    @id @default(cuid())
  userId    String
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  exerciseId String
  exercise  Exercise  @relation(fields: [exerciseId], references: [id], onDelete: Cascade)
  
  answer    String
  isCorrect Boolean
  score     Int
  
  createdAt DateTime @default(now())
}

// Enums
enum Role {
  STUDENT
  INSTRUCTOR
  ADMIN
}

enum LessonType {
  CONTENT
  QUIZ
  LAB
  PROJECT
}

enum ExerciseType {
  MULTIPLE_CHOICE
  SHORT_ANSWER
  CODE_PREDICTION
  DEBUGGING
  FREEFORM
}

enum ProgressStatus {
  NOT_STARTED
  IN_PROGRESS
  COMPLETED
  FAILED
}

enum Level {
  BEGINNER
  INTERMEDIATE
  ADVANCED
  EXPERT
}
```

### Authentication: NextAuth.js

**Why NextAuth.js?**
- Battle-tested session management
- Multiple provider support
- Secure by default
- CSRF protection
- Type-safe callbacks

**Flow**:
```
1. User clicks "Sign Up"
2. Form submission → /api/auth/callback/credentials
3. Validate credentials
4. Create session JWT
5. Set httpOnly cookie
6. Redirect to dashboard
7. useSession() hook returns user

Middleware protects /dashboard routes
```

**Config**:
```typescript
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { type: "email" },
        password: { type: "password" }
      },
      authorize: async (credentials) => {
        // Validate against DB
        // Hash check password
        // Return user or null
      }
    }),
    // Future: Google, GitHub providers
  ],
  callbacks: {
    jwt: async (params) => {
      // Add user ID to token
    },
    session: async (params) => {
      // Add user to session
    },
    redirect: async (params) => {
      // Redirect to dashboard after login
    }
  },
  pages: {
    signIn: "/login",
    error: "/auth/error"
  }
}
```

### Styling: Tailwind CSS

**Why Tailwind?**
- Utility-first (fast development)
- No CSS-in-JS runtime overhead
- Small bundle size
- Dark mode support built-in
- Component library ready (Shadcn/ui future option)

**Design Tokens**:
```css
/* Colors */
--color-primary: #3b82f6    /* Blue */
--color-success: #10b981    /* Green */
--color-error: #ef4444      /* Red */
--color-warning: #f59e0b    /* Yellow */

/* Spacing */
Base unit: 4px (rem-based: 1rem = 16px)

/* Typography */
Body: Inter 400/500/600/700
Heading: Inter 700/800
Mono: JetBrains Mono 400/500

/* Shadows */
sm: 0 1px 2px 0 rgb(0 0 0 / 0.05)
md: 0 4px 6px -1px rgb(0 0 0 / 0.1)
lg: 0 10px 15px -3px rgb(0 0 0 / 0.1)
```

### Testing: Jest + React Testing Library

**Strategy**:
- Unit tests for utils/hooks
- Component tests for interactive components
- Integration tests for API routes
- E2E tests later (Playwright/Cypress)

**Coverage Target**: 70% (MVP)

**Test Structure**:
```
__tests__/
├── unit/
│   ├── lib/
│   └── utils/
├── components/
├── api/
└── e2e/
```

## Data Flow - Complete Lesson Flow

```
1. USER VISITS LESSON
   GET /courses/[courseId]/modules/[moduleId]/lessons/[lessonId]

2. FETCH LESSON
   api/lessons/[id]?include=exercises,progress
   ↓
   Prisma query returns lesson + exercises
   ↓
   React renders LessonViewer component

3. USER COMPLETES LESSON
   POST /api/lessons/[id]/complete
   ↓
   Update UserProgress.status = COMPLETED
   ↓
   Calculate skill impact
   ↓
   Return updated progress

4. USER SUBMITS EXERCISE
   POST /api/exercises/[id]/submit
   {
     answer: "user's answer",
     userId: "..."
   }
   ↓
   Validate answer
   ↓
   Calculate score
   ↓
   Save submission
   ↓
   Return feedback + score

5. TUTOR HELP REQUEST
   POST /api/ai/tutor
   {
     exerciseId: "...",
     context: {lesson, exercise, userAnswer}
   }
   ↓
   Generate prompt with context
   ↓
   Call OpenAI API
   ↓
   Stream response to client
   ↓
   Log interaction for analytics
```

## Performance Considerations

### Frontend
- Image optimization (Next.js Image)
- Code splitting (automatic)
- Lazy loading (dynamic imports)
- Service Worker for offline support (future)

### Backend
- Database query optimization (Prisma includes)
- Caching (Redis later)
- API response compression
- Rate limiting (future)

### Database
- Indexing on frequently queried fields
- Query analysis (EXPLAIN ANALYZE)
- Connection pooling (Prisma pools by default)
- Replication strategy (production)

## Security

### Data Protection
- Passwords hashed (bcrypt)
- JWT signed tokens
- HTTPS enforced
- SQL injection prevented (Prisma)
- XSS prevention (React escapes by default)
- CSRF protection (NextAuth)

### Access Control
- Role-based authorization
- Course enrollment check
- Rate limiting on sensitive endpoints
- API key rotation

### Secrets
```env
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=<random>
NEXTAUTH_URL=https://...
OPENAI_API_KEY=sk-...
```

## Deployment Architecture

```
GitHub
  ↓ (Push to main)
CI/CD Pipeline
  ├─ Lint & TypeCheck
  ├─ Run tests
  ├─ Build Next.js
  └─ Push to registry
  
  ↓
Docker Image
  ├─ Node 20 base
  ├─ App copied
  ├─ Dependencies installed
  └─ Prisma migrations ready

  ↓
Production Environment
  ├─ Railway / Vercel / Railway
  ├─ PostgreSQL (managed)
  ├─ Environment variables injected
  └─ Migrations run on startup
```

## Scalability Path

### Phase 1 (Current MVP)
- Single Next.js instance
- SQLite/PostgreSQL
- No caching
- Monolithic DB

### Phase 2 (Scaling)
- Load balancer
- Multi-instance Next.js
- Redis caching
- Database read replicas

### Phase 3 (Microservices)
- Separate AI service
- Async job queue
- Event streaming
- Content CDN

### Phase 4 (Enterprise)
- GraphQL API
- Multi-tenancy
- Analytics platform
- Advanced reporting

## Monitoring & Observability

### Metrics to Track
- Page load time (Core Web Vitals)
- API response time
- Database query time
- Error rate by endpoint
- User session duration
- Feature usage

### Logging
- Application logs (stderr)
- API access logs
- Error tracking (Sentry later)
- Database slow query log

### Health Checks
```
GET /api/health
└─ Returns status of:
   - Database connection
   - Auth service
   - External APIs
```

## Development Workflow

### Local Development
```bash
npm install
npm run dev              # Next.js on :3000
npx prisma studio      # DB viewer on :5555

# Terminal 2: type checking
npm run typecheck:watch

# Terminal 3: tests
npm run test:watch
```

### Adding a Feature
1. Update Prisma schema (if needed)
2. Run migration: `npx prisma migrate dev`
3. Create API endpoint
4. Create React component
5. Integrate
6. Test
7. Commit

## API Response Format

### Success
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

### Error
```json
{
  "success": false,
  "error": {
    "code": "AUTH_REQUIRED",
    "message": "User not authenticated",
    "details": { ... }
  }
}
```

---

**Version**: 1.0  
**Last Updated**: 2026-09-26  
**Next Review**: After MVP completion
