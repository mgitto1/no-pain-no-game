import json
from pathlib import Path
from typing import Tuple, Dict, Any
from ..utils.exceptions import ConfigError
from ..utils.logger import Logger

class ConfigManager:
    def __init__(self, config_path: Path, logger: Logger):
        self.config_path = config_path
        self.logger = logger
        self._ensure_config_exists()

    def _ensure_config_exists(self) -> None:
        """Ensure the config file exists with default values if it doesn't."""
        try:
            if not self.config_path.exists():
                self._write_config({"apps": [], "sites": []})
        except Exception as e:
            raise ConfigError(f"Failed to initialize config file: {e}")

    def _write_config(self, config: Dict[str, Any]) -> None:
        """Write configuration to file."""
        try:
            with self.config_path.open('w') as f:
                json.dump(config, f, indent=2)
        except Exception as e:
            raise ConfigError(f"Failed to write config: {e}")

    def load_config(self) -> Tuple[list, list]:
        """Load and return the current configuration."""
        try:
            with self.config_path.open('r') as f:
                config = json.load(f)
                return config.get("apps", []), config.get("sites", [])
        except Exception as e:
            self.logger.error(f"Failed to load config: {e}")
            return [], []

    def update_config(self, apps: list, sites: list) -> None:
        """Update the configuration with new values."""
        try:
            self._write_config({"apps": apps, "sites": sites})
            self.logger.info(f"Config updated - Apps: {apps}, Sites: {sites}")
        except Exception as e:
            self.logger.error(f"Failed to update config: {e}")
            raise ConfigError(f"Failed to update config: {e}")
