import { app, BrowserWindow, Menu, Tray, ipcMain, dialog, shell, nativeImage } from 'electron';
import path from 'path';
import { spawn } from 'child_process';
import fs from 'fs';
import os from 'os';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Keep a global reference of the window object
let mainWindow;
let tray = null;
let storageProcess = null;
let isQuitting = false;

// Configuration
const isDev = process.argv.includes('--dev');
const configPath = path.join(os.homedir(), '.topay-storage-config.json');

// Default configuration
const defaultConfig = {
  port: 3002,
  dataPath: path.join(os.homedir(), 'topay-storage-data'),
  maxStorageSize: '10GB',
  blockchainUrl: 'http://localhost:3000',
  autoStart: false,
  minimizeToTray: true
};

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    minWidth: 800,
    minHeight: 600,
    icon: path.join(__dirname, '../assets/icon.png'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true
    },
    show: false,
    titleBarStyle: 'default'
  });

  // Load the app
  mainWindow.loadFile(path.join(__dirname, 'renderer/index.html'));

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    if (isDev) {
      mainWindow.webContents.openDevTools();
    }
  });

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Handle minimize to tray
  mainWindow.on('minimize', (event) => {
    const config = loadConfig();
    if (config.minimizeToTray) {
      event.preventDefault();
      mainWindow.hide();
    }
  });

  // Handle close to tray
  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });
}

function createTray() {
    const iconPath = path.join(__dirname, '..', 'assets', 'tray-icon.png');
    
    // Check if tray icon exists, if not use a default Electron icon
    let trayIcon;
    try {
        if (require('fs').existsSync(iconPath)) {
            trayIcon = nativeImage.createFromPath(iconPath);
        } else {
            // Use a simple 16x16 transparent icon as fallback
            trayIcon = nativeImage.createEmpty();
        }
    } catch (error) {
        console.log('Tray icon not found, using default');
        trayIcon = nativeImage.createEmpty();
    }
    
    tray = new Tray(trayIcon);
  
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show TOPAY Storage Device',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        }
      }
    },
    {
      label: 'Start Storage Service',
      click: () => {
        startStorageService();
      }
    },
    {
      label: 'Stop Storage Service',
      click: () => {
        stopStorageService();
      }
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        isQuitting = true;
        app.quit();
      }
    }
  ]);
  
  tray.setToolTip('TOPAY Storage Device');
  tray.setContextMenu(contextMenu);
  
  tray.on('double-click', () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

function loadConfig() {
  try {
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      return { ...defaultConfig, ...config };
    }
  } catch (error) {
    console.error('Error loading config:', error);
  }
  return defaultConfig;
}

function saveConfig(config) {
  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    return true;
  } catch (error) {
    console.error('Error saving config:', error);
    return false;
  }
}

function startStorageService() {
  if (storageProcess) {
    console.log('Storage service is already running');
    return;
  }

  const config = loadConfig();
  const storageClientPath = path.join(__dirname, 'storage-client.js');
  
  if (!fs.existsSync(storageClientPath)) {
    console.error('Storage client not found:', storageClientPath);
    return;
  }

  const args = [
    storageClientPath,
    '--port', config.port.toString(),
    '--data-path', config.dataPath,
    '--max-storage', config.maxStorageSize,
    '--blockchain-url', config.blockchainUrl
  ];

  storageProcess = spawn('node', args, {
    cwd: path.dirname(storageClientPath),
    stdio: ['pipe', 'pipe', 'pipe']
  });

  storageProcess.stdout.on('data', (data) => {
    console.log('Storage service:', data.toString());
    if (mainWindow) {
      mainWindow.webContents.send('storage-log', data.toString());
    }
  });

  storageProcess.stderr.on('data', (data) => {
    console.error('Storage service error:', data.toString());
    if (mainWindow) {
      mainWindow.webContents.send('storage-error', data.toString());
    }
  });

  storageProcess.on('close', (code) => {
    console.log('Storage service exited with code:', code);
    storageProcess = null;
    if (mainWindow) {
      mainWindow.webContents.send('storage-stopped', code);
    }
  });

  if (mainWindow) {
    mainWindow.webContents.send('storage-started');
  }
}

function stopStorageService() {
  if (storageProcess) {
    storageProcess.kill('SIGTERM');
    storageProcess = null;
    if (mainWindow) {
      mainWindow.webContents.send('storage-stopped', 0);
    }
  }
}

// App event handlers
app.whenReady().then(() => {
  createWindow();
  createTray();
  
  // Auto-start storage service if configured
  const config = loadConfig();
  if (config.autoStart) {
    setTimeout(() => {
      startStorageService();
    }, 2000);
  }
});

app.on('window-all-closed', () => {
  // On macOS, keep app running even when all windows are closed
  if (process.platform !== 'darwin') {
    if (!isQuitting) {
      // Don't quit, just hide to tray
      return;
    }
  }
  app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on('before-quit', () => {
  isQuitting = true;
  stopStorageService();
});

// IPC handlers
ipcMain.handle('get-config', () => {
  return loadConfig();
});

ipcMain.handle('save-config', (event, config) => {
  return saveConfig(config);
});

ipcMain.handle('start-storage', () => {
  startStorageService();
  return true;
});

ipcMain.handle('stop-storage', () => {
  stopStorageService();
  return true;
});

ipcMain.handle('get-storage-status', () => {
  return storageProcess !== null;
});

ipcMain.handle('select-directory', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  });
  return result.filePaths[0] || null;
});

ipcMain.handle('open-external', (event, url) => {
  shell.openExternal(url);
});

ipcMain.handle('show-item-in-folder', (event, fullPath) => {
  shell.showItemInFolder(fullPath);
});

ipcMain.handle('get-storage-token', () => {
  // Return a simple token for storage authentication
  // In production, this should be more secure
  return 'storage-device-token';
});