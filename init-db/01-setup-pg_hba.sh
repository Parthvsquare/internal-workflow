#!/bin/bash
set -e

echo "Configuring PostgreSQL authentication..."

# Backup original pg_hba.conf
cp "$PGDATA/pg_hba.conf" "$PGDATA/pg_hba.conf.backup"

# Create new pg_hba.conf with Docker-friendly settings
cat > "$PGDATA/pg_hba.conf" << EOF
# PostgreSQL Client Authentication Configuration File
# TYPE  DATABASE        USER            ADDRESS                 METHOD

# "local" is for Unix domain socket connections only
local   all             all                                     trust

# IPv4 local connections:
host    all             all             127.0.0.1/32            trust
host    all             all             localhost               trust

# Allow connections from Docker containers (common Docker network ranges)
host    all             all             172.16.0.0/12           md5
host    all             all             192.168.0.0/16          md5
host    all             all             10.0.0.0/8              md5

# Allow connections from Docker bridge network
host    all             all             172.17.0.0/16           md5
host    all             all             172.18.0.0/16           md5
host    all             all             172.19.0.0/16           md5
host    all             all             172.20.0.0/16           md5

# IPv6 local connections:
host    all             all             ::1/128                 trust

# Allow replication connections from localhost, by a user with the
# replication privilege.
local   replication     all                                     trust
host    replication     all             127.0.0.1/32            trust
host    replication     all             ::1/128                 trust

# Allow replication connections from Docker containers
host    replication     all             172.16.0.0/12           md5
host    replication     all             192.168.0.0/16          md5
host    replication     all             10.0.0.0/8              md5
EOF

echo "PostgreSQL authentication configured successfully!" 