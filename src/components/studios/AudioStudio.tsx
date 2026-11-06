import React, { useState, useRef } from 'react';
import { BackgroundJob } from '../../types/index.ts';
import { api } from '../../services/api.ts';
import {
  Mic,
  Volume2,
  Download,
  Play,
  FileAudio,
  Sparkles,
  Loader2,
  CheckCircle2,
  Upload,
  Copy,
  Check,
  FileText,
  ShieldAlert,
} from 'lucide-react';

interface AudioStudioProps {
  activeJob: BackgroundJob | null;
  onJobCreated: (jobId: string) => void;
}

export const AudioStudio: React.FC<AudioStudioProps> = ({
  activeJob,
  onJobCreated,
}) => {
  const [subMode, setSubMode] = useState<'tts' | 'transcribe' | 'denoise'>('tts');

  // TTS State
  const [ttsText, setTtsText] = useState(
    'Welcome to Liberty Studio AI. This voice is synthesized using open-source neural weights running locally with zero latency.'
  );
  const [voice, setVoice] = useState('piper_ryan');
  const [speed, setSpeed] = useState(1.0);
  const [generatedAudioUrl, setGeneratedAudioUrl] = useState<string>('');

  // Transcription State
  const [transcriptionMediaUrl, setTranscriptionMediaUrl] = useState('/storage/generations/sample.mp4');
  const [transcriptionResult, setTranscriptionResult] = useState<any>(null);
  const [copiedTranscript, setCopiedTranscript] = useState(false);

  // Denoise State
  const [denoiseMediaUrl, setDenoiseMediaUrl] = useState('/storage/generations/sample.mp4');
  const [denoisedAudioUrl, setDenoisedAudioUrl] = useState<string>('');

  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const voices = [
    { id: 'piper_ryan', name: 'Ryan (Baritone / Confident Narrator)', accent: 'American' },
    { id: 'piper_amy', name: 'Amy (Warm / Conversational)', accent: 'American' },
    { id: 'piper_lessac', name: 'Lessac (Articulate / Documentary)', accent: 'Neutral' },
    { id: 'piper_kusal', name: 'Kusal (Energetic / Short-form Hook)', accent: 'Global' },
  ];

  const isJobRunning = Boolean(activeJob && activeJob.type === 'audio' && activeJob.status === 'processing');

  const handleSynthesize = async () => {
    if (!ttsText.trim()) return;
    try {
      const { jobId } = await api.generateTTS(ttsText, voice, speed);
      onJobCreated(jobId);
    } catch (err) {
      console.error('TTS error:', err);
    }
  };

  const handleTranscribe = async () => {
    try {
      const { jobId } = await api.transcribeAudio(transcriptionMediaUrl);
      onJobCreated(jobId);
    } catch (err) {
      console.error('Transcription error:', err);
    }
  };

  const handleDenoise = async () => {
    try {
      const { jobId } = await api.denoiseAudio(denoiseMediaUrl);
      onJobCreated(jobId);
    } catch (err) {
      console.error('Denoise error:', err);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await api.uploadFile(file);
      if (subMode === 'transcribe') {
        setTranscriptionMediaUrl(res.url);
      } else if (subMode === 'denoise') {
        setDenoiseMediaUrl(res.url);
      }
    } catch (err) {
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  React.useEffect(() => {
    if (activeJob && activeJob.type === 'audio' && activeJob.status === 'completed') {
      if (activeJob.result?.audioUrl) {
        setGeneratedAudioUrl(activeJob.result.audioUrl);
      }
      if (activeJob.result?.transcription) {
        setTranscriptionResult(activeJob.result.transcription);
      }
      if (activeJob.result?.denoisedUrl) {
        setDenoisedAudioUrl(activeJob.result.denoisedUrl);
      }
    }
  }, [activeJob]);

  const copyFullTranscript = () => {
    if (!transcriptionResult?.fullText) return;
    navigator.clipboard.writeText(transcriptionResult.fullText);
    setCopiedTranscript(true);
    setTimeout(() => setCopiedTranscript(false), 2000);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-neutral-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white">
              AI Audio & Speech Studio
            </h1>
            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded border border-rose-800/40 bg-rose-950/60 text-rose-300">
              PIPER TTS & WHISPER
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            Local neural voiceover synthesis, Whisper speech-to-text transcription, and FFT acoustic noise reduction.
          </p>
        </div>

        {/* Sub-mode Segmented Tabs */}
        <div className="flex items-center gap-1 p-1 bg-neutral-900 border border-neutral-800 rounded-lg">
          <button
            onClick={() => setSubMode('tts')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              subMode === 'tts'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Neural TTS
          </button>
          <button
            onClick={() => setSubMode('transcribe')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              subMode === 'transcribe'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Whisper Transcribe
          </button>
          <button
            onClick={() => setSubMode('denoise')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              subMode === 'denoise'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Noise Reduction
          </button>
        </div>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept="audio/*,video/*"
        className="hidden"
      />

      {/* MODE 1: Neural Text-to-Speech (Piper) */}
      {subMode === 'tts' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-neutral-200">
                Voiceover Script Text
              </label>
              <textarea
                rows={4}
                value={ttsText}
                onChange={(e) => setTtsText(e.target.value)}
                placeholder="Enter narration text to synthesize..."
                className="w-full bg-neutral-900/80 border border-neutral-800 rounded-xl p-3.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-neutral-200">
                Neural Voice Model (Piper)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {voices.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setVoice(v.id)}
                    className={`p-3 rounded-xl border text-left transition-colors ${
                      voice === v.id
                        ? 'bg-rose-600/20 border-rose-500 text-white font-semibold'
                        : 'bg-neutral-900/60 border-neutral-800 text-neutral-400 hover:text-white'
                    }`}
                  >
                    <div className="text-xs truncate">{v.name}</div>
                    <div className="text-[11px] text-neutral-500 mt-0.5 font-mono">{v.accent} Accent</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-900/40 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-neutral-300">Speaking Rate</span>
                <span className="font-mono text-rose-400">{speed}x</span>
              </div>
              <input
                type="range"
                min={0.75}
                max={1.5}
                step={0.05}
                value={speed}
                onChange={(e) => setSpeed(Number(e.target.value))}
                className="w-full h-1.5 bg-neutral-800 rounded appearance-none cursor-pointer"
              />
            </div>

            <button
              onClick={handleSynthesize}
              disabled={isJobRunning || !ttsText.trim()}
              className="w-full py-3.5 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
            >
              {isJobRunning ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Synthesizing Voiceover ({activeJob?.progress || 0}%)</span>
                </>
              ) : (
                <>
                  <Mic className="w-3.5 h-3.5" />
                  <span>Synthesize Local Voiceover</span>
                </>
              )}
            </button>
          </div>

          <div className="lg:col-span-5 space-y-4">
            <div className="p-5 rounded-xl border border-neutral-800 bg-neutral-900/60 space-y-4">
              <div className="flex items-center justify-between text-xs font-semibold text-white">
                <span>Synthesized Audio Track</span>
                <span className="font-mono text-[11px] text-rose-400">MP3 · 192 kbps</span>
              </div>

              <div className="p-6 bg-black rounded-lg border border-neutral-800 flex flex-col items-center justify-center text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-neutral-800 flex items-center justify-center text-rose-400 shadow">
                  <FileAudio className="w-6 h-6" />
                </div>

                {generatedAudioUrl ? (
                  <div className="w-full space-y-3 pt-2">
                    <audio src={generatedAudioUrl} controls className="w-full" />
                  </div>
                ) : (
                  <p className="text-xs text-neutral-500">
                    Click Synthesize to generate your voiceover track.
                  </p>
                )}
              </div>

              {generatedAudioUrl && (
                <div className="pt-2 border-t border-neutral-800 flex items-center justify-between">
                  <span className="text-xs text-emerald-400 font-mono flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Render Complete</span>
                  </span>
                  <a
                    href={generatedAudioUrl}
                    download="liberty_voiceover.mp3"
                    className="py-1.5 px-3 bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download MP3</span>
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODE 2: Whisper Speech-to-Text Transcription */}
      {subMode === 'transcribe' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-6 space-y-4">
            <div className="p-5 rounded-xl border border-neutral-800 bg-neutral-900/60 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-white">Source Media File</h3>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium rounded-lg flex items-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5 text-rose-400" />
                  <span>{uploading ? 'Uploading...' : 'Upload Audio / Video'}</span>
                </button>
              </div>

              <div className="p-3 bg-neutral-950 rounded border border-neutral-800 text-xs font-mono text-neutral-300 truncate">
                Selected: {transcriptionMediaUrl}
              </div>

              <button
                onClick={handleTranscribe}
                disabled={isJobRunning}
                className="w-full py-3 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {isJobRunning ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Executing Whisper Transcription ({activeJob?.progress || 0}%)...</span>
                  </>
                ) : (
                  <>
                    <FileText className="w-3.5 h-3.5" />
                    <span>Transcribe Speech (Whisper Model)</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="lg:col-span-6 space-y-4">
            <div className="p-5 rounded-xl border border-neutral-800 bg-neutral-900/60 space-y-4">
              <div className="flex items-center justify-between text-xs font-semibold text-white">
                <span>Timestamped Transcript</span>
                {transcriptionResult && (
                  <button
                    onClick={copyFullTranscript}
                    className="text-rose-400 hover:text-rose-300 flex items-center gap-1 text-[11px]"
                  >
                    {copiedTranscript ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedTranscript ? 'Copied' : 'Copy All'}</span>
                  </button>
                )}
              </div>

              {transcriptionResult ? (
                <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                  {transcriptionResult.segments.map((seg: any) => (
                    <div key={seg.id} className="p-2.5 bg-neutral-950 rounded border border-neutral-800 text-xs space-y-1">
                      <div className="text-[10px] font-mono text-rose-400">
                        [{seg.start.toFixed(1)}s - {seg.end.toFixed(1)}s]
                      </div>
                      <p className="text-neutral-200 leading-relaxed font-sans">{seg.text}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-neutral-500 text-xs">
                  Click Transcribe to generate timestamped text.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODE 3: Noise Reduction (FFT) */}
      {subMode === 'denoise' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-6 space-y-4">
            <div className="p-5 rounded-xl border border-neutral-800 bg-neutral-900/60 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-white">Audio / Video to Clean</h3>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium rounded-lg flex items-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5 text-rose-400" />
                  <span>{uploading ? 'Uploading...' : 'Upload File'}</span>
                </button>
              </div>

              <div className="p-3 bg-neutral-950 rounded border border-neutral-800 text-xs font-mono text-neutral-300 truncate">
                Selected: {denoiseMediaUrl}
              </div>

              <div className="text-xs text-neutral-400 space-y-1 p-3 bg-neutral-950/60 rounded">
                <div>Filter: Fast Fourier Transform De-Noiser (afftdn)</div>
                <div>Attenuation: -25 dB noise floor suppression</div>
                <div>Frequency: Highpass 80Hz, Lowpass 8000Hz</div>
              </div>

              <button
                onClick={handleDenoise}
                disabled={isJobRunning}
                className="w-full py-3 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {isJobRunning ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Processing Noise Reduction...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Apply Acoustic Noise Reduction</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="lg:col-span-6 space-y-4">
            <div className="p-5 rounded-xl border border-neutral-800 bg-neutral-900/60 space-y-4">
              <div className="flex items-center justify-between text-xs font-semibold text-white">
                <span>Cleaned Audio Stream</span>
                <span className="font-mono text-[11px] text-emerald-400">Denoised</span>
              </div>

              {denoisedAudioUrl ? (
                <div className="space-y-3 pt-2">
                  <audio src={denoisedAudioUrl} controls className="w-full" />
                  <a
                    href={denoisedAudioUrl}
                    download="denoised_audio.mp3"
                    className="w-full py-2 bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Cleaned Audio MP3</span>
                  </a>
                </div>
              ) : (
                <div className="p-8 text-center text-neutral-500 text-xs">
                  Upload audio or video and click Apply to remove background noise.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
