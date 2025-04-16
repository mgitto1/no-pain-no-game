import React from 'react';
import { useEffect, useState } from 'react';
import { Panel, TitleText } from '../components';
import { useBlockConfig } from '../../context';

declare global {
  interface Window {
    electron: {
      isPollerRunning: () => boolean;
      readBlockConfig: () => {
        apps: string[];
        sites: string[];
        availableSites: string[];
      };
      writeBlockConfig: (config: {
        apps: string[];
        sites: string[];
        availableSites: string[];
      }) => void;
      getTargetWorkoutMinutes: () => Promise<number>;
      setTargetWorkoutMinutes: (minutes: number) => void;
      getCurrentWorkoutMinutes: () => Promise<number>;
      getGoalStatus: () => Promise<{ goalReachedToday: boolean }>;
    };
  }
}

export const Dashboard = ({
  setCurrentPage,
}: {
  setCurrentPage: (page: string) => void;
}) => {
  const { blockConfig } = useBlockConfig();
  const { apps: selectedApps, sites: selectedSites } = blockConfig;
  const [currentWorkoutMinutes, setCurrentWorkoutMinutes] = useState<number>(0);
  const [targetWorkoutMinutes, setTargetWorkoutMinutes] = useState<number>(30);
  const [restrictionsEnabled, setRestrictionsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showList, setShowList] = useState(false);

  const appsSummary = selectedApps.length
    ? `${selectedApps.length} app${selectedApps.length > 1 ? 's' : ''}`
    : 'no apps';

  const sitesSummary = selectedSites.length
    ? `${selectedSites.length} website${selectedSites.length > 1 ? 's' : ''}`
    : 'no websites';

  const summaryText = `Blocking ${appsSummary} and ${sitesSummary}`;

  useEffect(() => {
    const fetchToggle = async () => {
      const res = await fetch(
        'https://nopainnogameapp-default-rtdb.firebaseio.com/restrictionsEnabled.json'
      );
      const value = await res.json();
      setRestrictionsEnabled(Boolean(value));
    };
    fetchToggle();
  }, []);

  useEffect(() => {
    const fetchTarget = async () => {
      const target = await window.electron.getTargetWorkoutMinutes?.();
      if (target != null) setTargetWorkoutMinutes(target);
    };
    fetchTarget();
  }, []);

  useEffect(() => {
    const fetchInitialWorkout = async () => {
      const minutes = await window?.electron?.getCurrentWorkoutMinutes?.();
      if (minutes != null) {
        setCurrentWorkoutMinutes(minutes);
        setIsLoading(false);
      }
    };

    fetchInitialWorkout();

    const interval = setInterval(fetchInitialWorkout, 1000);
    return () => clearInterval(interval);
  }, []);

  const progressPercent =
    (currentWorkoutMinutes / targetWorkoutMinutes) * 100 || 0;

  const handleToggleRestrictions = async () => {
    const newValue = !restrictionsEnabled;

    // If trying to enable restrictions but none are set up
    if (newValue && selectedApps.length === 0 && selectedSites.length === 0) {
      if (
        window.confirm(
          'You need to set up restrictions first. Would you like to go to the Restrictions page?'
        )
      ) {
        setCurrentPage('Restrictions');
      }
      return;
    }

    // If trying to disable restrictions
    if (!newValue) {
      if (
        !window.confirm(
          'Are you sure you want to disable restrictions? This will unblock all apps and websites.'
        )
      ) {
        return;
      }

      // Clear all restrictions
      const config = await window.electron.readBlockConfig();
      await window.electron.writeBlockConfig({
        ...config,
        apps: [],
        sites: [],
      });
    }

    setRestrictionsEnabled(newValue);
    await fetch(
      'https://nopainnogameapp-default-rtdb.firebaseio.com/restrictionsEnabled.json',
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newValue),
      }
    );
  };

  return (
    <div className="font-sans h-full">
      <TitleText>Dashboard</TitleText>
      <div className="flex flex-col gap-4 mt-8">
        <Panel>
          <h2 className="text-xl font-semibold mb-4">Workout Progress</h2>
          <div className="flex flex-col gap-2">
            <div>
              {isLoading ? (
                <p className="text-sm text-gray-400 italic">
                  Loading workout progress...
                </p>
              ) : (
                <>
                  <p className="text-sm">
                    Current workout time: {currentWorkoutMinutes} minutes
                  </p>
                  <p className="text-sm">
                    Target workout time: {targetWorkoutMinutes} minutes
                  </p>
                </>
              )}
            </div>

            <div className="w-full mt-4 bg-gray-700 h-4 rounded overflow-hidden">
              <div
                className={`h-4 transition-all duration-500 ${
                  progressPercent >= 100
                    ? 'bg-green-500'
                    : progressPercent >= 50
                    ? 'bg-yellow-400'
                    : 'bg-red-500'
                }`}
                style={{ width: `${Math.min(progressPercent, 100)}%` }}
              />
            </div>
            {currentWorkoutMinutes >= targetWorkoutMinutes ? (
              <p className="mt-4 text-green-500 font-semibold">
                💪 Workout goal achieved!
              </p>
            ) : (
              <p className="mt-2 text-red-500 font-semibold">❌ Keep going!</p>
            )}
          </div>
        </Panel>
        <Panel className="mt-6">
          <div className="flex justify-between items-end mb-4">
            <h2 className="text-xl font-semibold mb-1">Current Restrictions</h2>
            <button
              className="text-xs text-gray-400 hover:text-blue-400"
              onClick={() => setCurrentPage('Restrictions')}
            >
              Edit Restrictions →
            </button>
          </div>
          <div className="flex items-center gap-2 mt-4">
            <label htmlFor="toggle" className="text-sm text-gray-300">
              Restrictions:
            </label>
            <button
              id="toggle"
              className={`px-3 py-1 rounded text-sm font-medium transition ${
                restrictionsEnabled
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-600 text-gray-300'
              }`}
              onClick={handleToggleRestrictions}
            >
              {restrictionsEnabled ? 'ON' : 'OFF'}
            </button>
          </div>
          {restrictionsEnabled ? (
            currentWorkoutMinutes >= targetWorkoutMinutes ? (
              <p className="text-green-500 text-sm font-medium">
                ✅ Restrictions ON – Workout completed, nothing blocked.
              </p>
            ) : (
              <p className="text-red-500 text-sm font-medium">
                🔒 Restrictions ON – Blocking apps & websites until workout is
                complete.
              </p>
            )
          ) : (
            <p className="text-gray-400 text-sm font-medium">
              ⛔ Restrictions OFF – All apps & sites are accessible.
            </p>
          )}
          <p className="text-gray-300 mt-4">{summaryText}</p>

          {selectedApps.length + selectedSites.length > 0 && (
            <div className="mt-2">
              <button
                onClick={() => setShowList(!showList)}
                className="text-blue-400 hover:underline text-sm"
              >
                {showList ? 'Hide list' : 'Show list'}
              </button>

              {showList && (
                <ul className="mt-2 text-sm text-gray-300 space-y-1">
                  {selectedApps.map((app) => (
                    <li key={app}>🖥️ {app}</li>
                  ))}
                  {selectedSites.map((site) => (
                    <li key={site}>🌐 {site}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
};
