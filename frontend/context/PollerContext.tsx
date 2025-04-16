import React, { createContext, useContext, useState, useEffect } from 'react';

interface PollerContextType {
  pollerRunning: boolean;
  goalReached: boolean;
  restrictionsEnabled: boolean;
  canModifyRestrictions: boolean;
  lastSyncedAt: Date | null;
}

const PollerContext = createContext<PollerContextType>({
  pollerRunning: false,
  goalReached: false,
  restrictionsEnabled: true,
  canModifyRestrictions: false,
  lastSyncedAt: null,
});

export const PollerProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [pollerRunning, setPollerRunning] = useState(false);
  const [goalReached, setGoalReached] = useState(false);
  const [restrictionsEnabled, setRestrictionsEnabled] = useState(true);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);

  useEffect(() => {
    const checkStatus = async () => {
      const isRunning = window?.electron?.isPollerRunning?.();
      setPollerRunning(isRunning);

      if (isRunning) {
        const data = await window?.electron?.getGoalStatus?.();
        setGoalReached(data?.goalReachedToday ?? false);

        // Fetch restrictions enabled status
        const res = await fetch(
          'https://nopainnogameapp-default-rtdb.firebaseio.com/restrictionsEnabled.json'
        );
        const value = await res.json();
        setRestrictionsEnabled(Boolean(value));
      }
    };

    checkStatus();
  }, []);

  useEffect(() => {
    const fetchLastSynced = async () => {
      const res = await fetch(
        'https://nopainnogameapp-default-rtdb.firebaseio.com/lastSyncedAt.json'
      );
      const timestamp = await res.json();

      if (timestamp) {
        setLastSyncedAt(new Date(timestamp));
      }
    };

    fetchLastSynced();

    const interval = setInterval(fetchLastSynced, 30_000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(async () => {
      const isRunning = window?.electron?.isPollerRunning?.();
      setPollerRunning(isRunning);

      if (isRunning) {
        const data = await window?.electron?.getGoalStatus?.();
        setGoalReached(data?.goalReachedToday ?? false);

        // Fetch restrictions enabled status
        const res = await fetch(
          'https://nopainnogameapp-default-rtdb.firebaseio.com/restrictionsEnabled.json'
        );
        const value = await res.json();
        setRestrictionsEnabled(Boolean(value));
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const canModifyRestrictions = pollerRunning && !restrictionsEnabled;

  return (
    <PollerContext.Provider
      value={{
        pollerRunning,
        goalReached,
        restrictionsEnabled,
        canModifyRestrictions,
        lastSyncedAt,
      }}
    >
      {children}
    </PollerContext.Provider>
  );
};

export const usePoller = () => useContext(PollerContext);
