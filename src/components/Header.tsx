import React from 'react';
import { StudioTab, HardwareInfo } from '../types/index.ts';
import { Cpu, Plus } from 'lucide-react';

interface HeaderProps {
  currentTab: StudioTab;
  onSelectTab: (tab: StudioTab) => void;
  hardware: HardwareInfo | null;
  onNewProject: () => void;
  onOpenModelsModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  hardware,
  onNewProject,
  onOpenModelsModal,
}) => {
  return (
    <header className="h-16 border-b border-neutral-800 bg-neutral-950/90 backdrop-blur-md px-6 flex items-center justify-between gap-8 sticky top-0 z-40">
      {/* Zone 1: Single text element wordmark */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={() => onSelectTab('dashboard')}
          className="text-lg font-extrabold tracking-tight text-white hover:text-purple-400 transition-colors whitespace-nowrap shrink-0 flex items-center gap-2 text-left"
        >
          <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white text-xs font-black shadow-inner">
            L
          </span>
          LIBERTY STUDIO AI
        </button>
      </div>

      {/* Zone 2: 4-5 concise single-line text navigation links */}
      <nav className="hidden lg:flex items-center gap-8 text-sm font-medium text-neutral-400">
        <button
          onClick={() => onSelectTab('dashboard')}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 pb-0.5 ${
            currentTab === 'dashboard' ? 'text-white border-b-2 border-purple-500' : ''
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => onSelectTab('video')}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 pb-0.5 ${
            currentTab === 'video' || currentTab === 'image' ? 'text-white border-b-2 border-purple-500' : ''
          }`}
        >
          Cinematic Studio
        </button>
        <button
          onClick={() => onSelectTab('clipping')}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 pb-0.5 ${
            currentTab === 'clipping' ? 'text-white border-b-2 border-purple-500' : ''
          }`}
        >
          Viral Clipping
        </button>
        <button
          onClick={() => onSelectTab('editor')}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 pb-0.5 ${
            currentTab === 'editor' ? 'text-white border-b-2 border-purple-500' : ''
          }`}
        >
          Timeline Editor
        </button>
        <button
          onClick={() => onSelectTab('models')}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 pb-0.5 ${
            currentTab === 'models' ? 'text-white border-b-2 border-purple-500' : ''
          }`}
        >
          Open Models
        </button>
        {onOpenModelsModal && (
          <button
            onClick={onOpenModelsModal}
            className="text-xs font-semibold px-2.5 py-1 rounded-md bg-purple-950/60 text-purple-300 border border-purple-800/50 hover:bg-purple-900/60 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
            title="Inspect models, tools, and technical architecture"
          >
            <span>Models & Tools</span>
          </button>
        )}
      </nav>

      {/* Zone 3: 1 primary action + quiet hardware indicator */}
      <div className="flex items-center gap-4 shrink-0">
        <button
          onClick={() => onSelectTab('hardware')}
          className="hidden sm:flex items-center gap-2 text-xs font-mono text-neutral-400 hover:text-neutral-200 transition-colors py-1.5 px-3 rounded border border-neutral-800 bg-neutral-900/60"
          title="Click to view hardware diagnostics"
        >
          <Cpu className="w-3.5 h-3.5 text-purple-400 shrink-0" />
          <span className="tabular-nums">
            {hardware?.gpuDetected
              ? `${hardware.gpuName?.split(' ')[0] || 'GPU'} (${hardware.gpuVramGB}GB)`
              : `CPU (${hardware?.freeMemoryGB ?? 3.8}GB RAM free)`}
          </span>
        </button>

        <button
          onClick={onNewProject}
          className="px-3.5 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 active:bg-purple-700 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 shadow-sm shadow-purple-600/30"
        >
          <Plus className="w-4 h-4 shrink-0" />
          <span>New Project</span>
        </button>
      </div>
    </header>
  );
};
