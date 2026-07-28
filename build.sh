#!/bin/bash
# Prepares the web assets for Capacitor in the 'www' folder

echo "Cleaning www folder..."
rm -rf www
mkdir www

echo "Copying web assets..."
cp index.html www/
cp manifest.json www/
cp sw.js www/
cp -r pages www/
cp -r css www/
cp -r js www/
cp -r assets www/

echo "Build complete."
