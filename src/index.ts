import { Hono, Context } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { PasteStorage, pasteSchema, Env, Paste } from './durable_object';
import { serveStatic } from 'hono/cloudflare-workers';

// Define the Hono app with environment types
type App = {
  Bindings: Env;
  Variables: {
    userEmail: string | null;
    pasteStorage: DurableObjectStub;
  };
};

const app = new Hono<App>();

// Helper to get the DO stub
function getPasteStorage(c: Context<App>): DurableObjectStub {
    // Use a single, well-known DO instance for all pastes
    const id = c.env.PASTE_STORAGE.idFromName('global-paste-storage');
    return c.env.PASTE_STORAGE.get(id);
}

// Middleware to get user email
app.use('/v1/*', async (c, next) => {
  let userEmail = c.req.header('cf-access-authenticated-user-email') ?? null;

  // For local development, if the header is not present, we can use a mock email.
  const isDevelopment = c.env.ENVIRONMENT === 'development';
  if (isDevelopment && !userEmail) {
    userEmail = 'dev-user@example.com'; // Mock user for local development
  }

  c.set('userEmail', userEmail);
  await next();
});

// --- API v1 Routes ---
const v1 = new Hono<App>();

// POST /v1/paste - Create a new paste
v1.post(
  '/paste',
  zValidator('json', pasteSchema.omit({ id: true, created_at: true, updated_at: true, owner_email: true })),
  async (c) => {
    const pasteData = c.req.valid('json');
    const userEmail = c.get('userEmail');
    const pasteStorage = getPasteStorage(c);

    const response = await pasteStorage.fetch('http://do/create', {
      method: 'POST',
      body: JSON.stringify({ ...pasteData, owner_email: userEmail }),
      headers: { 'Content-Type': 'application/json' },
    });
    const newPaste = await response.json<Paste>();

    c.executionCtx.waitUntil(vectorizePaste(c.env, newPaste));

    return c.json(newPaste, 201);
  }
);

// GET /v1/paste/:id - Fetch a paste
v1.get('/paste/:id', async (c) => {
  const { id } = c.req.param();
  const userEmail = c.get('userEmail');
  const pasteStorage = getPasteStorage(c);

  const response = await pasteStorage.fetch(`http://do/paste/${id}`);
  if (!response.ok) {
    return c.json({ error: 'Paste not found' }, 404);
  }
  const paste = await response.json<Paste>();

  if (paste.owner_email && paste.owner_email !== userEmail) {
    return c.json({ error: 'Forbidden' }, 403);
  }

  return c.json(paste);
});

// GET /v1/my-pastes - List user's pastes
v1.get('/my-pastes', async (c) => {
  const userEmail = c.get('userEmail');
  if (!userEmail) {
    return c.json({ error: 'Authentication required' }, 401);
  }
  const pasteStorage = getPasteStorage(c);
  const response = await pasteStorage.fetch(`http://do/user-pastes/${userEmail}`);
  const pastes = await response.json<Paste[]>();
  return c.json(pastes);
});

// GET /v1/public-pastes - List recent public pastes
v1.get('/public-pastes', async (c) => {
  const pasteStorage = getPasteStorage(c);
  const response = await pasteStorage.fetch('http://do/public-pastes');
  const pastes = await response.json<Paste[]>();
  return c.json(pastes);
});

