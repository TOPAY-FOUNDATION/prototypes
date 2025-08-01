/**
 * TOPAY Validator - Add Desktop Icon
 * Command-line script to create a desktop shortcut for the TOPAY Validator
 */

const createDesktopShortcut = require('create-desktop-shortcuts');
const path = require('path');
const fs = require('fs');

/**
 * Creates a desktop shortcut for the TOPAY Validator application
 */
function createShortcut() {
    try {
        // For development environment, create a shortcut to run the app with npm
        const isDev = process.env.NODE_ENV === 'development' || !fs.existsSync(path.join(process.cwd(), 'dist'));
        
        if (isDev) {
            console.log('Creating shortcut for development version...');
            return createDevShortcut();
        }
        
        // Get the application path for installed version
        const appPath = process.env.APPDATA ? 
            path.join(process.env.APPDATA, '..', 'Local', 'Programs', 'topay-validator', 'TOPAY Validator.exe') :
            path.join(process.cwd(), 'TOPAY Validator.exe');
        
        // Check if the application exists
        if (!fs.existsSync(appPath)) {
            console.log(`Application not found at ${appPath}`);
            console.log('Searching for application...');
            
            // Try to find the application in common installation directories
            const possiblePaths = [
                path.join(process.env.ProgramFiles, 'TOPAY', 'Validator', 'TOPAY Validator.exe'),
                path.join(process.env.ProgramFiles, 'TOPAY Validator', 'TOPAY Validator.exe'),
                path.join(process.env['ProgramFiles(x86)'], 'TOPAY', 'Validator', 'TOPAY Validator.exe'),
                path.join(process.env['ProgramFiles(x86)'], 'TOPAY Validator', 'TOPAY Validator.exe'),
                path.join(process.cwd(), 'dist', 'TOPAY Validator.exe')
            ];
            
            for (const possiblePath of possiblePaths) {
                if (fs.existsSync(possiblePath)) {
                    console.log(`Found application at ${possiblePath}`);
                    return createShortcutForPath(possiblePath);
                }
            }
            
            console.log('Could not find installed TOPAY Validator application.');
            console.log('Creating shortcut for development version instead...');
            return createDevShortcut();
        }
        
        return createShortcutForPath(appPath);
    } catch (error) {
        console.error('Error creating desktop shortcut:', error);
        return false;
    }
}

/**
 * Creates a desktop shortcut for the development version
 * @returns {boolean} - Whether the shortcut was created successfully
 */
function createDevShortcut() {
    try {
        // Create a batch file to run the app
        const projectRoot = process.cwd();
        const validatorDir = path.join(projectRoot, 'validator');
        const batchFilePath = path.join(validatorDir, 'run-validator.bat');
        
        // Create batch file content
        const batchContent = `@echo off
` +
            `cd /d "${validatorDir}"
` +
            `echo Starting TOPAY Validator...
` +
            `npm run dev
` +
            `pause
`;
        
        // Write batch file
        fs.writeFileSync(batchFilePath, batchContent);
        console.log(`Created batch file at ${batchFilePath}`);
        
        // Get icon path
        const iconPath = path.join(validatorDir, 'assets', 'icon.ico');
        const icon = fs.existsSync(iconPath) ? iconPath : null;
        
        // Create shortcut to batch file
        const shortcutOptions = {
            windows: {
                filePath: batchFilePath,
                name: 'TOPAY Validator (Dev)',
                comment: 'TOPAY Quantum-Safe Blockchain Validator (Development)',
                icon: icon,
                windowMode: 'normal'
            }
        };
        
        const success = createDesktopShortcut(shortcutOptions);
        
        if (success) {
            console.log('Desktop shortcut created successfully for development version');
        } else {
            console.error('Failed to create desktop shortcut for development version');
        }
        
        return success;
    } catch (error) {
        console.error('Error creating development shortcut:', error);
        return false;
    }
}

/**
 * Creates a desktop shortcut for the specified application path
 * @param {string} appPath - Path to the application executable
 * @returns {boolean} - Whether the shortcut was created successfully
 */
function createShortcutForPath(appPath) {
    // Get the path to the icon
    const iconPath = path.join(path.dirname(appPath), 'resources', 'app', 'assets', 'icon.ico');
    
    // Check if icon exists, otherwise use the exe itself as the icon
    const icon = fs.existsSync(iconPath) ? iconPath : appPath;
    
    // Create the shortcut
    const shortcutOptions = {
        windows: {
            filePath: appPath,
            // Default to desktop
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
}

// Run the script
createShortcut();