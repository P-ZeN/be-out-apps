# Build stage
FROM node:20-alpine AS builder
WORKDIR /app

# Copy package.json from client specifically
COPY package*.json ./
RUN npm install

# Copy all source files
COPY . .

# Build only the client app using vite directly
RUN npx vite build

# Production stage
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY --from=builder /app/nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
