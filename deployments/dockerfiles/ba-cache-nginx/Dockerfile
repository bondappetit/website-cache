FROM nginx:1.21-alpine

COPY deployments/dockerfiles/ba-cache-nginx/default.conf /etc/nginx/conf.d/default.conf
COPY deployments/dockerfiles/ba-cache-nginx/nginx.conf /etc/nginx/nginx.conf
RUN nginx -t
