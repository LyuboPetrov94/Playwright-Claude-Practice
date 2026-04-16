import { APIRequestContext } from '@playwright/test';

/**
 * Thin wrappers around Playwright's API request context.
 * Centralises response checking so tests stay readable.
 */

export async function getJson<T>(
  request: APIRequestContext,
  url: string,
  params?: Record<string, string>
): Promise<{ status: number; body: T }> {
  const response = await request.get(url, { params });
  const body = await response.json();
  return { status: response.status(), body };
}

export async function postJson<T>(
  request: APIRequestContext,
  url: string,
  data: Record<string, unknown>
): Promise<{ status: number; body: T }> {
  const response = await request.post(url, { data });
  const body = await response.json();
  return { status: response.status(), body };
}

export async function deleteResource(
  request: APIRequestContext,
  url: string
): Promise<{ status: number }> {
  const response = await request.delete(url);
  return { status: response.status() };
}
