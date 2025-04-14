import os
import signal
import psutil
from typing import List, Optional
from ..utils.exceptions import ProcessError
from ..utils.logger import Logger

class ProcessManager:
    def __init__(self, logger: Logger):
        self.logger = logger

    def block_apps(self, apps: List[str]) -> None:
        """Block specified applications by killing their processes."""
        found = False
        for proc in psutil.process_iter(attrs=['pid', 'name']):
            try:
                name = proc.info['name']
                if any(app.lower() in name.lower() for app in apps):
                    os.kill(proc.info['pid'], signal.SIGKILL)
                    self.logger.info(f"Force-killed: {name}")
                    found = True
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                continue

        if found:
            self._display_notification(
                "Please complete your goals before using blocked applications.",
                title="Applications Blocked",
                soundname="Pop"
            )
            self.logger.info("Applications blocked.")
        else:
            self.logger.info("No blocked apps were running.")

    def unblock_apps(self, apps: List[str]) -> None:
        """Unblock applications (currently a no-op as we don't need to do anything)."""
        self.logger.info("unblock_apps() called – nothing to do.")

    def _display_notification(self, message: str, title: Optional[str] = None,
                            subtitle: Optional[str] = None, soundname: Optional[str] = None) -> None:
        """Display a system notification."""
        try:
            parts = [
                f'with title "{title}"' if title else '',
                f'subtitle "{subtitle}"' if subtitle else '',
                f'sound name "{soundname}"' if soundname else ''
            ]
            script = f'display notification "{message}" {" ".join(parts)}'
            os.system(f"osascript -e '{script}'")
        except Exception as e:
            self.logger.error(f"Failed to display notification: {e}")
            raise ProcessError(f"Failed to display notification: {e}")
