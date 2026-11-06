import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  X,
  Camera,
  Film,
  Scissors,
  Wand2,
  Copy,
  Check,
  Bot,
  User,
  RotateCcw,
} from 'lucide-react';

export type CreativeRole = 'cinematographer' | 'screenwriter' | 'video_editor' | 'vfx_supervisor';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface CreativeChatbotProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyPrompt?: (promptText: string) => void;
}

const ROLES: Array<{
  id: CreativeRole;
  label: string;
  icon: React.ElementType;
  description: string;
}> = [
  {
    id: 'cinematographer',
    label: 'Cinematographer',
    icon: Camera,
    description: 'Camera motion, anamorphic lenses, lighting & color science',
  },
  {
    id: 'screenwriter',
    label: 'Screenplay Writer',
    icon: Film,
    description: 'High-concept hooks, beat sheets, dialogue & visual descriptions',
  },
  {
    id: 'video_editor',
    label: 'Video Editor',
    icon: Scissors,
    description: 'Pacing, cut rhythms, sound design & short-form viral retention',
  },
  {
    id: 'vfx_supervisor',
    label: 'VFX Supervisor',
    icon: Wand2,
    description: 'Compositing, ControlNet, green-screen & multi-pass pipelines',
  },
];

const QUICK_PROMPTS: Record<CreativeRole, string[]> = {
  cinematographer: [
    'Design an anamorphic dolly-in shot with volumetric fog for Wan 2.1 video',
    'What lighting setup creates a high-contrast film noir look?',
    'Write a photorealistic prompt for a mountain covered in snow at golden hour',
  ],
  screenwriter: [
    'Write a 3-act beat sheet for a 30-second sci-fi teaser',
    'Craft a high-retention hook for an educational AI shorts video',
    'Describe a character consistency profile for a cyberpunk detective',
  ],
  video_editor: [
    'How do I time speed ramps for an action video clip?',
    'What audio ducking and sound effects hook viewers in the first 3 seconds?',
    'Best practices for cutting 16:9 interview footage into 9:16 vertical shorts',
  ],
  vfx_supervisor: [
    'How do I structure ControlNet OpenPose and Depth for character scenes?',
    'Best settings for Real-ESRGAN 4x upscaling on video frames',
    'Craft negative prompt keywords to remove flicker and temporal artifacts',
  ],
};

