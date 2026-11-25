# Base Image
FROM node:18-alpine

# Set Working Directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install Dependencies
RUN npm install --production

# Install PM2 globally for clustering running
RUN npm install pm2 -g

# Copy Source Code
COPY . .

# Expose Port
EXPOSE 5000

# Start Application with PM2 clustering configuration
CMD ["pm2-runtime", "ecosystem.config.js"]
