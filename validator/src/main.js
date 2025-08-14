/**
 * TOPAY Validator Desktop Application
 * Main Electron process for the validator UI
 */

const { app, BrowserWindow, Menu, Tray, ipcMain, dialog, shell, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs').promises;

// Disable GPU acceleration to prevent GPU process crashes
app.disableHardwareAcceleration();
app.commandLine.appendSwitch('disable-gpu');
app.commandLine.appendSwitch('disable-software-rasterizer');

class ValidatorApp {
    constructor() {
        this.mainWindow = null;
        this.tray = null;
        this.validatorService = null;
        this.config = null;
        this.isQuitting = false;
    }

    async initialize() {
        // Set up app event handlers
        this.setupAppEvents();
        
        // Set up IPC handlers
        this.setupIpcHandlers();
        
        // Create main window when ready
        app.whenReady().then(() => {
            this.createMainWindow();
            this.createTray();
            this.createMenu();
        });
    }

    setupAppEvents() {
        app.on('window-all-closed', () => {
            if (process.platform !== 'darwin') {
                this.isQuitting = true;
                app.quit();
            }
        });

        app.on('activate', () => {
            if (BrowserWindow.getAllWindows().length === 0) {
                this.createMainWindow();
            }
        });

        app.on('before-quit', async (event) => {
            if (!this.isQuitting) {
                event.preventDefault();
                await this.gracefulShutdown();
                this.isQuitting = true;
                app.quit();
            }
        });
    }

    createMainWindow() {
        this.mainWindow = new BrowserWindow({
            width: 1200,
            height: 800,
            minWidth: 800,
            minHeight: 600,
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
                preload: path.join(__dirname, 'preload.js'),
                // Disable GPU acceleration in the renderer process
                offscreen: false,
                backgroundThrottling: false
            },
            icon: this.getAppIcon(),
            title: 'TOPAY Validator',
            show: false,
            frame: false,
            titleBarStyle: 'hidden'
        });
        
        // Additional GPU-related settings for the window
        this.mainWindow.webContents.setFrameRate(30); // Lower frame rate to reduce GPU load

        // Load the UI
        this.mainWindow.loadFile(path.join(__dirname, 'ui', 'index.html'));

        // Show window when ready
        this.mainWindow.once('ready-to-show', () => {
            this.mainWindow.show();
            
            // Open DevTools in development
            if (process.env.NODE_ENV === 'development') {
                this.mainWindow.webContents.openDevTools();
            }
            
            // Initialize validator service for UI (non-blocking)
            this.initializeValidatorService().then(() => {
                // Restore validator state after service is initialized
                this.restoreValidatorState();
            }).catch(error => {
                console.error('Failed to initialize validator service:', error);
                // Still restore state even if initialization fails
                this.restoreValidatorState();
            });
        });

        // Handle window close
        this.mainWindow.on('close', (event) => {
            if (!this.isQuitting) {
                event.preventDefault();
                this.mainWindow.hide();
            }
        });
    }

    createTray() {
        const trayIcon = this.getAppIcon();
        this.tray = new Tray(trayIcon);
        
        this.updateTrayMenu(false);
        this.tray.setToolTip('TOPAY Validator');
        
        this.tray.on('double-click', () => {
            this.mainWindow.show();
            this.mainWindow.focus();
        });
    }

    createMenu() {
        const template = [
            {
                label: 'File',
                submenu: [
                    {
                        label: 'Settings',
                        accelerator: 'CmdOrCtrl+,',
                        click: () => {
                            this.mainWindow.webContents.send('navigate-to', 'settings');
                        }
                    },
                    { type: 'separator' },
                    {
                        label: 'Quit',
                        accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
                        click: async () => {
                            this.isQuitting = true;
                            await this.gracefulShutdown();
                            app.quit();
                        }
                    }
                ]
            },
            {
                label: 'Validator',
                submenu: [
                    {
                        label: 'Start',
                        accelerator: 'CmdOrCtrl+S',
                        click: () => this.startValidator()
                    },
                    {
                        label: 'Stop',
                        accelerator: 'CmdOrCtrl+T',
                        click: () => this.stopValidator()
                    },
                    {
                        label: 'Restart',
                        accelerator: 'CmdOrCtrl+R',
                        click: () => this.restartValidator()
                    }
                ]
            }
        ];

        const menu = Menu.buildFromTemplate(template);
        Menu.setApplicationMenu(menu);
    }

    async initializeValidatorService() {
        // Initialize the real ValidatorService
        console.log('🔧 Initializing validator service...');
        
        try {
            // Load ValidatorService class
            const { ValidatorService } = await import('./validator-service.js');
            
            // Create real validator service instance
            this.validatorService = new ValidatorService(this.config);
            
            console.log('✅ Validator service initialized successfully');
        } catch (error) {
            console.warn('⚠️ Could not load ValidatorService, using mock service:', error.message);
            
            // Fallback to mock service for development
            this.validatorService = {
                isRunning: false,
                startTime: null,
                validatorId: 'DEV-VALIDATOR-' + Math.random().toString(36).substr(2, 8).toUpperCase(),
                rpcConnected: false,
                wsConnected: false,
                validationStats: {
                    blocksValidated: 0,
                    transactionsValidated: 0,
                    validationErrors: 0,
                    lastValidation: null,
                    uptime: 0
                },
                start: function() {
                    console.log('🚀 Starting development validator...');
                    this.isRunning = true;
                    this.startTime = Date.now();
                    this.rpcConnected = true;
                    this.wsConnected = true;
                    // Simulate some activity
                    setTimeout(() => {
                        this.validationStats.blocksValidated += Math.floor(Math.random() * 5);
                        this.validationStats.transactionsValidated += Math.floor(Math.random() * 20);
                        this.validationStats.lastValidation = new Date().toISOString();
                    }, 2000);
                    return Promise.resolve();
                },
                stop: function() {
                    console.log('🛑 Stopping development validator...');
                    this.isRunning = false;
                    this.startTime = null;
                    this.rpcConnected = false;
                    this.wsConnected = false;
                    return Promise.resolve();
                },
                restart: function() {
                    console.log('🔄 Restarting development validator...');
                    this.stop();
                    return this.start();
                },
                getStatus: function() {
                    return {
                        validatorId: this.validatorId,
                        isRunning: this.isRunning,
                        uptime: this.startTime ? Date.now() - this.startTime : 0,
                        rpcConnected: this.rpcConnected,
                        wsConnected: this.wsConnected,
                        blockchain: { height: Math.floor(Math.random() * 10000) },
                        peers: { connected: Math.floor(Math.random() * 10), total: 50 },
                        validationStats: this.validationStats
                    };
                },
                on: () => {},
                emit: () => {}
            };
        }
    }

    setupIpcHandlers() {
        // Validator control
        ipcMain.handle('validator:start', async () => {
            return await this.startValidator();
        });

        ipcMain.handle('validator:stop', async () => {
            return await this.stopValidator();
        });

        ipcMain.handle('validator:restart', async () => {
            return await this.restartValidator();
        });

        ipcMain.handle('validator:status', async () => {
            return await this.getValidatorStatus();
        });

        // Configuration
        ipcMain.handle('config:get', async () => {
            if (!this.config) {
                try {
                    const ValidatorConfig = require('./config/validator-config-cjs.js');
                    this.config = new ValidatorConfig();
                    await this.config.load();
                } catch (configError) {
                    console.warn('⚠️ Could not load config in IPC handler, using fallback:', configError.message);
                    this.config = {
                        get: (key, defaultValue) => defaultValue,
                        set: () => {},
                        save: () => Promise.resolve(),
                        load: () => Promise.resolve(),
                        getAll: () => ({
                            validatorId: 'DEV-CONFIG',
                            rpcPort: 8545,
                            wsPort: 8546,
                            networkId: 'development',
                            environment: 'development'
                        })
                    };
                }
            }
            return this.config.getAll();
        });

        ipcMain.handle('config:set', async (event, key, value) => {
            if (this.config) {
                this.config.set(key, value);
                await this.config.save();
            }
            return true;
        });

        // Auto-start validator setting
        ipcMain.handle('config:get-autostart', async () => {
            if (this.config) {
                return this.config.get('autoStartValidator', false);
            }
            return false;
        });

        ipcMain.handle('config:set-autostart', async (event, enabled) => {
            if (this.config) {
                this.config.set('autoStartValidator', enabled);
                await this.config.save();
                console.log(`🔧 Auto-start validator ${enabled ? 'enabled' : 'disabled'}`);
            }
            return true;
        });

        // Window operations
        ipcMain.handle('window:minimize', () => {
            this.mainWindow.minimize();
        });

        ipcMain.handle('window:close', () => {
            this.mainWindow.hide();
        });

        ipcMain.handle('window:maximize', () => {
            if (this.mainWindow.isMaximized()) {
                this.mainWindow.unmaximize();
            } else {
                this.mainWindow.maximize();
            }
        });
    }

    async startValidator() {
        try {
            // Initialize validator service if not already done
            if (!this.validatorService) {
                await this.initializeValidatorService();
            }

            // Check if validator is actually running
            if (this.validatorService && this.validatorService.isRunning) {
                console.log('⚠️ Validator is already running');
                return { success: false, message: 'Validator is already running' };
            }

            if (!this.config) {
                try {
                    const ValidatorConfig = require('./config/validator-config-cjs.js');
                    this.config = new ValidatorConfig();
                    await this.config.load();
                    console.log('✅ Configuration loaded successfully');
                } catch (configError) {
                    console.warn('⚠️ Could not load config, using fallback:', configError.message);
                    this.config = {
                        get: (key, defaultValue) => defaultValue,
                        set: () => {},
                        save: () => Promise.resolve(),
                        load: () => Promise.resolve(),
                        update: () => Promise.resolve()
                    };
                }
            }

            console.log('🚀 Starting validator service...');
            await this.validatorService.start();
            await this.saveValidatorState(true);
            
            // Notify UI of status change
            this.updateTrayMenu(true);
            if (this.mainWindow && !this.mainWindow.isDestroyed()) {
                this.mainWindow.webContents.send('validator:status-changed', { 
                    isRunning: true, 
                    running: true 
                });
            }
            
            console.log('✅ Validator started successfully');
            return { success: true, message: 'Validator started successfully' };
        } catch (error) {
            console.error('Failed to start validator:', error);
            return { success: false, message: error.message };
        }
    }

    async stopValidator() {
        try {
            if (!this.validatorService || !this.validatorService.isRunning) {
                console.log('⚠️ Validator is not running');
                return { success: false, message: 'Validator is not running' };
            }

            console.log('🛑 Stopping validator service...');
            await this.validatorService.stop();
            await this.saveValidatorState(false);
            
            // Notify UI of status change
            this.updateTrayMenu(false);
            if (this.mainWindow && !this.mainWindow.isDestroyed()) {
                this.mainWindow.webContents.send('validator:status-changed', { 
                    isRunning: false, 
                    running: false 
                });
            }
            
            console.log('✅ Validator stopped successfully');
            return { success: true, message: 'Validator stopped successfully' };
        } catch (error) {
            console.error('Failed to stop validator:', error);
            return { success: false, message: error.message };
        }
    }

    async restartValidator() {
        try {
            await this.stopValidator();
            await new Promise(resolve => setTimeout(resolve, 1000));
            return await this.startValidator();
        } catch (error) {
            console.error('Failed to restart validator:', error);
            return { success: false, message: error.message };
        }
    }

    async getValidatorStatus() {
        if (!this.validatorService) {
            return {
                isRunning: false,
                running: false,
                uptime: 0,
                stats: null,
                validatorId: null,
                rpcConnected: false,
                wsConnected: false
            };
        }

        return {
            isRunning: this.validatorService.isRunning,
            running: this.validatorService.isRunning, // Keep both for compatibility
            uptime: this.validatorService.startTime ? Date.now() - this.validatorService.startTime : 0,
            stats: this.validatorService.validationStats,
            validatorId: this.validatorService.validatorId,
            rpcConnected: this.validatorService.rpcConnected,
            wsConnected: this.validatorService.wsConnected
        };
    }

    updateTrayMenu(validatorRunning) {
        const contextMenu = Menu.buildFromTemplate([
            {
                label: 'Show TOPAY Validator',
                click: () => {
                    this.mainWindow.show();
                    this.mainWindow.focus();
                }
            },
            { type: 'separator' },
            {
                label: 'Start Validator',
                click: () => this.startValidator(),
                enabled: !validatorRunning
            },
            {
                label: 'Stop Validator',
                click: () => this.stopValidator(),
                enabled: validatorRunning
            },
            { type: 'separator' },
            {
                label: 'Quit',
                click: async () => {
                    this.isQuitting = true;
                    await this.gracefulShutdown();
                    app.quit();
                }
            }
        ]);

        this.tray.setContextMenu(contextMenu);
    }

    async gracefulShutdown() {
        try {
            if (this.validatorService && this.validatorService.isRunning) {
                console.log('Stopping validator service...');
                await this.saveValidatorState(true);
                await this.validatorService.stop();
            } else {
                await this.saveValidatorState(false);
            }
        } catch (error) {
            console.error('Error during graceful shutdown:', error);
        }
    }

    async saveValidatorState(wasRunning) {
        try {
            if (this.config) {
                this.config.set('lastValidatorState.wasRunning', wasRunning);
                this.config.set('lastValidatorState.lastStopTime', new Date().toISOString());
                if (wasRunning && this.validatorService && this.validatorService.startTime) {
                    this.config.set('lastValidatorState.lastStartTime', new Date(this.validatorService.startTime).toISOString());
                }
                await this.config.save();
                console.log(`💾 Validator state saved: ${wasRunning ? 'was running' : 'was stopped'}`);
            }
        } catch (error) {
            console.error('Error saving validator state:', error);
        }
    }

    async restoreValidatorState() {
        try {
            if (!this.config) return;
            
            const autoStart = this.config.get('autoStartValidator', false);
            const lastState = this.config.get('lastValidatorState', {});
            
            console.log(`🔄 Checking validator state: autoStart=${autoStart}, wasRunning=${lastState.wasRunning}`);
            
            if (autoStart && lastState.wasRunning) {
                console.log('🚀 Auto-starting validator based on previous state...');
                setTimeout(async () => {
                    const result = await this.startValidator();
                    if (result.success) {
                        console.log('✅ Validator auto-started successfully');
                        if (this.mainWindow && !this.mainWindow.isDestroyed()) {
                            this.mainWindow.webContents.send('validator:auto-started');
                        }
                    } else {
                        console.warn('⚠️ Failed to auto-start validator:', result.message);
                    }
                }, 2000);
            }
        } catch (error) {
            console.error('Error restoring validator state:', error);
        }
    }

    getAppIcon() {
        try {
            if (process.platform === 'win32') {
                console.log('🪟 Creating Windows-optimized TOPAY icon');
                return this.createWindowsIcon();
            }
            
            const iconPath = path.join(__dirname, '..', 'assets', 'icon.svg');
            
            if (require('fs').existsSync(iconPath)) {
                console.log('✅ Loading TOPAY icon from:', iconPath);
                return nativeImage.createFromPath(iconPath);
            } else {
                console.warn('⚠️ Icon file not found at:', iconPath);
                return this.createWindowsIcon();
            }
        } catch (error) {
            console.warn('Could not load icon from assets, using fallback:', error.message);
            return this.createWindowsIcon();
        }
    }

    createWindowsIcon() {
        const size = 64;
        const canvas = Buffer.alloc(size * size * 4);
        const center = size / 2;
        
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const index = (y * size + x) * 4;
                const dx = x - center;
                const dy = y - center;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance <= center - 2) {
                    const gradientFactor = distance / center;
                    const r = Math.floor(79 + (124 - 79) * gradientFactor);
                    const g = Math.floor(70 + (58 - 70) * gradientFactor);
                    const b = Math.floor(229 + (237 - 229) * gradientFactor);
                    
                    const shieldTop = center - 20;
                    const shieldBottom = center + 20;
                    const shieldLeft = center - 15;
                    const shieldRight = center + 15;
                    
                    if (y >= shieldTop && y <= shieldBottom && x >= shieldLeft && x <= shieldRight) {
                        canvas[index] = 255;
                        canvas[index + 1] = 255;
                        canvas[index + 2] = 255;
                        canvas[index + 3] = 230;
                        
                        const checkY = center;
                        const checkX = center;
                        if (Math.abs(x - checkX) <= 8 && Math.abs(y - checkY) <= 8) {
                            if ((x >= checkX - 6 && x <= checkX - 2 && y >= checkY - 2 && y <= checkY + 2) ||
                                (x >= checkX - 2 && x <= checkX + 6 && y >= checkY - 6 && y <= checkY - 2)) {
                                canvas[index] = r;
                                canvas[index + 1] = g;
                                canvas[index + 2] = b;
                                canvas[index + 3] = 255;
                            }
                        }
                    } else {
                        canvas[index] = r;
                        canvas[index + 1] = g;
                        canvas[index + 2] = b;
                        canvas[index + 3] = 255;
                    }
                } else {
                    canvas[index] = 0;
                    canvas[index + 1] = 0;
                    canvas[index + 2] = 0;
                    canvas[index + 3] = 0;
                }
            }
        }
        
        return nativeImage.createFromBuffer(canvas, { width: size, height: size });
    }
}

const validatorApp = new ValidatorApp();
validatorApp.initialize().catch(console.error);