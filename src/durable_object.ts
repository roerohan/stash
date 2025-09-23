import { z } from 'zod';

// Define the schema for a paste
export const pasteSchema = z.object({
  id: z.string().uuid(),
  owner_email: z.string().email().nullable(),
  title: z.string().optional().default('Untitled'),
  content: z.string().min(1, 'Content cannot be empty'),
  language: z.string().nullable(),
  created_at: z.number(),
  updated_at: z.number(),
});

export type Paste = z.infer<typeof pasteSchema>;

// Define environment bindings
export interface Env {
  PASTE_STORAGE: DurableObjectNamespace;
  VECTORIZE: VectorizeIndex;
  AI: any;
  ASSETS?: Fetcher;
  ENVIRONMENT?: 'development' | 'production';
}

// The PasteStorage Durable Object class
export class PasteStorage {
  state: DurableObjectState;
  env: Env;

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;
  }

  // The fetch handler is the entry point for all requests to the Durable Object.
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname.slice(1).split('/');
    const method = request.method.toUpperCase();

    try {
      switch (path[0]) {
        case 'create':
          if (method === 'POST') {
            const data = await request.json<Omit<Paste, 'id' | 'created_at' | 'updated_at'>>();
            const paste = await this.createPaste(data);
            return new Response(JSON.stringify(paste), { headers: { 'Content-Type': 'application/json' }, status: 201 });
          }
          break;
        case 'paste':
          const id = path[1];
          if (id) {
            switch (method) {
              case 'GET':
                const paste = await this.getPaste(id);
                return paste
                  ? new Response(JSON.stringify(paste), { headers: { 'Content-Type': 'application/json' } })
                  : new Response('Paste not found', { status: 404 });
              case 'PUT':
                const updates = await request.json<Partial<Paste>>();
                const updatedPaste = await this.updatePaste(id, updates);
                return new Response(JSON.stringify(updatedPaste), { headers: { 'Content-Type': 'application/json' } });
              case 'DELETE':
                await this.deletePaste(id);
                return new Response('Paste deleted', { status: 200 });
            }
          }
          break;
        case 'user-pastes':
          const email = path[1];
          if (email && method === 'GET') {
            const pastes = await this.listUserPastes(email);
            return new Response(JSON.stringify(pastes), { headers: { 'Content-Type': 'application/json' } });
          }
          break;
        case 'public-pastes':
          if (method === 'GET') {
            const pastes = await this.listPublicPastes();
            return new Response(JSON.stringify(pastes), { headers: { 'Content-Type': 'application/json' } });
          }
          break;
        case 'get-multiple':
            if (method === 'POST') {
                const { ids } = await request.json<{ ids: string[] }>();
                const pastes = await this.getMultiplePastes(ids);
                return new Response(JSON.stringify(pastes), { headers: { 'Content-Type': 'application/json' } });
            }
            break;
        case 'list-all':
            if (method === 'GET') {
                const pastes = await this.listAllPastes();
                return new Response(JSON.stringify(pastes), { headers: { 'Content-Type': 'application/json' } });
            }
            break;
      }
      return new Response('Not found', { status: 404 });
    } catch (error: any) {
        console.error(`DO Error: ${error.stack}`);
      return new Response(error.message, { status: 500 });
    }
  }

  // Create a new paste
  private async createPaste(data: Omit<Paste, 'id' | 'created_at' | 'updated_at'>): Promise<Paste> {
    const id = crypto.randomUUID();
    const now = Date.now();
    const newPaste: Paste = { id, ...data, created_at: now, updated_at: now };
    pasteSchema.parse(newPaste);

    await this.state.storage.put(`paste:${id}`, newPaste);

    if (newPaste.owner_email) {
      const userPastes = (await this.state.storage.get<string[]>(`user:${newPaste.owner_email}`)) || [];
      userPastes.unshift(id);
      await this.state.storage.put(`user:${newPaste.owner_email}`, userPastes);
    } else {
      const publicPastes = (await this.state.storage.get<string[]>('public_pastes')) || [];
      publicPastes.unshift(id);
      if (publicPastes.length > 100) publicPastes.pop();
      await this.state.storage.put('public_pastes', publicPastes);
    }
    return newPaste;
  }

  // Get a single paste
  private async getPaste(id: string): Promise<Paste | undefined> {
    return this.state.storage.get<Paste>(`paste:${id}`);
  }

  // Get multiple pastes by their IDs
  private async getMultiplePastes(ids: string[]): Promise<Paste[]> {
      if (ids.length === 0) return [];
      const keys = ids.map(id => `paste:${id}`);
      const pastesMap = await this.state.storage.get<Paste>(keys);
      return Array.from(pastesMap.values()).filter((p): p is Paste => p !== undefined);
  }

  // Update a paste
  private async updatePaste(id: string, updates: Partial<Paste>): Promise<Paste> {
    const currentPaste = await this.getPaste(id);
    if (!currentPaste) throw new Error('Paste not found');

    const updatedPaste: Paste = { ...currentPaste, ...updates, updated_at: Date.now() };
    pasteSchema.parse(updatedPaste);

    await this.state.storage.put(`paste:${id}`, updatedPaste);
    return updatedPaste;
  }

  // Delete a paste
  private async deletePaste(id: string): Promise<void> {
    const paste = await this.getPaste(id);
    if (!paste) return;

    await this.state.storage.delete(`paste:${id}`);

    if (paste.owner_email) {
      const userPastes = (await this.state.storage.get<string[]>(`user:${paste.owner_email}`)) || [];
      await this.state.storage.put(`user:${paste.owner_email}`, userPastes.filter(pId => pId !== id));
    } else {
      const publicPastes = (await this.state.storage.get<string[]>('public_pastes')) || [];
      await this.state.storage.put('public_pastes', publicPastes.filter(pId => pId !== id));
    }
  }

  // List all pastes
  private async listAllPastes(): Promise<Paste[]> {
    const allItems = await this.state.storage.list<Paste>({ prefix: 'paste:' });
    return Array.from(allItems.values());
  }

  // List pastes for a specific user
  private async listUserPastes(email: string): Promise<Paste[]> {
    const pasteIds = (await this.state.storage.get<string[]>(`user:${email}`)) || [];
    return this.getMultiplePastes(pasteIds);
  }

  // List recent public pastes
  private async listPublicPastes(): Promise<Paste[]> {
    const pasteIds = (await this.state.storage.get<string[]>('public_pastes')) || [];
    return this.getMultiplePastes(pasteIds);
  }
}
