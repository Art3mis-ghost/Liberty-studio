import fs from 'node:fs';
import path from 'node:path';
import { geminiClient } from './GeminiClient.js';

export interface TranscriptionResult {
  fullText: string;
  segments: Array<{
    start: number;
    end: number;
    text: string;
  }>;
  duration?: number;
  language?: string;
  model: string;
}

export interface MusicGenerationResult {
  url: string;
  filePath: string;
  lyrics?: string;
  mimeType: string;
  model: string;
}

export class GeminiAudioProvider {
  private outputDir: string;

  constructor() {
    this.outputDir = path.resolve(process.cwd(), 'public/storage/generations');
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  public isAvailable(): boolean {
    return geminiClient.isConfigured();
  }

  /**
   * Transcribes microphone audio or audio file using gemini-3.5-transcribe
   */
  public async transcribeAudio(
    audioDataOrPath: string,
    mimeType: string = 'audio/wav'
  ): Promise<TranscriptionResult> {
    const ai = geminiClient.getClient();
    const model = 'gemini-3.5-transcribe';

    let base64AudioData = '';
    let resolvedMime = mimeType;

    if (audioDataOrPath.startsWith('data:audio/')) {
      const parts = audioDataOrPath.split(',');
      base64AudioData = parts[1];
      const match = parts[0].match(/:(.*?);/);
      if (match) resolvedMime = match[1];
    } else if (audioDataOrPath.startsWith('/storage/')) {
      const fullPath = path.resolve(process.cwd(), 'public', audioDataOrPath.replace(/^\//, ''));
      if (fs.existsSync(fullPath)) {
        base64AudioData = fs.readFileSync(fullPath).toString('base64');
        if (fullPath.endsWith('.mp3')) resolvedMime = 'audio/mp3';
        else if (fullPath.endsWith('.wav')) resolvedMime = 'audio/wav';
        else if (fullPath.endsWith('.webm')) resolvedMime = 'audio/webm';
        else if (fullPath.endsWith('.mp4') || fullPath.endsWith('.m4a')) resolvedMime = 'audio/mp4';
      } else {
        throw new Error(`Audio file not found at ${fullPath}`);
      }
    } else if (fs.existsSync(audioDataOrPath)) {
      base64AudioData = fs.readFileSync(audioDataOrPath).toString('base64');
    } else {
      base64AudioData = audioDataOrPath;
    }

    try {
      const interaction = await ai.interactions.create({
        model,
        input: [
          {
            type: 'audio',
            data: base64AudioData,
            mime_type: resolvedMime,
          },
          {
            type: 'text',
            text: 'Transcribe this audio recording accurately. Provide timestamp markers in [MM:SS] or [SS.SSs] format where possible followed by the transcribed speech text.',
          },
        ],
      });

      let fullText = interaction.output_text || '';
      if (!fullText && interaction.steps) {
        for (const step of interaction.steps) {
          if (step.type === 'model_output') {
            const textContent = step.content?.find((c: any) => c.type === 'text');
            if (textContent?.text) fullText += textContent.text;
          }
        }
      }

      if (!fullText) {
        throw new Error('Gemini transcribe model returned no transcription text.');
      }

      // Parse segment timestamps if available
      const lines = fullText.split('\n').filter(l => l.trim().length > 0);
      const segments: Array<{ start: number; end: number; text: string }> = [];

      let currentSec = 0;
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const match = line.match(/\[(\d{1,2}):(\d{2})\]/);
        if (match) {
          const start = parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
          const clean = line.replace(/\[\d{1,2}:\d{2}\]/g, '').trim();
          segments.push({
            start,
            end: start + 4,
            text: clean,
          });
          currentSec = start + 4;
        } else {
          segments.push({
            start: currentSec,
            end: currentSec + 3,
            text: line.trim(),
          });
          currentSec += 3;
        }
      }

      return {
        fullText: fullText.trim(),
        segments,
        model,
      };
    } catch (err: any) {
      throw new Error(`Gemini Audio Transcription failed: ${err.message}`);
    }
  }

  /**
   * Generates music using lyria-3-clip-preview (30s) or lyria-3-pro-preview
   */
  public async generateMusic(
    prompt: string,
    mode: 'clip' | 'track' = 'clip',
    imageBase64?: string
  ): Promise<MusicGenerationResult> {
    const ai = geminiClient.getClient();
    const model = mode === 'track' ? 'lyria-3-pro-preview' : 'lyria-3-clip-preview';

    try {
      const contentsPayload: any = imageBase64
        ? {
            parts: [
              { text: prompt },
              { inlineData: { data: imageBase64, mimeType: 'image/jpeg' } },
            ],
          }
        : prompt;

      const response = await ai.models.generateContentStream({
        model,
        contents: contentsPayload,
      });

      let audioBase64 = '';
      let lyrics = '';
      let mimeType = 'audio/wav';

      for await (const chunk of response) {
        const parts = chunk.candidates?.[0]?.content?.parts;
        if (!parts) continue;

        for (const part of parts) {
          if (part.inlineData?.data) {
            if (!audioBase64 && part.inlineData.mimeType) {
              mimeType = part.inlineData.mimeType;
            }
            audioBase64 += part.inlineData.data;
          }
          if (part.text && !lyrics) {
            lyrics = part.text;
          }
        }
      }

      if (!audioBase64) {
        throw new Error(`Lyria music generation model (${model}) finished without returning audio data.`);
      }

      const ext = mimeType.includes('mp3') ? 'mp3' : 'wav';
      const filename = `lyria_music_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${ext}`;
      const filePath = path.join(this.outputDir, filename);

      fs.writeFileSync(filePath, Buffer.from(audioBase64, 'base64'));

      return {
        url: `/storage/generations/${filename}`,
        filePath,
        lyrics,
        mimeType,
        model,
      };
    } catch (err: any) {
      throw new Error(`Lyria Music generation failed (${model}): ${err.message}`);
    }
  /**
   * Generates natural speech using gemini-3.8-flash-lite-tts
   */
  public async generateSpeech(
    text: string,
    voice: string = 'Kore'
  ): Promise<{ url: string; filePath: string }> {
    const ai = geminiClient.getClient();
    const model = 'gemini-3.8-flash-lite-tts';

    try {
      const interaction = await ai.interactions.create({
        model,
        input: [
          {
            type: 'text',
            text,
          },
        ],
        response_format: { type: 'audio' },
        generation_config: {
          speech_config: [
            {
              language: 'en-US',
              voice: voice || 'Kore',
            },
          ],
        },
      });

      const audio = interaction.output_audio;
      if (!audio?.data) {
        throw new Error('Gemini TTS model completed without returning audio bytes.');
      }

      const filename = `gemini_tts_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.wav`;
      const filePath = path.join(this.outputDir, filename);

      fs.writeFileSync(filePath, Buffer.from(audio.data, 'base64'));

      return {
        url: `/storage/generations/${filename}`,
        filePath,
      };
    } catch (err: any) {
      throw new Error(`Gemini TTS failed (${model}): ${err.message}`);
    }
  }
}

export const geminiAudioProvider = new GeminiAudioProvider();
