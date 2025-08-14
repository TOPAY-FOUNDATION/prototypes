# TOPAY Validator - Development Guide

## Quick Start

The TOPAY Validator is now fully testable in development mode using:

```bash
npm run dev
```

## Development Environment

### Prerequisites

- Node.js (v16 or higher)
- npm
- Electron

### Running in Development Mode

1. **Navigate to the validator directory:**

   ```bash
   cd "C:\Users\RealShahriya\Desktop\TOPAY FOUNDATION\Projects\topay-prototype\validator"
   ```

2. **Start the development server:**

   ```bash
   npm run dev
   ```

3. **The application will launch with:**
   - Development tools enabled
   - Hot reload capabilities
   - Debug console access
   - Mock validator service for testing

## Development Features

### Enabled in Development Mode

- **DevTools**: Automatically opens when `NODE_ENV=development`
- **Mock Services**: Fallback validator service for UI testing
- **Error Handling**: Graceful fallbacks for missing modules
- **Live Debugging**: Full access to Electron DevTools

### Application Structure

```tree
src/
├── main.js           # Main Electron process
├── preload.js        # IPC bridge
├── ui/
│   ├── index.html    # Main UI
│   ├── renderer.js   # UI logic
│   └── styles.css    # Styling
├── config/           # Configuration management
├── service/          # Service management
└── utils/            # Utilities
```

## Testing the Application

### UI Testing

The application includes a complete UI with:

- **Dashboard**: Real-time validator status
- **Validator Control**: Start/stop/restart functionality
- **Network Status**: Connection monitoring
- **Logs**: Activity logging
- **Settings**: Configuration management

### Mock Services

When actual validator services aren't available, the application uses mock services that simulate:

- Validator start/stop operations
- Status reporting
- Network connections
- Performance metrics

## Development Commands

```bash
# Start development mode
npm run dev

# Build for production
npm run build

# Build Windows installer
npm run build:win

# Run tests
npm test

# Lint code
npm run lint
```

## Known Development Notes

### ES Module Warnings

You may see warnings about ES modules. These are handled gracefully with fallback mechanisms and don't affect functionality.

### GPU Process Errors

GPU process errors are common in Electron development environments and don't impact the application's core functionality.

### Mock Data

In development mode, the validator uses mock data when actual blockchain services aren't available, allowing full UI testing.

## Debugging

### DevTools Access

- Press `F12` or `Ctrl+Shift+I` to open DevTools
- DevTools automatically open in development mode
- Use Console tab for debugging renderer process
- Use Main process debugging for backend issues

### IPC Communication

All communication between UI and main process is handled through secure IPC channels defined in `preload.js`.

## Production vs Development

| Feature | Development | Production |
|---------|-------------|------------|
| DevTools | Enabled | Disabled |
| Mock Services | Available | Disabled |
| Error Logging | Verbose | Minimal |
| Hot Reload | Enabled | N/A |
| Security | Relaxed | Strict |

## Troubleshooting

### Application Won't Start

1. Check Node.js version (`node --version`)
2. Reinstall dependencies (`npm install`)
3. Clear cache (`npm cache clean --force`)

### UI Issues

1. Open DevTools (`F12`)
2. Check Console for errors
3. Verify IPC communication

### Build Issues

1. Check build logs
2. Verify all dependencies are installed
3. Use the build solution script if needed

## Next Steps

The application is now fully functional for development and testing. You can:

1. Modify UI components in `src/ui/`
2. Add new features to `main.js`
3. Test validator functionality
4. Build production installers when ready

---

**Status**: ✅ Development environment is ready and functional
**Last Updated**: August 3, 2024
