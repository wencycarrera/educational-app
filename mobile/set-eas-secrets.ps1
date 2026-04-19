# PowerShell script to set EAS secrets from .env file
# Run this from the mobile/ directory

Write-Host "Reading .env file and setting EAS secrets..." -ForegroundColor Cyan

# Read .env file
$envPath = Join-Path $PSScriptRoot ".env"

if (-not (Test-Path $envPath)) {
    Write-Host "Error: .env file not found at $envPath" -ForegroundColor Red
    exit 1
}

$envContent = Get-Content $envPath

# Firebase environment variables to set
$firebaseVars = @(
    "FIREBASE_API_KEY",
    "FIREBASE_AUTH_DOMAIN",
    "FIREBASE_PROJECT_ID",
    "FIREBASE_STORAGE_BUCKET",
    "FIREBASE_MESSAGING_SENDER_ID",
    "FIREBASE_APP_ID",
    "FIREBASE_MEASUREMENT_ID"
)

foreach ($line in $envContent) {
    # Skip empty lines and comments
    if ([string]::IsNullOrWhiteSpace($line) -or $line.Trim().StartsWith("#")) {
        continue
    }
    
    # Parse KEY=VALUE format
    if ($line -match "^([^=]+)=(.*)$") {
        $key = $matches[1].Trim()
        $value = $matches[2].Trim()
        
        # Remove quotes if present
        $value = $value -replace '^["'']|["'']$', ''
        
        # Only set Firebase-related variables
        if ($firebaseVars -contains $key) {
            Write-Host "Setting secret: $key" -ForegroundColor Yellow
            
            # Check if secret already exists
            $existing = npx eas secret:list 2>&1 | Select-String -Pattern $key
            
            if ($existing) {
                Write-Host "  Secret $key already exists. Deleting old one..." -ForegroundColor Gray
                npx eas secret:delete --name $key --non-interactive 2>&1 | Out-Null
            }
            
            # Create the secret
            $result = npx eas secret:create --scope project --name $key --value $value --non-interactive 2>&1
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host "  ✓ Successfully set $key" -ForegroundColor Green
            } else {
                Write-Host "  ✗ Failed to set $key" -ForegroundColor Red
                Write-Host "  Error: $result" -ForegroundColor Red
            }
        }
    }
}

Write-Host "`nDone! Verifying secrets..." -ForegroundColor Cyan
npx eas secret:list

Write-Host "`nNext step: Run 'npm run build:android' to rebuild your app" -ForegroundColor Green

