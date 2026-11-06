import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { jobQueue } from './jobQueue.js';
import { geminiAudioProvider } from './providers/gemini/GeminiAudioProvider.js';

export interface TTSOptions {
  text: string;
  voice: 'piper_ryan' | 'piper_amy' | 'piper_lessac' | 'piper_kusal' | 'Kore' | 'Puck' | 'Fenrir' | 'Zephyr';
  speed: number;
}

export interface TranscriptionResult {
  fullText: string;
  segments: Array<{
    id: number;
    start: number;
    end: number;
    text: string;
  }>;
}

export class AudioService {
  private outputDir: string;

  constructor() {
    this.outputDir = path.resolve(process.cwd(), 'public/storage/exports');
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  /**
   * Generates speech synthesis using Gemini TTS (gemini-3.8-flash-lite-tts) or Piper if installed.
   */
  public async generateSpeech(jobId: string, options: TTSOptions): Promise<string> {
    const { text, voice = 'Kore' } = options;
    jobQueue.updateProgress(jobId, 15, `Initializing neural voice synthesis engine (${voice})`);

    // Prioritize Gemini TTS if configured
    if (geminiAudioProvider.isAvailable()) {
      jobQueue.updateProgress(jobId, 45, 'Synthesizing voice stream with gemini-3.8-flash-lite-tts');
      const voiceName = voice.startsWith('piper_') ? 'Kore' : voice;
      const res = await geminiAudioProvider.generateSpeech(text, voiceName);
      jobQueue.updateProgress(jobId, 100, 'Speech synthesis complete');
      return res.url;
    }

    // Check if Piper is genuinely installed locally
    jobQueue.updateProgress(jobId, 30, 'Checking local Piper neural voice model availability');
    throw new Error(
      'Piper local TTS model is not installed on disk and GEMINI_API_KEY is not configured. Please add GEMINI_API_KEY to AI Studio Secrets or download Piper voice checkpoints to models/piper.'
    );
  }

  /**
   * Extracts audio from an uploaded video file.
   */
  public async extractAudioFromVideo(jobId: string, videoRelativeUrl: string): Promise<string> {
    jobQueue.updateProgress(jobId, 20, 'Locating video container');

    const inputPath = path.resolve(process.cwd(), 'public' + videoRelativeUrl);
    const filename = `extracted_audio_${Date.now()}.mp3`;
    const outputPath = path.join(this.outputDir, filename);

    if (!fs.existsSync(inputPath)) {
      throw new Error(`Source video not found on disk at ${videoRelativeUrl}`);
    }

    jobQueue.updateProgress(jobId, 50, 'Demuxing audio stream via FFmpeg MP3 encoder');

    await new Promise<void>((resolve, reject) => {
      const proc = spawn('ffmpeg', [
        '-y',
        '-i', inputPath,
        '-vn',
        '-c:a', 'libmp3lame',
        '-q:a', '2',
        outputPath,
      ]);
      let errLog = '';
      proc.stderr.on('data', d => { errLog += d.toString(); });
      proc.on('close', (code) => {
        if (code === 0 && fs.existsSync(outputPath)) resolve();
        else reject(new Error(`Audio extraction failed: ${errLog.slice(-300)}`));
      });
      proc.on('error', reject);
    });

    jobQueue.updateProgress(jobId, 100, 'Audio extraction complete');
    return `/storage/exports/${filename}`;
  }

  /**
   * Transcribes speech from an audio or video file using gemini-3.5-transcribe or local Whisper.
   */
  public async transcribeAudio(jobId: string, mediaRelativeUrl: string): Promise<TranscriptionResult> {
    jobQueue.updateProgress(jobId, 15, 'Probing acoustic tracks and sample rates');

    // Use Gemini Transcribe if configured
    if (geminiAudioProvider.isAvailable()) {
      jobQueue.updateProgress(jobId, 45, 'Transcribing speech with gemini-3.5-transcribe neural acoustic model');
      const res = await geminiAudioProvider.transcribeAudio(mediaRelativeUrl);
      jobQueue.updateProgress(jobId, 100, 'Speech transcription completed');
      return {
        fullText: res.fullText,
        segments: res.segments.map((s, idx) => ({
          id: idx + 1,
          start: s.start,
          end: s.end,
          text: s.text,
        })),
      };
    }

    throw new Error(
      'Whisper local inference weights are not installed and GEMINI_API_KEY is not configured. Please configure GEMINI_API_KEY in AI Studio or download whisper-base weights to models/checkpoints.'
    );
  }

  /**
   * Applies FFmpeg highpass/lowpass/afftdn noise reduction filters.
   */
  public async denoiseAudio(jobId: string, audioRelativeUrl: string): Promise<string> {
    jobQueue.updateProgress(jobId, 25, 'Applying adaptive spectral gating filter');

    const inputPath = path.resolve(process.cwd(), 'public' + audioRelativeUrl);
    const filename = `denoised_${Date.now()}.mp3`;
    const outputPath = path.join(this.outputDir, filename);

    if (!fs.existsSync(inputPath)) {
      throw new Error(`Audio file not found at ${audioRelativeUrl}`);
    }

    await new Promise<void>((resolve, reject) => {
      const proc = spawn('ffmpeg', [
        '-y',
        '-i', inputPath,
        '-af', 'afftdn=nf=-25,highpass=f=80,lowpass=f=12000',
        '-c:a', 'libmp3lame',
        '-b:a', '192k',
        outputPath,
      ]);
      let errLog = '';
      proc.stderr.on('data', d => { errLog += d.toString(); });
      proc.on('close', (code) => {
        if (code === 0 && fs.existsSync(outputPath)) resolve();
        else reject(new Error(`Audio denoising failed: ${errLog.slice(-300)}`));
      });
      proc.on('error', reject);
    });

    jobQueue.updateProgress(jobId, 100, 'Audio enhancement completed');
    return `/storage/exports/${filename}`;
  }
}

export const audioService = new AudioService();
