#!/usr/bin/env python3
import os
import sys
import signal
from pathlib import Path

# Get the absolute path to the project root
PROJECT_ROOT = Path(__file__).parent.parent.absolute()

# Add the project root to the Python path
sys.path.insert(0, str(PROJECT_ROOT))

from backend.firebase_poller import FirebasePoller
from backend.utils.logger import Logger
from backend.config.constants import LOG_FILE

def graceful_exit(signum, frame):
    """Handle graceful exit on SIGINT and SIGTERM."""
    logger = Logger(Path(LOG_FILE))
    logger.info("Received exit signal. Cleaning up...")
    poller.cleanup()
    sys.exit(0)

if __name__ == "__main__":
    poller = FirebasePoller()

    # Setup signal handlers
    signal.signal(signal.SIGINT, graceful_exit)
    signal.signal(signal.SIGTERM, graceful_exit)

    try:
        poller.run()
    except Exception as e:
        poller.logger.error(f"Fatal error: {e}")
        poller.cleanup()
        sys.exit(1)
