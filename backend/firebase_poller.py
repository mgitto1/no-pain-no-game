import os
import sys
import time
import json
import psutil
import signal
import requests
from datetime import datetime, date
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
from pathlib import Path

from backend.config.constants import HEARTBEAT_FILE, LOG_FILE, CURRENT_WORKOUT_PATH, POLL_INTERVAL, GOAL_STATUS_PATH
from backend.utils.logger import Logger
from backend.utils.exceptions import PollerError
from backend.services.config_manager import ConfigManager
from backend.services.firebase_service import FirebaseService
from backend.services.process_manager import ProcessManager
from backend.services.hosts_manager import HostsManager

# === Constants ===
HOSTS_PATH = "/etc/hosts"
REDIRECT_IP = "127.0.0.1"
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BLOCKED_CONFIG_PATH = os.path.join(BASE_DIR, 'frontend', 'blocked_config.json')
DATABASE_URL = "https://nopainnogameapp-default-rtdb.firebaseio.com/.json"
last_reset_date = date.today()
last_blocked_sites = set()

# === Utility Functions ===

def log_event(message):
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    full_message = f"[{timestamp}] {message}"
    print(full_message)
    with open(LOG_FILE, "a") as f:
        f.write(full_message + "\n")


def display_notification(message, title=None, subtitle=None, soundname=None):
    parts = [
        f'with title "{title}"' if title else '',
        f'subtitle "{subtitle}"' if subtitle else '',
        f'sound name "{soundname}"' if soundname else ''
    ]
    script = f'display notification "{message}" {" ".join(parts)}'
    os.system(f"osascript -e '{script}'")


def expand_site_list(sites):
    return list({site for s in sites for site in (s, f"www.{s}" if not s.startswith("www.") else s)})


def load_block_config():
    try:
        with open(BLOCKED_CONFIG_PATH, "r") as f:
            config = json.load(f)
            return config.get("apps", []), config.get("sites", [])
    except Exception as e:
        log_event(f"⚠️ Failed to load block config: {e}")
        return [], []


def get_goal_status():
    try:
        response = requests.get(DATABASE_URL)
        response.raise_for_status()
        return response.json()
    except requests.RequestException as e:
        log_event(f"❌ Error contacting Firebase: {e}")
        return None

def block_websites(sites):
    sites = expand_site_list(sites)
    log_event("🔒 Blocking distracting websites.")

    try:
        with open(HOSTS_PATH, "r+") as file:
            content = file.read()
            file.seek(0)
            for site in sites:
                for entry in (f"{REDIRECT_IP} {site}", f"::1 {site}"):
                    if entry not in content:
                        file.write(entry + "\n")
            file.write(content)
    except PermissionError:
        log_event("❌ Permission denied while modifying /etc/hosts. Try running with sudo.")
    except Exception as e:
        log_event(f"❌ Failed to block websites: {e}")


def unblock_websites(sites):
    sites = expand_site_list(sites)
    log_event("🔓 Unblocking distracting websites.")

    try:
        with open(HOSTS_PATH, "r") as file:
            lines = file.readlines()

        with open(HOSTS_PATH, "w") as file:
            for line in lines:
                stripped = line.strip()
                if not any(
                    stripped.startswith(f"{ip} {site}") or stripped.startswith(f"{ip} www.{site}")
                    for site in sites
                    for ip in (REDIRECT_IP, "::1")
                ):
                    file.write(line)
    except PermissionError:
        log_event("❌ Permission denied while modifying /etc/hosts. Try running with sudo.")
    except Exception as e:
        log_event(f"❌ Failed to unblock websites: {e}")


def block_apps(apps):
    found = False
    for proc in psutil.process_iter(attrs=['pid', 'name']):
        try:
            name = proc.info['name']
            if any(app.lower() in name.lower() for app in apps):
                os.kill(proc.info['pid'], signal.SIGKILL)
                log_event(f"💣 Force-killed: {name}")
                found = True
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            continue

    if found:
        display_notification(
            "Please complete your goals before using blocked applications.",
            title="Applications Blocked",
            soundname="Pop"
        )
        log_event("💣 Applications blocked.")
    else:
        log_event("ℹ️ No blocked apps were running.")


def unblock_apps(apps):
    log_event("✅ unblock_apps() called – nothing to do.")


