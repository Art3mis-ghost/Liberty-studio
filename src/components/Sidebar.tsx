import React from 'react';
import { StudioTab } from '../types/index.ts';
import {
  LayoutDashboard,
  Image as ImageIcon,
  Video,
  Scissors,
  Film,
  UserCheck,
  Sparkles,
  Mic,
  FolderArchive,
  Boxes,
  Settings2,
} from 'lucide-react';

interface SidebarProps {
  currentTab: StudioTab;
  onSelectTab: (tab: StudioTab) => void;
  activeJobCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  activeJobCount,
}) => {
  const navItems = [
    { id: 'dashboard' as StudioTab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'image' as StudioTab, label: 'AI Image Studio', icon: ImageIcon },
    { id: 'video' as StudioTab, label: 'AI Video Studio', icon: Video },
    { id: 'clipping' as StudioTab, label: 'Video Clipping Studio', icon: Scissors },
    { id: 'editor' as StudioTab, label: 'AI Video Editor', icon: Film },
    { id: 'character' as StudioTab, label: 'Character Studio', icon: UserCheck },
    { id: 'upscaler' as StudioTab, label: 'AI Upscaler', icon: Sparkles },
    { id: 'audio' as StudioTab, label: 'AI Audio Studio', icon: Mic },
    { id: 'library' as StudioTab, label: 'Project Library', icon: FolderArchive },
    { id: 'models' as StudioTab, label: 'Model Manager', icon: Boxes },
    { id: 'hardware' as StudioTab, label: 'Hardware & Settings', icon: Settings2 },
  ];

  return (
    <aside className="w-64 border-r border-neutral-800 bg-neutral-950 flex flex-col shrink-0 select-none">
      <div className="p-4 border-b border-neutral-900">
        <div className="text-[11px] font-mono uppercase tracking-wider text-neutral-500 font-semibold px-2">
          Creative Workspaces
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-2 px-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap text-left ${
                isActive
                  ? 'bg-purple-600/15 text-purple-300 border border-purple-500/30'
                  : 'text-neutral-400 hover:text-neutral-100 hover:bg-neutral-900/60'
              }`}
            >
              <div className="flex items-center gap-2.5 truncate">
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-purple-400' : 'text-neutral-500'}`} />
                <span className="truncate">{item.label}</span>
              </div>
              {item.id === 'clipping' && (
                <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-800/40 px-1 rounded">
                  KIXY
                </span>
              )}
              {item.id === 'video' && (
                <span className="text-[10px] font-mono text-purple-400 bg-purple-950/60 border border-purple-800/40 px-1 rounded">
                  CINEMA
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Active background jobs status widget */}
      {activeJobCount > 0 && (
        <div className="p-3 mx-3 mb-3 rounded-lg border border-purple-800/40 bg-purple-950/20 text-xs">
          <div className="flex items-center justify-between text-neutral-300 font-medium mb-1">
            <span className="truncate">Active AI Jobs</span>
            <span className="font-mono text-purple-400">{activeJobCount}</span>
          </div>
          <div className="w-full bg-neutral-900 h-1.5 rounded-full overflow-hidden">
            <div className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full w-2/3 animate-pulse" />
          </div>
        </div>
      )}

      {/* Studio info footer */}
      <div className="p-3 border-t border-neutral-900 text-[11px] text-neutral-500 flex items-center justify-between">
        <span>v2.4.0 · Open Inference</span>
        <span className="text-neutral-400">Local-First</span>
      </div>
    </aside>
  );
};
