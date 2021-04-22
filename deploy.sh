#!/bin/bash

# Build server and client
npm run build

# Clean heroku folder
dirname=$(pwd)
cd $1
git checkout deployment-test
rm -rf */
rm *

# Copy all build files, except node_modules, .git, and .vscode
rsync -av $dirname/ $1 --exclude node_modules --exclude .git --exclude .vscode
git add .
git commit -m "$2"
git push
