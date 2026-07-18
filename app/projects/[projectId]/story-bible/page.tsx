'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Character, Location, WorldbuildingNote, TimelineEvent } from '@/lib/types';
import { CharacterPanel } from '@/components/story-bible/CharacterPanel';
import { LocationPanel } from '@/components/story-bible/LocationPanel';
import { WorldbuildingPanel } from '@/components/story-bible/WorldbuildingPanel';
import { TimelinePanel } from '@/components/story-bible/TimelinePanel';
import { StyleGuidePanel } from '@/components/story-bible/StyleGuidePanel';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookMarked, User, MapPin, Globe, Clock, Feather, ArrowLeft } from 'lucide-react';

export default function StoryBiblePage() {
  const params = useParams();
  const projectId = params.projectId as string;

  const [projectTitle, setProjectTitle] = useState('');
  const [characters, setCharacters] = useState<Character[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [notes, setNotes] = useState<WorldbuildingNote[]>([]);
  const [events, setEvents] = useState<TimelineEvent[]>([]);

  const loadAll = useCallback(async () => {
    const [projRes, charsRes, locsRes, notesRes, eventsRes] = await Promise.all([
      fetch(`/api/projects/${projectId}`),
      fetch(`/api/projects/${projectId}/characters`),
      fetch(`/api/projects/${projectId}/locations`),
      fetch(`/api/projects/${projectId}/worldbuilding`),
      fetch(`/api/projects/${projectId}/timeline`),
    ]);
    if (projRes.ok) { const p = await projRes.json(); setProjectTitle(p.title); }
    if (charsRes.ok) setCharacters(await charsRes.json());
    if (locsRes.ok) setLocations(await locsRes.json());
    if (notesRes.ok) setNotes(await notesRes.json());
    if (eventsRes.ok) setEvents(await eventsRes.json());
  }, [projectId]);

  useEffect(() => { loadAll(); }, [loadAll]);

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <header className="bg-white border-b border-stone-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center gap-3">
            <a
              href={`/projects/${projectId}`}
              className="flex items-center gap-1.5 text-xs text-stone-400 hover:text-stone-600 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Cockpit
            </a>
            <span className="text-stone-200">|</span>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-stone-900 rounded flex items-center justify-center">
                <BookMarked className="w-3 h-3 text-amber-400" />
              </div>
              <span className="text-sm font-semibold text-stone-900">{projectTitle}</span>
              <span className="text-stone-300">—</span>
              <span className="text-sm text-stone-500">Story Bible</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <Tabs defaultValue="characters">
          <TabsList className="mb-8 h-10 gap-1 bg-stone-100 p-1">
            <TabsTrigger value="characters" className="h-8 text-xs gap-1.5 data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <User className="w-3.5 h-3.5" />
              Characters
              {characters.length > 0 && <CountBadge count={characters.length} />}
            </TabsTrigger>
            <TabsTrigger value="locations" className="h-8 text-xs gap-1.5 data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <MapPin className="w-3.5 h-3.5" />
              Locations
              {locations.length > 0 && <CountBadge count={locations.length} />}
            </TabsTrigger>
            <TabsTrigger value="lore" className="h-8 text-xs gap-1.5 data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <Globe className="w-3.5 h-3.5" />
              Lore
              {notes.length > 0 && <CountBadge count={notes.length} />}
            </TabsTrigger>
            <TabsTrigger value="timeline" className="h-8 text-xs gap-1.5 data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <Clock className="w-3.5 h-3.5" />
              Timeline
              {events.length > 0 && <CountBadge count={events.length} />}
            </TabsTrigger>
            <TabsTrigger value="style" className="h-8 text-xs gap-1.5 data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <Feather className="w-3.5 h-3.5" />
              Style Guide
            </TabsTrigger>
          </TabsList>

          <TabsContent value="characters">
            <CharacterPanel projectId={projectId} characters={characters} onRefresh={loadAll} />
          </TabsContent>
          <TabsContent value="locations">
            <LocationPanel projectId={projectId} locations={locations} onRefresh={loadAll} />
          </TabsContent>
          <TabsContent value="lore">
            <WorldbuildingPanel projectId={projectId} notes={notes} onRefresh={loadAll} />
          </TabsContent>
          <TabsContent value="timeline">
            <TimelinePanel projectId={projectId} events={events} onRefresh={loadAll} />
          </TabsContent>
          <TabsContent value="style">
            <StyleGuidePanel projectId={projectId} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function CountBadge({ count }: { count: number }) {
  return (
    <span className="text-[10px] bg-stone-200 text-stone-500 rounded-full px-1.5 py-0.5 font-normal">
      {count}
    </span>
  );
}
