import { contextBridge, ipcRenderer } from 'electron';
import * as fs from 'fs';
import * as path from 'path';

const BLOCKED_CONFIG_PATH = path.join(process.cwd(), 'blocked_config.json');
const HEARTBEAT_PATH = path.join(__dirname, '..', '..', 'poller_heartbeat.txt');

contextBridge.exposeInMainWorld('electron', {
  isPollerRunning: () => {
    return fs.existsSync(HEARTBEAT_PATH);
  },
  readBlockConfig: () => {
    try {
      const raw = fs.readFileSync(BLOCKED_CONFIG_PATH, 'utf-8');
      return JSON.parse(raw);
    } catch {
      return { apps: [], sites: [], availableSites: [] };
    }
  },
  writeBlockConfig: (config: {
    apps: string[];
    sites: string[];
    availableSites: string[];
  }) => {
    try {
      fs.writeFileSync(BLOCKED_CONFIG_PATH, JSON.stringify(config, null, 2));
    } catch (e) {
      console.error('Failed to write config:', e);
    }
  },
  getCurrentWorkoutMinutes: () =>
    ipcRenderer.invoke('get-current-workout-minutes'),
  getGoalStatus: () => ipcRenderer.invoke('get-goal-status'),
  getTargetWorkoutMinutes: () =>
    ipcRenderer.invoke('get-target-workout-minutes'),
  setTargetWorkoutMinutes: (minutes: number) =>
    ipcRenderer.send('set-target-workout-minutes', minutes),
});
