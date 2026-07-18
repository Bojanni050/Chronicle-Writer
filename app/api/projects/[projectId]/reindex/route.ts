import { NextRequest, NextResponse } from 'next/server';
import { isEmbeddingEnabled } from '@/lib/ai/embeddings/factory';
import { reindexProject } from '@/lib/retrieval/indexer';

export async function POST(
  _: NextRequest,
  { params }: { params: { projectId: string } }
) {
  if (!isEmbeddingEnabled()) {
    return NextResponse.json({
      message: 'Embeddings are disabled (EMBEDDING_PROVIDER=stub). Set EMBEDDING_PROVIDER=openai or ollama to enable.',
      indexed: 0,
      skipped: 0,
      errors: [],
    });
  }

  try {
    const result = await reindexProject(params.projectId);
    return NextResponse.json({
      message: `Reindex complete. ${result.indexed} entities indexed, ${result.skipped} skipped.`,
      ...result,
    });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
