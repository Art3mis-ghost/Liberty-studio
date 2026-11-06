# LIBERTY STUDIO AI – OPEN WEIGHTS MODEL GUIDE

This guide details recommended open-weight checkpoints, licenses, memory footprints, and directory placement for ComfyUI or standalone diffusers inference.

---

## 1. Image Generation Models

### Stable Diffusion XL 1.0 Base
- **HuggingFace**: `stabilityai/stable-diffusion-xl-base-1.0`
- **File**: `sd_xl_base_1.0.safetensors` (6.6 GB)
- **VRAM**: Minimum 6 GB, Recommended 12 GB
- **License**: CreativeML OpenRAIL++-M
- **Directory**: `ComfyUI/models/checkpoints/`
- **Usage**: Native 1024x1024 photorealistic composition, cinematic portraits, concept art.

### FLUX.1 [schnell]
- **HuggingFace**: `black-forest-labs/FLUX.1-schnell`
- **File**: `flux1-schnell.safetensors` (11.9 GB)
- **VRAM**: Minimum 12 GB, Recommended 16 GB
- **License**: Apache 2.0 (Commercial Friendly)
- **Directory**: `ComfyUI/models/unet/` or `checkpoints/`
- **Usage**: Ultra-fast 1–4 step generation with state-of-the-art prompt following and text legibility.

### DreamShaper XL Lightning
- **HuggingFace**: `Lykon/dreamshaper-xl-v2-turbo`
- **File**: `dreamshaperXL_lightningDPMSDE.safetensors` (6.4 GB)
- **VRAM**: Minimum 4 GB, Recommended 8 GB
- **License**: CreativeML OpenRAIL++-M
- **Directory**: `ComfyUI/models/checkpoints/`
- **Usage**: Sub-second rapid ideation, CGI keyframes, character design.

---

## 2. Cinematic Video Models

### Wan 2.2 1.3B Video DiT
- **HuggingFace**: `Wan-AI/Wan2.1-T2V-1.3B`
- **File**: `Wan2.1_T2V_1.3B.safetensors` (2.7 GB)
- **VRAM**: Minimum 6 GB, Recommended 8 GB (CPU Capable)
- **License**: Apache 2.0
- **Directory**: `ComfyUI/models/diffusion_models/`
- **Usage**: Open video diffusion with temporal consistency, cinematic dolly/pan camera presets.

### Wan 2.2 14B High-Fidelity
- **HuggingFace**: `Wan-AI/Wan2.1-T2V-14B`
- **File**: `Wan2.1_T2V_14B.safetensors` (28 GB)
- **VRAM**: Minimum 16 GB, Recommended 24 GB
- **License**: Apache 2.0
- **Directory**: `ComfyUI/models/diffusion_models/`
- **Usage**: Full-fidelity 1080p spatiotemporal motion for film production and commercial trailers.

---

## 3. Speech & Audio Models

### OpenAI Whisper Base
- **HuggingFace**: `openai/whisper-base`
- **File Size**: 142 MB
- **Hardware**: Runs instantly on any CPU (0.5 GB RAM)
- **License**: MIT
- **Usage**: Kixy-style automated speech transcription with word-level timestamps.

### Piper Neural TTS
- **Repository**: `rhasspy/piper-voices`
- **File Size**: ~15 MB to 30 MB per voice checkpoint
- **Hardware**: 100% CPU capable, real-time voice synthesis
- **License**: MIT
- **Usage**: Local voiceover narration across American, British, and global voices.

---

## 4. Enhancement & Upscaling

### Real-ESRGAN x4plus
- **Repository**: `xinntao/Real-ESRGAN`
- **File**: `RealESRGAN_x4plus.pth` (64 MB)
- **License**: BSD-3-Clause
- **Directory**: `ComfyUI/models/upscale_models/`
- **Usage**: 4x super-resolution for keyframes and artwork.

### RIFE v4.6 Frame Interpolation
- **Repository**: `megvii-research/ECCV2022-RIFE`
- **File Size**: 25 MB
- **License**: MIT
- **Usage**: Optical flow interpolation converting 24/30fps videos into silky 60fps playback.
