# Build stage
FROM node:20-alpine AS builder
WORKDIR /app

# Copy package.json from client specifically
COPY package*.json ./
RUN npm install

# Copy source files (exclude node_modules and other apps)
COPY src ./src
COPY public ./public
COPY index.html ./
COPY vite.config.js ./
COPY nginx.conf ./
COPY docker-entrypoint.sh ./

ARG VITE_API_URL
ARG VITE_API_BASE_URL
ARG VITE_MAPBOX_ACCESS_TOKEN
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_MAPBOX_ACCESS_TOKEN=$VITE_MAPBOX_ACCESS_TOKEN
ENV NODE_ENV=production
ENV CI=true
ENV NO_UPDATE_NOTIFIER=true
ENV npm_config_fund=false
ENV npm_config_audit=false
RUN echo "VITE_API_URL is set to $VITE_API_URL"
RUN echo "VITE_API_BASE_URL is set to $VITE_API_BASE_URL"
RUN echo "VITE_MAPBOX_ACCESS_TOKEN is set to $VITE_MAPBOX_ACCESS_TOKEN"

# Build the client app
RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY --from=builder /app/nginx.conf /etc/nginx/nginx.conf
COPY --from=builder /app/docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh
EXPOSE 80
CMD ["/docker-entrypoint.sh"]
