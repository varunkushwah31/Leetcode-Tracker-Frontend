# STAGE 1: Build the React App
FROM node:20-alpine AS build
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source code and build
COPY . .

ARG VITE_API_BASE_URL=/api
ARG VITE_BASE_URL=""
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_BASE_URL=$VITE_BASE_URL

RUN npm run build

# STAGE 2: Serve with Nginx
FROM nginx:alpine

# Remove default Nginx website
RUN rm -rf /usr/share/nginx/html/*

# Copy our custom Nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the built React files from Stage 1
COPY --from=build /app/dist /usr/share/nginx/html

# Harden container: run as unprivileged user 'nginx'
RUN apk add --no-cache libcap && \
    sed -i '/user  nginx;/d' /etc/nginx/nginx.conf && \
    setcap 'cap_net_bind_service=+ep' /usr/sbin/nginx && \
    chown -R nginx:nginx /usr/share/nginx/html /var/cache/nginx /var/log/nginx /etc/nginx/conf.d && \
    touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid

USER nginx

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]