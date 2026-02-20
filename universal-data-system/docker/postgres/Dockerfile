# PostgreSQL 17 with pgvector and pg_textsearch
FROM postgres:17

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    git \
    ca-certificates \
    postgresql-server-dev-17 \
    && rm -rf /var/lib/apt/lists/*

# Install pgvector
RUN cd /tmp \
    && git clone --branch v0.8.0 https://github.com/pgvector/pgvector.git \
    && cd pgvector \
    && make \
    && make install \
    && rm -rf /tmp/pgvector

# Install pg_textsearch (Timescale BM25)
RUN cd /tmp \
    && git clone https://github.com/timescale/pg_textsearch.git \
    && cd pg_textsearch \
    && make \
    && make install \
    && rm -rf /tmp/pg_textsearch

# Cleanup build dependencies (keep runtime deps)
RUN apt-get purge -y --auto-remove \
    build-essential \
    git \
    postgresql-server-dev-17 \
    && rm -rf /var/lib/apt/lists/*

# Copy initialization scripts
COPY init.sql /docker-entrypoint-initdb.d/

# Health check
HEALTHCHECK --interval=10s --timeout=5s --start-period=30s --retries=3 \
    CMD pg_isready -U ${POSTGRES_USER:-postgres} -d ${POSTGRES_DB:-uds}
