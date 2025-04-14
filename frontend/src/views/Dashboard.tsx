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

  const progressPercent = (currentWorkoutMinutes / targetWorkoutMinutes) * 100;

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
            {isLoading ? (
              <div className="w-full bg-gray-700 h-4 rounded overflow-hidden">
                <div className="h-4 bg-gray-500 animate-pulse w-1/2" />
              </div>
            ) : (
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
            )}

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
          <p className="text-gray-300">{summaryText}</p>

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
