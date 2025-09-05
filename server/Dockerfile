# Backend API Server Dockerfile
FROM node:20-alpine
WORKDIR /app

# Copy package files
COPY package*.json ./

# Set production environment variables
ENV NODE_ENV=production
ENV CI=true
ENV NO_UPDATE_NOTIFIER=true
ENV npm_config_fund=false
ENV npm_config_audit=false

# Install dependencies
RUN npm install

# Copy source code
COPY src ./src
COPY . .

# Copy updated translation files from project root to a staging area
COPY ../translations ./translations-staging

# Create initialization script for translations
# COMMENT OUT the next block when no translation updates are needed
RUN cat > init-translations.sh << 'EOF'
#!/bin/sh
echo "=== Translation Initialization Script ==="
echo "Current user: $(whoami)"
echo "Current directory: $(pwd)"
echo "Checking translation files initialization..."

# Show staging area contents
echo "Staging area contents:"
ls -la translations-staging/ || echo "No staging area found"

# Check if translations directory exists and its permissions
if [ -d "translations" ]; then
    echo "Translations directory exists:"
    ls -la translations/
    echo "Checking for key files..."
    ls -la translations/fr/ 2>/dev/null || echo "No fr directory"
else
    echo "Translations directory does not exist"
fi

# Initialize if needed
if [ ! -d "translations" ] || [ ! -f "translations/fr/footer.json" ] || [ ! -f "translations/fr/dashboard.json" ] || [ ! -f "translations/fr/venues.json" ]; then
    echo "Initializing translations from staging area..."
    mkdir -p translations

    # Ensure we have proper permissions
    chmod 755 translations

    # Copy with verbose output
    cp -rv translations-staging/* translations/

    # Set proper permissions
    chmod -R 644 translations/*.json 2>/dev/null || true
    chmod -R 755 translations/*/ 2>/dev/null || true

    echo "Translation files initialized successfully"
    echo "Final translations directory:"
    ls -la translations/
else
    echo "Translation files already exist, skipping initialization"
    echo "Existing translations:"
    ls -la translations/
fi
echo "=== End Translation Initialization ==="
EOF

RUN chmod +x init-translations.sh

# Create uploads directory
RUN mkdir -p uploads/public/avatars uploads/public/events uploads/public/thumbnails uploads/private/documents uploads/private/temp

# Create a non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Increase file descriptor limits
RUN mkdir -p /etc/security
RUN echo 'fs.file-max = 65536' >> /etc/sysctl.conf
RUN echo '* soft nofile 65536' >> /etc/security/limits.conf
RUN echo '* hard nofile 65536' >> /etc/security/limits.conf

# Change ownership of the app directory (including uploads and translations)
RUN chown -R nodejs:nodejs /app
RUN chown -R nodejs:nodejs /app/translations-staging
RUN chown -R nodejs:nodejs /app/init-translations.sh
USER nodejs

# Expose the port
EXPOSE 3000

# Health check
# HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
#    CMD node -e "const http = require('http'); http.get('http://localhost:3000/', (res) => { process.exit(res.statusCode === 200 ? 0 : 1); }).on('error', () => { process.exit(1); });"

# Start the server with translation initialization
# TO DISABLE: Replace with CMD ["node", "src/index.js"]
CMD ["sh", "-c", "./init-translations.sh && node src/index.js"]
# CMD ["node", "src/index.js"]
