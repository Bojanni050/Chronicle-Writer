'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { ActWithChapters, Project } from '@/lib/types';
import { ProjectSidebar } from './ProjectSidebar';
import { SceneEditor } from './SceneEditor';
import { ContextPanel } from './ContextPanel';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { Menu, X, ArrowLeft } from 'lucide-react';

interface CockpitProps {
  projectId: string;
  project: Project;
}

export function Cockpit({ projectId, project }: CockpitProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const selectedSceneId = searchParams.get('scene');

  const [acts, setActs] = useState<ActWithChapters[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [insertRequest, setInsertRequest] = useState<string | null>(null);

  const loadStructure = useCallback(async () => {
    const res = await fetch(`/api/projects/${projectId}/structure`);
    if (res.ok) {
      const data: ActWithChapters[] = await res.json();
      setActs(data);
      // Auto-select first scene if none selected
      if (!selectedSceneId && data.length > 0) {
        const firstScene = data[0]?.chapters[0]?.scenes[0];
        if (firstScene) {
          router.replace(`${pathname}?scene=${firstScene.id}`);
        }
      }
    }
  }, [projectId, pathname, router, selectedSceneId]);

  useEffect(() => {
    loadStructure();
  }, [loadStructure]);

  function selectScene(sceneId: string) {
    router.push(`${pathname}?scene=${sceneId}`);
  }

  return (
    <div className="flex h-screen overflow-hidden bg-white">
      {/* Mobile sidebar toggle */}
      <button
        className="md:hidden fixed top-3 left-3 z-50 p-2 bg-stone-900 text-white rounded-md"
        onClick={() => setSidebarOpen((s) => !s)}
      >
        {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
      </button>

      <PanelGroup direction="horizontal" className="flex-1">
        {/* Sidebar */}
        <Panel
          defaultSize={20}
          minSize={14}
          maxSize={30}
          className={`${sidebarOpen ? 'block' : 'hidden md:block'} transition-all`}
        >
          <div className="flex flex-col h-full">
            {/* Back to projects */}
            <a
              href="/"
              className="flex items-center gap-1.5 px-4 py-2.5 text-[11px] text-stone-500 bg-stone-800 hover:bg-stone-700 transition-colors"
            >
              <ArrowLeft className="w-3 h-3" />
              All Projects
            </a>
            <div className="flex-1 overflow-hidden">
              <ProjectSidebar
                projectId={projectId}
                projectTitle={project.title}
                acts={acts}
                selectedSceneId={selectedSceneId}
                onSelectScene={selectScene}
                onStructureChange={loadStructure}
              />
            </div>
          </div>
        </Panel>

        <PanelResizeHandle className="w-px bg-stone-200 hover:bg-stone-300 transition-colors cursor-col-resize" />

        {/* Editor */}
        <Panel defaultSize={55} minSize={30}>
          <div className="flex flex-col h-full bg-white overflow-hidden">
            {selectedSceneId ? (
              <SceneEditor
                  projectId={projectId}
                  sceneId={selectedSceneId}
                  insertRequest={insertRequest}
                  onInsertConsumed={() => setInsertRequest(null)}
                />
            ) : (
              <EmptyEditor projectId={projectId} acts={acts} onStructureChange={loadStructure} />
            )}
          </div>
        </Panel>

        <PanelResizeHandle className="w-px bg-stone-200 hover:bg-stone-300 transition-colors cursor-col-resize" />

        {/* Context panel */}
        <Panel defaultSize={25} minSize={18} maxSize={40}>
          <div className="h-full overflow-hidden">
            <ContextPanel projectId={projectId} sceneId={selectedSceneId} onInsertContent={setInsertRequest} />
          </div>
        </Panel>
      </PanelGroup>
    </div>
  );
}

function EmptyEditor({
  projectId,
  acts,
  onStructureChange,
}: {
  projectId: string;
  acts: ActWithChapters[];
  onStructureChange: () => void;
}) {
  async function createFirstAct() {
    const res = await fetch(`/api/projects/${projectId}/structure`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'act', title: 'Act 1' }),
    });
    if (res.ok) onStructureChange();
  }

  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-8 text-stone-400">
      {acts.length === 0 ? (
        <>
          <div className="w-16 h-16 rounded-2xl bg-stone-50 border-2 border-dashed border-stone-200 flex items-center justify-center mb-4">
            <span className="text-2xl">✍️</span>
          </div>
          <h3 className="text-sm font-medium text-stone-600 mb-1">Start your story</h3>
          <p className="text-xs text-stone-400 mb-4 max-w-xs">
            Create your first act, then add chapters and scenes to begin writing.
          </p>
          <button
            onClick={createFirstAct}
            className="px-4 py-2 bg-stone-900 text-white text-xs rounded-lg hover:bg-stone-700 transition-colors"
          >
            Create Act 1
          </button>
        </>
      ) : (
        <>
          <p className="text-sm text-stone-400">Select a scene from the sidebar to start writing.</p>
        </>
      )}
    </div>
  );
}
