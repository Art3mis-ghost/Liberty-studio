import React, { useState, useRef, useEffect } from 'react';
import { api } from '../services/api.ts';
import { BackgroundJob } from '../types/index.ts';
import {
  Sliders,
  Sparkles,
  Download,
  Video,
  Film,
  Crop,
  Type,
  FlipHorizontal,
  Wand2,
  Check,
  RefreshCw,
  Scissors,
  Volume2,
  VolumeX,
  Layers,
  Loader2,
  ArrowRight,
  Sun,
  Contrast,
  Palette,
} from 'lucide-react';

export interface CanvasMediaEditorProps {
  mediaType: 'image' | 'video';
  mediaUrl: string;
  prompt?: string;
  onSendToVideoStudio?: (imageUrl: string, promptText: string) => void;
  onSendToEditor?: (videoUrl: string) => void;
  onSendToClipping?: (videoUrl: string) => void;
  onSaveEdited?: (newUrl: string) => void;
  onJobCreated?: (jobId: string) => void;
  activeJob?: BackgroundJob | null;
}

export const CanvasMediaEditor: React.FC<CanvasMediaEditorProps> = ({
  mediaType,
  mediaUrl,
  prompt = '',
  onSendToVideoStudio,
  onSendToEditor,
  onSendToClipping,
  onSaveEdited,
  onJobCreated,
  activeJob,
}) => {
  // Mode selection for image
  const [activeTool, setActiveTool] = useState<'filters' | 'presets' | 'text' | 'crop'>('filters');

  // --- Image Canvas Adjustments ---
  const [brightness, setBrightness] = useState<number>(100);
  const [contrast, setContrast] = useState<number>(100);
  const [saturation, setSaturation] = useState<number>(100);
  const [warmth, setWarmth] = useState<number>(0);
  const [blur, setBlur] = useState<number>(0);
  const [invert, setInvert] = useState<boolean>(false);
  const [isFlippedH, setIsFlippedH] = useState<boolean>(false);
  const [imageLut, setImageLut] = useState<string>('normal');
  const [captionText, setCaptionText] = useState<string>('');
  const [captionPosition, setCaptionPosition] = useState<'top' | 'center' | 'bottom'>('bottom');
  const [captionColor, setCaptionColor] = useState<string>('#ffffff');
  const [captionSize, setCaptionSize] = useState<number>(24);
  const [captionBg, setCaptionBg] = useState<boolean>(true);
  const [imageCropRatio, setImageCropRatio] = useState<string>('original');
  const [isSavingImage, setIsSavingImage] = useState<boolean>(false);

  // --- Video Editor Controls ---
  const [videoTrimStart, setVideoTrimStart] = useState<number>(0);
  const [videoTrimEnd, setVideoTrimEnd] = useState<number>(0);
  const [videoDuration, setVideoDuration] = useState<number>(4);
  const [videoSpeed, setVideoSpeed] = useState<number>(1.0);
  const [videoFilter, setVideoFilter] = useState<string>('none');
  const [videoCrop, setVideoCrop] = useState<string>('original');
  const [videoTextOverlay, setVideoTextOverlay] = useState<string>('');
  const [videoTextPos, setVideoTextPos] = useState<'bottom' | 'top' | 'center'>('bottom');
  const [videoMute, setVideoMute] = useState<boolean>(false);
  const [currentVideoUrl, setCurrentVideoUrl] = useState<string>(mediaUrl);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageObjRef = useRef<HTMLImageElement | null>(null);
  const videoPlayerRef = useRef<HTMLVideoElement | null>(null);

  // Sync mediaUrl changes
  useEffect(() => {
    if (mediaType === 'video') {
      setCurrentVideoUrl(mediaUrl);
    }
  }, [mediaUrl, mediaType]);

  // Handle activeJob updates for edited video
  useEffect(() => {
    if (
      activeJob &&
      activeJob.status === 'completed' &&
      activeJob.result?.videoUrl &&
      activeJob.type === 'video'
    ) {
      setCurrentVideoUrl(activeJob.result.videoUrl);
      if (onSaveEdited) {
        onSaveEdited(activeJob.result.videoUrl);
      }
    }
  }, [activeJob, onSaveEdited]);

  // Load and render image to canvas
  useEffect(() => {
    if (mediaType !== 'image' || !mediaUrl) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = mediaUrl;
    img.onload = () => {
      imageObjRef.current = img;
      renderImageCanvas();
    };
    img.onerror = () => {
      // Fallback without anonymous crossOrigin
      const fallbackImg = new Image();
      fallbackImg.src = mediaUrl;
      fallbackImg.onload = () => {
        imageObjRef.current = fallbackImg;
        renderImageCanvas();
      };
    };
  }, [mediaType, mediaUrl]);

  // Re-render canvas whenever filters, text, or crop changes
  useEffect(() => {
    if (mediaType === 'image' && imageObjRef.current) {
      renderImageCanvas();
    }
  }, [
    brightness,
    contrast,
    saturation,
    warmth,
    blur,
    invert,
    isFlippedH,
    imageLut,
    captionText,
    captionPosition,
    captionColor,
    captionSize,
    captionBg,
    imageCropRatio,
    mediaType,
  ]);

  const renderImageCanvas = () => {
    const img = imageObjRef.current;
    const canvas = canvasRef.current;
    if (!img || !canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Calculate crop dimensions
    let srcX = 0;
    let srcY = 0;
    let srcW = img.naturalWidth || img.width;
    let srcH = img.naturalHeight || img.height;

    if (imageCropRatio === '16:9') {
      const targetRatio = 16 / 9;
      if (srcW / srcH > targetRatio) {
        const newW = srcH * targetRatio;
        srcX = (srcW - newW) / 2;
        srcW = newW;
      } else {
        const newH = srcW / targetRatio;
        srcY = (srcH - newH) / 2;
        srcH = newH;
      }
    } else if (imageCropRatio === '9:16') {
      const targetRatio = 9 / 16;
      if (srcW / srcH > targetRatio) {
        const newW = srcH * targetRatio;
        srcX = (srcW - newW) / 2;
        srcW = newW;
      } else {
        const newH = srcW / targetRatio;
        srcY = (srcH - newH) / 2;
        srcH = newH;
      }
    } else if (imageCropRatio === '1:1') {
      const size = Math.min(srcW, srcH);
      srcX = (srcW - size) / 2;
      srcY = (srcH - size) / 2;
      srcW = size;
      srcH = size;
    } else if (imageCropRatio === '4:5') {
      const targetRatio = 4 / 5;
      if (srcW / srcH > targetRatio) {
        const newW = srcH * targetRatio;
        srcX = (srcW - newW) / 2;
        srcW = newW;
      } else {
        const newH = srcW / targetRatio;
        srcY = (srcH - newH) / 2;
        srcH = newH;
      }
    }

    // Set canvas dimensions
    canvas.width = srcW;
    canvas.height = srcH;

    // Build filter string
    let filterString = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
    if (blur > 0) filterString += ` blur(${blur}px)`;
    if (invert) filterString += ` invert(100%)`;
    if (warmth > 0) filterString += ` sepia(${warmth}%)`;

    // Presets
    if (imageLut === 'teal_orange') {
      filterString += ` contrast(120%) saturate(130%) hue-rotate(-10deg)`;
    } else if (imageLut === 'cyber_neon') {
      filterString += ` contrast(135%) saturate(160%) hue-rotate(45deg)`;
    } else if (imageLut === 'noir') {
      filterString += ` grayscale(100%) contrast(140%) brightness(95%)`;
    } else if (imageLut === 'vintage') {
      filterString += ` sepia(45%) contrast(110%) brightness(105%) saturate(90%)`;
    } else if (imageLut === 'emerald') {
      filterString += ` hue-rotate(80deg) saturate(130%) contrast(110%)`;
    }

    ctx.save();
    ctx.filter = filterString;

    // Horizontal flip
    if (isFlippedH) {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, canvas.width, canvas.height);
    ctx.restore();

    // Text Caption overlay
    if (captionText.trim().length > 0) {
      ctx.save();
      const fontSize = Math.max(14, Math.round((canvas.width / 800) * captionSize));
      ctx.font = `bold ${fontSize}px 'Plus Jakarta Sans', sans-serif`;
      ctx.textAlign = 'center';

      let y = canvas.height - fontSize - 24;
      if (captionPosition === 'top') {
        y = fontSize + 24;
      } else if (captionPosition === 'center') {
        y = canvas.height / 2;
      }

      // Background banner if enabled
      if (captionBg) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        const textMetrics = ctx.measureText(captionText);
        const paddingX = 24;
        const bannerH = fontSize * 1.6;
        ctx.fillRect(
          (canvas.width - textMetrics.width) / 2 - paddingX,
          y - fontSize * 0.9,
          textMetrics.width + paddingX * 2,
          bannerH
        );
      }

      // Text stroke and fill
      ctx.fillStyle = captionColor;
      ctx.fillText(captionText, canvas.width / 2, y);
      ctx.restore();
    }
  };

  // Reset image filters to default
  const handleResetImageFilters = () => {
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    setWarmth(0);
    setBlur(0);
    setInvert(false);
    setIsFlippedH(false);
    setImageLut('normal');
    setCaptionText('');
    setImageCropRatio('original');
  };

  // Save edited image
  const handleSaveEditedImage = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsSavingImage(true);
    try {
      canvas.toBlob(async (blob) => {
        if (!blob) {
          setIsSavingImage(false);
          return;
        }
        const file = new File([blob], `liberty_edit_${Date.now()}.png`, { type: 'image/png' });
        const res = await api.uploadFile(file);

        // Download locally
        const a = document.createElement('a');
        a.href = res.url;
        a.download = `liberty_edited_image_${Date.now()}.png`;
        a.click();

        if (onSaveEdited) {
          onSaveEdited(res.url);
        }
        setIsSavingImage(false);
      }, 'image/png');
    } catch (err) {
      console.error('Save edited image failed:', err);
      setIsSavingImage(false);
    }
  };

  // Handle Video Metadata Loaded
  const handleVideoLoadedMetadata = () => {
    if (videoPlayerRef.current) {
      const dur = Math.round(videoPlayerRef.current.duration) || 4;
      setVideoDuration(dur);
      setVideoTrimEnd(dur);
    }
  };

  const isRenderingVideoEdit = Boolean(
    activeJob && activeJob.type === 'video' && activeJob.status === 'processing'
  );

  // Apply edits to video via FFmpeg
  const handleApplyVideoEdits = async () => {
    if (isRenderingVideoEdit) return;

    try {
      const { jobId } = await api.editVideo({
        sourceVideoUrl: currentVideoUrl,
        trimStart: videoTrimStart > 0 ? videoTrimStart : undefined,
        trimEnd: videoTrimEnd > 0 && videoTrimEnd > videoTrimStart ? videoTrimEnd : undefined,
        speed: videoSpeed,
        filter: videoFilter,
        aspectRatio: videoCrop !== 'original' ? videoCrop : undefined,
        textOverlay: videoTextOverlay.trim() ? videoTextOverlay.trim() : undefined,
        textPosition: videoTextPos,
        muteAudio: videoMute,
      });

      if (onJobCreated) {
        onJobCreated(jobId);
      }
    } catch (err) {
      console.error('Apply video edits failed:', err);
    }
  };

  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-900/70 p-6 space-y-6 shadow-2xl">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
            {mediaType === 'image' ? <Crop className="w-4 h-4" /> : <Film className="w-4 h-4" />}
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Direct In-Canvas Editor</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-purple-800/40 bg-purple-950/60 text-purple-300">
                {mediaType === 'image' ? 'HTML5 CANVAS ENGINE' : 'FFMPEG COLOR & TRIM'}
              </span>
            </h3>
            <p className="text-[11px] text-neutral-400">
              {mediaType === 'image'
                ? 'Adjust color balance, apply film LUTs, burn text titles, and crop frame dimensions.'
                : 'Trim start/end points, shift playback velocity, apply color grading, and burn subtitles.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {mediaType === 'image' && (
            <button
              onClick={handleResetImageFilters}
              className="px-2.5 py-1.5 text-xs text-neutral-400 hover:text-white bg-neutral-950 border border-neutral-800 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}

          {mediaType === 'image' ? (
            <button
              onClick={handleSaveEditedImage}
              disabled={isSavingImage}
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 rounded-lg transition-all flex items-center gap-1.5 shadow-md shadow-emerald-900/30"
            >
              {isSavingImage ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              <span>{isSavingImage ? 'Exporting...' : 'Save & Download'}</span>
            </button>
          ) : (
            <button
              onClick={handleApplyVideoEdits}
              disabled={isRenderingVideoEdit}
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 rounded-lg transition-all flex items-center gap-1.5 shadow-md shadow-purple-900/30"
            >
              {isRenderingVideoEdit ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Rendering ({activeJob?.progress || 0}%)...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Render Edited Video</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Main Dual Grid: Viewport Canvas + Editing Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Viewport Canvas (7 Cols) */}
        <div className="lg:col-span-7 space-y-3">
          <div className="w-full aspect-video rounded-xl overflow-hidden bg-black border border-neutral-800 relative flex items-center justify-center shadow-inner">
            {mediaType === 'image' ? (
              <div className="relative w-full h-full flex items-center justify-center">
                <canvas
                  ref={canvasRef}
                  className="max-w-full max-h-full object-contain rounded"
                />
                {!imageObjRef.current && mediaUrl && (
                  <img
                    src={mediaUrl}
                    alt="Current Generation"
                    className="max-w-full max-h-full object-contain absolute inset-0 m-auto"
                  />
                )}
              </div>
            ) : (
              <video
                key={currentVideoUrl}
                ref={videoPlayerRef}
                src={currentVideoUrl}
                onLoadedMetadata={handleVideoLoadedMetadata}
                controls
                autoPlay
                loop
                className="max-w-full max-h-full object-contain"
              />
            )}

            {/* Video Processing Overlay */}
            {isRenderingVideoEdit && (
              <div className="absolute inset-0 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center space-y-3 z-20">
                <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
                <div className="text-xs font-semibold text-white">
                  {activeJob?.stage || 'Encoding Edited Video...'}
                </div>
                <div className="w-48 bg-neutral-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-purple-500 h-full transition-all duration-300"
                    style={{ width: `${activeJob?.progress || 10}%` }}
                  />
                </div>
                <div className="text-[11px] font-mono text-purple-300">
                  {activeJob?.progress}% complete
                </div>
              </div>
            )}
          </div>

          {/* Quick Hand-Off Row */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
            <div className="text-[11px] text-neutral-400 font-mono truncate max-w-xs">
              {prompt ? `Prompt: "${prompt.slice(0, 45)}..."` : 'Liberty Canvas Active'}
            </div>

            <div className="flex items-center gap-2">
              {mediaType === 'image' && onSendToVideoStudio && (
                <button
                  onClick={() => onSendToVideoStudio(mediaUrl, prompt)}
                  className="px-2.5 py-1 text-xs text-purple-300 bg-purple-950/40 hover:bg-purple-900/60 border border-purple-800/50 rounded-lg transition-colors flex items-center gap-1.5"
                  title="Send to AI Video Studio as starting keyframe"
                >
                  <Video className="w-3 h-3 text-purple-400" />
                  <span>Animate Keyframe</span>
                </button>
              )}

              {mediaType === 'video' && onSendToClipping && (
                <button
                  onClick={() => onSendToClipping(currentVideoUrl)}
                  className="px-2.5 py-1 text-xs text-cyan-300 bg-cyan-950/40 hover:bg-cyan-900/60 border border-cyan-800/50 rounded-lg transition-colors flex items-center gap-1.5"
                  title="Extract vertical clips with subtitles"
                >
                  <Scissors className="w-3 h-3 text-cyan-400" />
                  <span>Clip for Shorts</span>
                </button>
              )}

              {mediaType === 'video' && onSendToEditor && (
                <button
                  onClick={() => onSendToEditor(currentVideoUrl)}
                  className="px-2.5 py-1 text-xs text-amber-300 bg-amber-950/40 hover:bg-amber-900/60 border border-amber-800/50 rounded-lg transition-colors flex items-center gap-1.5"
                  title="Open in Multi-Track Timeline"
                >
                  <Film className="w-3 h-3 text-amber-400" />
                  <span>Timeline</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Editing Controls (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          {mediaType === 'image' ? (
            /* IMAGE EDITING TOOLBOX */
            <div className="space-y-4 bg-neutral-950/70 p-4 rounded-xl border border-neutral-800">
              {/* Tool tabs */}
              <div className="grid grid-cols-4 gap-1 p-1 bg-neutral-900 rounded-lg text-xs font-medium">
                <button
                  onClick={() => setActiveTool('filters')}
                  className={`py-1.5 rounded transition-colors ${
                    activeTool === 'filters'
                      ? 'bg-neutral-800 text-white shadow-sm'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Sliders
                </button>
                <button
                  onClick={() => setActiveTool('presets')}
                  className={`py-1.5 rounded transition-colors ${
                    activeTool === 'presets'
                      ? 'bg-neutral-800 text-white shadow-sm'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  LUTs
                </button>
                <button
                  onClick={() => setActiveTool('text')}
                  className={`py-1.5 rounded transition-colors ${
                    activeTool === 'text'
                      ? 'bg-neutral-800 text-white shadow-sm'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Caption
                </button>
                <button
                  onClick={() => setActiveTool('crop')}
                  className={`py-1.5 rounded transition-colors ${
                    activeTool === 'crop'
                      ? 'bg-neutral-800 text-white shadow-sm'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Crop
                </button>
              </div>

              {/* Sub-tab: Sliders */}
              {activeTool === 'filters' && (
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-[11px] text-neutral-400 mb-1">
                      <span>Brightness</span>
                      <span className="font-mono">{brightness}%</span>
                    </div>
                    <input
                      type="range"
                      min={40}
                      max={180}
                      value={brightness}
                      onChange={(e) => setBrightness(Number(e.target.value))}
                      className="w-full h-1.5 bg-neutral-800 rounded appearance-none cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] text-neutral-400 mb-1">
                      <span>Contrast</span>
                      <span className="font-mono">{contrast}%</span>
                    </div>
                    <input
                      type="range"
                      min={40}
                      max={180}
                      value={contrast}
                      onChange={(e) => setContrast(Number(e.target.value))}
                      className="w-full h-1.5 bg-neutral-800 rounded appearance-none cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] text-neutral-400 mb-1">
                      <span>Saturation</span>
                      <span className="font-mono">{saturation}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={200}
                      value={saturation}
                      onChange={(e) => setSaturation(Number(e.target.value))}
                      className="w-full h-1.5 bg-neutral-800 rounded appearance-none cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] text-neutral-400 mb-1">
                      <span>Warmth / Sepia</span>
                      <span className="font-mono">{warmth}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={warmth}
                      onChange={(e) => setWarmth(Number(e.target.value))}
                      className="w-full h-1.5 bg-neutral-800 rounded appearance-none cursor-pointer"
                    />
                  </div>

                  <div className="pt-2 flex items-center justify-between border-t border-neutral-800/80">
                    <button
                      onClick={() => setIsFlippedH(!isFlippedH)}
                      className={`px-3 py-1.5 text-xs rounded-lg border flex items-center gap-1.5 transition-colors ${
                        isFlippedH
                          ? 'bg-purple-900/50 border-purple-500 text-white'
                          : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
                      }`}
                    >
                      <FlipHorizontal className="w-3.5 h-3.5" />
                      <span>Flip Horizontal</span>
                    </button>

                    <button
                      onClick={() => setInvert(!invert)}
                      className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                        invert
                          ? 'bg-purple-900/50 border-purple-500 text-white'
                          : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
                      }`}
                    >
                      Invert Tone
                    </button>
                  </div>
                </div>
              )}

              {/* Sub-tab: LUT Presets */}
              {activeTool === 'presets' && (
                <div className="space-y-2">
                  <span className="text-[11px] text-neutral-400">1-Click Aesthetic LUT Presets</span>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'normal', label: 'Default / None' },
                      { id: 'teal_orange', label: 'Teal & Orange' },
                      { id: 'cyber_neon', label: 'Cyberpunk Neon' },
                      { id: 'noir', label: 'Film Noir B&W' },
                      { id: 'vintage', label: '35mm Vintage' },
                      { id: 'emerald', label: 'Emerald Dusk' },
                    ].map((lut) => (
                      <button
                        key={lut.id}
                        onClick={() => setImageLut(lut.id)}
                        className={`p-2 rounded-lg text-xs font-medium text-left border transition-colors ${
                          imageLut === lut.id
                            ? 'bg-purple-600/30 border-purple-500 text-white font-semibold'
                            : 'bg-neutral-900/80 border-neutral-800 text-neutral-400 hover:text-white'
                        }`}
                      >
                        {lut.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Sub-tab: Text Caption */}
              {activeTool === 'text' && (
                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] text-neutral-400 block mb-1">Overlay Caption Text</label>
                    <input
                      type="text"
                      value={captionText}
                      onChange={(e) => setCaptionText(e.target.value)}
                      placeholder="e.g. LIBERTY MASTER EDITION"
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] text-neutral-400 block mb-1">Position</label>
                      <select
                        value={captionPosition}
                        onChange={(e: any) => setCaptionPosition(e.target.value)}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded px-2.5 py-1.5 text-xs text-white"
                      >
                        <option value="bottom">Bottom</option>
                        <option value="center">Center</option>
                        <option value="top">Top</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] text-neutral-400 block mb-1">Color</label>
                      <select
                        value={captionColor}
                        onChange={(e) => setCaptionColor(e.target.value)}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded px-2.5 py-1.5 text-xs text-white"
                      >
                        <option value="#ffffff">White</option>
                        <option value="#facc15">Neon Yellow</option>
                        <option value="#22d3ee">Cyan</option>
                        <option value="#c084fc">Violet</option>
                        <option value="#fb7185">Rose Red</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <label className="text-xs text-neutral-300 flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={captionBg}
                        onChange={(e) => setCaptionBg(e.target.checked)}
                        className="rounded border-neutral-700 text-purple-600 focus:ring-0"
                      />
                      <span>Dark Contrast Box</span>
                    </label>

                    <div className="flex items-center gap-1.5 text-xs text-neutral-400">
                      <span>Size:</span>
                      <input
                        type="number"
                        min={14}
                        max={64}
                        value={captionSize}
                        onChange={(e) => setCaptionSize(Number(e.target.value))}
                        className="w-12 bg-neutral-900 border border-neutral-800 rounded px-1.5 py-0.5 font-mono text-center text-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Sub-tab: Crop */}
              {activeTool === 'crop' && (
                <div className="space-y-3">
                  <span className="text-[11px] text-neutral-400">Crop / Aspect Framing Guide</span>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'original', label: 'Original Ratio' },
                      { id: '16:9', label: '16:9 (Landscape)' },
                      { id: '9:16', label: '9:16 (Vertical Reels)' },
                      { id: '1:1', label: '1:1 (Square)' },
                      { id: '4:5', label: '4:5 (Social)' },
                    ].map((crop) => (
                      <button
                        key={crop.id}
                        onClick={() => setImageCropRatio(crop.id)}
                        className={`p-2 rounded-lg text-xs font-medium text-left border transition-colors ${
                          imageCropRatio === crop.id
                            ? 'bg-purple-600/30 border-purple-500 text-white font-semibold'
                            : 'bg-neutral-900/80 border-neutral-800 text-neutral-400 hover:text-white'
                        }`}
                      >
                        {crop.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* VIDEO EDITING TOOLBOX */
            <div className="space-y-4 bg-neutral-950/70 p-4 rounded-xl border border-neutral-800">
              <div className="text-xs font-semibold text-white">Video Parameters & Filter Settings</div>

              {/* Trimming */}
              <div className="space-y-2 p-3 bg-neutral-900/60 rounded-lg border border-neutral-800/80">
                <div className="flex items-center justify-between text-[11px] text-neutral-300">
                  <span className="flex items-center gap-1">
                    <Scissors className="w-3.5 h-3.5 text-purple-400" />
                    <span>Trim Duration</span>
                  </span>
                  <span className="font-mono text-neutral-400">
                    {videoTrimStart}s to {videoTrimEnd || videoDuration}s ({Math.max(1, (videoTrimEnd || videoDuration) - videoTrimStart)}s total)
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-neutral-500 block mb-0.5">Start (sec)</label>
                    <input
                      type="number"
                      min={0}
                      max={Math.max(0, videoDuration - 1)}
                      value={videoTrimStart}
                      onChange={(e) => setVideoTrimStart(Number(e.target.value))}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded px-2 py-1 text-xs font-mono text-white"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-neutral-500 block mb-0.5">End (sec)</label>
                    <input
                      type="number"
                      min={videoTrimStart + 1}
                      max={Math.max(1, videoDuration)}
                      value={videoTrimEnd || videoDuration}
                      onChange={(e) => setVideoTrimEnd(Number(e.target.value))}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded px-2 py-1 text-xs font-mono text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Playback Velocity / Speed */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-neutral-300">
                  <span>Playback Speed</span>
                  <span className="font-mono text-purple-400 font-semibold">{videoSpeed}x</span>
                </div>
                <div className="grid grid-cols-5 gap-1.5">
                  {[0.5, 0.75, 1.0, 1.25, 1.5].map((spd) => (
                    <button
                      key={spd}
                      onClick={() => setVideoSpeed(spd)}
                      className={`py-1 text-xs font-mono rounded border transition-colors ${
                        videoSpeed === spd
                          ? 'bg-purple-600/40 border-purple-500 text-white font-bold'
                          : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
                      }`}
                    >
                      {spd}x
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Filter */}
              <div className="space-y-1.5">
                <label className="text-[11px] text-neutral-300 block">Color Grading Filter</label>
                <select
                  value={videoFilter}
                  onChange={(e) => setVideoFilter(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="none">Original Colors</option>
                  <option value="cinematic">Cinematic (Teal & Orange)</option>
                  <option value="cyberpunk">Cyberpunk Neon</option>
                  <option value="noir">Dramatic Film Noir B&W</option>
                  <option value="vintage">35mm Vintage Kodachrome</option>
                  <option value="vibrant">Vibrant Punch</option>
                </select>
              </div>

              {/* Aspect Ratio Reframe */}
              <div className="space-y-1.5">
                <label className="text-[11px] text-neutral-300 block">Output Aspect Ratio</label>
                <select
                  value={videoCrop}
                  onChange={(e) => setVideoCrop(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="original">Preserve Original Dimensions</option>
                  <option value="9:16">9:16 Vertical Reel (TikTok / Shorts)</option>
                  <option value="1:1">1:1 Square (Instagram Feed)</option>
                  <option value="16:9">16:9 Landscape (YouTube / Cinema)</option>
                  <option value="4:5">4:5 Social Portrait</option>
                </select>
              </div>

              {/* Text Burn */}
              <div className="space-y-1.5">
                <label className="text-[11px] text-neutral-300 block">Burn Caption Overlay</label>
                <input
                  type="text"
                  value={videoTextOverlay}
                  onChange={(e) => setVideoTextOverlay(e.target.value)}
                  placeholder="e.g. SCENE 01: NIGHT CITY"
                  className="w-full bg-neutral-900 border border-neutral-800 rounded px-2.5 py-1.5 text-xs text-white placeholder-neutral-500"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-neutral-400">Position:</span>
                  <select
                    value={videoTextPos}
                    onChange={(e: any) => setVideoTextPos(e.target.value)}
                    className="bg-neutral-900 border border-neutral-800 rounded px-2 py-1 text-xs text-white"
                  >
                    <option value="bottom">Bottom</option>
                    <option value="center">Center</option>
                    <option value="top">Top</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => setVideoMute(!videoMute)}
                  className={`p-1.5 rounded border text-xs flex items-center gap-1 transition-colors ${
                    videoMute
                      ? 'bg-rose-950/40 border-rose-800/60 text-rose-300'
                      : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                  title="Mute Audio in Master Render"
                >
                  {videoMute ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                  <span>{videoMute ? 'Muted' : 'Audio On'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
