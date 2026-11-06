import React, { useState, useEffect, useRef } from 'react';
import { CharacterProfile } from '../../types/index.ts';
import { api } from '../../services/api.ts';
import {
  UserCheck,
  Plus,
  Trash2,
  Sparkles,
  Layers,
  Sliders,
  Check,
  Tag,
  Upload,
} from 'lucide-react';

interface CharacterStudioProps {
  onSendToImageStudio?: (promptWithCharacter: string) => void;
}

export const CharacterStudio: React.FC<CharacterStudioProps> = ({
  onSendToImageStudio,
}) => {
  const [characters, setCharacters] = useState<CharacterProfile[]>([]);
  const [selectedCharId, setSelectedCharId] = useState<string>('');
  const [isCreating, setIsCreating] = useState(false);

  // New character form state
  const [name, setName] = useState('');
  const [triggerWord, setTriggerWord] = useState('');
  const [description, setDescription] = useState('');
  const [consistencyWeight, setConsistencyWeight] = useState(0.85);
  const [styleTags, setStyleTags] = useState('cinematic portrait, 35mm lens, sharp jawline');
  const [uploadedRefImage, setUploadedRefImage] = useState('/storage/generations/sample_hero.jpg');
  const [uploadingRef, setUploadingRef] = useState(false);
  const refPhotoInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingRef(true);
    try {
      const res = await api.uploadFile(file);
      setUploadedRefImage(res.url);
    } catch (err) {
      console.error('Photo upload error:', err);
    } finally {
      setUploadingRef(false);
    }
  };

  useEffect(() => {
    loadCharacters();
  }, []);

  const loadCharacters = async () => {
    try {
      const list = await api.getCharacters();
      setCharacters(list);
      if (list.length > 0 && !selectedCharId) {
        setSelectedCharId(list[0].id);
      }
    } catch (err) {
      console.error('Failed to load characters:', err);
    }
  };

  const handleCreateCharacter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !triggerWord.trim()) return;

    try {
      const created = await api.createCharacter({
        name,
        triggerWord: triggerWord.trim().toLowerCase(),
        description,
        consistencyWeight,
        styleTags: styleTags.split(',').map((t) => t.trim()),
        referenceImages: [uploadedRefImage],
      });
      setCharacters((prev) => [created, ...prev]);
      setSelectedCharId(created.id);
      setIsCreating(false);
      setName('');
      setTriggerWord('');
      setDescription('');
    } catch (err) {
      console.error('Failed to create character:', err);
    }
  };

  const handleDelete = async (id: string) => {
    await api.deleteCharacter(id);
    setCharacters((prev) => prev.filter((c) => c.id !== id));
  };

  const selectedChar = characters.find((c) => c.id === selectedCharId) || characters[0];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-neutral-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Character Consistency Studio
            </h1>
            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded border border-purple-800/40 bg-purple-950/60 text-purple-300">
              IP-ADAPTER & LORA
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            Store face reference anchors, trigger tokens, and consistency weights to preserve character identity across scenes.
          </p>
        </div>

        <button
          onClick={() => setIsCreating(!isCreating)}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Character Profile</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Character Profiles List (5 Cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="text-xs font-semibold text-neutral-300 mb-2">
            Character Cast ({characters.length})
          </div>

          <div className="space-y-3">
            {characters.map((char) => {
              const isSelected = selectedChar?.id === char.id;
              return (
                <div
                  key={char.id}
                  onClick={() => setSelectedCharId(char.id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-neutral-900 border-purple-500 shadow-lg shadow-purple-950/30'
                      : 'bg-neutral-900/40 border-neutral-800 hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-bold text-white">{char.name}</h3>
                      <div className="text-[11px] font-mono text-purple-400 mt-0.5">
                        Trigger: <span className="bg-purple-950/80 px-1 py-0.5 rounded">{char.triggerWord}</span>
                      </div>
                    </div>
                    <span className="text-xs font-mono text-neutral-400 tabular-nums">
                      {Math.round(char.consistencyWeight * 100)}% Lock
                    </span>
                  </div>

                  <p className="text-xs text-neutral-400 mt-2 line-clamp-2 leading-relaxed">
                    {char.description}
                  </p>

                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-neutral-800/60 text-[11px]">
                    <div className="flex items-center gap-1 text-neutral-500">
                      <Tag className="w-3 h-3" />
                      <span>{char.styleTags.length} Anchor Tags</span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(char.id);
                      }}
                      className="text-neutral-500 hover:text-red-400 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Profile Detail & Scene Generator (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {isCreating ? (
            /* Creation Form */
            <form onSubmit={handleCreateCharacter} className="p-6 rounded-xl border border-neutral-800 bg-neutral-900/80 space-y-4">
              <h3 className="text-sm font-bold text-white">Create Character Consistency Profile</h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">Character Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Elena Vance"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">Trigger Token</label>
                  <input
                    type="text"
                    required
                    value={triggerWord}
                    onChange={(e) => setTriggerWord(e.target.value)}
                    placeholder="e.g. ohwx_elena"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-xs font-mono text-purple-300 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">Visual Identity Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="30-year-old aerospace engineer with amber eyes, short cropped brunette hair..."
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-neutral-300">IP-Adapter Consistency Weight</span>
                  <span className="font-mono text-purple-400">{Math.round(consistencyWeight * 100)}%</span>
                </div>
                <input
                  type="range"
                  min={0.5}
                  max={1.0}
                  step={0.05}
                  value={consistencyWeight}
                  onChange={(e) => setConsistencyWeight(Number(e.target.value))}
                  className="w-full h-1.5 bg-neutral-800 rounded appearance-none cursor-pointer"
                />
              </div>

              {/* Reference Face Photo Upload */}
              <div className="p-3 bg-neutral-950 rounded-lg border border-neutral-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-neutral-300">Identity Reference Photo</span>
                  <input
                    type="file"
                    ref={refPhotoInputRef}
                    onChange={handlePhotoUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => refPhotoInputRef.current?.click()}
                    disabled={uploadingRef}
                    className="text-[11px] text-purple-400 hover:text-purple-300 font-medium flex items-center gap-1"
                  >
                    <Upload className="w-3 h-3" />
                    <span>{uploadingRef ? 'Uploading...' : 'Upload Face Image'}</span>
                  </button>
                </div>
                {uploadedRefImage && (
                  <div className="flex items-center gap-2.5 pt-1">
                    <img
                      src={uploadedRefImage}
                      alt="Ref photo"
                      className="w-10 h-10 object-cover rounded border border-neutral-700 shrink-0"
                    />
                    <span className="text-[11px] text-neutral-400 font-mono truncate">
                      {uploadedRefImage.split('/').pop()}
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">Anchor Style Tags</label>
                <input
                  type="text"
                  value={styleTags}
                  onChange={(e) => setStyleTags(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-xs text-neutral-200 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-3.5 py-2 border border-neutral-700 text-neutral-300 text-xs rounded-lg hover:bg-neutral-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-lg"
                >
                  Save Profile
                </button>
              </div>
            </form>
          ) : selectedChar ? (
            /* Selected Character Inspector */
            <div className="p-6 rounded-xl border border-neutral-800 bg-neutral-900/60 space-y-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-bold text-white">{selectedChar.name}</h2>
                  <div className="text-xs font-mono text-purple-400 mt-1">
                    Token: <span className="bg-purple-950 px-1.5 py-0.5 rounded">{selectedChar.triggerWord}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-mono text-neutral-400">Consistency Strength</div>
                  <div className="text-sm font-bold text-purple-300 font-mono">
                    {Math.round(selectedChar.consistencyWeight * 100)}%
                  </div>
                </div>
              </div>

              <div className="p-4 bg-neutral-950 rounded-lg border border-neutral-800 text-xs text-neutral-300 leading-relaxed">
                {selectedChar.description}
              </div>

              <div>
                <div className="text-xs font-semibold text-neutral-300 mb-2">Style Anchor Tags</div>
                <div className="flex flex-wrap gap-2">
                  {selectedChar.styleTags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded bg-neutral-950 border border-neutral-800 text-[11px] text-neutral-300 font-mono"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Send to Image Studio Prompt Button */}
              <div className="pt-4 border-t border-neutral-800 flex items-center justify-between">
                <span className="text-xs text-neutral-400">
                  Inject character anchor into Image Studio
                </span>
                {onSendToImageStudio && (
                  <button
                    onClick={() => {
                      const scenePrompt = `${selectedChar.triggerWord}, ${selectedChar.description}, ${selectedChar.styleTags.join(', ')}, standing in a futuristic hangar, cinematic lighting, 8k resolution`;
                      onSendToImageStudio(scenePrompt);
                    }}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Generate Scene with Character</span>
                  </button>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
