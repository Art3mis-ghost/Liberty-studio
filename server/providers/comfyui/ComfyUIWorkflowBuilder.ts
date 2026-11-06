export class ComfyUIWorkflowBuilder {
  /**
   * Generates a standard SDXL 1.0 text-to-image workflow
   */
  public static buildSDXLWorkflow(params: {
    prompt: string;
    negativePrompt?: string;
    width: number;
    height: number;
    steps?: number;
    cfg?: number;
    seed?: number;
    checkpointName?: string;
  }): Record<string, any> {
    const {
      prompt,
      negativePrompt = 'blurry, distorted, artifacts, bad anatomy, lowres, watermark',
      width = 1024,
      height = 1024,
      steps = 25,
      cfg = 7.0,
      seed = Math.floor(Math.random() * 100000000),
      checkpointName = 'sd_xl_base_1.0.safetensors',
    } = params;

    return {
      '3': {
        class_type: 'KSampler',
        inputs: {
          seed,
          steps,
          cfg,
          sampler_name: 'euler_ancestral',
          scheduler: 'karras',
          denoise: 1.0,
          model: ['4', 0],
          positive: ['6', 0],
          negative: ['7', 0],
          latent_image: ['5', 0],
        },
      },
      '4': {
        class_type: 'CheckpointLoaderSimple',
        inputs: {
          ckpt_name: checkpointName,
        },
      },
      '5': {
        class_type: 'EmptyLatentImage',
        inputs: {
          width,
          height,
          batch_size: 1,
        },
      },
      '6': {
        class_type: 'CLIPTextEncode',
        inputs: {
          text: prompt,
          clip: ['4', 1],
        },
      },
      '7': {
        class_type: 'CLIPTextEncode',
        inputs: {
          text: negativePrompt,
          clip: ['4', 1],
        },
      },
      '8': {
        class_type: 'VAEDecode',
        inputs: {
          samples: ['3', 0],
          vae: ['4', 2],
        },
      },
      '9': {
        class_type: 'SaveImage',
        inputs: {
          filename_prefix: 'Liberty_SDXL',
          images: ['8', 0],
        },
      },
    };
  }

  /**
   * Generates a Wan 2.1 video generation workflow graph
   */
  public static buildWanVideoWorkflow(params: {
    prompt: string;
    width: number;
    height: number;
    frames?: number;
    fps?: number;
    seed?: number;
    modelVariant?: '1.3B' | '14B';
  }): Record<string, any> {
    const {
      prompt,
      width = 832,
      height = 480,
      frames = 81,
      fps = 16,
      seed = Math.floor(Math.random() * 100000000),
      modelVariant = '1.3B',
    } = params;

    const checkpointName = modelVariant === '14B' ? 'wan2.1_t2v_14B_bf16.safetensors' : 'wan2.1_t2v_1.3B_bf16.safetensors';

    return {
      '1': {
        class_type: 'WanVideoModelLoader',
        inputs: {
          model_name: checkpointName,
        },
      },
      '2': {
        class_type: 'WanTextEncode',
        inputs: {
          prompt,
          negative_prompt: 'low quality, blurry, flicker, deformed, static',
        },
      },
      '3': {
        class_type: 'WanEmptyLatent',
        inputs: {
          width,
          height,
          frames,
        },
      },
      '4': {
        class_type: 'WanSampler',
        inputs: {
          seed,
          steps: 30,
          guide_scale: 6.0,
          shift: 5.0,
          model: ['1', 0],
          conditioning: ['2', 0],
          latent: ['3', 0],
        },
      },
      '5': {
        class_type: 'WanVAEDecode',
        inputs: {
          samples: ['4', 0],
          vae: ['1', 1],
        },
      },
      '6': {
        class_type: 'SaveVideo',
        inputs: {
          fps,
          filename_prefix: 'Liberty_Wan2.1',
          images: ['5', 0],
        },
      },
    };
  }
}
