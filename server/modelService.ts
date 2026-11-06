import { ModelMetadata, HardwareInfo } from './types.js';
import { hardwareService } from './hardwareService.js';
import { comfyUIModelDetector } from './providers/comfyui/ComfyUIModelDetector.js';

export const OPEN_WEIGHT_MODELS: ModelMetadata[] = [
  // --- Image Generation ---
  {
    id: 'sdxl-base-1.0',
    name: 'Stable Diffusion XL 1.0 Base',
    category: 'image',
    architecture: 'Latent Diffusion (SDXL)',
    parameterCount: '3.5B',
    sizeGB: 6.6,
    minVramGB: 6,
    recommendedVramGB: 12,
    cpuCapable: true,
    license: 'CreativeML OpenRAIL++-M',
    licenseType: 'open_weights',
    status: 'available',
    huggingfaceRepo: 'stabilityai/stable-diffusion-xl-base-1.0',
    description: 'Premier open-weight photorealistic and cinematic image model with high dynamic range and native 1024x1024 rendering.',
    bestFor: 'Cinematic portraits, photorealism, landscape concept art, advertising visual assets',
  },
  {
    id: 'flux.1-schnell',
    name: 'FLUX.1 [schnell]',
    category: 'image',
    architecture: 'Flow Transformer (DiT)',
    parameterCount: '12B',
    sizeGB: 11.9,
    minVramGB: 12,
    recommendedVramGB: 16,
    cpuCapable: false,
    license: 'Apache 2.0',
    licenseType: 'open_source',
    status: 'available',
    huggingfaceRepo: 'black-forest-labs/FLUX.1-schnell',
    description: 'Cutting-edge rectified-flow transformer model designed for 1-4 step ultra-fast generation with extraordinary prompt adherence.',
    bestFor: 'Hyper-detailed compositions, accurate typography on surfaces, complex multi-subject scenes',
  },
  {
    id: 'dreamshaper-xl-turbo',
    name: 'DreamShaper XL Lightning',
    category: 'image',
    architecture: 'SDXL LCM/Lightning',
    parameterCount: '3.5B',
    sizeGB: 6.4,
    minVramGB: 4,
    recommendedVramGB: 8,
    cpuCapable: true,
    license: 'CreativeML OpenRAIL++-M',
    licenseType: 'open_weights',
    status: 'available',
    huggingfaceRepo: 'Lykon/dreamshaper-xl-v2-turbo',
    description: 'Sub-second 4-8 step optimized SDXL checkpoint tuned for artistic portraits, CGI, and vivid digital cinema aesthetics.',
    bestFor: 'Rapid ideation, character concept art, fantasy & sci-fi keyframes',
  },

  // --- Video Generation ---
  {
    id: 'wan-2.1-1.3b',
    name: 'Wan 2.1 1.3B Video',
    category: 'video',
    architecture: 'Diffusion Transformer (Video DiT)',
    parameterCount: '1.3B',
    sizeGB: 2.7,
    minVramGB: 6,
    recommendedVramGB: 8,
    cpuCapable: true,
    license: 'Apache 2.0',
    licenseType: 'open_source',
    status: 'available',
    huggingfaceRepo: 'Wan-AI/Wan2.1-T2V-1.3B',
    description: 'Lightweight modern open-weight video diffusion model capable of temporal coherence, cinematic motion, and fast iteration.',
    bestFor: 'Cinematic camera moves, social video loops, B-roll clips, rapid video prototyping',
  },
  {
    id: 'wan-2.1-14b',
    name: 'Wan 2.1 14B High-Fidelity',
    category: 'video',
    architecture: 'Spatiotemporal DiT',
    parameterCount: '14B',
    sizeGB: 28.0,
    minVramGB: 16,
    recommendedVramGB: 24,
    cpuCapable: false,
    license: 'Apache 2.0',
    licenseType: 'open_source',
    status: 'available',
    huggingfaceRepo: 'Wan-AI/Wan2.1-T2V-14B',
    description: 'Full-scale open-weight cinematic video model delivering 1080p photorealistic motion dynamics, nuanced actor gestures, and fluid physics.',
    bestFor: 'Film-grade scene generation, dramatic lighting changes, commercial video production',
  },
  {
    id: 'animatediff-motion-v3',
    name: 'AnimateDiff Motion Module v3',
    category: 'video',
    architecture: 'Temporal Motion Adapter',
    parameterCount: '450M',
    sizeGB: 1.7,
    minVramGB: 6,
    recommendedVramGB: 8,
    cpuCapable: true,
    license: 'Apache 2.0',
    licenseType: 'open_source',
    status: 'available',
    huggingfaceRepo: 'guoyww/animatediff-motion-adapter-v1-5-3',
    description: 'Plug-and-play temporal attention module injecting fluid motion into any community image checkpoint.',
    bestFor: 'Looping motion art, anime clips, stylized character movements',
  },

  // --- Speech & Audio ---
  {
    id: 'whisper-base',
    name: 'OpenAI Whisper Base',
    category: 'audio',
    architecture: 'Seq2Seq Transformer',
    parameterCount: '74M',
    sizeGB: 0.14,
    minVramGB: 1,
    recommendedVramGB: 2,
    cpuCapable: true,
    license: 'MIT',
    licenseType: 'open_source',
    status: 'available',
    huggingfaceRepo: 'openai/whisper-base',
    description: 'Ultra-fast speech-to-text transcription with word-level timestamps, multilingual support, and native CPU capability.',
    bestFor: 'Automatic video clipping subtitles, podcast transcription, short-form captioning',
  },
  {
    id: 'faster-whisper-large-v3',
    name: 'Faster-Whisper Large v3 (CTranslate2)',
    category: 'audio',
    architecture: 'CTranslate2 Quantized Transformer',
    parameterCount: '1.5B',
    sizeGB: 1.5,
    minVramGB: 4,
    recommendedVramGB: 6,
    cpuCapable: true,
    license: 'MIT',
    licenseType: 'open_source',
    status: 'available',
    huggingfaceRepo: 'Systran/faster-whisper-large-v3',
    description: 'Up to 4x faster Whisper execution using CTranslate2 inference engine with 8-bit quantization and pinpoint punctuation.',
    bestFor: 'Long-form video interviews, multi-speaker dialogues, dense technical speeches',
  },
  {
    id: 'piper-tts',
    name: 'Piper Neural TTS',
    category: 'audio',
    architecture: 'VITS Neural Synthesizer',
    parameterCount: '28M',
    sizeGB: 0.03,
    minVramGB: 0.5,
    recommendedVramGB: 1,
    cpuCapable: true,
    license: 'MIT',
    licenseType: 'open_source',
    status: 'available',
    huggingfaceRepo: 'rhasspy/piper-voices',
    description: 'Fast, lightweight local neural text-to-speech engine running entirely on CPU in real-time with natural cadence.',
    bestFor: 'Voiceover narration, video clip audio hooks, explainers, character voices',
  },

  // --- Enhancement & Upscaling ---
  {
    id: 'real-esrgan-x4plus',
    name: 'Real-ESRGAN x4plus',
    category: 'upscaler',
    architecture: 'Residual-in-Residual Dense Net (RRDBNet)',
    parameterCount: '16.7M',
    sizeGB: 0.064,
    minVramGB: 2,
    recommendedVramGB: 4,
    cpuCapable: true,
    license: 'BSD-3-Clause',
    licenseType: 'open_source',
    status: 'available',
    huggingfaceRepo: 'xinntao/Real-ESRGAN',
    description: 'Universal 4x super-resolution model restoring fine details, reducing compression artifacts, and enhancing texture clarity.',
    bestFor: '4K image upscaling, print-ready graphics, sharpening blurred AI generations',
  },
  {
    id: 'rife-v4.6',
    name: 'RIFE v4.6 Frame Interpolation',
    category: 'upscaler',
    architecture: 'Real-Time Intermediate Flow Estimation',
    parameterCount: '10M',
    sizeGB: 0.025,
    minVramGB: 2,
    recommendedVramGB: 4,
    cpuCapable: true,
    license: 'MIT',
    licenseType: 'open_source',
    status: 'available',
    huggingfaceRepo: 'megvii-research/ECCV2022-RIFE',
    description: 'Deep neural network estimating optical flow between video frames to achieve silky 60fps or slow-motion replay without ghosting.',
    bestFor: '24fps to 60fps conversion, slow-motion video enhancement, fluid camera pans',
  },

  // --- ControlNet & Character Adapters ---
  {
    id: 'ip-adapter-face-plus',
    name: 'IP-Adapter Face Plus SDXL',
    category: 'character',
    architecture: 'Decoupled Cross-Attention Adapter',
    parameterCount: '220M',
    sizeGB: 0.85,
    minVramGB: 6,
    recommendedVramGB: 8,
    cpuCapable: false,
    license: 'Apache 2.0',
    licenseType: 'open_source',
    status: 'available',
    huggingfaceRepo: 'h94/IP-Adapter-FaceID',
    description: 'Reference face conditioning mechanism maintaining facial identity, eye structure, and character traits across novel scenes.',
    bestFor: 'Character consistency in storyboarding, cinematic scene continuity, actor-specific generations',
  },
  {
    id: 'controlnet-openpose-sdxl',
    name: 'ControlNet OpenPose SDXL',
    category: 'controlnet',
    architecture: 'Zero-Convolution Conditioned Backbone',
    parameterCount: '1.25B',
    sizeGB: 2.5,
    minVramGB: 6,
    recommendedVramGB: 8,
    cpuCapable: false,
    license: 'Apache 2.0',
    licenseType: 'open_source',
    status: 'available',
    huggingfaceRepo: 'thibaud/controlnet-openpose-sdxl-1.0',
    description: 'Extracts full body skeletal pose, hand gestures, and head angle to lock exact character choreography.',
    bestFor: 'Dynamic action poses, dance choreography, commercial product interaction poses',
  },
];

