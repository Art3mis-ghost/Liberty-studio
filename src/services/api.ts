import {
  HardwareInfo,
  ModelMetadata,
  BackgroundJob,
  VideoClipSegment,
  Project,
  CharacterProfile,
  CameraPreset,
} from '../types/index.ts';

export const api = {
  // Hardware
  async getHardware(): Promise<HardwareInfo> {
    const res = await fetch('/api/hardware');
    const data = await res.json();
    return data.hardware;
  },

  // Models
  async getModels(): Promise<{ models: ModelMetadata[]; activeModels: Record<string, string> }> {
    const res = await fetch('/api/models');
    const data = await res.json();
    return { models: data.models, activeModels: data.activeModels };
  },

  async setActiveModel(category: string, modelId: string): Promise<Record<string, string>> {
    const res = await fetch('/api/models/active', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category, modelId }),
    });
    const data = await res.json();
    return data.activeModels;
  },

  async checkModelCompatibility(modelId: string): Promise<{
    compatible: boolean;
    reason: string;
    warning?: string;
  }> {
    const res = await fetch(`/api/models/${modelId}/compatibility`);
    return res.json();
  },

  // Jobs
  async getJobs(): Promise<BackgroundJob[]> {
    const res = await fetch('/api/jobs');
    const data = await res.json();
    return data.jobs;
  },

  async getJob(id: string): Promise<BackgroundJob> {
    const res = await fetch(`/api/jobs/${id}`);
    const data = await res.json();
    return data.job;
  },

  async cancelJob(id: string): Promise<boolean> {
    const res = await fetch(`/api/jobs/${id}/cancel`, { method: 'POST' });
    const data = await res.json();
    return data.success;
  },

  // Gemini Engine Status
  async getGeminiStatus(): Promise<{ configured: boolean; modelImage: string; modelVideo: string }> {
    try {
      const res = await fetch('/api/gemini/status');
      const data = await res.json();
      return data;
    } catch {
      return { configured: false, modelImage: 'gemini-3.1-flash-lite-image', modelVideo: 'gemini-omni-1.2-flash' };
    }
  },

  // Image Generation
  async generateImage(params: {
    prompt: string;
    negativePrompt?: string;
    preset?: string;
    aspectRatio: string;
    seed: number;
    steps?: number;
    cfgScale?: number;
    modelId?: string;
    engine?: 'local' | 'gemini';
  }): Promise<{ jobId: string; job: BackgroundJob }> {
    const res = await fetch('/api/generate/image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    return res.json();
  },

  // Video Generation
  async generateVideo(params: {
    prompt: string;
    sourceImageUrl?: string;
    cameraPreset: CameraPreset;
    aspectRatio: string;
    durationSeconds: number;
    fps: number;
    motionStrength: number;
    seed: number;
    modelId?: string;
    engine?: 'local' | 'gemini';
  }): Promise<{ jobId: string; job: BackgroundJob }> {
    const res = await fetch('/api/generate/video', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    return res.json();
  },

  // Video In-Canvas / Direct Editing
  async editVideo(params: {
    sourceVideoUrl: string;
    trimStart?: number;
    trimEnd?: number;
    speed?: number;
    filter?: string;
    aspectRatio?: string;
    textOverlay?: string;
    textPosition?: 'bottom' | 'top' | 'center';
    muteAudio?: boolean;
  }): Promise<{ jobId: string; job: BackgroundJob }> {
    const res = await fetch('/api/video/edit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    return res.json();
  },

  // Video Clipping (Kixy Style)
  async analyzeHighlights(videoPath?: string): Promise<{ jobId: string; job: BackgroundJob }> {
    const res = await fetch('/api/clipping/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ videoPath }),
    });
    return res.json();
  },

  async renderClip(sourceVideoPath: string, segment: VideoClipSegment): Promise<{ jobId: string; job: BackgroundJob }> {
    const res = await fetch('/api/clipping/render', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sourceVideoPath, segment }),
    });
    return res.json();
  },

  // YouTube & Video URL Importer
  async importVideoUrl(url: string, title?: string): Promise<{
    success: boolean;
    error?: string;
    video: {
      id: string;
      sourceType: 'youtube' | 'direct_url' | 'upload';
      originalUrl: string;
      title: string;
      duration: number;
      thumbnailUrl: string;
      localVideoUrl: string;
      embedUrl?: string;
      fileSizeFormatted?: string;
      resolution?: string;
    };
  }> {
    const res = await fetch('/api/video/import-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, title }),
    });
    return res.json();
  },

  // Create Multiple Shorts from Long Video (Batch Kixy-style Pipeline)
  async createMultipleShorts(videoPath: string, title?: string, count: number = 3): Promise<{ jobId: string; job: BackgroundJob }> {
    const res = await fetch('/api/video/create-multiple-shorts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ videoPath, title, count }),
    });
    return res.json();
  },

  // Gemini Hyper-Realistic Prompt Assistant
  async enhancePromptWithGemini(prompt: string, style?: string): Promise<{
    success: boolean;
    result: {
      enhancedPrompt: string;
      negativePrompt: string;
      suggestedCamera: string;
      suggestedLighting: string;
      suggestedComposition: string;
      styleTags: string[];
    };
  }> {
    const res = await fetch('/api/gemini/enhance-prompt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, style }),
    });
    return res.json();
  },

  // Editor Multi-Track Render
  async renderTimeline(tracks: any[], options?: any): Promise<{ jobId: string; job: BackgroundJob }> {
    const res = await fetch('/api/editor/render', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tracks, ...options }),
    });
    return res.json();
  },

  // Audio Studio
  async generateTTS(text: string, voice: string, speed: number = 1.0): Promise<{ jobId: string; job: BackgroundJob }> {
    const res = await fetch('/api/audio/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, voice, speed }),
    });
    return res.json();
  },

  async extractAudio(videoUrl: string): Promise<{ jobId: string; job: BackgroundJob }> {
    const res = await fetch('/api/audio/extract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ videoUrl }),
    });
    return res.json();
  },

  // AI Upscaler
  async processUpscale(params: {
    inputUrl: string;
    type: 'image' | 'video';
    scale: 2 | 4;
    denoise: boolean;
    sharpen: boolean;
    interpolateFps?: boolean;
  }): Promise<{ jobId: string; job: BackgroundJob }> {
    const res = await fetch('/api/upscale', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    return res.json();
  },

  // Characters
  async getCharacters(): Promise<CharacterProfile[]> {
    const res = await fetch('/api/characters');
    const data = await res.json();
    return data.characters;
  },

  async createCharacter(char: Partial<CharacterProfile>): Promise<CharacterProfile> {
    const res = await fetch('/api/characters', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(char),
    });
    const data = await res.json();
    return data.character;
  },

  async deleteCharacter(id: string): Promise<boolean> {
    const res = await fetch(`/api/characters/${id}`, { method: 'DELETE' });
    const data = await res.json();
    return data.success;
  },

  // Projects
  async getProjects(): Promise<Project[]> {
    const res = await fetch('/api/projects');
    const data = await res.json();
    return data.projects;
  },

  async createProject(name: string, description: string): Promise<Project> {
    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description }),
    });
    const data = await res.json();
    return data.project;
  },

  // Prompt Assistant
  async enhancePrompt(prompt: string, style?: string): Promise<{
    original: string;
    enhancedPrompt: string;
    negativePrompt: string;
    suggestedCamera: string;
    suggestedLighting: string;
    suggestedComposition: string;
    styleTags: string[];
  }> {
    const res = await fetch('/api/prompt-assistant/enhance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, style }),
    });
    const data = await res.json();
    return data.result;
  },

  // File Upload
  async uploadFile(file: File): Promise<{
    url: string;
    filename: string;
    originalName: string;
    size: number;
    mimetype: string;
  }> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Upload failed');
    return data;
  },

  // Audio Studio Whisper & Noise Reduction
  async transcribeAudio(mediaUrl: string): Promise<{ jobId: string; job: BackgroundJob }> {
    const res = await fetch('/api/audio/transcribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mediaUrl }),
    });
    return res.json();
  },

  async denoiseAudio(audioUrl: string): Promise<{ jobId: string; job: BackgroundJob }> {
    const res = await fetch('/api/audio/denoise', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ audioUrl }),
    });
    return res.json();
  },
};
