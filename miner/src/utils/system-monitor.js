/**
 * TOPAY Validator - System Monitor
 * Monitors system resources and validator performance
 */

const os = require('os');
const fs = require('fs').promises;
const path = require('path');
const { EventEmitter } = require('events');

class SystemMonitor extends EventEmitter {
    constructor(options = {}) {
        super();
        this.monitoringInterval = options.interval || 30000; // 30 seconds
        this.alertThresholds = {
            cpuUsage: options.cpuThreshold || 80,
            memoryUsage: options.memoryThreshold || 85,
            diskUsage: options.diskThreshold || 90,
            ...options.thresholds
        };
        
        this.isMonitoring = false;
        this.monitorTimer = null;
        this.metrics = {
            cpu: [],
            memory: [],
            disk: [],
            network: [],
            validator: []
        };
        this.maxMetricsHistory = 100;
    }

    start() {
        if (this.isMonitoring) {
            return;
        }

        this.isMonitoring = true;
        this.monitorTimer = setInterval(() => {
            this.collectMetrics();
        }, this.monitoringInterval);

        this.emit('monitoring-started');
    }

    stop() {
        if (!this.isMonitoring) {
            return;
        }

        this.isMonitoring = false;
        if (this.monitorTimer) {
            clearInterval(this.monitorTimer);
            this.monitorTimer = null;
        }

        this.emit('monitoring-stopped');
    }

    async collectMetrics() {
        try {
            const timestamp = Date.now();
            
            // Collect system metrics
            const cpuMetrics = await this.getCPUMetrics();
            const memoryMetrics = this.getMemoryMetrics();
            const diskMetrics = await this.getDiskMetrics();
            const networkMetrics = this.getNetworkMetrics();
            const validatorMetrics = this.getValidatorMetrics();

            // Store metrics
            this.addMetric('cpu', { timestamp, ...cpuMetrics });
            this.addMetric('memory', { timestamp, ...memoryMetrics });
            this.addMetric('disk', { timestamp, ...diskMetrics });
            this.addMetric('network', { timestamp, ...networkMetrics });
            this.addMetric('validator', { timestamp, ...validatorMetrics });

            // Check thresholds and emit alerts
            this.checkThresholds({
                cpu: cpuMetrics,
                memory: memoryMetrics,
                disk: diskMetrics,
                network: networkMetrics,
                validator: validatorMetrics
            });

            // Emit metrics update
            this.emit('metrics-updated', {
                cpu: cpuMetrics,
                memory: memoryMetrics,
                disk: diskMetrics,
                network: networkMetrics,
                validator: validatorMetrics
            });

        } catch (error) {
            this.emit('monitoring-error', error);
        }
    }

    addMetric(type, metric) {
        this.metrics[type].push(metric);
        if (this.metrics[type].length > this.maxMetricsHistory) {
            this.metrics[type].shift();
        }
    }

    async getCPUMetrics() {
        return new Promise((resolve) => {
            const startMeasure = this.cpuAverage();
            
            setTimeout(() => {
                const endMeasure = this.cpuAverage();
                const idleDifference = endMeasure.idle - startMeasure.idle;
                const totalDifference = endMeasure.total - startMeasure.total;
                const percentageCPU = 100 - ~~(100 * idleDifference / totalDifference);
                
                resolve({
                    usage: percentageCPU,
                    cores: os.cpus().length,
                    loadAverage: os.loadavg(),
                    model: os.cpus()[0].model
                });
            }, 1000);
        });
    }

    cpuAverage() {
        const cpus = os.cpus();
        let user = 0, nice = 0, sys = 0, idle = 0, irq = 0;
        
        for (let cpu of cpus) {
            user += cpu.times.user;
            nice += cpu.times.nice;
            sys += cpu.times.sys;
            idle += cpu.times.idle;
            irq += cpu.times.irq;
        }
        
        const total = user + nice + sys + idle + irq;
        return { idle, total };
    }

    getMemoryMetrics() {
        const totalMemory = os.totalmem();
        const freeMemory = os.freemem();
        const usedMemory = totalMemory - freeMemory;
        const usagePercentage = (usedMemory / totalMemory) * 100;

        const processMemory = process.memoryUsage();

        return {
            total: totalMemory,
            free: freeMemory,
            used: usedMemory,
            usage: usagePercentage,
            process: {
                rss: processMemory.rss,
                heapTotal: processMemory.heapTotal,
                heapUsed: processMemory.heapUsed,
                external: processMemory.external
            }
        };
    }

