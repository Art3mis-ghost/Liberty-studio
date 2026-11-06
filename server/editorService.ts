import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { TimelineTrack } from './types.js';
import { jobQueue } from './jobQueue.js';

export interface EditorRenderOptions {
  tracks: TimelineTrack[];
  resolution: '1080p' | '720p' | '4k';
  aspectRatio: '16:9' | '9:16' | '1:1';
  fps: number;
}

export class EditorService {
  private outputDir: string;

  constructor() {
    this.outputDir = path.resolve(process.cwd(), 'public/storage/exports');
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  public async renderTimeline(jobId: string, options: EditorRenderOptions): Promise<string> {
    const { tracks, resolution = '1080p', aspectRatio = '16:9', fps = 30 } = options;

    jobQueue.updateProgress(jobId, 10, 'Parsing multi-track timeline events and media assets');

    let w = 1920;
    let h = 1080;
    if (resolution === '720p') {
      w = 1280;
      h = 720;
    }
    if (aspectRatio === '9:16') {
      const temp = w;
      w = h;
      h = temp;
    } else if (aspectRatio === '1:1') {
      w = Math.min(w, h);
      h = w;
    }

    const videoTrack = tracks.find((t) => t.type === 'video');
    const audioTrack = tracks.find((t) => t.type === 'audio');
    const subtitleTrack = tracks.find((t) => t.type === 'subtitle');

    const videoClips = videoTrack?.clips || [];
    const audioClips = audioTrack?.clips || [];
    const subtitleClips = subtitleTrack?.clips || [];

    if (videoClips.length === 0) {
      throw new Error('Timeline rendering requires at least one video clip on the video track.');
    }

    // Verify input clips exist
    const validClips: Array<{ clip: any; fullPath: string }> = [];
    for (const c of videoClips) {
      if (c.sourceUrl) {
        const localPath = path.resolve(process.cwd(), 'public', c.sourceUrl.replace(/^\//, ''));
        if (fs.existsSync(localPath)) {
          validClips.push({ clip: c, fullPath: localPath });
        }
      }
    }

    if (validClips.length === 0) {
      throw new Error(`None of the ${videoClips.length} video clips on the timeline exist on disk. Please import or generate video assets first.`);
    }

    const totalDuration = validClips.reduce((max, item) => Math.max(max, item.clip.start + item.clip.duration), 5);

    jobQueue.updateProgress(jobId, 30, `Compositing ${validClips.length} verified video cuts & ${subtitleClips.length} subtitles`);

    const filename = `rendered_project_${Date.now()}.mp4`;
    const outputPath = path.join(this.outputDir, filename);

    // Build FFmpeg multi-input command
    const args: string[] = ['-y'];

    // Inputs for each video clip
    for (const item of validClips) {
      args.push('-i', item.fullPath);
    }

    // Audio input if available
    let hasAudioInput = false;
    if (audioClips.length > 0 && audioClips[0].sourceUrl) {
      const audioPath = path.resolve(process.cwd(), 'public', audioClips[0].sourceUrl.replace(/^\//, ''));
      if (fs.existsSync(audioPath)) {
        args.push('-i', audioPath);
        hasAudioInput = true;
      }
    }

    // Construct filtergraph
    const filterParts: string[] = [];
    // Black background canvas
    filterParts.push(`color=c=#0b0e14:s=${w}x${h}:d=${totalDuration}[canvas]`);

    let currentBase = '[canvas]';
    validClips.forEach((item, idx) => {
      const inTag = `[${idx}:v]`;
      const scaledTag = `[v_scaled_${idx}]`;
      const outTag = `[bg_${idx}]`;

      // Scale and trim each video clip
      filterParts.push(
        `${inTag}scale=${w}:${h}:force_original_aspect_ratio=decrease,pad=${w}:${h}:(ow-iw)/2:(oh-ih)/2,trim=start=${item.clip.sourceStart || 0}:duration=${item.clip.duration},setpts=PTS-STARTPTS+${item.clip.start}/TB${scaledTag}`
      );
      // Overlay onto base
      filterParts.push(
        `${currentBase}${scaledTag}overlay=enable='between(t,${item.clip.start},${item.clip.start + item.clip.duration})'${outTag}`
      );
      currentBase = outTag;
    });

    // Subtitle burns
    const subtitleFilters = subtitleClips.map((sub) => {
      const safeText = (sub.text || sub.label || '').replace(/['":\\]/g, '');
      return `drawtext=text='${safeText}':fontcolor=white:fontsize=36:x=(w-text_w)/2:y=h-130:borderw=2:bordercolor=black:enable='between(t,${sub.start},${sub.start + sub.duration})'`;
    });

    let finalVideoTag = currentBase;
    if (subtitleFilters.length > 0) {
      filterParts.push(`${currentBase}${subtitleFilters.join(',')}[v_final]`);
      finalVideoTag = '[v_final]';
    }

    args.push('-filter_complex', filterParts.join(';'));
    args.push('-map', finalVideoTag);

    if (hasAudioInput) {
      const audioInputIndex = validClips.length;
      args.push('-map', `${audioInputIndex}:a`);
    }

    args.push(
      '-c:v', 'libx264',
      '-preset', 'fast',
      '-pix_fmt', 'yuv420p',
      '-t', `${totalDuration}`,
      outputPath
    );

    jobQueue.updateProgress(jobId, 60, `Encoding master timeline with FFmpeg H.264 @ ${fps}fps`);

    await new Promise<void>((resolve, reject) => {
      const proc = spawn('ffmpeg', args);
      let stderr = '';
      proc.stderr.on('data', (d) => { stderr += d.toString(); });
      proc.on('close', (code) => {
        if (code === 0 && fs.existsSync(outputPath)) resolve();
        else reject(new Error(`Timeline rendering failed (exit ${code}): ${stderr.slice(-300)}`));
      });
      proc.on('error', reject);
    });

    jobQueue.updateProgress(jobId, 100, 'Project render complete');
    return `/storage/exports/${filename}`;
  }
}

export const editorService = new EditorService();
