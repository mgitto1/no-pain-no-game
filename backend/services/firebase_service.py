import requests
from datetime import date
from typing import Optional, Dict, Any
from ..utils.exceptions import FirebaseError
from ..utils.logger import Logger
from ..config.constants import DATABASE_URL

class FirebaseService:
    def __init__(self, logger: Logger):
        self.logger = logger
        self.last_reset_date = date.today()

    def get_goal_status(self) -> Optional[Dict[str, Any]]:
        """Fetch the current goal status from Firebase."""
        try:
            response = requests.get(DATABASE_URL)
            response.raise_for_status()
            return response.json()
        except requests.RequestException as e:
            self.logger.error(f"Error contacting Firebase: {e}")
            return None

    def reset_goal(self) -> None:
        """Reset the goal in Firebase."""
        try:
            response = requests.put(
                DATABASE_URL,
                json=False,
                headers={"Content-Type": "application/json"},
            )
            if response.ok:
                self.logger.info("Reset goalReachedToday to false at midnight.")
            else:
                self.logger.error(f"Failed to reset goal: {response.text}")
        except Exception as e:
            self.logger.error(f"Exception during goal reset: {e}")
            raise FirebaseError(f"Failed to reset goal: {e}")

    def should_reset_goal(self) -> bool:
        """Check if the goal should be reset based on the date."""
        today = date.today()
        if today != self.last_reset_date:
            self.last_reset_date = today
            return True
        return False
