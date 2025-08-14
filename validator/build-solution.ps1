# TOPAY Validator Build Solution Script
param([string]$Action = "help")

Write-Host "=== TOPAY Validator Build Solution ===" -ForegroundColor Cyan

function Show-Help {
    Write-Host "Available Actions:" -ForegroundColor Yellow
    Write-Host "  help          - Show this help message"
    Write-Host "  status        - Check current build status and available installers"
    Write-Host "  use-existing  - Use existing MSI installer"
    Write-Host "  test-app      - Test the unpacked application"
    Write-Host ""
    Write-Host "Usage: .\build-solution.ps1 -Action <action>" -ForegroundColor Green
}

function Show-Status {
    Write-Host "Checking build status..." -ForegroundColor Yellow
    
    Write-Host "`n=== Available Installers ===" -ForegroundColor Green
    
    if (Test-Path "installers\TOPAY Validator 1.0.0.msi") {
        $msi = Get-Item "installers\TOPAY Validator 1.0.0.msi"
        Write-Host "MSI Installer: $($msi.Name)" -ForegroundColor Green
        Write-Host "  Size: $([math]::Round($msi.Length/1MB, 2)) MB"
        Write-Host "  Created: $($msi.CreationTime)"
        Write-Host "  Location: $($msi.FullName)"
    }
    
    if (Test-Path "installers\win-unpacked\TOPAY Validator.exe") {
        Write-Host "Portable Version: Available in installers\win-unpacked\" -ForegroundColor Green
    }
    
    Write-Host "`n=== Process Check ===" -ForegroundColor Yellow
    $electronProcesses = Get-Process | Where-Object {$_.ProcessName -like "*electron*" -or $_.ProcessName -like "*TOPAY*"}
    if ($electronProcesses) {
        Write-Host "Running Electron processes found:" -ForegroundColor Yellow
        $electronProcesses | ForEach-Object { Write-Host "  - $($_.ProcessName) (PID: $($_.Id))" }
    } else {
        Write-Host "No conflicting processes running" -ForegroundColor Green
    }
}

function Use-Existing {
    Write-Host "Using existing MSI installer..." -ForegroundColor Green
    
    if (Test-Path "installers\TOPAY Validator 1.0.0.msi") {
        $msi = Get-Item "installers\TOPAY Validator 1.0.0.msi"
        Write-Host "`n=== Ready to Use MSI Installer ===" -ForegroundColor Green
        Write-Host "File: $($msi.Name)"
        Write-Host "Size: $([math]::Round($msi.Length/1MB, 2)) MB"
        Write-Host "Location: $($msi.FullName)"
        Write-Host ""
        Write-Host "Installation Instructions:" -ForegroundColor Yellow
        Write-Host "1. Double-click the MSI file to start installation"
        Write-Host "2. Follow the installation wizard"
        Write-Host "3. The app will be installed to Program Files"
        Write-Host "4. A desktop shortcut will be created"
        Write-Host ""
        
        $response = Read-Host "Would you like to run the installer now? (y/n)"
        if ($response -eq "y" -or $response -eq "Y") {
            Start-Process -FilePath $msi.FullName
        }
    } else {
        Write-Host "MSI installer not found." -ForegroundColor Red
    }
}

function Test-App {
    Write-Host "Testing unpacked application..." -ForegroundColor Yellow
    
    $possiblePaths = @(
        "installers\win-unpacked\TOPAY Validator.exe",
        "dist\win-unpacked\TOPAY Validator.exe"
    )
    
    $foundPath = $null
    foreach ($path in $possiblePaths) {
        if (Test-Path $path) {
            $foundPath = $path
            break
        }
    }
    
    if ($foundPath) {
        Write-Host "Found unpacked application at: $foundPath" -ForegroundColor Green
        Write-Host "Starting TOPAY Validator..." -ForegroundColor Yellow
        
        try {
            Start-Process -FilePath $foundPath
            Write-Host "Application started successfully!" -ForegroundColor Green
        } catch {
            Write-Host "Failed to start application: $($_.Exception.Message)" -ForegroundColor Red
        }
    } else {
        Write-Host "Unpacked application not found in any expected location" -ForegroundColor Red
    }
}

# Main execution
switch ($Action.ToLower()) {
    "help" { Show-Help }
    "status" { Show-Status }
    "use-existing" { Use-Existing }
    "test-app" { Test-App }
    default { 
        Write-Host "Unknown action: $Action" -ForegroundColor Red
        Show-Help 
    }
}