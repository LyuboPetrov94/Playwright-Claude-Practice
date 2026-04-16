import { test, expect } from '../../../fixtures';
import { RegisterPage } from '../../../pages/RegisterPage';

/**
 * Registration tests for https://practice.expandtesting.com/register
 *
 * Username rules: lowercase letters, numbers, single hyphens; 3–39 chars;
 * cannot start/end with hyphen or contain consecutive hyphens.
 * Password: minimum 4 characters. Confirm password must match.
 *
 * Success: redirects to /login with flash "Successfully registered, you can log in now."
 * Failure: stays on /register with error flash.
 *
 * Test cases:
 *   - Equivalence Partitioning: valid classes   (TC01–TC05)
 *   - Equivalence Partitioning: invalid classes  (TC06–TC12)
 *   - Boundary Value Analysis: username length   (TC13–TC16)
 *   - Boundary Value Analysis: password length   (TC17–TC18)
 */

const PASSWORD = 'Pass1234';

/** Maps each timestamp digit to a letter (0→a … 9→j) for all-letter usernames. */
function lettersOnly(): string {
  return Date.now()
    .toString()
    .split('')
    .map((d) => String.fromCharCode(97 + Number(d)))
    .join('');
}

test.describe('Registration', () => {
  let registerPage: RegisterPage;

  test.beforeEach(async ({ page }) => {
    registerPage = new RegisterPage(page);
    await registerPage.goto();
  });

  // ─── Equivalence Partitioning: Valid classes ──────────────────────────────

  test('TC01 - Successful registration with letters and numbers', async ({ page }) => {
    // EP: valid class — mixed alphanumeric username
    const username = `user${Date.now()}`;
    await registerPage.register(username, PASSWORD, PASSWORD);

    await expect(page).toHaveURL(/\/login/);
    await expect(registerPage.getFlashMessage()).toContainText(
      'Successfully registered, you can log in now.'
    );
  });

  test('TC02 - Successful registration with only letters', async ({ page }) => {
    // EP: valid class — letters-only username
    const username = lettersOnly();
    await registerPage.register(username, PASSWORD, PASSWORD);

    await expect(page).toHaveURL(/\/login/);
    await expect(registerPage.getFlashMessage()).toContainText(
      'Successfully registered'
    );
  });

  test('TC03 - Successful registration with only numbers', async ({ page }) => {
    // EP: valid class — numbers-only username
    const username = Date.now().toString();
    await registerPage.register(username, PASSWORD, PASSWORD);

    await expect(page).toHaveURL(/\/login/);
    await expect(registerPage.getFlashMessage()).toContainText(
      'Successfully registered'
    );
  });

  test('TC04 - Successful registration with hyphenated username', async ({ page }) => {
    // EP: valid class — single hyphens in username
    const username = `test-${Date.now().toString(36)}`;
    await registerPage.register(username, PASSWORD, PASSWORD);

    await expect(page).toHaveURL(/\/login/);
    await expect(registerPage.getFlashMessage()).toContainText(
      'Successfully registered'
    );
  });

  test('TC05 - Successful registration with uppercase username', async ({ page }) => {
    // EP: valid class — server normalises uppercase to lowercase
    const username = lettersOnly().toUpperCase();
    await registerPage.register(username, PASSWORD, PASSWORD);

    await expect(page).toHaveURL(/\/login/);
    await expect(registerPage.getFlashMessage()).toContainText(
      'Successfully registered'
    );
  });

  // ─── Equivalence Partitioning: Invalid classes ────────────────────────────

  test('TC06 - All fields empty shows required error', async () => {
    // EP: invalid class — empty inputs
    await registerPage.register('', '', '');

    await expect(registerPage.getFlashMessage()).toContainText(
      'All fields are required.'
    );
  });

  test('TC07 - Mismatched passwords shows error', async () => {
    // EP: invalid class — confirm password ≠ password
    await registerPage.register(`user${Date.now()}`, PASSWORD, 'Different1');

    await expect(registerPage.getFlashMessage()).toContainText(
      'Passwords do not match.'
    );
  });

  test('TC08 - Username with special characters shows error', async () => {
    // EP: invalid class — characters outside allowed set
    await registerPage.register('test@user!', PASSWORD, PASSWORD);

    await expect(registerPage.getFlashMessage()).toContainText(
      'Invalid username'
    );
  });

  test('TC09 - Username starting with hyphen shows error', async () => {
    // EP: invalid class — leading hyphen
    await registerPage.register('-testuser', PASSWORD, PASSWORD);

    await expect(registerPage.getFlashMessage()).toContainText(
      'Invalid username'
    );
  });

  test('TC10 - Username ending with hyphen shows error', async () => {
    // EP: invalid class — trailing hyphen
    await registerPage.register('testuser-', PASSWORD, PASSWORD);

    await expect(registerPage.getFlashMessage()).toContainText(
      'Invalid username'
    );
  });

  test('TC11 - Username with consecutive hyphens shows error', async () => {
    // EP: invalid class — double hyphens
    await registerPage.register('test--user', PASSWORD, PASSWORD);

    await expect(registerPage.getFlashMessage()).toContainText(
      'Invalid username'
    );
  });

  test('TC12 - Duplicate username shows error', async ({ page }) => {
    // EP: invalid class — username already taken
    const username = `dup${Date.now().toString(36)}`;

    // First registration — success
    await registerPage.register(username, PASSWORD, PASSWORD);
    await expect(page).toHaveURL(/\/login/);

    // Return to register and try the same username
    await registerPage.goto();
    await registerPage.register(username, PASSWORD, PASSWORD);

    await expect(registerPage.getFlashMessage()).toContainText(
      'An error occurred during registration'
    );
  });

  // ─── Boundary Value Analysis: Username length (3–39) ──────────────────────

  test('TC13 - Username with 2 characters is rejected', async () => {
    // BVA: below minimum (3)
    await registerPage.register('ab', PASSWORD, PASSWORD);

    await expect(registerPage.getFlashMessage()).toContainText(
      'Username must be at least 3 characters long.'
    );
  });

  test('TC14 - Username with 3 characters is accepted', async ({ page }) => {
    // BVA: at minimum (3)
    const username = Date.now().toString(36).slice(-3);
    await registerPage.register(username, PASSWORD, PASSWORD);

    await expect(page).toHaveURL(/\/login/);
    await expect(registerPage.getFlashMessage()).toContainText(
      'Successfully registered'
    );
  });

  test('TC15 - Username with 39 characters is accepted', async ({ page }) => {
    // BVA: at maximum (39)
    const base = Date.now().toString(36);
    const username = base.repeat(5).slice(0, 39);
    await registerPage.register(username, PASSWORD, PASSWORD);

    await expect(page).toHaveURL(/\/login/);
    await expect(registerPage.getFlashMessage()).toContainText(
      'Successfully registered'
    );
  });

  test('TC16 - Username with 40 characters is rejected', async () => {
    // BVA: above maximum (39)
    const username = 'a'.repeat(40);
    await registerPage.register(username, PASSWORD, PASSWORD);

    await expect(registerPage.getFlashMessage()).toContainText(
      'Invalid username'
    );
  });

  // ─── Boundary Value Analysis: Password length (min 4) ─────────────────────

  test('TC17 - Password with 3 characters is rejected', async () => {
    // BVA: below minimum (4)
    await registerPage.register(`user${Date.now()}`, 'Ab1', 'Ab1');

    await expect(registerPage.getFlashMessage()).toContainText(
      'Password must be at least 4 characters long.'
    );
  });

  test('TC18 - Password with 4 characters is accepted', async ({ page }) => {
    // BVA: at minimum (4)
    await registerPage.register(`user${Date.now()}`, 'Ab1x', 'Ab1x');

    await expect(page).toHaveURL(/\/login/);
    await expect(registerPage.getFlashMessage()).toContainText(
      'Successfully registered'
    );
  });
});
