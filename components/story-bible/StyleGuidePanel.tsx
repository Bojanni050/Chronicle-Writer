'use client';

import { useState, useEffect } from 'react';
import { StyleGuide } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { CheckCircle2, Feather } from 'lucide-react';

interface StyleGuidePanelProps {
  projectId: string;
}

export function StyleGuidePanel({ projectId }: StyleGuidePanelProps) {
  const [guide, setGuide] = useState<StyleGuide | null>(null);
  const [tone, setTone] = useState('');
  const [dos, setDos] = useState('');
  const [donts, setDonts] = useState('');
  const [referenceText, setReferenceText] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch(`/api/projects/${projectId}/style-guide`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) {
          setGuide(data);
          setTone(data.tone);
          setDos(data.dos);
          setDonts(data.donts);
          setReferenceText(data.reference_text);
        }
      });
  }, [projectId]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch(`/api/projects/${projectId}/style-guide`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tone, dos, donts, reference_text: referenceText }),
    });
    setSaving(false);
    if (res.ok) {
      const updated = await res.json();
      setGuide(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-sm font-semibold text-stone-700">Style Guide</h2>
        {saved && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
      </div>

      <div className="bg-stone-50 border border-stone-200 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <Feather className="w-4 h-4 text-stone-400 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-stone-500 leading-relaxed">
            The style guide defines your novel's voice and writing rules. It will be included in AI context to ensure consistent tone and style across all AI-assisted scenes.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold uppercase tracking-wider text-stone-500">Overall Tone</Label>
          <Input
            value={tone}
            onChange={(e) => setTone(e.target.value)}
            placeholder="e.g. Dark and literary, with dry wit. Think Donna Tartt meets McCarthy."
            className="text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
              Do's
            </Label>
            <Textarea
              value={dos}
              onChange={(e) => setDos(e.target.value)}
              placeholder="- Use present tense for action&#10;- Concrete sensory details&#10;- Short punchy paragraphs"
              rows={6}
              className="resize-none text-sm font-mono"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wider text-red-500">
              Don'ts
            </Label>
            <Textarea
              value={donts}
              onChange={(e) => setDonts(e.target.value)}
              placeholder="- Avoid adverbs&#10;- No passive voice&#10;- No dream sequences"
              rows={6}
              className="resize-none text-sm font-mono"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold uppercase tracking-wider text-stone-500">
            Reference Text
          </Label>
          <p className="text-[11px] text-stone-400">Paste a sample passage that exemplifies the desired prose style.</p>
          <Textarea
            value={referenceText}
            onChange={(e) => setReferenceText(e.target.value)}
            placeholder="Paste a reference passage here…"
            rows={6}
            className="resize-none text-sm font-['Georgia',serif] leading-relaxed"
          />
        </div>

        <Button type="submit" disabled={saving} className="w-full sm:w-auto">
          {saving ? 'Saving…' : 'Save Style Guide'}
        </Button>
      </form>
    </div>
  );
}
