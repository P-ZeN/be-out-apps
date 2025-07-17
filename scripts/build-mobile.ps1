#!/usr/bin/env pwsh

# Mobile Build Test Script for BeOut App
# This script helps test mobile builds locally

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("android", "ios", "both")]
    [string]$Platform = "android",
    
    [Parameter(Mandatory=$false)]
    [switch]$Clean,
    
    [Parameter(Mandatory=$false)]
    [switch]$Release,
    
    [Parameter(Mandatory=$false)]
    [switch]$Device
)

Write-Host "🚀 BeOut Mobile Build Test Script" -ForegroundColor Cyan
Write-Host "Platform: $Platform" -ForegroundColor Yellow

# Function to check if command exists
function Test-Command {
    param($Command)
    $null = Get-Command $Command -ErrorAction SilentlyContinue
    return $?
}

# Function to check environment variables
function Test-AndroidEnvironment {
    Write-Host "🔍 Checking Android environment..." -ForegroundColor Blue
    
    if (-not $env:ANDROID_HOME) {
        Write-Host "❌ ANDROID_HOME not set" -ForegroundColor Red
        return $false
    }
    
    if (-not $env:NDK_HOME -and -not $env:ANDROID_NDK_ROOT) {
        Write-Host "⚠️ NDK_HOME not set" -ForegroundColor Yellow
    }
    
    if (-not (Test-Path "$env:ANDROID_HOME\platform-tools\adb.exe")) {
        Write-Host "❌ ADB not found in ANDROID_HOME" -ForegroundColor Red
        return $false
    }
    
    Write-Host "✅ Android environment OK" -ForegroundColor Green
    return $true
}

# Function to check iOS environment (macOS only)
function Test-IOSEnvironment {
    if ($env:OS -ne "Windows_NT") {
        Write-Host "🔍 Checking iOS environment..." -ForegroundColor Blue
        
        if (-not (Test-Command "xcodebuild")) {
            Write-Host "❌ Xcode not installed" -ForegroundColor Red
            return $false
        }
        
        Write-Host "✅ iOS environment OK" -ForegroundColor Green
        return $true
    } else {
        Write-Host "❌ iOS development requires macOS" -ForegroundColor Red
        return $false
    }
}

# Function to build client
function Build-Client {
    Write-Host "🏗️ Building client app..." -ForegroundColor Blue
    
    try {
        if ($Clean) {
            Write-Host "🧹 Cleaning client build..." -ForegroundColor Yellow
            Remove-Item -Path "client\dist" -Recurse -Force -ErrorAction SilentlyContinue
        }
        
        npm run build:client
        
        if ($LASTEXITCODE -ne 0) {
            throw "Client build failed"
        }
        
        Write-Host "✅ Client build completed" -ForegroundColor Green
        return $true
    }
    catch {
        Write-Host "❌ Client build failed: $_" -ForegroundColor Red
        return $false
    }
}

# Function to build Android
function Build-Android {
    Write-Host "🤖 Building Android app..." -ForegroundColor Blue
    
    try {
        # Check if Android is initialized
        if (-not (Test-Path "src-tauri\gen\android")) {
            Write-Host "📱 Initializing Android..." -ForegroundColor Yellow
            tauri android init
            
            if ($LASTEXITCODE -ne 0) {
                throw "Android initialization failed"
            }
        }
        
        # Build command
        $buildCmd = "tauri android build"
        if (-not $Release) {
            $buildCmd = "tauri android dev"
            if ($Device) {
                $buildCmd += " --device"
            }
        }
        
        Write-Host "🔨 Running: $buildCmd" -ForegroundColor Yellow
        Invoke-Expression $buildCmd
        
        if ($LASTEXITCODE -ne 0) {
            throw "Android build failed"
        }
        
        Write-Host "✅ Android build completed" -ForegroundColor Green
        
        # Show output location
        if ($Release) {
            $apkPath = "src-tauri\gen\android\app\build\outputs\apk"
            if (Test-Path $apkPath) {
                Write-Host "📦 APK location: $apkPath" -ForegroundColor Cyan
                Get-ChildItem -Path $apkPath -Recurse -Filter "*.apk" | ForEach-Object {
                    Write-Host "   📱 $($_.FullName)" -ForegroundColor White
                }
            }
        }
        
        return $true
    }
    catch {
        Write-Host "❌ Android build failed: $_" -ForegroundColor Red
        return $false
    }
}

# Function to build iOS
function Build-IOS {
    Write-Host "🍎 Building iOS app..." -ForegroundColor Blue
    
    if ($env:OS -eq "Windows_NT") {
        Write-Host "❌ iOS builds require macOS" -ForegroundColor Red
        return $false
    }
    
    try {
        # iOS build logic would go here
        # Currently placeholder as iOS support is still developing in Tauri 2.x
        Write-Host "⚠️ iOS support in Tauri 2.x is still in development" -ForegroundColor Yellow
        Write-Host "   Check https://tauri.app for updates" -ForegroundColor White
        return $true
    }
    catch {
        Write-Host "❌ iOS build failed: $_" -ForegroundColor Red
        return $false
    }
}

# Function to list connected devices
function Show-Devices {
    Write-Host "📱 Connected devices:" -ForegroundColor Blue
    
    if (Test-Command "adb") {
        Write-Host "Android devices:" -ForegroundColor Yellow
        adb devices
    }
    
    if (Test-Command "xcrun" -and $env:OS -ne "Windows_NT") {
        Write-Host "iOS simulators:" -ForegroundColor Yellow
        xcrun simctl list devices
    }
}

# Main execution
try {
    # Check prerequisites
    Write-Host "🔍 Checking prerequisites..." -ForegroundColor Blue
    
    if (-not (Test-Command "npm")) {
        throw "npm not found. Please install Node.js"
    }
    
    if (-not (Test-Command "tauri")) {
        throw "Tauri CLI not found. Run: npm install -g @tauri-apps/cli@latest"
    }
    
    if (-not (Test-Command "rustc")) {
        throw "Rust not found. Please install Rust from https://rustup.rs/"
    }
    
    # Show devices if requested
    if ($Device) {
        Show-Devices
    }
    
    # Build client first
    if (-not (Build-Client)) {
        exit 1
    }
    
    # Build mobile platforms
    $success = $true
    
    switch ($Platform) {
        "android" {
            if (-not (Test-AndroidEnvironment)) {
                Write-Host "❌ Android environment check failed" -ForegroundColor Red
                exit 1
            }
            $success = Build-Android
        }
        "ios" {
            if (-not (Test-IOSEnvironment)) {
                Write-Host "❌ iOS environment check failed" -ForegroundColor Red
                exit 1
            }
            $success = Build-IOS
        }
        "both" {
            $androidOk = $true
            $iosOk = $true
            
            if (Test-AndroidEnvironment) {
                $androidOk = Build-Android
            } else {
                Write-Host "⚠️ Skipping Android build due to environment issues" -ForegroundColor Yellow
                $androidOk = $false
            }
            
            if (Test-IOSEnvironment) {
                $iosOk = Build-IOS
            } else {
                Write-Host "⚠️ Skipping iOS build due to environment issues" -ForegroundColor Yellow
                $iosOk = $false
            }
            
            $success = $androidOk -or $iosOk
        }
    }
    
    if ($success) {
        Write-Host "🎉 Build completed successfully!" -ForegroundColor Green
        exit 0
    } else {
        Write-Host "❌ Build failed" -ForegroundColor Red
        exit 1
    }
}
catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
    exit 1
}