// PUT /v1/paste/:id - Edit a paste
v1.put('/paste/:id', zValidator('json', pasteSchema.partial()), async (c) => {
  const { id } = c.req.param();
  const updates = c.req.valid('json');
  const userEmail = c.get('userEmail');
  const pasteStorage = getPasteStorage(c);

  const getResponse = await pasteStorage.fetch(`http://do/paste/${id}`);
  if (!getResponse.ok) {
    return c.json({ error: 'Paste not found' }, 404);
  }
  const currentPaste = await getResponse.json<Paste>();

  if (!currentPaste.owner_email || currentPaste.owner_email !== userEmail) {
    return c.json({ error: 'Forbidden' }, 403);
  }

  const updateResponse = await pasteStorage.fetch(`http://do/paste/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
    headers: { 'Content-Type': 'application/json' },
  });
  const updatedPaste = await updateResponse.json<Paste>();

  c.executionCtx.waitUntil(vectorizePaste(c.env, updatedPaste));

  return c.json(updatedPaste);
});

// DELETE /v1/paste/:id - Delete a paste
v1.delete('/paste/:id', async (c) => {
  const { id } = c.req.param();
  const userEmail = c.get('userEmail');
  const pasteStorage = getPasteStorage(c);

  const getResponse = await pasteStorage.fetch(`http://do/paste/${id}`);
  if (!getResponse.ok) {
    return c.json({ error: 'Paste not found' }, 404);
  }
  const currentPaste = await getResponse.json<Paste>();

  if (!currentPaste.owner_email || currentPaste.owner_email !== userEmail) {
    return c.json({ error: 'Forbidden' }, 403);
  }

  await pasteStorage.fetch(`http://do/paste/${id}`, { method: 'DELETE' });

  c.executionCtx.waitUntil(c.env.VECTORIZE.deleteByIds([`paste:${id}`]));

  return new Response(null, { status: 204 });
});

// POST /v1/search - Semantic search
v1.post('/search', async (c) => {
  const { query } = await c.req.json<{ query: string }>();
  const userEmail = c.get('userEmail');

  if (!query || typeof query !== 'string') {
    return c.json({ error: 'Invalid query' }, 400);
  }

  const { data } = await c.env.AI.run('@cf/baai/bge-base-en-v1.5', { text: [query] });
  const queryVector = data[0];

  if (!queryVector) {
    return c.json({ error: 'Failed to generate query embedding' }, 500);
  }

  const vectorMatches = await c.env.VECTORIZE.query(queryVector, { topK: 10 });

  const scoreMap = new Map<string, number>();
  const pasteIds = vectorMatches.matches.map((m: any) => {
    const id = m.id.replace('paste:', '');
    scoreMap.set(id, m.score);
    return id;
  });

  if (pasteIds.length === 0) {
    return c.json([]);
  }

  const pasteStorage = getPasteStorage(c);
  const response = await pasteStorage.fetch('http://do/get-multiple', {
    method: 'POST',
    body: JSON.stringify({ ids: pasteIds }),
    headers: { 'Content-Type': 'application/json' },
  });
  const pastes = await response.json<Paste[]>();

  const allowedPastes = pastes.filter(p => !p.owner_email || p.owner_email === userEmail);

  // Re-sort the pastes based on the vector search score
  const sortedPastes = allowedPastes.sort((a, b) => {
    const scoreA = scoreMap.get(a.id) ?? 0;
    const scoreB = scoreMap.get(b.id) ?? 0;
    return scoreB - scoreA;
  });

  // Filter pastes based on score
  if (sortedPastes.length === 0) {
    return c.json([]);
  }

  const topScore = scoreMap.get(sortedPastes[0].id) ?? 0;
  if (topScore < 0.6) {
    // If the best match is below the threshold, only return that single best match.
    return c.json([sortedPastes[0]]);
  }

  // Otherwise, return all matches above the threshold.
  const filteredPastes = sortedPastes.filter(p => (scoreMap.get(p.id) ?? 0) >= 0.6);

  return c.json(filteredPastes);
});

// Temporary endpoint to re-index all pastes
v1.post('/reindex-all', async (c) => {
  const pasteStorage = getPasteStorage(c);
  const response = await pasteStorage.fetch('http://do/list-all');
  if (!response.ok) {
    return c.json({ error: 'Failed to fetch pastes from Durable Object' }, 500);
  }
  const pastes = await response.json<Paste[]>();

  const vectorizationPromises = pastes.map(paste => vectorizePaste(c.env, paste));
  c.executionCtx.waitUntil(Promise.all(vectorizationPromises));

  return c.json({
    message: `Re-indexing started for ${pastes.length} pastes. This will happen in the background.`,
    count: pastes.length,
  });
});

app.route('/v1', v1);

// Fallback to serving static assets for the SPA
app.get('*', async (c) => {
  if (!c.env.ASSETS) {
    return c.notFound();
  }

  // First, try to fetch the requested asset as is.
  const response = await c.env.ASSETS.fetch(c.req.raw);

  // If the asset is not found and it's a navigation request, serve index.html.
  if (response.status === 404 && c.req.header('sec-fetch-dest') === 'document') {
    const indexHtml = await c.env.ASSETS.fetch(new Request(new URL(c.req.url).origin + '/index.html'));
    return new Response(indexHtml.body, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
      status: 200,
    });
  }

  // Otherwise, return the original response (asset or 404).
  return response;
});

export default {
  fetch: app.fetch,
  async scheduled(controller: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
    // Optional: Implement scheduled tasks, e.g., for cleanup
  },
};

export { PasteStorage };

// Helper to vectorize a paste
async function vectorizePaste(env: Env, paste: Paste) {
  try {
    const text = `Title: ${paste.title}\nContent: ${paste.content}`;
    const { data } = await env.AI.run('@cf/baai/bge-base-en-v1.5', { text: [text] });
    const vector = data[0];

    if (vector) {
      await env.VECTORIZE.upsert([
        {
          id: `paste:${paste.id}`,
          values: vector,
          metadata: {
            // Vectorize metadata values cannot be null.
            ...(paste.owner_email && { owner: paste.owner_email }),
            ...(paste.title && { title: paste.title }),
            ...(paste.language && { language: paste.language }),
          },
        },
      ]);
    }
  } catch (error) {
    console.error(`Failed to vectorize paste ${paste.id}:`, error);
  }
}
