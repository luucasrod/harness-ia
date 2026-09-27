# Deployment Guide - Harness IA MVP

This guide covers deploying to **Vercel** (recommended) or **Railway**.

---

## Option 1: Vercel (Recommended)

Vercel is the official Next.js hosting platform. Deployment takes 2-3 minutes.

### Prerequisites
- Vercel account (free at vercel.com)
- GitHub account with repo access

### Steps

#### 1. Connect Repository
```bash
git remote add origin https://github.com/YOUR_USERNAME/harness-ia.git
git push -u origin develop
```

#### 2. Import to Vercel
1. Go to https://vercel.com/new
2. Click "Import Git Repository"
3. Select your GitHub repository
4. Click "Import"

#### 3. Configure Environment Variables
On the Vercel dashboard, go to **Settings → Environment Variables** and add:

```
DATABASE_URL=postgresql://user:password@host:5432/harness_ia
NEXTAUTH_SECRET=your-secure-random-string-here-change-in-production
NEXTAUTH_URL=https://your-domain.vercel.app
OPENAI_API_KEY=sk-your-openai-key-here
```

**Generate NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

#### 4. Configure Database
You have two options:

**Option A: Vercel Postgres** (Easiest)
1. In Vercel dashboard, click "Storage"
2. Click "Create" → "Postgres"
3. Connect to your project
4. Copy the connection string to `DATABASE_URL`

**Option B: External Database** (Supabase, Railway, etc.)
1. Create PostgreSQL database
2. Copy connection string to `DATABASE_URL`

#### 5. Deploy
Click "Deploy" button on Vercel dashboard.

After deployment:
```bash
# Run migrations in production
vercel env pull .env.production.local
npm run db:setup
```

#### 6. Test Deployment
Visit `https://your-project.vercel.app`
- Test signup/login
- Verify courses load
- Test tutor chat

---

## Option 2: Railway

Railway is a modern platform with easy Postgres integration.

### Prerequisites
- Railway account (free at railway.app)
- GitHub repository

### Steps

#### 1. Create Railway Project
1. Go to https://railway.app
2. Click "New Project"
3. Select "Deploy from GitHub"
4. Authorize and select your repository

#### 2. Add Postgres Database
1. Click "Add" → "Database"
2. Select "PostgreSQL"
3. Railway creates automatic `DATABASE_URL`

#### 3. Configure Environment Variables
In the **Variables** tab, add:

```
NEXTAUTH_SECRET=your-random-secret-here
NEXTAUTH_URL=https://your-domain.railway.app
OPENAI_API_KEY=sk-your-key-here
NODE_ENV=production
```

#### 4. Connect Domain (Optional)
1. Go to "Settings"
2. Click "Add Domain"
3. Connect your domain or use Railway's subdomain

#### 5. Deploy
Push to GitHub:
```bash
git push origin develop
```

Railway automatically deploys on push.

After deployment, run migrations:
```bash
railway run npm run db:setup
```

---

## Option 3: Docker (Self-Hosted)

For deployment to your own server or cloud provider (AWS, DigitalOcean, etc.).

### Build Image
```bash
docker build -t harness-ia:latest .
```

### Run Locally
```bash
docker run -p 3000:3000 \
  -e DATABASE_URL="postgresql://..." \
  -e NEXTAUTH_SECRET="your-secret" \
  -e OPENAI_API_KEY="sk-..." \
  harness-ia:latest
```

### Push to Registry (e.g., Docker Hub)
```bash
docker tag harness-ia:latest username/harness-ia:latest
docker push username/harness-ia:latest
```

### Deploy to Cloud
- **AWS ECS**: Use CloudFormation with Docker image
- **DigitalOcean**: Use App Platform with Docker image
- **Heroku**: Use Docker buildpack (deprecated, but still works)

---

## Post-Deployment Checklist

After deploying to staging/production:

### Security
- [ ] NEXTAUTH_SECRET is strong (32+ chars, random)
- [ ] DATABASE_URL uses strong password
- [ ] OPENAI_API_KEY is restricted (IP/domain limits if available)
- [ ] HTTPS is enforced
- [ ] .env files never committed to git

### Testing
- [ ] Can sign up and create account
- [ ] Can log in with credentials
- [ ] Can view courses and lessons
- [ ] Can submit exercises
- [ ] Tutor responds to questions
- [ ] Progress is tracked
- [ ] No console errors (DevTools F12)

### Performance
- [ ] First contentful paint < 2s
- [ ] All images load properly
- [ ] API responses < 500ms
- [ ] No N+1 queries in database

### Monitoring
- [ ] Set up error tracking (Sentry, etc.)
- [ ] Monitor database connections
- [ ] Set up uptime monitoring
- [ ] Configure email alerts

---

## Troubleshooting

### Issue: "NEXTAUTH_SECRET not configured"
**Fix**: Add to environment variables in your deployment platform

### Issue: "Cannot connect to database"
**Fix**: 
1. Verify DATABASE_URL is correct
2. Check database firewall allows your app server
3. Ensure database is running

### Issue: "OpenAI API errors"
**Fix**:
1. Verify API key is correct
2. Check account has credits
3. Verify rate limits aren't exceeded

### Issue: "Migrations failed in production"
**Fix**: Run manually:
```bash
# For Vercel
vercel env pull .env.production.local
npx prisma migrate deploy

# For Railway
railway run npx prisma migrate deploy
```

### Issue: "Static assets return 404"
**Fix**: Ensure `/public` folder is deployed and `next.config.ts` is correct

---

## Environment Variables Reference

| Variable | Required | Example |
|----------|----------|---------|
| DATABASE_URL | ✅ | `postgresql://user:pass@host:5432/db` |
| NEXTAUTH_SECRET | ✅ | `<random-32-char-string>` |
| NEXTAUTH_URL | ✅ | `https://app.example.com` |
| OPENAI_API_KEY | ❌ | `sk-proj-...` |
| NODE_ENV | ✅ | `production` |

---

## Production Readiness Checklist

Before going to production:

- [ ] All tests pass locally
- [ ] E2E testing completed
- [ ] Database backups configured
- [ ] Error monitoring enabled (Sentry)
- [ ] Analytics configured (PostHog, Mixpanel)
- [ ] Logging configured (Datadog, LogRocket)
- [ ] Security headers configured (CSP, CORS)
- [ ] Rate limiting implemented
- [ ] GDPR compliance checked
- [ ] Documentation updated
- [ ] Runbook for incidents created

---

## CI/CD Pipeline (Optional)

Set up automatic testing and deployment:

### GitHub Actions Example
```yaml
name: Deploy

on:
  push:
    branches: [develop]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 20
      - run: npm install
      - run: npm run typecheck
      - run: npm test
      - run: npm run build
      - uses: vercel/action@main
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

---

**Status**: Ready for production deployment  
**Last Updated**: 2026-09-27  
**Version**: 1.0

For support, check:
- Vercel Docs: https://vercel.com/docs
- Railway Docs: https://docs.railway.app
- Next.js Docs: https://nextjs.org/docs
