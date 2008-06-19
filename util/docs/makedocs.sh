#!/bin/bash
for LIBNAME in `ls ../../`; do
  if [ -d "../../$LIBNAME" ] && [ "$LIBNAME" != "util" ] && [ "$LIBNAME" == "extmaptypecontrol" ]; then
    # LIBNAME="extmaptypecontrol"
    java -jar jsdoc-toolkit/jsrun.jar jsdoc-toolkit/app/run.js \
    --define="libName: ExtMapTypeControl" \
    --allfunctions \
    --suppress \
    --verbose \
    -t=templates \
    --directory=../../$LIBNAME/docs \
    ../../$LIBNAME/src/$LIBNAME.js
  fi
done