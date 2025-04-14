import { app, BrowserWindow } from 'electron';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { ipcMain } from 'electron';
import Store from 'electron-store';

const store = new Store();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

if (store.get('targetWorkoutMinutes') == null) {
  store.set('targetWorkoutMinutes', 40);
}

const workoutFilePath = path.join(__dirname, 'current_workout.json');
const goalStatusFilePath = path.join(__dirname, 'goal_status.json');

ipcMain.handle('get-current-workout-minutes', async () => {
  try {
    const raw = await fs.promises.readFile(workoutFilePath, 'utf-8');
    const { minutes } = JSON.parse(raw);
    return minutes;
  } catch (err) {
    console.error('❌ Failed to read current_workout.json:', err);
    return 2;
  }
});

ipcMain.handle('get-goal-status', async () => {
  try {
    const raw = await fs.promises.readFile(goalStatusFilePath, 'utf-8');
    const { goalReachedToday } = JSON.parse(raw);
    return goalReachedToday;
  } catch (err) {
    console.error('❌ Failed to read goal_status.json:', err);
    return 2;
  }
});

ipcMain.handle('get-target-workout-minutes', () => {
  return store.get('targetWorkoutMinutes') ?? 30; // default to 30
});

ipcMain.on('set-target-workout-minutes', (_event, minutes) => {
  store.set('targetWorkoutMinutes', minutes);
});

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'dist', 'preload.cjs'), // compiled preload
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  win.loadURL('http://localhost:5173');
}

app.whenReady().then(createWindow);
