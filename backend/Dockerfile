# Production Dockerfile for AI Dental Care Backend
FROM node:18-alpine

# Use production environment
ENV NODE_ENV=production

# Set application directory
WORKDIR /app

# Copy package manifests first to leverage Docker build cache
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy application source code
COPY . .

# Create directory structure and set secure permissions
RUN mkdir -p uploads logs && chown -R node:node /app

# Switch to non-privileged node user
USER node

# Expose port
EXPOSE 5000

# Start the service
CMD ["node", "src/server.js"]
