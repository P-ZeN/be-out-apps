FROM node:18-alpine AS builder

WORKDIR /app

# Copy root package.json and package-lock.json for workspace
COPY package*.json ./
COPY showroom/package*.json ./showroom/

# Install dependencies using workspace
RUN npm ci --workspace=showroom --include-workspace-root

# Copy source code
COPY showroom ./showroom

# Build the app
RUN npm run build --workspace=showroom

# Production stage
FROM nginx:alpine

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built app from builder stage
COPY --from=builder /app/showroom/build /usr/share/nginx/html

# Copy docker entrypoint script
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Expose port 80
EXPOSE 80

# Use custom entrypoint
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
