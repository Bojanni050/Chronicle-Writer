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
import type { PlanChapter } from '@/lib/plan-types';

const schema = z.object({
  title:         z.string().min(1, 'Title required'),
  summary:       z.string(),
  pov_character: z.string(),
  status:        z.enum(['planned', 'draft', 'complete']),
});
type FormData = z.infer<typeof schema>;

interface ChapterEditorProps {
  chapter: PlanChapter;
  onSave: (data: Partial<PlanChapter>) => Promise<void>;
}

export function ChapterEditor({ chapter, onSave }: ChapterEditorProps) {
  const { register, handleSubmit, setValue, watch, reset, formState: { errors, isDirty, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      title:         chapter.title,
      summary:       chapter.summary,
      pov_character: chapter.pov_character,
      status:        chapter.status,
    },
  });

  useEffect(() => {
    reset({
      title:         chapter.title,
      summary:       chapter.summary,
      pov_character: chapter.pov_character,
      status:        chapter.status,
    });
  }, [chapter.id, reset]);

  const status = watch('status');

  return (
    <div className="h-full flex flex-col">
      <div className="px-6 py-4 border-b border-stone-200 flex-shrink-0">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-400 mb-1">Chapter</p>
        <h2 className="text-lg font-semibold text-stone-800">{chapter.title || 'Untitled Chapter'}</h2>
      </div>

      <form onSubmit={handleSubmit(onSave)} className="flex-1 overflow-y-auto">
        <div className="px-6 py-5 space-y-5">
          <Field label="Title" error={errors.title?.message}>
            <Input {...register('title')} className="text-sm" placeholder="Chapter title…" />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="POV Character">
              <Input {...register('pov_character')} className="text-sm" placeholder="Character name…" />
            </Field>
            <Field label="Status">
              <Select value={status} onValueChange={(v) => setValue('status', v as FormData['status'], { shouldDirty: true })}>
                <SelectTrigger className="text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="planned">Planned</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="complete">Complete</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>

          <Field label="Summary">
            <Textarea
              {...register('summary')}
              rows={6}
              className="text-sm resize-none"
              placeholder="What happens in this chapter? What does the protagonist want, face, and decide?"
            />
          </Field>

          <div className="flex items-center justify-between pt-2">
            <p className="text-xs text-stone-400">
              {isDirty ? 'Unsaved changes' : 'Saved'}
            </p>
            <Button type="submit" size="sm" disabled={!isDirty || isSubmitting}>
              {isSubmitting ? 'Saving…' : 'Save Chapter'}
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
