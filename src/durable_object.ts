import { DurableObject } from 'cloudflare:workers';
import { z } from 'zod';

// Define the schema for a paste
export const pasteSchema = z.object({
  id: z.string().uuid(),
  owner_email: z.string().email().nullable(),
  title: z.string().optional().default('Untitled'),
  content: z.string().min(1, 'Content cannot be empty'),
  language: z.string().nullable(),
  visibility: z.enum(['public', 'private']).default('public'),
  created_at: z.number(),
  updated_at: z.number(),
});

export type Paste = z.infer<typeof pasteSchema>;

// Define environment bindings
export interface Env {
  PASTE_STORAGE: DurableObjectNamespace<PasteStorage>;
  VECTORIZE: VectorizeIndex;
  AI: any;
  ASSETS?: Fetcher;
  ENVIRONMENT?: 'development' | 'production';
}

// The PasteStorage Durable Object class
export class PasteStorage extends DurableObject {
  storage: DurableObjectStorage;
  env: Env;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.storage = ctx.storage;
    this.env = env;
  }

  async createPaste(data: Omit<Paste, 'id' | 'created_at' | 'updated_at'>): Promise<Paste> {
    const id = crypto.randomUUID();
    const now = Date.now();
    const newPaste: Paste = { id, ...data, created_at: now, updated_at: now };
    pasteSchema.parse(newPaste);

    await this.storage.put(`paste:${id}`, newPaste);

    if (newPaste.owner_email) {
      const userPastes = (await this.storage.get<string[]>(`user:${newPaste.owner_email}`)) || [];
      userPastes.unshift(id);
      await this.storage.put(`user:${newPaste.owner_email}`, userPastes);
    }

    if (newPaste.visibility === 'public') {
      const publicPastes = (await this.storage.get<string[]>('public_pastes')) || [];
      publicPastes.unshift(id);
      if (publicPastes.length > 100) publicPastes.pop(); // Keep the list at a reasonable size
      await this.storage.put('public_pastes', publicPastes);
    }
    return newPaste;
  }

  async getPaste(id: string): Promise<Paste | undefined> {
    return this.storage.get<Paste>(`paste:${id}`);
  }

  async getMultiplePastes(ids: string[]): Promise<Paste[]> {
      if (ids.length === 0) return [];
      const keys = ids.map(id => `paste:${id}`);
      const pastesMap = await this.storage.get<Paste>(keys);
      return Array.from(pastesMap.values()).filter((p): p is Paste => p !== undefined);
  }

  async updatePaste(id: string, updates: Partial<Paste>): Promise<Paste> {
    const currentPaste = await this.getPaste(id);
    if (!currentPaste) throw new Error('Paste not found');

    const updatedPaste: Paste = { ...currentPaste, ...updates, updated_at: Date.now() };
    pasteSchema.parse(updatedPaste);

    await this.storage.put(`paste:${id}`, updatedPaste);
    return updatedPaste;
  }

  async deletePaste(id: string): Promise<void> {
    const paste = await this.getPaste(id);
    if (!paste) return;

    await this.storage.delete(`paste:${id}`);

    if (paste.owner_email) {
      const userPastes = (await this.storage.get<string[]>(`user:${paste.owner_email}`)) || [];
      await this.storage.put(`user:${paste.owner_email}`, userPastes.filter(pId => pId !== id));
    }

    if (paste.visibility === 'public') {
      const publicPastes = (await this.storage.get<string[]>('public_pastes')) || [];
      await this.storage.put('public_pastes', publicPastes.filter(pId => pId !== id));
    }
  }

  async listAllPastes(): Promise<Paste[]> {
    const allItems = await this.storage.list<Paste>({ prefix: 'paste:' });
    return Array.from(allItems.values());
  }

  async listUserPastes(email: string): Promise<Paste[]> {
    const pasteIds = (await this.storage.get<string[]>(`user:${email}`)) || [];
    return this.getMultiplePastes(pasteIds);
  }

  async listPublicPastes(): Promise<Paste[]> {
    const pasteIds = (await this.storage.get<string[]>('public_pastes')) || [];
    return this.getMultiplePastes(pasteIds);
  }
}
