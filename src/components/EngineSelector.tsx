import React, { useState, useEffect } from 'react';
import { api } from '../services/api.ts';
import { Sparkles, Cpu, HelpCircle, CheckCircle2, AlertCircle, ExternalLink, X, ShieldCheck } from 'lucide-react';

interface EngineSelectorProps {
  engine: 'local' | 'gemini';
  onEngineChange: (engine: 'local' | 'gemini') => void;
  compact?: boolean;
}

export const EngineSelector: React.FC<EngineSelectorProps> = ({
  engine,
  onEngineChange,
  compact = false,
}) => {
  const [geminiConfigured, setGeminiConfigured] = useState<boolean>(false);
  const [showGuide, setShowGuide] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    api.getGeminiStatus().then((status) => {
      if (isMounted) {
        setGeminiConfigured(status.configured);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSelectGemini = () => {
    onEngineChange('gemini');
    if (!geminiConfigured) {
      setShowGuide(true);
    }
  };

  return (
    <>
      <div className={`flex items-center gap-2 ${compact ? '' : 'p-2 rounded-xl bg-neutral-900/70 border border-neutral-800'}`}>
        <div className="flex items-center gap-1 bg-neutral-950 p-1 rounded-lg border border-neutral-800/90 text-xs">
          <button
            type="button"
            onClick={() => onEngineChange('local')}
            className={`px-3 py-1.5 rounded-md font-medium flex items-center gap-1.5 transition-all ${
              engine === 'local'
                ? 'bg-neutral-800 text-white shadow-sm border border-neutral-700'
                : 'text-neutral-400 hover:text-white'
            }`}
            title="Free, self-hosted open-weight diffusion & FFmpeg pipelines"
          >
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <span>Local Open Engine</span>
            <span className="text-[10px] px-1 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/40">
              FREE
            </span>
          </button>

          <button
            type="button"
            onClick={handleSelectGemini}
            className={`px-3 py-1.5 rounded-md font-medium flex items-center gap-1.5 transition-all ${
              engine === 'gemini'
                ? 'bg-gradient-to-r from-purple-900/80 to-indigo-900/80 text-white shadow-sm border border-purple-500/50'
                : 'text-neutral-400 hover:text-white'
            }`}
            title="Google Gemini AI multimodal image & video synthesis"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>Google Gemini AI</span>
            <span
              className={`w-2 h-2 rounded-full ${
                geminiConfigured ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'
              }`}
              title={geminiConfigured ? 'API Key Active' : 'API Key Setup Needed'}
            />
          </button>
        </div>

        <button
          type="button"
          onClick={() => setShowGuide(true)}
          className="p-1.5 text-neutral-400 hover:text-purple-300 hover:bg-neutral-800 rounded-lg transition-colors"
          title="How to configure Gemini AI"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>

      {/* Instructional Guide Modal */}
      {showGuide && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-purple-900/50 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-5 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-950/80 border border-purple-800/50">
                  <Sparkles className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Google Gemini AI Engine Integration</h3>
                  <p className="text-xs text-neutral-400">High-fidelity image & video generation via @google/genai</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Current Status Banner */}
            <div
              className={`p-3.5 rounded-xl border flex items-start gap-3 ${
                geminiConfigured
                  ? 'bg-emerald-950/40 border-emerald-800/50 text-emerald-200'
                  : 'bg-amber-950/40 border-amber-800/50 text-amber-200'
              }`}
            >
              {geminiConfigured ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              )}
              <div className="text-xs space-y-1">
                <p className="font-semibold">
                  {geminiConfigured
                    ? 'Gemini AI is Fully Connected & Ready'
                    : 'GEMINI_API_KEY Not Detected Yet in Environment'}
                </p>
                <p className="text-neutral-300">
                  {geminiConfigured
                    ? 'Your Gemini API key is configured. You can generate directly with gemini-3.1-flash-lite-image and cinematic scene workflows.'
                    : 'Follow the 2 simple steps below to add your free Gemini API key, or keep using the Local Open Engine.'}
                </p>
              </div>
            </div>

            {/* Step by Step Setup Instructions */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                How to Add Google Gemini in AI Studio (1 Minute Setup)
              </h4>

              <div className="space-y-2.5 text-xs text-neutral-300">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-neutral-950/80 border border-neutral-800">
                  <span className="w-5 h-5 rounded-full bg-purple-900/60 text-purple-300 font-bold flex items-center justify-center shrink-0 text-[11px]">
                    1
                  </span>
                  <div>
                    <span className="font-semibold text-white">Get a Gemini API Key:</span>
                    <p className="text-neutral-400 mt-0.5">
                      Visit{' '}
                      <a
                        href="https://aistudio.google.com/app/apikey"
                        target="_blank"
                        rel="noreferrer"
                        className="text-purple-400 underline inline-flex items-center gap-1"
                      >
                        Google AI Studio API Keys <ExternalLink className="w-3 h-3" />
                      </a>{' '}
                      and click <strong>"Create API Key"</strong>.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-neutral-950/80 border border-neutral-800">
                  <span className="w-5 h-5 rounded-full bg-purple-900/60 text-purple-300 font-bold flex items-center justify-center shrink-0 text-[11px]">
                    2
                  </span>
                  <div>
                    <span className="font-semibold text-white">Add to Secrets in AI Studio:</span>
                    <p className="text-neutral-400 mt-0.5">
                      In the Google AI Studio sidebar or top navigation, click <strong>Secrets / Environment Variables</strong> and add a key named:
                    </p>
                    <code className="inline-block mt-1.5 px-2 py-0.5 bg-neutral-900 text-purple-300 font-mono text-[11px] rounded border border-purple-900/60">
                      GEMINI_API_KEY
                    </code>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-neutral-950/80 border border-neutral-800">
                  <span className="w-5 h-5 rounded-full bg-cyan-900/60 text-cyan-300 font-bold flex items-center justify-center shrink-0 text-[11px]">
                    3
                  </span>
                  <div>
                    <span className="font-semibold text-white">Enjoy Dual Power:</span>
                    <p className="text-neutral-400 mt-0.5">
                      You can seamlessly switch between <strong>Local Open Engine</strong> (completely free, self-hosted, offline) and <strong>Google Gemini AI</strong> whenever you want.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Model Capabilities */}
            <div className="p-3 rounded-xl bg-purple-950/20 border border-purple-900/30 text-[11px] text-purple-300 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-purple-400 shrink-0" />
              <span>
                Configured with <strong>gemini-3.1-flash-lite-image</strong> for images and <strong>gemini-omni-1.2-flash</strong> for video conditioning.
              </span>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  onEngineChange('local');
                  setShowGuide(false);
                }}
                className="px-4 py-2 text-xs font-semibold text-neutral-300 bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors"
              >
                Use Local Open Engine
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowGuide(false);
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 rounded-lg transition-colors"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
