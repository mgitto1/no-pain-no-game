import React, { createContext, useContext, useState, useEffect } from 'react';

interface PollerContextType {
  pollerRunning: boolean;
  goalReached: boolean;
  canModifyRestrictions: boolean;
}

const PollerContext = createContext<PollerContextType>({
  pollerRunning: false,
  goalReached: false,
  canModifyRestrictions: false,
});

export const PollerProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [pollerRunning, setPollerRunning] = useState(false);
  const [goalReached, setGoalReached] = useState(false);

  useEffect(() => {
    const checkStatus = async () => {
      const isRunning = window?.electron?.isPollerRunning?.();
      setPollerRunning(isRunning);

      if (isRunning) {
        const data = await window?.electron?.getGoalStatus?.();
        setGoalReached(data?.goalReachedToday ?? false);
      }
    };

    checkStatus();
  }, []);

  useEffect(() => {
    const interval = setInterval(async () => {
      const isRunning = window?.electron?.isPollerRunning?.();
      setPollerRunning(isRunning);

      if (isRunning) {
        const data = await window?.electron?.getGoalStatus?.();
        setGoalReached(data?.goalReachedToday ?? false);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const canModifyRestrictions = pollerRunning;

  // TODO: When goal reached is properly being queried, uncomment
  // const canModifyRestrictions = pollerRunning && goalReached;

  return (
    <PollerContext.Provider
      value={{ pollerRunning, goalReached, canModifyRestrictions }}
    >
      {children}
    </PollerContext.Provider>
  );
};

export const usePoller = () => useContext(PollerContext);
