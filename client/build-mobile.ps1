# Mobile Build Script with Environment Variables
param(
    [string]$Platform = "android",
    [string]$Mode = "debug"
)

Write-Host "Building mobile app for $Platform in $Mode mode..." -ForegroundColor Cyan

# Set production environment variables explicitly
$env:VITE_API_URL = "https://server.be-out-app.dedibox2.philippezenone.net"
$env:VITE_MAPBOX_ACCESS_TOKEN = "pk.eyJ1IjoicGhpbGlwcGV6ZW5vbmUiLCJhIjoiY21jeXQyemdpMHRwazJsc2JkdG9vZzViaCJ9.0h5JWCXgM5nY6hrDtj-vsw"
$env:VITE_NODE_ENV = "production"

Write-Host "Environment variables set:" -ForegroundColor Yellow
Write-Host "  VITE_API_URL = $env:VITE_API_URL" -ForegroundColor Green
Write-Host "  VITE_MAPBOX_ACCESS_TOKEN = $($env:VITE_MAPBOX_ACCESS_TOKEN.Substring(0, 20))..." -ForegroundColor Green
Write-Host "  VITE_NODE_ENV = $env:VITE_NODE_ENV" -ForegroundColor Green

# Load additional environment variables from .env files if they exist
$envFiles = @(".env", ".env.local", ".env.production")

foreach ($envFile in $envFiles) {
    if (Test-Path $envFile) {
        Write-Host "Loading additional environment from $envFile..." -ForegroundColor Yellow
        Get-Content $envFile | ForEach-Object {
            if ($_ -match "^([^#][^=]+)=(.*)$") {
                $name = $matches[1].Trim()
                $value = $matches[2].Trim()
                # Remove quotes if present
                $value = $value -replace '^"(.*)"$', '$1'
                $value = $value -replace "^'(.*)'$", '$1'

                # Only set VITE_ prefixed variables that aren't already set
                if ($name.StartsWith("VITE_") -and !(Get-Item "env:$name" -ErrorAction SilentlyContinue)) {
                    [Environment]::SetEnvironmentVariable($name, $value, "Process")
                    Write-Host "  Additional: $name = $value" -ForegroundColor Cyan
                }
            }
        }
    }
}

# Build the mobile app directly with Tauri
Write-Host "Building $Platform app with Tauri..." -ForegroundColor Cyan

if ($Platform -eq "android") {
    if ($Mode -eq "release") {
        $env:ANDROID_KEYSTORE_PASSWORD = "zenkeypass2025"
        $env:ANDROID_KEY_PASSWORD = "zenkeypass2025"
        $env:ANDROID_KEY_ALIAS = "be-out-key"
        tauri android build --release
    }
    else {
        tauri android build
    }
}
elseif ($Platform -eq "ios") {
    if ($Mode -eq "release") {
        tauri ios build --release
    }
    else {
        tauri ios build
    }
}
else {
    Write-Host "Unknown platform: $Platform" -ForegroundColor Red
    exit 1
}

if ($LASTEXITCODE -eq 0) {
    Write-Host "Mobile build completed successfully!" -ForegroundColor Green
}
else {
    Write-Host "Mobile build failed!" -ForegroundColor Red
    exit 1
}
