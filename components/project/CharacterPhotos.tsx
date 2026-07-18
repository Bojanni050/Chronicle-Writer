'use client';

import { useRef, useState } from 'react';
import { ImagePlus, X, ChevronLeft, ChevronRight } from 'lucide-react';

const MAX_PHOTOS = 5;

interface CharacterPhotosProps {
  projectId: string;
  characterId: string;
  photos: string[];
  onPhotosChange: (photos: string[]) => void;
  compact?: boolean;
}

export function CharacterPhotos({
  projectId,
  characterId,
  photos,
  onPhotosChange,
  compact = false,
}: CharacterPhotosProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [error, setError] = useState('');

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const remaining = MAX_PHOTOS - photos.length;
    if (remaining <= 0) { setError(`Maximum ${MAX_PHOTOS} photos allowed.`); return; }

    const toUpload = Array.from(files).slice(0, remaining);
    setUploading(true);
    setError('');

    const newUrls: string[] = [];
    for (const file of toUpload) {
      const body = new FormData();
      body.append('file', file);

      const res = await fetch(`/api/projects/${projectId}/characters/${characterId}/photos`, {
        method: 'POST',
        body,
      });

      if (!res.ok) {
        const { error: uploadErr } = await res.json().catch(() => ({ error: 'Upload failed' }));
        setError(`Upload failed: ${uploadErr}`);
        continue;
      }

      const { url } = await res.json();
      newUrls.push(url);
    }

    setUploading(false);

    if (newUrls.length > 0) {
      const updated = [...photos, ...newUrls];
      onPhotosChange(updated);
      await persistPhotos(updated);
    }
  }

  async function removePhoto(index: number) {
    const url = photos[index];
    try {
      await fetch(`/api/projects/${projectId}/characters/${characterId}/photos`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
    } catch {
      // non-blocking
    }
    const updated = photos.filter((_, i) => i !== index);
    onPhotosChange(updated);
    await persistPhotos(updated);
    if (lightbox === index) setLightbox(null);
  }

  async function persistPhotos(updatedPhotos: string[]) {
    await fetch(`/api/projects/${projectId}/characters/${characterId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ photos: updatedPhotos }),
    });
  }

  if (compact) {
    return (
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5 flex-wrap">
          {photos.map((url, i) => (
            <div
              key={url}
              className="relative group w-10 h-10 rounded-md overflow-hidden border border-stone-200 cursor-pointer flex-shrink-0"
              onClick={() => setLightbox(i)}
            >
              <img src={url} alt="" className="w-full h-full object-cover" />
              <button
                onClick={(e) => { e.stopPropagation(); removePhoto(i); }}
                className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
              >
                <X className="w-3 h-3 text-white" />
              </button>
            </div>
          ))}
          {photos.length < MAX_PHOTOS && (
            <button
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="w-10 h-10 rounded-md border border-dashed border-stone-300 flex items-center justify-center text-stone-400 hover:border-stone-400 hover:text-stone-500 transition-colors flex-shrink-0"
            >
              {uploading ? (
                <div className="w-3 h-3 border border-stone-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <ImagePlus className="w-3.5 h-3.5" />
              )}
            </button>
          )}
        </div>
        {error && <p className="text-[10px] text-red-500">{error}</p>}
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <Lightbox photos={photos} index={lightbox} onClose={() => setLightbox(null)} onRemove={removePhoto} />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-5 gap-2">
        {photos.map((url, i) => (
          <div
            key={url}
            className="relative group aspect-square rounded-lg overflow-hidden border border-stone-200 cursor-pointer"
            onClick={() => setLightbox(i)}
          >
            <img src={url} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
            <button
              onClick={(e) => { e.stopPropagation(); removePhoto(i); }}
              className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity hover:bg-red-600"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
        {photos.length < MAX_PHOTOS && Array.from({ length: MAX_PHOTOS - photos.length }).slice(0, 1).map((_, i) => (
          <button
            key={`empty-${i}`}
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="aspect-square rounded-lg border-2 border-dashed border-stone-200 flex flex-col items-center justify-center text-stone-300 hover:border-stone-400 hover:text-stone-400 transition-colors gap-1"
          >
            {uploading ? (
              <div className="w-4 h-4 border-2 border-stone-300 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <ImagePlus className="w-5 h-5" />
                <span className="text-[9px] leading-none">{MAX_PHOTOS - photos.length} left</span>
              </>
            )}
          </button>
        ))}
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {photos.length < MAX_PHOTOS && photos.length > 0 && (
        <button
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="text-xs text-stone-400 hover:text-stone-600 transition-colors"
        >
          + Add more photos
        </button>
      )}

      <Lightbox photos={photos} index={lightbox} onClose={() => setLightbox(null)} onRemove={removePhoto} />
    </div>
  );
}

function Lightbox({
  photos,
  index,
  onClose,
  onRemove,
}: {
  photos: string[];
  index: number | null;
  onClose: () => void;
  onRemove: (i: number) => void;
}) {
  const [current, setCurrent] = useState(index ?? 0);

  // Sync when index changes from outside
  if (index !== null && current !== index) setCurrent(index);

  if (index === null) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="relative max-w-2xl w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={photos[current]}
          alt=""
          className="w-full max-h-[80vh] object-contain rounded-lg"
        />

        {photos.length > 1 && (
          <>
            {current > 0 && (
              <button
                onClick={() => setCurrent(current - 1)}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
            {current < photos.length - 1 && (
              <button
                onClick={() => setCurrent(current + 1)}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </>
        )}

        <div className="absolute top-2 right-2 flex gap-2">
          <button
            onClick={() => onRemove(current)}
            className="w-7 h-7 rounded-full bg-red-600/80 text-white flex items-center justify-center hover:bg-red-600"
          >
            <X className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {photos.length > 1 && (
          <div className="flex justify-center gap-1.5 mt-3">
            {photos.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${i === current ? 'bg-white' : 'bg-white/40'}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
