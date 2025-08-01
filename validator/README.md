# TOPAY Validator - Windows Client

A professional Windows desktop application for running and managing a TOPAY blockchain validator node.

## Features

- **Modern Desktop Interface**: Built with Electron for a native Windows experience
- **Real-time Monitoring**: Live dashboard with validation metrics and system performance
- **Network Management**: Peer connection monitoring and blockchain synchronization
- **Configuration Management**: Easy-to-use settings interface with validation
- **Logging System**: Comprehensive logging with export capabilities
- **Windows Service**: Optional installation as a Windows service for background operation
- **Professional Installers**: MSI and EXE installers for easy deployment

## System Requirements

- Windows 10 or later (64-bit recommended)
- Node.js 18.0 or later
- 4GB RAM minimum (8GB recommended)
- 10GB free disk space
- Internet connection for blockchain synchronization

## Installation

### Option 1: Using Installers (Recommended)

Download and run one of the pre-built installers:

1. **NSIS Installer** (`TOPAY Validator Setup 1.0.0.exe`)
   - Full installer with uninstaller
   - Desktop and Start Menu shortcuts
   - Custom installation directory option

2. **MSI Installer** (`TOPAY Validator 1.0.0.msi`)
   - Windows Installer package
   - Enterprise deployment support
   - Group Policy compatible

**Installation Steps:**

1. Download the installer from the releases page
2. Run as Administrator
3. Follow the installation wizard
4. Launch from desktop shortcut or Start Menu

**Uninstallation:**

- Windows Settings → Apps & Features → "TOPAY Validator" → Uninstall
- Or Control Panel → Programs and Features → "TOPAY Validator" → Uninstall

### Option 2: Development Setup

For developers or advanced users:

1. Clone the repository:

   ```bash
   git clone https://github.com/topay-foundation/topay-prototype.git
   cd topay-prototype/validator
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start in development mode:

   ```bash
   npm run dev
   ```

4. Build installers:

   ```bash
   npm run build:installer
   ```

## Usage

### Desktop Application

1. Launch TOPAY Validator from the Start Menu
2. The application will automatically connect to the TOPAY blockchain
3. Monitor validation status in the Dashboard tab
4. Configure settings in the Settings tab
5. View logs in the Logs tab

### Windows Service Mode

To install as a Windows service (runs in background):

```bash
npm run service:install
```

To uninstall the service:

```bash
npm run service:uninstall
```

Service management commands:

```bash
npm run service:start    # Start the service
npm run service:stop     # Stop the service
npm run service:restart  # Restart the service
npm run service:status   # Check service status
```

## Configuration

The validator can be configured through the Settings interface or by editing the configuration file:

**Default Configuration Location:**

```path
%USERPROFILE%\.topay-validator\config\validator-config.json
```

### Key Configuration Options

- **Validator Name**: Human-readable name for your validator
- **RPC URL**: Blockchain RPC server endpoint
- **Network Settings**: Peer limits and sync intervals
- **Performance**: Thread count and cache settings
- **Security**: Authentication and encryption options

## Dashboard Features

### Overview Tab

- Real-time validation status
- Block height and peer count
- System uptime and performance metrics
- Validation success rate

### Validation Tab

- Detailed validation history
- Success/failure statistics
- Recent validation events
- Validator identification

### Network Tab

- Connected peer information
- Sync status and progress
- Network connectivity health
- RPC connection status

### Settings Tab

- Validator configuration
- Network parameters
- Performance tuning
- Security settings

### Logs Tab

- Real-time log viewing
- Log level filtering
- Export functionality
- Search and navigation

## Building Installers

The TOPAY Validator includes professional Windows installers with full install/uninstall functionality:

```bash
# Build both NSIS (.exe) and MSI installers
npm run build:installer

# Build NSIS installer only (recommended for most users)
npm run build:exe

# Build MSI installer only (for enterprise deployment)
npm run build:msi

# Create icon files from SVG
npm run build:icon
```

**Generated Files:**

- `installers/TOPAY Validator Setup 1.0.0.exe` - NSIS installer
- `installers/TOPAY Validator 1.0.0.msi` - MSI installer
- `installers/win-unpacked/` - Unpacked application files

**Installer Features:**

- ✅ Full uninstaller included
- ✅ Desktop and Start Menu shortcuts
- ✅ Custom installation directory
- ✅ Administrator elevation handling
- ✅ Windows registry integration
- ✅ Automatic update support
- ✅ Professional branding and icons

## Development

### Project Structure

```tree
validator/
├── src/
│   ├── main.js                 # Electron main process
│   ├── preload.js             # Preload script for security
│   ├── validator-service.js    # Core validator logic
│   ├── config/
│   │   └── validator-config.js # Configuration management
│   ├── renderer/
│   │   ├── index.html         # Main UI
│   │   ├── styles.css         # UI styles
│   │   ├── renderer.js        # UI logic
│   │   └── assets/            # Images and icons
│   ├── service/
│   │   └── service-manager.js  # Windows service management
│   └── utils/
│       ├── logger.js          # Logging system
│       └── system-monitor.js  # Performance monitoring
├── build/
│   └── installer-builder.js   # Installer creation
└── package.json
```

### Development Commands

```bash
npm run dev          # Start in development mode
npm run start        # Start production build
npm run build        # Build for production
npm run test         # Run tests
npm run lint         # Code linting
npm run clean        # Clean build artifacts
```

### Adding Features

1. **UI Components**: Add to `src/renderer/`
2. **Backend Logic**: Extend `src/validator-service.js`
3. **Configuration**: Update `src/config/validator-config.js`
4. **Services**: Add to `src/service/`
5. **Utilities**: Add to `src/utils/`

## Security

- **Sandboxed Renderer**: UI runs in a sandboxed environment
- **Secure IPC**: Communication between processes is validated
- **No Node.js in Renderer**: Direct Node.js access is disabled in UI
- **Administrator Privileges**: Service installation requires admin rights
- **Configuration Validation**: All settings are validated before use

## Troubleshooting

### Common Issues

1. **Service Won't Start**
   - Check Windows Event Viewer for errors
   - Ensure Node.js is installed system-wide
   - Verify administrator privileges

2. **Connection Issues**
   - Check firewall settings
   - Verify RPC server is running
   - Test network connectivity

3. **Performance Issues**
   - Increase cache size in settings
   - Add more validation threads
   - Check system resources

### Log Locations

- **Application Logs**: `%USERPROFILE%\.topay-validator\logs\`
- **Service Logs**: `%ALLUSERSPROFILE%\nodejs\node-windows\TOPAY Validator\daemon\`
- **Windows Event Log**: Windows Logs > Application

### Support

For technical support:

- Check the [documentation](https://docs.topay.org)
- Open an issue on [GitHub](https://github.com/topay-foundation/topay-prototype)
- Join the [Discord community](https://discord.gg/topay)

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

Please read our [Contributing Guidelines](CONTRIBUTING.md) for more details.

---

**TOPAY Foundation** - Building the future of decentralized payments
