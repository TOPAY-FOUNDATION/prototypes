# TOPAY Validator Windows Installer & Uninstaller

This document provides complete instructions for building, distributing, and using the Windows installer for the TOPAY Validator application.

## 🎉 Successfully Created Installers

The build process has successfully created the following installer files in the `dist` directory:

### 📦 Available Installers

1. **`TOPAY Validator-Setup-1.0.0.exe`** - **NSIS Wizard Installer (Recommended)**
   - Full wizard-based installation experience
   - License agreement page
   - Custom installation directory selection
   - Component selection (shortcuts, etc.)
   - Automatic uninstaller creation
   - Size: ~264 MB

2. **`TOPAY Validator 1.0.0.exe`** - **Portable Version**
   - No installation required
   - Run directly from any location
   - No registry entries or system integration
   - Perfect for testing or temporary use

## 🚀 Quick Start for End Users

### Installing TOPAY Validator

#### Method 1: Wizard Installer (Recommended)

1. **Download** `TOPAY Validator-Setup-1.0.0.exe`
2. **Right-click** the installer and select **"Run as administrator"**
3. **Follow the installation wizard**:
   - Welcome screen → Click "Next"
   - License agreement → Click "I Agree"
   - Choose installation directory (default: `C:\Program Files\TOPAY Validator`)
   - Select components (Desktop shortcut, Start Menu entry)
   - Click "Install" to begin installation
   - Choose whether to launch the application immediately

#### Method 2: Portable Version

1. **Download** `TOPAY Validator 1.0.0.exe`
2. **Create a folder** (e.g., `C:\TOPAY-Validator`)
3. **Move the executable** to the folder
4. **Double-click** to run (no installation needed)

### Installation Locations

- **Program Files**: `C:\Program Files\TOPAY Validator\`
- **User Data**: `%APPDATA%\TOPAY Validator\`
- **Desktop Shortcut**: `%USERPROFILE%\Desktop\TOPAY Validator.lnk`
- **Start Menu**: `Start Menu\Programs\TOPAY Foundation\TOPAY Validator`

## 🗑️ Uninstalling TOPAY Validator

### Method 1: Windows Settings (Windows 10/11)

1. Open **Settings** (Windows + I)
2. Go to **Apps** → **Apps & features**
3. Search for **"TOPAY Validator"**
4. Click **Uninstall** → **Uninstall**

### Method 2: Control Panel (All Windows versions)

1. Open **Control Panel** → **Programs and Features**
2. Find **"TOPAY Validator"** in the list
3. Click **Uninstall**
4. Follow the uninstallation wizard

### Method 3: Start Menu

1. Open **Start Menu**
2. Find **TOPAY Foundation** → **TOPAY Validator**
3. Right-click and select **Uninstall**

### Uninstallation Features

- ✅ **Complete removal** of all program files
- ✅ **Registry cleanup** (removes all entries)
- ✅ **Shortcut removal** (Desktop and Start Menu)
- ✅ **Optional user data removal** (settings and configurations)
- ✅ **Clean uninstall** leaves no traces

## 🛠️ Building the Installer (For Developers)

### Prerequisites

- **Node.js** 16.0.0 or higher
- **npm** (included with Node.js)
- **Windows 10/11** (for building and testing)

### Build Commands

#### Option 1: Using npm scripts

```cmd
# Install dependencies
npm install

# Build Windows installer
npm run build:win

# Build all platforms
npm run build
```

#### Option 2: Using PowerShell script

```powershell
# Basic build
.\build-installer.ps1

# Verbose output
.\build-installer.ps1 -Verbose

