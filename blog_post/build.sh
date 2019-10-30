#!/usr/bin/env bash
cd "$(dirname "$(readlink -f "$0" || realpath "$0")")"
pwd

#rm -rf ../public/
mkdir ../public/
cp .nojekyll ../public/
cp -r ../dist assets ../public/
../bin/render.js -i index.html -o ../public/index.html
echo "Done."
