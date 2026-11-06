export type StudioTab =
  | 'dashboard'
  | 'image'
  | 'video'
  | 'clipping'
  | 'editor'
  | 'character'
  | 'upscaler'
  | 'audio'
  | 'library'
  | 'models'
  | 'hardware';

export interface HardwareInfo {
  os: string;
  platform: string;
  architecture: string;
  cpuModel: string;
  cpuCores: number;
  totalMemoryGB: number;
  freeMemoryGB: number;
  gpuDetected: boolean;
  gpuName?: string;
  gpuVramGB?: number;
  cudaAvailable: boolean;
  ffmpegAvailable: boolean;
  ffmpegVersion?: string;
  pythonAvailable: boolean;
  pythonVersion?: string;
  comfyUiDetected: boolean;
  comfyUiUrl?: string;
  recommendedModels: string[];
  systemTier: 'cpu_budget' | 'entry_gpu' | 'mid_gpu' | 'pro_studio';
}

export interface ModelMetadata {
  id: string;
  name: string;
  category: 'image' | 'video' | 'audio' | 'upscaler' | 'controlnet' | 'character';
  architecture: string;
  parameterCount: string;
  sizeGB: number;
  minVramGB: number;
  recommendedVramGB: number;
  cpuCapable: boolean;
  license: string;
  licenseType: 'open_source' | 'open_weights' | 'research';
  status: 'installed' | 'available' | 'downloading';
  downloadUrl?: string;
  description: string;
  bestFor: string;
  huggingfaceRepo?: string;
}

export interface BackgroundJob {
  id: string;
  type: 'image' | 'video' | 'clip' | 'upscale' | 'audio' | 'editor_render';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  stage: string;
  createdAt: number;
  completedAt?: number;
  params: Record<string, any>;
  result?: Record<string, any>;
  error?: string;
}

export type CameraPreset =
  | 'dolly_in'
  | 'dolly_out'
  | 'zoom_in'
  | 'zoom_out'
  | 'pan_left'
  | 'pan_right'
  | 'tilt_up'
  | 'tilt_down'
  | 'orbit'
  | 'tracking_shot'
  | 'crane_shot'
  | 'handheld'
  | 'static'
  | 'drone_shot';

export interface VideoClipSegment {
  id: string;
  startTime: number;
  endTime: number;
  duration: number;
  headline: string;
  hookScore: number;
  viralScore: number;
  reason: string;
  transcript: string;
  aspectRatio: '9:16' | '16:9' | '1:1' | '4:5';
  captionStyle: 'hormozi' | 'karaoke_neon' | 'clean_white' | 'bold_punch';
  exportedVideoUrl?: string;
  speaker?: string;
}

export interface TimelineTrack {
  id: string;
  name: string;
  type: 'video' | 'audio' | 'subtitle' | 'effect';
  clips: Array<{
    id: string;
    start: number;
    duration: number;
    sourceUrl: string;
    sourceStart?: number;
    label: string;
    volume?: number;
    speed?: number;
    text?: string;
  }>;
}

export interface CharacterProfile {
  id: string;
  name: string;
  triggerWord: string;
  description: string;
  referenceImages: string[];
  loraModel?: string;
  consistencyWeight: number;
  styleTags: string[];
  createdAt: number;
}

export interface ProjectAsset {
  id: string;
  type: 'image' | 'video' | 'audio' | 'clip';
  title: string;
  url: string;
  thumbnailUrl?: string;
  duration?: number;
  width?: number;
  height?: number;
  fileSizeBytes?: number;
  createdAt: number;
  metadata?: Record<string, any>;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: number;
  updatedAt: number;
  assets: ProjectAsset[];
  timelineTracks?: TimelineTrack[];
  savedPrompts?: Array<{ id: string; title: string; prompt: string; type: string }>;
}
