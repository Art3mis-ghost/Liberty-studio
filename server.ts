import express, { Request, Response } from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { createServer as createViteServer } from 'vite';
import { hardwareService } from './server/hardwareService.js';
import { modelService } from './server/modelService.js';
import { jobQueue } from './server/jobQueue.js';
import { videoService } from './server/videoService.js';
import { clippingService } from './server/clippingService.js';
import { imageService } from './server/imageService.js';
import { editorService } from './server/editorService.js';
import { audioService } from './server/audioService.js';
import { upscaleService } from './server/upscaleService.js';
import { projectService } from './server/projectService.js';
import { characterService } from './server/characterService.js';
import { promptAssistantService } from './server/promptAssistantService.js';
import { geminiService } from './server/geminiService.js';
import { youtubeService } from './server/youtubeService.js';
import { comfyUIClient } from './server/providers/comfyui/ComfyUIClient.js';

import multer from 'multer';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Ensure public directories exist
const publicDirs = [
  'public/storage/uploads',
  'public/storage/generations',
  'public/storage/exports',
  'public/storage/projects',
];
for (const dir of publicDirs) {
  const fullPath = path.resolve(process.cwd(), dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
}

// Multer Storage Configuration for File Uploads
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, path.resolve(process.cwd(), 'public/storage/uploads'));
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '';
    const name = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}${ext}`;
    cb(null, name);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 150 * 1024 * 1024 }, // 150MB limit
});

// Serve static storage files with full CORS support
app.use('/storage', (_req: Request, res: Response, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static(path.resolve(process.cwd(), 'public/storage')));

// File Upload Endpoint
app.post('/api/upload', upload.single('file'), (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: 'No file uploaded' });
  }
  const relativeUrl = `/storage/uploads/${req.file.filename}`;
  res.json({
    success: true,
    url: relativeUrl,
    filename: req.file.filename,
    originalName: req.file.originalname,
    size: req.file.size,
    mimetype: req.file.mimetype,
  });
});
app.get('/api/hardware', async (_req: Request, res: Response) => {
  try {
    const hw = await hardwareService.getHardwareInfo();
    res.json({ success: true, hardware: hw });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Models Catalog & Compatibility
app.get('/api/models', (_req: Request, res: Response) => {
  const models = modelService.getAllModels();
  const active = modelService.getActiveModels();
  res.json({ success: true, models, activeModels: active });
});

app.post('/api/models/active', (req: Request, res: Response) => {
  const { category, modelId } = req.body;
  if (!category || !modelId) {
    return res.status(400).json({ success: false, error: 'category and modelId required' });
  }
  const ok = modelService.setActiveModel(category, modelId);
  res.json({ success: ok, activeModels: modelService.getActiveModels() });
});

app.get('/api/models/:id/compatibility', async (req: Request, res: Response) => {
  const result = await modelService.evaluateModelCompatibility(req.params.id);
  res.json({ success: true, ...result });
});

// Job Queue
app.get('/api/jobs', (_req: Request, res: Response) => {
  res.json({ success: true, jobs: jobQueue.getAllJobs() });
});

app.get('/api/jobs/:id', (req: Request, res: Response) => {
  const job = jobQueue.getJob(req.params.id);
  if (!job) return res.status(404).json({ success: false, error: 'Job not found' });
  res.json({ success: true, job });
});

app.post('/api/jobs/:id/cancel', (req: Request, res: Response) => {
  const ok = jobQueue.cancelJob(req.params.id);
  res.json({ success: ok });
});

app.get('/api/gemini/status', (_req: Request, res: Response) => {
  const status = geminiService.getStatus();
  res.json({
    success: true,
    ...status,
  });
});

app.get('/api/comfyui/status', async (_req: Request, res: Response) => {
  const health = await comfyUIClient.checkHealth();
  res.json({
    success: true,
    ...health,
  });
});

// AI Video Studio Generation (Higgsfield Style with 14 Camera Presets & Dual Engines)
app.post('/api/generate/video', async (req: Request, res: Response) => {
  try {
    const job = jobQueue.createJob('video', req.body);
    res.json({ success: true, jobId: job.id, job });

    const isGemini = req.body.engine === 'gemini';
    const executionPromise = isGemini
      ? geminiService.generateVideo(job.id, req.body)
      : videoService.generateCinematicVideo(job.id, req.body);

    executionPromise
      .then((videoUrl) => {
        jobQueue.completeJob(job.id, { videoUrl });
        // Automatically register to project library
        projectService.addAsset('proj_default_01', {
          type: 'video',
          title: `${isGemini ? '✨ Gemini ' : ''}Cinematic Video [${req.body.cameraPreset || 'dolly'}]`,
          url: videoUrl,
          duration: req.body.durationSeconds || 4,
          metadata: { prompt: req.body.prompt, seed: req.body.seed, engine: req.body.engine || 'local' },
        });
      })
      .catch((err) => {
        jobQueue.failJob(job.id, err.message);
      });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// AI Video Edit (Trim, Speed, Color Grading, Aspect Crop, Caption Overlay)
app.post('/api/video/edit', async (req: Request, res: Response) => {
  try {
    const job = jobQueue.createJob('video', { ...req.body, editMode: true });
    res.json({ success: true, jobId: job.id, job });

    videoService
      .editVideo(job.id, req.body)
      .then((videoUrl) => {
        jobQueue.completeJob(job.id, { videoUrl });
        projectService.addAsset('proj_default_01', {
          type: 'video',
          title: `Edited Video [${req.body.filter || 'custom'}]`,
          url: videoUrl,
          metadata: {
            source: req.body.sourceVideoUrl,
            filter: req.body.filter,
            speed: req.body.speed,
            trim: [req.body.trimStart, req.body.trimEnd],
          },
        });
      })
      .catch((err) => {
        jobQueue.failJob(job.id, err.message);
      });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// AI Image Studio Generation (Dual Engines: Local Open Engine / Google Gemini AI)
app.post('/api/generate/image', async (req: Request, res: Response) => {
  try {
    const job = jobQueue.createJob('image', req.body);
    res.json({ success: true, jobId: job.id, job });

    const isGemini = req.body.engine === 'gemini';
    const model = req.body.model || 'gemini-nano-banana-2.1';
    const executionPromise = isGemini
      ? geminiService.generateImage(job.id, req.body.prompt, req.body.aspectRatio, model)
      : imageService.generateImage(job.id, req.body);

    executionPromise
      .then((imageUrl) => {
        jobQueue.completeJob(job.id, { imageUrl });
        projectService.addAsset('proj_default_01', {
          type: 'image',
          title: `${isGemini ? '✨ Gemini ' : ''}Image: "${(req.body.prompt || '').slice(0, 30)}..."`,
          url: imageUrl,
          metadata: { prompt: req.body.prompt, seed: req.body.seed, preset: req.body.preset, engine: req.body.engine || 'local' },
        });
      })
      .catch((err) => {
        jobQueue.failJob(job.id, err.message);
      });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// AI Image Studio Editing (Instruction-based Editing via gemini-nano-banana-2.1)
app.post('/api/image/edit', async (req: Request, res: Response) => {
  try {
    const { sourceImageUrl, instruction } = req.body;
    if (!sourceImageUrl || !instruction) {
      return res.status(400).json({ success: false, error: 'sourceImageUrl and instruction are required' });
    }
    const job = jobQueue.createJob('image', { ...req.body, editMode: true });
    res.json({ success: true, jobId: job.id, job });

    geminiService
      .editImage(job.id, sourceImageUrl, instruction)
      .then((imageUrl) => {
        jobQueue.completeJob(job.id, { imageUrl });
        projectService.addAsset('proj_default_01', {
          type: 'image',
          title: `Edited Image: "${instruction.slice(0, 30)}..."`,
          url: imageUrl,
          metadata: { instruction, sourceImageUrl, engine: 'gemini' },
        });
      })
      .catch((err) => {
        jobQueue.failJob(job.id, err.message);
      });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Video Clipping Studio (Kixy Style: Analyze & Extract Highlights)
app.post('/api/clipping/analyze', async (req: Request, res: Response) => {
  try {
    const { videoPath = '/storage/generations/sample.mp4' } = req.body;
    const job = jobQueue.createJob('clip', req.body);
    res.json({ success: true, jobId: job.id, job });

    clippingService
      .analyzeAndExtractHighlights(job.id, videoPath)
      .then((segments) => {
        jobQueue.completeJob(job.id, { segments });
      })
      .catch((err) => {
        jobQueue.failJob(job.id, err.message);
      });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Render Clip with Vertical Reframing & Animated Captions
app.post('/api/clipping/render', async (req: Request, res: Response) => {
  try {
    const { sourceVideoPath, segment } = req.body;
    const job = jobQueue.createJob('clip', req.body);
    res.json({ success: true, jobId: job.id, job });

    clippingService
      .renderClip(job.id, sourceVideoPath || '', segment)
      .then((clipUrl) => {
        jobQueue.completeJob(job.id, { clipUrl });
        projectService.addAsset('proj_default_01', {
          type: 'clip',
          title: `Short: ${segment?.headline || 'Clip'}`,
          url: clipUrl,
          duration: segment?.duration || 15,
          metadata: { hookScore: segment?.hookScore, aspectRatio: segment?.aspectRatio },
        });
      })
      .catch((err) => {
        jobQueue.failJob(job.id, err.message);
      });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// YouTube & Direct Video URL Importer
app.post('/api/video/import-url', async (req: Request, res: Response) => {
  try {
    const { url, title } = req.body;
    if (!url) {
      return res.status(400).json({ success: false, error: 'URL is required' });
    }
    const info = await youtubeService.importVideo(url, title);
    projectService.addAsset('proj_default_01', {
      type: 'video',
      title: info.title,
      url: info.localVideoUrl,
      duration: info.duration,
      metadata: { originalUrl: info.originalUrl, sourceType: info.sourceType },
    });
    res.json({ success: true, video: info });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Create Multiple Shorts from Long Video (Batch Kixy-style Pipeline)
app.post('/api/video/create-multiple-shorts', async (req: Request, res: Response) => {
  try {
    const { videoPath, title = 'Imported Video', count = 3 } = req.body;
    const job = jobQueue.createJob('clip', req.body);
    res.json({ success: true, jobId: job.id, job });

    (async () => {
      jobQueue.updateProgress(job.id, 15, 'Analyzing timeline highlights with AI hook scoring');
      
      let segments = await clippingService.analyzeAndExtractHighlights(job.id, videoPath);
      if (geminiService.isConfigured()) {
        try {
          const geminiHooks = await geminiService.analyzeShorts(title, 90);
          if (geminiHooks.length > 0) {
            segments = geminiHooks.map((h, i) => ({
              id: `short_${Date.now()}_${i + 1}`,
              startTime: h.startTime,
              endTime: h.endTime,
              duration: h.endTime - h.startTime,
              headline: h.headline,
              hookScore: h.viralScore,
              viralScore: h.viralScore,
              reason: h.reason,
              transcript: h.hook,
              aspectRatio: '9:16',
              captionStyle: 'hormozi',
              speaker: 'Host',
            }));
          }
        } catch {
          console.warn('Gemini shorts analysis notice, continuing with highlight detector');
        }
      }

      const generatedShorts: Array<{ id: string; headline: string; url: string; hookScore: number; duration: number }> = [];
      const numToRender = Math.min(count, segments.length);

      for (let i = 0; i < numToRender; i++) {
        const seg = segments[i];
        jobQueue.updateProgress(
          job.id,
          Math.round(25 + (i / numToRender) * 70),
          `Rendering Short #${i + 1} (${seg.headline}) to 9:16 with burned captions`
        );
        const clipUrl = await clippingService.renderClip(job.id, videoPath, seg);
        generatedShorts.push({
          id: seg.id,
          headline: seg.headline,
          url: clipUrl,
          hookScore: seg.hookScore,
          duration: seg.duration,
        });

        projectService.addAsset('proj_default_01', {
          type: 'clip',
          title: `Short: ${seg.headline}`,
          url: clipUrl,
          duration: seg.duration,
          metadata: { hookScore: seg.hookScore, aspectRatio: '9:16' },
        });
      }

      jobQueue.completeJob(job.id, { shorts: generatedShorts });
    })().catch((err) => {
      jobQueue.failJob(job.id, err.message);
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Gemini Hyper-Realistic Prompt Enhancement
app.post('/api/gemini/enhance-prompt', async (req: Request, res: Response) => {
  try {
    const { prompt, style = 'cinematic' } = req.body;
    const result = await geminiService.enhancePrompt(prompt || '', style);
    res.json({ success: true, result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// AI Video Editor Multi-Track Render
app.post('/api/editor/render', async (req: Request, res: Response) => {
  try {
    const job = jobQueue.createJob('editor_render', req.body);
    res.json({ success: true, jobId: job.id, job });

    editorService
      .renderTimeline(job.id, req.body)
      .then((exportUrl) => {
        jobQueue.completeJob(job.id, { exportUrl });
        projectService.addAsset('proj_default_01', {
          type: 'video',
          title: `Master Edit Render [${req.body.resolution || '1080p'}]`,
          url: exportUrl,
        });
      })
      .catch((err) => {
        jobQueue.failJob(job.id, err.message);
      });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// AI Audio Studio: Text-to-Speech (Piper)
app.post('/api/audio/tts', async (req: Request, res: Response) => {
  try {
    const job = jobQueue.createJob('audio', req.body);
    res.json({ success: true, jobId: job.id, job });

    audioService
      .generateSpeech(job.id, req.body)
      .then((audioUrl) => {
        jobQueue.completeJob(job.id, { audioUrl });
        projectService.addAsset('proj_default_01', {
          type: 'audio',
          title: `Voiceover: "${(req.body.text || '').slice(0, 25)}..."`,
          url: audioUrl,
        });
      })
      .catch((err) => {
        jobQueue.failJob(job.id, err.message);
      });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// AI Audio Studio: Extract Audio
app.post('/api/audio/extract', async (req: Request, res: Response) => {
  try {
    const { videoUrl } = req.body;
    const job = jobQueue.createJob('audio', req.body);
    res.json({ success: true, jobId: job.id, job });

    audioService
      .extractAudioFromVideo(job.id, videoUrl)
      .then((audioUrl) => {
        jobQueue.completeJob(job.id, { audioUrl });
        projectService.addAsset('proj_default_01', {
          type: 'audio',
          title: `Extracted Audio Track`,
          url: audioUrl,
        });
      })
      .catch((err) => {
        jobQueue.failJob(job.id, err.message);
      });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// AI Audio Studio: Speech Transcription (Mic & Media via gemini-3.5-transcribe / Whisper)
app.post('/api/audio/transcribe', async (req: Request, res: Response) => {
  try {
    const { mediaUrl, audioBase64, mimeType } = req.body;
    const job = jobQueue.createJob('audio', req.body);
    res.json({ success: true, jobId: job.id, job });

    const inputData = audioBase64 || mediaUrl || '';
    if (!inputData) {
      jobQueue.failJob(job.id, 'No audio data or media URL provided for transcription.');
      return;
    }

    const transcribePromise = geminiService.isConfigured()
      ? geminiService.transcribeAudio(inputData, mimeType || 'audio/wav')
      : audioService.transcribeAudio(job.id, mediaUrl || '');

    transcribePromise
      .then((transcription) => {
        jobQueue.completeJob(job.id, { transcription });
      })
      .catch((err) => {
        jobQueue.failJob(job.id, err.message);
      });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// AI Audio Studio: Music Generation (Lyria Clip & Pro Models)
app.post('/api/audio/generate-music', async (req: Request, res: Response) => {
  try {
    const { prompt, mode = 'clip', imageBase64 } = req.body;
    if (!prompt) {
      return res.status(400).json({ success: false, error: 'Prompt is required for music generation' });
    }
    const job = jobQueue.createJob('audio', req.body);
    res.json({ success: true, jobId: job.id, job });

    geminiService
      .generateMusic(prompt, mode, imageBase64)
      .then((result) => {
        jobQueue.completeJob(job.id, { ...result, audioUrl: result.url });
        projectService.addAsset('proj_default_01', {
          type: 'audio',
          title: `Music: "${prompt.slice(0, 30)}..."`,
          url: result.url,
          metadata: { prompt, mode, model: result.model },
        });
      })
      .catch((err) => {
        jobQueue.failJob(job.id, err.message);
      });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Multi-turn Gemini Creative Chatbot (Cinematographer, Screenplay Writer, Video Editor, VFX Supervisor)
app.post('/api/chat/message', async (req: Request, res: Response) => {
  try {
    const { message, role, history, model, previousInteractionId } = req.body;
    if (!message) {
      return res.status(400).json({ success: false, error: 'Message is required' });
    }
    const response = await geminiService.sendChatMessage({
      message,
      role,
      history,
      model,
      previousInteractionId,
    });
    res.json({ success: true, ...response });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// AI Audio Studio: Noise Reduction
app.post('/api/audio/denoise', async (req: Request, res: Response) => {
  try {
    const { audioUrl } = req.body;
    const job = jobQueue.createJob('audio', req.body);
    res.json({ success: true, jobId: job.id, job });

    audioService
      .denoiseAudio(job.id, audioUrl || '')
      .then((denoisedUrl) => {
        jobQueue.completeJob(job.id, { denoisedUrl });
      })
      .catch((err) => {
        jobQueue.failJob(job.id, err.message);
      });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// AI Upscaler & Enhancement
app.post('/api/upscale', async (req: Request, res: Response) => {
  try {
    const job = jobQueue.createJob('upscale', req.body);
    res.json({ success: true, jobId: job.id, job });

    upscaleService
      .processUpscale(job.id, req.body)
      .then((outputUrl) => {
        jobQueue.completeJob(job.id, { outputUrl });
        projectService.addAsset('proj_default_01', {
          type: req.body.type === 'video' ? 'video' : 'image',
          title: `Upscaled ${req.body.scale}x Enhanced Asset`,
          url: outputUrl,
        });
      })
      .catch((err) => {
        jobQueue.failJob(job.id, err.message);
      });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Character Consistency Profiles
app.get('/api/characters', (_req: Request, res: Response) => {
  res.json({ success: true, characters: characterService.getAllCharacters() });
});

app.post('/api/characters', (req: Request, res: Response) => {
  const char = characterService.createCharacter(req.body);
  res.json({ success: true, character: char });
});

app.delete('/api/characters/:id', (req: Request, res: Response) => {
  const ok = characterService.deleteCharacter(req.params.id);
  res.json({ success: ok });
});

// Projects Library
app.get('/api/projects', (_req: Request, res: Response) => {
  res.json({ success: true, projects: projectService.getAllProjects() });
});

app.post('/api/projects', (req: Request, res: Response) => {
  const { name, description } = req.body;
  const project = projectService.createProject(name || 'Untitled Project', description || '');
  res.json({ success: true, project });
});

app.patch('/api/projects/:id', (req: Request, res: Response) => {
  const updated = projectService.updateProject(req.params.id, req.body);
  if (!updated) return res.status(404).json({ success: false, error: 'Project not found' });
  res.json({ success: true, project: updated });
});

app.delete('/api/projects/:id', (req: Request, res: Response) => {
  const ok = projectService.deleteProject(req.params.id);
  res.json({ success: ok });
});

app.post('/api/projects/:id/assets', (req: Request, res: Response) => {
  const asset = projectService.addAsset(req.params.id, req.body);
  if (!asset) return res.status(404).json({ success: false, error: 'Project not found' });
  res.json({ success: true, asset });
});

// Prompt Assistant (Offline Structured Prompt Enhancement)
app.post('/api/prompt-assistant/enhance', (req: Request, res: Response) => {
  const { prompt, style } = req.body;
  if (!prompt) return res.status(400).json({ success: false, error: 'Prompt is required' });
  const result = promptAssistantService.enhancePrompt(prompt, style);
  res.json({ success: true, result });
});

// -------------------------------------------------------------
// Vite Middlewares Mounting
// -------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(process.cwd(), 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(process.cwd(), 'dist/index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n======================================================`);
    console.log(`  LIBERTY STUDIO AI - Production Server Ready`);
    console.log(`  Local Address: http://localhost:${PORT}`);
    console.log(`======================================================\n`);
  });
}

startServer().catch((err) => {
  console.error('Fatal error starting server:', err);
  process.exit(1);
});
