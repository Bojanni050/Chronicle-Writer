'use client';

import { useCallback, useEffect, useState } from 'react';
import { Location } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ChevronDown, ChevronUp, Plus, Trash2, Pencil, MapPin } from 'lucide-react';

interface InlineLocationsPanelProps {
  projectId: string;
}

function LocRow({
  loc,
  projectId,
  onUpdated,
  onDeleted,
}: {
  loc: Location;
  projectId: string;
  onUpdated: (l: Location) => void;
  onDeleted: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(loc.name);
  const [description, setDescription] = useState(loc.description);
  const [rules, setRules] = useState(loc.rules);
  const [sensoryNotes, setSensoryNotes] = useState(loc.sensory_notes);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    const res = await fetch(`/api/projects/${projectId}/locations/${loc.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description, rules, sensory_notes: sensoryNotes }),
    });
    setSaving(false);
    if (res.ok) { onUpdated(await res.json()); setEditing(false); }
  }

  async function del() {
    if (!confirm(`Delete location "${loc.name}"?`)) return;
    await fetch(`/api/projects/${projectId}/locations/${loc.id}`, { method: 'DELETE' });
    onDeleted(loc.id);
  }

  return (
    <div className="border-b border-stone-100 last:border-0">
      <div
        className="flex items-center gap-2 px-3 py-2 hover:bg-stone-50 cursor-pointer transition-colors"
        onClick={() => !editing && setExpanded((e) => !e)}
      >
        <div className="w-6 h-6 rounded-full bg-stone-200 flex items-center justify-center flex-shrink-0">
          <MapPin className="w-3 h-3 text-stone-500" />
        </div>
        <p className="flex-1 text-xs font-medium text-stone-700 truncate">{loc.name}</p>
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); setEditing(true); setExpanded(true); }}
            className="p-1 text-stone-400 hover:text-stone-600"
          >
            <Pencil className="w-3 h-3" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); del(); }}
            className="p-1 text-stone-400 hover:text-red-500"
          >
            <Trash2 className="w-3 h-3" />
          </button>
          {expanded ? <ChevronUp className="w-3 h-3 text-stone-400" /> : <ChevronDown className="w-3 h-3 text-stone-400" />}
        </div>
      </div>

      {expanded && (
        <div className="px-3 pb-3 bg-white">
          {editing ? (
            <div className="space-y-2 pt-1">
              <Field label="Name">
                <Input value={name} onChange={(e) => setName(e.target.value)} className="h-7 text-xs" />
              </Field>
              <Field label="Description">
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="text-xs resize-none" />
              </Field>
              <div className="grid grid-cols-2 gap-2">
                <Field label="Rules / Constraints">
                  <Textarea value={rules} onChange={(e) => setRules(e.target.value)} rows={2} className="text-xs resize-none" />
                </Field>
                <Field label="Sensory Notes">
                  <Textarea value={sensoryNotes} onChange={(e) => setSensoryNotes(e.target.value)} rows={2} className="text-xs resize-none" />
                </Field>
              </div>
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
              {loc.description && <p className="leading-relaxed">{loc.description}</p>}
              {loc.sensory_notes && (
                <p className="italic text-stone-400">{loc.sensory_notes}</p>
              )}
              {loc.rules && (
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">Rules: </span>
                  {loc.rules}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AddLocationForm({
  projectId,
  onAdded,
  onCancel,
}: {
  projectId: string;
  onAdded: (l: Location) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError('Name required'); return; }
    setSaving(true);
    const res = await fetch(`/api/projects/${projectId}/locations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim(), description }),
    });
    setSaving(false);
    if (res.ok) onAdded(await res.json());
    else setError('Failed to create');
  }

  return (
    <form onSubmit={submit} className="px-3 py-3 bg-stone-50 border-t border-stone-200 space-y-2">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-500">New Location</p>
      <Field label="Name *">
        <Input value={name} onChange={(e) => setName(e.target.value)} className="h-7 text-xs" autoFocus />
      </Field>
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

export function InlineLocationsPanel({ projectId }: InlineLocationsPanelProps) {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/projects/${projectId}/locations`);
    if (res.ok) setLocations(await res.json());
    setLoading(false);
  }, [projectId]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="p-4 text-xs text-stone-400">Loading…</div>;

  return (
    <div>
      <div className="flex items-center justify-between px-3 py-2 border-b border-stone-100">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-stone-500">
          Locations {locations.length > 0 && `(${locations.length})`}
        </span>
        {!adding && (
          <button
            onClick={() => setAdding(true)}
            className="flex items-center gap-1 text-[11px] text-stone-500 hover:text-stone-700"
          >
            <Plus className="w-3 h-3" /> Add
          </button>
        )}
      </div>

      {locations.length === 0 && !adding && (
        <div className="px-3 py-6 text-center">
          <MapPin className="w-6 h-6 text-stone-200 mx-auto mb-1.5" />
          <p className="text-xs text-stone-400">No locations yet.</p>
          <button onClick={() => setAdding(true)} className="mt-2 text-xs text-blue-500 hover:underline">
            Add your first location
          </button>
        </div>
      )}

      {locations.map((l) => (
        <LocRow
          key={l.id}
          loc={l}
          projectId={projectId}
          onUpdated={(u) => setLocations((ls) => ls.map((x) => (x.id === u.id ? u : x)))}
          onDeleted={(id) => setLocations((ls) => ls.filter((x) => x.id !== id))}
        />
      ))}

      {adding && (
        <AddLocationForm
          projectId={projectId}
          onAdded={(l) => { setLocations((ls) => [...ls, l]); setAdding(false); }}
          onCancel={() => setAdding(false)}
        />
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
