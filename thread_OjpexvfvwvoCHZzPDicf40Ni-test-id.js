// ====================================================================
// Automated Playwright Test Script generated using Page Object Model
// Test Case: Register New User - End-to-End Flow
// ====================================================================
//
// Test Title: Register New User - End-to-End Flow
// Preconditions:
//   - User is on the Home page of the web application
//
// Test Steps & Expected Results:
//   Step 1:
//     Step: Click "Register" on the Home page
//     Expected Result: The Registration page is displayed
//   Step 2:
//     Step: Enter registration details (username, password, email) and submit
//     Expected Result: Registration is accepted, and the user proceeds to the post-registration Welcome page
//   Step 3:
//     Step: Verify user is greeted with a personalized welcome message
//     Expected Result: Welcome message contains the entered username
//
// ====================================================================
// Page Object Classes: HomePage, RegistrationPage, WelcomePage
// Data-driven approach for various scenarios for the registration process
// Logging included for visibility
// ====================================================================

// -------------------- Import Playwright Test API --------------------
const { test, expect } = require('@playwright/test');

// -------------------- Test Data Set --------------------
// - Positive, negative, and edge cases for registration
const registrationTestData = [
  // POSITIVE CASE: All valid fields
  {
    tc: 'Valid user registration',
    username: 'newUser123',
    password: 'ValidP@ssw0rd!',
    email: 'newuser123@example.com',
    expectedSuccess: true,
    expectedMessage: 'Welcome, newUser123'
  },
  // NEGATIVE CASE: Username already exists
  {
    tc: 'Username already taken',
    username: 'existingUser',
    password: 'AnyValid1!',
    email: 'uniqueemail@example.com',
    expectedSuccess: false,
    expectedError: 'Username already exists'
  },
  // NEGATIVE CASE: Invalid email format
  {
    tc: 'Invalid email',
    username: 'newUser998',
    password: 'SomePass123!',
    email: 'notanemail',
    expectedSuccess: false,
    expectedError: 'Enter a valid email address'
  },
  // EDGE CASE: Password too short
  {
    tc: 'Short password',
    username: 'tinyPwdUser',
    password: '123',
    email: 'user1shortpwd@example.com',
    expectedSuccess: false,
    expectedError: 'Password must be at least 8 characters'
  },
  // EDGE CASE: Empty username
  {
    tc: 'Empty username',
    username: '',
    password: 'ValidP@ss999',
    email: 'emptyusername@example.com',
    expectedSuccess: false,
    expectedError: 'Username is required'
  },
];

// -------------------- Page Object Model Classes --------------------

// HomePage Class
class HomePage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;
    this.registerBtn = page.locator('text=Register');
  }

  async goto(url) {
    await this.page.goto(url);
  }

  async clickRegister() {
    console.log('Clicking Register button');
    await this.registerBtn.click();
  }
}

// RegistrationPage Class
class RegistrationPage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;
    this.usernameInput = page.locator('input[name="username"]');
    this.passwordInput = page.locator('input[name="password"]');
    this.emailInput = page.locator('input[name="email"]');
    this.submitBtn = page.locator('button[type="submit"]');
    this.errorMsg = page.locator('.error-message'); // Assumes an error message shows up
  }

  async fillRegistrationForm(username, password, email) {
    console.log('Filling registration form', { username, password, email });
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.emailInput.fill(email);
  }

  async submit() {
    console.log('Submitting registration form');
    await this.submitBtn.click();
  }

  async getErrorMessage() {
    if (await this.errorMsg.isVisible())
      return await this.errorMsg.textContent();
    return '';
  }
}

// WelcomePage Class
class WelcomePage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;
    this.welcomeMessage = page.locator('[data-testid="welcome-message"]');
  }

  async getWelcomeText() {
    return await this.welcomeMessage.textContent();
  }
}

// -------------------- Test Implementation --------------------

test.describe('Register New User - End-to-End Flow', () => {
  for (const data of registrationTestData) {
    test(`${data.tc}`, async ({ page }) => {
      // Step 1: Navigate to home and click Register
      const home = new HomePage(page);
      const baseUrl = 'https://example.com'; // Replace with real base URL
      await home.goto(baseUrl);
      await home.clickRegister();

      // Expect Registration page to be visible
      const registration = new RegistrationPage(page);
      await expect(registration.usernameInput).toBeVisible();

      // Step 2: Fill out registration and submit
      await registration.fillRegistrationForm(data.username, data.password, data.email);
      await registration.submit();

      // Step 3: Positive and negative scenarios
      if (data.expectedSuccess) {
        // On successful registration, WelcomePage should show personalized message
        const welcome = new WelcomePage(page);
        await expect(welcome.welcomeMessage).toBeVisible();
        const text = await welcome.getWelcomeText();
        expect(text).toContain(data.expectedMessage);
        console.log(`✅ [${data.tc}] Successful registration verified`);
      } else {
        // On error, error message should be visible
        await expect(registration.errorMsg).toBeVisible();
        const err = await registration.getErrorMessage();
        expect(err).toContain(data.expectedError);
        console.log(`✅ [${data.tc}] Registration error message verified: ${err}`);
      }
    });
  }
});

// ====================================================================
// End of test script
// ====================================================================

/**
 * NOTES:
 * - Locators (selectors) and baseUrl must be updated as per the actual application.
 * - The error message selector '.error-message' and '[data-testid="welcome-message"]' 
 *   are examples and should be set to match your implementation.
 * - Data-driven: Easily add/remove/modify scenarios in the test data array.
 * - Logs facilitate debugging in CI pipelines or local runs.
 */