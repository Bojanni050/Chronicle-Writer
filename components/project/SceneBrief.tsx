'use client';

import { useState } from 'react';
import { Scene } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { CheckCircle2 } from 'lucide-react';

interface SceneBriefProps {
  projectId: string;
  scene: Scene;
  onUpdate: (scene: Scene) => void;
}

export function SceneBrief({ projectId, scene, onUpdate }: SceneBriefProps) {
  const [pov, setPov] = useState(scene.pov);
  const [goal, setGoal] = useState(scene.goal);
  const [conflict, setConflict] = useState(scene.conflict);
  const [emotion, setEmotion] = useState(scene.emotion);
  const [summary, setSummary] = useState(scene.summary);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaving(true);
    const res = await fetch(`/api/projects/${projectId}/scenes/${scene.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pov, goal, conflict, emotion, summary }),
    });
    setSaving(false);
    if (res.ok) {
      const updated = await res.json();
      onUpdate(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  }

  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-500">Scene Brief</h3>
        {saved && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
      </div>

      <Field label="POV Character">
        <Input
          value={pov}
          onChange={(e) => setPov(e.target.value)}
          placeholder="e.g. Elena"
          className="h-7 text-xs"
        />
      </Field>

      <Field label="Scene Goal">
        <Input
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          placeholder="What does the POV character want?"
          className="h-7 text-xs"
        />
      </Field>

      <Field label="Conflict">
        <Input
          value={conflict}
          onChange={(e) => setConflict(e.target.value)}
          placeholder="What stands in the way?"
          className="h-7 text-xs"
        />
      </Field>

      <Field label="Emotion / Tone">
        <Input
          value={emotion}
          onChange={(e) => setEmotion(e.target.value)}
          placeholder="e.g. dread, hope, grief"
          className="h-7 text-xs"
        />
      </Field>

      <Field label="Summary">
        <Textarea
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          placeholder="One-paragraph scene summary…"
          className="text-xs resize-none min-h-[72px]"
          rows={3}
        />
      </Field>

      <Button
        size="sm"
        onClick={handleSave}
        disabled={saving}
        className="w-full h-7 text-xs mt-1"
      >
        {saving ? 'Saving…' : 'Save Brief'}
      </Button>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">{label}</Label>
      {children}
    </div>
  );
}
