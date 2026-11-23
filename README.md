# LabLink 🔬

> AI-powered campus lab resource management platform — book equipment, track projects, and get intelligent scheduling assistance.

## Overview

LabLink is a production-quality web application that helps university students and faculty manage lab equipment bookings, track research projects, and receive AI-powered scheduling suggestions. It features conflict detection with smart alternatives, real-time analytics, and a conversational assistant for natural language equipment queries.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Browser Client                      │
│         React 18 + TypeScript + Vite + TailwindCSS      │
│    Pages: Dashboard | Equipment | Bookings | Projects   │
│           Analytics | AI Assistant | Notifications      │
└──────────────────────────┬──────────────────────────────┘
                           │ HTTP / REST (Vite proxy → /api)
                           ▼
┌─────────────────────────────────────────────────────────┐
│                   Express.js Backend                    │
│                   Node 18+ / TypeScript                 │
│                                                         │
│  Routes:                                                │
│  GET  /health              → liveness probe             │
│  GET  /api/equipment       → list / filter equipment    │
│  POST /api/bookings        → create (conflict detect)   │
│  GET  /api/analytics/overview → usage statistics        │
│  POST /api/assistant/query → NLP equipment search       │
│  ... (full list below)                                  │
└──────────────────────────┬──────────────────────────────┘
                           │ better-sqlite3
                           ▼
┌─────────────────────────────────────────────────────────┐
│                  SQLite Database                        │
│  Tables: equipment, students, faculty, projects,        │
│          bookings, requests, notifications              │
└─────────────────────────────────────────────────────────┘
```

## Prerequisites

- **Node.js** 18 or higher (`node --version`)
- **npm** 9+ (comes with Node)
- **Git** (optional, for cloning)

## Setup Instructions

### 1. Clone / enter the project

```bash
cd lablink
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Seed the database with 20 demo equipment items and sample data
npm run seed

# Start the development server (port 3001)
npm run dev
```

The backend will be available at `http://localhost:3001`.

### 3. Frontend Setup

Open a **new terminal**:

```bash
cd frontend

# Install dependencies
npm install

# Start the Vite dev server (port 5173)
npm run dev
```

Open `http://localhost:5173` in your browser.

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3001` | Backend HTTP port |
| `NODE_ENV` | `development` | `development` or `production` |
| `DATABASE_URL` | `./lablink.db` | SQLite database path |
| `CORS_ORIGIN` | `http://localhost:5173` | Allowed CORS origin |

Copy `.env.example` to `.env` and edit as needed:

```bash
cp .env.example .env
```

## API Documentation

### Health

| Method | Path | Description |
|---|---|---|
| GET | `/health` | Liveness check → `{ status: "ok" }` |

### Equipment

| Method | Path | Description |
|---|---|---|
| GET | `/api/equipment` | List all equipment (supports `?category=`, `?department=`, `?status=`, `?search=`) |
| GET | `/api/equipment/:id` | Get single equipment item |
| GET | `/api/equipment/:id/availability` | Get available time slots for a date range |

### Bookings

| Method | Path | Description |
|---|---|---|
| GET | `/api/bookings` | List bookings (supports `?student_id=`, `?equipment_id=`, `?status=`) |
| POST | `/api/bookings` | Create a booking — returns `409` with `alternatives` on conflict |
| GET | `/api/bookings/:id` | Get single booking |
| PATCH | `/api/bookings/:id` | Update booking status |
| DELETE | `/api/bookings/:id` | Cancel a booking |

**POST /api/bookings body:**
```json
{
  "equipment_id": "uuid",
  "student_id": "uuid",
  "start_time": "2024-03-15T09:00:00Z",
  "end_time": "2024-03-15T12:00:00Z",
  "purpose": "Protein gel electrophoresis",
  "priority": "normal"
}
```

**409 Conflict response:**
```json
{
  "error": "Equipment not available for the requested time slot",
  "alternatives": [
    { "start_time": "...", "end_time": "...", "score": 0.95 }
  ]
}
```

### Students

| Method | Path | Description |
|---|---|---|
| GET | `/api/students` | List all students |
| GET | `/api/students/:id` | Get student profile + booking history |
| POST | `/api/students` | Create student |

### Faculty

| Method | Path | Description |
|---|---|---|
| GET | `/api/faculty` | List all faculty |
| GET | `/api/faculty/:id` | Get faculty profile |

### Projects

| Method | Path | Description |
|---|---|---|
| GET | `/api/projects` | List projects (supports `?student_id=`, `?status=`) |
| GET | `/api/projects/:id` | Get project details |
| POST | `/api/projects` | Create project |
| PATCH | `/api/projects/:id` | Update project progress / status |

### Notifications

| Method | Path | Description |
|---|---|---|
| GET | `/api/notifications?user_id=&user_type=` | Get notifications for a user |
| PATCH | `/api/notifications/:id/read` | Mark notification as read |
| PATCH | `/api/notifications/read-all` | Mark all as read |

