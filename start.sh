#!/bin/bash

# Ensure we are in the script's directory
cd "$(dirname "$0")"

if [ ! -f ".env" ]; then
    echo "Creating .env file from .env.example..."
    cp .env.example .env
fi

echo "===================================================="
echo "   SafeSight-MLOps — Docker Launcher"
echo "===================================================="
echo ""
echo " --- START (uses cached images, fast) ---"
echo " [1] All projects"
echo " [2] SafeSight only     (web-dashboard)        :4000"
echo " [3] MedFlow 2 only     (hospital mgmt)        :3010"
echo " [4] EcoTrack only      (waste logistics)      :3008"
echo " [5] SmartRetail only   (retail intelligence)  :3005"
echo " [6] AI Engine only     (YOLOv8 detection)"
echo " [7] SafeSight + AI     (core system)"
echo ""
echo " --- REBUILD (downloads + rebuilds images, slow) ---"
echo " [R] Rebuild all images"
echo ""
echo " --- STOP ---"
echo " [8] Stop all containers"
echo " [9] Stop all and wipe volumes (RESET DATA)"
echo ""
read -p "Enter choice [1-9, R]: " choice

# Handle docker-compose vs docker compose fallback if needed
DOCKER_CMD="docker-compose"
if ! command -v docker-compose &> /dev/null; then
    DOCKER_CMD="docker compose"
fi

case "$choice" in
    1) $DOCKER_CMD --profile safesight --profile medflow2 --profile ecotrack --profile smartretail --profile ai up --remove-orphans ;;
    2) $DOCKER_CMD --profile safesight up --remove-orphans ;;
    3) $DOCKER_CMD --profile medflow2 up --remove-orphans ;;
    4) $DOCKER_CMD --profile ecotrack up --remove-orphans ;;
    5) $DOCKER_CMD --profile smartretail up --remove-orphans ;;
    6) $DOCKER_CMD --profile ai up --remove-orphans ;;
    7) $DOCKER_CMD --profile safesight --profile ai up --remove-orphans ;;
    R|r) $DOCKER_CMD --profile safesight --profile medflow2 --profile ecotrack --profile smartretail --profile ai up --build --remove-orphans ;;
    8) $DOCKER_CMD --profile safesight --profile medflow2 --profile ecotrack --profile smartretail --profile ai down --remove-orphans ;;
    9) $DOCKER_CMD --profile safesight --profile medflow2 --profile ecotrack --profile smartretail --profile ai down -v --remove-orphans ;;
    *) echo "Invalid choice." ;;
esac

echo ""
echo "Done."
