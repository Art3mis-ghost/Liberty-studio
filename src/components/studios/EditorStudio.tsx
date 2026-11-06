import React, { useState, useEffect, useRef } from 'react';
import { TimelineTrack, BackgroundJob } from '../../types/index.ts';
import { api } from '../../services/api.ts';
import {
  Film,
  Play,
  Pause,
  Scissors,
  Plus,
  Volume2,
  Trash2,
  Sparkles,
  Download,
  Loader2,
  Upload,
  X,
} from 'lucide-react';

interface EditorStudioProps {
  activeJob: BackgroundJob | null;
  onJobCreated: (jobId: string) => void;
}

export const EditorStudio: React.FC<EditorStudioProps> = ({
  activeJob,
  onJobCreated,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(15);
  const [renderedExportUrl, setRenderedExportUrl] = useState<string>('/storage/generations/sample.mp4');
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null);

  // Modal for adding a clip
  const [isAddClipOpen, setIsAddClipOpen] = useState(false);
  const [targetTrackId, setTargetTrackId] = useState('track_video_1');
  const [newClipLabel, setNewClipLabel] = useState('');
  const [newClipStart, setNewClipStart] = useState(0);
  const [newClipDuration, setNewClipDuration] = useState(4);
  const [newClipText, setNewClipText] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [tracks, setTracks] = useState<TimelineTrack[]>([
    {
      id: 'track_video_1',
      name: 'Video Track 1',
      type: 'video',
      clips: [
        {
          id: 'vclip_1',
          start: 0,
          duration: 6,
          sourceUrl: '/storage/generations/sample.mp4',
          label: 'Cinematic Establishing Dolly',
          speed: 1,
        },
        {
          id: 'vclip_2',
          start: 6,
          duration: 9,
          sourceUrl: '/storage/generations/sample.mp4',
          label: 'Drone Aerial Horizon Sweep',
          speed: 1,
        },
      ],
    },
    {
      id: 'track_audio_1',
      name: 'Voiceover / Audio',
      type: 'audio',
      clips: [
        {
          id: 'aclip_1',
          start: 0,
          duration: 12,
          sourceUrl: '/storage/generations/sample.mp4',
          label: 'Narrator Track (Alex Rivera)',
          volume: 0.9,
        },
      ],
    },
    {
      id: 'track_sub_1',
      name: 'Subtitle Overlay',
      type: 'subtitle',
      clips: [
        {
          id: 'sclip_1',
          start: 1,
          duration: 4,
          sourceUrl: '',
          label: 'Subtitle 1',
          text: 'Liberty Studio: Zero Subscription Lock-in',
        },
        {
          id: 'sclip_2',
          start: 6,
          duration: 5,
          sourceUrl: '',
          label: 'Subtitle 2',
          text: 'Full local inference with open-weight models',
        },
      ],
    },
  ]);

  // Real Playhead Timer Animation
  useEffect(() => {
    let interval: any = null;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= duration) {
            setIsPlaying(false);
            return 0;
          }
          return Number((prev + 0.1).toFixed(2));
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isPlaying, duration]);

  const isRendering = Boolean(activeJob && activeJob.type === 'editor_render' && activeJob.status === 'processing');

  const handleRenderMaster = async () => {
    try {
      const { jobId } = await api.renderTimeline(tracks, {
        resolution: '1080p',
        aspectRatio: '16:9',
        fps: 30,
      });
      onJobCreated(jobId);
    } catch (err) {
      console.error('Editor render error:', err);
    }
  };

  useEffect(() => {
    if (activeJob && activeJob.type === 'editor_render' && activeJob.status === 'completed' && activeJob.result?.exportUrl) {
      setRenderedExportUrl(activeJob.result.exportUrl);
    }
  }, [activeJob]);

  const formatTimecode = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = Math.floor(sec % 60);
    const frames = Math.floor((sec % 1) * 30);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}:${String(frames).padStart(2, '0')}`;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const uploadRes = await api.uploadFile(file);
      const isAudio = file.type.startsWith('audio');
      const targetType = isAudio ? 'audio' : 'video';
      const targetTrack = tracks.find((t) => t.type === targetType) || tracks[0];

      const newClip = {
        id: `clip_${Date.now()}`,
        start: currentTime,
        duration: 5,
        sourceUrl: uploadRes.url,
        label: file.name.slice(0, 24),
        speed: 1,
      };

      setTracks((prev) =>
        prev.map((t) => (t.id === targetTrack.id ? { ...t, clips: [...t.clips, newClip] } : t))
      );
      setDuration((prev) => Math.max(prev, currentTime + 5));
    } catch (err) {
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleAddClipSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const track = tracks.find((t) => t.id === targetTrackId);
    if (!track) return;

    const newClip = {
      id: `clip_${Date.now()}`,
      start: Number(newClipStart),
      duration: Number(newClipDuration),
      sourceUrl: track.type === 'subtitle' ? '' : '/storage/generations/sample.mp4',
      label: newClipLabel || (track.type === 'subtitle' ? 'Subtitle' : 'Media Clip'),
      text: track.type === 'subtitle' ? newClipText || newClipLabel : undefined,
    };

    setTracks((prev) =>
      prev.map((t) => (t.id === targetTrackId ? { ...t, clips: [...t.clips, newClip] } : t))
    );
    setDuration((prev) => Math.max(prev, Number(newClipStart) + Number(newClipDuration)));
    setIsAddClipOpen(false);
    setNewClipLabel('');
    setNewClipText('');
  };

  const handleDeleteClip = (trackId: string, clipId: string) => {
    setTracks((prev) =>
      prev.map((t) => (t.id === trackId ? { ...t, clips: t.clips.filter((c) => c.id !== clipId) } : t))
    );
    if (selectedClipId === clipId) setSelectedClipId(null);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white">
              AI Video Editor
            </h1>
            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded border border-amber-800/40 bg-amber-950/60 text-amber-300">
              NON-LINEAR FFMPEG TIMELINE
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            Multi-track timeline sequencing: cut, trim, overlay animated captions, and export master broadcast compositions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="video/*,audio/*"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="px-3.5 py-2 text-xs font-medium text-neutral-300 bg-neutral-900 border border-neutral-800 hover:border-neutral-700 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Upload className="w-3.5 h-3.5 text-neutral-400" />
            <span>{uploading ? 'Uploading...' : 'Import Media'}</span>
          </button>

          <button
            onClick={() => setIsAddClipOpen(true)}
            className="px-3.5 py-2 text-xs font-medium text-amber-300 bg-amber-950/40 border border-amber-800/60 hover:bg-amber-900/40 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5 text-amber-400" />
            <span>Add Clip Track</span>
          </button>

          <button
            onClick={handleRenderMaster}
            disabled={isRendering}
            className="px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 shadow-sm shadow-amber-600/20"
          >
            {isRendering ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Rendering Master ({activeJob?.progress || 0}%)...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Render Timeline (FFmpeg)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Top Preview Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Master Monitor (7 Cols) */}
        <div className="lg:col-span-7 space-y-3">
          <div className="aspect-video w-full rounded-xl overflow-hidden bg-black border border-neutral-800 relative shadow-2xl flex items-center justify-center">
            {renderedExportUrl ? (
              <video
                key={renderedExportUrl}
                src={renderedExportUrl}
                controls
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="text-center p-8 space-y-2">
                <Film className="w-8 h-8 text-neutral-600 mx-auto" />
                <p className="text-xs text-neutral-400">Timeline Preview Monitor</p>
              </div>
            )}
          </div>

          {/* Scrubber Transport Controls */}
          <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="w-8 h-8 rounded-lg bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center text-white transition-colors"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
              </button>
              <div className="font-mono text-xs text-amber-400 font-semibold px-2 py-1 rounded bg-black/60 tabular-nums">
                {formatTimecode(currentTime)}
              </div>
            </div>

            <div className="flex-1 px-2">
              <input
                type="range"
                min={0}
                max={duration}
                step={0.1}
                value={currentTime}
                onChange={(e) => setCurrentTime(Number(e.target.value))}
                className="w-full h-1.5 bg-neutral-800 rounded appearance-none cursor-pointer"
              />
            </div>

            <div className="font-mono text-xs text-neutral-500 tabular-nums">
              {formatTimecode(duration)}
            </div>
          </div>
        </div>

        {/* Master Output & Clip Inspector (5 Cols) */}
        <div className="lg:col-span-5 p-4 rounded-xl border border-neutral-800 bg-neutral-900/60 space-y-4">
          <div className="flex items-center justify-between text-xs font-semibold text-white">
            <span>Inspector & Render Output</span>
            <span className="font-mono text-[11px] text-amber-400">1080p · 30 FPS</span>
          </div>

          <div className="p-3 bg-neutral-950 rounded-lg text-xs space-y-2 font-mono">
            <div className="text-neutral-400">
              Total Clips: {tracks.reduce((sum, t) => sum + t.clips.length, 0)} items across {tracks.length} tracks
            </div>
            <div className="text-neutral-400">Duration: {duration.toFixed(1)}s timeline</div>
            <div className="text-neutral-400">Subtitles: Burned drawtext typography</div>
          </div>

          {renderedExportUrl && (
            <div className="pt-2 border-t border-neutral-800 flex items-center gap-2">
              <a
                href={renderedExportUrl}
                download="liberty_master_edit.mp4"
                className="flex-1 py-2 px-3 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Master MP4</span>
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Non-Linear Multi-Track Timeline */}
      <div className="p-5 rounded-xl border border-neutral-800 bg-neutral-900/60 space-y-3">
        <div className="flex items-center justify-between text-xs font-semibold text-neutral-300 pb-2 border-b border-neutral-800">
          <span>Tracks Timeline</span>
          <span className="text-[11px] font-mono text-neutral-500">Playhead: {currentTime.toFixed(1)}s</span>
        </div>

        {/* Track Rows */}
        <div className="space-y-3">
          {tracks.map((track) => (
            <div key={track.id} className="space-y-1">
              <div className="flex items-center justify-between text-[11px] text-neutral-400 font-mono">
                <span>{track.name}</span>
                <span className="text-neutral-500 uppercase">{track.type}</span>
              </div>

              {/* Track Lane */}
              <div className="h-14 bg-neutral-950 border border-neutral-800 rounded-lg relative overflow-hidden flex items-center px-1">
                {/* Playhead marker line */}
                <div
                  style={{ left: `${(currentTime / duration) * 100}%` }}
                  className="absolute top-0 bottom-0 w-0.5 bg-amber-400 z-20 pointer-events-none"
                />

                {track.clips.map((clip) => {
                  const leftPct = (clip.start / duration) * 100;
                  const widthPct = (clip.duration / duration) * 100;
                  const isSelected = selectedClipId === clip.id;

                  let clipColor = 'bg-purple-900/60 border-purple-600 text-purple-200';
                  if (track.type === 'audio') {
                    clipColor = 'bg-cyan-900/60 border-cyan-600 text-cyan-200';
                  } else if (track.type === 'subtitle') {
                    clipColor = 'bg-amber-900/60 border-amber-600 text-amber-200';
                  }

                  return (
                    <div
                      key={clip.id}
                      onClick={() => setSelectedClipId(clip.id)}
                      style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                      className={`absolute h-10 rounded border p-2 flex items-center justify-between truncate cursor-pointer transition-all hover:brightness-125 ${clipColor} ${
                        isSelected ? 'ring-2 ring-white' : ''
                      }`}
                    >
                      <div className="truncate pr-1">
                        <div className="text-[11px] font-semibold truncate leading-tight">
                          {clip.text || clip.label}
                        </div>
                        <div className="text-[9px] font-mono opacity-70">
                          {clip.start}s - {clip.start + clip.duration}s
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClip(track.id, clip.id);
                        }}
                        className="opacity-60 hover:opacity-100 hover:text-red-300 p-0.5"
                        title="Delete clip"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Clip Modal */}
      {isAddClipOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleAddClipSubmit}
            className="bg-neutral-900 border border-neutral-800 rounded-xl w-full max-w-md p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
              <h3 className="text-sm font-bold text-white">Add Clip to Timeline</h3>
              <button
                type="button"
                onClick={() => setIsAddClipOpen(false)}
                className="text-neutral-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">Target Track</label>
              <select
                value={targetTrackId}
                onChange={(e) => setTargetTrackId(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-xs text-white"
              >
                {tracks.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.type.toUpperCase()})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">Clip Title / Label</label>
              <input
                type="text"
                required
                value={newClipLabel}
                onChange={(e) => setNewClipLabel(e.target.value)}
                placeholder="e.g. B-Roll Dolly Shot"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-xs text-white"
              />
            </div>

            {tracks.find((t) => t.id === targetTrackId)?.type === 'subtitle' && (
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">Subtitle Text</label>
                <input
                  type="text"
                  required
                  value={newClipText}
                  onChange={(e) => setNewClipText(e.target.value)}
                  placeholder="e.g. The future of creative AI is here"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-xs text-white"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">Start Time (sec)</label>
                <input
                  type="number"
                  min={0}
                  step={0.5}
                  value={newClipStart}
                  onChange={(e) => setNewClipStart(Number(e.target.value))}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-xs font-mono text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">Duration (sec)</label>
                <input
                  type="number"
                  min={1}
                  step={0.5}
                  value={newClipDuration}
                  onChange={(e) => setNewClipDuration(Number(e.target.value))}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-xs font-mono text-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAddClipOpen(false)}
                className="px-3 py-1.5 border border-neutral-700 text-neutral-300 text-xs rounded-lg hover:bg-neutral-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold rounded-lg"
              >
                Insert Clip
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
