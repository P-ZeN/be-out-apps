# Build stage
FROM node:20-alpine AS builder
WORKDIR /app

# Copy package.json from organizer-client specifically
COPY package*.json ./
RUN npm install

# Copy source files (exclude node_modules and other apps)
COPY src ./src
COPY public ./public
COPY index.html ./
COPY vite.config.js ./
COPY nginx.conf ./


ARG VITE_API_URL
ARG VITE_API_BASE_URL
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN echo "VITE_API_URL is set to $VITE_API_URL"
RUN echo "VITE_API_BASE_URL is set to $VITE_API_BASE_URL"

# Build the organizer-client app
RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY --from=builder /app/nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
