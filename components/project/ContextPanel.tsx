'use client';

import { useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { User, MapPin, Layers, Wand2 } from 'lucide-react';
import { InlineCharactersPanel } from './InlineCharactersPanel';
import { InlineLocationsPanel } from './InlineLocationsPanel';
import { ContextPackPanel } from './ContextPackPanel';
import { AiActionsPanel } from './AiActionsPanel';
import { Scene } from '@/lib/types';

interface ContextPanelProps {
  projectId: string;
  sceneId: string | null;
  onInsertContent?: (text: string) => void;
}

export function ContextPanel({ projectId, sceneId, onInsertContent }: ContextPanelProps) {
  const [scene, setScene] = useState<Scene | null>(null);

  useEffect(() => {
    if (!sceneId) { setScene(null); return; }
    fetch(`/api/projects/${projectId}/scenes/${sceneId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then(setScene);
  }, [projectId, sceneId]);

  return (
    <div className="flex flex-col h-full bg-stone-50 border-l border-stone-200">
      <Tabs defaultValue="characters" className="flex flex-col h-full">
        <div className="border-b border-stone-200 px-2 pt-2.5 flex-shrink-0">
          <TabsList className="h-7 gap-0 bg-transparent p-0 w-full grid grid-cols-4">
            <TabsTrigger
              value="characters"
              className="h-7 text-[11px] px-1 rounded-none border-b-2 border-transparent data-[state=active]:border-stone-700 data-[state=active]:bg-transparent data-[state=active]:text-stone-800 data-[state=active]:shadow-none text-stone-400 hover:text-stone-600 transition-colors"
            >
              <User className="w-3 h-3 mr-1" />
              People
            </TabsTrigger>
            <TabsTrigger
              value="locations"
              className="h-7 text-[11px] px-1 rounded-none border-b-2 border-transparent data-[state=active]:border-stone-700 data-[state=active]:bg-transparent data-[state=active]:text-stone-800 data-[state=active]:shadow-none text-stone-400 hover:text-stone-600 transition-colors"
            >
              <MapPin className="w-3 h-3 mr-1" />
              Places
            </TabsTrigger>
            <TabsTrigger
              value="context"
              className="h-7 text-[11px] px-1 rounded-none border-b-2 border-transparent data-[state=active]:border-stone-700 data-[state=active]:bg-transparent data-[state=active]:text-stone-800 data-[state=active]:shadow-none text-stone-400 hover:text-stone-600 transition-colors"
            >
              <Layers className="w-3 h-3 mr-1" />
              Context
            </TabsTrigger>
            <TabsTrigger
              value="ai"
              className="h-7 text-[11px] px-1 rounded-none border-b-2 border-transparent data-[state=active]:border-stone-700 data-[state=active]:bg-transparent data-[state=active]:text-stone-800 data-[state=active]:shadow-none text-stone-400 hover:text-stone-600 transition-colors"
            >
              <Wand2 className="w-3 h-3 mr-1" />
              AI
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="characters" className="flex-1 overflow-hidden mt-0 data-[state=inactive]:hidden">
          <ScrollArea className="h-full">
            <InlineCharactersPanel projectId={projectId} />
          </ScrollArea>
        </TabsContent>

        <TabsContent value="locations" className="flex-1 overflow-hidden mt-0 data-[state=inactive]:hidden">
          <ScrollArea className="h-full">
            <InlineLocationsPanel projectId={projectId} />
          </ScrollArea>
        </TabsContent>

        <TabsContent value="context" className="flex-1 overflow-hidden mt-0 data-[state=inactive]:hidden">
          <ScrollArea className="h-full">
            <ContextPackPanel projectId={projectId} sceneId={sceneId} />
          </ScrollArea>
        </TabsContent>

        <TabsContent value="ai" className="flex-1 overflow-hidden mt-0 data-[state=inactive]:hidden">
          <ScrollArea className="h-full">
            {sceneId ? (
              <AiActionsPanel projectId={projectId} sceneId={sceneId} scene={scene} onInsertContent={onInsertContent} />
            ) : (
              <div className="flex items-center justify-center h-32 text-xs text-stone-400">
                Select a scene to use AI actions.
              </div>
            )}
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
