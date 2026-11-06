import { geminiClient } from './GeminiClient.js';

export type CreativeRole = 'cinematographer' | 'screenwriter' | 'video_editor' | 'vfx_supervisor';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: number;
}

const ROLE_SYSTEM_INSTRUCTIONS: Record<CreativeRole, string> = {
  cinematographer: `You are the Master Cinematographer & Director of Photography at Liberty Studio AI.
Your expertise spans camera movement (dolly-in, zoom-out, pan, tilt, orbital tracking shots, crane sweeps), optical lenses (anamorphic 35mm, Cooke S4, Arri Master Primes, anamorphic streak flaring, shallow depth-of-field), lighting setups (Rembrandt, volumetric haze, rim lighting, 3-point key/fill, high contrast chiaroscuro), and color grading (ACEScg, Kodak Vision3 film stock, teal-and-orange, bleach bypass).
When a creator describes a visual scene or asks for prompt advice, provide specific cinematography advice, exact camera instructions, and optimized generation prompts for image and video diffusion models. Keep answers actionable, professional, and inspiring.`,

  screenwriter: `You are the Lead Screenplay Writer and Narrative Architect at Liberty Studio AI.
Your expertise includes high-concept loglines, three-act narrative arcs, emotional hook design for 30-second shorts and feature scenes, character consistency prompts, beat sheets, visual scene descriptions, and snappy dialogue bursts.
When helping creators, outline scenes clearly, write engaging dialog, and provide visual cue descriptions optimized for text-to-video engines like Wan 2.1 and Gemini Omni Flash.`,

  video_editor: `You are the Senior Video Editor and Short-Form Retention Specialist at Liberty Studio AI.
Your expertise covers cutting rhythm, J-cuts, L-cuts, speed ramps, match cuts, visual hooks for YouTube Shorts / TikTok / Reels (0-3s retention triggers), punchy captions, subtitle positioning, B-roll timing, and audio ducking.
Provide practical timeline advice, frame counts, transition ideas, and advice on converting long-form footage into viral short clips.`,

  vfx_supervisor: `You are the VFX Supervisor and Technical Director at Liberty Studio AI.
Your expertise includes AI compositing, green screen rotoscoping, ControlNet depth/openpose guidance, IP-Adapter character conditioning, spatial consistency, Real-ESRGAN 4x upscaling, and RIFE frame interpolation.
Help creators diagnose generation artifacts, craft negative prompts, choose proper LoRAs, and structure multi-pass generation workflows.`,
};

export class GeminiChatProvider {
  public isAvailable(): boolean {
    return geminiClient.isConfigured();
  }

  /**
   * Generates a conversational response maintaining multi-turn context
   */
  public async sendMessage(params: {
    message: string;
    role?: CreativeRole;
    history?: ChatMessage[];
    model?: 'gemini-4-argon' | 'gemini-3.8-flash' | 'gemini-3.1-flash-lite';
    previousInteractionId?: string;
  }): Promise<{
    reply: string;
    model: string;
    interactionId?: string;
  }> {
    const ai = geminiClient.getClient();
    const role = params.role || 'cinematographer';
    const model = params.model || 'gemini-3.8-flash';
    const systemInstruction = ROLE_SYSTEM_INSTRUCTIONS[role] || ROLE_SYSTEM_INSTRUCTIONS.cinematographer;

    try {
      // Build conversation payload if history is provided
      let promptInput = params.message;
      if (params.history && params.history.length > 0) {
        const historyText = params.history
          .map(m => `${m.role.toUpperCase()}: ${m.content}`)
          .join('\n');
        promptInput = `Previous conversation context:\n${historyText}\n\nUSER: ${params.message}`;
      }

      const interaction = await ai.interactions.create({
        model,
        input: promptInput,
        system_instruction: systemInstruction,
        ...(params.previousInteractionId ? { previous_interaction_id: params.previousInteractionId } : {}),
      });

      let reply = interaction.output_text || '';
      if (!reply && interaction.steps) {
        for (const step of interaction.steps) {
          if (step.type === 'model_output') {
            const textContent = step.content?.find((c: any) => c.type === 'text');
            if (textContent?.text) reply += textContent.text;
          }
        }
      }

      if (!reply) {
        reply = 'I reviewed your request and formulated creative feedback, but the model stream did not return text content.';
      }

      return {
        reply: reply.trim(),
        model,
        interactionId: interaction.id,
      };
    } catch (err: any) {
      throw new Error(`Gemini Creative Chat failed (${model}): ${err.message}`);
    }
  }
}

export const geminiChatProvider = new GeminiChatProvider();