    async getDiskMetrics() {
        try {
            const homeDir = os.homedir();
            const stats = await fs.stat(homeDir);
            
            // This is a simplified disk usage check
            // In a real implementation, you might want to use a library like 'diskusage'
            return {
                path: homeDir,
                available: 'N/A', // Would need platform-specific implementation
                used: 'N/A',
                total: 'N/A',
                usage: 0
            };
        } catch (error) {
            return {
                path: 'unknown',
                available: 0,
                used: 0,
                total: 0,
                usage: 0,
                error: error.message
            };
        }
    }

    getNetworkMetrics() {
        const networkInterfaces = os.networkInterfaces();
        const interfaces = [];

        for (const [name, nets] of Object.entries(networkInterfaces)) {
            for (const net of nets) {
                if (!net.internal) {
                    interfaces.push({
                        name,
                        family: net.family,
                        address: net.address,
                        netmask: net.netmask,
                        mac: net.mac
                    });
                }
            }
        }

        return {
            interfaces,
            hostname: os.hostname(),
            // Network traffic would require additional monitoring
            bytesReceived: 0,
            bytesSent: 0
        };
    }

    getValidatorMetrics() {
        // These would be provided by the validator service
        return {
            uptime: process.uptime(),
            pid: process.pid,
            version: process.version,
            platform: process.platform,
            arch: process.arch,
            // Validator-specific metrics would be injected here
            blockHeight: 0,
            peerCount: 0,
            validationCount: 0,
            lastValidation: null
        };
    }

    checkThresholds(metrics) {
        const alerts = [];

        // CPU threshold check
        if (metrics.cpu.usage > this.alertThresholds.cpuUsage) {
            alerts.push({
                type: 'cpu',
                level: 'warning',
                message: `High CPU usage: ${metrics.cpu.usage.toFixed(1)}%`,
                threshold: this.alertThresholds.cpuUsage,
                current: metrics.cpu.usage
            });
        }

        // Memory threshold check
        if (metrics.memory.usage > this.alertThresholds.memoryUsage) {
            alerts.push({
                type: 'memory',
                level: 'warning',
                message: `High memory usage: ${metrics.memory.usage.toFixed(1)}%`,
                threshold: this.alertThresholds.memoryUsage,
                current: metrics.memory.usage
            });
        }

        // Disk threshold check
        if (metrics.disk.usage > this.alertThresholds.diskUsage) {
            alerts.push({
                type: 'disk',
                level: 'warning',
                message: `High disk usage: ${metrics.disk.usage.toFixed(1)}%`,
                threshold: this.alertThresholds.diskUsage,
                current: metrics.disk.usage
            });
        }

        // Emit alerts
        alerts.forEach(alert => {
            this.emit('alert', alert);
        });
    }

    getMetrics(type = null, count = 10) {
        if (type) {
            return this.metrics[type].slice(-count);
        }
        
        const result = {};
        for (const [key, values] of Object.entries(this.metrics)) {
            result[key] = values.slice(-count);
        }
        return result;
    }

    getLatestMetrics() {
        const result = {};
        for (const [key, values] of Object.entries(this.metrics)) {
            result[key] = values[values.length - 1] || null;
        }
        return result;
    }

    getSystemInfo() {
        return {
            platform: os.platform(),
            arch: os.arch(),
            release: os.release(),
            hostname: os.hostname(),
            uptime: os.uptime(),
            totalMemory: os.totalmem(),
            cpus: os.cpus().length,
            cpuModel: os.cpus()[0]?.model || 'Unknown',
            nodeVersion: process.version,
            processUptime: process.uptime(),
            pid: process.pid
        };
    }

    async exportMetrics(filePath) {
        try {
            const exportData = {
                timestamp: new Date().toISOString(),
                systemInfo: this.getSystemInfo(),
                metrics: this.metrics,
                thresholds: this.alertThresholds
            };

            await fs.writeFile(filePath, JSON.stringify(exportData, null, 2));
            return true;
        } catch (error) {
            this.emit('export-error', error);
            return false;
        }
    }

    setThreshold(type, value) {
        if (this.alertThresholds.hasOwnProperty(type)) {
            this.alertThresholds[type] = value;
            this.emit('threshold-updated', { type, value });
        }
    }

    clearMetrics(type = null) {
        if (type && this.metrics[type]) {
            this.metrics[type] = [];
        } else {
            for (const key of Object.keys(this.metrics)) {
                this.metrics[key] = [];
            }
        }
        this.emit('metrics-cleared', type);
    }
}

module.exports = SystemMonitor;