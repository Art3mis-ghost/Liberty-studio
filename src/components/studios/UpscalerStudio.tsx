import React, { useState, useRef } from 'react';
import { BackgroundJob } from '../../types/index.ts';
import { api } from '../../services/api.ts';
import {
  Sparkles,
  Download,
  CheckCircle2,
  Sliders,
  Layers,
  ZoomIn,
  Loader2,
  Video,
  Image as ImageIcon,
  Upload,
} from 'lucide-react';

interface UpscalerStudioProps {
  activeJob: BackgroundJob | null;
  onJobCreated: (jobId: string) => void;
}

export const UpscalerStudio: React.FC<UpscalerStudioProps> = ({
  activeJob,
  onJobCreated,
}) => {
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [scale, setScale] = useState<2 | 4>(4);
  const [denoise, setDenoise] = useState(true);
  const [sharpen, setSharpen] = useState(true);
  const [interpolateFps, setInterpolateFps] = useState(false);
  const [sourceUrl, setSourceUrl] = useState('/storage/generations/sample_hero.jpg');
  const [enhancedUrl, setEnhancedUrl] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await api.uploadFile(file);
      setSourceUrl(res.url);
      setMediaType(file.type.startsWith('video') ? 'video' : 'image');
    } catch (err) {
      console.error('Upload error in upscaler:', err);
    } finally {
      setUploading(false);
    }
  };

  const isUpscaling = Boolean(activeJob && activeJob.type === 'upscale' && activeJob.status === 'processing');

  const handleUpscale = async () => {
    try {
      const { jobId } = await api.processUpscale({
        inputUrl: sourceUrl,
        type: mediaType,
        scale,
        denoise,
        sharpen,
        interpolateFps: mediaType === 'video' ? interpolateFps : undefined,
      });
      onJobCreated(jobId);
    } catch (err) {
      console.error('Upscale error:', err);
    }
  };

  React.useEffect(() => {
    if (activeJob && activeJob.type === 'upscale' && activeJob.status === 'completed' && activeJob.result?.outputUrl) {
      setEnhancedUrl(activeJob.result.outputUrl);
    }
  }, [activeJob]);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-neutral-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white">
              AI Upscaler & Enhancer
            </h1>
            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded border border-indigo-800/40 bg-indigo-950/60 text-indigo-300">
              REAL-ESRGAN / RIFE PIPELINE
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            Super-resolution 2x/4x magnification, artifact noise removal, unsharp texture recovery, and 60fps frame interpolation.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Controls Column (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-5 rounded-xl border border-neutral-800 bg-neutral-900/60 space-y-4">
            <div className="text-xs font-semibold text-white">Enhancement Parameters</div>

            {/* Media Type Selector */}
            <div>
              <label className="block text-[11px] font-medium text-neutral-400 mb-1.5">Asset Type</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setMediaType('image');
                    setSourceUrl('/storage/generations/sample_hero.jpg');
                  }}
                  className={`py-2 px-3 text-xs font-medium rounded-lg border transition-colors flex items-center justify-center gap-1.5 ${
                    mediaType === 'image'
                      ? 'bg-indigo-600/20 border-indigo-500 text-white'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Image Upscale</span>
                </button>
                <button
                  onClick={() => {
                    setMediaType('video');
                    setSourceUrl('/storage/generations/sample.mp4');
                  }}
                  className={`py-2 px-3 text-xs font-medium rounded-lg border transition-colors flex items-center justify-center gap-1.5 ${
                    mediaType === 'video'
                      ? 'bg-indigo-600/20 border-indigo-500 text-white'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>Video Enhance</span>
                </button>
              </div>

              {/* Upload custom file */}
              <div className="mt-2.5">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept={mediaType === 'video' ? 'video/*' : 'image/*'}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="w-full py-1.5 px-3 bg-neutral-950 border border-neutral-800 hover:border-neutral-700 text-neutral-300 rounded text-xs font-medium flex items-center justify-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{uploading ? 'Uploading...' : `Upload Custom ${mediaType === 'video' ? 'Video' : 'Image'}`}</span>
                </button>
                <div className="text-[10px] text-neutral-500 font-mono mt-1 truncate">
                  Source: {sourceUrl.split('/').pop()}
                </div>
              </div>
            </div>

            {/* Scale Multiplier */}
            <div>
              <label className="block text-[11px] font-medium text-neutral-400 mb-1.5">Super-Resolution Scale</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setScale(2)}
                  className={`py-2 text-xs font-mono font-bold rounded-lg border transition-colors ${
                    scale === 2
                      ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  2x Super-Res
                </button>
                <button
                  onClick={() => setScale(4)}
                  className={`py-2 text-xs font-mono font-bold rounded-lg border transition-colors ${
                    scale === 4
                      ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  4x Ultra-Res
                </button>
              </div>
            </div>

            {/* Toggles */}
            <div className="space-y-2 pt-2 border-t border-neutral-800">
              <label className="flex items-center justify-between text-xs text-neutral-300 cursor-pointer p-1">
                <span>Denoise & Compression Cleanup</span>
                <input
                  type="checkbox"
                  checked={denoise}
                  onChange={(e) => setDenoise(e.target.checked)}
                  className="rounded border-neutral-700 text-indigo-600 focus:ring-0"
                />
              </label>

              <label className="flex items-center justify-between text-xs text-neutral-300 cursor-pointer p-1">
                <span>Unsharp Texture Sharpening</span>
                <input
                  type="checkbox"
                  checked={sharpen}
                  onChange={(e) => setSharpen(e.target.checked)}
                  className="rounded border-neutral-700 text-indigo-600 focus:ring-0"
                />
              </label>

              {mediaType === 'video' && (
                <label className="flex items-center justify-between text-xs text-neutral-300 cursor-pointer p-1">
                  <span>60 FPS Frame Interpolation (RIFE)</span>
                  <input
                    type="checkbox"
                    checked={interpolateFps}
                    onChange={(e) => setInterpolateFps(e.target.checked)}
                    className="rounded border-neutral-700 text-indigo-600 focus:ring-0"
                  />
                </label>
              )}
            </div>

            <button
              onClick={handleUpscale}
              disabled={isUpscaling}
              className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-2 mt-4"
            >
              {isUpscaling ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>{activeJob?.stage || 'Processing Super-Resolution...'}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Execute {scale}x AI Enhancement</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Viewport Column (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-5 rounded-xl border border-neutral-800 bg-neutral-900/60 space-y-4">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-white">Enhanced Canvas Output</span>
              <span className="font-mono text-[11px] text-indigo-400">
                {scale}x Scale · {denoise ? 'Denoised' : ''}
              </span>
            </div>

            <div className="w-full aspect-video rounded-lg overflow-hidden bg-black border border-neutral-800 relative flex items-center justify-center">
              {mediaType === 'video' ? (
                <video
                  key={enhancedUrl || sourceUrl}
                  src={enhancedUrl || sourceUrl}
                  controls
                  className="w-full h-full object-contain"
                />
              ) : (
                <img
                  src={enhancedUrl || sourceUrl}
                  alt="Enhanced view"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              )}

              {isUpscaling && (
                <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center space-y-3 z-10">
                  <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
                  <div className="text-xs font-semibold text-white">{activeJob?.stage}</div>
                  <div className="w-48 bg-neutral-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-indigo-500 h-full transition-all duration-300"
                      style={{ width: `${activeJob?.progress || 10}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {enhancedUrl && (
              <div className="pt-2 border-t border-neutral-800 flex items-center justify-between">
                <span className="text-xs text-emerald-400 font-mono flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Enhanced Output Ready ({scale}x)</span>
                </span>
                <a
                  href={enhancedUrl}
                  download={`liberty_upscaled_${scale}x.${mediaType === 'video' ? 'mp4' : 'jpg'}`}
                  className="py-1.5 px-3 bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Enhanced File</span>
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
