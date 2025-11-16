#!/bin/bash

# Export PostgreSQL database to SQL dump file
set -e

EXPORT_DIR="./db-exports"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
EXPORT_FILE="vast_db_dump_${TIMESTAMP}.sql.gz"
CONTAINER_NAME="vast-postgres"
DB_NAME="vast_challenge"
DB_USER="postgres"
DB_PASSWORD="postgres"

echo "================================================"
echo "PostgreSQL Database Export Tool"
echo "================================================"

# Create export directory if it doesn't exist
mkdir -p "$EXPORT_DIR"

# Check if container is running
if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo "❌ Error: Container '$CONTAINER_NAME' is not running!"
    echo ""
    echo "Start the container first with: docker-compose up -d"
    exit 1
fi

echo "📦 Exporting database: $DB_NAME"
echo "📂 Export file: $EXPORT_DIR/$EXPORT_FILE"
echo ""

# Export using pg_dump with custom format (more reliable than SQL format)
docker exec "$CONTAINER_NAME" sh -c \
    "PGPASSWORD=$DB_PASSWORD pg_dump -h localhost -U $DB_USER -d $DB_NAME \
    --format=custom \
    --no-owner \
    --no-acl" | \
    gzip > "$EXPORT_DIR/$EXPORT_FILE"

FILE_SIZE=$(du -h "$EXPORT_DIR/$EXPORT_FILE" | cut -f1)
echo ""
echo "✅ Export successful!"
echo "📊 File size: $FILE_SIZE"
echo "📁 Location: $EXPORT_DIR/$EXPORT_FILE"
echo ""
echo "To restore this backup:"
echo "  ./restore-database.sh $EXPORT_FILE"
echo ""
