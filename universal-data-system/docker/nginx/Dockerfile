FROM nginx:alpine

# Copy configuration
COPY default.conf /etc/nginx/conf.d/default.conf

# Create directories for certificates
RUN mkdir -p /etc/letsencrypt

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget -q --spider http://localhost/health || exit 1
