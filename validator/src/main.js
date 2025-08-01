/**
 * TOPAY Validator - Main Electron Process
 * Quantum-Safe Blockchain Validator Client for Windows
 */

const { app, BrowserWindow, Menu, Tray, ipcMain, dialog, shell } = require('electron');
const { autoUpdater } = require('electron-updater');
const log = require('electron-log');
const path = require('path');
const fs = require('fs');
const ValidatorService = require('./validator-service');
const ValidatorConfig = require('./config/validator-config');

// Configure logging
log.transports.file.level = 'info';
log.transports.console.level = 'debug';

class ValidatorApp {
    constructor() {
        this.mainWindow = null;
        this.tray = null;
        this.validatorService = null;
        this.config = new ValidatorConfig();
        this.isQuitting = false;
        
        this.setupApp();
    }

    setupApp() {
        // Set app user model ID for Windows
        if (process.platform === 'win32') {
            app.setAppUserModelId('foundation.topay.validator');
        }

        // App event handlers
        app.whenReady().then(() => this.onReady());
        app.on('window-all-closed', () => this.onWindowAllClosed());
        app.on('activate', () => this.onActivate());
        app.on('before-quit', () => this.onBeforeQuit());
        app.on('second-instance', () => this.onSecondInstance());

        // Make app single instance
        const gotTheLock = app.requestSingleInstanceLock();
        if (!gotTheLock) {
            app.quit();
        }

        // IPC handlers
        this.setupIpcHandlers();
    }

    async onReady() {
        log.info('TOPAY Validator starting...');
        
        // Create main window
        await this.createMainWindow();
        
        // Create system tray
        this.createTray();
        
        // Create application menu
        this.createApplicationMenu();
        
        // Initialize validator service
        await this.initializeValidator();
        
        // Setup auto-updater
        this.setupAutoUpdater();
        
        log.info('TOPAY Validator ready');
    }
    
    createApplicationMenu() {
        const template = [
            {
                label: 'File',
                submenu: [
                    {
                        label: 'Settings',
                        click: () => this.openSettings()
                    },
                    { type: 'separator' },
                    {
                        label: 'Create Desktop Shortcut',
                        click: () => this.createDesktopShortcut()
                    },
                    { type: 'separator' },
                    {
                        label: 'Exit',
                        click: () => this.quitApp()
                    }
                ]
            },
            {
                label: 'View',
                submenu: [
                    {
                        label: 'Reload',
                        click: (item, focusedWindow) => {
                            if (focusedWindow) focusedWindow.reload();
                        }
                    },
                    {
                        label: 'Toggle Developer Tools',
                        accelerator: process.platform === 'darwin' ? 'Alt+Command+I' : 'Ctrl+Shift+I',
                        click: (item, focusedWindow) => {
                            if (focusedWindow) focusedWindow.webContents.toggleDevTools();
                        }
                    }
                ]
            },
            {
                label: 'Help',
                submenu: [
                    {
                        label: 'View Logs',
                        click: () => this.openLogs()
                    },
                    {
                        label: 'About',
                        click: () => this.showAbout()
                    }
                ]
            }
        ];
        
        const menu = Menu.buildFromTemplate(template);
        Menu.setApplicationMenu(menu);
    }

    async createMainWindow() {
        this.mainWindow = new BrowserWindow({
            width: 1200,
            height: 800,
            minWidth: 800,
            minHeight: 600,
            resizable: true,
            center: true,
            icon: path.join(__dirname, '../assets/icon.svg'),
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
                enableRemoteModule: false,
                preload: path.join(__dirname, 'preload.js')
            },
            titleBarStyle: 'hidden',
            frame: false,
            show: false
        });

