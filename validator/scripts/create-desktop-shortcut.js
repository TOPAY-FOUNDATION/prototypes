/**
 * TOPAY Validator - Desktop Shortcut Creator
 * Creates a desktop shortcut for the TOPAY Validator application
 */

const createDesktopShortcut = require('create-desktop-shortcuts');
const path = require('path');
const fs = require('fs');
const { app } = require('electron');

/**
 * Creates a desktop shortcut for the TOPAY Validator application
 * @param {Object} options - Options for creating the shortcut
 * @param {boolean} options.force - Whether to force creation even if shortcut exists
 * @returns {boolean} - Whether the shortcut was created successfully
 */
function createShortcut(options = {}) {
    const force = options.force || false;
    
    try {
        // Get the path to the executable
        const exePath = process.execPath;
        
        // Get the path to the icon
        const iconPath = path.join(path.dirname(exePath), 'resources', 'app', 'assets', 'icon.ico');
        
        // Check if icon exists, otherwise use the exe itself as the icon
        const icon = fs.existsSync(iconPath) ? iconPath : exePath;
        
        // Create the shortcut
        const shortcutOptions = {
            windows: {
                filePath: exePath,
                // Default to desktop if not specified
                outputPath: options.outputPath,
                name: 'TOPAY Validator',
                comment: 'TOPAY Quantum-Safe Blockchain Validator',
                icon: icon,
                windowMode: 'normal'
            }
        };
        
        const success = createDesktopShortcut(shortcutOptions);
        
        if (success) {
            console.log('Desktop shortcut created successfully');
        } else {
            console.error('Failed to create desktop shortcut');
        }
        
        return success;
    } catch (error) {
        console.error('Error creating desktop shortcut:', error);
        return false;
    }
}

/**
 * Creates a desktop shortcut when called directly
 */
if (require.main === module) {
    // When run directly from command line
    createShortcut();
}

module.exports = createShortcut;