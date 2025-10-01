#!/bin/sh

# Replace environment variables in static files
# This allows runtime configuration of the React app

# If VITE_API_URL is set, replace it in the built files
if [ ! -z "$VITE_API_URL" ]; then
    find /usr/share/nginx/html -name "*.js" -exec sed -i "s|PLACEHOLDER_API_URL|$VITE_API_URL|g" {} \;
fi

# Execute the original command
exec "$@"
