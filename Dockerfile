FROM node:22-alpine

WORKDIR /app

# Copy all package.json files from monorepo root
COPY package*.json ./
COPY backend/package*.json ./backend/
COPY database/package*.json ./database/
COPY shared/package*.json ./shared/

RUN npm run install:all

# Copy source
COPY backend/ ./backend/
COPY database/ ./database/
COPY shared/ ./shared/

EXPOSE 5000

CMD ["node", "backend/index.js"]