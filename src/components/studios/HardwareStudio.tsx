import React, { useState } from 'react';
import { HardwareInfo } from '../../types/index.ts';
import { api } from '../../services/api.ts';
import {
  Cpu,
  Layers,
  HardDrive,
  ShieldCheck,
  RefreshCw,
  Terminal,
  Server,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

interface HardwareStudioProps {
  hardware: HardwareInfo | null;
  onRefreshHardware: () => void;
}

export const HardwareStudio: React.FC<HardwareStudioProps> = ({
  hardware,
  onRefreshHardware,
}) => {
  const [comfyUrl, setComfyUrl] = useState(hardware?.comfyUiUrl || 'http://127.0.0.1:8188');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await onRefreshHardware();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const usedMemGB = hardware
    ? Number((hardware.totalMemoryGB - hardware.freeMemoryGB).toFixed(2))
    : 0.2;
  const memPct = hardware
    ? Math.round((usedMemGB / hardware.totalMemoryGB) * 100)
    : 10;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-neutral-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Hardware Diagnostics & Local Settings
            </h1>
            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded border border-neutral-800 bg-neutral-900 text-neutral-300">
              BARE-METAL TELEMETRY
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            Real system inspection, CPU thread distribution, CUDA acceleration check, and ComfyUI backend bridges.
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="px-3.5 py-1.5 text-xs font-medium text-neutral-300 bg-neutral-900 border border-neutral-800 hover:border-neutral-700 rounded-lg transition-colors flex items-center gap-2"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-purple-400' : ''}`} />
          <span>Re-Probe Hardware</span>
        </button>
      </div>

      {/* Primary Hardware Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* CPU */}
        <div className="p-5 rounded-xl border border-neutral-800 bg-neutral-900/40 space-y-3">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span>Processor (CPU)</span>
            <Cpu className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-sm font-bold text-white truncate">
            {hardware?.cpuModel || 'Generic x86_64 CPU'}
          </div>
          <div className="text-xs font-mono text-neutral-400">
            {hardware?.cpuCores ?? 2} Logical Cores · {hardware?.architecture ?? 'x86_64'}
          </div>
        </div>

        {/* RAM */}
        <div className="p-5 rounded-xl border border-neutral-800 bg-neutral-900/40 space-y-3">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span>RAM Allocation</span>
            <Layers className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-sm font-bold text-white tabular-nums">
            {usedMemGB} GB / {hardware?.totalMemoryGB ?? 4.0} GB ({memPct}%)
          </div>
          <div className="w-full bg-neutral-800 h-1.5 rounded-full overflow-hidden">
            <div className="bg-cyan-500 h-full" style={{ width: `${memPct}%` }} />
          </div>
        </div>

        {/* GPU */}
        <div className="p-5 rounded-xl border border-neutral-800 bg-neutral-900/40 space-y-3">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span>Dedicated GPU</span>
            <Server className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-sm font-bold text-white truncate">
            {hardware?.gpuDetected ? hardware.gpuName : 'None (CPU Fallback)'}
          </div>
          <div className="text-xs font-mono text-neutral-400">
            {hardware?.gpuVramGB ? `${hardware.gpuVramGB} GB VRAM` : 'Pure CPU Threading'}
          </div>
        </div>

        {/* FFmpeg */}
        <div className="p-5 rounded-xl border border-neutral-800 bg-neutral-900/40 space-y-3">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span>Media Engine (FFmpeg)</span>
            <HardDrive className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-sm font-bold text-white truncate">
            {hardware?.ffmpegAvailable ? 'Operational' : 'Missing'}
          </div>
          <div className="text-xs font-mono text-neutral-400">
            v{hardware?.ffmpegVersion ?? '4.4.2'} · H.264/AAC
          </div>
        </div>
      </div>

      {/* Local Backend & ComfyUI Configuration */}
      <div className="p-6 rounded-xl border border-neutral-800 bg-neutral-900/40 space-y-5">
        <div>
          <h3 className="text-sm font-bold text-white">Inference Engine Integration</h3>
          <p className="text-xs text-neutral-400 mt-1">
            Connect Liberty Studio to your local ComfyUI worker or run through the built-in procedural/diffusers inference pipeline.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-neutral-300">Local ComfyUI Endpoint URL</label>
            <input
              type="text"
              value={comfyUrl}
              onChange={(e) => setComfyUrl(e.target.value)}
              placeholder="http://127.0.0.1:8188"
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-xs font-mono text-neutral-200 focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-neutral-300">Storage Output Directory</label>
            <input
              type="text"
              readOnly
              value="/app/applet/public/storage"
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-xs font-mono text-neutral-400 cursor-not-allowed"
            />
          </div>
        </div>

        <div className="p-4 bg-neutral-950 rounded-lg border border-neutral-800 text-xs space-y-2">
          <div className="font-semibold text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Liberty Studio Self-Hosting Guarantees</span>
          </div>
          <ul className="text-neutral-400 space-y-1.5 text-[11px] list-disc list-inside">
            <li>Zero mandatory cloud API dependencies (Runway, OpenAI, DeepSeek not required).</li>
            <li>All files, keyframes, renders, and audio clips reside exclusively on your local filesystem.</li>
            <li>Hardware-aware safety checks prevent CUDA out-of-memory crashes on tight GPUs.</li>
            <li>Full support for CPU quantizations and low-VRAM optimizations.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
