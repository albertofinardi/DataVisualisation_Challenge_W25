#!/bin/sh
set -e

echo "Setting up SQLite database..."

# Ensure data directory exists
mkdir -p /app/data

# Initialize schema
echo "Initializing database schema..."
node dist/scripts/initDb.js

echo "Database setup complete"
exec "$@"
