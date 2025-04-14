#!/usr/bin/env python3
import os
import sys
import signal
from pathlib import Path

# Add the project root to Python path
project_root = Path(__file__).parent.absolute()
sys.path.insert(0, str(project_root))

# Import the poller
from backend.firebase_poller import FirebasePoller

# Global poller instance
poller = None

def graceful_exit(sig, frame):
    """Handle graceful shutdown."""
    if poller:
        poller.cleanup()
    sys.exit(0)

if __name__ == "__main__":
    # Create poller instance
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
