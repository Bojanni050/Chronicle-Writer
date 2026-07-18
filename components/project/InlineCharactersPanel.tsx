'use client';

import { useCallback, useEffect, useState } from 'react';
import { Character } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ChevronDown, ChevronUp, Plus, Trash2, Pencil, User } from 'lucide-react';
import { CharacterPhotos } from '@/components/project/CharacterPhotos';

interface InlineCharactersPanelProps {
  projectId: string;
}

function CharRow({
  char,
  projectId,
  onUpdated,
  onDeleted,
}: {
  char: Character;
  projectId: string;
  onUpdated: (c: Character) => void;
  onDeleted: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(char.name);
  const [role, setRole] = useState(char.role);
  const [description, setDescription] = useState(char.description);
  const [voiceNotes, setVoiceNotes] = useState(char.voice_notes);
  const [goals, setGoals] = useState(char.goals);
  const [secrets, setSecrets] = useState(char.secrets);
  const [photos, setPhotos] = useState<string[]>(char.photos ?? []);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    const res = await fetch(`/api/projects/${projectId}/characters/${char.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, role, description, voice_notes: voiceNotes, goals, secrets }),
    });
    setSaving(false);
    if (res.ok) { onUpdated(await res.json()); setEditing(false); }
  }

  async function del() {
    if (!confirm(`Delete character "${char.name}"?`)) return;
    await fetch(`/api/projects/${projectId}/characters/${char.id}`, { method: 'DELETE' });
    onDeleted(char.id);
  }

  return (
    <div className="border-b border-stone-100 last:border-0">
      <div
        className="flex items-center gap-2 px-3 py-2 hover:bg-stone-50 cursor-pointer transition-colors"
        onClick={() => !editing && setExpanded((e) => !e)}
      >
        <div className="w-6 h-6 rounded-full bg-stone-200 flex items-center justify-center flex-shrink-0 overflow-hidden">
          {photos.length > 0
            ? <img src={photos[0]} alt="" className="w-full h-full object-cover" />
            : <User className="w-3 h-3 text-stone-500" />
          }
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-stone-700 truncate">{char.name}</p>
          {char.role && <p className="text-[10px] text-stone-400">{char.role}</p>}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); setEditing(true); setExpanded(true); }}
            className="p-1 text-stone-400 hover:text-stone-600 transition-colors"
          >
            <Pencil className="w-3 h-3" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); del(); }}
            className="p-1 text-stone-400 hover:text-red-500 transition-colors"
          >
            <Trash2 className="w-3 h-3" />
          </button>
          {expanded
            ? <ChevronUp className="w-3 h-3 text-stone-400" />
            : <ChevronDown className="w-3 h-3 text-stone-400" />}
        </div>
      </div>

      {expanded && (
        <div className="px-3 pb-3 bg-white">
          {editing ? (
            <div className="space-y-2 pt-1">
              <div className="grid grid-cols-2 gap-2">
                <Field label="Name">
                  <Input value={name} onChange={(e) => setName(e.target.value)} className="h-7 text-xs" />
                </Field>
                <Field label="Role">
                  <Input value={role} onChange={(e) => setRole(e.target.value)} className="h-7 text-xs" placeholder="Protagonist…" />
                </Field>
              </div>
              <Field label="Description">
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="text-xs resize-none" />
              </Field>
              <Field label="Voice Notes">
                <Textarea value={voiceNotes} onChange={(e) => setVoiceNotes(e.target.value)} rows={2} className="text-xs resize-none" placeholder="How they speak…" />
              </Field>
              <div className="grid grid-cols-2 gap-2">
                <Field label="Goals">
                  <Textarea value={goals} onChange={(e) => setGoals(e.target.value)} rows={2} className="text-xs resize-none" />
                </Field>
                <Field label="Secrets">
                  <Textarea value={secrets} onChange={(e) => setSecrets(e.target.value)} rows={2} className="text-xs resize-none" />
                </Field>
              </div>
              <Field label={`Photos (${photos.length}/${5})`}>
                <CharacterPhotos
                  projectId={projectId}
                  characterId={char.id}
                  photos={photos}
                  onPhotosChange={setPhotos}
                  compact
                />
              </Field>
              <div className="flex gap-2 pt-1">
                <Button size="sm" className="h-6 text-xs" onClick={save} disabled={saving}>
                  {saving ? 'Saving…' : 'Save'}
                </Button>
                <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => setEditing(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-1.5 pt-2 text-xs text-stone-500">
              {photos.length > 0 && (
                <CharacterPhotos
                  projectId={projectId}
                  characterId={char.id}
                  photos={photos}
                  onPhotosChange={setPhotos}
                  compact
                />
              )}
              {char.description && <p className="leading-relaxed">{char.description}</p>}
              {char.goals && (
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">Goals: </span>
                  {char.goals}
                </div>
              )}
              {char.voice_notes && (
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">Voice: </span>
                  {char.voice_notes}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AddCharacterForm({
  projectId,
  onAdded,
  onCancel,
}: {
  projectId: string;
  onAdded: (c: Character) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError('Name required'); return; }
    setSaving(true);
    const res = await fetch(`/api/projects/${projectId}/characters`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim(), role, description }),
    });
    setSaving(false);
    if (res.ok) { onAdded(await res.json()); }
    else setError('Failed to create');
  }

  return (
    <form onSubmit={submit} className="px-3 py-3 bg-stone-50 border-t border-stone-200 space-y-2">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-500">New Character</p>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Name *">
          <Input value={name} onChange={(e) => setName(e.target.value)} className="h-7 text-xs" autoFocus />
        </Field>
        <Field label="Role">
          <Input value={role} onChange={(e) => setRole(e.target.value)} className="h-7 text-xs" placeholder="e.g. Protagonist" />
        </Field>
      </div>
      <Field label="Description">
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="text-xs resize-none" />
      </Field>
      {error && <p className="text-xs text-red-500">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit" size="sm" className="h-6 text-xs" disabled={saving}>
          {saving ? 'Adding…' : 'Add'}
        </Button>
        <Button type="button" size="sm" variant="ghost" className="h-6 text-xs" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

export function InlineCharactersPanel({ projectId }: InlineCharactersPanelProps) {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/projects/${projectId}/characters`);
    if (res.ok) setCharacters(await res.json());
    setLoading(false);
  }, [projectId]);

  useEffect(() => { load(); }, [load]);

  function onUpdated(updated: Character) {
    setCharacters((cs) => cs.map((c) => (c.id === updated.id ? updated : c)));
  }

  function onDeleted(id: string) {
    setCharacters((cs) => cs.filter((c) => c.id !== id));
  }

  function onAdded(c: Character) {
    setCharacters((cs) => [...cs, c]);
    setAdding(false);
  }

  if (loading) return <div className="p-4 text-xs text-stone-400">Loading…</div>;

  return (
    <div>
      <div className="flex items-center justify-between px-3 py-2 border-b border-stone-100">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-stone-500">
          Characters {characters.length > 0 && `(${characters.length})`}
        </span>
        {!adding && (
          <button
            onClick={() => setAdding(true)}
            className="flex items-center gap-1 text-[11px] text-stone-500 hover:text-stone-700 transition-colors"
          >
            <Plus className="w-3 h-3" /> Add
          </button>
        )}
      </div>

      {characters.length === 0 && !adding && (
        <div className="px-3 py-6 text-center">
          <User className="w-6 h-6 text-stone-200 mx-auto mb-1.5" />
          <p className="text-xs text-stone-400">No characters yet.</p>
          <button
            onClick={() => setAdding(true)}
            className="mt-2 text-xs text-blue-500 hover:underline"
          >
            Add your first character
          </button>
        </div>
      )}

      {characters.map((c) => (
        <CharRow key={c.id} char={c} projectId={projectId} onUpdated={onUpdated} onDeleted={onDeleted} />
      ))}

      {adding && (
        <AddCharacterForm projectId={projectId} onAdded={onAdded} onCancel={() => setAdding(false)} />
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-0.5">
      <Label className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">{label}</Label>
      {children}
    </div>
  );
}
