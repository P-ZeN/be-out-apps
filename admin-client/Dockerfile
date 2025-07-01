# Build stage
FROM node:20-alpine AS builder
WORKDIR /app

# Copy package.json from admin-client specifically
COPY package*.json ./
RUN npm install

# Copy source files (exclude node_modules and other apps)
COPY src ./src
COPY public ./public
COPY index.html ./
COPY vite.config.js ./
COPY nginx.conf ./

# Build the admin-client app
RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY --from=builder /app/nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
