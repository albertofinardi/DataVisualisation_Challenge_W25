#!/bin/bash

# Manual data import script for VAST Challenge database
# This script imports data into the running postgres container
# Run this script only when you want to populate/refresh the database

set -e

echo "=========================================="
echo "VAST Challenge Data Import"
echo "=========================================="
echo ""

# Check if postgres container is running
if ! docker ps | grep -q vast-postgres; then
    echo "Error: vast-postgres container is not running"
    echo "Please start containers first with: docker-compose up -d"
    exit 1
fi

# Check if postgres is ready
echo "Waiting for PostgreSQL to be ready..."
until docker exec vast-postgres pg_isready -U postgres > /dev/null 2>&1; do
    echo "  Waiting for database..."
    sleep 2
done
echo "✓ PostgreSQL is ready"
echo ""

# Confirm with user
echo "⚠️  WARNING: This will import data into the database."
echo "   This process takes approximately 10-15 minutes with optimizations."
echo ""
read -p "Do you want to proceed? (y/n): " -r REPLY
echo ""
REPLY=$(echo "$REPLY" | xargs | tr '[:upper:]' '[:lower:]')
if [[ "$REPLY" != "y" && "$REPLY" != "yes" ]]; then
    echo "Import cancelled."
    exit 0
fi

echo "Starting data import with optimized settings..."
echo "You can monitor progress with: docker logs vast-postgres -f"
echo ""

# Save current PostgreSQL settings
echo "→ Saving current PostgreSQL settings..."
docker exec vast-postgres sh -c "PGPASSWORD=\$POSTGRES_PASSWORD psql -h localhost -U \$POSTGRES_USER -d \$POSTGRES_DB -c \"
CREATE TABLE IF NOT EXISTS temp_pg_settings_backup (
    name TEXT PRIMARY KEY,
    setting TEXT
);
TRUNCATE temp_pg_settings_backup;
INSERT INTO temp_pg_settings_backup
SELECT name, setting FROM pg_settings
WHERE name IN (
    'max_wal_size', 'checkpoint_timeout', 'maintenance_work_mem',
    'synchronous_commit', 'wal_buffers', 'shared_buffers'
);
\"" > /dev/null 2>&1

# Apply bulk import optimizations
echo "→ Applying bulk import optimizations..."
docker exec vast-postgres sh -c "PGPASSWORD=\$POSTGRES_PASSWORD psql -h localhost -U \$POSTGRES_USER -d \$POSTGRES_DB" <<'EOF' > /dev/null 2>&1
ALTER SYSTEM SET max_wal_size = '8GB';
ALTER SYSTEM SET min_wal_size = '2GB';
ALTER SYSTEM SET wal_buffers = '32MB';
ALTER SYSTEM SET checkpoint_timeout = '1h';
ALTER SYSTEM SET checkpoint_completion_target = '0.9';
ALTER SYSTEM SET maintenance_work_mem = '2GB';
ALTER SYSTEM SET work_mem = '256MB';
ALTER SYSTEM SET effective_cache_size = '4GB';
ALTER SYSTEM SET synchronous_commit = 'off';
ALTER SYSTEM SET wal_writer_delay = '10000ms';
ALTER SYSTEM SET commit_delay = '100000';
ALTER SYSTEM SET commit_siblings = '5';
ALTER SYSTEM SET autovacuum = 'off';
EOF

# Reload configuration
docker exec vast-postgres sh -c "PGPASSWORD=\$POSTGRES_PASSWORD psql -h localhost -U \$POSTGRES_USER -d \$POSTGRES_DB -c 'SELECT pg_reload_conf();'" > /dev/null 2>&1
sleep 2
echo "✓ Optimizations applied"
echo ""

# Copy init scripts into the container
echo "→ Copying SQL scripts into container..."
docker exec vast-postgres mkdir -p /tmp/init-scripts
docker cp data/init-scripts/. vast-postgres:/tmp/init-scripts/

