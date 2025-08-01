/**
 * TOPAY Validator - Windows Service Installer
 * Handles installation and management of the validator as a Windows service
 */

const Service = require('node-windows').Service;
const path = require('path');
const fs = require('fs').promises;
const logger = require('../utils/logger');

class WindowsServiceManager {
    constructor(options = {}) {
        this.serviceName = options.serviceName || 'TOPAY Validator';
        this.serviceDescription = options.serviceDescription || 'TOPAY Blockchain Validator Service';
        this.scriptPath = options.scriptPath || path.join(__dirname, '../main.js');
        this.serviceUser = options.serviceUser || null; // null = LocalSystem
        this.servicePassword = options.servicePassword || null;
        
        this.service = new Service({
            name: this.serviceName,
            description: this.serviceDescription,
            script: this.scriptPath,
            nodeOptions: [
                '--max_old_space_size=4096'
            ],
            env: {
                NODE_ENV: 'production',
                TOPAY_SERVICE_MODE: 'true'
            },
            user: this.serviceUser,
            password: this.servicePassword,
            allowServiceLogon: true
        });

        this.setupEventHandlers();
    }

    setupEventHandlers() {
        this.service.on('install', () => {
            logger.info('Service installed successfully');
            this.service.start();
        });

        this.service.on('alreadyinstalled', () => {
            logger.warn('Service is already installed');
        });

        this.service.on('invalidinstallation', () => {
            logger.error('Invalid service installation');
        });

        this.service.on('uninstall', () => {
            logger.info('Service uninstalled successfully');
        });

        this.service.on('start', () => {
            logger.info('Service started successfully');
        });

        this.service.on('stop', () => {
            logger.info('Service stopped successfully');
        });

        this.service.on('error', (error) => {
            logger.error('Service error:', error);
        });
    }

    async install() {
        try {
            logger.info('Installing TOPAY Validator service...');
            
            // Check if script exists
            await fs.access(this.scriptPath);
            
            // Install the service
            this.service.install();
            
            return true;
        } catch (error) {
            logger.error('Failed to install service:', error);
            return false;
        }
    }

    async uninstall() {
        try {
            logger.info('Uninstalling TOPAY Validator service...');
            
            // Stop the service first if it's running
            if (await this.isRunning()) {
                await this.stop();
                // Wait a bit for the service to stop
                await new Promise(resolve => setTimeout(resolve, 3000));
            }
            
            this.service.uninstall();
            return true;
        } catch (error) {
            logger.error('Failed to uninstall service:', error);
            return false;
        }
    }

    async start() {
        try {
            logger.info('Starting TOPAY Validator service...');
            this.service.start();
            return true;
        } catch (error) {
            logger.error('Failed to start service:', error);
            return false;
        }
    }

    async stop() {
        try {
            logger.info('Stopping TOPAY Validator service...');
            this.service.stop();
            return true;
        } catch (error) {
            logger.error('Failed to stop service:', error);
            return false;
        }
    }

    async restart() {
        try {
            logger.info('Restarting TOPAY Validator service...');
            await this.stop();
            // Wait for service to stop
            await new Promise(resolve => setTimeout(resolve, 3000));
            await this.start();
            return true;
        } catch (error) {
            logger.error('Failed to restart service:', error);
            return false;
        }
    }

    async isInstalled() {
        return new Promise((resolve) => {
            const { exec } = require('child_process');
            exec(`sc query "${this.serviceName}"`, (error, stdout, stderr) => {
                if (error) {
                    resolve(false);
                } else {
                    resolve(stdout.includes('SERVICE_NAME'));
                }
            });
        });
    }

    async isRunning() {
        return new Promise((resolve) => {
            const { exec } = require('child_process');
            exec(`sc query "${this.serviceName}"`, (error, stdout, stderr) => {
                if (error) {
                    resolve(false);
                } else {
                    resolve(stdout.includes('RUNNING'));
                }
            });
        });
    }

    async getStatus() {
        return new Promise((resolve) => {
            const { exec } = require('child_process');
            exec(`sc query "${this.serviceName}"`, (error, stdout, stderr) => {
                if (error) {
                    resolve({
                        installed: false,
                        running: false,
                        status: 'Not Installed'
                    });
                } else {
                    const installed = stdout.includes('SERVICE_NAME');
                    const running = stdout.includes('RUNNING');
                    const stopped = stdout.includes('STOPPED');
                    
                    let status = 'Unknown';
                    if (running) status = 'Running';
                    else if (stopped) status = 'Stopped';
                    else if (installed) status = 'Installed';
                    
                    resolve({
                        installed,
                        running,
                        status
                    });
                }
            });
        });
    }

