import fs from 'node:fs';
import path from 'node:path';
import { CharacterProfile } from './types.js';

export class CharacterService {
  private charactersFile: string;
  private characters: Map<string, CharacterProfile> = new Map();

  constructor() {
    const dir = path.resolve(process.cwd(), 'public/storage/projects');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    this.charactersFile = path.join(dir, 'characters.json');
    this.loadCharacters();
  }

  private loadCharacters() {
    if (fs.existsSync(this.charactersFile)) {
      try {
        const raw = fs.readFileSync(this.charactersFile, 'utf-8');
        const list: CharacterProfile[] = JSON.parse(raw);
        for (const c of list) {
          this.characters.set(c.id, c);
        }
      } catch {
        this.createDefaults();
      }
    } else {
      this.createDefaults();
    }
  }

  private saveCharacters() {
    try {
      const list = Array.from(this.characters.values());
      fs.writeFileSync(this.charactersFile, JSON.stringify(list, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error saving characters:', err);
    }
  }

  private createDefaults() {
    const defaults: CharacterProfile[] = [
      {
        id: 'char_elena_vance',
        name: 'Elena Vance',
        triggerWord: 'ohwx_elena',
        description: '30-year-old aerospace engineer with piercing amber eyes, short cropped brunette hair, and subtle tech jawline implant.',
        referenceImages: ['/storage/generations/char_elena_ref.jpg'],
        loraModel: 'ip-adapter-face-plus',
        consistencyWeight: 0.85,
        styleTags: ['sharp jawline', 'amber eyes', 'cybernetic implant', 'matte skin texture'],
        createdAt: Date.now() - 5000000,
      },
      {
        id: 'char_marcus_kane',
        name: 'Commander Marcus Kane',
        triggerWord: 'sks_marcus',
        description: 'Seasoned starship captain in his late 40s with silver-streaked dark hair, weathered stubble, and tactical high-collar jacket.',
        referenceImages: ['/storage/generations/char_marcus_ref.jpg'],
        loraModel: 'ip-adapter-face-plus',
        consistencyWeight: 0.88,
        styleTags: ['weathered skin', 'silver temples', 'tactical uniform', 'cinematic key light'],
        createdAt: Date.now() - 3000000,
      },
    ];

    for (const c of defaults) {
      this.characters.set(c.id, c);
    }
    this.saveCharacters();
  }

  public getAllCharacters(): CharacterProfile[] {
    return Array.from(this.characters.values());
  }

  public createCharacter(data: Omit<CharacterProfile, 'id' | 'createdAt'>): CharacterProfile {
    const id = `char_${Date.now()}`;
    const profile: CharacterProfile = {
      ...data,
      id,
      createdAt: Date.now(),
    };
    this.characters.set(id, profile);
    this.saveCharacters();
    return profile;
  }

  public deleteCharacter(id: string): boolean {
    const existed = this.characters.delete(id);
    if (existed) this.saveCharacters();
    return existed;
  }
}

export const characterService = new CharacterService();
