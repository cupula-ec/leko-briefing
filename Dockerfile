# syntax=docker/dockerfile:1
FROM nginx:alpine
COPY systems/leko/index.html systems/leko/app.js systems/leko/styles.css /usr/share/nginx/html/
EXPOSE 80
