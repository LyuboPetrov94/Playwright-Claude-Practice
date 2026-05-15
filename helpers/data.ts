/**
 * Test data helpers — generate random/unique values to avoid test collisions.
 * Useful when tests create users, forms, or records that need unique identifiers.
 */

export function randomEmail(): string {
  const timestamp = Date.now();
  return `testuser_${timestamp}@example.com`;
}

export function randomUsername(): string {
  const timestamp = Date.now();
  return `user_${timestamp}`;
}

export function randomString(length = 8): string {
  let result = '';
  while (result.length < length) {
    result += Math.random().toString(36).substring(2);
  }
  return result.substring(0, length);
}

export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
