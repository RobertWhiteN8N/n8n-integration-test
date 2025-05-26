// Automation Test Script for the Provided Test Case using Playwright (Page Object Model)
// ======================================================
// Please FILL IN the actual test details below as per your requirements.

// Test Title: Sample Placeholder Test Case
// Preconditions: User is on the Login Page

// Test Steps: 
// Step 1:
//  - Step: Enter username and password
//  - Expected Results: Username and password fields accept input

// Step 2:
//  - Step: Click the Login button
//  - Expected Results: User is directed to the Dashboard page

// Step 3:
//  - Step: Verify Dashboard Welcome Message
//  - Expected Results: Dashboard page displays a welcome message

// ===== Test Data =====
const testDataSet = [
  // Positive Test Case
  {
    description: "Valid login credentials",
    username: "testuser",
    password: "correctpassword",
    expectSuccess: true,
    expectWelcome: true
  },
  // Negative Test Case
  {
    description: "Invalid password",
    username: "testuser",
    password: "wrongpassword",
    expectSuccess: false,
    expectWelcome: false
  },
  // Edge Case: Empty username
  {
    description: "Empty username",
    username: "",
    password: "anyPassword",
    expectSuccess: false,
    expectWelcome: false
  },
  // Edge Case: Empty password
  {
    description: "Empty password",
    username: "testuser",
    password: "",
    expectSuccess: false,
    expectWelcome: false
  },
  // Edge Case: Both fields empty
  {
    description: "Both fields empty",
    username: "",
    password: "",
    expectSuccess: false,
    expectWelcome: false
  }
];

// ===== Page Object Classes =====

// LoginPage: Represents the Login page and its actions.
class LoginPage {
  /**
   * @param {import('@playwright/test').Page} page 
   */
  constructor(page) {
    this.page = page;
    this.usernameInput = page.locator('#username'); // Update selector as per app
    this.passwordInput = page.locator('#password'); // Update selector as per app
    this.loginButton = page.locator('button[type=submit]'); // Update selector as per app
    this.errorMessage = page.locator('.error-message'); // Update selector as per app
  }
  async goto() {
    await this.page.goto('https://your-app-url/login'); // Update URL as per app
    console.log('Navigated to Login Page');
  }
  async fillUsername(username) {
    await this.usernameInput.fill(username);
    console.log('Entered username:', username);
  }
  async fillPassword(password) {
    await this.passwordInput.fill(password);
    console.log('Entered password:', password ? '[PROVIDED]' : '[EMPTY]');
  }
  async clickLogin() {
    await this.loginButton.click();
    console.log('Clicked Login Button');
  }
  async getErrorMessage() {
    if(await this.errorMessage.isVisible()) {
      return await this.errorMessage.textContent();
    }
    return '';
  }
}

// DashboardPage: Represents the Dashboard and its actions.
class DashboardPage {
  /**
   * @param {import('@playwright/test').Page} page 
   */
  constructor(page) {
    this.page = page;
    this.welcomeMessage = page.locator('.welcome-message'); // Update selector as per app
  }
  async isWelcomeMessageVisible() {
    return await this.welcomeMessage.isVisible();
  }
  async getWelcomeMessageText() {
    if(await this.welcomeMessage.isVisible()) {
      return await this.welcomeMessage.textContent();
    }
    return '';
  }
}

// ===== Playwright Test Script =====
const { test, expect } = require('@playwright/test');

test.describe('Login Functionality (Data Driven)', () => {
  for(const data of testDataSet) {
    test(`Login Test - ${data.description}`, async ({ page }) => {
      // Instantiate Page Objects
      const loginPage = new LoginPage(page);
      const dashboardPage = new DashboardPage(page);

      // Step 1: Navigate to Login Page
      await loginPage.goto();

      // Step 1: Enter username and password
      await loginPage.fillUsername(data.username);
      await loginPage.fillPassword(data.password);

      // (Optional) Check if fields accepted input (cannot be asserted directly unless field constraints)

      // Step 2: Click Login Button
      await loginPage.clickLogin();

      // Depending on application, you may need to wait for navigation or error message
      if(data.expectSuccess) {
        // Wait for possible navigation to dashboard
        await expect(page).toHaveURL(/dashboard/, { timeout: 5000 });
        console.log('Login was successful. Navigated to dashboard.');
        
        // Step 3: Verify Welcome Message
        const welcomeVisible = await dashboardPage.isWelcomeMessageVisible();
        expect(welcomeVisible, 'Dashboard should display welcome message').toBeTruthy();

        if(data.expectWelcome) {
          const welcomeText = await dashboardPage.getWelcomeMessageText();
          expect(welcomeText).toContain('Welcome'); // Update expected text as per app
          console.log('Dashboard welcome message:', welcomeText);
        }
      } else {
        // Should stay on login or show error
        // (Optionally, check not dashboard)
        await expect(page).not.toHaveURL(/dashboard/, { timeout: 2000 });
        const errorMsg = await loginPage.getErrorMessage();
        expect(errorMsg, "Expected error message to be shown").toBeTruthy();
        console.log('Login failed, error message:', errorMsg);
      }
    });
  }
});

// ===== End of Script =====
// - Place this file in your tests folder.
// - Replace selector strings and URLs with those matching your application.
// - Run with Playwright Test Runner.
// - Logging output will be visible in the console for each test execution.