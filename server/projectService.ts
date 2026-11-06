import fs from 'node:fs';
import path from 'node:path';
import { Project, ProjectAsset } from './types.js';

export class ProjectService {
  private projectsFile: string;
  private projects: Map<string, Project> = new Map();

  constructor() {
    const dir = path.resolve(process.cwd(), 'public/storage/projects');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    this.projectsFile = path.join(dir, 'projects.json');
    this.loadProjects();
  }

  private loadProjects() {
    if (fs.existsSync(this.projectsFile)) {
      try {
        const raw = fs.readFileSync(this.projectsFile, 'utf-8');
        const list: Project[] = JSON.parse(raw);
        for (const p of list) {
          this.projects.set(p.id, p);
        }
      } catch (err) {
        console.error('Failed to load projects.json, creating initial default project');
        this.createDefaultProject();
      }
    } else {
      this.createDefaultProject();
    }
  }

  private saveProjects() {
    try {
      const list = Array.from(this.projects.values());
      fs.writeFileSync(this.projectsFile, JSON.stringify(list, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error saving projects:', err);
    }
  }

  private createDefaultProject() {
    const defaultProject: Project = {
      id: 'proj_default_01',
      name: 'Cyberpunk Odyssey Campaign',
      description: 'Cinematic short film trailer and vertical social media cutdowns.',
      createdAt: Date.now() - 86400000,
      updatedAt: Date.now(),
      assets: [
        {
          id: 'asset_init_1',
          type: 'image',
          title: 'Neon Skyscraper Keyframe',
          url: '/storage/generations/sample_hero.jpg',
          createdAt: Date.now() - 3600000,
          metadata: { prompt: 'Hyperrealistic rainy futuristic Tokyo neon skyline, anamorphic 35mm', seed: 48291 },
        },
      ],
      savedPrompts: [
        {
          id: 'prompt_1',
          title: 'Cinematic Dolly In Keyframe',
          prompt: 'Cinematic close-up portrait of a rogue astronaut looking into a nebula, glowing visor reflections, rim lighting, 35mm film grain, 8k resolution',
          type: 'video',
        },
        {
          id: 'prompt_2',
          title: 'Viral Hook Opener',
          prompt: 'What happens when open-source AI outperforms billion dollar closed APIs in video generation?',
          type: 'clip',
        },
      ],
    };
    this.projects.set(defaultProject.id, defaultProject);
    this.saveProjects();
  }

  public getAllProjects(): Project[] {
    return Array.from(this.projects.values()).sort((a, b) => b.updatedAt - a.updatedAt);
  }

  public getProject(id: string): Project | undefined {
    return this.projects.get(id);
  }

  public createProject(name: string, description: string): Project {
    const id = `proj_${Date.now()}`;
    const project: Project = {
      id,
      name,
      description,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      assets: [],
      savedPrompts: [],
    };
    this.projects.set(id, project);
    this.saveProjects();
    return project;
  }

  public updateProject(id: string, updates: Partial<Project>): Project | undefined {
    const project = this.projects.get(id);
    if (!project) return undefined;
    Object.assign(project, updates, { updatedAt: Date.now() });
    this.saveProjects();
    return project;
  }

  public deleteProject(id: string): boolean {
    const existed = this.projects.delete(id);
    if (existed) this.saveProjects();
    return existed;
  }

  public addAsset(projectId: string, asset: Omit<ProjectAsset, 'id' | 'createdAt'>): ProjectAsset | undefined {
    const project = this.projects.get(projectId);
    if (!project) return undefined;
    const newAsset: ProjectAsset = {
      ...asset,
      id: `asset_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      createdAt: Date.now(),
    };
    project.assets.unshift(newAsset);
    project.updatedAt = Date.now();
    this.saveProjects();
    return newAsset;
  }
}

export const projectService = new ProjectService();
