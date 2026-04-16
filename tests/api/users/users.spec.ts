import { test, expect } from '../../../fixtures';
import { getJson, postJson, deleteResource } from '../../../helpers/api';
import { randomEmail, randomUsername } from '../../../helpers/data';

/**
 * Users API tests — using the custom apiContext fixture.
 *
 * Unlike Cypress cy.request(), Playwright API testing is fully async/await
 * and runs without a browser — making it fast and lightweight.
 */
test.describe('Users API', () => {
  test('GET /users - should return a list of users', async ({ apiContext }) => {
    const { status, body } = await getJson<{ users: unknown[] }>(
      apiContext,
      '/users'
    );

    expect(status).toBe(200);
    expect(Array.isArray((body as any).users)).toBeTruthy();
  });

  test('POST /users - should create a new user', async ({ apiContext }) => {
    const newUser = {
      email: randomEmail(),
      username: randomUsername(),
      password: 'Test1234!',
    };

    const { status, body } = await postJson<{ id: string }>(
      apiContext,
      '/users',
      newUser
    );

    expect(status).toBe(201);
    expect((body as any).id).toBeDefined();
  });

  test('DELETE /users/:id - should delete a user', async ({ apiContext }) => {
    // In a real test you would create a user first, then delete it
    const userId = 'existing-user-id';

    const { status } = await deleteResource(apiContext, `/users/${userId}`);

    expect(status).toBe(204);
  });
});
