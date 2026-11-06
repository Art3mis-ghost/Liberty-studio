import React, { useState, useEffect } from 'react';
import { StudioTab, HardwareInfo, BackgroundJob, CameraPreset } from '../../types/index.ts';
import { api } from '../../services/api.ts';
import { CanvasMediaEditor } from '../CanvasMediaEditor.tsx';
import { EngineSelector } from '../EngineSelector.tsx';
import { VideoImportShortsHub } from '../VideoImportShortsHub.tsx';
import {
  Video,
  Scissors,
  Image as ImageIcon,
  Film,
  Sparkles,
  Mic,
  Boxes,
  Cpu,
  ArrowRight,
  HardDrive,
  Layers,
  Play,
  Download,
  Wand2,
  Loader2,
  Sliders,
  Crop,
} from 'lucide-react';

interface DashboardStudioProps {
  onSelectTab: (tab: StudioTab) => void;
  hardware: HardwareInfo | null;
  activeJobs: BackgroundJob[];
  activeJob?: BackgroundJob | null;
  onJobCreated?: (jobId: string) => void;
  onOpenPromptAssistant?: (prompt: string) => void;
  onSendToVideoStudio?: (imageUrl: string, promptText: string) => void;
  onSendToClipping?: (videoUrl: string) => void;
  onSendToEditor?: (videoUrl: string) => void;
}

