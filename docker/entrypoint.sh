#!/bin/sh
set -e

echo "Running database migrations..."
./node_modules/.bin/node-pg-migrate up
echo "Migrations complete. Starting application..."
exec node server.js
