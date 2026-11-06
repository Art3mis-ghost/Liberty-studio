export interface EnhancedPromptResult {
  original: string;
  enhancedPrompt: string;
  negativePrompt: string;
  suggestedCamera: string;
  suggestedLighting: string;
  suggestedComposition: string;
  styleTags: string[];
}

export class PromptAssistantService {
  public enhancePrompt(userPrompt: string, styleIntent: string = 'cinematic'): EnhancedPromptResult {
    const p = userPrompt.trim();

    // Lighting suggestions based on keywords
    let lighting = 'Chiaroscuro rim lighting with soft diffused fill and subtle volumetric atmospheric haze';
    if (/sunset|morning|dawn|golden/i.test(p)) {
      lighting = 'Warm golden hour side-raking sunlight, 3200K tungsten glow with long atmospheric shadows';
    } else if (/neon|cyber|future|night/i.test(p)) {
      lighting = 'Dual-tone neon split lighting (cyan and deep magenta), rain-slicked specular reflections';
    } else if (/studio|product|fashion/i.test(p)) {
      lighting = 'Profoto 5-foot octabox soft key light, subtle silver reflector rim, neutral gray falloff';
    }

    // Camera suggestions based on subject
    let camera = 'Dolly in focal push, 35mm anamorphic prime lens, f/1.8 shallow depth of field';
    let suggestedCameraPreset = 'dolly_in';
    if (/landscape|city|mountain|space/i.test(p)) {
      camera = 'Sweeping drone aerial arc, 24mm ultra-wide cine lens, deep focus f/8';
      suggestedCameraPreset = 'drone_shot';
    } else if (/action|speed|car|run/i.test(p)) {
      camera = 'Low-angle tracking shot, 50mm high-speed lens, 1/1000s shutter capture';
      suggestedCameraPreset = 'tracking_shot';
    }

    // Composition
    const composition = 'Rule of thirds focal alignment, natural architectural leading lines, atmospheric depth layering';

    // Cinematic modifiers
    const cinematicModifiers = [
      'shot on Arri Alexa Mini LF',
      'Cooke Anamorphic /i Full Frame Plus lens',
      'subtle 35mm film stock grain',
      'cinematography by Roger Deakins',
      'masterpiece 8k',
      'hyper-detailed organic textures',
    ];

    const enhancedPrompt = `${p}, ${lighting}, ${camera}, ${composition}, ${cinematicModifiers.join(', ')}`;

    const negativePrompt =
      'blurry, low resolution, duplicate, watermark, distorted hands, extra limbs, oversaturated, plastic wax skin, cartoonish, artifacts, jitter, noise grain clipping';

    return {
      original: userPrompt,
      enhancedPrompt,
      negativePrompt,
      suggestedCamera: suggestedCameraPreset,
      suggestedLighting: lighting,
      suggestedComposition: composition,
      styleTags: ['Cinematic 35mm', 'Arri Alexa', 'Anamorphic Flare', 'Film Grain', 'Volumetric Haze'],
    };
  }
}

export const promptAssistantService = new PromptAssistantService();
