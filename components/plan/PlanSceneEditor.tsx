'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { PlanScene } from '@/lib/plan-types';

const schema = z.object({
  title:       z.string().min(1, 'Title required'),
  description: z.string(),
  characters:  z.string(),
  setting:     z.string(),
  purpose:     z.enum(['plot', 'character', 'world-building']),
});
type FormData = z.infer<typeof schema>;

const PURPOSE_LABELS = {
  plot:             'Plot',
  character:        'Character',
  'world-building': 'World-building',
};

interface PlanSceneEditorProps {
  scene: PlanScene;
  onSave: (data: Partial<PlanScene>) => Promise<void>;
}

export function PlanSceneEditor({ scene, onSave }: PlanSceneEditorProps) {
  const { register, handleSubmit, setValue, watch, reset, formState: { errors, isDirty, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      title:       scene.title,
      description: scene.description,
      characters:  scene.characters,
      setting:     scene.setting,
      purpose:     scene.purpose,
    },
  });

  useEffect(() => {
    reset({
      title:       scene.title,
      description: scene.description,
      characters:  scene.characters,
      setting:     scene.setting,
      purpose:     scene.purpose,
    });
  }, [scene.id, reset]);

  const purpose = watch('purpose');

  return (
    <div className="h-full flex flex-col">
      <div className="px-6 py-4 border-b border-stone-200 flex-shrink-0">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-400 mb-1">Scene</p>
        <h2 className="text-lg font-semibold text-stone-800">{scene.title || 'Untitled Scene'}</h2>
      </div>

      <form onSubmit={handleSubmit(onSave)} className="flex-1 overflow-y-auto">
        <div className="px-6 py-5 space-y-5">
          <Field label="Title" error={errors.title?.message}>
            <Input {...register('title')} className="text-sm" placeholder="Scene title…" />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Setting">
              <Input {...register('setting')} className="text-sm" placeholder="Location / time…" />
            </Field>
            <Field label="Purpose">
              <Select value={purpose} onValueChange={(v) => setValue('purpose', v as FormData['purpose'], { shouldDirty: true })}>
                <SelectTrigger className="text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.entries(PURPOSE_LABELS) as [FormData['purpose'], string][]).map(([v, l]) => (
                    <SelectItem key={v} value={v}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <Field label="Characters Involved">
            <Input
              {...register('characters')}
              className="text-sm"
              placeholder="Mara, Director Lenz…"
            />
            <p className="text-[10px] text-stone-400">Comma-separated names</p>
          </Field>

          <Field label="Description">
            <Textarea
              {...register('description')}
              rows={8}
              className="text-sm resize-none"
              placeholder="What happens in this scene? What is the protagonist's goal, the obstacle, and the outcome?"
            />
          </Field>

          <div className="flex items-center justify-between pt-2">
            <p className="text-xs text-stone-400">
              {isDirty ? 'Unsaved changes' : 'Saved'}
            </p>
            <Button type="submit" size="sm" disabled={!isDirty || isSubmitting}>
              {isSubmitting ? 'Saving…' : 'Save Scene'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">{label}</Label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
