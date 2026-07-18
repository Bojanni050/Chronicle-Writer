import { NextRequest, NextResponse } from 'next/server';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const UPLOAD_ROOT = join(process.cwd(), 'public', 'uploads', 'character-photos');
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const MAX_SIZE = 5 * 1024 * 1024;

export async function POST(
  req: NextRequest,
  { params }: { params: { projectId: string; characterId: string } }
) {
  const formData = await req.formData().catch(() => null);
  const file = formData?.get('file');

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'File too large (max 5MB)' }, { status: 400 });
  }

  const ext = file.name.split('.').pop() ?? 'jpg';
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const dir = join(UPLOAD_ROOT, params.projectId, params.characterId);

  await mkdir(dir, { recursive: true });
  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(join(dir, filename), bytes);

  const url = `/uploads/character-photos/${params.projectId}/${params.characterId}/${filename}`;
  return NextResponse.json({ url }, { status: 201 });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { projectId: string; characterId: string } }
) {
  const body = await req.json().catch(() => ({}));
  const url: string | undefined = body.url;

  if (!url) return NextResponse.json({ error: 'url is required' }, { status: 400 });

  const prefix = `/uploads/character-photos/${params.projectId}/${params.characterId}/`;
  if (!url.startsWith(prefix)) {
    return NextResponse.json({ error: 'Invalid photo url' }, { status: 400 });
  }

  const filename = url.slice(prefix.length);
  if (filename.includes('/') || filename.includes('..')) {
    return NextResponse.json({ error: 'Invalid photo url' }, { status: 400 });
  }

  try {
    await unlink(join(UPLOAD_ROOT, params.projectId, params.characterId, filename));
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== 'ENOENT') {
      return NextResponse.json({ error: (err as Error).message }, { status: 500 });
    }
  }

  return new NextResponse(null, { status: 204 });
}
