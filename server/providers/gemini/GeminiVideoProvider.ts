import fs from 'node:fs';
import path from 'node:path';
import { geminiClient } from './GeminiClient.js';

export interface VideoGenerationParams {
  prompt: string;
  aspectRatio?: '16:9' | '9:16';
  duration?: '5s' | '10s' | '15s';
  resolution?: '720p' | '1080p' | '360p';
}

export interface AnimatePhotoParams {
  imageDataOrPath: string; // base64 or storage URL
  prompt: string;
  aspectRatio?: '16:9' | '9:16';
  duration?: '5s' | '10s';
  resolution?: '720p' | '1080p';
}

export class GeminiVideoProvider {
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
   * Generates a cinematic video directly from text using gemini-omni-1.2-flash via Interactions API
   */
  public async generateVideoFromText(
    params: VideoGenerationParams,
    onProgress?: (stage: string, percent: number) => void
  ): Promise<{
    url: string;
    filePath: string;
    model: string;
    duration: string;
  }> {
    const ai = geminiClient.getClient();
    const model = 'gemini-omni-1.2-flash';
    const aspectRatio = params.aspectRatio || '16:9';
    const duration = params.duration || '10s';
    const resolution = params.resolution || '720p';

    onProgress?.('Dispatching neural video job to gemini-omni-1.2-flash Interactions API', 15);

    try {
      const interaction = await ai.interactions.create(
        {
          model,
          input: params.prompt,
          background: false,
          store: false,
          stream: false,
          response_format: {
            type: 'video',
            aspect_ratio: aspectRatio,
            duration,
            resolution,
          },
        },
        { timeout: 300000 } // 5 minutes timeout
      );

      onProgress?.('Decoding synthesized video frames from Gemini neural stream', 85);

      const videoPart = interaction.output_video;
      if (!videoPart || !videoPart.data) {
        throw new Error('Gemini Omni Flash completed interaction but returned no video stream data.');
      }

      const filename = `gemini_video_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.mp4`;
      const filePath = path.join(this.outputDir, filename);

      fs.writeFileSync(filePath, Buffer.from(videoPart.data, 'base64'));

      onProgress?.('Video successfully rendered and saved to storage', 100);

      return {
        url: `/storage/generations/${filename}`,
        filePath,
        model,
        duration,
      };
    } catch (err: any) {
      throw new Error(`Gemini Video generation failed (${model}): ${err.message}`);
    }
  }

  /**
   * Animates a static photo into a cinematic video using gemini-omni-1.2-flash
   */
  public async animatePhotoToVideo(
    params: AnimatePhotoParams,
    onProgress?: (stage: string, percent: number) => void
  ): Promise<{
    url: string;
    filePath: string;
    model: string;
  }> {
    const ai = geminiClient.getClient();
    const model = 'gemini-omni-1.2-flash';
    const aspectRatio = params.aspectRatio || '16:9';
    const duration = params.duration || '10s';

    onProgress?.('Preparing source frame for motion synthesis', 10);

    let base64ImageBytes = '';
    let mimeType = 'image/png';

    if (params.imageDataOrPath.startsWith('data:image/')) {
      const parts = params.imageDataOrPath.split(',');
      base64ImageBytes = parts[1];
      const match = parts[0].match(/:(.*?);/);
      if (match) mimeType = match[1];
    } else if (params.imageDataOrPath.startsWith('/storage/')) {
      const localRelPath = params.imageDataOrPath.replace(/^\//, '');
      const fullPath = path.resolve(process.cwd(), 'public', localRelPath);
      if (fs.existsSync(fullPath)) {
        base64ImageBytes = fs.readFileSync(fullPath).toString('base64');
        mimeType = fullPath.endsWith('.jpg') || fullPath.endsWith('.jpeg') ? 'image/jpeg' : 'image/png';
      } else {
        throw new Error(`Source photo not found at ${fullPath}`);
      }
    } else if (fs.existsSync(params.imageDataOrPath)) {
      base64ImageBytes = fs.readFileSync(params.imageDataOrPath).toString('base64');
      mimeType = params.imageDataOrPath.endsWith('.jpg') ? 'image/jpeg' : 'image/png';
    } else {
      base64ImageBytes = params.imageDataOrPath;
    }

    onProgress?.('Submitting conditioning frame to gemini-omni-1.2-flash', 30);

    try {
      const interaction = await ai.interactions.create(
        {
          model,
          input: [
            {
              type: 'image',
              mime_type: mimeType,
              data: base64ImageBytes,
            },
            {
              type: 'text',
              text: params.prompt || 'Bring this photo to life with smooth, natural cinematic motion and realistic environmental depth.',
            },
          ],
          background: false,
          store: false,
          stream: false,
          response_format: {
            type: 'video',
            aspect_ratio: aspectRatio,
            duration,
          },
        },
        { timeout: 300000 }
      );

      onProgress?.('Synthesizing dynamic motion & temporal coherence', 80);

      const videoPart = interaction.output_video;
      if (!videoPart || !videoPart.data) {
        throw new Error('Gemini Omni Flash photo animation returned empty video bytes.');
      }

      const filename = `gemini_animated_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.mp4`;
      const filePath = path.join(this.outputDir, filename);

      fs.writeFileSync(filePath, Buffer.from(videoPart.data, 'base64'));

      onProgress?.('Photo animation complete', 100);

      return {
        url: `/storage/generations/${filename}`,
        filePath,
        model,
      };
    } catch (err: any) {
      throw new Error(`Gemini Photo-to-Video animation failed: ${err.message}`);
    }
  }
}

export const geminiVideoProvider = new GeminiVideoProvider();