export class ModelService {
  private models: ModelMetadata[] = [...OPEN_WEIGHT_MODELS];
  private activeModelIds: Record<string, string> = {
    image: 'sdxl-base-1.0',
    video: 'wan-2.1-1.3b',
    audio: 'whisper-base',
    tts: 'piper-tts',
    upscaler: 'real-esrgan-x4plus',
    character: 'ip-adapter-face-plus',
  };

  constructor() {
    this.refreshInstalledStatus().catch(() => {});
  }

  public async refreshInstalledStatus(): Promise<void> {
    try {
      const checks = await comfyUIModelDetector.detectModels(
        this.models.map(m => ({ id: m.id, name: m.name }))
      );
      for (const model of this.models) {
        const check = checks.get(model.id);
        if (check && check.found) {
          model.status = 'installed';
        } else {
          model.status = 'available';
        }
      }
    } catch {
      // Keep default honest status
    }
  }

  public getAllModels(): ModelMetadata[] {
    return this.models;
  }

  public getModelById(id: string): ModelMetadata | undefined {
    return this.models.find((m) => m.id === id);
  }

  public getActiveModels(): Record<string, string> {
    return { ...this.activeModelIds };
  }

  public setActiveModel(category: string, modelId: string): boolean {
    const model = this.getModelById(modelId);
    if (!model) return false;
    this.activeModelIds[category] = modelId;
    return true;
  }

