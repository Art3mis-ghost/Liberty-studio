# LIBERTY STUDIO AI – TROUBLESHOOTING GUIDE

Common issues, hardware optimizations, and resolution steps for Liberty Studio AI.

---

## 1. Hardware & Memory Diagnostics

### Issue: "CUDA Out of Memory (OOM)"
- **Cause**: Selected model VRAM requirement exceeds your GPU capacity (e.g. attempting to run Wan 2.2 14B on an 8GB GPU).
- **Solution**:
  1. Go to **Model Manager** and switch to lightweight variants (e.g., Wan 2.2 1.3B instead of 14B).
  2. In ComfyUI, pass `--lowvram` or `--medvram` flags:
     ```bash
     python main.py --lowvram
     ```
  3. Reduce video generation resolution or duration (e.g. 720p at 3s instead of 1080p at 10s).

### Issue: "FFmpeg is not installed or not in PATH"
- **Cause**: Video rendering and clipping pipelines require FFmpeg.
- **Solution**:
  - Ubuntu/Debian: `sudo apt install ffmpeg`
  - macOS: `brew install ffmpeg`
  - Windows: Download from `gyan.dev` and add `ffmpeg/bin` to Environment Variables `PATH`.
  - Verify by typing `ffmpeg -version` in terminal.

---

## 2. ComfyUI Connection Issues

### Issue: "ComfyUI Bridge Disconnected"
- **Cause**: ComfyUI is not running on `http://127.0.0.1:8188` or is listening only on `localhost`.
- **Solution**:
  1. Start ComfyUI with explicit host binding:
     ```bash
     python main.py --listen 127.0.0.1 --port 8188
     ```
  2. If running on a remote machine or LAN server, enter the custom IP in **Hardware & Settings** (e.g., `http://192.168.1.50:8188`).
  3. Note: Even if ComfyUI is not running, Liberty Studio AI automatically operates with its internal procedural and FFmpeg generation engines.

---

## 3. Video Clipping & Subtitle Issues

### Issue: "No highlights detected in video"
- **Cause**: The input video may have no audio track or speech volume is below acoustic threshold.
- **Solution**:
  1. Ensure the uploaded MP4 contains an AAC or PCM audio track.
  2. Run **AI Audio Studio** -> **Extract Audio** first to inspect acoustic levels.

---

## 4. Resetting State & Clean Reinstall
If cached job states or local configuration need a fresh reset:
```bash
# Clear generation outputs (optional)
rm -rf public/storage/exports/*

# Re-run build
npm run build
```
