import { test, expect } from "../../../fixtures";
import {
  randomString,
  randomEmail,
  randomUsername,
} from "../../../helpers/data";
import { UserService } from "../../../services/UserService";

test.describe("Notes API - user login tests", () => {
  test("TC01 - login with valid credentials returns token", async ({
    request,
  }) => {
    const user = new UserService(request);

    const email = randomEmail();
    const password = randomString(10);
    const name = randomUsername();
    await user.register({ name, email, password });

    const res = await user.login({ email, password });

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.status).toBe(200);
    expect(body.message).toBe("Login successful");
    expect(body.data.id).toEqual(expect.any(String));
    expect(body.data.name).toBe(name); // echoed
    expect(body.data.email).toBe(email); // echoed
    expect(body.data.token).toMatch(/^[a-f0-9]{64}$/); // 64-char hex
  });

  test("TC02 - Login with correct email and wrong password", async ({
    request,
  }) => {
    const user = new UserService(request);

    const email = randomEmail();
    const password = randomString(10);
    const name = randomUsername();
    await user.register({ name, email, password });

    const res = await user.login({ email, password: "wrongPassword" });

    expect(res.status()).toBe(401);
    const body = await res.json();
    expect(body.message).toBe("Incorrect email address or password");
  });

  test("TC03 - Login with non-existent user", async ({ request }) => {
    const user = new UserService(request);

    const email = randomEmail();
    const password = randomString(10);

    const res = await user.login({ email, password });

    expect(res.status()).toBe(401);
    const body = await res.json();
    expect(body.message).toBe("Incorrect email address or password");
  });

  test("TC04 - Login with invalid email", async ({ request }) => {
    const user = new UserService(request);

    const email = "notanemail";
    const password = randomString(10);

    const res = await user.login({ email, password });

    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.message).toBe("A valid email address is required");
  });

  test("TC05 - Login with empty email input", async ({ request }) => {
    const user = new UserService(request);

    const email = "";
    const password = randomString(10);

    const res = await user.login({ email, password });

    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.message).toBe("A valid email address is required");
  });

  test("TC06 - Login with empty password input", async ({ request }) => {
    const user = new UserService(request);

    const email = randomEmail();
    const password = "";

    const res = await user.login({ email, password });

    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.message).toBe("Password must be between 6 and 30 characters");
  });

  test("TC07 - Login with empty inputs", async ({ request }) => {
    const user = new UserService(request);

    const email = "";
    const password = "";

    const res = await user.login({ email, password });

    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.message).toBe("A valid email address is required"); // email validator wins the race
  });
});
