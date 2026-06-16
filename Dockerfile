FROM node:22-alpine

WORKDIR /app

COPY backend/package*.json ./
RUN npm install --production

COPY backend/ ./
COPY shared/ ./shared/
COPY database/ ./database/

EXPOSE 5000

CMD ["node", "server.js"]