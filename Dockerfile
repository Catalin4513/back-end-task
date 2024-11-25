# Use the Node.js 14 LTS image as the base
FROM node:14

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the application
RUN npm run start:slow

# Expose port 80 for the REST API
EXPOSE 80

# Start the Node.js application
CMD ["npm", "start"]
