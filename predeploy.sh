#!/bin/bash

#act as a new root folder
rm -rf rootDir
mkdir rootDir/

cd client
rm -rf build 
npm install
npm run build
mv build clientBuild
cp -r clientBuild ../
rm -rf clientBuild
cd ..

cp -r clientBuild rootDir/
cp -r server/* rootDir/

rm -rf clientBuild/








 

