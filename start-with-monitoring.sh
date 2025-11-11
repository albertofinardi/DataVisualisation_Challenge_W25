#!/bin/bash
# Wrapper script to start docker-compose and optionally cleanup/import data

echo "════════════════════════════════════════════════════════════"
echo "  Starting VAST Challenge Services"
echo "════════════════════════════════════════════════════════════"
echo ""

# Check and create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "Creating .env file from .env.example..."
    if [ -f .env.example ]; then
        cp .env.example .env
        echo "✓ .env file created"
        echo ""
    else
        echo "ERROR: .env.example file not found!"
        exit 1
    fi
else
    echo "✓ .env file exists"
    echo ""
fi

# Ask for cleanup
echo "Do you want to cleanup existing data and volumes?"
echo "(This will remove all database data)"
read -p "Cleanup? (Y/n) [n]: " -r CLEANUP
echo ""

# Trim whitespace and convert to lowercase for comparison
CLEANUP=$(echo "$CLEANUP" | xargs | tr '[:upper:]' '[:lower:]')

if [[ "$CLEANUP" == "y" || "$CLEANUP" == "yes" ]]; then
    echo "→ Stopping containers and removing volumes..."
    docker-compose down -v
    echo "✓ Cleanup complete"
    echo ""
fi

# Start all services in detached mode
echo "Starting services..."
docker-compose up -d

# Wait a moment for containers to start
sleep 2

# Wait for postgres to be ready
echo "Waiting for PostgreSQL to be ready..."
until docker exec vast-postgres pg_isready -U postgres > /dev/null 2>&1; do
    echo "  Waiting for database..."
    sleep 2
done
echo "✓ PostgreSQL is ready"
echo ""

# Check if database has data
DB_HAS_DATA=$(docker exec vast-postgres psql -U postgres -d vast_challenge -tAc "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public' AND table_name='participants'" 2>/dev/null || echo "0")

if [ "$DB_HAS_DATA" = "0" ]; then
    echo "Database is empty."
    echo ""
    echo "Do you want to import data now?"
    echo "(This will take approximately 10-15 minutes with optimizations)"
    read -p "Import data? (Y/n) [n]: " -r IMPORT
    echo ""

    # Trim whitespace and convert to lowercase for comparison
    IMPORT=$(echo "$IMPORT" | xargs | tr '[:upper:]' '[:lower:]')

    if [[ "$IMPORT" == "y" || "$IMPORT" == "yes" ]]; then
        echo "Starting data import..."
        echo ""

        # Run the import script in background, auto-answering 'yes' to the confirmation
        echo "yes" | ./import-data.sh &
        IMPORT_PID=$!

        # Wait a moment for import to start
        sleep 3

        echo "Following import progress (press Ctrl+C to stop viewing logs, import will continue)..."
        echo "────────────────────────────────────────────────────────────"
        echo ""

        # Follow postgres logs, filtering for relevant messages
        docker logs -f vast-postgres 2>&1 | grep --line-buffered -E "NOTICE|COPY|ALTER SYSTEM|checkpoint" &
        LOGS_PID=$!

        # Wait for import script to complete
        wait $IMPORT_PID
        IMPORT_EXIT_CODE=$?

        # Stop following logs
        kill $LOGS_PID 2>/dev/null || true

        echo ""
        echo "────────────────────────────────────────────────────────────"

        if [ $IMPORT_EXIT_CODE -eq 0 ]; then
            echo "✓ Import completed successfully"
        else
            echo "⚠️  Import script exited with code $IMPORT_EXIT_CODE"
        fi
        echo ""
    else
        echo "Skipping data import."
        echo "You can import data later by running: ./import-data.sh"
        echo ""
    fi
else
    echo "✓ Database already contains data"
    echo ""
fi

echo ""
echo "════════════════════════════════════════════════════════════"
echo "  All Services Ready!"
echo "════════════════════════════════════════════════════════════"
echo ""
echo "  Frontend:  http://localhost"
echo "  Backend:   http://localhost:3000"
echo "  API Stats: http://localhost:3000/api/data/stats"
echo ""
echo "Useful commands:"
echo "  docker-compose logs -f [service]  - View logs"
echo "  docker-compose restart [service]  - Restart a service"
echo "  docker-compose down               - Stop all services"
echo "  ./import-data.sh                  - Import/refresh data"
echo ""
