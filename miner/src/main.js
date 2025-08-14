/**
 * TOPAY Miner Desktop Application
 * Main Electron process for the miner UI
 */

const { app, BrowserWindow, Menu, Tray, ipcMain, dialog, shell, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs').promises;

// Disable GPU acceleration to prevent GPU process crashes
app.disableHardwareAcceleration();
app.commandLine.appendSwitch('disable-gpu');
app.commandLine.appendSwitch('disable-software-rasterizer');

class MinerApp {
    constructor() {
        this.mainWindow = null;
        this.tray = null;
        this.minerService = null;
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
            title: 'TOPAY Miner',
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
            
            // Initialize miner service for UI (non-blocking)
            this.initializeMinerService().then(() => {
                // Restore miner state after service is initialized
                this.restoreMinerState();
            }).catch(error => {
                console.error('Failed to initialize miner service:', error);
                // Still restore state even if initialization fails
                this.restoreMinerState();
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
        this.tray.setToolTip('TOPAY Miner');
        
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
                label: 'Miner',
                submenu: [
                    {
                        label: 'Start',
                        accelerator: 'CmdOrCtrl+S',
                        click: () => this.startMiner()
                    },
                    {
                        label: 'Stop',
                        accelerator: 'CmdOrCtrl+T',
                        click: () => this.stopMiner()
                    },
                    {
                        label: 'Restart',
                        accelerator: 'CmdOrCtrl+R',
                        click: () => this.restartMiner()
                    }
                ]
            }
        ];

        const menu = Menu.buildFromTemplate(template);
        Menu.setApplicationMenu(menu);
    }

    async initializeMinerService() {
        // Initialize the real MinerService
        console.log('🔧 Initializing miner service...');
        
        try {
            // Clear require cache to avoid __dirname conflicts
            delete require.cache[require.resolve('./miner-service.js')];
            delete require.cache[require.resolve('./rpc/validator-client.js')];
            delete require.cache[require.resolve('./config/validator-config-cjs.js')];
            
            // Load MinerService class
            const MinerService = require('./miner-service.js');
            
            // Create real miner service instance
            this.minerService = new MinerService(this.config);
            
            console.log('✅ Miner service initialized successfully');
        } catch (error) {
            console.warn('⚠️ Could not load MinerService, using mock service:', error.message);
            
            // Fallback to mock service for development
            this.minerService = {
                isRunning: false,
                startTime: null,
                minerId: 'DEV-MINER-' + Math.random().toString(36).substr(2, 8).toUpperCase(),
                rpcConnected: false,
                wsConnected: false,
                miningStats: {
                    blocksMined: 0,
                    transactionsProcessed: 0,
                    miningErrors: 0,
                    lastMining: null,
                    uptime: 0
                },
                start: async function() {
                    console.log('🚀 Starting development miner...');
                    this.isRunning = true;
                    this.startTime = Date.now();
                    this.rpcConnected = true;
                    this.wsConnected = true;
                    
                    // Start mock API server
                    this.startMockApiServer();
                    
                    // Enable auto-mining on blockchain when miner starts
                    try {
                        const blockchainUrl = process.env.BLOCKCHAIN_RPC_URL || 'http://localhost:8545';
                        console.log('🤖 Enabling auto-mining on blockchain...');
                        
                        const response = await fetch(`${blockchainUrl}/rpc`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                jsonrpc: '2.0',
                                method: 'topay_startAutoMining',
                                params: [this.minerId],
                                id: 1
                            })
                        });
                        
                        const result = await response.json();
                        if (result.result && result.result.success) {
                            console.log('✅ Auto-mining enabled on blockchain');
                        } else {
                            console.warn('⚠️ Failed to enable auto-mining:', result.error?.message || 'Unknown error');
                        }
                    } catch (error) {
                        console.warn('⚠️ Could not enable auto-mining:', error.message);
                    }
                    
                    // Simulate some activity
                    setTimeout(() => {
                        this.miningStats.blocksMined += Math.floor(Math.random() * 5);
                        this.miningStats.transactionsProcessed += Math.floor(Math.random() * 20);
                        this.miningStats.lastMining = new Date().toISOString();
                    }, 2000);
                    return Promise.resolve();
                },
                stop: async function() {
                    console.log('🛑 Stopping development miner...');
                    this.isRunning = false;
                    this.startTime = null;
                    this.rpcConnected = false;
                    this.wsConnected = false;
                    
                    // Disable auto-mining on blockchain when miner stops
                    try {
                        const blockchainUrl = process.env.BLOCKCHAIN_RPC_URL || 'http://localhost:8545';
                        console.log('🤖 Disabling auto-mining on blockchain...');
                        
                        const response = await fetch(`${blockchainUrl}/rpc`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                jsonrpc: '2.0',
                                method: 'topay_stopAutoMining',
                                params: [],
                                id: 1
                            })
                        });
                        
                        const result = await response.json();
                        if (result.result && result.result.success) {
                            console.log('✅ Auto-mining disabled on blockchain');
                        } else {
                            console.warn('⚠️ Failed to disable auto-mining:', result.error?.message || 'Unknown error');
                        }
                    } catch (error) {
                        console.warn('⚠️ Could not disable auto-mining:', error.message);
                    }
                    
                    this.stopMockApiServer();
                     
                     console.log('✅ Development miner service stopped');
                     return { success: true, message: 'Development miner stopped' };
                },
                restart: function() {
                    console.log('🔄 Restarting development miner...');
                    this.stop();
                    return this.start();
                },
                getStatus: function() {
                    return {
                        minerId: this.minerId,
                        isRunning: this.isRunning,
                        uptime: this.startTime ? Date.now() - this.startTime : 0,
                        rpcConnected: this.rpcConnected,
                        wsConnected: this.wsConnected,
                        blockchain: { height: Math.floor(Math.random() * 10000) },
                        peers: { connected: Math.floor(Math.random() * 10), total: 50 },
                        miningStats: this.miningStats
                    };
                },
                startMockApiServer: function() {
                    if (this.apiServer) return; // Already running
                    
                    const http = require('http');
                    const url = require('url');
                    
                    this.apiServer = http.createServer((req, res) => {
                        // Enable CORS
                        res.setHeader('Access-Control-Allow-Origin', '*');
                        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
                        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
                        res.setHeader('Content-Type', 'application/json');
                        
                        if (req.method === 'OPTIONS') {
                            res.writeHead(200);
                            res.end();
                            return;
                        }
                        
                        const parsedUrl = url.parse(req.url, true);
                        
                        if (parsedUrl.pathname === '/api/status') {
                            res.writeHead(200);
                            res.end(JSON.stringify(this.getStatus()));
                        } else {
                            res.writeHead(404);
                            res.end(JSON.stringify({ error: 'Not found' }));
                        }
                    });
                    
                    this.apiServer.listen(8547, () => {
                        console.log('🌐 Mock miner API server running on port 8547');
                    });
                },
                stopMockApiServer: function() {
                    if (this.apiServer) {
                        this.apiServer.close();
                        this.apiServer = null;
                        console.log('🛑 Mock miner API server stopped');
                    }
                },
                on: () => {},
                emit: () => {}
            };
        }
    }

    setupIpcHandlers() {
        // Miner control
        ipcMain.handle('miner:start', async () => {
            return await this.startMiner();
        });

        ipcMain.handle('miner:stop', async () => {
            return await this.stopMiner();
        });

        ipcMain.handle('miner:restart', async () => {
            return await this.restartMiner();
        });

        ipcMain.handle('miner:status', async () => {
            return await this.getMinerStatus();
        });

        // Configuration
        ipcMain.handle('config:get', async () => {
            if (!this.config) {
                try {
                    const MinerConfig = require('./config/miner-config-cjs.js');
                    this.config = new MinerConfig();
                    await this.config.load();
                } catch (configError) {
                    console.warn('⚠️ Could not load config in IPC handler, using fallback:', configError.message);
                    this.config = {
                        get: (key, defaultValue) => defaultValue,
                        set: () => {},
                        save: () => Promise.resolve(),
                        load: () => Promise.resolve(),
                        getAll: () => ({
                            minerId: 'DEV-CONFIG',
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

        // Auto-start miner setting
        ipcMain.handle('config:get-autostart', async () => {
            if (this.config) {
                return this.config.get('autoStartMiner', false);
            }
            return false;
        });

        ipcMain.handle('config:set-autostart', async (event, enabled) => {
            if (this.config) {
                this.config.set('autoStartMiner', enabled);
                await this.config.save();
                console.log(`🔧 Auto-start miner ${enabled ? 'enabled' : 'disabled'}`);
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

    async startMiner() {
        try {
            // Initialize miner service if not already done
            if (!this.minerService) {
                await this.initializeMinerService();
            }

            // Check if miner is actually running
            if (this.minerService && this.minerService.isRunning) {
                console.log('⚠️ Miner is already running');
                return { success: false, message: 'Miner is already running' };
            }

            if (!this.config) {
                try {
                    const MinerConfig = require('./config/miner-config-cjs.js');
                    this.config = new MinerConfig();
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

            console.log('🚀 Starting miner service...');
            await this.minerService.start();
            await this.saveMinerState(true);
            
            // Notify UI of status change
            this.updateTrayMenu(true);
            if (this.mainWindow && !this.mainWindow.isDestroyed()) {
                this.mainWindow.webContents.send('miner:status-changed', { 
                    isRunning: true, 
                    running: true 
                });
            }
            
            console.log('✅ Miner started successfully');
            return { success: true, message: 'Miner started successfully' };
        } catch (error) {
            console.error('Failed to start miner:', error);
            return { success: false, message: error.message };
        }
    }

    async stopMiner() {
        try {
            if (!this.minerService || !this.minerService.isRunning) {
                console.log('⚠️ Miner is not running');
                return { success: false, message: 'Miner is not running' };
            }

            console.log('🛑 Stopping miner service...');
            await this.minerService.stop();
            await this.saveMinerState(false);
            
            // Notify UI of status change
            this.updateTrayMenu(false);
            if (this.mainWindow && !this.mainWindow.isDestroyed()) {
                this.mainWindow.webContents.send('miner:status-changed', { 
                    isRunning: false, 
                    running: false 
                });
            }
            
            console.log('✅ Miner stopped successfully');
            return { success: true, message: 'Miner stopped successfully' };
        } catch (error) {
            console.error('Failed to stop miner:', error);
            return { success: false, message: error.message };
        }
    }

    async restartMiner() {
        try {
            await this.stopMiner();
            await new Promise(resolve => setTimeout(resolve, 1000));
            return await this.startMiner();
        } catch (error) {
            console.error('Failed to restart miner:', error);
            return { success: false, message: error.message };
        }
    }

    async getMinerStatus() {
        if (!this.minerService) {
            return {
                isRunning: false,
                running: false,
                uptime: 0,
                stats: null,
                minerId: null,
                rpcConnected: false,
                wsConnected: false
            };
        }

        return {
            isRunning: this.minerService.isRunning,
            running: this.minerService.isRunning, // Keep both for compatibility
            uptime: this.minerService.startTime ? Date.now() - this.minerService.startTime : 0,
            stats: this.minerService.miningStats,
            minerId: this.minerService.minerId,
            rpcConnected: this.minerService.rpcConnected,
            wsConnected: this.minerService.wsConnected
        };
    }

    updateTrayMenu(minerRunning) {
        const contextMenu = Menu.buildFromTemplate([
            {
                label: 'Show TOPAY Miner',
                click: () => {
                    this.mainWindow.show();
                    this.mainWindow.focus();
                }
            },
            { type: 'separator' },
            {
                label: 'Start Miner',
                click: () => this.startMiner(),
                enabled: !minerRunning
            },
            {
                label: 'Stop Miner',
                click: () => this.stopMiner(),
                enabled: minerRunning
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
            if (this.minerService && this.minerService.isRunning) {
                console.log('Stopping miner service...');
                await this.saveMinerState(true);
                await this.minerService.stop();
            } else {
                await this.saveMinerState(false);
            }
        } catch (error) {
            console.error('Error during graceful shutdown:', error);
        }
    }

    async saveMinerState(wasRunning) {
        try {
            if (this.config) {
                this.config.set('lastMinerState.wasRunning', wasRunning);
                this.config.set('lastMinerState.lastStopTime', new Date().toISOString());
                if (wasRunning && this.minerService && this.minerService.startTime) {
                    this.config.set('lastMinerState.lastStartTime', new Date(this.minerService.startTime).toISOString());
                }
                await this.config.save();
                console.log(`💾 Miner state saved: ${wasRunning ? 'was running' : 'was stopped'}`);
            }
        } catch (error) {
            console.error('Error saving miner state:', error);
        }
    }

    async restoreMinerState() {
        try {
            if (!this.config) return;
            
            const autoStart = this.config.get('autoStartMiner', false);
            const lastState = this.config.get('lastMinerState', {});
            
            console.log(`🔄 Checking miner state: autoStart=${autoStart}, wasRunning=${lastState.wasRunning}`);
            
            if (autoStart && lastState.wasRunning) {
                console.log('🚀 Auto-starting miner based on previous state...');
                setTimeout(async () => {
                    const result = await this.startMiner();
                    if (result.success) {
                        console.log('✅ Miner auto-started successfully');
                        if (this.mainWindow && !this.mainWindow.isDestroyed()) {
                            this.mainWindow.webContents.send('miner:auto-started');
                        }
                    } else {
                        console.warn('⚠️ Failed to auto-start miner:', result.message);
                    }
                }, 2000);
            }
        } catch (error) {
            console.error('Error restoring miner state:', error);
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

const minerApp = new MinerApp();
minerApp.initialize().catch(console.error);