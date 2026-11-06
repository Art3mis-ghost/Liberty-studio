# LIBERTY STUDIO AI

> **The Sovereign Open-Source Creative Platform**  
> Combining the cinematic visual power of **Higgsfield AI** and the automated vertical highlight clipping of **Kixy.ai** into a 100% self-hosted, open-weight studio.

---

## 1. Overview

**Liberty Studio AI** is an independent, production-oriented creative platform designed to free creators, filmmakers, and digital studios from proprietary API lock-ins and recurring cloud fees. 

- **Higgsfield AI Alternative**: Native cinematic AI image and video generation with 14 real camera trajectories (Dolly In/Out, Pan, Tilt, Orbit, Crane, Handheld, Drone sweep), motion dynamics, keyframe conditioning, and IP-Adapter character consistency.
- **Kixy.ai Alternative**: Automated long-to-short video clipping pipeline powered by speech transcription, acoustic energy detection, viral hook scoring, vertical 9:16 reframing, and animated Hormozi-style subtitle rendering.
- **Self-Hosted & Local First**: Operates on local GPUs or CPU fallback without requiring paid external APIs (OpenAI, Runway, DeepSeek, Midjourney).

---

## 2. Studio Workspaces

| Studio | Core Capabilities |
| :--- | :--- |
| **Dashboard** | Studio overview, real-time hardware telemetry, active job monitor, quick-launch studio tiles. |
| **AI Video Studio** | Text-to-video & image-to-video, 14 cinematic camera presets, duration (3–10s), FPS control (24/30/60fps), motion strength dynamics. |
| **Video Clipping Studio** | Kixy-style automated highlight extraction, Whisper speech transcription, viral hook scoring (0–100%), 9:16 vertical reframing, and animated captions. |
| **AI Image Studio** | Open-weight diffusion (SDXL, FLUX.1), style presets (Cinematic, Photorealistic, Anime, Architecture), seed locking, aspect ratios, CFG control. |
| **AI Video Editor** | Non-linear multi-track timeline (Video, Audio, Subtitles), cut/trim, speed adjustment, and direct FFmpeg master rendering. |
| **Character Consistency Studio** | Face identity anchors, trigger tokens (`ohwx_elena`, `sks_marcus`), IP-Adapter weights, and multi-scene continuity. |
| **AI Upscaler & Enhancer** | Real-ESRGAN 2x/4x super-resolution, artifact removal, unsharp texture recovery, and RIFE 60fps frame interpolation. |
| **AI Audio Studio** | Piper neural text-to-speech with 4 studio voices, Whisper speech-to-text, audio extraction, and audio mixing. |
| **Project Library** | Project bins, media organization, prompt vault, and export bundles. |
| **Model Manager** | Open-weight catalog, VRAM compatibility auditor, ComfyUI workflow integration, and checkpoint download guides. |
| **Hardware & Settings** | Real CPU, RAM, GPU/VRAM telemetry, CUDA detection, FFmpeg codec validation, and ComfyUI backend bridges. |

---

## 3. Technology Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS, Lucide Icons, Motion.
- **Backend**: Node.js & Express, Python 3, FFmpeg, ComfyUI connector.
- **AI & Open Weights**:
  - Image: Stable Diffusion XL 1.0, FLUX.1 [schnell], DreamShaper XL.
  - Video: Wan 2.2 1.3B/14B DiT, AnimateDiff v3.
  - Speech: OpenAI Whisper Base, Faster-Whisper Large v3, Piper Neural TTS.
  - Enhancement: Real-ESRGAN x4plus, RIFE v4.6.
  - Control & Adapters: IP-Adapter Face Plus, ControlNet OpenPose.

---

## 4. Quick Start

### Prerequisites
- Node.js >= 18.0.0
- FFmpeg installed (`ffmpeg -version`)
- Python 3.10+ (optional, for local ComfyUI worker)

### Installation
```bash
# Clone the repository
git clone https://github.com/liberty-studio/liberty-studio-ai.git
cd liberty-studio-ai

# Install dependencies
npm install

# Start the full-stack studio server
npm run dev
```

Open `http://localhost:3000` in your browser.

---

## 5. Documentation
- [Installation Guide (INSTALLATION.md)](./INSTALLATION.md)
- [Open-Weight Model Guide (MODEL_GUIDE.md)](./MODEL_GUIDE.md)
- [Troubleshooting & Hardware Optimization (TROUBLESHOOTING.md)](./TROUBLESHOOTING.md)
- [REST API Reference (API_DOCUMENTATION.md)](./API_DOCUMENTATION.md)

---

## 6. License
Liberty Studio AI core application is open-source under the Apache 2.0 License. Open-weight models adhere to their respective licenses (MIT, Apache 2.0, OpenRAIL++).
