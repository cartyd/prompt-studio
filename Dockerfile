# syntax=docker/dockerfile:1

# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies for build)
RUN npm ci

# Copy prisma schema
COPY prisma ./prisma/

# Generate Prisma Client
RUN npx prisma generate

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy prisma schema for runtime
COPY prisma ./prisma/

# Generate Prisma Client in production image
RUN npx prisma generate

# Copy built application from builder
COPY --from=builder /app/dist ./dist

# Copy public assets
COPY public ./public

# Expose port
EXPOSE 3000

# Run migrations and start the app
CMD npx prisma migrate deploy && node dist/server.js
