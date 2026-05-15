import type { APIRequestContext, APIResponse } from "@playwright/test";

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

export class UserService {
  private readonly endpoint = "/notes/api/users";

  constructor(private readonly request: APIRequestContext) {}

  async register({ name, email, password }: RegisterPayload): Promise<APIResponse> {
    // form (not data): Notes API expects application/x-www-form-urlencoded per
    // Swagger (in: formData) — JSON bodies return 400. The inline literal
    // satisfies Playwright's index-signature typing for `form`; passing the
    // named RegisterPayload directly would not type-check.
    return this.request.post(`${this.endpoint}/register`, {
      form: { name, email, password },
    });
  }
}
