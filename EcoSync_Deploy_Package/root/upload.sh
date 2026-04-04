#!/bin/bash

# EcoSync Pro - Universal Hardware Upload Script
# This script handles the PlatformIO path and directory switching automatically.

# 1. Define the correct pio path
PIO_EXEC="/Users/dhanush/Library/Python/3.9/bin/pio"

# 2. Get the directory of this script (root of repo)
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

# 3. Navigate to hardware folder
cd "$SCRIPT_DIR/hardware" || { echo "Error: Could not find hardware directory"; exit 1; }

# 4. Run the upload
echo "🚀 Starting ESP32 Upload..."
$PIO_EXEC run -t upload

if [ $? -eq 0 ]; then
    echo "✅ Success! ESP32 is updated and running."
else
    echo "❌ Error: Upload failed. Please check your USB connection."
fi
