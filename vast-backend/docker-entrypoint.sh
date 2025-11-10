#!/bin/sh
set -e

echo "Waiting for PostgreSQL to be ready..."
until node -e "const { Pool } = require('pg'); const pool = new Pool({ host: process.env.DB_HOST, port: process.env.DB_PORT, database: process.env.DB_NAME, user: process.env.DB_USER, password: process.env.DB_PASSWORD }); pool.query('SELECT 1').then(() => { console.log('DB ready'); process.exit(0); }).catch(() => { process.exit(1); });" 2>/dev/null; do
  echo "Waiting for database connection..."
  sleep 2
done

echo "Database is ready!"

# Check if database needs initialization
DB_INITIALIZED=$(node -e "const { Pool } = require('pg'); const pool = new Pool({ host: process.env.DB_HOST, port: process.env.DB_PORT, database: process.env.DB_NAME, user: process.env.DB_USER, password: process.env.DB_PASSWORD }); pool.query(\"SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'participants')\").then((r) => { console.log(r.rows[0].exists); process.exit(0); }).catch(() => { console.log('false'); process.exit(0); });" 2>/dev/null || echo "false")

if [ "$DB_INITIALIZED" = "false" ]; then
  echo "Initializing database schema..."
  node dist/scripts/initDb.js || echo "Failed to initialize database"

  echo "Importing data..."
  node dist/scripts/importData.js || echo "Failed to import data"
else
  echo "Database already initialized, skipping setup"
fi

# Start the application
echo "Starting application..."
exec "$@"
