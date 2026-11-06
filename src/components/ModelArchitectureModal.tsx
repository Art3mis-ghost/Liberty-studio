import React from 'react';
import {
  Boxes,
  Sparkles,
  Cpu,
  Video,
  Scissors,
  Mic,
  Film,
  HardDrive,
  ShieldCheck,
  X,
  ExternalLink,
  Zap,
} from 'lucide-react';

interface ModelArchitectureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ModelArchitectureModal: React.FC<ModelArchitectureModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-purple-900/60 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 md:p-8 shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-950/80 border border-purple-800/60">
              <Boxes className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Liberty Studio AI — Models, Tools & Architecture Stack
              </h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                Transparent technical breakdown of all AI models, open-source libraries, and creative processing pipelines.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section 1: Google Gemini Generative AI Engine */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              1. Google Gemini AI Engine (@google/genai SDK)
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-neutral-950/80 border border-purple-900/40 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-purple-300">gemini-3.1-flash-lite-image</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800/50">IMAGE</span>
              </div>
              <p className="text-xs text-neutral-300 font-semibold">Hyper-Realistic Image Generation</p>
              <p className="text-[11px] text-neutral-400 leading-relaxed">
                Generates high-resolution 8k photorealistic images with custom aspect ratios (16:9, 9:16, 1:1, 4:3), raytraced lighting, and fine skin/environmental textures.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-neutral-950/80 border border-purple-900/40 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-purple-300">gemini-omni-1.2-flash</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800/50">VIDEO</span>
              </div>
              <p className="text-xs text-neutral-300 font-semibold">Cinematic Video & Scene Conditioning</p>
              <p className="text-[11px] text-neutral-400 leading-relaxed">
                Synthesizes scene keyframes, optical flow conditioning, and spatiotemporal motion vectors combined with camera kinematics.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-neutral-950/80 border border-purple-900/40 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-purple-300">gemini-3.8-flash</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800/50">DIRECTOR</span>
              </div>
              <p className="text-xs text-neutral-300 font-semibold">Prompt Director & Viral Hook Scoring</p>
              <p className="text-[11px] text-neutral-400 leading-relaxed">
                Acts as a Hollywood cinematographer to expand basic prompts into Arri Alexa camera setups, and analyzes video transcripts to detect viral YouTube Shorts hooks.
              </p>
            </div>
          </div>
        </div>

        {/* Section 2: Local Open-Source AI Models (Offline / Free) */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              2. Open-Weight AI Models (Self-Hosted / Local GPU & CPU)
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-neutral-950/80 border border-neutral-800 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white">SDXL 1.0 & FLUX Variants</span>
                <span className="font-mono text-[10px] text-cyan-400">Diffusion & LoRA</span>
              </div>
              <p className="text-neutral-400 leading-relaxed">
                Open-weight text-to-image foundation models supporting positive/negative prompts, latent seed variation, CFG scale, steps, and ControlNet guidance.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-neutral-950/80 border border-neutral-800 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white">Wan 2.2 (1.3B & 14B)</span>
                <span className="font-mono text-[10px] text-cyan-400">ComfyUI Workflows</span>
              </div>
              <p className="text-neutral-400 leading-relaxed">
                Open video generation models providing text-to-video, image-to-video conditioning, and trajectory-guided camera moves.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-neutral-950/80 border border-neutral-800 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white">OpenAI Whisper / Faster-Whisper</span>
                <span className="font-mono text-[10px] text-emerald-400">Speech-to-Text</span>
              </div>
              <p className="text-neutral-400 leading-relaxed">
                Automated speech recognition for long video audio extraction, transcript timing, and word-level synchronized subtitle generation.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-neutral-950/80 border border-neutral-800 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white">Piper Neural TTS</span>
                <span className="font-mono text-[10px] text-emerald-400">Local Audio</span>
              </div>
              <p className="text-neutral-400 leading-relaxed">
                High-speed local neural text-to-speech engine with multi-voice character acting, speed controls, and zero cloud API latency.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-neutral-950/80 border border-neutral-800 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white">Real-ESRGAN</span>
                <span className="font-mono text-[10px] text-amber-400">Super-Resolution</span>
              </div>
              <p className="text-neutral-400 leading-relaxed">
                Deep neural 4x upscaling and artifact reduction model, restoring high-frequency textures for prints and 4K displays.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-neutral-950/80 border border-neutral-800 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white">RIFE (Optical Flow)</span>
                <span className="font-mono text-[10px] text-amber-400">Frame Interpolation</span>
              </div>
              <p className="text-neutral-400 leading-relaxed">
                Real-time intermediate flow estimation for video frame doubling (24/30fps to 60fps) and cinematic slow-motion rendering.
              </p>
            </div>
          </div>
        </div>

        {/* Section 3: Core Creative Processing Tools */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Film className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              3. Production Video Tools & Media Processing
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-neutral-950/80 border border-neutral-800 space-y-1">
              <span className="font-bold text-white">FFmpeg Engine</span>
              <p className="text-neutral-400 text-[11px]">
                Powers 14 camera presets (Dolly, Pan, Orbit, Crane), H.264 / AAC encoding, 9:16 center cropping, and burned Hormozi animated captions.
              </p>
            </div>
            <div className="p-3 rounded-xl bg-neutral-950/80 border border-neutral-800 space-y-1">
              <span className="font-bold text-white">HTML5 Canvas Studio</span>
              <p className="text-neutral-400 text-[11px]">
                Real-time browser canvas with live color filters, pen annotations, watermark branding, horizontal flipping, and instant exports.
              </p>
            </div>
            <div className="p-3 rounded-xl bg-neutral-950/80 border border-neutral-800 space-y-1">
              <span className="font-bold text-white">YouTube & Stream Importer</span>
              <p className="text-neutral-400 text-[11px]">
                Instant YouTube link parsing, video playback, one-click MP4 downloading, and automated multi-shorts batch generator.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-neutral-800 text-xs">
          <div className="flex items-center gap-2 text-neutral-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Zero mandatory paid dependencies · Fully self-hostable open stack</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-lg transition-colors"
          >
            Close Overview
          </button>
        </div>
      </div>
    </div>
  );
};
