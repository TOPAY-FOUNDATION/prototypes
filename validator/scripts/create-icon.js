/**
 * Convert SVG icon to ICO format for Windows installer
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function createIcon() {
    const svgPath = path.join(__dirname, '../assets/icon.svg');
    const icoPath = path.join(__dirname, '../assets/icon.ico');
    
    try {
        console.log('Converting SVG to ICO...');
        
        // Read SVG file
        const svgBuffer = fs.readFileSync(svgPath);
        
        // Create multiple sizes for ICO
        const sizes = [16, 24, 32, 48, 64, 128, 256];
        const pngBuffers = [];
        
        for (const size of sizes) {
            const pngBuffer = await sharp(svgBuffer)
                .resize(size, size)
                .png()
                .toBuffer();
            pngBuffers.push(pngBuffer);
        }
        
        // For now, we'll use the 256x256 PNG as a fallback
        // In a production environment, you'd use a proper ICO library
        const mainIcon = await sharp(svgBuffer)
            .resize(256, 256)
            .png()
            .toBuffer();
            
        // Write as PNG first (electron-builder can handle PNG icons too)
        fs.writeFileSync(icoPath.replace('.ico', '.png'), mainIcon);
        
        console.log('Icon created successfully!');
        console.log(`Created: ${icoPath.replace('.ico', '.png')}`);
        
        // Create a simple ICO header (basic implementation)
        // For production, use a proper ICO library like 'to-ico'
        const icoHeader = Buffer.alloc(6);
        icoHeader.writeUInt16LE(0, 0); // Reserved
        icoHeader.writeUInt16LE(1, 2); // Type (1 = ICO)
        icoHeader.writeUInt16LE(1, 4); // Number of images
        
        const icoEntry = Buffer.alloc(16);
        icoEntry.writeUInt8(0, 0); // Width (0 = 256)
        icoEntry.writeUInt8(0, 1); // Height (0 = 256)
        icoEntry.writeUInt8(0, 2); // Color palette
        icoEntry.writeUInt8(0, 3); // Reserved
        icoEntry.writeUInt16LE(1, 4); // Color planes
        icoEntry.writeUInt16LE(32, 6); // Bits per pixel
        icoEntry.writeUInt32LE(mainIcon.length, 8); // Image size
        icoEntry.writeUInt32LE(22, 12); // Image offset
        
        const icoBuffer = Buffer.concat([icoHeader, icoEntry, mainIcon]);
        fs.writeFileSync(icoPath, icoBuffer);
        
        console.log(`ICO file created: ${icoPath}`);
        
    } catch (error) {
        console.error('Error creating icon:', error);
        
        // Fallback: copy SVG as PNG
        try {
            const svgBuffer = fs.readFileSync(svgPath);
            const pngBuffer = await sharp(svgBuffer)
                .resize(256, 256)
                .png()
                .toBuffer();
            fs.writeFileSync(icoPath.replace('.ico', '.png'), pngBuffer);
            console.log('Created PNG fallback icon');
        } catch (fallbackError) {
            console.error('Fallback failed:', fallbackError);
        }
    }
}

if (require.main === module) {
    createIcon();
}

module.exports = createIcon;