'use client';

import { useState } from 'react';
import { Character } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, User } from 'lucide-react';
import { CharacterPhotos } from '@/components/project/CharacterPhotos';

interface CharacterPanelProps {
  projectId: string;
  characters: Character[];
  onRefresh: () => void;
}

function CharacterForm({
  projectId,
  initial,
  onDone,
}: {
  projectId: string;
  initial?: Character;
  onDone: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [role, setRole] = useState(initial?.role ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [voiceNotes, setVoiceNotes] = useState(initial?.voice_notes ?? '');
  const [secrets, setSecrets] = useState(initial?.secrets ?? '');
  const [goals, setGoals] = useState(initial?.goals ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError('Name is required.'); return; }
    setSaving(true);
    const url = initial
      ? `/api/projects/${projectId}/characters/${initial.id}`
      : `/api/projects/${projectId}/characters`;
    const method = initial ? 'PATCH' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, role, description, voice_notes: voiceNotes, secrets, goals }),
    });
    setSaving(false);
    if (res.ok) onDone();
    else { const d = await res.json(); setError(d.error ?? 'Error'); }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-[10px] uppercase tracking-wider text-stone-500">Name *</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Character name" className="h-8 text-sm" />
        </div>
        <div className="space-y-1">
          <Label className="text-[10px] uppercase tracking-wider text-stone-500">Role</Label>
          <Input value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g. Protagonist" className="h-8 text-sm" />
        </div>
      </div>
      <div className="space-y-1">
        <Label className="text-[10px] uppercase tracking-wider text-stone-500">Description</Label>
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Appearance, personality, background…" rows={2} className="resize-none text-sm" />
      </div>
      <div className="space-y-1">
        <Label className="text-[10px] uppercase tracking-wider text-stone-500">Voice Notes</Label>
        <Textarea value={voiceNotes} onChange={(e) => setVoiceNotes(e.target.value)} placeholder="How they speak, vocabulary, cadence…" rows={2} className="resize-none text-sm" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-[10px] uppercase tracking-wider text-stone-500">Secrets</Label>
          <Textarea value={secrets} onChange={(e) => setSecrets(e.target.value)} placeholder="Hidden motivations…" rows={2} className="resize-none text-sm" />
        </div>
        <div className="space-y-1">
          <Label className="text-[10px] uppercase tracking-wider text-stone-500">Goals</Label>
          <Textarea value={goals} onChange={(e) => setGoals(e.target.value)} placeholder="What do they want?" rows={2} className="resize-none text-sm" />
        </div>
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
      <div className="flex justify-end gap-2">
        <Button type="submit" size="sm" disabled={saving}>
          {saving ? 'Saving…' : initial ? 'Update' : 'Add Character'}
        </Button>
      </div>
    </form>
  );
}

export function CharacterPanel({ projectId, characters, onRefresh }: CharacterPanelProps) {
  const [editId, setEditId] = useState<string | null>(null);
  const [newOpen, setNewOpen] = useState(false);
  const [localPhotos, setLocalPhotos] = useState<Record<string, string[]>>({});

  function photosFor(c: Character): string[] {
    return localPhotos[c.id] ?? c.photos ?? [];
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this character?')) return;
    await fetch(`/api/projects/${projectId}/characters/${id}`, { method: 'DELETE' });
    onRefresh();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-stone-700">Characters <span className="text-stone-400 font-normal">({characters.length})</span></h2>
        <Dialog open={newOpen} onOpenChange={setNewOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="h-7 text-xs gap-1">
              <Plus className="w-3 h-3" /> Add Character
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader><DialogTitle>New Character</DialogTitle></DialogHeader>
            <CharacterForm projectId={projectId} onDone={() => { setNewOpen(false); onRefresh(); }} />
          </DialogContent>
        </Dialog>
      </div>

      {characters.length === 0 ? (
        <div className="text-center py-12 text-stone-400">
          <User className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No characters yet.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {characters.map((c) => (
        <div key={c.id} className="border border-stone-200 rounded-xl p-4 bg-white hover:border-stone-300 transition-colors">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {photosFor(c).length > 0 ? (
                    <img
                      src={photosFor(c)[0]}
                      alt={c.name}
                      className="w-9 h-9 rounded-full object-cover flex-shrink-0 border border-stone-200 cursor-pointer"
                      onClick={() => setEditId(c.id)}
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-stone-100 flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-stone-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-stone-800 truncate">{c.name}</h3>
                    {c.role && <Badge variant="secondary" className="text-[10px] mt-0.5">{c.role}</Badge>}
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Dialog open={editId === c.id} onOpenChange={(o) => setEditId(o ? c.id : null)}>
                    <DialogTrigger asChild>
                      <button className="p-1 text-stone-400 hover:text-stone-600 transition-colors">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-lg">
                      <DialogHeader><DialogTitle>Edit Character</DialogTitle></DialogHeader>
                      <CharacterForm projectId={projectId} initial={c} onDone={() => { setEditId(null); onRefresh(); }} />
                    </DialogContent>
                  </Dialog>
                  <button className="p-1 text-stone-400 hover:text-red-500 transition-colors" onClick={() => handleDelete(c.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <CharacterPhotos
                projectId={projectId}
                characterId={c.id}
                photos={photosFor(c)}
                onPhotosChange={(p) => setLocalPhotos((prev) => ({ ...prev, [c.id]: p }))}
              />

              {c.description && (
                <p className="text-xs text-stone-500 mt-3 line-clamp-3">{c.description}</p>
              )}
              <div className="flex gap-2 mt-3 flex-wrap">
                {c.goals && <InfoChip label="Goals" value={c.goals} />}
                {c.secrets && <InfoChip label="Secrets" value={c.secrets} />}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function InfoChip({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-[10px] text-stone-500 bg-stone-50 border border-stone-100 rounded-full px-2 py-0.5">
      <span className="font-semibold text-stone-400">{label}:</span>
      <span className="truncate max-w-[80px]">{value}</span>
    </span>
  );
}
