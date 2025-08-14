# TOPAY Validator Windows Installer Build Script
# This script automates the creation of the Windows installer

param(
    [string]$Configuration = "Release",
    [switch]$Clean = $false,
    [switch]$Verbose = $false
)

# Set error action preference
$ErrorActionPreference = "Stop"

# Script variables
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectDir = Split-Path -Parent $ScriptDir
$DistDir = Join-Path $ProjectDir "dist"

Write-Host "TOPAY Validator Installer Build Script" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host ""

# Function to check if Node.js is installed
function Test-NodeJS {
    try {
        $nodeVersion = node --version
        Write-Host "✓ Node.js detected: $nodeVersion" -ForegroundColor Green
        return $true
    }
    catch {
        Write-Host "✗ Node.js not found. Please install Node.js first." -ForegroundColor Red
        return $false
    }
}

# Function to check if npm dependencies are installed
function Test-Dependencies {
    $packageJsonPath = Join-Path $ProjectDir "package.json"
    $nodeModulesPath = Join-Path $ProjectDir "node_modules"
    
    # Verify package.json exists
    if (-not (Test-Path $packageJsonPath)) {
        throw "package.json not found at: $packageJsonPath"
    }
    
    if (-not (Test-Path $nodeModulesPath)) {
        Write-Host "✗ Dependencies not installed. Running npm install..." -ForegroundColor Yellow
        Set-Location $ProjectDir
        npm install
        if ($LASTEXITCODE -ne 0) {
            throw "Failed to install dependencies"
        }
        Write-Host "✓ Dependencies installed successfully" -ForegroundColor Green
    } else {
        Write-Host "✓ Dependencies already installed" -ForegroundColor Green
    }
}


# Function to clean previous builds
function Clear-PreviousBuilds {
    if ($Clean -and (Test-Path $DistDir)) {
        Write-Host "🧹 Cleaning previous builds..." -ForegroundColor Yellow
        Remove-Item $DistDir -Recurse -Force
        Write-Host "✓ Previous builds cleaned" -ForegroundColor Green
    }
}

# Function to build the installer
function Build-Installer {
    Write-Host "🔨 Building Windows installer..." -ForegroundColor Yellow
    
    Set-Location $ProjectDir
    
    # Build for Windows
    if ($Verbose) {
        npm run build:win -- --publish=never
    } else {
        npm run build:win -- --publish=never 2>$null
    }
    
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to build Windows installer"
    }
    
    Write-Host "✓ Windows installer built successfully" -ForegroundColor Green
}

# Function to display build results
function Show-BuildResults {
    Write-Host ""
    Write-Host "Build Results:" -ForegroundColor Cyan
    Write-Host "==============" -ForegroundColor Cyan
    
    if (Test-Path $DistDir) {
        $installerFiles = Get-ChildItem $DistDir -Filter "*.exe" | Sort-Object Name
        
        if ($installerFiles.Count -gt 0) {
            Write-Host "✓ Installer files created:" -ForegroundColor Green
            foreach ($file in $installerFiles) {
                $sizeKB = [math]::Round($file.Length / 1KB, 2)
                Write-Host "  📦 $($file.Name) ($sizeKB KB)" -ForegroundColor White
            }
            
            Write-Host ""
            Write-Host "Installer location: $DistDir" -ForegroundColor Cyan
            Write-Host ""
            Write-Host "To test the installer:" -ForegroundColor Yellow
            Write-Host "1. Right-click on the .exe file and 'Run as administrator'" -ForegroundColor White
            Write-Host "2. Follow the installation wizard" -ForegroundColor White
            Write-Host "3. The application will be installed to Program Files" -ForegroundColor White
            Write-Host ""
        } else {
            Write-Host "✗ No installer files found in dist directory" -ForegroundColor Red
        }
    } else {
        Write-Host "✗ Dist directory not found" -ForegroundColor Red
    }
}

# Main execution
try {
    Write-Host "Starting build process..." -ForegroundColor Yellow
    Write-Host ""
    
    # Pre-build checks
    if (-not (Test-NodeJS)) {
        exit 1
    }
    
    Test-Dependencies
    Clear-PreviousBuilds
    
    # Build process
    Build-Installer
    Show-BuildResults
    
    Write-Host ""
    Write-Host "🎉 Build completed successfully!" -ForegroundColor Green
    Write-Host ""
    
} catch {
    Write-Host ""
    Write-Host "❌ Build failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    exit 1
}

# Return to original directory
Set-Location $ScriptDir