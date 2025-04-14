from datetime import datetime
from pathlib import Path
from typing import Optional
from .exceptions import LoggingError

class Logger:
    def __init__(self, log_file: Path):
        self.log_file = log_file
        self._ensure_log_file_exists()

    def _ensure_log_file_exists(self) -> None:
        """Ensure the log file exists and is writable."""
        try:
            self.log_file.parent.mkdir(parents=True, exist_ok=True)
            if not self.log_file.exists():
                self.log_file.touch()
        except Exception as e:
            raise LoggingError(f"Failed to initialize log file: {e}")

    def _format_message(self, message: str, level: str) -> str:
        """Format the log message with timestamp and log level."""
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        return f"[{timestamp}] [{level}] {message}"

    def log(self, message: str, level: str = "INFO") -> None:
        """Log a message with the specified level."""
        try:
            formatted_message = self._format_message(message, level)
            print(formatted_message)
            with self.log_file.open('a') as f:
                f.write(formatted_message + "\n")
        except Exception as e:
            raise LoggingError(f"Failed to write to log file: {e}")

    def error(self, message: str) -> None:
        """Log an error message."""
        self.log(message, "ERROR")

    def warning(self, message: str) -> None:
        """Log a warning message."""
        self.log(message, "WARNING")

    def info(self, message: str) -> None:
        """Log an info message."""
        self.log(message, "INFO")

    def debug(self, message: str) -> None:
        """Log a debug message."""
        self.log(message, "DEBUG")
