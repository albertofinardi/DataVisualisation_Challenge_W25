#!/bin/bash

# Restore PostgreSQL database from dump file
set -e

EXPORT_DIR="./db-exports"
CONTAINER_NAME="vast-postgres"
DB_NAME="vast_challenge"
DB_USER="postgres"
DB_PASSWORD="postgres"

echo "================================================"
echo "Database Restore Tool"
echo "================================================"

# Check if import file is provided
if [ -z "$1" ]; then
    echo "❌ Error: No dump file specified!"
    echo ""
    echo "Usage: ./restore-database.sh <dump-file>"
    echo ""
    if [ -d "$EXPORT_DIR" ]; then
        echo "Available dump files:"
        ls -lh "$EXPORT_DIR"/*.sql.gz 2>/dev/null || echo "  (none found)"
    fi
    echo ""
    echo "Example:"
    echo "  ./restore-database.sh vast_db_dump_20241116_194657.sql.gz"
    exit 1
fi

IMPORT_FILE="$1"

# Check if file exists (try both with and without db-exports prefix)
if [ ! -f "$IMPORT_FILE" ] && [ -f "$EXPORT_DIR/$IMPORT_FILE" ]; then
    IMPORT_FILE="$EXPORT_DIR/$IMPORT_FILE"
fi

if [ ! -f "$IMPORT_FILE" ]; then
    echo "❌ Error: Dump file not found: $IMPORT_FILE"
    exit 1
fi

echo "📦 Dump file: $IMPORT_FILE"
echo ""

# Warning prompt
echo "⚠️  WARNING: This will replace all existing database data!"
read -p "Are you sure? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "Cancelled."
    exit 0
fi

echo ""
echo "🛑 Stopping all services..."
docker-compose down -v

echo "🚀 Starting PostgreSQL..."
docker-compose up -d postgres

echo "⏳ Waiting for PostgreSQL to be ready..."
MAX_RETRIES=30
RETRY_COUNT=0
until docker exec "$CONTAINER_NAME" sh -c "PGPASSWORD=$DB_PASSWORD pg_isready -h localhost -U $DB_USER" > /dev/null 2>&1; do
    RETRY_COUNT=$((RETRY_COUNT + 1))
    if [ $RETRY_COUNT -ge $MAX_RETRIES ]; then
        echo "❌ Error: PostgreSQL failed to start after ${MAX_RETRIES} attempts"
        echo "Check logs with: docker logs $CONTAINER_NAME"
        exit 1
    fi
    echo "  Waiting... (attempt $RETRY_COUNT/$MAX_RETRIES)"
    sleep 2
done
echo "✅ PostgreSQL is ready"
echo ""

echo "⏳ Waiting for authentication system to initialize..."
sleep 5
echo ""

echo "📥 Importing database (this may take 10-15 minutes)..."
gunzip -c "$IMPORT_FILE" | docker exec -i "$CONTAINER_NAME" sh -c \
    "PGPASSWORD=$DB_PASSWORD pg_restore -h localhost -U $DB_USER -d $DB_NAME --clean --if-exists --no-owner --no-acl"

echo ""
echo "✅ Restore complete!"
echo ""
echo "To start all services, run:"
echo "  docker-compose up -d"
echo ""
