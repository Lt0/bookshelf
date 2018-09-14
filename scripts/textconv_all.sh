#!/bin/bash

for f in $(ls -1); do
    echo converting $f
    iconv -c -f $(enca $f | head -1 | sed "s/.*; //") -t utf-8 $f > /tmp/$f
    if [[ $? = "0" ]]; then
        mv /tmp/$f .
    else 
        echo convert $f failed.
    fi
done
