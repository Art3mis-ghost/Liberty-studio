import fs from 'node:fs';
import path from 'node:path';
import { geminiClient } from './providers/gemini/GeminiClient.js';
import { geminiImageProvider } from './providers/gemini/GeminiImageProvider.js';
import { geminiVideoProvider } from './providers/gemini/GeminiVideoProvider.js';
import { geminiAudioProvider } from './providers/gemini/GeminiAudioProvider.js';
import { geminiChatProvider, CreativeRole, ChatMessage } from './providers/gemini/GeminiChatProvider.js';
import { jobQueue } from './jobQueue.js';

export class GeminiService {
  private outputDir: string;

  constructor() {
    this.outputDir = path.resolve(process.cwd(), 'public/storage/generations');
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  public isConfigured(): boolean {
    return geminiClient.isConfigured();
  }

  public getStatus() {
    return geminiClient.getStatus();
  }

  /**
   * Generates a hyper-realistic AI image using Gemini model (gemini-nano-banana-2.1 or gemini-3.1-flash-lite-image)
   */
  public async generateImage(
    jobId: string,
    prompt: string,
    aspectRatio: string = '16:9',
    model: 'gemini-nano-banana-2.1' | 'gemini-3.1-flash-lite-image' = 'gemini-nano-banana-2.1'
  ): Promise<string> {
    jobQueue.updateProgress(jobId, 15, `Initializing Google Gemini Image API (${model})`);

    let apiAspect: '1:1' | '16:9' | '9:16' | '4:3' | '3:4' = '16:9';
    if (aspectRatio === '1:1' || aspectRatio === '9:16' || aspectRatio === '4:3' || aspectRatio === '3:4' || aspectRatio === '16:9') {
      apiAspect = aspectRatio as any;
    }

    jobQueue.updateProgress(jobId, 45, 'Synthesizing neural latent diffusion with Gemini engine');

    try {
      const result = await geminiImageProvider.generateImage({
        prompt,
        model,
        aspectRatio: apiAspect,
      });

      jobQueue.updateProgress(jobId, 100, 'Gemini image generation completed successfully');
      return result.url;
    } catch (err: any) {
      throw new Error(`Gemini Image Generation failed: ${err.message}`);
    }
  }

  /**
   * Modifies an existing image with a text prompt instruction using gemini-nano-banana-2.1
   */
  public async editImage(
    jobId: string,
    sourceImageUrl: string,
    instruction: string
  ): Promise<string> {
    jobQueue.updateProgress(jobId, 20, 'Loading source frame and conditioning prompt instructions');

    try {
      const result = await geminiImageProvider.editImage({
        sourceImageDataOrPath: sourceImageUrl,
        instruction,
        model: 'gemini-nano-banana-2.1',
      });

      jobQueue.updateProgress(jobId, 100, 'Gemini image editing completed successfully');
      return result.url;
    } catch (err: any) {
      throw new Error(`Gemini Image Editing failed: ${err.message}`);
    }
  }

  /**
   * Generates a video directly using gemini-omni-1.2-flash via Interactions API
   * Or animates a photo if sourceImageUrl is provided.
   */
  public async generateVideo(
    jobId: string,
    options: {
      prompt: string;
      sourceImageUrl?: string;
      cameraPreset?: any;
      aspectRatio?: any;
      durationSeconds?: number;
      fps?: number;
      motionStrength?: number;
      seed?: number;
    }
  ): Promise<string> {
    jobQueue.updateProgress(jobId, 15, 'Routing job to Google Gemini Video (gemini-omni-1.2-flash)');

    const aspect: '16:9' | '9:16' = options.aspectRatio === '9:16' ? '9:16' : '16:9';
    const duration: '5s' | '10s' = options.durationSeconds && options.durationSeconds <= 5 ? '5s' : '10s';

    try {
      if (options.sourceImageUrl) {
        // Photo to Video Animation
        jobQueue.updateProgress(jobId, 30, 'Conditioning source photo for neural motion synthesis');
        const animResult = await geminiVideoProvider.animatePhotoToVideo(
          {
            imageDataOrPath: options.sourceImageUrl,
            prompt: options.prompt || 'Bring this photo to life with smooth cinematic motion',
            aspectRatio: aspect,
            duration,
          },
          (stage, pct) => jobQueue.updateProgress(jobId, pct, stage)
        );
        jobQueue.updateProgress(jobId, 100, 'Photo-to-video animation complete');
        return animResult.url;
      }

      // Text to Video directly via Omni Flash
      const result = await geminiVideoProvider.generateVideoFromText(
        {
          prompt: options.prompt,
          aspectRatio: aspect,
          duration,
          resolution: '720p',
        },
        (stage, pct) => jobQueue.updateProgress(jobId, pct, stage)
      );

      jobQueue.updateProgress(jobId, 100, 'Gemini Omni Flash video generation complete');
      return result.url;
    } catch (err: any) {
      throw new Error(`Gemini Video generation failed: ${err.message}`);
    }
  }

  /**
   * Transcribes audio using gemini-3.5-transcribe
   */
  public async transcribeAudio(
    audioDataOrPath: string,
    mimeType: string = 'audio/wav'
  ) {
    return await geminiAudioProvider.transcribeAudio(audioDataOrPath, mimeType);
  }

  /**
   * Generates music using Lyria (lyria-3-clip-preview or lyria-3-pro-preview)
   */
  public async generateMusic(
    prompt: string,
    mode: 'clip' | 'track' = 'clip',
    imageBase64?: string
  ) {
    return await geminiAudioProvider.generateMusic(prompt, mode, imageBase64);
  }

  /**
   * Interactive multi-turn chat with Creative Chatbot
   */
  public async sendChatMessage(params: {
    message: string;
    role?: CreativeRole;
    history?: ChatMessage[];
    model?: 'gemini-4-argon' | 'gemini-3.8-flash' | 'gemini-3.1-flash-lite';
    previousInteractionId?: string;
  }) {
    return await geminiChatProvider.sendMessage(params);
  }

  /**
   * Enhances visual prompts for cinematography
   */
  public async enhancePrompt(prompt: string, style: string = 'cinematic'): Promise<{
    enhancedPrompt: string;
    cinematicCamera: string;
    lighting: string;
    negativePrompt: string;
    aspectRatio: string;
  }> {
    if (!this.isConfigured()) {
      return {
        enhancedPrompt: `${prompt}, hyperrealistic 8k masterpiece, photorealistic cinema render, volumetric lighting, Arri Alexa Mini LF, 35mm lens, optical bokeh`,
        cinematicCamera: 'Dolly In with 35mm prime lens',
        lighting: 'Volumetric cinematic key and rim lighting',
        negativePrompt: 'blurry, distorted, artifacts, bad anatomy, oversaturated, lowres, watermarks',
        aspectRatio: '16:9',
      };
    }

    try {
      const ai = geminiClient.getClient();
      const res = await ai.interactions.create({
        model: 'gemini-3.8-flash',
        input: `Enhance this creative prompt into a production-grade cinematography description for image/video generation:\n"${prompt}" (Style: ${style}). Return a structured brief with enhancedPrompt, cinematicCamera, lighting, negativePrompt, aspectRatio.`,
      });

      const text = res.output_text || '';
      return {
        enhancedPrompt: text || `${prompt}, photorealistic 8k cinema render`,
        cinematicCamera: 'Tracking shot with Cooke Anamorphic lens',
        lighting: 'High-contrast chiaroscuro with soft rim highlights',
        negativePrompt: 'blurry, low quality, artifacts, watermark, cartoonish, low resolution',
        aspectRatio: '16:9',
      };
    } catch {
      return {
        enhancedPrompt: `${prompt}, ultra-detailed 8k masterpiece, photorealistic cinema render, volumetric lighting, Arri Alexa Mini LF, 35mm lens, optical bokeh`,
        cinematicCamera: 'Dolly In with 35mm prime lens',
        lighting: 'Volumetric cinematic key and rim lighting',
        negativePrompt: 'blurry, distorted, artifacts, bad anatomy, oversaturated, lowres, watermarks',
        aspectRatio: '16:9',
      };
    }
  }

  /**
   * Identifies viral shorts segments from video title/transcript
   */
  public async analyzeShorts(title: string, durationSeconds: number) {
    if (!this.isConfigured()) return [];
    try {
      const ai = geminiClient.getClient();
      const res = await ai.interactions.create({
        model: 'gemini-3.8-flash',
        input: `You are an expert short-form video editor (Kixy/OpusClip style).
Analyze this video: "${title}" (total duration: ${durationSeconds} seconds).
Select 3 high-impact segments between 15s and 30s that make incredible viral TikTok/YouTube Shorts hooks.
Return JSON array of: [{ "startTime": number, "endTime": number, "headline": string, "hook": string, "viralScore": number, "reason": string }]. Output ONLY valid JSON array.`,
      });

      const text = res.output_text || '';
      const match = text.match(/\[[\s\S]*\]/);
      if (match) {
        return JSON.parse(match[0]);
      }
      return [];
    } catch {
      return [];
    }
  }
}

export const geminiService = new GeminiService();
