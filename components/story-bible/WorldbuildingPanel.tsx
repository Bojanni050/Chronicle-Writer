'use client';

import { useState } from 'react';
import { WorldbuildingNote } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Globe } from 'lucide-react';

const CATEGORIES = ['general', 'magic', 'religion', 'politics', 'history', 'geography', 'culture', 'technology', 'economy', 'language'];

const CATEGORY_COLORS: Record<string, string> = {
  magic: 'bg-violet-100 text-violet-700',
  religion: 'bg-amber-100 text-amber-700',
  politics: 'bg-blue-100 text-blue-700',
  history: 'bg-stone-100 text-stone-600',
  geography: 'bg-emerald-100 text-emerald-700',
  culture: 'bg-pink-100 text-pink-700',
  technology: 'bg-sky-100 text-sky-700',
  economy: 'bg-yellow-100 text-yellow-700',
  language: 'bg-indigo-100 text-indigo-700',
  general: 'bg-stone-100 text-stone-600',
};

interface WorldbuildingPanelProps {
  projectId: string;
  notes: WorldbuildingNote[];
  onRefresh: () => void;
}

function NoteForm({
  projectId,
  initial,
  onDone,
}: {
  projectId: string;
  initial?: WorldbuildingNote;
  onDone: () => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [category, setCategory] = useState(initial?.category ?? 'general');
  const [content, setContent] = useState(initial?.content_md ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { setError('Title is required.'); return; }
    setSaving(true);
    const url = initial
      ? `/api/projects/${projectId}/worldbuilding/${initial.id}`
      : `/api/projects/${projectId}/worldbuilding`;
    const method = initial ? 'PATCH' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, category, content_md: content }),
    });
    setSaving(false);
    if (res.ok) onDone();
    else { const d = await res.json(); setError(d.error ?? 'Error'); }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-[10px] uppercase tracking-wider text-stone-500">Title *</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Note title" className="h-8 text-sm" />
        </div>
        <div className="space-y-1">
          <Label className="text-[10px] uppercase tracking-wider text-stone-500">Category</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-1">
        <Label className="text-[10px] uppercase tracking-wider text-stone-500">Content</Label>
        <Textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Write your worldbuilding notes here…" rows={6} className="resize-none text-sm font-['Georgia',serif]" />
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
      <div className="flex justify-end">
        <Button type="submit" size="sm" disabled={saving}>
          {saving ? 'Saving…' : initial ? 'Update' : 'Add Note'}
        </Button>
      </div>
    </form>
  );
}

export function WorldbuildingPanel({ projectId, notes, onRefresh }: WorldbuildingPanelProps) {
  const [editId, setEditId] = useState<string | null>(null);
  const [newOpen, setNewOpen] = useState(false);
  const [filterCategory, setFilterCategory] = useState('all');

  const filtered = filterCategory === 'all' ? notes : notes.filter((n) => n.category === filterCategory);

  async function handleDelete(id: string) {
    if (!confirm('Delete this note?')) return;
    await fetch(`/api/projects/${projectId}/worldbuilding/${id}`, { method: 'DELETE' });
    onRefresh();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-stone-700">Lore <span className="text-stone-400 font-normal">({notes.length})</span></h2>
        <div className="flex items-center gap-2">
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="h-7 text-xs w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {CATEGORIES.map((c) => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Dialog open={newOpen} onOpenChange={setNewOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="h-7 text-xs gap-1">
                <Plus className="w-3 h-3" /> Add Note
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader><DialogTitle>New Worldbuilding Note</DialogTitle></DialogHeader>
              <NoteForm projectId={projectId} onDone={() => { setNewOpen(false); onRefresh(); }} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-stone-400">
          <Globe className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No lore notes yet.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((note) => (
            <div key={note.id} className="border border-stone-200 rounded-xl p-4 bg-white hover:border-stone-300 transition-colors">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-stone-800 truncate">{note.title}</h3>
                  <Badge className={`text-[10px] mt-1 capitalize ${CATEGORY_COLORS[note.category] ?? CATEGORY_COLORS.general} border-0`}>
                    {note.category}
                  </Badge>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Dialog open={editId === note.id} onOpenChange={(o) => setEditId(o ? note.id : null)}>
                    <DialogTrigger asChild>
                      <button className="p-1 text-stone-400 hover:text-stone-600 transition-colors">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-lg">
                      <DialogHeader><DialogTitle>Edit Note</DialogTitle></DialogHeader>
                      <NoteForm projectId={projectId} initial={note} onDone={() => { setEditId(null); onRefresh(); }} />
                    </DialogContent>
                  </Dialog>
                  <button className="p-1 text-stone-400 hover:text-red-500 transition-colors" onClick={() => handleDelete(note.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              {note.content_md && (
                <p className="text-xs text-stone-500 line-clamp-4 leading-relaxed">{note.content_md}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
