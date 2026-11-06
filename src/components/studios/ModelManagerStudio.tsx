import React, { useState, useEffect } from 'react';
import { ModelMetadata, HardwareInfo } from '../../types/index.ts';
import { api } from '../../services/api.ts';
import {
  Boxes,
  CheckCircle2,
  AlertTriangle,
  Download,
  Cpu,
  Layers,
  HardDrive,
  Info,
  Check,
  ExternalLink,
} from 'lucide-react';

interface ModelManagerStudioProps {
  hardware: HardwareInfo | null;
}

export const ModelManagerStudio: React.FC<ModelManagerStudioProps> = ({
  hardware,
}) => {
  const [models, setModels] = useState<ModelMetadata[]>([]);
  const [activeModels, setActiveModels] = useState<Record<string, string>>({});
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [compatibilityMap, setCompatibilityMap] = useState<Record<string, any>>({});

  useEffect(() => {
    loadModels();
  }, []);

  const loadModels = async () => {
    try {
      const data = await api.getModels();
      setModels(data.models);
      setActiveModels(data.activeModels);

      // Check compatibility for all models
      const map: Record<string, any> = {};
      for (const m of data.models) {
        map[m.id] = await api.checkModelCompatibility(m.id);
      }
      setCompatibilityMap(map);
    } catch (err) {
      console.error('Error loading models:', err);
    }
  };

  const handleToggleActive = async (category: string, modelId: string) => {
    try {
      const updated = await api.setActiveModel(category, modelId);
      setActiveModels(updated);
    } catch (err) {
      console.error('Failed to set active model:', err);
    }
  };

  const filteredModels =
    selectedCategory === 'all'
      ? models
      : models.filter((m) => m.category === selectedCategory);

  const categories = [
    { id: 'all', label: 'All Models' },
    { id: 'image', label: 'Image Models' },
    { id: 'video', label: 'Video Models' },
    { id: 'audio', label: 'Audio & Speech' },
    { id: 'upscaler', label: 'Upscalers' },
    { id: 'character', label: 'Adapters & Control' },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-neutral-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Model Manager & Open Weights Catalog
            </h1>
            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded border border-purple-800/40 bg-purple-950/60 text-purple-300">
              100% OPEN WEIGHTS & LOCAL
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            Browse downloadable open models, verify hardware VRAM compatibility, and manage active inference pipelines.
          </p>
        </div>
      </div>

      {/* Hardware Safety Banner */}
      <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-900/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-neutral-800 border border-neutral-700 flex items-center justify-center text-purple-400 shrink-0">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white">Hardware Compatibility Engine</h4>
            <p className="text-[11px] text-neutral-400">
              {hardware?.gpuDetected
                ? `Detected GPU: ${hardware.gpuName} (${hardware.gpuVramGB}GB VRAM). Models requiring higher VRAM will display warnings.`
                : `CPU Fallback Mode: Only models with native CPU capability (Whisper, Piper, SD 1.5, Real-ESRGAN) are enabled.`}
            </p>
          </div>
        </div>

        <div className="text-right shrink-0">
          <span className="text-xs font-mono text-purple-400 font-semibold px-2.5 py-1 rounded bg-purple-950/60 border border-purple-800/40">
            {hardware?.systemTier.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setSelectedCategory(c.id)}
            className={`py-1.5 px-3 rounded-lg border text-xs font-medium whitespace-nowrap transition-colors ${
              selectedCategory === c.id
                ? 'bg-purple-600/20 border-purple-500 text-white font-semibold'
                : 'bg-neutral-900/60 border-neutral-800 text-neutral-400 hover:text-white'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Models Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredModels.map((model) => {
          const compat = compatibilityMap[model.id];
          const isActive = Object.values(activeModels).includes(model.id);

          return (
            <div
              key={model.id}
              className={`p-5 rounded-xl border flex flex-col justify-between transition-all ${
                isActive
                  ? 'bg-neutral-900/90 border-purple-500/80 shadow-md shadow-purple-950/30'
                  : 'bg-neutral-900/40 border-neutral-800 hover:border-neutral-700'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="text-[10px] font-mono uppercase text-neutral-400 bg-neutral-950 px-2 py-0.5 rounded border border-neutral-800">
                    {model.architecture}
                  </span>
                  <span className="text-[10px] font-mono text-neutral-500">
                    {model.license}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-white">{model.name}</h3>
                <p className="text-xs text-neutral-400 mt-2 leading-relaxed">
                  {model.description}
                </p>

                {/* Hardware Spec Tags */}
                <div className="grid grid-cols-2 gap-2 my-4 text-[11px] font-mono">
                  <div className="p-2 bg-neutral-950 rounded border border-neutral-800/80">
                    <span className="text-neutral-500 block text-[10px]">Disk Footprint</span>
                    <span className="text-neutral-200">{model.sizeGB} GB</span>
                  </div>
                  <div className="p-2 bg-neutral-950 rounded border border-neutral-800/80">
                    <span className="text-neutral-500 block text-[10px]">Min VRAM</span>
                    <span className="text-neutral-200">
                      {model.cpuCapable ? `${model.minVramGB}GB (CPU OK)` : `${model.minVramGB}GB CUDA`}
                    </span>
                  </div>
                </div>

                {/* Compatibility Warning if not compatible */}
                {compat && !compat.compatible && (
                  <div className="p-2.5 bg-amber-950/40 border border-amber-800/60 rounded-lg text-[11px] text-amber-300 flex items-start gap-2 mb-3">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                    <span>{compat.reason}</span>
                  </div>
                )}
              </div>

              {/* Bottom Actions */}
              <div className="pt-3 border-t border-neutral-800 flex items-center justify-between text-xs">
                <span className="text-[11px] text-neutral-500 truncate max-w-[140px]">
                  {model.bestFor}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleActive(model.category, model.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 ${
                      isActive
                        ? 'bg-purple-600 text-white'
                        : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300'
                    }`}
                  >
                    {isActive ? <Check className="w-3 h-3" /> : null}
                    <span>{isActive ? 'Active Pipeline' : 'Set Active'}</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
