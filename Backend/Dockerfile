# Production Dockerfile for Matrimony Backend (Express)
# Optimized for minimal footprint (<60MB)

# Stage 1: Build
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Stage 2: Selection
FROM node:22-alpine AS selector
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY . .
# Remove non-essential files to minimize copy overhead
RUN rm -rf .git .dockerignore Dockerfile README.md

# Stage 3: Runner
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy only production dependencies
COPY --from=selector /app/package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy source code and necessary files
COPY --from=selector /app/src ./src
COPY --from=selector /app/firebase-service-account.json* ./

# Create logs directory and set permissions
RUN mkdir -p /app/logs && chown -R node:node /app/logs

USER node
EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/api/health', (res) => res.statusCode === 200 ? process.exit(0) : process.exit(1))"

CMD ["node", "src/server.js"]
