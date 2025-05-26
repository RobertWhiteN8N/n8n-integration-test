// Filename: login.test.js

// ************************************************************************************************
// Test Title: Login Functionality - Validate User Login with Different Credential Sets
// Preconditions: User is on the Login page of the application
// Test Steps:
// Step 1: Enter Username and Password
//     Expected Results: Username and Password fields accept input as per given data
// Step 2: Click on Login Button
//     Expected Results: System attempts to authenticate user and shows corresponding UI feedback
// Step 3: Observe Authentication Outcome
//     Expected Results: 
//         - For valid credentials: Redirect to dashboard and display dashboard elements
//         - For invalid credentials: Show error message (e.g. "Invalid username or password")
// ************************************************************************************************

const { test, expect } = require('@playwright/test');

// ************************************************************************************************
// Page Object Model - LoginPage
// Encapsulates elements and actions for the Login page
// ************************************************************************************************

class LoginPage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;
    this.usernameInput = page.locator('input[name="username"]');
    this.passwordInput = page.locator('input[name="password"]');
    this.loginButton = page.locator('button[type="submit"]');
    this.errorMessage = page.locator('.login-error'); // Selector for error message
  }

  async navigate(url) {
    console.log(`[LoginPage] Navigating to ${url}`);
    await this.page.goto(url);
  }

  async enterUsername(username) {
    console.log(`[LoginPage] Entering username: ${username}`);
    await this.usernameInput.fill(username);
  }

  async enterPassword(password) {
    console.log(`[LoginPage] Entering password: ${'*'.repeat(password.length)}`);
    await this.passwordInput.fill(password);
  }

  async clickLogin() {
    console.log('[LoginPage] Clicking Login button');
    await this.loginButton.click();
  }

  async isErrorVisible() {
    return await this.errorMessage.isVisible();
  }

  async getErrorMessage() {
    if (await this.isErrorVisible()) {
      return await this.errorMessage.innerText();
    }
    return '';
  }
}

// ************************************************************************************************
// Page Object Model - DashboardPage
// Encapsulates elements and actions for the Dashboard page (post-login)
// ************************************************************************************************

class DashboardPage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;
    this.dashboardHeader = page.locator('h1.dashboard-title');
    this.userMenu = page.locator('.user-menu');
  }

  async isAt() {
    const headerVisible = await this.dashboardHeader.isVisible();
    const userMenuVisible = await this.userMenu.isVisible();
    return headerVisible && userMenuVisible;
  }
}

// ************************************************************************************************
// Test Data Set - Data-driven scenarios (positive, negative, edge cases)
// ************************************************************************************************

const loginTestData = [
  // Positive: Valid credentials
  {
    scenario: 'Valid username and password',
    username: 'user1',
    password: 'correctpass1',
    expectedSuccess: true,
    expectedErrorMsg: ''
  },
  // Negative: Invalid password
  {
    scenario: 'Valid username and invalid password',
    username: 'user1',
    password: 'wrongpass',
    expectedSuccess: false,
    expectedErrorMsg: 'Invalid username or password'
  },
  // Negative: Invalid username
  {
    scenario: 'Invalid username and valid password',
    username: 'wronguser',
    password: 'correctpass1',
    expectedSuccess: false,
    expectedErrorMsg: 'Invalid username or password'
  },
  // Edge case: Empty username
  {
    scenario: 'Empty username field',
    username: '',
    password: 'somepass',
    expectedSuccess: false,
    expectedErrorMsg: 'Username is required'
  },
  // Edge case: Empty password
  {
    scenario: 'Empty password field',
    username: 'user1',
    password: '',
    expectedSuccess: false,
    expectedErrorMsg: 'Password is required'
  },
  // Edge case: Both fields empty
  {
    scenario: 'Both username and password fields empty',
    username: '',
    password: '',
    expectedSuccess: false,
    expectedErrorMsg: 'Username is required'
  }
];

// ************************************************************************************************
// Playwright Test - Data-driven execution using Page Object Model
// ************************************************************************************************

test.describe('Login Functionality - Comprehensive Data-driven Test', () => {
  const LOGIN_URL = 'https://example.com/login';

  for (const data of loginTestData) {
    test(`Login Scenario: ${data.scenario}`, async ({ page }) => {
      const loginPage = new LoginPage(page);
      const dashboardPage = new DashboardPage(page);

      // Step 1: Navigate to login page and fill credentials
      await loginPage.navigate(LOGIN_URL);
      await loginPage.enterUsername(data.username);
      await loginPage.enterPassword(data.password);

      // Step 2: Click Login
      await loginPage.clickLogin();

      // Step 3: Validate outcome
      if (data.expectedSuccess) {
        // For successful login, expect dashboard to be visible
        await expect.poll(async () => await dashboardPage.isAt(), {
          message: 'Waiting for dashboard view after successful login',
          timeout: 5000
        }).toBe(true);

        console.log(`[Test] Successfully logged in with credentials: ${data.username} / ${data.password}`);
      } else {
        // For failure, expect error message to be shown
        await expect(loginPage.errorMessage, 'Expect error message to be visible').toBeVisible();
        const actualErrorMsg = await loginPage.getErrorMessage();
        expect(actualErrorMsg).toContain(data.expectedErrorMsg);
        console.log(`[Test] Login failed as expected with scenario: '${data.scenario}'. Error shown: '${actualErrorMsg}'`);
      }
    });
  }
});

// ************************************************************************************************
// End of login.test.js
// This script employs Page Object Model, covers positive, negative, and edge cases with logging.
// ************************************************************************************************