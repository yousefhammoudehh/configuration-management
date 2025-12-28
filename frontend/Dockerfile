# Dev-friendly runtime image with live reload
FROM node:18-alpine

WORKDIR /app

# Install dependencies first (cached by Docker when package files don't change)
COPY package*.json ./
RUN npm install

# Copy the rest of the source (will be overridden by bind mounts in docker-compose for dev)
COPY . .

# Expose Vite dev server port
EXPOSE 5173

# Health check against the dev server
HEALTHCHECK --interval=10s --timeout=5s --retries=5 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:5173/ || exit 1

# Run Vite dev server on all interfaces so it’s reachable from the host
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]
