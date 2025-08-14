# TOPAY Validator Desktop Application

A modern desktop application for running and managing TOPAY blockchain validator nodes with an intuitive user interface.

## Features

- **Modern UI**: Clean, responsive interface built with Electron
- **Validator Control**: Start, stop, and restart validator services
- **Real-time Monitoring**: Live status updates and performance metrics
- **Network Management**: View and manage peer connections
- **Configuration**: Easy-to-use settings management
- **Logs**: Real-time log viewing and export
- **System Tray**: Background operation with system tray integration

## Installation

### Prerequisites

- Node.js 16+
- npm or yarn

### Setup

1. Clone or download the validator directory
2. Install dependencies:

   ```bash
   npm install
   ```

## Usage

### Development Mode

Start the application in development mode:

```bash
npm start
```

### Building for Distribution

Build the application for your platform:

```bash
# Build for current platform
npm run build

# Build for Windows
npm run build:win

# Build for macOS
npm run build:mac

# Build for Linux
npm run build:linux
```

### Creating Installers

Create platform-specific installers:

```bash
# Create installer for current platform
npm run dist

# Pack without installer
npm run pack
```

## Application Structure

```tree
validator/
├── src/
│   ├── main.js          # Electron main process
│   ├── preload.js       # Preload script for security
│   ├── ui/              # User interface files
│   │   ├── index.html   # Main UI
│   │   ├── styles.css   # Styling
│   │   └── renderer.js  # UI logic
│   ├── config/          # Configuration management
│   ├── validator-service.js # Core validator logic
│   └── ...
├── assets/              # Application icons
├── package.json         # Dependencies and scripts
└── README.md           # This file
```

## Features Overview

### Dashboard

- Validator status overview
- Performance metrics
- Quick actions

### Validator Control

- Start/Stop validator service
- Restart functionality
- Status monitoring

### Network

- Peer connections
- Network statistics
- Connection health

### Logs

- Real-time log viewing
- Log filtering
- Export functionality

### Settings

- Configuration management
- Network settings
- Performance tuning

## System Tray

The application runs in the system tray when minimized, providing:

- Quick status overview
- Start/Stop controls
- Access to main window
- Exit option

## Keyboard Shortcuts

- `Ctrl+R` / `Cmd+R`: Refresh
- `Ctrl+Shift+I` / `Cmd+Opt+I`: Developer Tools
- `Ctrl+Q` / `Cmd+Q`: Quit Application

## Troubleshooting

### Common Issues

1. **Application won't start**
   - Ensure Node.js 16+ is installed
   - Run `npm install` to install dependencies
   - Check for port conflicts

2. **Validator service errors**
   - Check network connectivity
   - Verify configuration settings
   - Review logs for specific errors

3. **Build issues**
   - Clear node_modules and reinstall: `rm -rf node_modules && npm install`
   - Update Electron: `npm update electron`

### Log Management

Application logs are available in:

- **Windows**: `%APPDATA%/topay-validator/logs/`
- **macOS**: `~/Library/Logs/topay-validator/`
- **Linux**: `~/.config/topay-validator/logs/`

## Development

### Project Structure

The application follows Electron's main/renderer process architecture:

- **Main Process** (`src/main.js`): Manages application lifecycle, windows, and system integration
- **Renderer Process** (`src/ui/`): Handles the user interface
- **Preload Script** (`src/preload.js`): Provides secure communication between processes

### Adding Features

1. Add UI components in `src/ui/`
2. Implement backend logic in appropriate modules
3. Use IPC for main/renderer communication
4. Update the preload script for new APIs

## Security

The application follows Electron security best practices:

- Context isolation enabled
- Node integration disabled in renderer
- Secure IPC communication via preload script
- Content Security Policy implemented

## License

This project is part of the TOPAY Foundation blockchain ecosystem.

## Support

For issues and support:

- Check the troubleshooting section
- Review application logs
- Contact TOPAY Foundation support