# Run the SQL scripts in order
echo "→ [1/3] Creating schema..."
docker exec vast-postgres sh -c "PGPASSWORD=\$POSTGRES_PASSWORD psql -h localhost -U \$POSTGRES_USER -d \$POSTGRES_DB -f /tmp/init-scripts/01_schema.sql"

echo "→ [2/3] Loading staging data (this will take ~2-3 minutes with optimizations)..."
docker exec vast-postgres sh -c "PGPASSWORD=\$POSTGRES_PASSWORD psql -h localhost -U \$POSTGRES_USER -d \$POSTGRES_DB -f /tmp/init-scripts/02_load_staging.sql"

echo "→ [3/3] Transforming data (this will take ~8-12 minutes with optimizations)..."
docker exec vast-postgres sh -c "PGPASSWORD=\$POSTGRES_PASSWORD psql -h localhost -U \$POSTGRES_USER -d \$POSTGRES_DB -f /tmp/init-scripts/03_transform.sql"

# Restore original PostgreSQL settings
echo ""
echo "→ Restoring original PostgreSQL settings..."
docker exec vast-postgres sh -c "PGPASSWORD=\$POSTGRES_PASSWORD psql -h localhost -U \$POSTGRES_USER -d \$POSTGRES_DB" <<'EOF' > /dev/null 2>&1
ALTER SYSTEM RESET max_wal_size;
ALTER SYSTEM RESET min_wal_size;
ALTER SYSTEM RESET wal_buffers;
ALTER SYSTEM RESET checkpoint_timeout;
ALTER SYSTEM RESET checkpoint_completion_target;
ALTER SYSTEM RESET maintenance_work_mem;
ALTER SYSTEM RESET work_mem;
ALTER SYSTEM RESET effective_cache_size;
ALTER SYSTEM RESET synchronous_commit;
ALTER SYSTEM RESET wal_writer_delay;
ALTER SYSTEM RESET commit_delay;
ALTER SYSTEM RESET commit_siblings;
ALTER SYSTEM RESET autovacuum;
DROP TABLE IF EXISTS temp_pg_settings_backup;
EOF

# Reload configuration
docker exec vast-postgres sh -c "PGPASSWORD=\$POSTGRES_PASSWORD psql -h localhost -U \$POSTGRES_USER -d \$POSTGRES_DB -c 'SELECT pg_reload_conf();'" > /dev/null 2>&1
echo "✓ Settings restored to defaults"
echo ""

# Run VACUUM ANALYZE to optimize query planning after bulk import
echo "→ Running VACUUM ANALYZE to optimize database..."
docker exec vast-postgres sh -c "PGPASSWORD=\$POSTGRES_PASSWORD psql -h localhost -U \$POSTGRES_USER -d \$POSTGRES_DB -c 'VACUUM ANALYZE;'" > /dev/null 2>&1
echo "✓ Database optimized"
echo ""

# Verify data was imported
echo "→ Verifying data import..."
PARTICIPANT_COUNT=$(docker exec vast-postgres sh -c "PGPASSWORD=\$POSTGRES_PASSWORD psql -h localhost -U \$POSTGRES_USER -d \$POSTGRES_DB -tAc 'SELECT COUNT(*) FROM participant_status_logs;'" 2>/dev/null || echo "0")
if [ "$PARTICIPANT_COUNT" = "0" ]; then
    echo "⚠️  WARNING: No data found in participant_status_logs table!"
    echo "   The import may have failed. Check logs with: docker logs vast-postgres"
else
    echo "✓ Verified: $PARTICIPANT_COUNT rows in participant_status_logs"
fi
echo ""

# Clean up
echo "→ Cleaning up temporary files..."
docker exec vast-postgres rm -rf /tmp/init-scripts

# Delete CSV files from the container to save space
echo "→ Removing CSV files from container to save space..."
docker exec vast-postgres rm -rf /data/Datasets
echo "✓ CSV files removed from container"

echo ""
echo "=========================================="
echo "✓ Data import complete!"
echo "=========================================="
echo ""
echo "Database is ready to use."
echo ""
echo "Note: CSV files have been removed from the container"
echo "but remain in your local ./data directory for backup."