    async createServiceScript() {
        const serviceScript = `
/**
 * TOPAY Validator Service Entry Point
 * This script runs the validator in service mode
 */

const { app } = require('electron');
const ValidatorService = require('./validator-service');
const logger = require('./utils/logger');

// Disable Electron GUI when running as service
if (process.env.TOPAY_SERVICE_MODE === 'true') {
    app.disableHardwareAcceleration();
    app.commandLine.appendSwitch('disable-gpu');
    app.commandLine.appendSwitch('disable-software-rasterizer');
}

class ServiceRunner {
    constructor() {
        this.validator = null;
        this.isShuttingDown = false;
    }

    async start() {
        try {
            logger.info('Starting TOPAY Validator service...');
            
            this.validator = new ValidatorService();
            await this.validator.start();
            
            logger.info('TOPAY Validator service started successfully');
            
            // Setup graceful shutdown
            this.setupShutdownHandlers();
            
        } catch (error) {
            logger.error('Failed to start validator service:', error);
            process.exit(1);
        }
    }

    async stop() {
        if (this.isShuttingDown) return;
        
        this.isShuttingDown = true;
        logger.info('Stopping TOPAY Validator service...');
        
        try {
            if (this.validator) {
                await this.validator.stop();
            }
            logger.info('TOPAY Validator service stopped successfully');
        } catch (error) {
            logger.error('Error stopping validator service:', error);
        }
        
        process.exit(0);
    }

    setupShutdownHandlers() {
        process.on('SIGINT', () => this.stop());
        process.on('SIGTERM', () => this.stop());
        process.on('SIGHUP', () => this.stop());
        
        // Windows specific
        process.on('SIGBREAK', () => this.stop());
        
        process.on('uncaughtException', (error) => {
            logger.error('Uncaught exception:', error);
            this.stop();
        });
        
        process.on('unhandledRejection', (reason, promise) => {
            logger.error('Unhandled rejection at:', promise, 'reason:', reason);
            this.stop();
        });
    }
}

// Start the service if running in service mode
if (process.env.TOPAY_SERVICE_MODE === 'true') {
    const serviceRunner = new ServiceRunner();
    serviceRunner.start();
} else {
    // Normal Electron app mode
    require('./main');
}
`;

        const servicePath = path.join(__dirname, '../service.js');
        await fs.writeFile(servicePath, serviceScript);
        return servicePath;
    }

    async setupAutoStart() {
        try {
            const { exec } = require('child_process');
            
            // Set service to start automatically
            return new Promise((resolve, reject) => {
                exec(`sc config "${this.serviceName}" start= auto`, (error, stdout, stderr) => {
                    if (error) {
                        reject(error);
                    } else {
                        logger.info('Service configured for automatic startup');
                        resolve(true);
                    }
                });
            });
        } catch (error) {
            logger.error('Failed to setup auto start:', error);
            return false;
        }
    }

    async createUninstaller() {
        const uninstallerScript = `
@echo off
echo Uninstalling TOPAY Validator Service...
node "${path.join(__dirname, 'service-manager.js')}" uninstall
pause
`;

        const uninstallerPath = path.join(process.cwd(), 'uninstall-service.bat');
        await fs.writeFile(uninstallerPath, uninstallerScript);
        return uninstallerPath;
    }

    async getLogs() {
        try {
            const logPath = path.join(process.env.ALLUSERSPROFILE, 'nodejs', 'node-windows', this.serviceName, 'daemon', 'winsw.out.log');
            const logs = await fs.readFile(logPath, 'utf8');
            return logs.split('\n').slice(-100); // Last 100 lines
        } catch (error) {
            logger.warn('Could not read service logs:', error.message);
            return [];
        }
    }
}

module.exports = WindowsServiceManager;

// CLI interface
if (require.main === module) {
    const serviceManager = new WindowsServiceManager();
    const command = process.argv[2];

    switch (command) {
        case 'install':
            serviceManager.install();
            break;
        case 'uninstall':
            serviceManager.uninstall();
            break;
        case 'start':
            serviceManager.start();
            break;
        case 'stop':
            serviceManager.stop();
            break;
        case 'restart':
            serviceManager.restart();
            break;
        case 'status':
            serviceManager.getStatus().then(status => {
                console.log('Service Status:', status);
            });
            break;
        default:
            console.log('Usage: node service-manager.js [install|uninstall|start|stop|restart|status]');
    }
}