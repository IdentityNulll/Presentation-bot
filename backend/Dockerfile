FROM node:22-alpine

WORKDIR /app

# Copy packages first for caching
COPY backend/package*.json ./backend/
COPY database/package*.json ./database/
COPY package*.json ./

# Install dependencies
RUN npm run install:all

# Copy sources
COPY shared/ ./shared/
COPY database/ ./database/
COPY backend/ ./backend/

# Generate Prisma Client
RUN npm run db:generate

EXPOSE 5000

CMD ["npm", "run", "start:backend"]
