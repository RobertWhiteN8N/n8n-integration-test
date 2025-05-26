// ============================================================================
// Playwright Automation Script: Sample Template - User Login and Dashboard Navigation
// Author: Automation QA Engineer
// Purpose: Automate test case with Page Object Model (POM) and data-driven testing
// ============================================================================

// =============================================================================
// Test Case Metadata (as in comments-section for clarity & maintenance):
/*
Test Title: User Login and Dashboard Navigation

Preconditions: 
- User is registered in the system.

Test Steps:
Step 1:
- Step: Navigate to the Login Page and enter username and password, then click "Login".
- Expected Results: The user is redirected to the dashboard if credentials are valid, otherwise an error is displayed.

Step 2:
- Step: On the dashboard, verify the correct username is displayed in the header.
- Expected Results: The dashboard page header contains the correct username.

Step 3:
- Step: Click the "Logout" button.
- Expected Results: The user returns to the login page.
*/
// =============================================================================

// =============================================================================
// Page Object Classes
// =============================================================================

const { test, expect } = require('@playwright/test');

// ----------------------------------------------------------------------------
// LoginPage Class
// Encapsulates all interactions with the Login Page
class LoginPage {
  /**
   * @param {import('@playwright/test').Page} page 
   */
  constructor(page) {
    this.page = page;
    this.usernameInput = page.locator('input[name="username"]');
    this.passwordInput = page.locator('input[name="password"]');
    this.loginButton = page.locator('button[type="submit"]');
    this.errorMessage = page.locator('.error-message');
  }

  async goto() {
    console.log('[INFO] Navigating to Login Page');
    await this.page.goto('https://example.com/login');
  }

  async login(username, password) {
    console.log(`[INFO] Attempting login with username: '${username}'`);
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }

  async getErrorMessage() {
    return await this.errorMessage.textContent();
  }
}

// ----------------------------------------------------------------------------
// DashboardPage Class
// Encapsulates all interactions with the Dashboard Page
class DashboardPage {
  /**
   * @param {import('@playwright/test').Page} page 
   */
  constructor(page) {
    this.page = page;
    this.headerUsername = page.locator('#header-username');
    this.logoutButton = page.locator('button#logout');
  }

  async getHeaderUsername() {
    return await this.headerUsername.textContent();
  }

  async logout() {
    console.log('[INFO] Clicking Logout button');
    await this.logoutButton.click();
  }
}

// =============================================================================
// Test Data Set (Data-Driven Scenarios)
// =============================================================================

// Positive, negative, and edge test data
const loginTestData = [
  {
    description: "Valid login - standard user",
    username: "testuser",
    password: "correctPassword1!",
    expectedResult: "success",
    expectedUsername: "testuser"
  },
  {
    description: "Invalid password (negative case)",
    username: "testuser",
    password: "wrongPassword",
    expectedResult: "login_error",
    expectedError: "Invalid username or password"
  },
  {
    description: "Empty username field (edge case)",
    username: "",
    password: "somePassword",
    expectedResult: "login_error",
    expectedError: "Username is required"
  },
  {
    description: "Empty password field (edge case)",
    username: "testuser",
    password: "",
    expectedResult: "login_error",
    expectedError: "Password is required"
  },
  {
    description: "Special characters in username",
    username: "<script>alert(1)</script>",
    password: "irrelevant",
    expectedResult: "login_error",
    expectedError: "Invalid username format"
  }
];

// =============================================================================
// Main Test Script
// =============================================================================

test.describe('User Login and Dashboard Navigation', () => {
  for (const data of loginTestData) {
    test(`${data.description}`, async ({ page }) => {
      // Instantiate Page Objects
      const loginPage = new LoginPage(page);
      const dashboardPage = new DashboardPage(page);

      // Step 1: Navigate to Login Page and perform login
      await loginPage.goto();
      await loginPage.login(data.username, data.password);

      if (data.expectedResult === 'success') {
        // Step 1: Assert correct redirection to dashboard
        await expect(page).toHaveURL('https://example.com/dashboard');
        console.log('[INFO] Successfully logged in and navigated to Dashboard');

        // Step 2: Verify username in header
        const actualUsername = await dashboardPage.getHeaderUsername();
        expect(actualUsername.trim()).toBe(data.expectedUsername);
        console.log(`[INFO] Dashboard header username: "${actualUsername}" verified.`);

        // Step 3: Logout and check redirection to Login page
        await dashboardPage.logout();
        await expect(page).toHaveURL('https://example.com/login');
        console.log('[INFO] Logout successful, returned to login page');
      } else {
        // Step 1: Assert error message is displayed and correct
        const errorMsg = await loginPage.getErrorMessage();
        expect(errorMsg.trim()).toBe(data.expectedError);
        console.log(`[INFO] Error message displayed as expected: "${errorMsg}"`);
      }
    });
  }
});

// =============================================================================
// End of Script
// =============================================================================

/*
==========================
 Page Object Model Summary
==========================

- LoginPage:
  - Methods: goto(), login(username, password), getErrorMessage()

- DashboardPage:
  - Methods: getHeaderUsername(), logout()

==========================
 Test Data Set Summary
==========================
- loginTestData: Array of objects covering valid, invalid, and edge login cases

==========================
 Usage instructions:
==========================
- Run with: npx playwright test login-dashboard.spec.js
- Ensure base URLs and selectors match your real application
- Adapt error message and username selectors as needed

==========================
 Logging
==========================
- Console log statements are included for each major step
- Use Playwright trace viewer or --debug for step-by-step inspection
*/

