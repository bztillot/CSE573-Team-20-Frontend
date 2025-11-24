FROM nginx:alpine

# Copy application files
COPY . /usr/share/nginx/html/

# Expose port
EXPOSE 80

# Nginx serves static files by default
CMD ["nginx", "-g", "daemon off;"]

