# VAST Challenge Data Visualization

This project consists of a PostgreSQL database, Node.js backend API, and React frontend for visualizing VAST Challenge data.

## Deliverables

- **Answer Sheet (HTML):** [index.html](index.html)
- **Answer Sheet (PDF):** [index.pdf](index.pdf)

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

### First Time Setup

**IMPORTANT:** Before starting the services, you MUST import the database. The application will not work without data.

1. **Import the database** (choose one method):

   **Option A - Using Database Dump (RECOMMENDED - takes ~2 minutes):**
   ```bash
   # Download and reconstruct the dump from GitHub Releases
   cat vast_db_dump_split_* > restored_dump.sql.gz

   # Import the database
   ./restore-database.sh restored_dump.sql.gz
   ```

   **Option B - From CSV files (takes 10-15 minutes):**
   See the CSV import section below for detailed instructions.

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

### Managing Services

**Stop all services:**
```bash
docker-compose down
```

**Complete cleanup (including database):**
```bash
docker-compose down -v
```
**WARNING:** This will delete all Docker volumes, including the database. You will need to **re-import the database** following step 1 above before the application will work again.

## Database Export/Import (RECOMMENDED)

**Skip the 10-15 minute CSV import!** Use database dumps to share and restore the complete database instantly.

### For Team Members: Quick Setup

A DB dump is present in the Releases of the git project. It's provided as chunks of 2GB each, to reconstruct use
```bash
cat vast_db_dump_split_* > restored_dump.sql.gz
```
To import it
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

This creates a compressed SQL dump in `db-exports/` folder. If needed to upload a new version, split into chucks of max 2GB:

```bash
split -b 2000m <filename> vast_db_dump_split_
```
And upload the chunks in a new release.

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