  public async evaluateModelCompatibility(modelId: string): Promise<{
    compatible: boolean;
    reason: string;
    hardware: HardwareInfo;
    warning?: string;
  }> {
    const model = this.getModelById(modelId);
    const hw = await hardwareService.getHardwareInfo();

    if (!model) {
      return { compatible: false, reason: 'Model not found in catalog', hardware: hw };
    }

    if (!hw.gpuDetected && !model.cpuCapable) {
      return {
        compatible: false,
        reason: `${model.name} requires a CUDA GPU and cannot execute purely on CPU.`,
        hardware: hw,
        warning: 'Use Google Gemini cloud inference or install a CPU-capable model checkpoint.',
      };
    }

    if (hw.gpuDetected && hw.gpuVramGB && hw.gpuVramGB < model.minVramGB) {
      return {
        compatible: false,
        reason: `Insufficient VRAM: ${model.name} requires at least ${model.minVramGB}GB VRAM, but your GPU has ${hw.gpuVramGB}GB.`,
        hardware: hw,
        warning: 'High risk of CUDA Out-Of-Memory error. Consider quantized GGUF weights or switch to Google Gemini.',
      };
    }

    if (hw.freeMemoryGB < model.sizeGB) {
      return {
        compatible: true,
        reason: 'Hardware is theoretically compatible, but available system RAM is tight.',
        hardware: hw,
        warning: `Free RAM (${hw.freeMemoryGB} GB) is less than model size (${model.sizeGB} GB). OS swapping may slow down loading.`,
      };
    }

    return {
      compatible: true,
      reason: 'Hardware fully satisfies model requirements.',
      hardware: hw,
    };
  }

  public setModelStatus(modelId: string, status: ModelMetadata['status']): boolean {
    const model = this.models.find((m) => m.id === modelId);
    if (!model) return false;
    model.status = status;
    return true;
  }
}

export const modelService = new ModelService();
