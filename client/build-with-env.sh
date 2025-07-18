#!/bin/bash
# Build script for Tauri that sets environment variables

echo "Setting environment variables for mobile build..."

export VITE_API_URL="https://server.be-out-app.dedibox2.philippezenone.net"
export VITE_MAPBOX_ACCESS_TOKEN="pk.eyJ1IjoicGhpbGlwcGV6ZW5vbmUiLCJhIjoiY21jeXQyemdpMHRwazJsc2JkdG9vZzViaCJ9.0h5JWCXgM5nY6hrDtj-vsw"
export VITE_NODE_ENV="production"

echo "VITE_API_URL: $VITE_API_URL"
echo "VITE_MAPBOX_ACCESS_TOKEN: ${VITE_MAPBOX_ACCESS_TOKEN:0:20}..."

# Run the actual build command
npm run build -- --mode production
