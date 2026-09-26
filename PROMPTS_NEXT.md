# Next Dispatch Prompts (Ready to Send)

## P0-002: Authentication & Database Schema (Gemini CLI)

When P0-001 completes, dispatch to Gemini with this prompt:

```
You are implementing Task P0-002 for the Harness IA project.

TASK P0-002: Authentication Schema & Database

Repository: A:\Projetos Lucas\Curso Engenharia Harness IA

OBJECTIVE:
Create complete authentication + course database schema with Prisma.
Implement NextAuth.js configuration.
Create API endpoints for auth flow.

DEPENDENCIES COMPLETED:
- P0-001: Next.js project initialized with Prisma, TypeScript

WHAT TO DO:

1. UPDATE Prisma Schema (prisma/schema.prisma):

Add these models:

- User (id, email, name, password_hash, role, createdAt, updatedAt)
- Course (id, title, description, imageUrl, order, createdAt)
- Module (id, courseId, title, order, createdAt)
- Lesson (id, moduleId, title, type, content, duration, order, createdAt)
- Exercise (id, lessonId, type, question, options JSON, correct, hints JSON, createdAt)
- Enrollment (id, userId, courseId, enrolledAt, updatedAt)
- UserProgress (id, userId, lessonId, status, score, attempts, createdAt, updatedAt)
- UserSkill (id, userId, skillName, proficiency float, level enum, updatedAt)
- ExerciseSubmission (id, userId, exerciseId, answer, isCorrect bool, score int, createdAt)

Include proper:
- Relationships (onDelete: Cascade where appropriate)
- Indexes (@unique, @@unique)
- Defaults
- Timestamps (@default(now()), @updatedAt)

2. Run Prisma migration:

npx prisma migrate dev --name initial_schema

This creates migrations/ folder and schema.

3. Create .env.local with example DATABASE_URL:

DATABASE_URL="file:./dev.db" (for SQLite dev)

Or PostgreSQL format ready for production.

4. Implement NextAuth.js:

Create lib/auth.ts with:

```typescript
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "./db";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      authorize: async (credentials) => {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Missing credentials");
        }

        const user = await db.user.findUnique({
          where: { email: credentials.email }
        });

        if (!user || !bcrypt.compareSync(credentials.password, user.password_hash)) {
          throw new Error("Invalid email or password");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        };
      }
    })
  ],
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    session: async ({ session, token }) => {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    }
  },
  pages: {
    signIn: "/auth/login",
    error: "/auth/error"
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60 // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET
};
```

5. Create app/api/auth/[...nextauth]/route.ts:

```typescript
import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
```

6. Create Prisma Database Client (lib/db.ts):

```typescript
import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const db =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
```

7. Create signup endpoint (app/api/auth/signup/route.ts):

```typescript
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { email, name, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Missing email or password" },
        { status: 400 }
      );
    }

    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 400 }
      );
    }

    const user = await db.user.create({
      data: {
        email,
        name: name || "User",
        password_hash: bcrypt.hashSync(password, 10),
        role: "STUDENT"
      }
    });

    return NextResponse.json({
      user: { id: user.id, email: user.email, name: user.name },
      message: "User created. Please log in."
    });
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
}
```

8. Create profile endpoint (app/api/auth/profile/route.ts):

```typescript
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json(
      { error: "Not authenticated" },
      { status: 401 }
    );
  }

  const user = await db.user.findUnique({
    where: { email: session.user.email }
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    }
  });
}
```

9. Install required dependencies:

npm install bcryptjs next-auth

10. Verify everything:

npm run typecheck
npm run lint
npm run build

11. Commit:

git add .
git commit -m "feat(backend): add authentication schema and nextauth configuration

- Created Prisma schema for User, Course, Module, Lesson, Exercise
- Implemented UserProgress, UserSkill, ExerciseSubmission models
- Setup NextAuth.js with CredentialsProvider
- Added auth API endpoints (signup, profile)
- Created database client with Prisma
- All TypeScript types generated
- Build and lint passing

Co-Authored-By: Gemini CLI <gemini@example.com>"

git push origin feature/backend-002

ACCEPTANCE CRITERIA:
✓ Prisma schema compiles without errors
✓ Migrations created successfully
✓ NextAuth configured and working
✓ Auth endpoints respond correctly
✓ npm run typecheck passes
✓ npm run build succeeds
✓ No TypeScript errors
✓ Relationships properly defined

START IMMEDIATELY.
```

---

## P0-004: Dashboard Layout (Codex)

When P0-001 completes, dispatch to Codex with this prompt:

```
You are implementing Task P0-004 for the Harness IA project.

TASK P0-004: Dashboard Layout & Navigation

Repository: A:\Projetos Lucas\Curso Engenharia Harness IA

OBJECTIVE:
Create the main application shell with sidebar navigation, top nav, user menu.
This is the layout container for all logged-in pages.

DELIVERABLES:
1. Create app/(dashboard)/layout.tsx
   - Top navigation bar with logo, user menu
   - Sidebar with navigation links
   - Main content area
   - Responsive (hamburger menu on mobile)

2. Create components/Sidebar.tsx
   - Navigation links: Courses, Progress, Skills, Profile
   - Active route highlighting
   - Collapsible on mobile
   - Logo/branding

3. Create components/TopNav.tsx
   - Logo/home link
   - User menu dropdown (profile, settings, logout)
   - Logout functionality
   - User name display

4. Create app/(dashboard)/dashboard/page.tsx
   - Welcome message
   - "Continue Learning" section
   - Quick stats
   - Placeholder for now (will fill with real content later)

5. Create app/middleware.ts
   - Protect /dashboard routes
   - Redirect unauthenticated users to /auth/login
   - Check session validity

STYLING:
- Use Tailwind CSS
- Responsive design (mobile-first)
- Dark mode support (use Tailwind dark: prefix, no manual toggle yet)
- Color scheme: professional, modern
- Sidebar on desktop, hamburger on mobile
- Smooth transitions

STRUCTURE:
```
app/
├── (auth)/
│   └── layout.tsx          (public routes)
├── (dashboard)/
│   ├── layout.tsx          (protected layout)
│   ├── dashboard/
│   │   └── page.tsx        (home)
│   ├── courses/
│   │   └── page.tsx        (will create later)
│   ├── progress/
│   │   └── page.tsx        (will create later)
│   └── skills/
│       └── page.tsx        (will create later)
├── components/
│   ├── Sidebar.tsx
│   └── TopNav.tsx
└── middleware.ts
```

ACCEPTANCE CRITERIA:
✓ Dashboard layout renders without errors
✓ Sidebar navigation works
✓ User menu dropdown works
✓ Logout functionality works
✓ Protected routes check auth
✓ Responsive on mobile
✓ No TypeScript errors
✓ Tailwind styles applied correctly

START IMMEDIATELY.
```

---

**Note**: These prompts are ready. Send them as soon as P0-001 completates and has been validated.
