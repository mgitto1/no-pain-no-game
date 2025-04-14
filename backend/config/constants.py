import os
from pathlib import Path

# Base paths
BASE_DIR = Path(__file__).parent.parent.parent
FRONTEND_DIR = BASE_DIR / 'frontend'

# File paths
HEARTBEAT_FILE = BASE_DIR / "poller_heartbeat.txt"
LOG_FILE = BASE_DIR / "nopainnogame.log"
HOSTS_PATH = "/etc/hosts"
BLOCKED_CONFIG_PATH = FRONTEND_DIR / 'blocked_config.json'
CURRENT_WORKOUT_PATH = FRONTEND_DIR / 'current_workout.json'
GOAL_STATUS_PATH = FRONTEND_DIR / 'goal_status.json'

# Network settings
REDIRECT_IP = "127.0.0.1"
DATABASE_URL = "https://nopainnogameapp-default-rtdb.firebaseio.com/.json"

# Polling settings
POLL_INTERVAL = 10  # seconds
