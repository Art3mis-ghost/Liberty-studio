export interface ComfyUIStatus {
  online: boolean;
  url: string;
  vramFree?: number;
  vramTotal?: number;
  devices?: any[];
  error?: string;
}

export class ComfyUIClient {
  private baseUrl: string;

  constructor(baseUrl: string = process.env.COMFYUI_URL || 'http://127.0.0.1:8188') {
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  public getBaseUrl(): string {
    return this.baseUrl;
  }

  public setBaseUrl(url: string): void {
    this.baseUrl = url.replace(/\/$/, '');
  }

  /**
   * Pings ComfyUI /system_stats to verify if the server is active
   */
  public async checkHealth(): Promise<ComfyUIStatus> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2500);

      const res = await fetch(`${this.baseUrl}/system_stats`, {
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!res.ok) {
        return {
          online: false,
          url: this.baseUrl,
          error: `HTTP ${res.status}: ${res.statusText}`,
        };
      }

      const data: any = await res.json();
      const device = data?.devices?.[0];

      return {
        online: true,
        url: this.baseUrl,
        vramFree: device?.vram_free,
        vramTotal: device?.vram_total,
        devices: data?.devices || [],
      };
    } catch (err: any) {
      return {
        online: false,
        url: this.baseUrl,
        error: err.name === 'AbortError' ? 'Connection timed out' : 'ComfyUI process not reachable on ' + this.baseUrl,
      };
    }
  }

  /**
   * Fetches installed nodes and loaded checkpoint model files from ComfyUI
   */
  public async getObjectInfo(): Promise<Record<string, any> | null> {
    try {
      const res = await fetch(`${this.baseUrl}/object_info`, {
        signal: AbortSignal.timeout(3000),
      });
      if (res.ok) {
        return await res.json();
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Submits a workflow prompt graph to ComfyUI
   */
  public async queuePrompt(workflow: Record<string, any>, clientId: string = 'liberty-studio'): Promise<string> {
    const res = await fetch(`${this.baseUrl}/prompt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: workflow, client_id: clientId }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`ComfyUI queue failed (HTTP ${res.status}): ${text}`);
    }

    const data: any = await res.json();
    return data.prompt_id;
  }

  /**
   * Polls the history of a queued job until completion or timeout
   */
  public async waitForJob(promptId: string, maxWaitMs: number = 300000): Promise<any> {
    const startTime = Date.now();
    while (Date.now() - startTime < maxWaitMs) {
      const res = await fetch(`${this.baseUrl}/history/${promptId}`);
      if (res.ok) {
        const history: any = await res.json();
        if (history[promptId]) {
          const job = history[promptId];
          if (job.status?.status_str === 'error') {
            const errDetails = JSON.stringify(job.status.messages || 'Unknown ComfyUI node failure');
            throw new Error(`ComfyUI workflow execution error: ${errDetails}`);
          }
          if (job.outputs && Object.keys(job.outputs).length > 0) {
            return job.outputs;
          }
        }
      }
      await new Promise(r => setTimeout(r, 1500));
    }
    throw new Error(`ComfyUI job ${promptId} exceeded maximum wait time (${maxWaitMs / 1000}s)`);
  }

  /**
   * Downloads output file bytes from ComfyUI /view
   */
  public async fetchOutputBytes(filename: string, subfolder: string = '', type: string = 'output'): Promise<Buffer> {
    const url = `${this.baseUrl}/view?filename=${encodeURIComponent(filename)}&subfolder=${encodeURIComponent(subfolder)}&type=${encodeURIComponent(type)}`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Failed to fetch ComfyUI output file: HTTP ${res.status}`);
    }
    const arrayBuffer = await res.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }
}

export const comfyUIClient = new ComfyUIClient();
