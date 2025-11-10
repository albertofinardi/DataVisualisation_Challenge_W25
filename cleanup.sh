#!/bin/bash
# Script to completely cleanup and reset the VAST Challenge environment

echo "════════════════════════════════════════════════════════════"
echo "  VAST Challenge - Complete Cleanup"
echo "════════════════════════════════════════════════════════════"
echo ""
echo "This will:"
echo "  • Stop all running containers"
echo "  • Remove all containers"
echo "  • Remove the database volume (all data will be lost)"
echo "  • Remove the network"
echo ""
read -p "Are you sure you want to continue? (yes/no): " confirm

if [ "$confirm" != "yes" ] && [ "$confirm" != "y" ]; then
    echo "Cleanup cancelled."
    exit 0
fi

echo ""
echo "Stopping services..."
docker-compose down

echo "Removing volumes..."
docker-compose down -v

echo "Removing any orphaned containers..."
docker container prune -f

echo ""
echo "════════════════════════════════════════════════════════════"
echo "  Cleanup Complete!"
echo "════════════════════════════════════════════════════════════"
echo ""
echo "To start fresh, run:"
echo "  ./start-with-monitoring.sh"
echo ""
