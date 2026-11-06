import React, { useState, useRef } from 'react';
import { BackgroundJob } from '../../types/index.ts';
import { api } from '../../services/api.ts';
import { CanvasMediaEditor } from '../CanvasMediaEditor.tsx';
import { EngineSelector } from '../EngineSelector.tsx';
import {
  Image as ImageIcon,
  Sparkles,
  Download,
  Video,
  Wand2,
  Sliders,
  RefreshCw,
  Layers,
  ZoomIn,
  Loader2,
  Upload,
  X,
} from 'lucide-react';

interface ImageStudioProps {
  onOpenPromptAssistant: (prompt: string) => void;
  onSendToVideoStudio?: (imageUrl: string, prompt: string) => void;
  activeJob: BackgroundJob | null;
  onJobCreated: (jobId: string) => void;
}

export const ImageStudio: React.FC<ImageStudioProps> = ({
  onOpenPromptAssistant,
  onSendToVideoStudio,
  activeJob,
  onJobCreated,
}) => {
  const [engine, setEngine] = useState<'local' | 'gemini'>('local');
  const [prompt, setPrompt] = useState(
    'Hyperrealistic cinematic portrait of a cybernetic architect in rain, soft diffused volumetric lighting, 35mm lens, 8k resolution'
  );
  const [negativePrompt, setNegativePrompt] = useState(
    'blurry, low resolution, duplicate, distorted hands, plastic wax skin'
  );
  const [preset, setPreset] = useState('cinematic');
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [seed, setSeed] = useState(78912);
  const [steps, setSteps] = useState(28);
  const [cfgScale, setCfgScale] = useState(7.0);
  const [modelId, setModelId] = useState('sdxl-base-1.0');
  const [currentImageUrl, setCurrentImageUrl] = useState('/storage/generations/sample_hero.jpg');
  const [showCanvasEditor, setShowCanvasEditor] = useState(false);
  const [refImageUrl, setRefImageUrl] = useState('');
  const [refUploading, setRefUploading] = useState(false);
  const refInputRef = useRef<HTMLInputElement>(null);

  const handleRefUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setRefUploading(true);
    try {
      const res = await api.uploadFile(file);
      setRefImageUrl(res.url);
    } catch (err) {
      console.error('Reference image upload error:', err);
    } finally {
      setRefUploading(false);
    }
  };

  const presets = [
    { id: 'cinematic', label: 'Cinematic Film' },
    { id: 'photorealistic', label: 'Photorealistic' },
    { id: 'anime', label: 'Anime / Manga' },
    { id: 'portrait', label: 'Studio Portrait' },
    { id: 'architecture', label: 'Architecture' },
    { id: 'product', label: 'Product Photography' },
    { id: 'concept_art', label: 'Concept Art' },
    { id: 'advertising', label: 'Advertising Commercial' },
  ];

  const [localIsGenerating, setLocalIsGenerating] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const isGenerating = localIsGenerating || Boolean(activeJob && activeJob.type === 'image' && activeJob.status === 'processing');

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
            if (job.result?.imageUrl) {
              setCurrentImageUrl(job.result.imageUrl);
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

  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) return;
    setErrorMessage('');
    setLocalIsGenerating(true);
    setStatusMessage('Initializing model & conditioning latent space...');

    try {
      const { jobId } = await api.generateImage({
        prompt,
        negativePrompt,
        preset,
        aspectRatio,
        seed,
        steps,
        cfgScale,
        modelId,
        engine,
      });
      onJobCreated(jobId);
      pollJob(jobId);
    } catch (err: any) {
      console.error('Image generation error:', err);
      setLocalIsGenerating(false);
      setStatusMessage('');
      setErrorMessage(err.message || 'Generation failed');
    }
  };

  React.useEffect(() => {
    if (activeJob && activeJob.type === 'image' && activeJob.status === 'completed' && activeJob.result?.imageUrl) {
      setCurrentImageUrl(activeJob.result.imageUrl);
    }
  }, [activeJob]);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-neutral-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white">
              AI Image Studio
            </h1>
            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded border border-emerald-800/40 bg-emerald-950/60 text-emerald-300">
              SDXL / FLUX COMPLIANT
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            Generate high-resolution keyframes, textures, and visual assets with open-weight diffusion and latent control.
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Controls Column (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Prompt */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-neutral-300 font-medium">
              <span>Text Prompt</span>
              <span className="text-neutral-500 font-mono text-[11px]">{prompt.length} chars</span>
            </div>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
              placeholder="A futuristic scene with rich textures..."
              className="w-full bg-neutral-900/80 border border-neutral-800 rounded-xl p-3.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* Negative Prompt */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-medium text-neutral-400">Negative Prompt</span>
            <input
              type="text"
              value={negativePrompt}
              onChange={(e) => setNegativePrompt(e.target.value)}
              className="w-full bg-neutral-900/80 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-300 placeholder-neutral-600 focus:outline-none focus:border-purple-500 font-mono"
            />
          </div>

          {/* Reference Image Conditioning (Image-to-Image / Style Transfer) */}
          <div className="p-3.5 rounded-xl border border-neutral-800 bg-neutral-900/40 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-neutral-200">Image-to-Image / Style Reference</span>
              <input
                type="file"
                ref={refInputRef}
                onChange={handleRefUpload}
                accept="image/*"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => refInputRef.current?.click()}
                disabled={refUploading}
                className="text-[11px] text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1"
              >
                <Upload className="w-3 h-3" />
                <span>{refUploading ? 'Uploading...' : refImageUrl ? 'Change Image' : 'Upload Reference Image'}</span>
              </button>
            </div>

            {refImageUrl ? (
              <div className="flex items-center justify-between p-2 rounded bg-neutral-950 border border-neutral-800">
                <div className="flex items-center gap-2.5 truncate">
                  <img
                    src={refImageUrl}
                    alt="Reference"
                    className="w-10 h-10 object-cover rounded border border-neutral-700 shrink-0"
                  />
                  <div className="truncate text-xs">
                    <div className="text-white font-medium truncate">{refImageUrl.split('/').pop()}</div>
                    <div className="text-[10px] text-emerald-400 font-mono">Image-to-Image Conditioning Active</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setRefImageUrl('')}
                  className="text-neutral-500 hover:text-white p-1"
                  title="Remove Reference"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <p className="text-[11px] text-neutral-500">
                Optional: Upload a reference image to condition generation style, composition, or character features.
              </p>
            )}
          </div>

          {/* Style Presets */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-neutral-200">Creative Style Preset</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {presets.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPreset(p.id)}
                  className={`p-2 rounded-lg border text-xs text-left transition-colors truncate ${
                    preset === p.id
                      ? 'bg-purple-600/20 border-purple-500 text-white font-semibold'
                      : 'bg-neutral-900/60 border-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Parameters Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl border border-neutral-800 bg-neutral-900/40">
            <div>
              <label className="block text-[11px] font-medium text-neutral-400 mb-1">Aspect Ratio</label>
              <select
                value={aspectRatio}
                onChange={(e) => setAspectRatio(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500"
              >
                <option value="16:9">16:9 (Cinema)</option>
                <option value="1:1">1:1 (Square)</option>
                <option value="9:16">9:16 (Portrait)</option>
                <option value="4:3">4:3 (Standard)</option>
                <option value="21:9">21:9 (Ultrawide)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-neutral-400 mb-1">Model Architecture</label>
              <select
                value={modelId}
                onChange={(e) => setModelId(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500"
              >
                <option value="sdxl-base-1.0">SDXL 1.0 Base</option>
                <option value="flux.1-schnell">FLUX.1 [schnell]</option>
                <option value="dreamshaper-xl-turbo">DreamShaper XL</option>
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-medium text-neutral-400">Seed</label>
                <button
                  onClick={() => setSeed(Math.floor(Math.random() * 999999))}
                  className="text-[10px] text-purple-400"
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

            <div>
              <label className="block text-[11px] font-medium text-neutral-400 mb-1">CFG Scale ({cfgScale})</label>
              <input
                type="range"
                min={1}
                max={15}
                step={0.5}
                value={cfgScale}
                onChange={(e) => setCfgScale(Number(e.target.value))}
                className="w-full h-1.5 bg-neutral-800 rounded-lg mt-2 appearance-none cursor-pointer"
              />
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim()}
            className="w-full py-3.5 px-6 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{activeJob?.stage || 'Generating Latent Image...'} ({activeJob?.progress || 0}%)</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate High-Resolution Image</span>
              </>
            )}
          </button>
        </div>

        {/* Preview Column (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-900/60 space-y-4">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-white">Rendered Image Canvas</span>
              <span className="font-mono text-[11px] text-neutral-400">{aspectRatio} · {preset}</span>
            </div>

            <div className="w-full aspect-video rounded-lg overflow-hidden bg-black border border-neutral-800 relative flex items-center justify-center">
              {currentImageUrl ? (
                <img
                  src={currentImageUrl}
                  alt="Generated asset"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-center p-8 space-y-2">
                  <ImageIcon className="w-8 h-8 text-neutral-600 mx-auto" />
                  <p className="text-xs text-neutral-400">Generate an image to view output</p>
                </div>
              )}

              {isGenerating && (
                <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center space-y-3 z-10">
                  <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
                  <div className="text-xs font-semibold text-white">{activeJob?.stage}</div>
                  <div className="w-48 bg-neutral-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full transition-all duration-300"
                      style={{ width: `${activeJob?.progress || 10}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {currentImageUrl && (
              <div className="space-y-3 pt-2 border-t border-neutral-800">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowCanvasEditor(!showCanvasEditor)}
                    className="py-2 px-3 bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-200 border border-emerald-500/40 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <Sliders className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{showCanvasEditor ? 'Close Canvas Editor' : 'Edit on Canvas'}</span>
                  </button>

                  <a
                    href={currentImageUrl}
                    download="liberty_image_generation.jpg"
                    className="flex-1 py-2 px-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-100 text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </a>

                  {onSendToVideoStudio && (
                    <button
                      onClick={() => onSendToVideoStudio(currentImageUrl, prompt)}
                      className="py-2 px-3 bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-500/40 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5"
                      title="Send as Keyframe to AI Video Studio"
                    >
                      <Video className="w-3.5 h-3.5 text-purple-400" />
                      <span>Animate</span>
                    </button>
                  )}
                </div>

                <div className="p-3 bg-neutral-950 rounded-lg text-[11px] text-neutral-400 font-mono space-y-1">
                  <div>Model: {modelId}</div>
                  <div>Seed: {seed} · Steps: {steps}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Expandable In-Canvas Media Editor */}
      {showCanvasEditor && currentImageUrl && (
        <div className="pt-6 border-t border-neutral-800">
          <CanvasMediaEditor
            mediaType="image"
            mediaUrl={currentImageUrl}
            prompt={prompt}
            onSendToVideoStudio={onSendToVideoStudio}
            onSaveEdited={(newUrl) => setCurrentImageUrl(newUrl)}
          />
        </div>
      )}
    </div>
  );
};
