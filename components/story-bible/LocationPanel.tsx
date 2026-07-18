'use client';

import { useState } from 'react';
import { Location } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, MapPin } from 'lucide-react';

interface LocationPanelProps {
  projectId: string;
  locations: Location[];
  onRefresh: () => void;
}

function LocationForm({
  projectId,
  initial,
  onDone,
}: {
  projectId: string;
  initial?: Location;
  onDone: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [rules, setRules] = useState(initial?.rules ?? '');
  const [sensoryNotes, setSensoryNotes] = useState(initial?.sensory_notes ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError('Name is required.'); return; }
    setSaving(true);
    const url = initial
      ? `/api/projects/${projectId}/locations/${initial.id}`
      : `/api/projects/${projectId}/locations`;
    const method = initial ? 'PATCH' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description, rules, sensory_notes: sensoryNotes }),
    });
    setSaving(false);
    if (res.ok) onDone();
    else { const d = await res.json(); setError(d.error ?? 'Error'); }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="space-y-1">
        <Label className="text-[10px] uppercase tracking-wider text-stone-500">Name *</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Location name" className="h-8 text-sm" />
      </div>
      <div className="space-y-1">
        <Label className="text-[10px] uppercase tracking-wider text-stone-500">Description</Label>
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Physical description and atmosphere…" rows={3} className="resize-none text-sm" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-[10px] uppercase tracking-wider text-stone-500">Rules / Constraints</Label>
          <Textarea value={rules} onChange={(e) => setRules(e.target.value)} placeholder="Physical or magical rules…" rows={2} className="resize-none text-sm" />
        </div>
        <div className="space-y-1">
          <Label className="text-[10px] uppercase tracking-wider text-stone-500">Sensory Notes</Label>
          <Textarea value={sensoryNotes} onChange={(e) => setSensoryNotes(e.target.value)} placeholder="Sights, sounds, smells…" rows={2} className="resize-none text-sm" />
        </div>
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
      <div className="flex justify-end gap-2">
        <Button type="submit" size="sm" disabled={saving}>
          {saving ? 'Saving…' : initial ? 'Update' : 'Add Location'}
        </Button>
      </div>
    </form>
  );
}

export function LocationPanel({ projectId, locations, onRefresh }: LocationPanelProps) {
  const [editId, setEditId] = useState<string | null>(null);
  const [newOpen, setNewOpen] = useState(false);

  async function handleDelete(id: string) {
    if (!confirm('Delete this location?')) return;
    await fetch(`/api/projects/${projectId}/locations/${id}`, { method: 'DELETE' });
    onRefresh();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-stone-700">Locations <span className="text-stone-400 font-normal">({locations.length})</span></h2>
        <Dialog open={newOpen} onOpenChange={setNewOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="h-7 text-xs gap-1">
              <Plus className="w-3 h-3" /> Add Location
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader><DialogTitle>New Location</DialogTitle></DialogHeader>
            <LocationForm projectId={projectId} onDone={() => { setNewOpen(false); onRefresh(); }} />
          </DialogContent>
        </Dialog>
      </div>

      {locations.length === 0 ? (
        <div className="text-center py-12 text-stone-400">
          <MapPin className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No locations yet.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {locations.map((loc) => (
            <div key={loc.id} className="border border-stone-200 rounded-xl p-4 bg-white hover:border-stone-300 transition-colors">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-sm font-semibold text-stone-800 truncate">{loc.name}</h3>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Dialog open={editId === loc.id} onOpenChange={(o) => setEditId(o ? loc.id : null)}>
                    <DialogTrigger asChild>
                      <button className="p-1 text-stone-400 hover:text-stone-600 transition-colors">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-lg">
                      <DialogHeader><DialogTitle>Edit Location</DialogTitle></DialogHeader>
                      <LocationForm projectId={projectId} initial={loc} onDone={() => { setEditId(null); onRefresh(); }} />
                    </DialogContent>
                  </Dialog>
                  <button className="p-1 text-stone-400 hover:text-red-500 transition-colors" onClick={() => handleDelete(loc.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              {loc.description && (
                <p className="text-xs text-stone-500 mt-2 line-clamp-3">{loc.description}</p>
              )}
              {loc.sensory_notes && (
                <p className="text-[11px] text-stone-400 mt-2 italic line-clamp-2">{loc.sensory_notes}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
