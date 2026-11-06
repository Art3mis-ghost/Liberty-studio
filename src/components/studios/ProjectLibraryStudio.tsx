import React, { useState, useEffect } from 'react';
import { Project, ProjectAsset } from '../../types/index.ts';
import { api } from '../../services/api.ts';
import {
  FolderArchive,
  Plus,
  Trash2,
  Download,
  Copy,
  Check,
  Film,
  Image as ImageIcon,
  FileAudio,
  Play,
  Layers,
} from 'lucide-react';

interface ProjectLibraryStudioProps {
  onSelectMedia?: (url: string, type: string) => void;
  onUsePrompt?: (prompt: string) => void;
}

export const ProjectLibraryStudio: React.FC<ProjectLibraryStudioProps> = ({
  onSelectMedia,
  onUsePrompt,
}) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const list = await api.getProjects();
      setProjects(list);
      if (list.length > 0 && !selectedProjectId) {
        setSelectedProjectId(list[0].id);
      }
    } catch (err) {
      console.error('Failed to load projects:', err);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    try {
      const created = await api.createProject(newProjectName, newProjectDesc);
      setProjects((prev) => [created, ...prev]);
      setSelectedProjectId(created.id);
      setIsCreatingProject(false);
      setNewProjectName('');
      setNewProjectDesc('');
    } catch (err) {
      console.error('Failed to create project:', err);
    }
  };

  const handleCopyPrompt = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const activeProject = projects.find((p) => p.id === selectedProjectId) || projects[0];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-neutral-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Project Library & Asset Vault
            </h1>
            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded border border-neutral-800 bg-neutral-900 text-neutral-300">
              LOCAL FILE REPOSITORY
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            Manage creative projects, media bins, generation logs, and prompt vaults.
          </p>
        </div>

        <button
          onClick={() => setIsCreatingProject(!isCreatingProject)}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Project</span>
        </button>
      </div>

      {isCreatingProject && (
        <form onSubmit={handleCreate} className="p-5 rounded-xl border border-neutral-800 bg-neutral-900/80 space-y-3">
          <h3 className="text-xs font-bold text-white">Create Creative Project</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              required
              placeholder="Project Name (e.g. Autumn Commercial Campaign)"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              className="bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
            />
            <input
              type="text"
              placeholder="Project Scope & Notes"
              value={newProjectDesc}
              onChange={(e) => setNewProjectDesc(e.target.value)}
              className="bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
            />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsCreatingProject(false)}
              className="px-3 py-1.5 text-xs text-neutral-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-lg"
            >
              Create
            </button>
          </div>
        </form>
      )}

      {/* Projects Switcher Strip */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {projects.map((p) => {
          const isSelected = p.id === activeProject?.id;
          return (
            <button
              key={p.id}
              onClick={() => setSelectedProjectId(p.id)}
              className={`py-2 px-4 rounded-lg border text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-2 ${
                isSelected
                  ? 'bg-purple-600/20 border-purple-500 text-white shadow'
                  : 'bg-neutral-900/40 border-neutral-800 text-neutral-400 hover:text-white'
              }`}
            >
              <FolderArchive className="w-3.5 h-3.5 text-purple-400" />
              <span>{p.name}</span>
            </button>
          );
        })}
      </div>

      {activeProject && (
        <div className="space-y-6">
          {/* Media Assets Bin */}
          <div className="p-6 rounded-xl border border-neutral-800 bg-neutral-900/40 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Project Media Bin</h3>
                <p className="text-xs text-neutral-400 mt-0.5">{activeProject.description}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
              {/* Demo Video Reel */}
              <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg space-y-2">
                <div className="aspect-video w-full rounded overflow-hidden bg-black relative">
                  <video src="/storage/generations/sample.mp4" controls className="w-full h-full object-cover" />
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-white truncate">Sample Cinematic Reel</span>
                  <span className="font-mono text-[10px] text-neutral-500">15s</span>
                </div>
              </div>

              {/* Demo Hero Keyframe */}
              <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg space-y-2">
                <div className="aspect-video w-full rounded overflow-hidden bg-black relative">
                  <img src="/storage/generations/sample_hero.jpg" alt="Keyframe" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-white truncate">Keyframe Asset 01</span>
                  <span className="font-mono text-[10px] text-neutral-500">JPG</span>
                </div>
              </div>
            </div>
          </div>

          {/* Prompt Vault */}
          <div className="p-6 rounded-xl border border-neutral-800 bg-neutral-900/40 space-y-4">
            <h3 className="text-sm font-bold text-white">Saved Prompt Vault</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeProject.savedPrompts?.map((sp) => (
                <div key={sp.id} className="p-4 bg-neutral-950 border border-neutral-800 rounded-lg space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-white">
                    <span>{sp.title}</span>
                    <span className="font-mono text-[10px] text-purple-400 uppercase">{sp.type}</span>
                  </div>
                  <p className="text-xs text-neutral-400 font-mono leading-relaxed line-clamp-3">
                    {sp.prompt}
                  </p>
                  <div className="pt-2 flex items-center justify-between text-xs border-t border-neutral-900">
                    <button
                      onClick={() => handleCopyPrompt(sp.id, sp.prompt)}
                      className="text-neutral-400 hover:text-white flex items-center gap-1"
                    >
                      {copiedId === sp.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedId === sp.id ? 'Copied' : 'Copy'}</span>
                    </button>
                    {onUsePrompt && (
                      <button
                        onClick={() => onUsePrompt(sp.prompt)}
                        className="text-purple-400 hover:text-purple-300 font-medium"
                      >
                        Load in Studio →
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
