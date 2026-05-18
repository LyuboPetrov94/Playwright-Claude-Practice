import type { APIRequestContext, APIResponse } from "@playwright/test";

export type NoteCategory = "Home" | "Work" | "Personal";

export interface CreateNotePayload {
  title: string;
  description: string;
  category: string; // kept as string (not NoteCategory) so negative TCs can pass invalid values
}

export interface UpdateNotePayload {
  title: string;
  description: string;
  completed: boolean;
  category: string;
}

export class NotesService {
  private readonly endpoint = "/notes/api/notes";

  constructor(private readonly request: APIRequestContext) {}

  async create({
    title,
    description,
    category,
  }: CreateNotePayload): Promise<APIResponse> {
    // form (not data): Notes API expects application/x-www-form-urlencoded per
    // Swagger (in: formData) — JSON bodies return 400. Inline literal satisfies
    // Playwright's index-signature typing for `form`.
    return this.request.post(this.endpoint, {
      form: { title, description, category },
    });
  }

  async list(): Promise<APIResponse> {
    return this.request.get(this.endpoint);
  }

  async getById(id: string): Promise<APIResponse> {
    return this.request.get(`${this.endpoint}/${id}`);
  }

  async update(
    id: string,
    { title, description, completed, category }: UpdateNotePayload,
  ): Promise<APIResponse> {
    return this.request.put(`${this.endpoint}/${id}`, {
      form: { title, description, completed, category },
    });
  }

  // Narrow name: PATCH is completion-toggle only on this API,
  // never a partial update. See tests/api/CLAUDE.md gotcha.
  async patchCompleted(id: string, completed: boolean): Promise<APIResponse> {
    return this.request.patch(`${this.endpoint}/${id}`, {
      form: { completed },
    });
  }

  async deleteById(id: string): Promise<APIResponse> {
    return this.request.delete(`${this.endpoint}/${id}`);
  }
}
