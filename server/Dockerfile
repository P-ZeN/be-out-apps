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
echo "Checking translation files initialization..."

# Check if translations directory is empty or missing key files
if [ ! -d "translations" ] || [ ! -f "translations/fr/footer.json" ] || [ ! -f "translations/fr/dashboard.json" ]; then
    echo "Initializing translations from staging area..."
    mkdir -p translations
    cp -r translations-staging/* translations/
    echo "Translation files initialized successfully"
else
    echo "Translation files already exist, skipping initialization"
fi
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

# Change ownership of the app directory (including uploads)
RUN chown -R nodejs:nodejs /app
USER nodejs

# Expose the port
EXPOSE 3000

# Health check
# HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
#    CMD node -e "const http = require('http'); http.get('http://localhost:3000/', (res) => { process.exit(res.statusCode === 200 ? 0 : 1); }).on('error', () => { process.exit(1); });"

# Start the server with translation initialization
# TO DISABLE: Replace with CMD ["node", "src/index.js"]
CMD ["sh", "-c", "./init-translations.sh && node src/index.js"]
