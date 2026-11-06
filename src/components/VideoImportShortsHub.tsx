import React, { useState, useRef } from 'react';
import { api } from '../services/api.ts';
import { BackgroundJob } from '../types/index.ts';
import {
  Youtube,
  Upload,
  Play,
  Download,
  Scissors,
  Film,
  Sparkles,
  ExternalLink,
  Loader2,
  CheckCircle2,
  Flame,
  Layers,
  ArrowRight,
  RefreshCw,
  Video,
} from 'lucide-react';

interface VideoImportShortsHubProps {
  onSendToEditor?: (videoUrl: string) => void;
  onSendToClipping?: (videoUrl: string) => void;
  onJobCreated?: (jobId: string) => void;
}

interface GeneratedShort {
  id: string;
  headline: string;
  url: string;
  hookScore: number;
  duration: number;
}

export const VideoImportShortsHub: React.FC<VideoImportShortsHubProps> = ({
  onSendToEditor,
  onSendToClipping,
  onJobCreated,
}) => {
  const [activeTab, setActiveTab] = useState<'youtube' | 'upload'>('youtube');
  const [youtubeUrl, setYoutubeUrl] = useState<string>('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
  const [importing, setImporting] = useState<boolean>(false);
  const [importError, setImportError] = useState<string>('');

  // Imported video details
  const [videoData, setVideoData] = useState<{
    id: string;
    sourceType: 'youtube' | 'direct_url' | 'upload';
    title: string;
    localVideoUrl: string;
    embedUrl?: string;
    duration: number;
    thumbnailUrl: string;
  } | null>({
    id: 'yt_default_demo',
    sourceType: 'youtube',
    title: 'Cinematic AI & The Future of Open-Source Creative Production',
    localVideoUrl: '/storage/generations/sample.mp4',
    embedUrl: 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=0',
    duration: 90,
    thumbnailUrl: '/storage/generations/sample_hero.jpg',
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState<boolean>(false);

  // Shorts creation state
  const [shortsCount, setShortsCount] = useState<number>(3);
  const [isGeneratingShorts, setIsGeneratingShorts] = useState<boolean>(false);
  const [shortsProgress, setShortsProgress] = useState<string>('');
  const [generatedShorts, setGeneratedShorts] = useState<GeneratedShort[]>([
    {
      id: 'short_demo_1',
      headline: 'Why Open-Source AI Creative Suites Win',
      url: '/storage/generations/sample.mp4',
      hookScore: 97,
      duration: 15,
    },
    {
      id: 'short_demo_2',
      headline: 'The Hollywood Camera Technique Nobody Tells You',
      url: '/storage/generations/sample.mp4',
      hookScore: 94,
      duration: 18,
    },
    {
      id: 'short_demo_3',
      headline: 'Local GPU vs Cloud Subscriptions',
      url: '/storage/generations/sample.mp4',
      hookScore: 91,
      duration: 14,
    },
  ]);

  // Handle YouTube URL or Direct Web Link
  const handleImportUrl = async () => {
    if (!youtubeUrl.trim() || importing) return;
    setImportError('');
    setImporting(true);

    try {
      const res = await api.importVideoUrl(youtubeUrl);
      if (res.success && res.video) {
        setVideoData(res.video);
      } else {
        setImportError(res.error || 'Failed to import video link. Please check URL.');
      }
    } catch (err: any) {
      setImportError(err.message || 'Error connecting to video import service');
    } finally {
      setImporting(false);
    }
  };

  // Handle Local File Upload (MP4, WebM, MOV)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setImportError('');

    try {
      const res = await api.uploadFile(file);
      setVideoData({
        id: `upload_${Date.now()}`,
        sourceType: 'upload',
        title: file.name,
        localVideoUrl: res.url,
        duration: 60,
        thumbnailUrl: '/storage/generations/sample_hero.jpg',
      });
    } catch (err: any) {
      setImportError(err.message || 'Failed to upload video');
    } finally {
      setUploading(false);
    }
  };

  // Poll Job for Multi-Shorts Generation
  const pollShortsJob = (jobId: string) => {
    const interval = setInterval(async () => {
      try {
        const job = await api.getJob(jobId);
        if (job) {
          if (job.status === 'processing' || job.status === 'pending') {
            setShortsProgress(`${job.stage} (${job.progress}%)`);
          } else if (job.status === 'completed') {
            clearInterval(interval);
            setIsGeneratingShorts(false);
            setShortsProgress('');
            if (job.result?.shorts && Array.isArray(job.result.shorts)) {
              setGeneratedShorts(job.result.shorts);
            }
          } else if (job.status === 'failed') {
            clearInterval(interval);
            setIsGeneratingShorts(false);
            setShortsProgress('');
            setImportError(job.error || 'Shorts creation failed');
          }
        }
      } catch {
        clearInterval(interval);
        setIsGeneratingShorts(false);
      }
    }, 450);
  };

  // Handle "Create Multiple Shorts"
  const handleCreateMultipleShorts = async () => {
    if (!videoData || isGeneratingShorts) return;
    setImportError('');
    setIsGeneratingShorts(true);
    setShortsProgress('Initializing AI hook detector & vertical reframing pipeline...');

    try {
      const { jobId } = await api.createMultipleShorts(
        videoData.localVideoUrl,
        videoData.title,
        shortsCount
      );
      if (onJobCreated) onJobCreated(jobId);
      pollShortsJob(jobId);
    } catch (err: any) {
      setIsGeneratingShorts(false);
      setShortsProgress('');
      setImportError(err.message || 'Failed to start multiple shorts job');
    }
  };

  return (
    <div className="rounded-2xl border border-cyan-900/40 bg-gradient-to-b from-[#091522] via-[#0b101b] to-[#070a12] p-6 space-y-6 shadow-2xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-red-600/20 text-red-400 border border-red-500/30">
              <Youtube className="w-4 h-4" />
            </span>
            <h2 className="text-base font-bold text-white tracking-wide">
              YouTube & Long-Video Importer · Multi-Shorts Creator
            </h2>
            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded border border-cyan-800/40 bg-cyan-950/60 text-cyan-300">
              KIXY AI SHORT-FORM PIPELINE
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            Upload any long video or paste a YouTube link: play it, download it, open in the AI Video Editor, or auto-generate multiple viral vertical shorts (9:16) with animated captions.
          </p>
        </div>

        {/* Tab switcher: YouTube Link or Upload */}
        <div className="flex items-center gap-1 bg-neutral-900/90 p-1 rounded-xl border border-neutral-800 self-start md:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('youtube')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'youtube'
                ? 'bg-red-600 text-white shadow-sm shadow-red-900/40'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Youtube className="w-3.5 h-3.5" />
            <span>YouTube Link</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'upload'
                ? 'bg-cyan-600 text-white shadow-sm shadow-cyan-900/40'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload File</span>
          </button>
        </div>
      </div>

      {/* Input Action Bar */}
      <div className="space-y-3">
        {activeTab === 'youtube' ? (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <div className="relative flex-1">
              <Youtube className="w-4 h-4 text-red-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                placeholder="Paste YouTube video or Shorts link (e.g. https://www.youtube.com/watch?v=...)"
                className="w-full pl-10 pr-4 py-2.5 bg-neutral-950/90 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
              />
            </div>
            <button
              type="button"
              onClick={handleImportUrl}
              disabled={importing || !youtubeUrl.trim()}
              className="px-5 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-2 shadow-md shadow-red-900/30 whitespace-nowrap"
            >
              {importing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Importing Stream...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  <span>Fetch & Display Video</span>
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="video/*"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex-1 py-4 border-2 border-dashed border-neutral-800 hover:border-cyan-500/60 bg-neutral-950/60 rounded-xl text-xs text-neutral-300 flex flex-col items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Upload className="w-5 h-5 text-cyan-400" />
              <span className="font-semibold text-white">
                {uploading ? 'Uploading Video...' : 'Click or Drag to Upload Video (MP4, MOV, WebM up to 150MB)'}
              </span>
              <span className="text-[11px] text-neutral-500">
                Ready for playback, editing, downloading, and 9:16 vertical shorts conversion
              </span>
            </button>
          </div>
        )}

        {importError && (
          <div className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-800/50 text-xs text-rose-200 flex items-center justify-between">
            <span>{importError}</span>
            <button onClick={() => setImportError('')} className="text-rose-400 hover:text-white text-xs">
              Dismiss
            </button>
          </div>
        )}
      </div>

      {/* Main Display: Video Player (Left) + Multi-Action Hub & Shorts Creator (Right) */}
      {videoData && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2 items-start">
          {/* Left Column (7 Cols): Video Player */}
          <div className="lg:col-span-7 space-y-3">
            <div className="rounded-xl overflow-hidden border border-neutral-800 bg-black aspect-video relative shadow-2xl flex items-center justify-center">
              {videoData.embedUrl && videoData.sourceType === 'youtube' ? (
                <iframe
                  src={videoData.embedUrl}
                  title={videoData.title}
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <video
                  src={videoData.localVideoUrl}
                  controls
                  className="w-full h-full object-contain"
                />
              )}
            </div>

            {/* Video Metadata & Actions Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-neutral-950/80 border border-neutral-800/90 text-xs">
              <div className="truncate pr-2">
                <h3 className="font-semibold text-white truncate">{videoData.title}</h3>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  Duration: {videoData.duration}s · Resolution: 1080p · Source: {videoData.sourceType.toUpperCase()}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {/* Download Video Button */}
                <a
                  href={videoData.localVideoUrl}
                  download={`video_${videoData.id}.mp4`}
                  className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-medium transition-colors flex items-center gap-1.5 shadow-sm"
                  title="Download Video File"
                >
                  <Download className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Download Video</span>
                </a>

                {/* Edit in AI Video Editor */}
                <button
                  type="button"
                  onClick={() => onSendToEditor && onSendToEditor(videoData.localVideoUrl)}
                  className="px-3 py-1.5 rounded-lg bg-purple-900/60 hover:bg-purple-800/80 text-purple-200 border border-purple-700/50 font-medium transition-colors flex items-center gap-1.5 shadow-sm"
                  title="Open in Timeline Editor for trimming, color grading, and filters"
                >
                  <Film className="w-3.5 h-3.5 text-purple-400" />
                  <span>Edit Video</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column (5 Cols): Automated Multiple Shorts Generator */}
          <div className="lg:col-span-5 space-y-4">
            <div className="p-4 rounded-xl border border-cyan-800/40 bg-neutral-950/70 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Create Multiple Shorts
                  </span>
                </div>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/50">
                  9:16 VERTICAL REFRAMING
                </span>
              </div>

              <p className="text-xs text-neutral-400 leading-relaxed">
                Automatically cuts your long video into multiple high-energy, vertical shorts with speech transcription, provocative hook headlines, and burned animated subtitles.
              </p>

              {/* Shorts Count Selector */}
              <div className="flex items-center justify-between text-xs pt-1 border-t border-neutral-800">
                <span className="text-neutral-400">Number of Shorts to Generate:</span>
                <div className="flex items-center gap-1.5">
                  {[2, 3, 4].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setShortsCount(num)}
                      className={`w-7 h-7 rounded-lg font-bold text-xs transition-colors ${
                        shortsCount === num
                          ? 'bg-cyan-600 text-white'
                          : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              {/* Generate Shorts Action Button */}
              <button
                type="button"
                onClick={handleCreateMultipleShorts}
                disabled={isGeneratingShorts}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-cyan-900/30 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isGeneratingShorts ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing Shorts...</span>
                  </>
                ) : (
                  <>
                    <Scissors className="w-4 h-4" />
                    <span>Generate {shortsCount} Viral Shorts (1-Click)</span>
                  </>
                )}
              </button>

              {shortsProgress && (
                <div className="p-2.5 rounded-lg bg-cyan-950/40 border border-cyan-800/50 text-xs text-cyan-200 flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                  <span>{shortsProgress}</span>
                </div>
              )}
            </div>

            {/* Generated Shorts Showcase */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-neutral-300">
                  Ready Shorts ({generatedShorts.length})
                </span>
                <span className="text-[11px] font-mono text-cyan-400">Hormozi Captions Active</span>
              </div>

              <div className="space-y-2">
                {generatedShorts.map((short, idx) => (
                  <div
                    key={short.id}
                    className="p-3 rounded-xl border border-neutral-800 bg-neutral-900/60 flex items-center justify-between gap-3 hover:border-cyan-500/40 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-6 h-6 rounded-md bg-neutral-800 text-cyan-400 text-xs font-bold font-mono flex items-center justify-center shrink-0">
                        #{idx + 1}
                      </span>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-white truncate">{short.headline}</h4>
                        <div className="flex items-center gap-2 mt-0.5 text-[10px] text-neutral-400 font-mono">
                          <span>{short.duration}s</span>
                          <span>·</span>
                          <span className="text-amber-400 font-semibold">{short.hookScore}% Viral</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <a
                        href={short.url}
                        download={`short_${short.id}.mp4`}
                        className="p-1.5 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/80 text-cyan-300 border border-cyan-800/50 transition-colors"
                        title="Download Short MP4"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>
                      <button
                        type="button"
                        onClick={() => onSendToEditor && onSendToEditor(short.url)}
                        className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors"
                        title="Open Short in Video Editor"
                      >
                        <Film className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
