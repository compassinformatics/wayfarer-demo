# cd D:\GitHub\wayfarer-demo
# docker context use default
# docker build . --tag wayfarer-demo
# docker exec -it wayfarer-demo bash
FROM httpd:2.4

# copy web demo files
COPY ./dist /usr/local/apache2/htdocs/

# Enable necessary Apache modules
RUN sed -i '/#LoadModule proxy_module/s/^#//g' /usr/local/apache2/conf/httpd.conf && \
    sed -i '/#LoadModule proxy_http_module/s/^#//g' /usr/local/apache2/conf/httpd.conf

RUN echo "LoadModule rewrite_module modules/mod_rewrite.so" >> /usr/local/apache2/conf/httpd.conf

# Set up reverse proxy for /api
RUN echo "ProxyPass /api http://host.docker.internal:8000/api" >> /usr/local/apache2/conf/httpd.conf
RUN echo "ProxyPassReverse /api http://host.docker.internal:8000/api" >> /usr/local/apache2/conf/httpd.conf

# Expose port 80 for Apache web server
EXPOSE 80