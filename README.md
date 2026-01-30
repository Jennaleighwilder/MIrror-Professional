# Mirror Professional - Deployable Package

This folder is a ready-to-deploy bundle for selling or sharing with matchmakers.
It includes a production-ready backend and a high-end web frontend for demo use.

## Quick Start (Local)

### 1) Backend
```bash
cd backend
npm install
cp env.example .env
# Edit .env with your DATABASE_URL and JWT_SECRET
psql postgres -c "CREATE DATABASE mirror_pro;"
psql mirror_pro < schema.sql
npm start
```

Backend runs at `http://localhost:3000`.

### 2) Frontend
```bash
cd ../frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:3001`.

### Demo Login
- Email: `demo@elitematch.com`
- Password: `demo123`

## One-Click Deploy (Railway)
From this folder:
```bash
./deploy.sh
```

## Notes
- The frontend assessment portal is intentionally minimal for investor demos.
  You can replace it with full question screens later.
- The compatibility report endpoint uses the Dyad Engine algorithm (real scoring).
- Health check endpoint: `GET /health`

## Folder Structure
```
release/
├── backend/
│   ├── server.js
│   ├── matching.js
│   ├── schema.sql
│   ├── package.json
│   └── env.example
└── frontend/
    ├── pages/
    ├── styles/
    ├── package.json
    └── next.config.js
```
