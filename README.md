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
├── data/                   # CSV datasets (now in project root, not copied into backend image)
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
- Node.js 20+ (for local development)
- PostgreSQL 15+ with PostGIS (for local development without Docker)
- **IMPORTANT**: You need to add the VAST Challenge dataset files to the `/data/Dataset` folder (not included in this repository due to size)

### Required Data Files

You need to add the VAST Challenge dataset files to the `/data/Datasets/` folder:

```
data/
└── Datasets/          # ← ADD THIS FOLDER with CSV files
    ├── Attributes/
    │   ├── Participants.csv
    │   ├── Buildings.csv
    │   ├── Apartments.csv
    │   ├── Employers.csv
    │   ├── Jobs.csv
    │   ├── Pubs.csv
    │   ├── Restaurants.csv
    │   └── Schools.csv
    ├── Activity Logs/
    │   ├── ParticipantStatusLogs1.csv
    │   ├── ParticipantStatusLogs2.csv
    │   └── ... (72 files total)
    └── Journals/
        ├── CheckinJournal.csv
        ├── FinancialJournal.csv
        ├── SocialNetwork.csv
        └── TravelJournal.csv
```

The `docker-entrypoint-initdb.d/` folder with SQL scripts is already included in the repository.

## Quick Start with Docker

1. **Ensure data files are in place** (see Prerequisites section above)

2. **Start all services with monitoring:**
   ```bash
   ./start-with-monitoring.sh
   ```

   This will:
   - Automatically create `.env` file from `.env.example` if it doesn't exist
   - Start PostgreSQL with PostGIS extension
   - Build and start the backend API
   - Automatically initialize the database schema
   - Import CSV data using PostgreSQL's COPY command
   - Build and start the frontend with Nginx
   - Display real-time progress during initialization

   **⚠️ IMPORTANT - First Run:**
   - The **first initialization will take 10-15 minutes** to complete
   - The database volume will use **significant disk space** (several GB)
   - The script will show progress updates as data is migrated from CSV to database
   - **Do not interrupt the process** - let it complete fully
   - Subsequent startups will be much faster (database is persisted in a Docker volume)

3. **Access the application:**
   - **Frontend:** http://localhost
   - **Backend API** (for Bruno/testing): http://localhost:3000

   The frontend includes an Nginx reverse proxy that forwards all `/api/*` requests to the backend.

4. **Test the API with Bruno:**

   A Bruno API collection is included in the `/brun-endpointso/` folder with example requests for all endpoints. Import this collection into [Bruno](https://www.usebruno.com/) to quickly test the API.

5. **Stop all services:**
   ```bash
   docker-compose down
   ```

6. **Complete cleanup (including database):**
   ```bash
   ./cleanup.sh
   ```
   **⚠️ WARNING:** This will delete all Docker volumes, including the database. The next startup will require a **full re-import of all data (10-15 minutes)** and will consume disk space again.

## Technologies Used

### Backend
- **Node.js** 20 with **TypeScript**
- **Express.js** - REST API framework
- **PostgreSQL** 15 with **PostGIS** - Spatial database
- **pg** - PostgreSQL client
- **csv-parser** - CSV data import

### Frontend
- **React** 19
- **Vite** - Build tool and dev server
- **TypeScript**

### DevOps
- **Docker** & **Docker Compose**
- **Nginx** - Frontend serving and API reverse proxy

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
│  - Auto-initializes DB on first run    │
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

## Troubleshooting

### Database connection issues
- Ensure PostgreSQL is running
- Check the `.env` file has correct credentials
- Verify the database `vast_challenge` exists
- Ensure PostGIS extension is installed: `CREATE EXTENSION postgis;`

### Docker issues
- **Clear Docker cache:**
  ```bash
  docker-compose down -v
  docker system prune -a
  ```
- **Check logs:**
  ```bash
  docker-compose logs -f
  ```
- **Verify containers are running:**
  ```bash
  docker-compose ps
  ```

### Data import issues
- Database schema is automatically initialized on first run
- Check CSV files exist in `data/Datasets/`

### Port conflicts
- If port 80 is already in use, edit `docker-compose.yml`:
  ```yaml
  ports:
    - "8080:80"  # Change to your preferred port
  ```

## Security Notes

- The database is isolated in the internal Docker network
- Only the frontend and backend are exposed to the host machine (for testing)
- All API requests are proxied through Nginx
- Environment variables should be configured properly in production
- CORS is enabled on the backend for development purposes