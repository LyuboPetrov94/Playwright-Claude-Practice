import { test, expect } from "../../../fixtures";
import {
  randomString,
  randomEmail,
  randomUsername,
} from "../../../helpers/data";
import { UserService } from "../../../services/UserService";

test.describe("Notes API - user registration", () => {
  let name: string;
  let email: string;
  let password: string;

  test.beforeEach(() => {
    name = randomUsername();
    email = randomEmail();
    password = randomString(10);
  });

  test("TC01 - register a new user successfully", async ({ request }) => {
    const user = new UserService(request);
    const register = await user.register({ name, email, password });
    expect(register.status()).toBe(201);

    const body = await register.json();
    expect(body.success).toBe(true);
    expect(body.status).toBe(201);
    expect(body.message).toBe("User account created successfully");
    expect(body.data.name).toBe(name);
    expect(body.data.email).toBe(email);
    expect(body.data.id).toEqual(expect.any(String)); // 24-char MongoDB ObjectId — Swagger example showing integer is stale
  });

  const passwordBVA = [
    {
      tc: "TC02",
      length: 5,
      status: 400,
      message: "Password must be between 6 and 30 characters",
    },
    {
      tc: "TC03",
      length: 6,
      status: 201,
      message: "User account created successfully",
    },
    {
      tc: "TC04",
      length: 7,
      status: 201,
      message: "User account created successfully",
    },
    {
      tc: "TC05",
      length: 29,
      status: 201,
      message: "User account created successfully",
    },
    {
      tc: "TC06",
      length: 30,
      status: 201,
      message: "User account created successfully",
    },
    {
      tc: "TC07",
      length: 31,
      status: 400,
      message: "Password must be between 6 and 30 characters",
    },
  ];

  for (const { tc, length, status, message } of passwordBVA) {
    test(`${tc} - password length ${length}`, async ({ request }) => {
      const name = randomUsername();
      const email = randomEmail();
      const password = randomString(length);
      const user = new UserService(request);
      const res = await user.register({ name, email, password });
      expect(res.status()).toBe(status);
      expect((await res.json()).message).toBe(message);
    });
  }

  const nameBVA = [
    {
      tc: "TC08",
      length: 3,
      status: 400,
      message: "User name must be between 4 and 30 characters",
    },
    {
      tc: "TC09",
      length: 4,
      status: 201,
      message: "User account created successfully",
    },
    {
      tc: "TC10",
      length: 5,
      status: 201,
      message: "User account created successfully",
    },
    {
      tc: "TC11",
      length: 29,
      status: 201,
      message: "User account created successfully",
    },
    {
      tc: "TC12",
      length: 30,
      status: 201,
      message: "User account created successfully",
    },
    {
      tc: "TC13",
      length: 31,
      status: 400,
      message: "User name must be between 4 and 30 characters",
    },
  ];

  for (const { tc, length, status, message } of nameBVA) {
    test(`${tc} - name length ${length}`, async ({ request }) => {
      const name = randomString(length);
      const email = randomEmail();
      const password = randomString(10);
      const user = new UserService(request);
      const res = await user.register({ name, email, password });
      expect(res.status()).toBe(status);
      expect((await res.json()).message).toBe(message);
    });
  }

  test("TC14 - register with invalid email", async ({ request }) => {
    email = "notanemail";

    const user = new UserService(request);
    const res = await user.register({ name, email, password });
    expect(res.status()).toBe(400);
    expect((await res.json()).message).toBe(
      "A valid email address is required",
    );
  });

  test("TC15 - register with empty name", async ({ request }) => {
    name = "";

    const user = new UserService(request);
    const res = await user.register({ name, email, password });
    expect(res.status()).toBe(400);
    expect((await res.json()).message).toBe(
      "User name must be between 4 and 30 characters",
    );
  });

  test("TC16 - register with empty email", async ({ request }) => {
    email = "";

    const user = new UserService(request);
    const res = await user.register({ name, email, password });
    expect(res.status()).toBe(400);
    expect((await res.json()).message).toBe(
      "A valid email address is required",
    );
  });

  test("TC17 - register with empty password", async ({ request }) => {
    password = "";

    const user = new UserService(request);
    const res = await user.register({ name, email, password });
    expect(res.status()).toBe(400);
    expect((await res.json()).message).toBe(
      "Password must be between 6 and 30 characters",
    );
  });

  test("TC18 - Register twice with the same email", async ({ request }) => {
    // Self-contained: the test creates its own duplicate target so the assertion
    // doesn't depend on a pre-existing account on the practice site.
    const user = new UserService(request);
    const register = await user.register({ name, email, password });
    expect(register.status()).toBe(201);

    const register2 = await user.register({ name, email, password });
    expect(register2.status()).toBe(409);
    expect((await register2.json()).message).toBe(
      "An account already exists with the same email address",
    );
  });

  test("TC19 - name, password and email invalid", async ({ request }) => {
    name = "abc";
    email = "x";
    password = "abcd";

    const user = new UserService(request);
    const res = await user.register({ name, email, password });
    expect(res.status()).toBe(400);
    expect((await res.json()).message).toBe(
      "User name must be between 4 and 30 characters", // name validator wins
    );
  });
});
