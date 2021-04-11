#!/bin/bash

# Remove prior builds
rm -rf build
mkdir build

# Build server
cd server
npm run local-build
cd ..

# Build client
cd client
npm run build
cd ..

# Move files to build
cp -r server/build .
cp server/package.json ./build/package.json

cp -r client/build build/client

# Clean heroku folder
dirname=$(pwd)
cd $1
git checkout deployment-test
rm -rf */
rm *

# Copy build
cd $dirname
echo $dirname
pwd
cp -r build/. $1
cd $1
git add .
git commit -m "$2"
