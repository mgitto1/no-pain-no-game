import React, { useState } from 'react';
import { Panel, SubtitleText } from './Shared';
import { usePoller } from '../../context';

const APP_LIST = [
  'Steam',
  'EpicGamesLauncher',
  'Battle.net',
  'Discord',
  'Origin',
  'LeagueClientUx',
  'Valorant',
];

type Props = {
  selectedApps: string[];
  selectedSites: string[];
  availableSites: string[];
  setSelectedApps: (apps: string[]) => void;
  setSelectedSites: (sites: string[]) => void;
  setAvailableSites: (sites: string[]) => void;
};

export const RestrictionsPanel: React.FC<Props> = ({
  selectedApps,
  setSelectedApps,
  selectedSites,
  setSelectedSites,
  availableSites,
  setAvailableSites,
}) => {
  const [customSite, setCustomSite] = useState('');
  const { canModifyRestrictions } = usePoller();

  const handleAddSite = () => {
    if (!canModifyRestrictions) return;
    const cleaned = customSite.trim().toLowerCase();
    if (!cleaned || availableSites.includes(cleaned)) return;

    setAvailableSites([...availableSites, cleaned]);
    setSelectedSites([...selectedSites, cleaned]);
    setCustomSite('');
  };

  const toggle = (
    item: string,
    list: string[],
    setList: (newList: string[]) => void
  ) => {
    if (!canModifyRestrictions) return;
    const newList = list.includes(item)
      ? list.filter((i) => i !== item)
      : [...list, item];
    setList(newList);
  };

  return (
    <div>
      <p className="mb-4">
        Select apps and websites to block until your workout is complete:
      </p>

      <Panel className="mb-6">
        <SubtitleText>Blocked Apps</SubtitleText>
        <div className="space-y-2">
          {APP_LIST.map((app) => (
            <label key={app} className="block cursor-pointer">
              <input
                type="checkbox"
                checked={selectedApps.includes(app)}
                onChange={() => toggle(app, selectedApps, setSelectedApps)}
                className="mr-2"
                disabled={!canModifyRestrictions}
              />
              {app}
            </label>
          ))}
        </div>
      </Panel>
      <Panel>
        <h2 className="text-xl font-semibold mb-2">Blocked Websites</h2>
        <div className="space-y-2">
          {availableSites?.map((site) => (
            <div
              key={site}
              className="flex items-center justify-between border-b border-gray-700 py-1"
            >
              <label className="flex items-center cursor-pointer w-full">
                <input
                  type="checkbox"
                  checked={selectedSites.includes(site)}
                  onChange={() => {
                    if (!canModifyRestrictions) return;
                    const isSelected = selectedSites.includes(site);
                    const updated = isSelected
                      ? selectedSites.filter((s) => s !== site)
                      : [...selectedSites, site];
                    setSelectedSites(updated);
                  }}
                  className="mr-2"
                  disabled={!canModifyRestrictions}
                />
                <span>{site}</span>
              </label>
              <button
                onClick={() => {
                  if (!canModifyRestrictions) return;
                  const newAvailable = availableSites.filter((s) => s !== site);
                  const newSelected = selectedSites.filter((s) => s !== site);

                  setAvailableSites(newAvailable);
                  setSelectedSites(newSelected);
                }}
                className="bg-transparent text-white hover:text-red-400 text-xs font-bold px-2 py-0.5 rounded transition disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label={`Remove ${site}`}
                disabled={!canModifyRestrictions}
              >
                x
              </button>
            </div>
          ))}
        </div>
        <div className="my-4 flex gap-2">
          <input
            type="text"
            placeholder="Enter website (e.g. twitter.com)"
            className="w-full px-3 py-1 rounded"
            value={customSite}
            onChange={(e) => setCustomSite(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddSite()}
            disabled={!canModifyRestrictions}
          />
          <button
            className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleAddSite}
            disabled={!canModifyRestrictions}
          >
            Add
          </button>
        </div>
      </Panel>
    </div>
  );
};
