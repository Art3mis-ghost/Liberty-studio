#!/usr/bin/env bash
set -e

echo "=========================================================="
echo "    Starting LIBERTY STUDIO AI on port 3000...            "
echo "=========================================================="

export PORT=3000
npm run dev
