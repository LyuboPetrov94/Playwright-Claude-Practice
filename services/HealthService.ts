import type { APIRequestContext, APIResponse } from "@playwright/test";

export class HealthService {
  private readonly endpoint = "/notes/api/health-check";

  constructor(private readonly request: APIRequestContext) {}

  async check(): Promise<APIResponse> {
    return this.request.get(this.endpoint);
  }

  async sendWithMethod(
    method: "POST" | "PUT" | "PATCH" | "DELETE",
  ): Promise<APIResponse> {
    return this.request.fetch(this.endpoint, { method });
  }
}