### Analytics

| Method | Path | Description |
|---|---|---|
| GET | `/api/analytics/overview` | Aggregate stats (bookings, utilization, top equipment) |
| GET | `/api/analytics/equipment/:id` | Per-equipment usage trends |
| GET | `/api/analytics/departments` | Bookings by department |

### AI Assistant

| Method | Path | Description |
|---|---|---|
| POST | `/api/assistant/query` | Natural language equipment search |

**POST /api/assistant/query body:**
```json
{
  "query": "find GPU for machine learning",
  "student_id": "uuid"
}
```

**Response:**
```json
{
  "results": [ { "equipment": {...}, "relevance": 0.92, "reason": "..." } ],
  "suggestions": ["Try booking in off-peak hours for faster approval"]
}
```

## Production Build

### Build both apps locally

```bash
# Build frontend
cd frontend && npm run build && cd ..

# Build backend
cd backend && npm run build && cd ..
```

### Run in production mode

```bash
NODE_ENV=production PORT=8080 node backend/dist/index.js
```

The backend serves the frontend's static files from `./public` in production.

## Docker

### Build the image

```bash
docker build -t lablink .
```

### Run the container

```bash
docker run -p 8080:8080 -e NODE_ENV=production lablink
```

Open `http://localhost:8080`.

## Cloud Run Deployment

### Prerequisites

- Google Cloud project with billing enabled
- `gcloud` CLI installed and authenticated
- Cloud Run and Container Registry APIs enabled

### Deploy

```bash
# Set your project
export PROJECT_ID=your-gcp-project-id
gcloud config set project $PROJECT_ID

# Build and push with Cloud Build, then deploy to Cloud Run
gcloud builds submit --config cloudbuild.yaml .
```

This will:
1. Build the multi-stage Docker image
2. Push it to Google Container Registry
3. Deploy to Cloud Run in `us-central1` (1 CPU / 512 MB)

The deployed URL will be printed at the end of the `gcloud builds submit` command.

### Manual deploy (alternative)

```bash
docker build -t gcr.io/$PROJECT_ID/lablink .
docker push gcr.io/$PROJECT_ID/lablink
gcloud run deploy lablink \
  --image gcr.io/$PROJECT_ID/lablink \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 512Mi \
  --cpu 1
```

## Reset Demo Data

To wipe the database and reseed with fresh demo data:

```bash
cd backend
rm -f lablink.db
npm run seed
```

## Testing

```bash
# Backend unit + integration tests
cd backend && npm test

# Quick API smoke tests (backend must be running on :3001)
curl http://localhost:3001/health
curl http://localhost:3001/api/equipment
curl http://localhost:3001/api/analytics/overview

# Test conflict detection
curl -X POST http://localhost:3001/api/bookings \
  -H "Content-Type: application/json" \
  -d '{"equipment_id":"<id>","student_id":"<id>","start_time":"2024-03-15T09:00:00Z","end_time":"2024-03-15T12:00:00Z","purpose":"test","priority":"normal"}'

# Test AI assistant
curl -X POST http://localhost:3001/api/assistant/query \
  -H "Content-Type: application/json" \
  -d '{"query":"find GPU for deep learning"}'
```

## Project Structure

```
lablink/
├── backend/
│   ├── src/
│   │   ├── index.ts              # Express app entry point
│   │   ├── routes/               # Route definitions
│   │   ├── controllers/          # Business logic
│   │   ├── algorithms/           # Conflict detection, scheduling
│   │   ├── database/
│   │   │   ├── schema.ts         # DB init & table creation
│   │   │   └── seed.ts           # Demo data seeder
│   │   ├── middleware/           # Auth, error handling
│   │   └── types/                # Shared TypeScript interfaces
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── App.tsx               # Router + layout
│   │   ├── pages/                # Dashboard, Equipment, Bookings, ...
│   │   ├── components/           # Reusable UI components
│   │   ├── services/
│   │   │   └── api.ts            # Axios API client
│   │   └── types/                # Shared TypeScript interfaces
│   ├── vite.config.ts            # Vite + proxy config
│   ├── tailwind.config.js
│   └── package.json
├── Dockerfile                    # Multi-stage production build
├── .dockerignore
├── cloudbuild.yaml               # Cloud Run CI/CD
├── .env.example
└── README.md
```

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite, TailwindCSS, Framer Motion |
| Charts | Recharts |
| Icons | Lucide React |
| HTTP client | Axios |
| Toasts | React Hot Toast |
| Backend | Node.js, Express, TypeScript |
| Database | SQLite (better-sqlite3) |
| Validation | express-validator |
| Testing | Jest, ts-jest, Supertest |
| Container | Docker (multi-stage) |
| Cloud | Google Cloud Run |

## License

MIT
