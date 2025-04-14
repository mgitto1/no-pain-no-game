class PollerError(Exception):
    """Base exception for poller-related errors."""
    pass

class LoggingError(PollerError):
    """Exception raised for logging-related errors."""
    pass

class ConfigError(PollerError):
    """Exception raised for configuration-related errors."""
    pass

class FirebaseError(PollerError):
    """Exception raised for Firebase-related errors."""
    pass

class HostsFileError(PollerError):
    """Exception raised for /etc/hosts file-related errors."""
    pass

class ProcessError(PollerError):
    """Exception raised for process-related errors."""
    pass
