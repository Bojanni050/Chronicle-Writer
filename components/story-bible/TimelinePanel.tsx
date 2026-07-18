'use client';

import { useState } from 'react';
import { TimelineEvent } from '@/lib/types';
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
import { Plus, Pencil, Trash2, Clock } from 'lucide-react';

interface TimelinePanelProps {
  projectId: string;
  events: TimelineEvent[];
  onRefresh: () => void;
}

function EventForm({
  projectId,
  initial,
  onDone,
}: {
  projectId: string;
  initial?: TimelineEvent;
  onDone: () => void;
}) {
  const [label, setLabel] = useState(initial?.label ?? '');
  const [dateText, setDateText] = useState(initial?.event_date_text ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!label.trim()) { setError('Label is required.'); return; }
    setSaving(true);
    const url = initial
      ? `/api/projects/${projectId}/timeline/${initial.id}`
      : `/api/projects/${projectId}/timeline`;
    const method = initial ? 'PATCH' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label, event_date_text: dateText, description }),
    });
    setSaving(false);
    if (res.ok) onDone();
    else { const d = await res.json(); setError(d.error ?? 'Error'); }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-[10px] uppercase tracking-wider text-stone-500">Event Label *</Label>
          <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. The Great War" className="h-8 text-sm" />
        </div>
        <div className="space-y-1">
          <Label className="text-[10px] uppercase tracking-wider text-stone-500">Date / Period</Label>
          <Input value={dateText} onChange={(e) => setDateText(e.target.value)} placeholder="e.g. Year 432 A.E." className="h-8 text-sm" />
        </div>
      </div>
      <div className="space-y-1">
        <Label className="text-[10px] uppercase tracking-wider text-stone-500">Description</Label>
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What happened? Who was involved? Why does it matter?" rows={4} className="resize-none text-sm" />
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
      <div className="flex justify-end">
        <Button type="submit" size="sm" disabled={saving}>
          {saving ? 'Saving…' : initial ? 'Update' : 'Add Event'}
        </Button>
      </div>
    </form>
  );
}

export function TimelinePanel({ projectId, events, onRefresh }: TimelinePanelProps) {
  const [editId, setEditId] = useState<string | null>(null);
  const [newOpen, setNewOpen] = useState(false);

  async function handleDelete(id: string) {
    if (!confirm('Delete this event?')) return;
    await fetch(`/api/projects/${projectId}/timeline/${id}`, { method: 'DELETE' });
    onRefresh();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-stone-700">Timeline <span className="text-stone-400 font-normal">({events.length})</span></h2>
        <Dialog open={newOpen} onOpenChange={setNewOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="h-7 text-xs gap-1">
              <Plus className="w-3 h-3" /> Add Event
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader><DialogTitle>New Timeline Event</DialogTitle></DialogHeader>
            <EventForm projectId={projectId} onDone={() => { setNewOpen(false); onRefresh(); }} />
          </DialogContent>
        </Dialog>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-12 text-stone-400">
          <Clock className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No timeline events yet.</p>
        </div>
      ) : (
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-[7px] top-2 bottom-2 w-px bg-stone-200" />
          <div className="space-y-0">
            {events.map((event, idx) => (
              <div key={event.id} className="group relative flex gap-4 pb-6">
                {/* Dot */}
                <div className={`relative z-10 w-3.5 h-3.5 rounded-full border-2 border-white flex-shrink-0 mt-1 ${idx === 0 ? 'bg-stone-800' : 'bg-stone-300'}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-semibold text-stone-800">{event.label}</h3>
                      {event.event_date_text && (
                        <p className="text-[11px] text-stone-400 mt-0.5">{event.event_date_text}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                      <Dialog open={editId === event.id} onOpenChange={(o) => setEditId(o ? event.id : null)}>
                        <DialogTrigger asChild>
                          <button className="p-1 text-stone-400 hover:text-stone-600 transition-colors">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-lg">
                          <DialogHeader><DialogTitle>Edit Event</DialogTitle></DialogHeader>
                          <EventForm projectId={projectId} initial={event} onDone={() => { setEditId(null); onRefresh(); }} />
                        </DialogContent>
                      </Dialog>
                      <button className="p-1 text-stone-400 hover:text-red-500 transition-colors" onClick={() => handleDelete(event.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  {event.description && (
                    <p className="text-xs text-stone-500 mt-1.5 leading-relaxed">{event.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
