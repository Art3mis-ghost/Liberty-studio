import { GoogleGenAI } from '@google/genai';

export interface GeminiStatus {
  configured: boolean;
  apiKeyPresent: boolean;
  supportedModels: {
    image: string;
    imageEdit: string;
    video: string;
    transcription: string;
    music: string;
    chat: string[];
  };
  error?: string;
}

export class GeminiClient {
  private client: GoogleGenAI | null = null;
  private apiKeyCache: string | null = null;

  public getApiKey(): string | null {
    const key = process.env.GEMINI_API_KEY;
    if (key && key.trim().length > 5 && key !== 'MY_GEMINI_API_KEY') {
      return key.trim();
    }
    return null;
  }

  public isConfigured(): boolean {
    return this.getApiKey() !== null;
  }

  public getClient(): GoogleGenAI {
    const key = this.getApiKey();
    if (!key) {
      throw new Error(
        'GEMINI_API_KEY is not configured. Please set your GEMINI_API_KEY in Google AI Studio (Settings > Secrets) to enable Gemini neural models.'
      );
    }

    if (!this.client || this.apiKeyCache !== key) {
      this.client = new GoogleGenAI({
        apiKey: key,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
      this.apiKeyCache = key;
    }

    return this.client;
  }

  public getStatus(): GeminiStatus {
    const configured = this.isConfigured();
    return {
      configured,
      apiKeyPresent: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY'),
      supportedModels: {
        image: 'gemini-nano-banana-2.1 / gemini-3.1-flash-lite-image',
        imageEdit: 'gemini-nano-banana-2.1',
        video: 'gemini-omni-1.2-flash (via Interactions API)',
        transcription: 'gemini-3.5-transcribe',
        music: 'lyria-3-clip-preview (up to 30s) / lyria-3-pro-preview',
        chat: ['gemini-3.8-flash', 'gemini-4-argon', 'gemini-3.1-flash-lite'],
      },
      ...(!configured && {
        error: 'GEMINI_API_KEY missing or invalid in server environment.',
      }),
    };
  }
}

export const geminiClient = new GeminiClient();
