#!/bin/bash
# Wrapper script to start docker-compose and monitor database initialization

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

# Start all services in detached mode
echo "Starting services..."
docker-compose up -d

# Wait a moment for containers to start
sleep 2

# Check if this is the first initialization
DB_INITIALIZED=$(docker exec vast-postgres psql -U postgres -d vast_challenge -tAc "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public' AND table_name='participants'" 2>/dev/null || echo "0")

if [ "$DB_INITIALIZED" = "0" ]; then
    echo ""
    echo "════════════════════════════════════════════════════════════"
    echo "  Database Initialization in Progress"
    echo "════════════════════════════════════════════════════════════"
    echo ""
    echo "Following initialization progress..."
    echo "────────────────────────────────────────────────────────────"
    echo ""

    # Follow postgres logs and filter for NOTICE messages until completion
    docker logs -f vast-postgres 2>&1 | grep --line-buffered "NOTICE" | {
        while read -r line; do
            # Exit when we see the completion marker (before echoing it)
            if echo "$line" | grep -q "INIT_COMPLETE_READY"; then
                break
            fi
            echo "$line"
        done
        # Kill the docker logs process
        pkill -f "docker logs -f vast-postgres"
    }

    echo ""
    echo "════════════════════════════════════════════════════════════"
    echo "  All Services Ready!"
    echo "════════════════════════════════════════════════════════════"
    echo ""
    echo "  Frontend:  http://localhost"
    echo "  Backend:   http://localhost:3000"
    echo "  API Stats: http://localhost:3000/api/data/stats"
    echo ""
    echo "Use 'docker-compose logs -f' to view all service logs"
    echo "Use 'docker-compose down' to stop services"
    echo "Use 'docker-compose down -v' to stop and remove volumes"
    echo ""
else
    echo ""
    echo "Database already initialized. Services started."
    echo ""
    echo "  Frontend:  http://localhost"
    echo "  Backend:   http://localhost:3000"
    echo "  API Stats: http://localhost:3000/api/data/stats"
    echo ""
    echo "Use 'docker-compose logs -f [service]' to view logs"
    echo ""
fi