        // Load the main HTML file
        this.mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));

        // Window event handlers
        this.mainWindow.once('ready-to-show', () => {
            this.mainWindow.show();
            if (process.platform === 'win32') {
                this.mainWindow.setSkipTaskbar(false);
            }
        });

        this.mainWindow.on('close', (event) => {
            if (!this.isQuitting) {
                event.preventDefault();
                this.mainWindow.hide();
                this.showTrayNotification('TOPAY Validator is still running in the background');
            }
        });

        this.mainWindow.on('closed', () => {
            this.mainWindow = null;
        });
    }

    createTray() {
        // Temporarily disable tray icon due to SVG compatibility issues
        console.log('Tray icon disabled for development');
        return;
        
        const trayIconPath = path.join(__dirname, '..', 'assets', 'tray-icon.svg');
        
        // Check if tray icon exists
        if (!require('fs').existsSync(trayIconPath)) {
            console.warn('Tray icon not found, skipping tray creation');
            return;
        }

        this.tray = new Tray(trayIconPath);
        
        const contextMenu = Menu.buildFromTemplate([
            {
                label: 'Open Dashboard',
                click: () => this.showMainWindow()
            },
            { type: 'separator' },
            {
                label: 'Validator Status',
                submenu: [
                    {
                        label: 'Running',
                        type: 'checkbox',
                        checked: true,
                        enabled: false
                    },
                    {
                        label: 'View Logs',
                        click: () => this.openLogs()
                    }
                ]
            },
            { type: 'separator' },
            {
                label: 'Settings',
                click: () => this.openSettings()
            },
            {
                label: 'Create Desktop Shortcut',
                click: () => this.createDesktopShortcut()
            },
            {
                label: 'About',
                click: () => this.showAbout()
            },
            { type: 'separator' },
            {
                label: 'Quit',
                click: () => this.quitApp()
            }
        ]);

        this.tray.setToolTip('TOPAY Validator - Quantum-Safe Blockchain Validator');
        this.tray.setContextMenu(contextMenu);
        
        this.tray.on('double-click', () => {
            this.showMainWindow();
        });
    }

    async initializeValidator() {
        try {
            // Load configuration first
            await this.config.load();
            
            this.validatorService = new ValidatorService(this.config);
            await this.validatorService.start();
            log.info('Validator service started successfully');
        } catch (error) {
            log.error('Failed to start validator service:', error);
            this.showErrorDialog('Validator Startup Error', 
                'Failed to start the validator service. Please check the logs for details.');
        }
    }

    setupAutoUpdater() {
        autoUpdater.checkForUpdatesAndNotify();
        
        autoUpdater.on('update-available', () => {
            log.info('Update available');
            this.showTrayNotification('Update available for TOPAY Validator');
        });

        autoUpdater.on('update-downloaded', () => {
            log.info('Update downloaded');
            dialog.showMessageBox(this.mainWindow, {
                type: 'info',
                title: 'Update Ready',
                message: 'Update downloaded. The application will restart to apply the update.',
                buttons: ['Restart Now', 'Later']
            }).then((result) => {
                if (result.response === 0) {
                    autoUpdater.quitAndInstall();
                }
            });
        });
    }

    setupIpcHandlers() {
        ipcMain.handle('get-validator-status', () => {
            try {
                const status = this.validatorService ? this.validatorService.getStatus() : null;
                // Ensure complete serialization by converting to JSON and back
                return status ? JSON.parse(JSON.stringify(status)) : null;
            } catch (error) {
                console.error('Error getting validator status:', error);
                return null;
            }
        });

        ipcMain.handle('get-config', async () => {
            return this.config.getAll();
        });

        ipcMain.handle('update-config', async (event, newConfig) => {
            try {
                await this.config.update(newConfig);
                if (this.validatorService) {
                    await this.validatorService.updateConfig(newConfig);
                }
                return { success: true };
            } catch (error) {
                log.error('Failed to update config:', error);
                return { success: false, error: error.message };
            }
        });

        ipcMain.handle('restart-validator', async () => {
            try {
                if (this.validatorService) {
                    await this.validatorService.restart();
                }
                return { success: true };
            } catch (error) {
                log.error('Failed to restart validator:', error);
                return { success: false, error: error.message };
            }
        });

        ipcMain.handle('export-logs', async () => {
            try {
                const result = await dialog.showSaveDialog(this.mainWindow, {
                    title: 'Export Validator Logs',
                    defaultPath: `topay-validator-logs-${new Date().toISOString().split('T')[0]}.txt`,
                    filters: [
                        { name: 'Text Files', extensions: ['txt'] },
                        { name: 'All Files', extensions: ['*'] }
                    ]
                });

                if (!result.canceled) {
                    const logs = await this.validatorService.exportLogs();
                    fs.writeFileSync(result.filePath, logs);
                    return { success: true, path: result.filePath };
                }
                return { success: false, canceled: true };
            } catch (error) {
                log.error('Failed to export logs:', error);
                return { success: false, error: error.message };
            }
        });

        // Window control handlers
        ipcMain.handle('minimize-window', () => {
            if (this.mainWindow) {
                this.mainWindow.minimize();
            }
        });

        ipcMain.handle('close-window', () => {
            if (this.mainWindow) {
                this.mainWindow.close();
            }
        });

        // App info handlers
        ipcMain.handle('get-app-version', () => {
            return app.getVersion();
        });

        ipcMain.handle('show-notification', (event, options) => {
            const { Notification } = require('electron');
            if (Notification.isSupported()) {
                new Notification(options).show();
            }
        });
    }

    showMainWindow() {
        if (this.mainWindow) {
            if (this.mainWindow.isMinimized()) {
                this.mainWindow.restore();
            }
            this.mainWindow.show();
            this.mainWindow.focus();
        }
    }

    showTrayNotification(message) {
        if (this.tray) {
            this.tray.displayBalloon({
                title: 'TOPAY Validator',
                content: message,
                icon: path.join(__dirname, '../assets/icon.png')
            });
        }
    }

    showErrorDialog(title, content) {
        dialog.showErrorBox(title, content);
    }

    openLogs() {
        const logPath = log.transports.file.getFile().path;
        shell.showItemInFolder(logPath);
    }

    openSettings() {
        if (this.mainWindow) {
            this.mainWindow.webContents.send('navigate-to', '/settings');
            this.showMainWindow();
        }
    }

    showAbout() {
        dialog.showMessageBox(this.mainWindow, {
            type: 'info',
            title: 'About TOPAY Validator',
            message: 'TOPAY Validator',
            detail: `Version: ${app.getVersion()}\nQuantum-Safe Blockchain Validator\n\n© 2024 TOPAY Foundation`,
            buttons: ['OK']
        });
    }
    
    createDesktopShortcut() {
        try {
            // Import the desktop shortcut creator
            const createShortcut = require('../scripts/create-desktop-shortcut');
            
            // Create the shortcut
            const success = createShortcut();
            
            // Show success or error message
            if (success) {
                dialog.showMessageBox(this.mainWindow, {
                    type: 'info',
                    title: 'Desktop Shortcut Created',
                    message: 'Desktop shortcut has been created successfully.',
                    buttons: ['OK']
                });
            } else {
                dialog.showMessageBox(this.mainWindow, {
                    type: 'error',
                    title: 'Desktop Shortcut Error',
                    message: 'Failed to create desktop shortcut. Please try again or check the logs for details.',
                    buttons: ['OK']
                });
            }
        } catch (error) {
            log.error('Error creating desktop shortcut:', error);
            dialog.showErrorBox('Desktop Shortcut Error', 
                'Failed to create desktop shortcut: ' + error.message);
        }
    }

    onWindowAllClosed() {
        // Keep app running on Windows when all windows are closed
        if (process.platform !== 'darwin') {
            // Don't quit, just hide to tray
        }
    }

    onActivate() {
        if (BrowserWindow.getAllWindows().length === 0) {
            this.createMainWindow();
        }
    }

    onBeforeQuit() {
        this.isQuitting = true;
    }

    onSecondInstance() {
        // Someone tried to run a second instance, focus our window instead
        if (this.mainWindow) {
            if (this.mainWindow.isMinimized()) {
                this.mainWindow.restore();
            }
            this.mainWindow.focus();
        }
    }

    async quitApp() {
        this.isQuitting = true;
        
        if (this.validatorService) {
            log.info('Stopping validator service...');
            await this.validatorService.stop();
        }
        
        app.quit();
    }
}

// Initialize the application
new ValidatorApp();

module.exports = ValidatorApp;