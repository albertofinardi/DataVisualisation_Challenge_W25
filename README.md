# VAST Challenge Data Visualization

This project consists of a PostgreSQL database, Node.js backend API, and React frontend for visualizing VAST Challenge data.

## Project Structure

```
.
├── docker-compose.yml          # Docker orchestration
├── vast-backend/              # Node.js + Express + PostgreSQL backend
│   ├── src/
│   │   ├── config/           # Database configuration
│   │   ├── db/              # Database schema and initialization
│   │   ├── routes/          # API routes
│   │   ├── scripts/         # Database setup scripts
│   │   ├── utils/           # CSV parser utilities
│   │   └── server.ts        # Main server file
│   ├── Dockerfile
│   └── package.json
└── vast-frontend/            # React + Vite frontend
    ├── src/
    ├── Dockerfile
    ├── nginx.conf
    └── package.json
```

## Prerequisites

- Docker and Docker Compose installed

For local development:
- Node.js 20+
- PostgreSQL 15+ with PostGIS

## Quick Start with Docker

1. **Import data:**
  See more info in the next sections

2. **Start services:**
```bash
docker compose up --build -d
```

3. **Access the application:**
   - **Frontend:** http://localhost
   - **Backend API** (for Bruno/testing): http://localhost:3000

   The frontend includes an Nginx reverse proxy that forwards all `/api/*` requests to the backend.

4. **Test the API with Bruno:**

   A Bruno API collection is included in the `/bruno-endpoints/` folder with example requests for all endpoints. Import this collection into [Bruno](https://www.usebruno.com/) to quickly test the API.

5. **Stop all services:**
   ```bash
   docker-compose down
   ```

6. **Complete cleanup (including database):**
   ```bash
   docker-compose down -v
   ```
   **⚠️ WARNING:** This will delete all Docker volumes, including the database. The next startup will require a **full re-import of all data** and will consume disk space again.

## Database Export/Import (RECOMMENDED)

**Skip the 10-15 minute CSV import!** Use database dumps to share and restore the complete database instantly.

### For Team Members: Quick Setup

A DB dump is present in the Releases of the git project.
If someone shares a database dump file with you:

```bash
# 1. Place the dump file in db-exports/ folder
# 2. Run the restore script
./restore-database.sh <filename>

# 3. Start all services
docker-compose up -d
```

**That's it!** Your database is ready in minutes instead of CSV importing.

### Export Your Database

Create a dump file to share with others:

```bash
./export-database.sh
```

This creates a compressed SQL dump in `db-exports/` folder. Share this file with your team.

## Architecture

### Docker Network Architecture

```
┌─────────────────────────────────────────┐
│  Host Machine (port 80)                 │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  Frontend (Nginx) Container             │
│  - Serves React app                     │
│  - Proxies /api/* to backend            │
│  Port 80 (exposed)                      │
└────────────┬────────────────────────────┘
             │ Internal Network
             ▼
┌─────────────────────────────────────────┐
│  Backend (Node.js) Container            │
│  - Express REST API                     │
│  - Auto-initializes DB on first run     │
│  Port 3000 (internal only)              │
└────────────┬────────────────────────────┘
             │ Internal Network
             ▼
┌─────────────────────────────────────────┐
│  PostgreSQL + PostGIS Container         │
│  - Persistent volume for data           │
│  Port 5432 (internal only)              │
└─────────────────────────────────────────┘
```
