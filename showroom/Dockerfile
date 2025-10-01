# Build stage
FROM node:20-alpine AS builder
WORKDIR /app

# Copy package.json from showroom specifically
COPY package*.json ./
RUN npm install

# Copy source files (exclude node_modules and other apps)
COPY src ./src
COPY public ./public
COPY index.html ./
COPY vite.config.js ./
COPY nginx.conf ./
COPY docker-entrypoint.sh ./

ARG VITE_API_BASE_URL
ARG VITE_SHOWROOM_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_SHOWROOM_URL=$VITE_SHOWROOM_URL
ENV NODE_ENV=production
ENV CI=true
ENV NO_UPDATE_NOTIFIER=true
ENV npm_config_fund=false
ENV npm_config_audit=false
RUN echo "VITE_API_BASE_URL is set to $VITE_API_BASE_URL"
RUN echo "VITE_SHOWROOM_URL is set to $VITE_SHOWROOM_URL"

# Build the showroom app
RUN npm run build

# Production stage
FROM nginx:alpine

COPY --from=builder /app/build /usr/share/nginx/html
COPY --from=builder /app/nginx.conf /etc/nginx/nginx.conf
COPY --from=builder /app/docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh
EXPOSE 80
CMD ["/docker-entrypoint.sh"]
