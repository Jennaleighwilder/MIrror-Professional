#!/bin/bash
# MIRROR PROFESSIONAL - ONE-CLICK DEPLOYMENT (Railway)

set -e

echo "╔════════════════════════════════════════════╗"
echo "║   MIRROR PROFESSIONAL DEPLOYMENT           ║"
echo "║   Building luxury B2B platform...          ║"
echo "╚════════════════════════════════════════════╝"
echo ""

if ! command -v railway &> /dev/null; then
  echo "📦 Installing Railway CLI..."
  npm install -g @railway/cli
fi

echo "🔐 Logging in to Railway..."
railway login

echo "🚀 Deploying backend..."
cd backend
railway init --name mirror-pro-backend
railway add postgresql
railway up

echo "⚙️  Setting environment variables..."
railway variables set JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")

BACKEND_URL=$(railway status | grep "URL" | awk '{print $2}')
echo "✅ Backend deployed at: $BACKEND_URL"

echo "🚀 Deploying frontend..."
cd ../frontend
railway init --name mirror-pro-frontend
railway variables set NEXT_PUBLIC_API_URL="${BACKEND_URL}/api"
railway up

FRONTEND_URL=$(railway status | grep "URL" | awk '{print $2}')

echo ""
echo "╔════════════════════════════════════════════╗"
echo "║   DEPLOYMENT COMPLETE! ✅                  ║"
echo "╚════════════════════════════════════════════╝"
echo ""
echo "📊 Dashboard: $FRONTEND_URL/login"
echo "🔌 API: $BACKEND_URL"
echo ""
echo "Demo Login:"
echo "  Email: demo@elitematch.com"
echo "  Password: demo123"
echo ""
echo "🎉 Your platform is LIVE!"
echo ""
