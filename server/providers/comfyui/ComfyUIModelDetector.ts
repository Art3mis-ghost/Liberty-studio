import fs from 'node:fs';
import path from 'node:path';
import { comfyUIClient } from './ComfyUIClient.js';

export interface ModelFileCheck {
  id: string;
  name: string;
  found: boolean;
  source: 'local_disk' | 'comfyui_server' | 'none';
  path?: string;
  sizeBytes?: number;
}

export class ComfyUIModelDetector {
  private localModelDirs: string[];

  constructor() {
    this.localModelDirs = [
      path.resolve(process.cwd(), 'models/checkpoints'),
      path.resolve(process.cwd(), 'models/unet'),
      path.resolve(process.cwd(), 'models/diffusion_models'),
      path.resolve(process.cwd(), 'models/loras'),
      path.resolve(process.cwd(), 'models/controlnet'),
    ];
  }

  /**
   * Scans local disk and ComfyUI server to check which models genuinely exist
   */
  public async detectModels(modelCatalog: Array<{ id: string; name: string }>): Promise<Map<string, ModelFileCheck>> {
    const results = new Map<string, ModelFileCheck>();

    // 1. Check local directories
    const localFiles = new Map<string, { path: string; size: number }>();
    for (const dir of this.localModelDirs) {
      if (fs.existsSync(dir)) {
        try {
          const files = fs.readdirSync(dir);
          for (const file of files) {
            const fullPath = path.join(dir, file);
            try {
              const stat = fs.statSync(fullPath);
              if (stat.isFile() && stat.size > 1024 * 1024) { // > 1MB
                localFiles.set(file.toLowerCase(), { path: fullPath, size: stat.size });
              }
            } catch {
              // ignore unreadable files
            }
          }
        } catch {
          // ignore unreadable dirs
        }
      }
    }

    // 2. Check ComfyUI server object info if online
    let comfyCheckpoints: string[] = [];
    try {
      const objInfo = await comfyUIClient.getObjectInfo();
      if (objInfo && objInfo.CheckpointLoaderSimple?.input?.required?.ckpt_name?.[0]) {
        comfyCheckpoints = objInfo.CheckpointLoaderSimple.input.required.ckpt_name[0];
      }
    } catch {
      // ComfyUI not available
    }

    // 3. Match against catalog
    for (const model of modelCatalog) {
      const idLower = model.id.toLowerCase();
      let found = false;
      let source: 'local_disk' | 'comfyui_server' | 'none' = 'none';
      let filePath: string | undefined;
      let sizeBytes: number | undefined;

      // Check ComfyUI checkpoints list
      const matchedComfy = comfyCheckpoints.find(c => c.toLowerCase().includes(idLower) || idLower.includes(c.toLowerCase().split('.')[0]));
      if (matchedComfy) {
        found = true;
        source = 'comfyui_server';
      }

      // Check local files
      for (const [fname, info] of localFiles.entries()) {
        if (fname.includes(idLower) || idLower.includes(fname.split('.')[0])) {
          found = true;
          source = 'local_disk';
          filePath = info.path;
          sizeBytes = info.size;
          break;
        }
      }

      results.set(model.id, {
        id: model.id,
        name: model.name,
        found,
        source,
        path: filePath,
        sizeBytes,
      });
    }

    return results;
  }
}

export const comfyUIModelDetector = new ComfyUIModelDetector();
