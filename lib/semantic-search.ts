import { NoteItem } from './notes-store';

// Technical synonym / semantic concept map for engineer knowledge domain
const CONCEPT_SYNONYMS: Record<string, string[]> = {
  security: ['auth', 'rls', 'policy', 'token', 'jwt', 'pkce', 'middleware', 'permission', 'rate', 'protection', 'isolation'],
  auth: ['security', 'login', 'signup', 'oauth', 'pkce', 'jwt', 'user', 'session'],
  database: ['postgres', 'postgresql', 'sql', 'rls', 'insforge', 'table', 'vector', 'query', 'migration'],
  rate: ['limit', 'upstash', 'redis', 'middleware', 'bucket', 'quota', 'sliding', 'window', 'protection'],
  ai: ['embedding', 'vector', 'openrouter', 'openai', 'llm', 'gemini', 'gpt', 'prompt', 'groq', 'streaming'],
  vector: ['embedding', 'pgvector', 'similarity', 'cosine', 'search', 'ai', 'distance'],
  frontend: ['nextjs', 'react', 'tailwind', 'css', 'ui', 'component', 'layout', 'editor', 'turbopack'],
  architecture: ['microfrontend', 'federation', 'turbopack', 'gateway', 'middleware', 'design'],
  devops: ['docker', 'container', 'build', 'deployment', 'runner', 'alpine', 'standalone'],
  realtime: ['websocket', 'pubsub', 'gateway', 'channel', 'event', 'broadcast', 'listener'],
  testing: ['vitest', 'react-testing-library', 'unit', 'mock', 'assert', 'test'],
};

/**
 * Tokenizes text into normalized clean terms
 */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter((term) => term.length > 1);
}

/**
 * Expands query terms using semantic concept dictionary
 */
function expandQuery(terms: string[]): Set<string> {
  const expanded = new Set<string>(terms);

  for (const term of terms) {
    // Check direct synonym mappings
    if (CONCEPT_SYNONYMS[term]) {
      CONCEPT_SYNONYMS[term].forEach((syn) => expanded.add(syn));
    }
    // Check key substring matching
    for (const [concept, syns] of Object.entries(CONCEPT_SYNONYMS)) {
      if (concept.includes(term) || term.includes(concept)) {
        syns.forEach((syn) => expanded.add(syn));
        expanded.add(concept);
      }
    }
  }

  return expanded;
}

export interface SemanticSearchResult {
  note: NoteItem;
  score: number;
  matchedConcepts: string[];
}

/**
 * Computes semantic similarity score between search query and a note
 */
export function searchNotesSemantically(
  notes: NoteItem[],
  query: string
): SemanticSearchResult[] {
  const trimmedQuery = query.trim();
  if (!trimmedQuery) {
    return notes.map((note) => ({ note, score: 1, matchedConcepts: [] }));
  }

  const queryTokens = tokenize(trimmedQuery);
  if (queryTokens.length === 0) {
    return notes.map((note) => ({ note, score: 1, matchedConcepts: [] }));
  }

  const expandedQuery = expandQuery(queryTokens);

  const results: SemanticSearchResult[] = [];

  for (const note of notes) {
    const titleTokens = tokenize(note.title);
    const summaryTokens = tokenize(note.summary || '');
    const tagTokens = note.tags.flatMap(tokenize);
    const contentTokens = tokenize(note.content || '');

    let score = 0;
    const matchedConcepts = new Set<string>();

    // 1. Literal exact matches (Highest Weight)
    queryTokens.forEach((qt) => {
      if (note.title.toLowerCase().includes(qt)) {
        score += 10;
        matchedConcepts.add(qt);
      }
      if (note.tags.some((t) => t.toLowerCase().includes(qt))) {
        score += 8;
        matchedConcepts.add(qt);
      }
      if ((note.summary || '').toLowerCase().includes(qt)) {
        score += 5;
        matchedConcepts.add(qt);
      }
      if (contentTokens.includes(qt)) {
        score += 3;
        matchedConcepts.add(qt);
      }
    });

    // 2. Semantic concept expansion matches (Medium Weight)
    expandedQuery.forEach((eq) => {
      if (titleTokens.includes(eq)) {
        score += 4;
        matchedConcepts.add(eq);
      }
      if (tagTokens.includes(eq)) {
        score += 3;
        matchedConcepts.add(eq);
      }
      if (summaryTokens.includes(eq)) {
        score += 2;
        matchedConcepts.add(eq);
      }
      if (contentTokens.includes(eq)) {
        score += 1;
        matchedConcepts.add(eq);
      }
    });

    if (score > 0) {
      results.push({
        note,
        score,
        matchedConcepts: Array.from(matchedConcepts),
      });
    }
  }

  // Sort notes by highest semantic score
  return results.sort((a, b) => b.score - a.score);
}
