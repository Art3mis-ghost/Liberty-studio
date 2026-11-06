# LIBERTY STUDIO AI – API DOCUMENTATION

Liberty Studio AI exposes modular REST endpoints for programmatic video synthesis, clipping, multi-track editing, model inspection, and hardware telemetry.

---

## 1. System & Hardware

### `GET /api/hardware`
Returns real-time server telemetry including CPU, RAM, GPU, CUDA, and FFmpeg version.

#### Response Example:
```json
{
  "success": true,
  "hardware": {
    "os": "Linux 4.19.0-gvisor",
    "platform": "linux",
    "architecture": "x86_64",
    "cpuModel": "Intel Xeon",
    "cpuCores": 2,
    "totalMemoryGB": 4.0,
    "freeMemoryGB": 3.8,
    "gpuDetected": false,
    "cudaAvailable": false,
    "ffmpegAvailable": true,
    "ffmpegVersion": "4.4.2",
    "systemTier": "cpu_budget"
  }
}
```

---

## 2. Models Catalog & Management

### `GET /api/models`
Returns all open-weight models and the currently active model for each category.

### `POST /api/models/active`
Swaps the active model for an inference category.
```json
{
  "category": "video",
  "modelId": "wan-2.2-1.3b"
}
```

### `GET /api/models/:id/compatibility`
Evaluates hardware compatibility for a specific model against system VRAM and RAM.

---

## 3. Cinematic Video Generation

### `POST /api/generate/video`
Dispatches a background video synthesis job with camera movement.

#### Request Body:
```json
{
  "prompt": "Cinematic shot of a cybernetic rover on Mars, glowing visor, 35mm film",
  "cameraPreset": "dolly_in",
  "aspectRatio": "16:9",
  "durationSeconds": 4,
  "fps": 30,
  "motionStrength": 6,
  "seed": 42891
}
```

#### Response:
```json
{
  "success": true,
  "jobId": "job_1742080000000_a1b2",
  "job": {
    "id": "job_1742080000000_a1b2",
    "type": "video",
    "status": "pending",
    "progress": 0,
    "stage": "Queued in local inference pipeline"
  }
}
```

---

## 4. Video Clipping & Highlights (Kixy Pipeline)

### `POST /api/clipping/analyze`
Transcribes speech, calculates acoustic energy, and identifies viral clips.
```json
{
  "videoPath": "/storage/generations/sample.mp4"
}
```

### `POST /api/clipping/render`
Renders a vertical 9:16 clip with burned animated captions (Hormozi style).
```json
{
  "sourceVideoPath": "/storage/generations/sample.mp4",
  "segment": {
    "id": "clip_1",
    "startTime": 0,
    "endTime": 15,
    "headline": "Why Local Inference Wins",
    "transcript": "Full local inference gives you total control.",
    "aspectRatio": "9:16",
    "captionStyle": "hormozi"
  }
}
```

---

## 5. Timeline Multi-Track Editor

### `POST /api/editor/render`
Renders multi-track timeline events (Video, Audio, Subtitles) to master MP4 via FFmpeg.

---

## 6. Background Job Lifecycle

### `GET /api/jobs`
List all active and completed background jobs.

### `GET /api/jobs/:id`
Get status, progress percentage, active stage description, and result URL for a specific job.

### `POST /api/jobs/:id/cancel`
Cancel an active job.
