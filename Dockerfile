FROM node:18

WORKDIR /src
# install yarn

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code to the working directory
COPY . .

# Copy .env
COPY .env .env

# Build the NestJS application
RUN npm run build

# Expose the port your application runs on
EXPOSE 8080

# Command to run the application
CMD ["npm", "run" , "start:prod"]
