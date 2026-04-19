#!/bin/bash
# Bash script to set EAS secrets from .env file
# Run this from the mobile/ directory

echo "Reading .env file and setting EAS secrets..."

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "Error: .env file not found in current directory"
    exit 1
fi

# Firebase environment variables to set
FIREBASE_VARS=(
    "FIREBASE_API_KEY"
    "FIREBASE_AUTH_DOMAIN"
    "FIREBASE_PROJECT_ID"
    "FIREBASE_STORAGE_BUCKET"
    "FIREBASE_MESSAGING_SENDER_ID"
    "FIREBASE_APP_ID"
    "FIREBASE_MEASUREMENT_ID"
)

# Read .env file line by line
while IFS= read -r line || [ -n "$line" ]; do
    # Skip empty lines and comments
    if [[ -z "$line" || "$line" =~ ^[[:space:]]*# ]]; then
        continue
    fi
    
    # Parse KEY=VALUE format
    if [[ $line =~ ^([^=]+)=(.*)$ ]]; then
        key="${BASH_REMATCH[1]%% *}"  # Remove trailing spaces
        value="${BASH_REMATCH[2]}"     # Get value
        
        # Remove quotes if present
        value="${value#\"}"
        value="${value%\"}"
        value="${value#\'}"
        value="${value%\'}"
        
        # Check if this is a Firebase variable
        if [[ " ${FIREBASE_VARS[@]} " =~ " ${key} " ]]; then
            echo "Setting secret: $key"
            
            # Check if secret already exists and delete it
            if npx eas secret:list 2>/dev/null | grep -q "$key"; then
                echo "  Secret $key already exists. Deleting old one..."
                npx eas secret:delete --name "$key" --non-interactive 2>/dev/null
            fi
            
            # Create the secret
            if npx eas secret:create --scope project --name "$key" --value "$value" --non-interactive; then
                echo "  ✓ Successfully set $key"
            else
                echo "  ✗ Failed to set $key"
            fi
        fi
    fi
done < .env

echo ""
echo "Done! Verifying secrets..."
npx eas secret:list

echo ""
echo "Next step: Run 'npm run build:android' to rebuild your app"

