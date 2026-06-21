# Use the official Node.js 22 alpine image for a lightweight runtime
FROM node:22-alpine

# Set working directory inside the container
WORKDIR /app

# Copy package descriptors first to leverage Docker build cache
COPY package*.json ./

# Install production dependencies
RUN npm ci --only=production

# Copy source files
COPY server.js ./
COPY public/ ./public/

# Create data directory for recipe PDFs and tags
RUN mkdir -p /data

# Expose the default application port
EXPOSE 3000

# Set environment variables
ENV PORT=3000
ENV DATA_DIR=/data
ENV NODE_ENV=production

# Define persistent storage volume
VOLUME ["/data"]

# Run the server using native Node.js
CMD ["node", "server.js"]
