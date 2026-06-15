# Stage 1: Build the React Application
FROM node:22-alpine AS build

WORKDIR /app

COPY admin/package*.json ./
RUN npm install

COPY admin/ ./
RUN npm run build

# Stage 2: Serve the Built Assets via Nginx
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY admin/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
