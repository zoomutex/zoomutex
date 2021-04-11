#!/bin/bash

# Remove prior builds
rm -rf build
mkdir build

# Build server
cd server
npm run build
cd ..

# Build client
cd client
npm run build
cd ..

# Move files to build
cp -r server/build .
cp -r server/node_modules build/node_modules

cp -r client/build build/client

# Serve
NODE_ENV=production node build/server.js