export const CreativeChatbot: React.FC<CreativeChatbotProps> = ({
  isOpen,
  onClose,
  onApplyPrompt,
}) => {
  const [selectedRole, setSelectedRole] = useState<CreativeRole>('cinematographer');
  const [selectedModel, setSelectedModel] = useState<'gemini-3.8-flash' | 'gemini-4-argon' | 'gemini-3.1-flash-lite'>('gemini-3.8-flash');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Welcome to the Liberty Studio Creative Room. I'm your Director of Photography & Cinematographer. Describe what you want to shoot or generate, and I'll architect the exact camera moves, lighting ratios, and diffusion prompts.`,
      timestamp: Date.now(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [interactionId, setInteractionId] = useState<string | undefined>(undefined);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleRoleChange = (role: CreativeRole) => {
    setSelectedRole(role);
    const roleObj = ROLES.find((r) => r.id === role);
    setMessages((prev) => [
      ...prev,
      {
        id: `switch_${Date.now()}`,
        role: 'assistant',
        content: `Switched creative role to **${roleObj?.label}**. Ready to assist with ${roleObj?.description}.`,
        timestamp: Date.now(),
      },
    ]);
  };

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || loading) return;

    const userMsg: Message = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const historyPayload = messages.slice(-6).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch('/api/chat/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          role: selectedRole,
          model: selectedModel,
          history: historyPayload,
          previousInteractionId: interactionId,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to get creative response');
      }

      if (data.interactionId) {
        setInteractionId(data.interactionId);
      }

      const assistantMsg: Message = {
        id: `assistant_${Date.now()}`,
        role: 'assistant',
        content: data.reply,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          role: 'assistant',
          content: `⚠️ Creative Assistant Notice: ${err.message}. If using cloud models, ensure GEMINI_API_KEY is configured in AI Studio Secrets.`,
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClear = () => {
    setMessages([
      {
        id: `reset_${Date.now()}`,
        role: 'assistant',
        content: `Conversation reset. Ready for your next creative prompt or directing brief.`,
        timestamp: Date.now(),
      },
    ]);
    setInteractionId(undefined);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-4xl h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Top Header */}
        <div className="p-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-purple-600/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Creative Director AI
                <span className="text-xs px-2 py-0.5 rounded-full bg-purple-950/70 text-purple-300 border border-purple-800/40">
                  Multi-Turn
                </span>
              </h3>
              <p className="text-xs text-neutral-400">
                Direct cinematography, write screenplay beats, plan viral shorts & design VFX
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Model Selector */}
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value as any)}
              className="text-xs bg-neutral-800 border border-neutral-700 text-neutral-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-purple-500"
            >
              <option value="gemini-3.8-flash">gemini-3.8-flash (Balanced)</option>
              <option value="gemini-4-argon">gemini-4-argon (Complex Reasoning)</option>
              <option value="gemini-3.1-flash-lite">gemini-3.1-flash-lite (Fast)</option>
            </select>

            <button
              onClick={handleClear}
              className="p-1.5 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded-lg transition-colors"
              title="Reset conversation"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Roles Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 border-b border-neutral-800/80 bg-neutral-950/40">
          {ROLES.map((r) => {
            const Icon = r.icon;
            const isSelected = selectedRole === r.id;
            return (
              <button
                key={r.id}
                onClick={() => handleRoleChange(r.id)}
                className={`flex items-center gap-2 p-2 rounded-xl text-left transition-all border ${
                  isSelected
                    ? 'bg-purple-950/50 border-purple-700/60 text-white shadow-sm'
                    : 'bg-neutral-800/40 border-neutral-800 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/80'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                    isSelected ? 'bg-purple-600 text-white' : 'bg-neutral-800 text-neutral-400'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div className="overflow-hidden">
                  <div className="text-xs font-semibold truncate">{r.label}</div>
                  <div className="text-[10px] text-neutral-400 truncate">{r.description}</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Message Thread */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((m) => {
            const isUser = m.role === 'user';
            return (
              <div
                key={m.id}
                className={`flex gap-3 max-w-[85%] ${isUser ? 'ml-auto flex-row-reverse' : ''}`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-xs ${
                    isUser
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gradient-to-br from-purple-600 to-indigo-700 text-white'
                  }`}
                >
                  {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                <div
                  className={`rounded-2xl p-4 text-xs leading-relaxed space-y-2 border ${
                    isUser
                      ? 'bg-purple-600 text-white border-purple-500 rounded-tr-none'
                      : 'bg-neutral-800/70 text-neutral-200 border-neutral-700/60 rounded-tl-none'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{m.content}</div>

                  {!isUser && (
                    <div className="flex items-center gap-2 pt-2 border-t border-neutral-700/40 text-[11px] text-neutral-400">
                      <button
                        onClick={() => handleCopy(m.content, m.id)}
                        className="hover:text-purple-300 flex items-center gap-1 transition-colors"
                      >
                        {copiedId === m.id ? (
                          <>
                            <Check className="w-3 h-3 text-green-400" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy Advice</span>
                          </>
                        )}
                      </button>

                      {onApplyPrompt && (
                        <button
                          onClick={() => {
                            onApplyPrompt(m.content);
                            onClose();
                          }}
                          className="hover:text-purple-300 flex items-center gap-1 transition-colors ml-auto"
                        >
                          <Sparkles className="w-3 h-3 text-purple-400" />
                          <span>Use in Studio</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex gap-3 max-w-[85%]">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-600 to-indigo-700 text-white flex items-center justify-center shrink-0 text-xs">
                <Bot className="w-4 h-4 animate-spin" />
              </div>
              <div className="bg-neutral-800/70 border border-neutral-700/60 rounded-2xl rounded-tl-none p-4 text-xs text-neutral-400 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
                <span>Directing scene & reasoning with {selectedModel}...</span>
              </div>
            </div>
          )}
        </div>

        {/* Quick Prompts */}
        <div className="px-4 py-2 border-t border-neutral-800/60 bg-neutral-950/20 flex items-center gap-2 overflow-x-auto text-xs no-scrollbar">
          <span className="text-[10px] uppercase font-bold text-neutral-400 shrink-0">Ideas:</span>
          {QUICK_PROMPTS[selectedRole].map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(p)}
              className="px-2.5 py-1 rounded-full bg-neutral-800/80 border border-neutral-700/50 text-neutral-300 hover:text-white hover:bg-neutral-700/60 transition-colors whitespace-nowrap shrink-0 text-[11px]"
            >
              {p}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-neutral-800 bg-neutral-950/80">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-3"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Ask the ${ROLES.find((r) => r.id === selectedRole)?.label} anything...`}
              className="flex-1 bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-purple-500"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-semibold text-xs transition-colors flex items-center gap-2 shadow-sm shadow-purple-600/30"
            >
              <span>Send</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
