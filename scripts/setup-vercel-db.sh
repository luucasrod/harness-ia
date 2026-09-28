#!/bin/bash

# Setup Vercel Postgres Database - AUTONOMOUS SCRIPT
# Run this once to create database and configure environment

set -e

echo "🚀 VERCEL DATABASE SETUP - AUTONOMOUS"
echo "======================================"
echo ""

# Step 1: Login to Vercel
echo "📝 Step 1: Authenticating with Vercel..."
if ! vercel whoami &>/dev/null; then
    echo "❌ Not authenticated. Running: vercel login"
    vercel login --sso
fi

echo "✅ Authenticated"
echo ""

# Step 2: Get project info
echo "📝 Step 2: Getting project info..."
PROJECT_ID=$(vercel projects ls --json 2>/dev/null | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
if [ -z "$PROJECT_ID" ]; then
    echo "⚠️  Could not find project. Make sure you've deployed to Vercel first."
    echo "Run: npm run build && vercel --prod"
    exit 1
fi

echo "✅ Found project: $PROJECT_ID"
echo ""

# Step 3: Create Postgres Database
echo "📝 Step 3: Creating Vercel Postgres database..."
echo "Note: You may need to do this manually via vercel.com → Storage"
echo ""
echo "🎯 Manual steps:"
echo "  1. Go to: https://vercel.com/dashboard"
echo "  2. Select project: harness-ia"
echo "  3. Go to: Storage tab"
echo "  4. Click: Create Database"
echo "  5. Select: Postgres"
echo "  6. Copy CONNECTION STRING"
echo "  7. Save to: .env.production.local"
echo ""
echo "Once done, paste the connection string below:"
read -p "DATABASE_URL (postgres://...): " DATABASE_URL

if [ -z "$DATABASE_URL" ]; then
    echo "❌ Empty connection string"
    exit 1
fi

echo "✅ Got connection string"
echo ""

# Step 4: Configure in Vercel
echo "📝 Step 4: Setting environment variable in Vercel..."
vercel env add DATABASE_URL "$DATABASE_URL" production || echo "⚠️  Could not set via CLI (set manually in Vercel dashboard)"

echo "✅ Environment configured"
echo ""

# Step 5: Run migrations
echo "📝 Step 5: Running Prisma migrations..."
DATABASE_URL="$DATABASE_URL" npx prisma migrate deploy || echo "⚠️  Migrations need manual run"

echo ""
echo "✅ SETUP COMPLETE!"
echo ""
echo "🎯 Next steps:"
echo "  1. Run: vercel deploy --prod"
echo "  2. Seed production: DATABASE_URL=... npx ts-node prisma/seed-module1.ts"
echo "  3. Test: https://harness-ia-psi.vercel.app"
