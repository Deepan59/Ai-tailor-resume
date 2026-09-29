# Use official Node.js 20 lightweight Alpine image
FROM node:20-alpine

# Set working directory inside container
WORKDIR /app

# Copy package manifest files
COPY package*.json ./

# Install backend dependencies
RUN npm install

# Copy application source code
COPY . .

# Expose backend default port
EXPOSE 3001

# Start the server
CMD ["node", "index.js"]
