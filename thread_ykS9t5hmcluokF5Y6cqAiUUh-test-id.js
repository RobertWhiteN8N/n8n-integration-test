// =======================================================
// Playwright Automation Script for POM Data-Driven Testing
// Test Title: (Fill in title below)
// Preconditions: (Fill in preconditions below)
//
// Test Steps:
// Step 1:
//   Step: (Describe Step 1 here, including which page/actions)
//   Expected Results: (Describe expected result for Step 1)
// Step 2:
//   Step: (Describe Step 2 here, including which page/actions)
//   Expected Results: (Describe expected result for Step 2)
// Step 3:
//   Step: (Describe Step 3 here, including which page/actions)
//   Expected Results: (Describe expected result for Step 3)
// =======================================================

// =======================================================
// PAGE OBJECT CLASSES
// =======================================================

// Example: LoginPage (Edit selectors & methods according to your actual test case)
class LoginPage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;
    this.usernameInput = page.locator('#username');
    this.passwordInput = page.locator('#password');
    this.loginButton = page.locator('button[type="submit"]');
    this.errorMessage = page.locator('.login-error');
  }

  async goto() {
    await this.page.goto('https://example.com/login');
  }

  async enterUsername(username) {
    await this.usernameInput.fill(username);
  }

  async enterPassword(password) {
    await this.passwordInput.fill(password);
  }

  async clickLogin() {
    await this.loginButton.click();
  }

  async getErrorMessage() {
    return await this.errorMessage.textContent();
  }
}

// Example: DashboardPage (Edit selectors & methods according to your actual test case)
class DashboardPage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;
    this.profileLink = page.locator('a[href="/profile"]');
    this.logoutButton = page.locator('#logout');
  }

  async isLoaded() {
    return await this.profileLink.isVisible();
  }

  async clickProfile() {
    await this.profileLink.click();
  }

  async clickLogout() {
    await this.logoutButton.click();
  }
}

// Example: ProfilePage (Edit selectors & methods according to your actual test case)
class ProfilePage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;
    this.editButton = page.locator('button#edit');
    this.successMessage = page.locator('.success-message');
    this.emailInput = page.locator('input[name="email"]');
    this.saveButton = page.locator('button#save');
  }

  async clickEdit() {
    await this.editButton.click();
  }

  async changeEmail(email) {
    await this.emailInput.fill(email);
  }

  async clickSave() {
    await this.saveButton.click();
  }

  async getSuccessMessage() {
    return await this.successMessage.textContent();
  }
}

// =======================================================
// TEST DATA SET (Positive, Negative, Edge Cases)
// =======================================================

const loginTestData = [
  // Positive case
  {
    description: "Positive: Valid login and edit profile",
    username: "validUser",
    password: "validPassword123",
    newEmail: "validuser@example.com",
    expectLoginSuccess: true,
    expectProfileMsg: "Profile updated successfully."
  },
  // Negative case: Invalid password
  {
    description: "Negative: Invalid password",
    username: "validUser",
    password: "wrongPassword",
    newEmail: "validuser@example.com",
    expectLoginSuccess: false,
    expectedError: "Invalid username or password."
  },
  // Edge case: Empty username
  {
    description: "Edge: Empty username",
    username: "",
    password: "validPassword123",
    newEmail: "validuser@example.com",
    expectLoginSuccess: false,
    expectedError: "Username is required."
  },
  // Edge case: Invalid email format during profile edit
  {
    description: "Edge: Invalid email",
    username: "validUser",
    password: "validPassword123",
    newEmail: "invalid-email",
    expectLoginSuccess: true,
    expectProfileMsg: "Invalid email format."
  }
];

// =======================================================
// TEST SCRIPT USING PLAYWRIGHT & POM
// =======================================================

import { test, expect } from '@playwright/test';

test.describe('Test automation for: (Test Title Here)', () => {
  for (const data of loginTestData) {
    test(data.description, async ({ page }) => {
      // Logging: Start scenario
      console.log('--- Test Scenario: ', data.description, '---');

      // Instantiate page objects
      const loginPage = new LoginPage(page);
      const dashboardPage = new DashboardPage(page);
      const profilePage = new ProfilePage(page);

      // Step 1: Go to login and login as user
      await loginPage.goto();
      await loginPage.enterUsername(data.username);
      await loginPage.enterPassword(data.password);
      await loginPage.clickLogin();

      if (data.expectLoginSuccess) {
        // Verify successful login by checking dashboard loaded
        const dashboardLoaded = await dashboardPage.isLoaded();
        console.log('Dashboard loaded: ', dashboardLoaded);
        expect(dashboardLoaded).toBe(true);

        // Step 2: Navigate to Profile and edit
        await dashboardPage.clickProfile();
        await profilePage.clickEdit();
        await profilePage.changeEmail(data.newEmail);
        await profilePage.clickSave();

        // Step 3: Check success or validation messages
        const profileMsg = await profilePage.getSuccessMessage();
        console.log('Profile update message: ', profileMsg);
        expect(profileMsg?.trim()).toBe(data.expectProfileMsg);
      } else {
        // Negative/Edge: Verify the error message after login attempt
        const errMsg = await loginPage.getErrorMessage();
        console.log('Login error message: ', errMsg);
        expect(errMsg?.trim()).toBe(data.expectedError);
      }
    });
  }
});

// =======================================================
// END OF SCRIPT
// Please update test selectors and page actions according to your actual application.
// =======================================================

/*
Instructions & Mapping:
- Fill in "Test Title" and detailed steps from your test case.
- Adjust selectors in Page Object classes to match your application's DOM.
- Populate the test data array to fully cover your positive/negative/edge cases.
- Run this file with Playwright test runner (npx playwright test <filename>.js)
- All data, classes, logic, and logging in one file.
*/