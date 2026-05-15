import { test, expect } from "../../../fixtures";
import { UserService } from "../../../services/UserService";

test.describe("Notes API - user profile", () => {
  test("TC01 - GET /users/profile returns the authed user", async ({
    authedRequest,
  }) => {
    const users = new UserService(authedRequest);
    const res = await users.getProfile();
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.id).toEqual(expect.any(String));
  });
});
