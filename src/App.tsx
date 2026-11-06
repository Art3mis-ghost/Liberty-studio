import React, { useState, useEffect } from 'react';
import { StudioTab, HardwareInfo, BackgroundJob } from './types/index.ts';
import { api } from './services/api.ts';
import { Header } from './components/Header.tsx';
import { Sidebar } from './components/Sidebar.tsx';
import { PromptAssistantModal } from './components/PromptAssistantModal.tsx';
import { DashboardStudio } from './components/studios/DashboardStudio.tsx';
import { VideoStudio } from './components/studios/VideoStudio.tsx';
import { ClippingStudio } from './components/studios/ClippingStudio.tsx';
import { ImageStudio } from './components/studios/ImageStudio.tsx';
import { EditorStudio } from './components/studios/EditorStudio.tsx';
import { CharacterStudio } from './components/studios/CharacterStudio.tsx';
import { UpscalerStudio } from './components/studios/UpscalerStudio.tsx';
import { AudioStudio } from './components/studios/AudioStudio.tsx';
import { ProjectLibraryStudio } from './components/studios/ProjectLibraryStudio.tsx';
import { ModelManagerStudio } from './components/studios/ModelManagerStudio.tsx';
import { HardwareStudio } from './components/studios/HardwareStudio.tsx';
import { ModelArchitectureModal } from './components/ModelArchitectureModal.tsx';
import { X, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState<StudioTab>('dashboard');
  const [hardware, setHardware] = useState<HardwareInfo | null>(null);
  const [allJobs, setAllJobs] = useState<BackgroundJob[]>([]);
  const [activeJobs, setActiveJobs] = useState<BackgroundJob[]>([]);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [isModelsModalOpen, setIsModelsModalOpen] = useState<boolean>(false);

  // Cross-studio pipeline state
  const [initialVideoPrompt, setInitialVideoPrompt] = useState<string>('');
  const [initialSourceImageUrl, setInitialSourceImageUrl] = useState<string>('');
  const [initialClippingVideoUrl, setInitialClippingVideoUrl] = useState<string>('');

  // Prompt assistant modal state
  const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);
  const [promptToEnhance, setPromptToEnhance] = useState('');

  // Initial load
  useEffect(() => {
    loadHardware();
    loadJobs();
    const interval = setInterval(() => {
      loadJobs();
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  const loadHardware = async () => {
    try {
      const hw = await api.getHardware();
      setHardware(hw);
    } catch (err) {
      console.error('Failed to load hardware info:', err);
    }
  };

  const loadJobs = async () => {
    try {
      const jobs = await api.getJobs();
      setAllJobs(jobs);
      setActiveJobs(jobs.filter((j) => j.status === 'processing' || j.status === 'pending'));
    } catch (err) {
      // quiet poll failure
    }
  };

  const handleJobCreated = (jobId: string) => {
    setActiveJobId(jobId);
    loadJobs();
  };

  const handleOpenPromptAssistant = (prompt: string) => {
    setPromptToEnhance(prompt);
    setIsPromptModalOpen(true);
  };

  const handleApplyEnhancedPrompt = (enhanced: string) => {
    // If user is in Video Studio, apply to video studio prompt
    // In Image studio, apply to image studio prompt
    setInitialVideoPrompt(enhanced);
  };

  const handleSendImageToVideo = (imageUrl: string, promptText: string) => {
    setInitialSourceImageUrl(imageUrl);
    setInitialVideoPrompt(promptText);
    setCurrentTab('video');
  };

  const handleSendVideoToClipping = (videoUrl: string) => {
    setInitialClippingVideoUrl(videoUrl);
    setCurrentTab('clipping');
  };

  const handleSendVideoToEditor = (_videoUrl: string) => {
    setCurrentTab('editor');
  };

  const latestActiveJob = allJobs.find((j) => j.id === activeJobId) || activeJobs[0] || allJobs[0] || null;

  return (
    <div className="min-h-screen bg-[#090a0f] text-neutral-100 flex flex-col font-sans">
      {/* Top Bar Header adhering to Top Bar Contract */}
      <Header
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        hardware={hardware}
        onNewProject={() => setCurrentTab('library')}
        onOpenModelsModal={() => setIsModelsModalOpen(true)}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Pro Creative Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          activeJobCount={activeJobs.length}
        />

        {/* Studio Viewport */}
        <main className="flex-1 overflow-y-auto bg-gradient-to-b from-[#090a0f] to-[#0e1017] min-h-[calc(100vh-4rem)]">
          {/* Active Job Floating Banner if running */}
          {latestActiveJob && (latestActiveJob.status === 'processing' || latestActiveJob.status === 'pending') && (
            <div className="sticky top-0 z-30 bg-purple-950/90 border-b border-purple-800/80 backdrop-blur-md px-6 py-2.5 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <Loader2 className="w-4 h-4 text-purple-400 animate-spin shrink-0" />
                <span className="font-semibold text-white">
                  [{latestActiveJob.type.toUpperCase()}] {latestActiveJob.stage}
                </span>
                <span className="font-mono text-purple-300">({latestActiveJob.progress}%)</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-32 bg-neutral-900 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-purple-400 h-full transition-all duration-300"
                    style={{ width: `${latestActiveJob.progress}%` }}
                  />
                </div>
                <button
                  onClick={() => api.cancelJob(latestActiveJob.id)}
                  className="text-neutral-400 hover:text-white p-1"
                  title="Cancel Job"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Failed Job Banner */}
          {latestActiveJob && latestActiveJob.status === 'failed' && (
            <div className="sticky top-0 z-30 bg-rose-950/90 border-b border-rose-800/80 backdrop-blur-md px-6 py-2.5 flex items-center justify-between text-xs text-rose-200">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span className="font-semibold">Pipeline Error:</span>
                <span className="truncate max-w-xl">{latestActiveJob.error || 'Operation failed'}</span>
              </div>
              <button
                onClick={() => setActiveJobId(null)}
                className="text-neutral-400 hover:text-white p-1"
                title="Dismiss"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Render Active Studio */}
          {currentTab === 'dashboard' && (
            <DashboardStudio
              onSelectTab={setCurrentTab}
              hardware={hardware}
              activeJobs={activeJobs}
              activeJob={latestActiveJob}
              onJobCreated={handleJobCreated}
              onOpenPromptAssistant={handleOpenPromptAssistant}
              onSendToVideoStudio={handleSendImageToVideo}
              onSendToClipping={handleSendVideoToClipping}
              onSendToEditor={handleSendVideoToEditor}
            />
          )}

          {currentTab === 'video' && (
            <VideoStudio
              onOpenPromptAssistant={handleOpenPromptAssistant}
              onSendToEditor={handleSendVideoToEditor}
              onSendToClipping={handleSendVideoToClipping}
              activeJob={latestActiveJob}
              onJobCreated={handleJobCreated}
            />
          )}

          {currentTab === 'clipping' && (
            <ClippingStudio
              activeJob={latestActiveJob}
              onJobCreated={handleJobCreated}
              onSendToEditor={handleSendVideoToEditor}
            />
          )}

          {currentTab === 'image' && (
            <ImageStudio
              onOpenPromptAssistant={handleOpenPromptAssistant}
              onSendToVideoStudio={handleSendImageToVideo}
              activeJob={latestActiveJob}
              onJobCreated={handleJobCreated}
            />
          )}

          {currentTab === 'editor' && (
            <EditorStudio
              activeJob={latestActiveJob}
              onJobCreated={handleJobCreated}
            />
          )}

          {currentTab === 'character' && (
            <CharacterStudio
              onSendToImageStudio={(scenePrompt) => {
                setInitialVideoPrompt(scenePrompt);
                setCurrentTab('image');
              }}
            />
          )}

          {currentTab === 'upscaler' && (
            <UpscalerStudio
              activeJob={latestActiveJob}
              onJobCreated={handleJobCreated}
            />
          )}

          {currentTab === 'audio' && (
            <AudioStudio
              activeJob={latestActiveJob}
              onJobCreated={handleJobCreated}
            />
          )}

          {currentTab === 'library' && (
            <ProjectLibraryStudio
              onUsePrompt={(prompt) => {
                setInitialVideoPrompt(prompt);
                setCurrentTab('video');
              }}
            />
          )}

          {currentTab === 'models' && (
            <ModelManagerStudio
              hardware={hardware}
            />
          )}

          {currentTab === 'hardware' && (
            <HardwareStudio
              hardware={hardware}
              onRefreshHardware={loadHardware}
            />
          )}
        </main>
      </div>

      {/* Prompt Assistant Modal */}
      <PromptAssistantModal
        isOpen={isPromptModalOpen}
        onClose={() => setIsPromptModalOpen(false)}
        initialPrompt={promptToEnhance}
        onApplyPrompt={handleApplyEnhancedPrompt}
      />

      {/* Model & Architecture Stack Modal */}
      <ModelArchitectureModal
        isOpen={isModelsModalOpen}
        onClose={() => setIsModelsModalOpen(false)}
      />
    </div>
  );
}
