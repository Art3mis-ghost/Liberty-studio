import React, { useState, useRef } from 'react';
import { VideoClipSegment, BackgroundJob } from '../../types/index.ts';
import { api } from '../../services/api.ts';
import {
  Scissors,
  Flame,
  Play,
  Download,
  Film,
  Sparkles,
  Layers,
  CheckCircle2,
  Loader2,
  Upload,
  Edit3,
  Youtube,
  ExternalLink,
} from 'lucide-react';

interface ClippingStudioProps {
  activeJob: BackgroundJob | null;
  onJobCreated: (jobId: string) => void;
  onSendToEditor?: (videoUrl: string) => void;
}

export const ClippingStudio: React.FC<ClippingStudioProps> = ({
  activeJob,
  onJobCreated,
  onSendToEditor,
}) => {
  const [sourceVideoPath, setSourceVideoPath] = useState('/storage/generations/sample.mp4');
  const [youtubeInputUrl, setYoutubeInputUrl] = useState('');
  const [isImportingUrl, setIsImportingUrl] = useState(false);
  const [importError, setImportError] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewVideoRef = useRef<HTMLVideoElement>(null);

  const [clips, setClips] = useState<VideoClipSegment[]>([
    {
      id: 'clip_demo_1',
      startTime: 0,
      endTime: 15,
      duration: 15,
      headline: 'Why Open-Source AI Creative Suites Win',
      hookScore: 96,
      viralScore: 94,
      reason: 'Immediate provocative thesis, high vocal energy, zero silence delay.',
      transcript: 'What everyone is getting wrong about creative AI is relying on closed subscription APIs. Open-source local inference gives you total control.',
      aspectRatio: '9:16',
      captionStyle: 'hormozi',
      exportedVideoUrl: '/storage/generations/sample.mp4',
      speaker: 'Alex Rivera',
    },
    {
      id: 'clip_demo_2',
      startTime: 5,
      endTime: 15,
      duration: 10,
      headline: 'The Secret to Cinematic AI Camera Moves',
      hookScore: 91,
      viralScore: 88,
      reason: 'Actionable tutorial cadence with visual keyframe movement.',
      transcript: 'Using dolly zoom transforms and spatiotemporal optical flow, you can generate authentic camera motion without paid rendering clouds.',
      aspectRatio: '9:16',
      captionStyle: 'hormozi',
      speaker: 'Elena Vance',
    },
  ]);

  const [selectedClipId, setSelectedClipId] = useState<string>('clip_demo_1');
  const [targetAspect, setTargetAspect] = useState<'9:16' | '1:1' | '4:5' | '16:9'>('9:16');
  const [captionStyle, setCaptionStyle] = useState<'hormozi' | 'karaoke_neon' | 'clean_white' | 'bold_punch'>('hormozi');

  const selectedClip = clips.find((c) => c.id === selectedClipId) || clips[0];
  const isAnalyzing = Boolean(activeJob && activeJob.type === 'clip' && activeJob.status === 'processing');

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await api.uploadFile(file);
      setSourceVideoPath(res.url);
      // Auto trigger highlight analysis on newly uploaded video
      const { jobId } = await api.analyzeHighlights(res.url);
      onJobCreated(jobId);
    } catch (err) {
      console.error('Video upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleImportYoutube = async () => {
    if (!youtubeInputUrl.trim() || isImportingUrl) return;
    setIsImportingUrl(true);
    setImportError('');
    try {
      const res = await api.importVideoUrl(youtubeInputUrl);
      if (res.success && res.video) {
        setSourceVideoPath(res.video.localVideoUrl);
        const { jobId } = await api.analyzeHighlights(res.video.localVideoUrl);
        onJobCreated(jobId);
      } else {
        setImportError(res.error || 'Failed to import video link');
      }
    } catch (err: any) {
      setImportError(err.message || 'Error importing video link');
    } finally {
      setIsImportingUrl(false);
    }
  };

  const handleAnalyzeHighlights = async () => {
    try {
      const { jobId } = await api.analyzeHighlights(sourceVideoPath);
      onJobCreated(jobId);
    } catch (err) {
      console.error('Error analyzing highlights:', err);
    }
  };

  const handleRenderClip = async (clip: VideoClipSegment) => {
    try {
      const clipToRender: VideoClipSegment = {
        ...clip,
        aspectRatio: targetAspect,
        captionStyle,
      };
      const { jobId } = await api.renderClip(sourceVideoPath, clipToRender);
      onJobCreated(jobId);
    } catch (err) {
      console.error('Error rendering clip:', err);
    }
  };

  const updateSelectedClip = (field: 'headline' | 'transcript', value: string) => {
    setClips((prev) =>
      prev.map((c) => (c.id === selectedClip.id ? { ...c, [field]: value } : c))
    );
  };

  // Sync clips when analysis job finishes
  React.useEffect(() => {
    if (activeJob && activeJob.type === 'clip' && activeJob.status === 'completed' && activeJob.result?.segments) {
      setClips(activeJob.result.segments);
      if (activeJob.result.segments.length > 0) {
        setSelectedClipId(activeJob.result.segments[0].id);
      }
    }
    if (activeJob && activeJob.type === 'clip' && activeJob.status === 'completed' && activeJob.result?.clipUrl) {
      setClips((prev) =>
        prev.map((c) => (c.id === selectedClipId ? { ...c, exportedVideoUrl: activeJob.result?.clipUrl } : c))
      );
    }
  }, [activeJob]);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Studio Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-neutral-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Video Clipping Studio
            </h1>
            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded border border-cyan-800/40 bg-cyan-950/60 text-cyan-300">
              KIXY-STYLE PIPELINE
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            Automated highlight detection, Whisper speech transcription, 9:16 vertical reframing, and animated captions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleVideoUpload}
            accept="video/*"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || isAnalyzing}
            className="px-3.5 py-2 text-xs font-medium text-neutral-300 bg-neutral-900 border border-neutral-800 hover:border-neutral-700 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Upload className="w-3.5 h-3.5 text-cyan-400" />
            <span>{uploading ? 'Uploading Video...' : 'Upload Video File'}</span>
          </button>

          <button
            onClick={handleAnalyzeHighlights}
            disabled={isAnalyzing}
            className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 shadow-sm shadow-cyan-600/20"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Analyzing Timeline ({activeJob?.progress || 0}%)...</span>
              </>
            ) : (
              <>
                <Scissors className="w-3.5 h-3.5" />
                <span>Auto-Detect Highlights</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Video Import & YouTube Link Bar */}
      <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-900/60 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <Youtube className="w-4 h-4 text-red-500" />
            <span className="font-semibold text-white">Import Video via YouTube Link or Direct URL</span>
          </div>
          <div className="flex items-center gap-2">
            {sourceVideoPath && (
              <a
                href={sourceVideoPath}
                download="video_download.mp4"
                className="px-2.5 py-1 text-[11px] bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded font-medium flex items-center gap-1 transition-colors"
                title="Download current loaded video file"
              >
                <Download className="w-3 h-3 text-cyan-400" />
                <span>Download Video</span>
              </a>
            )}
            {onSendToEditor && (
              <button
                type="button"
                onClick={() => onSendToEditor(sourceVideoPath)}
                className="px-2.5 py-1 text-[11px] bg-purple-950/60 hover:bg-purple-900/80 text-purple-300 border border-purple-800/50 rounded font-medium flex items-center gap-1 transition-colors"
              >
                <Film className="w-3 h-3 text-purple-400" />
                <span>Edit in Video Editor</span>
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={youtubeInputUrl}
              onChange={(e) => setYoutubeInputUrl(e.target.value)}
              placeholder="Paste YouTube link or video URL (e.g. https://www.youtube.com/watch?v=...)"
              className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-cyan-500"
            />
          </div>
          <button
            type="button"
            onClick={handleImportYoutube}
            disabled={isImportingUrl || !youtubeInputUrl.trim()}
            className="px-4 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap shadow-sm shadow-red-900/30"
          >
            {isImportingUrl ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Importing...</span>
              </>
            ) : (
              <>
                <Youtube className="w-3.5 h-3.5" />
                <span>Import & Auto-Detect</span>
              </>
            )}
          </button>
        </div>

        {importError && (
          <p className="text-[11px] text-rose-400 font-medium">{importError}</p>
        )}
      </div>

      {/* Main Grid: Clips List (Left 7 Cols) & Vertical Preview / Caption Controls (Right 5 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Detected Clips & Hooks */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between text-xs font-semibold text-neutral-300">
            <span>Detected High-Retention Clips ({clips.length})</span>
            <span className="text-[11px] font-mono text-cyan-400">Current Video: {sourceVideoPath.split('/').pop()}</span>
          </div>

          <div className="space-y-3">
            {clips.map((clip) => {
              const isSelected = selectedClip.id === clip.id;
              return (
                <div
                  key={clip.id}
                  onClick={() => setSelectedClipId(clip.id)}
                  className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-neutral-900 border-cyan-500/80 shadow-md shadow-cyan-950/40'
                      : 'bg-neutral-900/40 border-neutral-800 hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded bg-neutral-800 border border-neutral-700 flex items-center justify-center text-xs font-bold font-mono text-white">
                        {clip.startTime}s
                      </span>
                      <h3 className="text-xs font-bold text-white leading-snug">
                        {clip.headline}
                      </h3>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <Flame className="w-3.5 h-3.5 text-amber-400" />
                      <span className="text-xs font-bold font-mono text-amber-400">
                        {clip.hookScore}%
                      </span>
                    </div>
                  </div>

                  <p className="text-[11px] text-neutral-400 line-clamp-2 leading-relaxed font-sans mb-3">
                    "{clip.transcript}"
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t border-neutral-800/60 text-[11px]">
                    <span className="text-neutral-500 font-mono">
                      Duration: {clip.duration}s · Speaker: {clip.speaker || 'Host'}
                    </span>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRenderClip(clip);
                      }}
                      className="px-2.5 py-1 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 rounded font-medium transition-colors flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Export Short</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Inline Editor for Selected Clip Text */}
          {selectedClip && (
            <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-900/60 space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold text-white">
                <span className="flex items-center gap-1.5">
                  <Edit3 className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Customize Headline & Subtitles for Selected Short</span>
                </span>
                <span className="font-mono text-[10px] text-neutral-500">{selectedClip.id}</span>
              </div>

              <div>
                <label className="block text-[11px] text-neutral-400 mb-1">Top Hook Headline</label>
                <input
                  type="text"
                  value={selectedClip.headline}
                  onChange={(e) => updateSelectedClip('headline', e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1.5 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] text-neutral-400 mb-1">Transcript & Animated Caption Words</label>
                <textarea
                  rows={2}
                  value={selectedClip.transcript}
                  onChange={(e) => updateSelectedClip('transcript', e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1.5 text-xs text-white"
                />
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Short-form Vertical Reframer & Caption Settings */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-900/60 space-y-4">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-white">Vertical Reframe Preview</span>
              <span className="font-mono text-[11px] text-cyan-400">
                {targetAspect} · {captionStyle.toUpperCase()}
              </span>
            </div>

            {/* Vertical Video Mockup / Player */}
            <div className="w-[270px] aspect-[9/16] mx-auto rounded-xl overflow-hidden bg-black border-2 border-neutral-800 relative shadow-2xl flex flex-col justify-between">
              {selectedClip.exportedVideoUrl ? (
                <video
                  key={selectedClip.exportedVideoUrl}
                  src={selectedClip.exportedVideoUrl}
                  controls
                  autoPlay
                  loop
                  className="w-full h-full object-cover"
                />
              ) : (
                <>
                  {/* Top Header Tag */}
                  <div className="p-3 bg-gradient-to-b from-black/80 to-transparent z-10">
                    <div className="bg-yellow-400 text-black text-[11px] font-extrabold px-2 py-0.5 rounded text-center uppercase tracking-wide truncate">
                      {selectedClip.headline}
                    </div>
                  </div>

                  {/* Center Media Mockup */}
                  <div className="flex-1 flex items-center justify-center text-center p-4">
                    <video
                      ref={previewVideoRef}
                      src={sourceVideoPath}
                      autoPlay
                      muted
                      loop
                      className="w-full h-full object-cover opacity-75"
                    />
                  </div>

                  {/* Hormozi Subtitles Burned Overlay */}
                  <div className="p-4 bg-gradient-to-t from-black/90 via-black/40 to-transparent text-center space-y-1 z-10">
                    <div className="inline-block bg-black/80 px-2.5 py-1 rounded-md text-xs font-black text-white uppercase tracking-wider shadow">
                      {selectedClip.transcript.slice(0, 32)}
                    </div>
                    <div className="inline-block bg-black/80 px-2.5 py-1 rounded-md text-xs font-black text-cyan-400 uppercase tracking-wider shadow">
                      {selectedClip.transcript.slice(32, 65)}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Reframe & Caption Controls */}
            <div className="space-y-3 pt-3 border-t border-neutral-800 text-xs">
              <div>
                <label className="block text-neutral-400 text-[11px] font-medium mb-1.5">
                  Output Format Reframing
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(['9:16', '1:1', '4:5', '16:9'] as const).map((ratio) => (
                    <button
                      key={ratio}
                      onClick={() => setTargetAspect(ratio)}
                      className={`py-1.5 text-center text-xs font-mono font-medium rounded border transition-colors ${
                        targetAspect === ratio
                          ? 'bg-cyan-600/20 border-cyan-500 text-cyan-300'
                          : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                      }`}
                    >
                      {ratio}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-neutral-400 text-[11px] font-medium mb-1.5">
                  Subtitle Animation Style
                </label>
                <select
                  value={captionStyle}
                  onChange={(e: any) => setCaptionStyle(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded px-2.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="hormozi">Hormozi Punch (Yellow / Cyan Highlight)</option>
                  <option value="karaoke_neon">Karaoke Neon (Glowing Cyan Word-By-Word)</option>
                  <option value="bold_punch">Bold Impact Box (Black Banner)</option>
                  <option value="clean_white">Minimalist Studio (Clean White)</option>
                </select>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  onClick={() => handleRenderClip(selectedClip)}
                  className="flex-1 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Render Selected Short</span>
                </button>

                {selectedClip.exportedVideoUrl && (
                  <a
                    href={selectedClip.exportedVideoUrl}
                    download={`short_${selectedClip.id}.mp4`}
                    className="p-2.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition-colors"
                    title="Download Short MP4"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
