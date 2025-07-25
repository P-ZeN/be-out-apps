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

# Create uploads directory
RUN mkdir -p uploads/public/avatars uploads/public/events uploads/public/thumbnails uploads/private/documents uploads/private/temp

# Create translations directory
RUN mkdir -p translations

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

# Start the server
CMD ["node", "src/index.js"]
