#!/usr/bin/env bash
set -e

echo "=========================================================="
echo "    LIBERTY STUDIO AI – Automatic Installer (Linux/macOS)  "
echo "=========================================================="

echo "[1/4] Checking System Architecture..."
uname -a

echo "[2/4] Verifying FFmpeg & Node.js..."
if ! command -v ffmpeg &> /dev/null; then
    echo "FFmpeg could not be found. Please install FFmpeg (e.g. sudo apt install ffmpeg or brew install ffmpeg)."
    exit 1
fi

if ! command -v node &> /dev/null; then
    echo "Node.js could not be found. Please install Node.js v20+."
    exit 1
fi

echo "[3/4] Installing Node.js studio dependencies..."
npm install

echo "[4/4] Setting up storage directories..."
mkdir -p public/storage/uploads public/storage/generations public/storage/exports public/storage/projects

echo ""
echo "Installation complete!"
echo "Run ./start.sh to launch LIBERTY STUDIO AI."
