/**
 * TOPAY Validator - Headless Runner
 * Runs the validator service without Electron UI for testing
 */

const ValidatorService = require('./validator-service');
const ValidatorConfig = require('./config/validator-config');

class HeadlessValidator {
    constructor() {
        this.config = new ValidatorConfig();
        this.validatorService = null;
    }

    async start() {
        try {
            console.log('🚀 Starting TOPAY Validator in headless mode...');
            
            // Load configuration
            await this.config.load();
            
            // Initialize validator service
            this.validatorService = new ValidatorService(this.config);
            await this.validatorService.start();
            
            console.log('✅ Validator service started successfully');
            console.log('Press Ctrl+C to stop the validator');
            
            // Setup graceful shutdown
            this.setupShutdownHandlers();
            
        } catch (error) {
            console.error('❌ Failed to start validator service:', error);
            process.exit(1);
        }
    }

    async stop() {
        try {
            console.log('🛑 Stopping validator service...');
            if (this.validatorService) {
                await this.validatorService.stop();
            }
            console.log('✅ Validator service stopped');
            process.exit(0);
        } catch (error) {
            console.error('❌ Error stopping validator service:', error);
            process.exit(1);
        }
    }

    setupShutdownHandlers() {
        process.on('SIGINT', () => this.stop());
        process.on('SIGTERM', () => this.stop());
        process.on('SIGHUP', () => this.stop());
        
        // Windows specific
        if (process.platform === 'win32') {
            process.on('SIGBREAK', () => this.stop());
        }
        
        process.on('uncaughtException', (error) => {
            console.error('Uncaught exception:', error);
            this.stop();
        });
        
        process.on('unhandledRejection', (reason, promise) => {
            console.error('Unhandled rejection at:', promise, 'reason:', reason);
            this.stop();
        });
    }
}

// Start the headless validator
const validator = new HeadlessValidator();
validator.start().catch(error => {
    console.error('Failed to start headless validator:', error);
    process.exit(1);
});