import { test, expect } from "../../../fixtures";
import { HealthService } from "../../../services/HealthService";

test.describe("Notes API - health check", () => {
  test("TC01 - health-check returns 200 with success body", async ({
    request,
  }) => {
    const health = new HealthService(request);
    const response = await health.check();

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.status).toBe(200);
    expect(body.message).toBe("Notes API is Running");
  });

  const unsupportedMethods = ["POST", "PUT", "PATCH", "DELETE"] as const;
  for (const [index, method] of unsupportedMethods.entries()) {
    const tc = `TC0${index + 2}`; // TC02..TC05
    test(`${tc} — ${method} /health-check is rejected`, async ({ request }) => {
      const health = new HealthService(request);
      const response = await health.sendWithMethod(method);

      expect(response.status()).toBe(404);
    });
  }
});
