# Production Dockerfile for Matrimony Admin Frontend (Vite)
# Optimized for minimal footprint (<20MB)

# Stage 1: Build
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG VITE_ADMIN_API_URL
ENV VITE_ADMIN_API_URL=$VITE_ADMIN_API_URL
RUN npm run build

# Stage 2: Production
FROM nginx:stable-alpine3.20-slim

# Copy built assets to Nginx
COPY --from=builder /app/dist /usr/share/nginx/html
# Custom Nginx config to handle SPA routing (ensure it exists in Admin/Frontend)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
