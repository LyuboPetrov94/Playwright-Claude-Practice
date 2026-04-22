import { test, expect } from '../../../fixtures';
import { LoginPage } from '../../../pages/LoginPage';

/**
 * Login tests for https://practice.expandtesting.com/login
 *
 * Valid credentials (shown on the page):
 *   username: practice
 *   password: SuperSecretPassword!
 *
 * Test cases:
 *   - Equivalence Partitioning: valid classes   (TC01–TC02)
 *   - Equivalence Partitioning: invalid classes  (TC03–TC08)
 *   - Decision Table: combined invalid inputs    (TC09)
 *   - Whitespace edge cases                      (TC10)
 *   - State Transition: logout                   (TC11)
 *   - State Transition: protected-route access   (TC12–TC13)
 *   - Equivalence Partitioning: password case    (TC14)
 *   - State Transition: session persistence      (TC15)
 */

const VALID_USERNAME = 'practice';
const VALID_PASSWORD = 'SuperSecretPassword!';

test.describe('Login', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
  });

  // ─── Equivalence Partitioning: Valid classes ──────────────────────────────

  test('TC01 - Successful login with valid credentials', async ({ page }) => {
    // EP: valid class — correct username and password
    await loginPage.login(VALID_USERNAME, VALID_PASSWORD);

    await expect(page).toHaveURL(/\/secure/);
    await expect(loginPage.getFlashMessage()).toContainText('You logged into a secure area!');
    await expect(loginPage.getLogoutButton()).toBeVisible();
  });

  test('TC02 - Successful login with uppercase username', async ({ page }) => {
    // EP: valid class — server normalises username to lowercase
    await loginPage.login('Practice', VALID_PASSWORD);

    await expect(page).toHaveURL(/\/secure/);
    await expect(loginPage.getFlashMessage()).toContainText('You logged into a secure area!');
    await expect(loginPage.getLogoutButton()).toBeVisible();
  });

  // ─── Equivalence Partitioning: Invalid classes ────────────────────────────

  test('TC03 - Invalid username shows error', async () => {
    // EP: invalid class — non-existent username
    await loginPage.login('wronguser', VALID_PASSWORD);

    // The site returns a generic password error regardless of which field is wrong —
    // a common security practice to avoid revealing valid usernames to attackers.
    await expect(loginPage.getFlashMessage()).toContainText('Your password is invalid!');
  });

  test('TC04 - Invalid password shows error', async () => {
    // EP: invalid class — wrong password for valid username
    await loginPage.login(VALID_USERNAME, 'wrongpassword');

    await expect(loginPage.getFlashMessage()).toContainText('Your password is invalid!');
  });

  test('TC05 - Both fields empty shows error', async () => {
    // EP: invalid class — empty inputs
    await loginPage.login('', '');

    await expect(loginPage.getFlashMessage()).toContainText('Your username is invalid!');
  });

  test('TC06 - Username empty shows error', async () => {
    // EP: invalid class — empty username with valid password
    await loginPage.login('', VALID_PASSWORD);

    await expect(loginPage.getFlashMessage()).toContainText('Your username is invalid!');
  });

  test('TC07 - Password empty shows error', async () => {
    // EP: invalid class — valid username with empty password
    await loginPage.login(VALID_USERNAME, '');

    await expect(loginPage.getFlashMessage()).toContainText('Your password is invalid!');
  });

  test('TC08 - Username with leading and trailing spaces shows error', async () => {
    // EP: invalid class — whitespace not trimmed by server
    await loginPage.login(' practice ', VALID_PASSWORD);

    await expect(loginPage.getFlashMessage()).toContainText('Your username is invalid!');
  });

  // ─── Decision Table: Combined invalid inputs ──────────────────────────────

  test('TC09 - Both username and password invalid shows error', async () => {
    // Decision table: both fields wrong (non-empty) — server prioritises one error
    await loginPage.login('wronguser', 'wrongpassword');

    await expect(loginPage.getFlashMessage()).toContainText('Your password is invalid!');
  });

  // ─── Whitespace edge cases ────────────────────────────────────────────────

  test('TC10 - Password with trailing space shows error', async () => {
    // Whitespace: password is not trimmed — trailing space makes it invalid
    await loginPage.login(VALID_USERNAME, VALID_PASSWORD + ' ');

    await expect(loginPage.getFlashMessage()).toContainText('Your password is invalid!');
  });

  // ─── State Transition: Logout ─────────────────────────────────────────────

  test('TC11 - Logout after successful login redirects to login page', async ({ page }) => {
    // State Transition: logged-out → logged-in → logged-out
    await loginPage.login(VALID_USERNAME, VALID_PASSWORD);

    await expect(page).toHaveURL(/\/secure/);
    await expect(loginPage.getLogoutButton()).toBeVisible();

    await loginPage.getLogoutButton().click();

    await expect(page).toHaveURL(/\/login/);
    await expect(loginPage.getFlashMessage()).toContainText(
      'You logged out of the secure area!'
    );
  });

  // ─── State Transition: Protected-route access ─────────────────────────────

  test('TC12 - Guest navigating to /secure is redirected to /login', async ({ page }) => {
    // State Transition: guest → /secure → /login
    await loginPage.gotoSecure();

    await expect(page).toHaveURL(/\/login/);
    await expect(loginPage.getFlashMessage()).toContainText(
      'You must login to view the secure area!'
    );
  });

  test('TC13 - After logout, /secure is no longer accessible', async ({ page }) => {
    // State Transition: verifies logout actually invalidates the session,
    // not just performs a visual redirect.
    await loginPage.login(VALID_USERNAME, VALID_PASSWORD);
    await expect(page).toHaveURL(/\/secure/);

    await loginPage.getLogoutButton().click();
    await expect(page).toHaveURL(/\/login/);

    await loginPage.gotoSecure();
    await expect(page).toHaveURL(/\/login/);
    await expect(loginPage.getFlashMessage()).toContainText(
      'You must login to view the secure area!'
    );
  });

  // ─── Equivalence Partitioning: Password case-sensitivity ──────────────────

  test('TC14 - Password in wrong case is rejected (password is case-sensitive)', async () => {
    // EP: complements TC02. Username is case-insensitive on the server;
    // this test pins that password is NOT.
    await loginPage.login(VALID_USERNAME, VALID_PASSWORD.toLowerCase());

    await expect(loginPage.getFlashMessage()).toContainText('Your password is invalid!');
  });

  // ─── State Transition: Session persistence ────────────────────────────────

  test('TC15 - Session persists across a reload of /secure', async ({ page }) => {
    // State Transition: logged-in → reload → still logged-in.
    await loginPage.login(VALID_USERNAME, VALID_PASSWORD);
    await expect(page).toHaveURL(/\/secure/);
    await expect(loginPage.getLogoutButton()).toBeVisible();

    await loginPage.reload();

    await expect(page).toHaveURL(/\/secure/);
    await expect(loginPage.getLogoutButton()).toBeVisible();
  });
});
