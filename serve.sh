#!/bin/bash

cd client
rm -rf build
npm run build
cd ..


cd server
cp -r ../client/build src/

npm run dev

