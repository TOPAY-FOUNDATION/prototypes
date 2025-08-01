# TOPAY Validator - Installation Guide

## Available Installers

The TOPAY Validator now includes proper Windows installers with full install/uninstall functionality:

### 📦 Installation Options

1. **NSIS Installer (Recommended)**
   - File: `TOPAY Validator Setup 1.0.0.exe`
   - Features: Full installer with uninstaller
   - Creates desktop and start menu shortcuts
   - Allows custom installation directory
   - Automatic uninstaller creation

2. **MSI Installer (Enterprise)**
   - File: `TOPAY Validator 1.0.0.msi`
   - Features: Windows Installer package
   - Group Policy deployment support
   - Enterprise-friendly installation
   - Automatic uninstaller registration

### 🚀 Installation Process

#### Using NSIS Installer (.exe)

1. Double-click `TOPAY Validator Setup 1.0.0.exe`
2. Follow the installation wizard
3. Choose installation directory (optional)
4. Select shortcuts creation options
5. Complete installation

#### Using MSI Installer (.msi)

1. Double-click `TOPAY Validator 1.0.0.msi`
2. Follow the Windows Installer wizard
3. Complete installation

### 🗑️ Uninstallation

#### Method 1: Windows Settings

1. Open Windows Settings (Win + I)
2. Go to Apps & Features
3. Search for "TOPAY Validator"
4. Click "Uninstall"

#### Method 2: Control Panel

1. Open Control Panel
2. Go to Programs and Features
3. Find "TOPAY Validator"
4. Click "Uninstall"

#### Method 3: Start Menu

1. Open Start Menu
2. Find "TOPAY Validator" folder
3. Click "Uninstall TOPAY Validator"

### 📁 Installation Locations

**Default Installation Paths:**

- NSIS: `C:\Program Files\TOPAY\Validator\`
- MSI: `C:\Program Files\TOPAY Validator\`

**Shortcuts Created:**

- Desktop: "TOPAY Validator"
- Start Menu: "TOPAY Foundation" → "TOPAY Validator"

### 🔧 Post-Installation

After installation, you can:

1. Launch from desktop shortcut
2. Launch from Start Menu
3. Run as Windows Service (see service installation guide)

### 🛠️ Building Installers (For Developers)

To rebuild the installers:

```bash
# Build both NSIS and MSI installers
npm run build:installer

# Build only NSIS installer
npm run build:exe

# Build only MSI installer
npm run build:msi
```

### 📋 System Requirements

- Windows 10 or later (64-bit)
- Administrator privileges for installation
- 500MB free disk space
- Internet connection for blockchain sync

### 🆘 Troubleshooting

**Installation Issues:**

- Run installer as Administrator
- Disable antivirus temporarily during installation
- Ensure sufficient disk space

**Uninstallation Issues:**

- Use Windows built-in uninstaller
- Check Programs and Features in Control Panel
- Contact support if issues persist

---

**Note:** The previous portable build has been replaced with proper installers that include full uninstall functionality.
