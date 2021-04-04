#!/bin/bash

rm -rf build
mkdir build

cp -r server/build .
cp -r server/node_modules build/node_modules

cp -r client/build build/client
