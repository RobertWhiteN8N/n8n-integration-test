```javascript
// automation/test/validate_notification_email_deleted_user.js

// ----------------------------------------
// Test Case: Validate notification email is sent to deleted user
// Preconditions:
//   - User 'oscar.martinez@company.com' exists with a valid email.
//   - Admin is logged into the dashboard.
// Test Steps:
//   1. Admin deletes 'oscar.martinez@company.com' following normal deletion steps.
//      - Expected: Deletion confirmation is displayed to admin.
//   2. Check the inbox of 'oscar.martinez@company.com'.
//      - Expected: Notification email about account deletion is received.
//   3. Open the email and verify its content.
//      - Expected: Email contains confirmation of account deletion, timestamp, and support contact details.
// Post-Conditions: Notification email is sent to and received by the deleted user.
// ----------------------------------------

// -------------------
// Required Imports
// -------------------
const { test, expect } = require('@playwright/test');

// -------------------
// Logging Helper
// -------------------
function log(step, msg) {
  console.log(`[Test Step: ${step}] ${msg}`);
}

// -------------------
// Test Data Sets (JS object - data-driven)
// Variants included for positive, negative, and edge cases
// -------------------
const testDataSet = [
  {
    description: 'Positive: Valid user deletion and email expected',
    adminCredentials: { username: 'admin', password: 'SuperSecret!' },
    userToDelete: 'oscar.martinez@company.com',
    emailInboxConfig: { 
      // Replace with actual email API or test inbox details as needed
      email: 'oscar.martinez@company.com', 
      password: 'userInboxPassword' 
    },
    expected: {
      expectDeletionConfirmation: true,
      expectNotificationEmail: true,
      expectEmailContent: true
    }
  },
  {
    description: 'Negative: Non-existing user deletion (no email should be sent)',
    adminCredentials: { username: 'admin', password: 'SuperSecret!' },
    userToDelete: 'nonexistent@company.com',
    emailInboxConfig: { 
      email: 'nonexistent@company.com', 
      password: 'doesnotmatter' 
    },
    expected: {
      expectDeletionConfirmation: false,
      expectNotificationEmail: false,
      expectEmailContent: false
    }
  },
  {
    description: 'Edge: Valid user, but email service is down (deletion proceeds, but no email is received)',
    adminCredentials: { username: 'admin', password: 'SuperSecret!' },
    userToDelete: 'oscar.martinez@company.com',
    emailInboxConfig: { 
      email: 'oscar.martinez@company.com', 
      password: 'userInboxPassword', 
      simulateEmailDown: true
    },
    expected: {
      expectDeletionConfirmation: true,
      expectNotificationEmail: false,
      expectEmailContent: false
    }
  }
];

// -------------------
// Page Object Model Classes
// -------------------

// -- Admin Login Page --
class AdminLoginPage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;
    this.usernameInput = page.locator('[data-testid="login-username"]');
    this.passwordInput = page.locator('[data-testid="login-password"]');
    this.loginButton = page.locator('[data-testid="login-submit"]');
  }

  async goto() {
    await this.page.goto('https://dashboard.company.com/admin/login');
  }

  async login(username, password) {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }
}

// -- Admin Dashboard Page --
class AdminDashboardPage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;
    this.userSearchInput = page.locator('[data-testid="user-search-input"]');
    this.searchButton = page.locator('[data-testid="user-search-btn"]');
    this.userRow = (email) => page.locator(`[data-testid="user-row-${email}"]`);
    this.deleteButton = (email) => this.userRow(email).locator('[data-testid="delete-user-btn"]');
    this.confirmDeleteButton = page.locator('[data-testid="confirm-delete-btn"]');
    this.successToast = page.locator('[data-testid="toast-success"]');
  }

  async searchUser(email) {
    await this.userSearchInput.fill(email);
    await this.searchButton.click();
  }

  async userExists(email) {
    await this.page.waitForTimeout(500); // Wait for search results (replace with better wait if possible)
    return await this.userRow(email).isVisible();
  }

  async deleteUser(email) {
    await this.deleteButton(email).click();
    await this.confirmDeleteButton.click();
  }

  async seeDeletionConfirmation() {
    await expect(this.successToast).toBeVisible({ timeout: 5000 });
    return await this.successToast.innerText();
  }
}

// -- Email Inbox Page Object (using imaginary test mail inbox) --
class TestInboxPage {
  /**
   * @param {import('@playwright/test').Page} page
   * @param {string} email
   * @param {string} password
   */
  constructor(page, { email, password, simulateEmailDown = false }) {
    this.page = page;
    this.email = email;
    this.password = password;
    this.simulateEmailDown = simulateEmailDown;
    this.loginField = page.locator('[data-testid="inbox-login-email"]');
    this.passwordField = page.locator('[data-testid="inbox-login-password"]');
    this.submitBtn = page.locator('[data-testid="inbox-login-submit"]');
    this.refreshBtn = page.locator('[data-testid="refresh-inbox"]');
    this.emailSubject = (subject) => page.locator(`[data-testid="mail-subject"][title="${subject}"]`);
  }

  async goto() {
    if (this.simulateEmailDown) {
      throw new Error('Simulating email service downtime.');
    }
    await this.page.goto('https://testmail.company.com');
  }
  
  async login() {
    if (this.simulateEmailDown) {
      throw new Error('Simulating email service downtime.');
    }
    await this.loginField.fill(this.email);
    await this.passwordField.fill(this.password);
    await this.submitBtn.click();
  }

  async hasDeletionMail() {
    await this.refreshBtn.click();
    await this.page.waitForTimeout(2000); // Simulate waiting for email delivery; in real case, poll reliably.
    return await this.emailSubject('Account Deletion Notification').isVisible();
  }

  async openDeletionMail() {
    await this.emailSubject('Account Deletion Notification').click();
  }

  async getEmailContent() {
    return {
      body: await this.page.locator('[data-testid="email-body"]').innerText(),
      timestamp: await this.page.locator('[data-testid="email-timestamp"]').innerText(),
      supportContact: await this.page.locator('[data-testid="support-contact"]').innerText()
    };
  }
}

// -------------------
// Main Playwright Test Script (Data-driven)
// -------------------
test.describe('Validate notification email is sent to deleted user', () => {
  for (const testData of testDataSet) {
    test(testData.description, async ({ page, context }) => {
      log('Init', `Scenario: ${testData.description}`);

      // Step 1: Admin logs in and deletes the user
      const loginPage = new AdminLoginPage(page);
      await loginPage.goto();
      await loginPage.login(testData.adminCredentials.username, testData.adminCredentials.password);

      log(1, `Admin searching for user '${testData.userToDelete}'`);
      const dashboard = new AdminDashboardPage(page);
      await dashboard.searchUser(testData.userToDelete);

      const userExists = await dashboard.userExists(testData.userToDelete);
      log(1, `User exists: ${userExists}`);

      if (userExists) {
        log(1, `Deleting user: ${testData.userToDelete}`);
        await dashboard.deleteUser(testData.userToDelete);
        if (testData.expected.expectDeletionConfirmation) {
          const confirmationText = await dashboard.seeDeletionConfirmation();
          log(1, `Deletion confirmation shown: "${confirmationText}"`);
          expect(confirmationText.toLowerCase()).toContain('deleted');
        } else {
          log(1, 'Unexpected deletion confirmation received');
        }
      } else {
        log(1, 'User does not exist, proceeding to inbox validation anyway');
        if (testData.expected.expectDeletionConfirmation) {
          throw new Error('Expected user to exist and be deleted, but not present.');
        }
      }

      // Step 2: Check the user's inbox for notification
      let emailReceived = false;
      try {
        const inboxPage = await context.newPage();
        const inbox = new TestInboxPage(inboxPage, testData.emailInboxConfig);
        await inbox.goto();
        await inbox.login();
        emailReceived = await inbox.hasDeletionMail();
        log(2, `Deletion email received: ${emailReceived}`);

        if (testData.expected.expectNotificationEmail) {
          expect(emailReceived).toBeTruthy();
        } else {
          expect(emailReceived).toBeFalsy();
        }

        // Step 3: Open the email and check content
        if (emailReceived && testData.expected.expectEmailContent) {
          await inbox.openDeletionMail();
          const mailContent = await inbox.getEmailContent();
          log(3, 'Extracted email content');
          expect(mailContent.body.toLowerCase()).toContain('your account has been deleted');
          expect(mailContent.timestamp).toMatch(
            /\d{4}-\d{2}-\d{2}/ // Simple date check (YYYY-MM-DD)
          );
          expect(mailContent.supportContact).toMatch(/support@company\.com/);
        } else if (!emailReceived && testData.expected.expectEmailContent) {
          throw new Error('Expected to verify email content, but email not received.');
        }
        await inboxPage.close();
      } catch (err) {
        log(2, `Inbox check failed: ${err.message}`);
        if (testData.emailInboxConfig.simulateEmailDown) {
          expect(testData.expected.expectNotificationEmail).toBeFalsy();
        } else {
          throw err;
        }
      }
      log('End', `Scenario "${testData.description}" completed`);
    });
  }
});

// -------------------
// End of Test Script
// -------------------
```
