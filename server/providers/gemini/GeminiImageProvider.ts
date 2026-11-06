import fs from 'node:fs';
import path from 'node:path';
import { geminiClient } from './GeminiClient.js';

export interface ImageGenerationParams {
  prompt: string;
  model?: 'gemini-nano-banana-2.1' | 'gemini-3.1-flash-lite-image';
  aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3' | '3:4';
  imageSize?: '1K' | '2K' | '4K';
  negativePrompt?: string;
}

export interface ImageEditParams {
  sourceImageDataOrPath: string; // base64 string or local path / URL
  instruction: string;
  model?: 'gemini-nano-banana-2.1' | 'gemini-3.1-flash-lite-image';
  aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3' | '3:4';
}

export class GeminiImageProvider {
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
   * Generates a high fidelity image using Gemini image models (gemini-nano-banana-2.1 or gemini-3.1-flash-lite-image)
   */
  public async generateImage(params: ImageGenerationParams): Promise<{
    url: string;
    filePath: string;
    model: string;
    mimeType: string;
  }> {
    const ai = geminiClient.getClient();
    const model = params.model || 'gemini-nano-banana-2.1';
    const aspectRatio = params.aspectRatio || '16:9';

    let promptText = params.prompt;
    if (params.negativePrompt && params.negativePrompt.trim()) {
      promptText += ` (Avoid: ${params.negativePrompt.trim()})`;
    }

    try {
      const interaction = await ai.interactions.create({
        model,
        input: promptText,
        response_modalities: ['image', 'text'],
        generation_config: {
          image_config: {
            aspect_ratio: aspectRatio,
            ...(params.imageSize && model === 'gemini-nano-banana-2.1' ? { image_size: params.imageSize } : {}),
          },
        },
      });

      let base64Data: string | null = null;
      let mimeType = 'image/png';

      // Check output_image convenience property first
      if (interaction.output_image?.data) {
        base64Data = interaction.output_image.data;
        mimeType = interaction.output_image.mime_type || 'image/png';
      } else {
        // Look through steps
        for (const step of interaction.steps || []) {
          if (step.type === 'model_output') {
            const imgContent = step.content?.find((c: any) => c.type === 'image');
            if (imgContent && imgContent.data) {
              base64Data = imgContent.data;
              mimeType = imgContent.mime_type || 'image/png';
              break;
            }
          }
        }
      }

      if (!base64Data) {
        throw new Error(`Model ${model} completed interaction without returning image bytes.`);
      }

      const ext = mimeType.includes('jpeg') || mimeType.includes('jpg') ? 'jpg' : 'png';
      const filename = `gemini_img_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;
      const filePath = path.join(this.outputDir, filename);

      fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));

      return {
        url: `/storage/generations/${filename}`,
        filePath,
        model,
        mimeType,
      };
    } catch (err: any) {
      // If interactions format fails or model prefers standard generateContent
      if (model === 'gemini-3.1-flash-lite-image') {
        const response = await ai.models.generateContent({
          model: 'gemini-3.1-flash-lite-image',
          contents: {
            parts: [{ text: promptText }],
          },
          config: {
            imageConfig: {
              aspectRatio,
            },
          },
        });

        let base64Data: string | null = null;
        let mimeType = 'image/png';
        for (const part of response.candidates?.[0]?.content?.parts ?? []) {
          if (part.inlineData?.data) {
            base64Data = part.inlineData.data;
            mimeType = part.inlineData.mimeType || 'image/png';
            break;
          }
        }

        if (base64Data) {
          const ext = mimeType.includes('jpeg') ? 'jpg' : 'png';
          const filename = `gemini_img_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;
          const filePath = path.join(this.outputDir, filename);
          fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));
          return {
            url: `/storage/generations/${filename}`,
            filePath,
            model,
            mimeType,
          };
        }
      }
      throw new Error(`Gemini Image generation failed: ${err.message}`);
    }
  }

  /**
   * Modifies an existing image with text instructions using Gemini image editing models
   */
  public async editImage(params: ImageEditParams): Promise<{
    url: string;
    filePath: string;
    model: string;
    mimeType: string;
  }> {
    const ai = geminiClient.getClient();
    const model = params.model || 'gemini-nano-banana-2.1';

    let base64ImageData = '';
    let mimeType = 'image/png';

    if (params.sourceImageDataOrPath.startsWith('data:image/')) {
      const parts = params.sourceImageDataOrPath.split(',');
      base64ImageData = parts[1];
      const match = parts[0].match(/:(.*?);/);
      if (match) mimeType = match[1];
    } else if (params.sourceImageDataOrPath.startsWith('/storage/') || params.sourceImageDataOrPath.startsWith('http')) {
      // Local path in public/storage
      const localRelPath = params.sourceImageDataOrPath.replace(/^\//, '');
      const fullPath = path.resolve(process.cwd(), 'public', localRelPath);
      if (fs.existsSync(fullPath)) {
        base64ImageData = fs.readFileSync(fullPath).toString('base64');
        mimeType = fullPath.endsWith('.jpg') || fullPath.endsWith('.jpeg') ? 'image/jpeg' : 'image/png';
      } else {
        throw new Error(`Source image file not found at ${fullPath}`);
      }
    } else {
      // Direct base64 or path
      if (fs.existsSync(params.sourceImageDataOrPath)) {
        base64ImageData = fs.readFileSync(params.sourceImageDataOrPath).toString('base64');
        mimeType = params.sourceImageDataOrPath.endsWith('.jpg') ? 'image/jpeg' : 'image/png';
      } else {
        base64ImageData = params.sourceImageDataOrPath;
      }
    }

    try {
      const interaction = await ai.interactions.create({
        model,
        input: [
          {
            type: 'image',
            data: base64ImageData,
            mime_type: mimeType,
          },
          {
            type: 'text',
            text: params.instruction,
          },
        ],
        response_modalities: ['image', 'text'],
      });

      let editedBase64: string | null = null;
      let outMime = 'image/png';

      if (interaction.output_image?.data) {
        editedBase64 = interaction.output_image.data;
        outMime = interaction.output_image.mime_type || 'image/png';
      } else {
        for (const step of interaction.steps || []) {
          if (step.type === 'model_output') {
            const imgContent = step.content?.find((c: any) => c.type === 'image');
            if (imgContent && imgContent.data) {
              editedBase64 = imgContent.data;
              outMime = imgContent.mime_type || 'image/png';
              break;
            }
          }
        }
      }

      if (!editedBase64) {
        throw new Error(`Gemini image edit completed without returning edited image bytes.`);
      }

      const ext = outMime.includes('jpeg') ? 'jpg' : 'png';
      const filename = `gemini_edit_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;
      const filePath = path.join(this.outputDir, filename);

      fs.writeFileSync(filePath, Buffer.from(editedBase64, 'base64'));

      return {
        url: `/storage/generations/${filename}`,
        filePath,
        model,
        mimeType: outMime,
      };
    } catch (err: any) {
      throw new Error(`Gemini Image editing failed: ${err.message}`);
    }
  }
}

export const geminiImageProvider = new GeminiImageProvider();
