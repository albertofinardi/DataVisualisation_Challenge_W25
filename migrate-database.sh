#!/bin/bash

# Migrate/populate the database using SQL scripts in data/init-scripts
set -e

CONTAINER_NAME="vast-postgres"
DB_NAME="vast_challenge"
DB_USER="postgres"
DB_PASSWORD="postgres"
INIT_SCRIPTS_DIR="./data/init-scripts"

echo "================================================"
echo "Database Migration Tool"
echo "================================================"
echo ""

# Check if container is running
if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo "❌ Error: Container '$CONTAINER_NAME' is not running!"
    echo ""
    echo "Start the container first with: docker-compose up -d postgres"
    exit 1
fi

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

echo "📋 Running migration scripts..."
echo ""

# Run 01_schema.sql
echo "→ Creating schema (01_schema.sql)..."
docker exec -i "$CONTAINER_NAME" sh -c \
    "PGPASSWORD=$DB_PASSWORD psql -h localhost -U $DB_USER -d $DB_NAME" < "$INIT_SCRIPTS_DIR/01_schema.sql"
echo "  ✅ Schema created"
echo ""

# Run 02_load_staging.sql
echo "→ Loading staging data (02_load_staging.sql)..."
echo "  (This may take 5-10 minutes...)"
docker exec -i "$CONTAINER_NAME" sh -c \
    "PGPASSWORD=$DB_PASSWORD psql -h localhost -U $DB_USER -d $DB_NAME" < "$INIT_SCRIPTS_DIR/02_load_staging.sql"
echo "  ✅ Staging data loaded"
echo ""

# Run 03_transform.sql
echo "→ Transforming data (03_transform.sql)..."
echo "  (This may take 5-10 minutes...)"
docker exec -i "$CONTAINER_NAME" sh -c \
    "PGPASSWORD=$DB_PASSWORD psql -h localhost -U $DB_USER -d $DB_NAME" < "$INIT_SCRIPTS_DIR/03_transform.sql"
echo "  ✅ Data transformed"
echo ""

echo "════════════════════════════════════════════════"
echo "✅ Migration complete!"
echo "════════════════════════════════════════════════"
echo ""
echo "Database is ready to use."
echo ""
