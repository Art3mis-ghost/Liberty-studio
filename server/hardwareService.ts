import os from 'node:os';
import { execSync } from 'node:child_process';
import { HardwareInfo } from './types.js';

export class HardwareService {
  private cachedInfo: HardwareInfo | null = null;
  private lastCheck = 0;

  public async getHardwareInfo(): Promise<HardwareInfo> {
    const now = Date.now();
    // Cache for 10 seconds to avoid excessive CLI spawns
    if (this.cachedInfo && now - this.lastCheck < 10000) {
      return this.cachedInfo;
    }

    const cpus = os.cpus();
    const cpuModel = cpus.length > 0 ? cpus[0].model : 'Generic x86_64 CPU';
    const cpuCores = cpus.length;
    const totalMemoryBytes = os.totalmem();
    const freeMemoryBytes = os.freemem();
    const totalMemoryGB = Number((totalMemoryBytes / (1024 * 1024 * 1024)).toFixed(2));
    const freeMemoryGB = Number((freeMemoryBytes / (1024 * 1024 * 1024)).toFixed(2));

    // Check GPU / CUDA
    let gpuDetected = false;
    let gpuName: string | undefined;
    let gpuVramGB: number | undefined;
    let cudaAvailable = false;

    try {
      const smiOutput = execSync('nvidia-smi --query-gpu=name,memory.total --format=csv,noheader,nounits', {
        encoding: 'utf-8',
        timeout: 2000,
        stdio: ['pipe', 'pipe', 'ignore'],
      });
      if (smiOutput && smiOutput.trim()) {
        const parts = smiOutput.trim().split(',');
        gpuName = parts[0]?.trim();
        const vramMb = parseFloat(parts[1]?.trim() || '0');
        gpuVramGB = Number((vramMb / 1024).toFixed(1));
        gpuDetected = true;
        cudaAvailable = true;
      }
    } catch {
      // No nvidia-smi or no dedicated GPU attached. CPU fallback mode is active.
      gpuDetected = false;
      cudaAvailable = false;
    }

    // Check FFmpeg
    let ffmpegAvailable = false;
    let ffmpegVersion: string | undefined;
    try {
      const ffOutput = execSync('ffmpeg -version', {
        encoding: 'utf-8',
        timeout: 2000,
        stdio: ['pipe', 'pipe', 'ignore'],
      });
      const match = ffOutput.match(/ffmpeg version ([^\s]+)/i);
      ffmpegAvailable = true;
      ffmpegVersion = match ? match[1] : 'Installed';
    } catch {
      ffmpegAvailable = false;
    }

    // Check Python
    let pythonAvailable = false;
    let pythonVersion: string | undefined;
    try {
      const pyOutput = execSync('python3 --version', {
        encoding: 'utf-8',
        timeout: 2000,
        stdio: ['pipe', 'pipe', 'ignore'],
      });
      pythonAvailable = true;
      pythonVersion = pyOutput.trim();
    } catch {
      pythonAvailable = false;
    }

    // Check ComfyUI local instance
    let comfyUiDetected = false;
    const comfyUiUrl = process.env.COMFYUI_URL || 'http://127.0.0.1:8188';
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1200);
      const res = await fetch(`${comfyUiUrl}/system_stats`, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (res.ok) {
        comfyUiDetected = true;
      }
    } catch {
      comfyUiDetected = false;
    }

    // Determine system tier and recommended models
    let systemTier: HardwareInfo['systemTier'] = 'cpu_budget';
    const recommendedModels: string[] = [];

    if (gpuDetected && gpuVramGB) {
      if (gpuVramGB >= 16) {
        systemTier = 'pro_studio';
        recommendedModels.push('wan-2.2-14b', 'flux.1-schnell', 'sdxl-base-1.0', 'faster-whisper-large-v3', 'real-esrgan-x4plus');
      } else if (gpuVramGB >= 8) {
        systemTier = 'mid_gpu';
        recommendedModels.push('sdxl-base-1.0', 'wan-2.2-1.3b', 'whisper-small', 'real-esrgan-x4plus', 'piper-tts');
      } else {
        systemTier = 'entry_gpu';
        recommendedModels.push('sd-1.5', 'wan-2.2-1.3b-quant', 'whisper-base', 'real-esrgan-x2', 'piper-tts');
      }
    } else {
      systemTier = 'cpu_budget';
      recommendedModels.push('whisper-base-cpu', 'piper-tts-cpu', 'sd-1.5-openvino', 'ffmpeg-fast-scaler');
    }

    this.cachedInfo = {
      os: `${os.type()} ${os.release()}`,
      platform: os.platform(),
      architecture: process.arch,
      cpuModel,
      cpuCores,
      totalMemoryBytes,
      freeMemoryBytes,
      totalMemoryGB,
      freeMemoryGB,
      gpuDetected,
      gpuName,
      gpuVramGB,
      cudaAvailable,
      ffmpegAvailable,
      ffmpegVersion,
      pythonAvailable,
      pythonVersion,
      comfyUiDetected,
      comfyUiUrl: comfyUiDetected ? comfyUiUrl : undefined,
      recommendedModels,
      systemTier,
    };

    this.lastCheck = now;
    return this.cachedInfo;
  }
}

export const hardwareService = new HardwareService();