# Clean previous builds
.\build-installer.ps1 -Clean
```

#### Option 3: Using batch file

```cmd
# Simple batch build
build-installer.bat
```

### Build Output

After successful build, you'll find these files in the `dist` directory:

- `TOPAY Validator-Setup-1.0.0.exe` - NSIS installer
- `TOPAY Validator 1.0.0.exe` - Portable version
- `win-unpacked/` - Unpacked application files

## ⚙️ Installer Features

### NSIS Wizard Installer Features

- 🎨 **Professional wizard interface**
- 📄 **License agreement display**
- 📁 **Custom installation directory**
- ✅ **Component selection**
- 🔗 **Desktop and Start Menu shortcuts**
- 🔄 **Automatic updates support**
- 🗑️ **Complete uninstaller**
- 🔐 **Administrator privileges handling**
- 📊 **Installation progress tracking**

### Security Features

- ✅ **Administrator elevation when needed**
- ✅ **Digital signature ready** (add certificate for production)
- ✅ **Antivirus compatibility**
- ✅ **Windows Defender SmartScreen compatible**

## 🔧 Configuration

### Customizing the Installer

Edit the `package.json` file in the `build.nsis` section:

```json
{
  "nsis": {
    "oneClick": false,
    "allowToChangeInstallationDirectory": true,
    "createDesktopShortcut": true,
    "createStartMenuShortcut": true,
    "shortcutName": "TOPAY Validator",
    "menuCategory": "TOPAY Foundation",
    "runAfterFinish": true,
    "deleteAppDataOnUninstall": true
  }
}
```

### Available Options

- `oneClick`: false = wizard mode, true = one-click install
- `allowToChangeInstallationDirectory`: Allow custom install path
- `createDesktopShortcut`: Create desktop shortcut
- `createStartMenuShortcut`: Create Start Menu entry
- `runAfterFinish`: Launch app after installation
- `deleteAppDataOnUninstall`: Remove user data on uninstall

## 🐛 Troubleshooting

### Common Installation Issues

#### "Windows protected your PC" message

**Cause**: Unsigned executable
**Solutions**:

1. Click "More info" → "Run anyway"
2. For production: Code sign the installer
3. Add to Windows Defender exclusions

#### "Administrator rights required"

**Cause**: Installation to Program Files requires elevation
**Solution**: Right-click installer → "Run as administrator"

#### Installation fails or hangs

**Solutions**:

1. Close any running TOPAY Validator instances
2. Temporarily disable antivirus
3. Run installer as administrator
4. Check available disk space (requires ~300MB)

### Common Build Issues

#### "Node.js not found"

**Solution**: Install Node.js from [nodejs.org](https://nodejs.org/)

#### "electron-builder not found"

**Solution**: Run `npm install` to install dependencies

#### Build fails with permission errors

**Solution**: Run build command as administrator

#### "Cannot find module" errors

**Solutions**:

1. Delete `node_modules` folder
2. Run `npm install` again
3. Clear npm cache: `npm cache clean --force`

## 📋 Testing Checklist

### Pre-release Testing

- [ ] **Build installer** successfully
- [ ] **Install on clean Windows machine**
- [ ] **Verify all shortcuts** work correctly
- [ ] **Test application launch** from shortcuts
- [ ] **Check Start Menu integration**
- [ ] **Test uninstallation** process
- [ ] **Verify complete removal** of files
- [ ] **Test portable version**

### Compatibility Testing

- [ ] **Windows 10** (multiple versions)
- [ ] **Windows 11**
- [ ] **Different user accounts** (admin/standard)
- [ ] **Various antivirus software**
- [ ] **Different installation paths**

## 🔒 Security & Distribution

### Code Signing (Production)

For production releases:

1. **Obtain code signing certificate** from trusted CA
2. **Configure electron-builder** with certificate
3. **Sign both installer and executable**
4. **Test signed installer** on clean machines

### Distribution Best Practices

- ✅ **Host on secure HTTPS servers**
- ✅ **Provide checksums** for verification
- ✅ **Use official download channels**
- ✅ **Include version information**
- ✅ **Maintain download logs**

## 📞 Support & Resources

### Getting Help

- **Documentation**: This README file
- **Issues**: Report on project repository
- **Community**: TOPAY Foundation forums
- **Email**: <support@topay.foundation>

### Useful Links

- [Electron Builder Documentation](https://www.electron.build/)
- [NSIS Documentation](https://nsis.sourceforge.io/Docs/)
- [Windows Installer Best Practices](https://docs.microsoft.com/en-us/windows/win32/msi/installation-package-authoring)

## 📄 License

This installer and the TOPAY Validator application are distributed under the MIT License. See `LICENSE.txt` for complete terms.

---

**TOPAY Foundation** - Quantum-Safe Blockchain Technology
🌐 <https://topay.foundation> | 📧 <support@topay.foundation>
