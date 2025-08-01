/**
 * TOPAY Validator Code System Example
 * Demonstrates the new code-based validator connection system
 */

// Load environment variables
require('dotenv').config();

import { ValidatorRegistry } from './src/storage/validator-registry.js';
import { RemotePersistenceManager } from './src/storage/remote-persistence.js';

async function demonstrateValidatorCodeSystem() {
    console.log('🏛️ TOPAY Validator Code System Demo');
    console.log('=' .repeat(50));

    // 1. Create Validator Registry
    console.log('\n📋 Step 1: Creating Validator Registry...');
    const registry = new ValidatorRegistry({
        timeout: 10000,
        maxRetries: 3,
        retryDelay: 1000,
        healthCheckInterval: 30000,
        debugMode: true
    });

    // 2. Register Custom Validators
    console.log('\n🔧 Step 2: Registering Custom Validators...');
    
    // Register development validators
    registry.registerValidator({
        code: 'TOPAY-VAL-DEV-001',
        name: 'Development Validator 1',
        url: 'http://localhost:8547',
        region: 'local',
        tier: 'primary',
        capabilities: ['storage', 'validation', 'backup']
    });

    registry.registerValidator({
        code: 'TOPAY-VAL-DEV-002',
        name: 'Development Validator 2', 
        url: 'http://localhost:8548',
        region: 'local',
        tier: 'secondary',
        capabilities: ['storage', 'validation']
    });

    // Register production-like validator
    registry.registerValidator({
        code: 'TOPAY-VAL-CLOUD-001',
        name: 'Cloud Validator 1',
        url: 'http://cloud-validator:8547',
        region: 'cloud',
        tier: 'primary',
        capabilities: ['storage', 'validation', 'backup', 'analytics']
    });

    // 3. Display Registry Status
    console.log('\n📊 Step 3: Registry Status...');
    const allValidators = registry.getAllValidators();
    console.log(`Total Validators: ${allValidators.length}`);
    
    allValidators.forEach(validator => {
        console.log(`   ${validator.code}: ${validator.name} (${validator.tier})`);
        console.log(`      URL: ${validator.url}`);
        console.log(`      Region: ${validator.region}`);
        console.log(`      Capabilities: ${validator.capabilities.join(', ')}`);
    });

    // 4. Test Validator Connections
    console.log('\n🔗 Step 4: Testing Validator Connections...');
    const validatorCodes = ['TOPAY-VAL-DEV-001', 'TOPAY-VAL-DEV-002'];
    
    try {
        const connectionResults = await registry.connectToValidators(validatorCodes);
        connectionResults.forEach(result => {
            if (result.success) {
                console.log(`✅ Connected to ${result.code} (${result.responseTime}ms)`);
            } else {
                console.log(`❌ Failed to connect to ${result.code}: ${result.error}`);
            }
        });
    } catch (error) {
        console.log(`⚠️ Connection test failed: ${error.message}`);
    }

    // 5. Demonstrate Best Validator Selection
    console.log('\n🎯 Step 5: Best Validator Selection...');
    
    const bestByHealth = registry.getBestValidators(2, 'health');
    console.log('Best validators by health:');
    bestByHealth.forEach(v => {
        console.log(`   ${v.code}: Health ${v.healthScore}%`);
    });

    const bestByTier = registry.getBestValidators(2, 'tier');
    console.log('Best validators by tier:');
    bestByTier.forEach(v => {
        console.log(`   ${v.code}: Tier ${v.tier}`);
    });

    // 6. Create RemotePersistenceManager with Codes
    console.log('\n💾 Step 6: Creating RemotePersistenceManager...');
    const persistence = new RemotePersistenceManager(validatorCodes, {
        timeout: 10000,
        maxRetries: 3,
        replicationFactor: 2,
        enableBackup: true,
        debugMode: true
    });

    try {
        await persistence.initialize();
        console.log('✅ RemotePersistenceManager initialized successfully');
        
        // Get status
        const status = persistence.getValidatorStatus();
        console.log('\nValidator Status:');
        console.log(`   Total: ${status.totalValidators}`);
        console.log(`   Active: ${status.activeValidators}`);
        console.log(`   Failed: ${status.failedValidators}`);
        console.log(`   Codes: ${status.validatorCodes.join(', ')}`);
        
    } catch (error) {
        console.log(`❌ Failed to initialize: ${error.message}`);
    }

    // 7. Demonstrate Dynamic Validator Management
    console.log('\n🔄 Step 7: Dynamic Validator Management...');
    
    // Generate new validator code
    const newCode = registry.generateValidatorCode('TOPAY-VAL-DYNAMIC');
    console.log(`Generated new validator code: ${newCode}`);
    
    // Add new validator
    const newValidator = {
        code: newCode,
        name: 'Dynamic Validator',
        url: 'http://localhost:8549',
        region: 'local',
        tier: 'tertiary'
    };
    
    registry.registerValidator(newValidator);
    console.log(`✅ Added new validator: ${newCode}`);
    
    // Remove validator (example)
    // registry.validators.delete(newCode);
    // console.log(`🗑️ Removed validator: ${newCode}`);

    // 8. Export/Import Configuration
    console.log('\n📤 Step 8: Configuration Export/Import...');
    
    const config = registry.exportConfig();
    console.log(`Exported configuration with ${config.validators.length} validators`);
    console.log(`Export timestamp: ${config.exportedAt}`);
    
    // Could import to another registry:
    // const newRegistry = new ValidatorRegistry();
    // newRegistry.importConfig(config);

    // 9. Environment Variable Integration
    console.log('\n🌍 Step 9: Environment Variable Integration...');
    console.log('Environment Variables:');
    console.log(`   VALIDATOR_CODES: ${process.env.VALIDATOR_CODES || 'Not set'}`);
    console.log(`   VALIDATOR_URLS: ${process.env.VALIDATOR_URLS || 'Not set'}`);
    console.log(`   PRIMARY_VALIDATOR_CODE: ${process.env.PRIMARY_VALIDATOR_CODE || 'Not set'}`);
    console.log(`   NETWORK_TIMEOUT: ${process.env.NETWORK_TIMEOUT || 'Not set'}`);
    console.log(`   DEBUG_MODE: ${process.env.DEBUG_MODE || 'Not set'}`);

    // 10. Code vs URL Comparison
    console.log('\n🔄 Step 10: Code vs URL System Comparison...');
    console.log('OLD SYSTEM (URLs):');
    console.log('   const persistence = new RemotePersistenceManager([');
    console.log('       "http://localhost:8547",');
    console.log('       "http://localhost:8548"');
    console.log('   ]);');
    console.log('');
    console.log('NEW SYSTEM (Codes):');
    console.log('   const persistence = new RemotePersistenceManager([');
    console.log('       "TOPAY-VAL-LOCAL-001",');
    console.log('       "TOPAY-VAL-LOCAL-002"');
    console.log('   ]);');

    // Cleanup
    console.log('\n🧹 Cleanup...');
    registry.destroy();
    if (persistence) {
        persistence.destroy();
    }

    console.log('\n✅ Validator Code System Demo Completed!');
    console.log('\nKey Benefits:');
    console.log('   🔐 Enhanced Security - No direct URL exposure');
    console.log('   🏛️ Centralized Management - Single registry for all validators');
    console.log('   📊 Health Monitoring - Automatic health checks and scoring');
    console.log('   🎯 Smart Selection - Best validator selection algorithms');
    console.log('   🔄 Dynamic Management - Add/remove validators at runtime');
    console.log('   🌍 Environment Integration - Easy configuration via env vars');
}

// Run the demonstration
demonstrateValidatorCodeSystem().catch(error => {
    console.error('❌ Demo failed:', error);
    process.exit(1);
});