export const DashboardStudio: React.FC<DashboardStudioProps> = ({
  onSelectTab,
  hardware,
  activeJobs,
  activeJob,
  onJobCreated,
  onOpenPromptAssistant,
  onSendToVideoStudio,
  onSendToClipping,
  onSendToEditor,
}) => {
  // Prompt to Canvas generator state
  const [prompt, setPrompt] = useState<string>(
    'Hyperrealistic cinematic shot of a neon cyberpunk android gazing over a rainy futuristic skyline, 35mm film grain, 8k resolution'
  );
  const [genMode, setGenMode] = useState<'image' | 'video'>('image');
  const [imagePreset, setImagePreset] = useState<string>('cinematic');
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('dolly_in');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16' | '1:1'>('16:9');
  const [seed, setSeed] = useState<number>(55412);
  const [engine, setEngine] = useState<'local' | 'gemini'>('local');

  // Rendered Canvas Viewport state
  const [activeMediaUrl, setActiveMediaUrl] = useState<string>('/storage/generations/sample_hero.jpg');
  const [activeMediaType, setActiveMediaType] = useState<'image' | 'video'>('image');
  const [localIsGenerating, setLocalIsGenerating] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Poll job directly for instant reactive updates
  const pollJob = (id: string, type: 'image' | 'video') => {
    const interval = setInterval(async () => {
      try {
        const job = await api.getJob(id);
        if (job) {
          if (job.status === 'processing' || job.status === 'pending') {
            setStatusMessage(`${job.stage} (${job.progress}%)`);
          } else if (job.status === 'completed') {
            clearInterval(interval);
            setLocalIsGenerating(false);
            setStatusMessage('');
            if (type === 'image' && job.result?.imageUrl) {
              setActiveMediaUrl(job.result.imageUrl);
              setActiveMediaType('image');
            } else if (type === 'video' && job.result?.videoUrl) {
              setActiveMediaUrl(job.result.videoUrl);
              setActiveMediaType('video');
            }
          } else if (job.status === 'failed') {
            clearInterval(interval);
            setLocalIsGenerating(false);
            setStatusMessage('');
            setErrorMessage(job.error || 'Generation failed');
          }
        }
      } catch {
        clearInterval(interval);
        setLocalIsGenerating(false);
      }
    }, 400);
  };

  // Listen to background jobs completing from global queue as well
  useEffect(() => {
    if (activeJob && activeJob.status === 'completed') {
      if (activeJob.type === 'image' && activeJob.result?.imageUrl) {
        setActiveMediaUrl(activeJob.result.imageUrl);
        setActiveMediaType('image');
      } else if (activeJob.type === 'video' && activeJob.result?.videoUrl) {
        setActiveMediaUrl(activeJob.result.videoUrl);
        setActiveMediaType('video');
      }
    }
  }, [activeJob]);

  const isGenerating = localIsGenerating || Boolean(
    activeJob &&
    (activeJob.type === 'image' || activeJob.type === 'video') &&
    activeJob.status === 'processing'
  );

  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) return;
    setErrorMessage('');
    setLocalIsGenerating(true);
    setStatusMessage('Submitting request to inference engine...');

    try {
      if (genMode === 'image') {
        const { jobId } = await api.generateImage({
          prompt,
          preset: imagePreset,
          aspectRatio,
          seed,
          modelId: 'sdxl-base-1.0',
          engine,
        });
        if (onJobCreated) onJobCreated(jobId);
        pollJob(jobId, 'image');
      } else {
        const { jobId } = await api.generateVideo({
          prompt,
          cameraPreset,
          aspectRatio,
          durationSeconds: 4,
          fps: 30,
          motionStrength: 6,
          seed,
          modelId: 'wan-2.2-1.3b',
          engine,
        });
        if (onJobCreated) onJobCreated(jobId);
        pollJob(jobId, 'video');
      }
    } catch (err: any) {
      console.error('Unified prompt generation error:', err);
      setLocalIsGenerating(false);
      setStatusMessage('');
      setErrorMessage(err.message || 'Generation failed to start');
    }
  };

  const quickLaunch = [
    {
      tab: 'video' as StudioTab,
      title: 'AI Video Studio',
      badge: 'HIGGSFIELD STYLE',
      badgeColor: 'text-purple-400 bg-purple-950/60 border-purple-800/40',
      description: 'Text-to-video & image-to-video with 14 real cinematic camera moves (Dolly, Pan, Orbit, Crane).',
      icon: Video,
      accent: 'border-purple-500/30 hover:border-purple-500/60',
    },
    {
      tab: 'clipping' as StudioTab,
      title: 'Video Clipping Studio',
      badge: 'KIXY STYLE',
      badgeColor: 'text-cyan-400 bg-cyan-950/60 border-cyan-800/40',
      description: 'Automated long-to-short pipeline: Whisper speech transcription, hook detection & 9:16 vertical reframing.',
      icon: Scissors,
      accent: 'border-cyan-500/30 hover:border-cyan-500/60',
    },
    {
      tab: 'image' as StudioTab,
      title: 'AI Image Studio',
      badge: 'SDXL / FLUX',
      badgeColor: 'text-emerald-400 bg-emerald-950/60 border-emerald-800/40',
      description: 'Open-weight diffusion with photorealistic presets, seed control, aspect ratios & LoRA adapters.',
      icon: ImageIcon,
      accent: 'border-emerald-500/30 hover:border-emerald-500/60',
    },
    {
      tab: 'editor' as StudioTab,
      title: 'AI Video Editor',
      badge: 'FFMPEG MULTI-TRACK',
      badgeColor: 'text-amber-400 bg-amber-950/60 border-amber-800/40',
      description: 'Non-linear timeline editing: video tracks, audio mixing, speed control & burned animated subtitles.',
      icon: Film,
      accent: 'border-amber-500/30 hover:border-amber-500/60',
    },
    {
      tab: 'upscaler' as StudioTab,
      title: 'AI Upscaler & Enhancer',
      badge: 'REAL-ESRGAN / RIFE',
      badgeColor: 'text-indigo-400 bg-indigo-950/60 border-indigo-800/40',
      description: 'Super-resolution 4x image & video upscaling, sharpening, and 60fps frame interpolation.',
      icon: Sparkles,
      accent: 'border-indigo-500/30 hover:border-indigo-500/60',
    },
    {
      tab: 'audio' as StudioTab,
      title: 'AI Audio & Speech Studio',
      badge: 'WHISPER / PIPER',
      badgeColor: 'text-rose-400 bg-rose-950/60 border-rose-800/40',
      description: 'Local neural text-to-speech, speech transcription, audio demuxing, and noise reduction.',
      icon: Mic,
      accent: 'border-rose-500/30 hover:border-rose-500/60',
    },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-10">
      {/* Studio Header & System Summary */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-neutral-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Liberty Studio Dashboard
            </h1>
            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded border border-purple-800/40 bg-purple-950/60 text-purple-300">
              OFFLINE / FREE SOFTWARE
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            Independent open-source creative suite · Zero proprietary API tolls · Open-weights inference & FFmpeg pipelines
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onSelectTab('models')}
            className="px-3.5 py-1.5 text-xs font-medium text-neutral-300 bg-neutral-900 border border-neutral-800 hover:border-neutral-700 rounded-lg transition-colors flex items-center gap-2"
          >
            <Boxes className="w-3.5 h-3.5 text-purple-400" />
            <span>Manage Models</span>
          </button>
          <button
            onClick={() => onSelectTab('hardware')}
            className="px-3.5 py-1.5 text-xs font-medium text-neutral-300 bg-neutral-900 border border-neutral-800 hover:border-neutral-700 rounded-lg transition-colors flex items-center gap-2"
          >
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <span>Hardware Diagnostics</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PRIMARY FEATURE: TEXT PROMPT TO IMAGE/VIDEO CANVAS WITH DIRECT EDITING     */}
      {/* ========================================================================= */}
      <div className="rounded-2xl border border-purple-900/40 bg-gradient-to-b from-[#12101e] to-[#0c0d13] p-6 space-y-6 shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-neutral-800">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <h2 className="text-base font-bold text-white tracking-wide">
                Prompt to Canvas & Live Media Editor
              </h2>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">
              Enter any prompt to synthesize an image or cinematic video, view it directly on the rendered canvas, and perform in-canvas edits in real time.
            </p>
          </div>

          {/* Engine & Mode Controls */}
          <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto">
            <EngineSelector engine={engine} onEngineChange={setEngine} compact />
            
            <div className="flex items-center gap-1.5 bg-neutral-900/90 p-1 rounded-xl border border-neutral-800">
              <button
                onClick={() => setGenMode('image')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  genMode === 'image'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/30'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Generate Image</span>
              </button>
              <button
                onClick={() => setGenMode('video')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  genMode === 'video'
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-900/30'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Video className="w-3.5 h-3.5" />
                <span>Generate Video</span>
              </button>
            </div>
          </div>
        </div>

        {/* Prompt Input Area */}
        <div className="space-y-3">
          <div className="relative">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
              placeholder={
                genMode === 'image'
                  ? 'Describe an image in detail (e.g., Cyberpunk street, volumetric rain, 35mm film...)'
                  : 'Describe a cinematic scene with camera choreography (e.g., Dramatic dolly into neon spaceship bridge...)'
              }
              className="w-full bg-neutral-950/90 border border-neutral-800 rounded-xl p-3.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
            />
            {onOpenPromptAssistant && (
              <button
                type="button"
                onClick={() => onOpenPromptAssistant(prompt)}
                className="absolute right-3 bottom-3 px-2.5 py-1 text-[11px] font-medium text-purple-300 bg-purple-950/60 border border-purple-800/60 hover:bg-purple-900/60 rounded-md transition-colors flex items-center gap-1"
                title="Enhance prompt with structured cinematography"
              >
                <Wand2 className="w-3 h-3 text-purple-400" />
                <span>Enhance</span>
              </button>
            )}
          </div>

          {/* Configuration Controls Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 p-3 rounded-xl bg-neutral-950/60 border border-neutral-800/80">
            {/* Contextual Preset */}
            <div>
              <label className="text-[11px] text-neutral-400 block mb-1">
                {genMode === 'image' ? 'Visual Style Preset' : 'Cinematic Camera Movement'}
              </label>
              {genMode === 'image' ? (
                <select
                  value={imagePreset}
                  onChange={(e) => setImagePreset(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="cinematic">Cinematic Film</option>
                  <option value="photorealistic">Photorealistic</option>
                  <option value="anime">Anime / Manga</option>
                  <option value="portrait">Studio Portrait</option>
                  <option value="concept_art">Concept Art</option>
                  <option value="product">Product Photography</option>
                </select>
              ) : (
                <select
                  value={cameraPreset}
                  onChange={(e: any) => setCameraPreset(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="dolly_in">Dolly In (Focal Push)</option>
                  <option value="dolly_out">Dolly Out (Reveal)</option>
                  <option value="pan_left">Pan Left (Sweep)</option>
                  <option value="pan_right">Pan Right (Sweep)</option>
                  <option value="orbit">Orbit (360 Arc)</option>
                  <option value="crane_shot">Crane Shot (Boom)</option>
                  <option value="drone_shot">Drone Shot (Aerodynamic)</option>
                  <option value="handheld">Handheld (Organic Drift)</option>
                  <option value="tracking_shot">Tracking Shot</option>
                </select>
              )}
            </div>

            {/* Aspect Ratio */}
            <div>
              <label className="text-[11px] text-neutral-400 block mb-1">Canvas Framing</label>
              <select
                value={aspectRatio}
                onChange={(e: any) => setAspectRatio(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500"
              >
                <option value="16:9">16:9 (Landscape Cinema)</option>
                <option value="9:16">9:16 (Vertical Reels / TikTok)</option>
                <option value="1:1">1:1 (Square Format)</option>
              </select>
            </div>

            {/* Seed */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] text-neutral-400">Latent Seed</label>
                <button
                  type="button"
                  onClick={() => setSeed(Math.floor(Math.random() * 999999))}
                  className="text-[10px] text-purple-400 hover:text-purple-300"
                >
                  Randomize
                </button>
              </div>
              <input
                type="number"
                value={seed}
                onChange={(e) => setSeed(Number(e.target.value))}
                className="w-full bg-neutral-900 border border-neutral-800 rounded px-2.5 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            {/* Action Trigger */}
            <div className="flex items-end">
              <button
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating || !prompt.trim()}
                className={`w-full py-2 px-4 rounded-lg text-xs font-bold text-white transition-all flex items-center justify-center gap-1.5 shadow-md ${
                  genMode === 'image'
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-900/30'
                    : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-purple-900/30'
                } disabled:opacity-50`}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Synthesizing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Generate to Canvas</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {statusMessage && (
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-purple-950/40 border border-purple-800/50 text-xs text-purple-200">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-400" />
              <span>{statusMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-rose-950/40 border border-rose-800/50 text-xs text-rose-200">
              <span className="truncate">{errorMessage}</span>
              <button onClick={() => setErrorMessage('')} className="text-rose-400 hover:text-white text-xs ml-2">
                Dismiss
              </button>
            </div>
          )}
        </div>

        {/* Viewport & In-Canvas Editing Console */}
        <div className="pt-2">
          <div className="flex items-center justify-between mb-3 text-xs">
            <span className="font-semibold text-neutral-200 uppercase tracking-wider text-[11px] font-mono">
              Interactive Canvas & Direct Editor
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setActiveMediaUrl('/storage/generations/sample_hero.jpg');
                  setActiveMediaType('image');
                }}
                className={`px-2 py-1 rounded text-[11px] border transition-colors ${
                  activeMediaType === 'image' && activeMediaUrl === '/storage/generations/sample_hero.jpg'
                    ? 'bg-neutral-800 text-white border-neutral-700'
                    : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:text-white'
                }`}
              >
                Sample Keyframe
              </button>
              <button
                onClick={() => {
                  setActiveMediaUrl('/storage/generations/sample.mp4');
                  setActiveMediaType('video');
                }}
                className={`px-2 py-1 rounded text-[11px] border transition-colors ${
                  activeMediaType === 'video' && activeMediaUrl === '/storage/generations/sample.mp4'
                    ? 'bg-neutral-800 text-white border-neutral-700'
                    : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:text-white'
                }`}
              >
                Sample Video Reel
              </button>
            </div>
          </div>

          <CanvasMediaEditor
            mediaType={activeMediaType}
            mediaUrl={activeMediaUrl}
            prompt={prompt}
            onSendToVideoStudio={onSendToVideoStudio}
            onSendToClipping={onSendToClipping}
            onSendToEditor={onSendToEditor}
            onJobCreated={onJobCreated}
            activeJob={activeJob}
          />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECONDARY FEATURE: YOUTUBE LINK / VIDEO UPLOAD & MULTI-SHORTS CREATOR     */}
      {/* ========================================================================= */}
      <VideoImportShortsHub
        onSendToEditor={onSendToEditor}
        onSendToClipping={onSendToClipping}
        onJobCreated={onJobCreated}
      />

      {/* Hardware Telemetry Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-900/60">
          <div className="flex items-center justify-between text-xs text-neutral-400 mb-2">
            <span>Inference Backend</span>
            <Cpu className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-sm font-bold text-white truncate">
            {hardware?.gpuDetected ? hardware.gpuName || 'CUDA GPU' : 'CPU Thread Pool'}
          </div>
          <div className="text-[11px] text-neutral-500 mt-1 font-mono">
            {hardware?.cpuCores ?? 2} Cores · {hardware?.architecture ?? 'x86_64'}
          </div>
        </div>

        <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-900/60">
          <div className="flex items-center justify-between text-xs text-neutral-400 mb-2">
            <span>System Memory</span>
            <Layers className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-sm font-bold text-white tabular-nums">
            {hardware?.freeMemoryGB ?? 3.8} GB free / {hardware?.totalMemoryGB ?? 4.0} GB
          </div>
          <div className="text-[11px] text-neutral-500 mt-1 font-mono">
            {hardware?.gpuVramGB ? `${hardware.gpuVramGB} GB Dedicated VRAM` : 'Unified CPU Memory'}
          </div>
        </div>

        <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-900/60">
          <div className="flex items-center justify-between text-xs text-neutral-400 mb-2">
            <span>Processing Engine</span>
            <HardDrive className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-sm font-bold text-white truncate">
            {hardware?.ffmpegAvailable ? 'FFmpeg H.264 / AAC' : 'Active'}
          </div>
          <div className="text-[11px] text-neutral-500 mt-1 font-mono">
            {hardware?.ffmpegVersion ?? '4.4.2'} · Fast Preset
          </div>
        </div>

        <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-900/60">
          <div className="flex items-center justify-between text-xs text-neutral-400 mb-2">
            <span>Active AI Pipeline</span>
            <Boxes className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-sm font-bold text-white">
            {activeJobs.length > 0 ? `${activeJobs.length} Jobs Running` : 'Idle · Ready'}
          </div>
          <div className="text-[11px] text-neutral-500 mt-1 font-mono">
            ComfyUI Bridge: {hardware?.comfyUiDetected ? 'Connected' : 'Standalone'}
          </div>
        </div>
      </div>

      {/* Workspaces Grid */}
      <div>
        <div className="text-xs font-mono uppercase tracking-wider text-neutral-500 font-semibold mb-4">
          Select Dedicated Workspace
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {quickLaunch.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.tab}
                onClick={() => onSelectTab(item.tab)}
                className={`group p-6 rounded-xl border bg-neutral-900/40 hover:bg-neutral-900/80 transition-all cursor-pointer flex flex-col justify-between ${item.accent}`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-lg bg-neutral-800/80 border border-neutral-700/60 flex items-center justify-center text-white group-hover:scale-105 transition-transform">
                      <Icon className="w-5 h-5 text-purple-400" />
                    </div>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded border font-semibold ${item.badgeColor}`}>
                      {item.badge}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white group-hover:text-purple-300 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs text-neutral-400 mt-2 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-neutral-800/60 flex items-center justify-between text-xs text-neutral-400 group-hover:text-white transition-colors">
                  <span className="font-medium">Launch Workspace</span>
                  <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Featured Starter Generations Feed */}
      <div className="pt-4">
        <div className="flex items-center justify-between mb-4">
          <div className="text-xs font-mono uppercase tracking-wider text-neutral-500 font-semibold">
            Starter Creative Assets & Reel
          </div>
          <button
            onClick={() => onSelectTab('library')}
            className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
          >
            View All in Project Library →
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Sample Video Card */}
          <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-900/50 flex flex-col justify-between">
            <div>
              <div className="aspect-video w-full rounded-lg overflow-hidden bg-black relative group mb-3">
                <video
                  src="/storage/generations/sample.mp4"
                  controls
                  className="w-full h-full object-cover"
                />
              </div>
              <h4 className="text-sm font-semibold text-white">Liberty Studio Demo Reel</h4>
              <p className="text-xs text-neutral-400 mt-1">
                Sample 15-second cinematic test reel with tone generator, ready for instant testing in the Video Clipping Studio.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-neutral-800 flex items-center justify-between">
              <button
                onClick={() => onSelectTab('clipping')}
                className="text-xs font-medium text-cyan-400 hover:text-cyan-300 flex items-center gap-1.5"
              >
                <Scissors className="w-3.5 h-3.5" />
                <span>Extract Viral Clips</span>
              </button>
              <a
                href="/storage/generations/sample.mp4"
                download="liberty_demo_reel.mp4"
                className="text-xs font-mono text-neutral-400 hover:text-white flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5" />
                <span>MP4</span>
              </a>
            </div>
          </div>

          {/* Sample Keyframe Card */}
          <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-900/50 flex flex-col justify-between">
            <div>
              <div className="aspect-video w-full rounded-lg overflow-hidden bg-black relative mb-3">
                <img
                  src="/storage/generations/sample_hero.jpg"
                  alt="Keyframe sample"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
              <h4 className="text-sm font-semibold text-white">Cinematic Keyframe Asset</h4>
              <p className="text-xs text-neutral-400 mt-1">
                High-resolution keyframe available as input for image-to-video camera motion or 4x super-resolution upscaling.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-neutral-800 flex items-center justify-between">
              <button
                onClick={() => onSelectTab('video')}
                className="text-xs font-medium text-purple-400 hover:text-purple-300 flex items-center gap-1.5"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Animate with Camera Preset</span>
              </button>
              <a
                href="/storage/generations/sample_hero.jpg"
                download="keyframe_asset.jpg"
                className="text-xs font-mono text-neutral-400 hover:text-white flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5" />
                <span>JPG</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
