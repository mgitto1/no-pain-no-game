from typing import List, Set
from pathlib import Path
from ..utils.exceptions import HostsFileError
from ..utils.logger import Logger
from ..config.constants import HOSTS_PATH, REDIRECT_IP

class HostsManager:
    def __init__(self, logger: Logger):
        self.logger = logger

    def _expand_site_list(self, sites: List[str]) -> Set[str]:
        """Expand site list to include www variants."""
        return {site for s in sites for site in (s, f"www.{s}" if not s.startswith("www.") else s)}

    def clear_all_blocked_sites(self, skip_poller_check: bool = False) -> None:
        """Remove all blocked sites from the hosts file.

        Args:
            skip_poller_check: If True, skips checking if the poller is active.
                             This should be True when called during cleanup.
        """
        if not skip_poller_check:
            self._verify_poller_active()

        self.logger.info("Clearing all blocked sites from hosts file.")
        try:
            with open(HOSTS_PATH, "r") as file:
                lines = file.readlines()

            with open(HOSTS_PATH, "w") as file:
                for line in lines:
                    stripped = line.strip()
                    # Keep localhost entries and other system entries
                    if stripped.startswith("127.0.0.1") and "localhost" in stripped:
                        file.write(line)
                    elif stripped.startswith("::1") and "localhost" in stripped:
                        file.write(line)
                    elif stripped.startswith("255.255.255.255"):
                        file.write(line)
                    elif stripped.startswith("#"):
                        file.write(line)
                    # Only remove lines that start with our redirect IPs and don't contain localhost
                    elif not (stripped.startswith(REDIRECT_IP) or stripped.startswith("::1")):
                        file.write(line)
        except PermissionError:
            self.logger.error("Permission denied while modifying /etc/hosts. Try running with sudo.")
            raise HostsFileError("Permission denied while modifying /etc/hosts")
        except Exception as e:
            self.logger.error(f"Failed to clear blocked sites: {e}")
            raise HostsFileError(f"Failed to clear blocked sites: {e}")

    def block_websites(self, sites: List[str]) -> None:
        """Block specified websites by modifying the hosts file."""
        sites = self._expand_site_list(sites)
        self.logger.info("Blocking distracting websites.")

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
            self.logger.error("Permission denied while modifying /etc/hosts. Try running with sudo.")
            raise HostsFileError("Permission denied while modifying /etc/hosts")
        except Exception as e:
            self.logger.error(f"Failed to block websites: {e}")
            raise HostsFileError(f"Failed to block websites: {e}")

    def unblock_websites(self, sites: List[str]) -> None:
        """Unblock specified websites by removing them from the hosts file."""
        sites = self._expand_site_list(sites)
        self.logger.info("Unblocking distracting websites.")

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
            self.logger.error("Permission denied while modifying /etc/hosts. Try running with sudo.")
            raise HostsFileError("Permission denied while modifying /etc/hosts")
        except Exception as e:
            self.logger.error(f"Failed to unblock websites: {e}")
            raise HostsFileError(f"Failed to unblock websites: {e}")
