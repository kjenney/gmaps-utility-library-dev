#!/bin/bash
for LIBNAME in `ls ../../`; do
  if [ -d "../../$LIBNAME" ] && [ "$LIBNAME" != "util" ]; then
    java -jar jsdoc-toolkit/jsrun.jar jsdoc-toolkit/app/run.js \
    --allfunctions \
    --suppress \
    -t=templates \
    --directory=../../$LIBNAME/docs \
    ../../$LIBNAME/src/$LIBNAME.js
  fi
done