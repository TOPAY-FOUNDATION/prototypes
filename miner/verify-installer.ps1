# TOPAY Validator Installer Verification Script
# This script verifies the built installer files and provides information

Write-Host "TOPAY Validator Installer Verification" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host ""

$distPath = ".\dist"

if (-not (Test-Path $distPath)) {
    Write-Host "Error: dist directory not found!" -ForegroundColor Red
    Write-Host "Please run 'npm run build:win' first." -ForegroundColor Yellow
    exit 1
}

Write-Host "Checking installer files..." -ForegroundColor Green
Write-Host ""

# Check for NSIS installer
$nsisInstaller = Get-ChildItem "$distPath\*Setup*.exe" -ErrorAction SilentlyContinue
if ($nsisInstaller) {
    Write-Host "NSIS Wizard Installer Found:" -ForegroundColor Green
    foreach ($file in $nsisInstaller) {
        $size = [math]::Round($file.Length / 1MB, 2)
        Write-Host "  Name: $($file.Name)" -ForegroundColor White
        Write-Host "  Size: $size MB" -ForegroundColor Gray
        Write-Host "  Created: $($file.CreationTime)" -ForegroundColor Gray
        Write-Host ""
    }
} else {
    Write-Host "NSIS installer not found!" -ForegroundColor Red
}

# Check for portable version
$portableApp = Get-ChildItem "$distPath\TOPAY Validator *.exe" -ErrorAction SilentlyContinue | Where-Object { $_.Name -notlike "*Setup*" }
if ($portableApp) {
    Write-Host "Portable Version Found:" -ForegroundColor Green
    foreach ($file in $portableApp) {
        $size = [math]::Round($file.Length / 1MB, 2)
        Write-Host "  Name: $($file.Name)" -ForegroundColor White
        Write-Host "  Size: $size MB" -ForegroundColor Gray
        Write-Host "  Created: $($file.CreationTime)" -ForegroundColor Gray
        Write-Host ""
    }
} else {
    Write-Host "Portable version not found!" -ForegroundColor Red
}

# Check for unpacked directory
$unpackedDir = "$distPath\win-unpacked"
if (Test-Path $unpackedDir) {
    Write-Host "Unpacked Application Found:" -ForegroundColor Green
    $mainExe = Get-ChildItem "$unpackedDir\TOPAY Validator.exe" -ErrorAction SilentlyContinue
    if ($mainExe) {
        $size = [math]::Round($mainExe.Length / 1MB, 2)
        Write-Host "  Name: $($mainExe.Name)" -ForegroundColor White
        Write-Host "  Size: $size MB" -ForegroundColor Gray
        Write-Host "  Created: $($mainExe.CreationTime)" -ForegroundColor Gray
    }
    
    $folderSize = (Get-ChildItem $unpackedDir -Recurse | Measure-Object -Property Length -Sum).Sum
    $folderSizeMB = [math]::Round($folderSize / 1MB, 2)
    Write-Host "  Total unpacked size: $folderSizeMB MB" -ForegroundColor Gray
    Write-Host ""
} else {
    Write-Host "Unpacked directory not found!" -ForegroundColor Red
}

# Summary
Write-Host "Summary:" -ForegroundColor Cyan
Write-Host "========" -ForegroundColor Cyan

$allFiles = Get-ChildItem $distPath -File -Recurse
$totalSize = ($allFiles | Measure-Object -Property Length -Sum).Sum
$totalSizeMB = [math]::Round($totalSize / 1MB, 2)

Write-Host "  Total files: $($allFiles.Count)" -ForegroundColor White
Write-Host "  Total size: $totalSizeMB MB" -ForegroundColor White
Write-Host ""

# Installation instructions
Write-Host "Ready to Install!" -ForegroundColor Green
Write-Host "=================" -ForegroundColor Green
Write-Host ""
Write-Host "For end users:" -ForegroundColor Yellow
Write-Host "1. Use the NSIS installer for full installation experience" -ForegroundColor White
Write-Host "2. Use the portable version for no-install usage" -ForegroundColor White
Write-Host ""
Write-Host "For testing:" -ForegroundColor Yellow
Write-Host "1. Right-click installer and select 'Run as administrator'" -ForegroundColor White
Write-Host "2. Follow the installation wizard" -ForegroundColor White
Write-Host "3. Test uninstallation from Control Panel" -ForegroundColor White
Write-Host ""

Write-Host "Verification complete!" -ForegroundColor Green