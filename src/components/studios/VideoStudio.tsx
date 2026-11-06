import React, { useState, useRef } from 'react';
import { CameraPreset, BackgroundJob } from '../../types/index.ts';
import { api } from '../../services/api.ts';
import { CanvasMediaEditor } from '../CanvasMediaEditor.tsx';
import { EngineSelector } from '../EngineSelector.tsx';
import {
  Video,
  Play,
  RotateCcw,
  Sparkles,
  Download,
  Film,
  Scissors,
  Wand2,
  Sliders,
  Maximize2,
  Loader2,
  Upload,
  X,
  ImageIcon,
} from 'lucide-react';

interface VideoStudioProps {
  onOpenPromptAssistant: (prompt: string) => void;
  onSendToEditor?: (videoUrl: string) => void;
  onSendToClipping?: (videoUrl: string) => void;
  activeJob: BackgroundJob | null;
  onJobCreated: (jobId: string) => void;
}

export const VideoStudio: React.FC<VideoStudioProps> = ({
  onOpenPromptAssistant,
  onSendToEditor,
  onSendToClipping,
  activeJob,
  onJobCreated,
}) => {
  const [engine, setEngine] = useState<'local' | 'gemini'>('local');
  const [prompt, setPrompt] = useState(
    'Cinematic close-up of a futuristic cyberpunk traveler in a neon rainstorm, glowing visor reflection, 35mm film grain'
  );
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('dolly_in');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16' | '1:1' | '4:5' | '21:9'>('16:9');
  const [duration, setDuration] = useState<number>(4);
  const [fps, setFps] = useState<number>(30);
  const [motionStrength, setMotionStrength] = useState<number>(6);
  const [seed, setSeed] = useState<number>(42891);
  const [sourceImageUrl, setSourceImageUrl] = useState<string>('');
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string>('/storage/generations/sample.mp4');
  const [showVideoEditor, setShowVideoEditor] = useState<boolean>(false);
  const [imageUploading, setImageUploading] = useState<boolean>(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageUploading(true);
    try {
      const res = await api.uploadFile(file);
      setSourceImageUrl(res.url);
    } catch (err) {
      console.error('Image upload failed:', err);
    } finally {
      setImageUploading(false);
    }
  };

  const cameraPresets: Array<{ id: CameraPreset; label: string; desc: string }> = [
    { id: 'dolly_in', label: 'Dolly In', desc: 'Forward camera focal push' },
    { id: 'dolly_out', label: 'Dolly Out', desc: 'Dramatic pull-back reveal' },
    { id: 'zoom_in', label: 'Zoom In', desc: 'Optical focal length increase' },
    { id: 'zoom_out', label: 'Zoom Out', desc: 'Expanding wide angle reveal' },
    { id: 'pan_left', label: 'Pan Left', desc: 'Horizontal lateral sweep' },
    { id: 'pan_right', label: 'Pan Right', desc: 'Horizontal sweep to the right' },
    { id: 'tilt_up', label: 'Tilt Up', desc: 'Vertical upward camera tilt' },
    { id: 'tilt_down', label: 'Tilt Down', desc: 'Vertical downward tilt' },
    { id: 'orbit', label: 'Orbit Arc', desc: '360 subject revolution' },
    { id: 'tracking_shot', label: 'Tracking Shot', desc: 'Subject follow movement' },
    { id: 'crane_shot', label: 'Crane Shot', desc: 'High-altitude vertical boom' },
    { id: 'handheld', label: 'Handheld', desc: 'Organic breathing shake' },
    { id: 'drone_shot', label: 'Drone Shot', desc: 'High sweep aerodynamic arc' },
    { id: 'static', label: 'Static Locked', desc: 'Stable tripod composition' },
  ];

  const [localIsGenerating, setLocalIsGenerating] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const isGenerating = localIsGenerating || Boolean(activeJob && activeJob.type === 'video' && activeJob.status === 'processing');

  const pollJob = (id: string) => {
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
            if (job.result?.videoUrl) {
              setGeneratedVideoUrl(job.result.videoUrl);
            }
          } else if (job.status === 'failed') {
            clearInterval(interval);
            setLocalIsGenerating(false);
            setStatusMessage('');
            setErrorMessage(job.error || 'Video generation failed');
          }
        }
      } catch {
        clearInterval(interval);
        setLocalIsGenerating(false);
      }
    }, 400);
  };

  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) return;
    setErrorMessage('');
    setLocalIsGenerating(true);
    setStatusMessage('Conditioning keyframe & compiling camera movement...');

    try {
      const { jobId } = await api.generateVideo({
        prompt,
        sourceImageUrl: sourceImageUrl || undefined,
        cameraPreset,
        aspectRatio,
        durationSeconds: duration,
        fps,
        motionStrength,
        seed,
        modelId: 'wan-2.2-1.3b',
        engine,
      });
      onJobCreated(jobId);
      pollJob(jobId);
    } catch (err: any) {
      console.error('Video generation error:', err);
      setLocalIsGenerating(false);
      setStatusMessage('');
      setErrorMessage(err.message || 'Video generation failed');
    }
  };

  // If active video job finishes, update video url
  React.useEffect(() => {
    if (activeJob && activeJob.type === 'video' && activeJob.status === 'completed' && activeJob.result?.videoUrl) {
      setGeneratedVideoUrl(activeJob.result.videoUrl);
    }
  }, [activeJob]);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Studio Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-neutral-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white">
              AI Video Studio
            </h1>
            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded border border-purple-800/40 bg-purple-950/60 text-purple-300">
              HIGGSFIELD ARCHITECTURE
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            Generate cinematic video clips with real camera trajectories, motion vectors, and open-weight diffusion backends.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <EngineSelector engine={engine} onEngineChange={setEngine} compact />
          <button
            onClick={() => onOpenPromptAssistant(prompt)}
            className="px-3 py-1.5 text-xs font-medium text-purple-300 bg-purple-950/40 border border-purple-800/50 hover:bg-purple-900/40 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Wand2 className="w-3.5 h-3.5 text-purple-400" />
            <span>Prompt Assistant</span>
          </button>
        </div>
      </div>

      {/* Main Workspace Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Generation Controls (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Prompt Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-neutral-300 font-medium">
              <span>Scene Description Prompt</span>
              <span className="text-neutral-500 font-mono text-[11px]">{prompt.length} chars</span>
            </div>
            <div className="relative">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={4}
                placeholder="Describe your scene in cinematic detail..."
                className="w-full bg-neutral-900/80 border border-neutral-800 rounded-xl p-3.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
              />
            </div>
          </div>

          {/* Keyframe Image Conditioning (Image-to-Video) */}
          <div className="p-3.5 rounded-xl border border-neutral-800 bg-neutral-900/40 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-neutral-200">First-Frame Conditioning (Image-to-Video)</span>
              <input
                type="file"
                ref={imageInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                disabled={imageUploading}
                className="text-[11px] text-purple-400 hover:text-purple-300 font-medium flex items-center gap-1"
              >
                <Upload className="w-3 h-3" />
                <span>{imageUploading ? 'Uploading...' : sourceImageUrl ? 'Change Keyframe' : 'Upload Keyframe Image'}</span>
              </button>
            </div>

            {sourceImageUrl ? (
              <div className="flex items-center justify-between p-2 rounded bg-neutral-950 border border-neutral-800">
                <div className="flex items-center gap-2.5 truncate">
                  <img
                    src={sourceImageUrl}
                    alt="Keyframe"
                    className="w-10 h-10 object-cover rounded border border-neutral-700 shrink-0"
                  />
                  <div className="truncate text-xs">
                    <div className="text-white font-medium truncate">{sourceImageUrl.split('/').pop()}</div>
                    <div className="text-[10px] text-purple-400 font-mono">Image-to-Video Motion Mode Active</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSourceImageUrl('')}
                  className="text-neutral-500 hover:text-white p-1"
                  title="Remove Keyframe"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <p className="text-[11px] text-neutral-500">
                Optional: Upload a starting image or import from Image Studio to animate static artwork with camera motion.
              </p>
            )}
          </div>

          {/* Camera Movements (Higgsfield Presets) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-neutral-200">
                Cinematic Camera Movement
              </label>
              <span className="text-[11px] font-mono text-purple-400 uppercase">
                {cameraPreset.replace('_', ' ')}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {cameraPresets.map((preset) => {
                const isSelected = cameraPreset === preset.id;
                return (
                  <button
                    key={preset.id}
                    onClick={() => setCameraPreset(preset.id)}
                    className={`p-2.5 rounded-lg border text-left transition-colors ${
                      isSelected
                        ? 'bg-purple-600/20 border-purple-500 text-white'
                        : 'bg-neutral-900/60 border-neutral-800 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
                    }`}
                  >
                    <div className="text-xs font-semibold truncate">{preset.label}</div>
                    <div className="text-[10px] text-neutral-500 truncate mt-0.5">{preset.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Video Parameters Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl border border-neutral-800 bg-neutral-900/40">
            {/* Aspect Ratio */}
            <div>
              <label className="block text-[11px] font-medium text-neutral-400 mb-1">
                Aspect Ratio
              </label>
              <select
                value={aspectRatio}
                onChange={(e: any) => setAspectRatio(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500"
              >
                <option value="16:9">16:9 (Landscape)</option>
                <option value="9:16">9:16 (Vertical Reels)</option>
                <option value="1:1">1:1 (Square)</option>
                <option value="4:5">4:5 (Social Feed)</option>
                <option value="21:9">21:9 (Cinemascope)</option>
              </select>
            </div>

            {/* Duration */}
            <div>
              <label className="block text-[11px] font-medium text-neutral-400 mb-1">
                Duration (sec)
              </label>
              <select
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500"
              >
                <option value={3}>3 Seconds</option>
                <option value={4}>4 Seconds</option>
                <option value={6}>6 Seconds</option>
                <option value={8}>8 Seconds</option>
              </select>
            </div>

            {/* FPS */}
            <div>
              <label className="block text-[11px] font-medium text-neutral-400 mb-1">
                Frame Rate
              </label>
              <select
                value={fps}
                onChange={(e) => setFps(Number(e.target.value))}
                className="w-full bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500"
              >
                <option value={24}>24 fps (Cinema)</option>
                <option value={30}>30 fps (Standard)</option>
                <option value={60}>60 fps (Smooth)</option>
              </select>
            </div>

            {/* Seed */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-medium text-neutral-400">
                  Seed
                </label>
                <button
                  onClick={() => setSeed(Math.floor(Math.random() * 999999))}
                  className="text-[10px] text-purple-400 hover:text-purple-300"
                  title="Randomize Seed"
                >
                  Random
                </button>
              </div>
              <input
                type="number"
                value={seed}
                onChange={(e) => setSeed(Number(e.target.value))}
                className="w-full bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          {/* Motion Strength Slider */}
          <div className="space-y-2 p-4 rounded-xl border border-neutral-800 bg-neutral-900/40">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-neutral-300">Camera Motion Dynamics</span>
              <span className="font-mono text-purple-400 font-semibold">{motionStrength} / 10</span>
            </div>
            <input
              type="range"
              min={1}
              max={10}
              value={motionStrength}
              onChange={(e) => setMotionStrength(Number(e.target.value))}
              className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-neutral-500">
              <span>Subtle Micro-motion</span>
              <span>Balanced Cinematic</span>
              <span>Fast Dynamic Sweep</span>
            </div>
          </div>

          {/* Action Trigger */}
          <div className="pt-2">
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
              className="w-full py-3.5 px-6 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-purple-600/20 flex items-center justify-center gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{activeJob?.stage || 'Synthesizing Video Frames...'} ({activeJob?.progress || 0}%)</span>
                </>
              ) : (
                <>
                  <Video className="w-4 h-4" />
                  <span>Generate Cinematic Video ({duration}s @ {fps}fps)</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Video Preview & Output Player (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-900/60 space-y-4">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-white">Preview & Rendered Master</span>
              <span className="font-mono text-[11px] text-neutral-400">
                {aspectRatio} · {fps}fps · H.264
              </span>
            </div>

            {/* Video Player Display */}
            <div
              className={`w-full rounded-lg overflow-hidden bg-black relative border border-neutral-800 flex items-center justify-center ${
                aspectRatio === '9:16' ? 'aspect-[9/16] max-h-[500px] mx-auto' : 'aspect-video'
              }`}
            >
              {generatedVideoUrl ? (
                <video
                  key={generatedVideoUrl}
                  src={generatedVideoUrl}
                  controls
                  autoPlay
                  loop
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="p-8 text-center space-y-2">
                  <Film className="w-8 h-8 text-neutral-600 mx-auto" />
                  <p className="text-xs text-neutral-400">Configure parameters and click Generate to synthesize.</p>
                </div>
              )}

              {/* Progress Overlay if generating */}
              {isGenerating && (
                <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center space-y-3 z-10">
                  <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
                  <div className="text-xs font-semibold text-white">{activeJob?.stage}</div>
                  <div className="w-48 bg-neutral-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-purple-500 h-full transition-all duration-300"
                      style={{ width: `${activeJob?.progress || 10}%` }}
                    />
                  </div>
                  <div className="text-[11px] font-mono text-purple-300">{activeJob?.progress}% complete</div>
                </div>
              )}
            </div>

            {/* Quick Export & Actions Strip */}
            {generatedVideoUrl && (
              <div className="space-y-3 pt-2 border-t border-neutral-800">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowVideoEditor(!showVideoEditor)}
                    className="py-2 px-3 bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-500/40 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <Sliders className="w-3.5 h-3.5 text-purple-400" />
                    <span>{showVideoEditor ? 'Close Editor' : 'Edit Video'}</span>
                  </button>

                  <a
                    href={generatedVideoUrl}
                    download="liberty_cinematic_shot.mp4"
                    className="flex-1 py-2 px-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-100 text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </a>

                  {onSendToEditor && (
                    <button
                      onClick={() => onSendToEditor(generatedVideoUrl)}
                      className="py-2 px-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-100 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5"
                      title="Send to AI Video Editor"
                    >
                      <Film className="w-3.5 h-3.5 text-amber-400" />
                      <span>Timeline</span>
                    </button>
                  )}

                  {onSendToClipping && (
                    <button
                      onClick={() => onSendToClipping(generatedVideoUrl)}
                      className="py-2 px-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-100 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5"
                      title="Extract Viral Clips"
                    >
                      <Scissors className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Clip</span>
                    </button>
                  )}
                </div>

                <div className="p-3 bg-neutral-950 rounded-lg text-[11px] text-neutral-400 font-mono space-y-1">
                  <div>Active Model: Wan 2.2 1.3B DiT</div>
                  <div>Camera Preset: {cameraPreset}</div>
                  <div>Seed: {seed}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Expandable In-Canvas Video Editor */}
      {showVideoEditor && generatedVideoUrl && (
        <div className="pt-6 border-t border-neutral-800">
          <CanvasMediaEditor
            mediaType="video"
            mediaUrl={generatedVideoUrl}
            prompt={prompt}
            onSendToEditor={onSendToEditor}
            onSendToClipping={onSendToClipping}
            onSaveEdited={(newUrl) => setGeneratedVideoUrl(newUrl)}
            onJobCreated={onJobCreated}
            activeJob={activeJob}
          />
        </div>
      )}
    </div>
  );
};
