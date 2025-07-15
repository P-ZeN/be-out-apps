#!/bin/sh

# Replace environment variables in HTML files at runtime
for file in $(find /usr/share/nginx/html -name "*.html" -o -name "*.js" -o -name "*.css"); do
    if [ -f "$file" ]; then
        # Replace placeholders with actual environment variables
        sed -i "s|%VITE_MAPBOX_ACCESS_TOKEN%|${VITE_MAPBOX_ACCESS_TOKEN:-}|g" "$file"
        sed -i "s|%VITE_API_URL%|${VITE_API_URL:-}|g" "$file"
        sed -i "s|%VITE_API_BASE_URL%|${VITE_API_BASE_URL:-}|g" "$file"
    fi
done

# Start nginx
exec nginx -g 'daemon off;'