def reset_goal_in_firebase():
    try:
        response = requests.put(
            DATABASE_URL,
            json=False,
            headers={"Content-Type": "application/json"},
        )
        if response.ok:
            log_event("🕛 Reset goalReachedToday to false at midnight.")
        else:
            log_event(f"❌ Failed to reset goal: {response.text}")
    except Exception as e:
        log_event(f"❌ Exception during goal reset: {e}")


class ConfigChangeHandler(FileSystemEventHandler):
    def __init__(self, poller):
        self.poller = poller

    def on_modified(self, event):
        if event.src_path == str(self.poller.config_manager.config_path):
            self.poller.handle_config_change()


class FirebasePoller:
    def __init__(self):
        self.logger = Logger(Path(LOG_FILE))
        self.config_manager = ConfigManager(Path(BLOCKED_CONFIG_PATH), self.logger)
        self.firebase_service = FirebaseService(self.logger)
        self.process_manager = ProcessManager(self.logger)
        self.hosts_manager = HostsManager(self.logger)
        self.last_state = None

    def setup_heartbeat(self) -> None:
        """Create the heartbeat file to indicate the poller is running."""
        try:
            with open(HEARTBEAT_FILE, "w") as f:
                f.write("✅ Poller is running\n")
            self.logger.info("Heartbeat file written.")
        except Exception as e:
            self.logger.error(f"Failed to write heartbeat: {e}")
            raise PollerError(f"Failed to write heartbeat: {e}")

    def cleanup(self) -> None:
        """Clean up resources when shutting down."""
        self.logger.info("Cleaning up... unblocking apps and websites.")
        apps, sites = self.config_manager.load_config()
        self.process_manager.unblock_apps(apps)
        self.hosts_manager.clear_all_blocked_sites(skip_poller_check=True)

        if Path(HEARTBEAT_FILE).exists():
            Path(HEARTBEAT_FILE).unlink()
            self.logger.info("Heartbeat file removed.")

    def handle_config_change(self) -> None:
        """Handle changes to the configuration file."""
        try:
            apps, sites = self.config_manager.load_config()
            self.logger.info("Block config updated.")
            self.logger.info(f"Apps to block: {apps}")
            self.logger.info(f"Sites to block: {sites}")

            if self.firebase_service.get_goal_status() is False:
                self.process_manager.block_apps(apps)
                self.hosts_manager.block_websites(sites)
        except Exception as e:
            self.logger.error(f"Failed to reload config: {e}")

    def update_workout_minutes(self, minutes: int) -> None:
        """Update the current workout minutes in the frontend."""
        try:
            with open(CURRENT_WORKOUT_PATH, "w") as f:
                json.dump({"minutes": minutes}, f)
        except Exception as e:
            self.logger.error(f"Failed to update workout minutes: {e}")

    def update_goal_status(self, status: bool) -> None:
        """Update the goal status in the frontend."""
        try:
            with open(GOAL_STATUS_PATH, "w") as f:
                json.dump({"goalReachedToday": status}, f)
        except Exception as e:
            self.logger.error(f"Failed to update goal status: {e}")

    def run(self) -> None:
        """Main polling loop."""
        self.logger.info("Starting Firebase poller...")
        self.setup_heartbeat()

        # Setup config file watcher
        event_handler = ConfigChangeHandler(self)
        observer = Observer()
        observer.schedule(event_handler, path=str(self.config_manager.config_path.parent), recursive=False)
        observer.start()

        try:
            while True:
                data = self.firebase_service.get_goal_status() or {}
                status = data.get("goalReachedToday", False)
                current_minutes = data.get("workoutMinutesToday", 0)
                apps, sites = self.config_manager.load_config()

                # Update workout minutes and goal status
                self.update_workout_minutes(current_minutes)
                self.update_goal_status(status)

                # Reset Firebase daily
                if self.firebase_service.should_reset_goal():
                    self.firebase_service.reset_goal()

                # Handle blocking/unblocking based on status
                if status is False:
                    self.logger.info(f"Detected goalReachedToday: {status}")
                    self.process_manager.block_apps(apps)
                    self.hosts_manager.block_websites(sites)
                elif status is True:
                    self.process_manager.unblock_apps(apps)
                    self.hosts_manager.unblock_websites(sites)

                self.last_state = status
                time.sleep(POLL_INTERVAL)
        finally:
            observer.stop()
            observer.join()


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
