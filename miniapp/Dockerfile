# Use official node image for building and serving the Vite app
FROM node:20-alpine AS build
WORKDIR /app

# Install dependencies and build
COPY miniapp/package*.json ./
RUN npm install --silent
COPY miniapp/ ./
RUN npm run build

# Serve with nginx
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
# Optional: custom nginx config (if needed)
# COPY miniapp/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
