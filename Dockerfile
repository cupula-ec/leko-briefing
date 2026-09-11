# syntax=docker/dockerfile:1
FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY systems/ /usr/share/nginx/html/systems/
EXPOSE 80
