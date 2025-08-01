/**
 * TOPAY Validator - Logging System
 * Handles application logging with different levels and file output
 */

const fs = require('fs').promises;
const path = require('path');
const os = require('os');

class Logger {
    constructor(options = {}) {
        this.logLevel = options.logLevel || 'info';
        this.logDir = options.logDir || path.join(os.homedir(), '.topay-validator', 'logs');
        this.maxLogFiles = options.maxLogFiles || 10;
        this.maxLogSize = options.maxLogSize || 10 * 1024 * 1024; // 10MB
        this.logBuffer = [];
        this.maxBufferSize = 1000;
        
        this.levels = {
            error: 0,
            warn: 1,
            info: 2,
            debug: 3
        };
        
        this.init();
    }

    async init() {
        try {
            await fs.mkdir(this.logDir, { recursive: true });
        } catch (error) {
            console.error('Failed to create log directory:', error);
        }
    }

    log(level, message, meta = {}) {
        if (this.levels[level] > this.levels[this.logLevel]) {
            return;
        }

        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            level,
            message,
            meta,
            pid: process.pid
        };

        // Add to buffer
        this.logBuffer.push(logEntry);
        if (this.logBuffer.length > this.maxBufferSize) {
            this.logBuffer.shift();
        }

        // Console output
        const consoleMessage = `[${timestamp}] ${level.toUpperCase()}: ${message}`;
        switch (level) {
            case 'error':
                console.error(consoleMessage, meta);
                break;
            case 'warn':
                console.warn(consoleMessage, meta);
                break;
            case 'debug':
                console.debug(consoleMessage, meta);
                break;
            default:
                console.log(consoleMessage, meta);
        }

        // Write to file (async, non-blocking)
        this.writeToFile(logEntry).catch(err => {
            console.error('Failed to write log to file:', err);
        });
    }

    error(message, meta) {
        this.log('error', message, meta);
    }

    warn(message, meta) {
        this.log('warn', message, meta);
    }

    info(message, meta) {
        this.log('info', message, meta);
    }

    debug(message, meta) {
        this.log('debug', message, meta);
    }

    async writeToFile(logEntry) {
        try {
            const logFileName = `validator-${new Date().toISOString().split('T')[0]}.log`;
            const logFilePath = path.join(this.logDir, logFileName);
            
            const logLine = JSON.stringify(logEntry) + '\n';
            
            // Check file size and rotate if necessary
            try {
                const stats = await fs.stat(logFilePath);
                if (stats.size > this.maxLogSize) {
                    await this.rotateLogFile(logFilePath);
                }
            } catch (error) {
                // File doesn't exist, which is fine
            }
            
            await fs.appendFile(logFilePath, logLine);
        } catch (error) {
            console.error('Failed to write to log file:', error);
        }
    }

    async rotateLogFile(logFilePath) {
        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const rotatedPath = logFilePath.replace('.log', `-${timestamp}.log`);
            await fs.rename(logFilePath, rotatedPath);
            
            // Clean up old log files
            await this.cleanupOldLogs();
        } catch (error) {
            console.error('Failed to rotate log file:', error);
        }
    }

    async cleanupOldLogs() {
        try {
            const files = await fs.readdir(this.logDir);
            const logFiles = files
                .filter(file => file.endsWith('.log'))
                .map(file => ({
                    name: file,
                    path: path.join(this.logDir, file)
                }));

            if (logFiles.length > this.maxLogFiles) {
                // Sort by modification time and remove oldest
                const fileStats = await Promise.all(
                    logFiles.map(async file => ({
                        ...file,
                        stats: await fs.stat(file.path)
                    }))
                );

                fileStats.sort((a, b) => a.stats.mtime - b.stats.mtime);
                
                const filesToDelete = fileStats.slice(0, fileStats.length - this.maxLogFiles);
                await Promise.all(
                    filesToDelete.map(file => fs.unlink(file.path))
                );
            }
        } catch (error) {
            console.error('Failed to cleanup old logs:', error);
        }
    }

    getRecentLogs(count = 100) {
        return this.logBuffer.slice(-count);
    }

    async exportLogs(exportPath) {
        try {
            const logs = this.getRecentLogs(1000);
            const exportData = {
                exportTime: new Date().toISOString(),
                validatorVersion: require('../../package.json').version,
                logs
            };
            
            await fs.writeFile(exportPath, JSON.stringify(exportData, null, 2));
            return true;
        } catch (error) {
            this.error('Failed to export logs', { error: error.message, exportPath });
            return false;
        }
    }

    setLogLevel(level) {
        if (this.levels.hasOwnProperty(level)) {
            this.logLevel = level;
            this.info(`Log level changed to: ${level}`);
        } else {
            this.warn(`Invalid log level: ${level}`);
        }
    }

    // Performance logging helpers
    startTimer(label) {
        const start = process.hrtime.bigint();
        return {
            end: () => {
                const end = process.hrtime.bigint();
                const duration = Number(end - start) / 1000000; // Convert to milliseconds
                this.debug(`Timer [${label}]: ${duration.toFixed(2)}ms`);
                return duration;
            }
        };
    }

    // Memory usage logging
    logMemoryUsage() {
        const usage = process.memoryUsage();
        this.debug('Memory usage', {
            rss: `${Math.round(usage.rss / 1024 / 1024)}MB`,
            heapTotal: `${Math.round(usage.heapTotal / 1024 / 1024)}MB`,
            heapUsed: `${Math.round(usage.heapUsed / 1024 / 1024)}MB`,
            external: `${Math.round(usage.external / 1024 / 1024)}MB`
        });
    }

    // System info logging
    logSystemInfo() {
        this.info('System information', {
            platform: os.platform(),
            arch: os.arch(),
            nodeVersion: process.version,
            totalMemory: `${Math.round(os.totalmem() / 1024 / 1024 / 1024)}GB`,
            freeMemory: `${Math.round(os.freemem() / 1024 / 1024 / 1024)}GB`,
            cpus: os.cpus().length,
            uptime: `${Math.round(os.uptime() / 3600)}h`
        });
    }
}

// Create singleton instance
const logger = new Logger();

module.exports = logger;