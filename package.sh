#! /bin/sh

# Zip Package for Lambda.
cd `dirname $0`
cd src
zip -r lambda-package.zip .
