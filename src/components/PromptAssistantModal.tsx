import React, { useState } from 'react';
import { api } from '../services/api.ts';
import { Wand2, X, Check, Copy } from 'lucide-react';

interface PromptAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPrompt: string;
  onApplyPrompt: (enhancedPrompt: string, negativePrompt?: string, suggestedCamera?: string) => void;
}

export const PromptAssistantModal: React.FC<PromptAssistantModalProps> = ({
  isOpen,
  onClose,
  initialPrompt,
  onApplyPrompt,
}) => {
  const [inputPrompt, setInputPrompt] = useState(initialPrompt || '');
  const [style, setStyle] = useState('cinematic');
  const [loading, setLoading] = useState(false);
  const [enhancedResult, setEnhancedResult] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleEnhance = async () => {
    if (!inputPrompt.trim()) return;
    setLoading(true);
    try {
      const geminiRes = await api.enhancePromptWithGemini(inputPrompt, style);
      if (geminiRes.success && geminiRes.result) {
        setEnhancedResult(geminiRes.result);
      } else {
        const res = await api.enhancePrompt(inputPrompt, style);
        setEnhancedResult(res);
      }
    } catch {
      try {
        const res = await api.enhancePrompt(inputPrompt, style);
        setEnhancedResult(res);
      } catch (err) {
        console.error('Enhancement error:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col">
        {/* Modal Header */}
        <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wand2 className="w-5 h-5 text-purple-400" />
            <h3 className="text-sm font-bold text-white tracking-wide">
              AI Creative Prompt Assistant
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white transition-colors p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1.5">
              Your Initial Idea or Rough Prompt
            </label>
            <textarea
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              placeholder="e.g. A cybernetic detective in rain, standing under neon streetlights..."
              rows={3}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-neutral-400">Cinematic Style:</span>
              <select
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                className="bg-neutral-950 border border-neutral-800 text-xs text-neutral-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-purple-500"
              >
                <option value="cinematic">Cinematic 35mm (Arri Alexa)</option>
                <option value="photorealistic">Photorealistic Natural Light</option>
                <option value="cyberpunk">Cyberpunk Neon Chiaroscuro</option>
                <option value="anime">Anime Keyframe Art</option>
                <option value="commercial">Commercial High Fashion</option>
              </select>
            </div>

            <button
              onClick={handleEnhance}
              disabled={loading || !inputPrompt.trim()}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Wand2 className="w-3.5 h-3.5" />
              <span>{loading ? 'Synthesizing...' : 'Enhance Prompt'}</span>
            </button>
          </div>

          {enhancedResult && (
            <div className="mt-4 pt-4 border-t border-neutral-800 space-y-3">
              <div>
                <div className="flex items-center justify-between text-xs font-semibold text-neutral-300 mb-1">
                  <span>Enhanced Cinematic Prompt</span>
                  <button
                    onClick={() => handleCopy(enhancedResult.enhancedPrompt)}
                    className="text-purple-400 hover:text-purple-300 flex items-center gap-1"
                  >
                    {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-200 leading-relaxed font-mono">
                  {enhancedResult.enhancedPrompt}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-2.5 bg-neutral-950 border border-neutral-800 rounded">
                  <div className="text-neutral-400 text-[11px] mb-0.5">Camera Direction</div>
                  <div className="text-neutral-200 font-medium truncate">{enhancedResult.suggestedCamera}</div>
                </div>
                <div className="p-2.5 bg-neutral-950 border border-neutral-800 rounded">
                  <div className="text-neutral-400 text-[11px] mb-0.5">Lighting Setup</div>
                  <div className="text-neutral-200 font-medium truncate">{enhancedResult.suggestedLighting}</div>
                </div>
              </div>

              <div>
                <div className="text-xs font-semibold text-neutral-400 mb-1">Recommended Negative Prompt</div>
                <div className="p-2 bg-neutral-950/80 border border-neutral-800 rounded text-[11px] text-neutral-400 font-mono">
                  {enhancedResult.negativePrompt}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div className="p-4 border-t border-neutral-800 bg-neutral-950 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-neutral-700 hover:bg-neutral-800 text-neutral-300 text-xs font-medium rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              if (enhancedResult) {
                onApplyPrompt(
                  enhancedResult.enhancedPrompt,
                  enhancedResult.negativePrompt,
                  enhancedResult.suggestedCamera
                );
              } else {
                onApplyPrompt(inputPrompt);
              }
              onClose();
            }}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Apply to Studio</span>
          </button>
        </div>
      </div>
    </div>
  );
};
