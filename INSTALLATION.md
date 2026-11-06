# LIBERTY STUDIO AI – INSTALLATION GUIDE

This document provides step-by-step instructions for deploying Liberty Studio AI on Linux, Windows, and macOS systems.

---

## 1. System Requirements

### Minimum Requirements (CPU Fallback Mode)
- **OS**: Ubuntu 22.04+, Debian 12+, Windows 10/11, macOS 13+
- **CPU**: 4-core x86_64 or Apple Silicon (M1/M2/M3)
- **RAM**: 8 GB System Memory
- **Disk**: 10 GB free storage
- **Features Supported**: Piper TTS, Whisper Base, FFmpeg clipping & reframing, 2x Super-Resolution, timeline video editing.

### Recommended Requirements (GPU Accelerated)
- **GPU**: NVIDIA RTX 3060 (12GB) / RTX 4070 / RTX 4090 / A10G / A100
- **VRAM**: 8 GB to 24 GB Dedicated VRAM
- **RAM**: 16 GB to 32 GB System Memory
- **Disk**: 50 GB to 100 GB SSD storage (for checkpoints)
- **Features Supported**: Real-time SDXL diffusion, Wan 2.2 cinematic video generation, 4K super-resolution, instant Whisper large transcription.

---

## 2. Quick Automated Setup

### Linux / Ubuntu / Debian
```bash
chmod +x install.sh start.sh
./install.sh
./start.sh
```

### Windows
```cmd
install.bat
start.bat
```

---

## 3. Manual Step-by-Step Installation

### Step 1: Install System Dependencies

#### On Ubuntu / Debian:
```bash
sudo apt update
sudo apt install -y curl git ffmpeg python3 python3-pip python3-venv
```

#### On Windows:
1. Install [Node.js v20+](https://nodejs.org/).
2. Install [Git for Windows](https://git-scm.com/).
3. Install [FFmpeg](https://ffmpeg.org/download.html) and add the `bin` directory to your System `PATH`.

#### On macOS:
```bash
brew install node ffmpeg python
```

---

### Step 2: Clone and Install Node Dependencies
```bash
git clone https://github.com/liberty-studio/liberty-studio-ai.git
cd liberty-studio-ai
npm install
```

---

### Step 3: Optional ComfyUI Integration
If you wish to use an existing ComfyUI installation on `http://127.0.0.1:8188`:
1. Start your ComfyUI server:
   ```bash
   python main.py --listen 127.0.0.1 --port 8188
   ```
2. Liberty Studio AI automatically probes and connects to port 8188 upon launch. You can configure custom endpoints in **Hardware & Settings**.

---

### Step 4: Launch the Studio
```bash
npm run dev
```
Navigate to: `http://localhost:3000`

---

## 4. Production Build & Deployment
To run Liberty Studio AI as a permanent background service:
```bash
npm run build
NODE_ENV=production npm start
```
