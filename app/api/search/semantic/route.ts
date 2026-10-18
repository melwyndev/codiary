import { NextResponse } from 'next/server';
import { searchNotesSemantically } from '@/lib/semantic-search';
import { getNotes } from '@/lib/notes-store';
import { insforge } from '@/lib/insforge';

export async function POST(req: Request) {
  try {
    const { query } = await req.json();
    const searchQuery = (query || '').trim();

    if (!searchQuery) {
      const allNotes = getNotes();
      return NextResponse.json({
        query: '',
        total: allNotes.length,
        results: allNotes.map((n) => ({ note: n, score: 1 })),
      });
    }

    // 1. Try Postgres pgvector vector search if connected
    try {
      // Generate embedding vector for query
      const embRes = await fetch(`${new URL(req.url).origin}/api/embeddings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: searchQuery }),
      });

      if (embRes.ok) {
        const { embedding } = await embRes.json();

        if (Array.isArray(embedding)) {
          const vectorString = `[${embedding.join(',')}]`;
          
          // Query InsForge database for top matching embeddings
          const { data, error } = await insforge.database
            .rpc('match_notes_embedding', {
              query_embedding: vectorString,
              match_threshold: 0.2,
              match_count: 10,
            });

          if (!error && Array.isArray(data) && data.length > 0) {
            return NextResponse.json({
              query: searchQuery,
              type: 'vector_pgvector',
              total: data.length,
              results: data,
            });
          }
        }
      }
    } catch (pgErr) {
      console.warn('Postgres pgvector search fallback:', pgErr);
    }

    // 2. Fallback to in-memory concept semantic search engine
    const allNotes = getNotes();
    const results = searchNotesSemantically(allNotes, searchQuery);

    return NextResponse.json({
      query: searchQuery,
      type: 'concept_semantic',
      total: results.length,
      results: results.map((r) => ({
        note: r.note,
        score: r.score,
        matchedConcepts: r.matchedConcepts,
      })),
    });
  } catch (error: any) {
    console.error('Semantic search API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to execute semantic search.' },
      { status: 500 }
    );
  }
}
