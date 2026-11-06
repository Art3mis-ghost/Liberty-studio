import crypto from 'node:crypto';
import { BackgroundJob, JobStatus } from './types.js';

type JobListener = (job: BackgroundJob) => void;

export class JobQueue {
  private jobs: Map<string, BackgroundJob> = new Map();
  private listeners: Set<JobListener> = new Set();

  public createJob(
    type: BackgroundJob['type'],
    params: Record<string, any>
  ): BackgroundJob {
    const id = `job_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const job: BackgroundJob = {
      id,
      type,
      status: 'pending',
      progress: 0,
      stage: 'Queued in local inference pipeline',
      createdAt: Date.now(),
      params,
    };
    this.jobs.set(id, job);
    this.notify(job);
    return job;
  }

  public getJob(id: string): BackgroundJob | undefined {
    return this.jobs.get(id);
  }

  public getAllJobs(): BackgroundJob[] {
    return Array.from(this.jobs.values()).sort((a, b) => b.createdAt - a.createdAt);
  }

  public updateProgress(id: string, progress: number, stage: string): void {
    const job = this.jobs.get(id);
    if (!job || job.status === 'cancelled') return;
    job.status = 'processing';
    job.progress = Math.min(100, Math.max(0, Math.round(progress)));
    job.stage = stage;
    this.notify(job);
  }

  public completeJob(id: string, result: Record<string, any>): void {
    const job = this.jobs.get(id);
    if (!job || job.status === 'cancelled') return;
    job.status = 'completed';
    job.progress = 100;
    job.stage = 'Job completed successfully';
    job.completedAt = Date.now();
    job.result = result;
    this.notify(job);
  }

  public failJob(id: string, error: string): void {
    const job = this.jobs.get(id);
    if (!job || job.status === 'cancelled') return;
    job.status = 'failed';
    job.stage = 'Failed';
    job.error = error;
    job.completedAt = Date.now();
    this.notify(job);
  }

  public cancelJob(id: string): boolean {
    const job = this.jobs.get(id);
    if (!job) return false;
    if (job.status === 'completed' || job.status === 'failed') return false;
    job.status = 'cancelled';
    job.stage = 'Cancelled by user';
    job.completedAt = Date.now();
    this.notify(job);
    return true;
  }

  public subscribe(listener: JobListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(job: BackgroundJob): void {
    for (const listener of this.listeners) {
      try {
        listener(job);
      } catch (err) {
        console.error('Error notifying job listener:', err);
      }
    }
  }
}

export const jobQueue = new JobQueue();
