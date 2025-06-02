```javascript
// automation_profile_email_notification.test.js

// This file demonstrates Playwright test automation using the Page Object Model (POM) for:
// Test Title: Verify email notification is sent after user modifies profile details

// ===============================
// Imports
// ===============================
const { test, expect } = require('@playwright/test');

// ===============================
// Test Data: Diverse Scenarios for Data-Driven Testing
// ===============================
/*
  testData = [
    Positive Case: display name changed
    Edge Case: role/access level changed to unusual value
    Negative Case: changing to an already existing display name (should fail profile update)
  ]
*/
const testData = [
  {
    caseName: "Display name changed - valid",
    currentDisplayName: "Sally Jones",
    newDisplayName: "Sally J.",
    oldRole: "User",
    newRole: "User",
    expectUpdateSuccess: true,
    expectEmail: true,
    expectedEmailFields: {
      sender: 'no-reply@domain.com',
      recipient: 'sally.jones@domain.com',
      summaryIncludes: ["Display name changed from Sally Jones to Sally J."]
    }
  },
  {
    caseName: "Role upgraded to Admin",
    currentDisplayName: "Sally J.",
    newDisplayName: "Sally J.",
    oldRole: "User",
    newRole: "Admin",
    expectUpdateSuccess: true,
    expectEmail: true,
    expectedEmailFields: {
      sender: 'no-reply@domain.com',
      recipient: 'sally.jones@domain.com',
      summaryIncludes: ["Role changed from User to Admin"]
    }
  },
  {
    caseName: "Display name duplicate - should fail",
    currentDisplayName: "Sally J.",
    newDisplayName: "John Doe", // assuming this already exists
    oldRole: "Admin",
    newRole: "Admin",
    expectUpdateSuccess: false,
    expectEmail: false,
    expectedEmailFields: {}
  }
];

// ===============================
// Page Object Model Definitions
// ===============================

// ProfilePage: Encapsulates the Profile Edit screen and actions
class ProfilePage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;
    this.displayNameInput = page.locator('input[name="displayName"]');
    this.roleDropdown = page.locator('select[name="role"]');
    this.saveButton = page.locator('button[type="submit"]');
    this.confirmationAlert = page.locator('.alert-success');
    this.errorAlert = page.locator('.alert-danger');
    this.logoutButton = page.locator('button#logout');
  }

  async goto() {
    await this.page.goto('https://app-under-test.domain.com/profile/edit');
    console.log('-- Navigated to Profile Edit Page');
  }

  async updateProfile({ displayName, role }) {
    if (displayName) {
      await this.displayNameInput.fill(displayName);
      console.log(`-- Set display name to: ${displayName}`);
    }
    if (role) {
      await this.roleDropdown.selectOption({ label: role });
      console.log(`-- Changed role to: ${role}`);
    }
    await this.saveButton.click();
    console.log('-- Clicked to save profile changes');
  }

  async isUpdateSuccessful() {
    return await this.confirmationAlert.isVisible();
  }

  async getErrorMessage() {
    return await this.errorAlert.textContent();
  }

  async confirmLogout() {
    await this.logoutButton.click();
    await this.page.waitForNavigation();
    console.log('-- Logged out current user');
  }
}

// LoginPage: For authentication prior to test activities
class LoginPage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;
    this.emailInput = page.locator('input[name="email"]');
    this.passwordInput = page.locator('input[name="password"]');
    this.loginButton = page.locator('button[type="submit"]');
  }

  async goto() {
    await this.page.goto('https://app-under-test.domain.com/login');
    console.log('-- Navigated to Login Page');
  }

  async login(email, password) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
    await this.page.waitForNavigation();
    console.log(`-- Logged in as: ${email}`);
  }
}

// MailboxPage: Abstracts a test mailbox provider (e.g., Mailinator, MailSlurp)
class MailboxPage {
  /**
   * @param {import('@playwright/test').Page} page
   * @param {String} inboxEmail
   */
  constructor(page, inboxEmail) {
    this.page = page;
    this.inboxEmail = inboxEmail;
    this.mailProviderUrl = `https://www.mailinator.com/v4/public/inboxes.jsp?to=${inboxEmail.split('@')[0]}`;
    this.emailRows = page.locator('div#inboxpane-message-list .message-item');
  }

  async goto() {
    await this.page.goto(this.mailProviderUrl);
    console.log(`-- Navigated to Mailbox for: ${this.inboxEmail}`);
  }

  async refreshInbox() {
    await this.page.reload();
    await this.page.waitForTimeout(4000);
    console.log('-- Refreshed mailbox');
  }

  async openLatestEmail(subjectKeyword) {
    await this.page.waitForSelector('div#inboxpane-message-list .message-item', { timeout: 15000 });
    const emailCount = await this.emailRows.count();
    for (let i = 0; i < emailCount; i++) {
      const subject = await this.emailRows.nth(i).locator('.subject').textContent();
      if (subject.includes(subjectKeyword)) {
        await this.emailRows.nth(i).click();
        await this.page.waitForSelector('#msgpane');
        console.log(`-- Opened email with subject: ${subject}`);
        return true;
      }
    }
    return false;
  }

  async getEmailDetails() {
    const sender = await this.page.locator('#msgpane .from').textContent();
    const recipient = await this.page.locator('#msgpane .to').textContent();
    const body = await this.page.locator('#msgpane .msg-body').textContent();
    return { sender, recipient, body };
  }
}

// ===============================
// Playwright Test Runner Expects
// ===============================

test.describe('Verify email notification sent on profile modification', () => {
  for (const data of testData) {
    test(`${data.caseName}`, async ({ page, browser }) => {
      // Credentials and constants
      const userEmail = 'sally.jones@domain.com';
      const userPassword = 'StrongPassword123'; // in real test, secure this!
      const mailSubjectKeyword = 'Your account profile was updated';

      // Step 1: Login and update profile
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginPage.login(userEmail, userPassword);

      const profilePage = new ProfilePage(page);
      await profilePage.goto();
      await profilePage.updateProfile({ 
        displayName: data.newDisplayName, 
        role: data.newRole 
      });

      if (data.expectUpdateSuccess) {
        // Verify confirmation displayed
        await expect(profilePage.confirmationAlert).toBeVisible();
        // Step 1 expected result
        console.log('>> Profile update succeeded and confirmation displayed');
      } else {
        // Negative case: expect error
        await expect(profilePage.errorAlert).toBeVisible();
        const errorMsg = await profilePage.getErrorMessage();
        expect(errorMsg).toMatch(/already exists/i); // Example error match
        console.log('>> Profile update failed as expected (duplicate display name)');
        // No email expected
        return;
      }

      // Optional: Logout if required by system before mailbox check
      await profilePage.confirmLogout();

      // Step 2: Open mailbox + Step 3: Validate email content
      // (using browser.newPage() to separate sessions and domain navigation issues)
      const inboxPage = await browser.newPage();
      const mailbox = new MailboxPage(inboxPage, userEmail);
      await mailbox.goto();
      let foundEmail = false, details = {};
      // Poll inbox for up to 20 seconds to wait for notification
      for (let retry = 0; retry < 5; ++retry) {
        foundEmail = await mailbox.openLatestEmail(mailSubjectKeyword);
        if (foundEmail) {
          console.log('>> Notification email received');
          details = await mailbox.getEmailDetails();
          break;
        }
        await mailbox.refreshInbox();
      }
      if (!data.expectEmail) {
        expect(foundEmail).toBeFalsy();
        console.log('>> No email, as expected for failed update');
        await inboxPage.close();
        return;
      }
      expect(foundEmail).toBeTruthy();
      // Step 4: Sender and recipient validation
      expect(details.sender).toBe(data.expectedEmailFields.sender);
      expect(details.recipient).toBe(data.expectedEmailFields.recipient);

      // Step 3: Content validation
      for (const kw of data.expectedEmailFields.summaryIncludes) {
        expect(details.body).toContain(kw);
      }
      console.log('>> Email sender/recipient and content validated');

      await inboxPage.close();
    });
  }
});

/*
===============================
KEY FILE SECTIONS AND MAINTENANCE NOTES
- Page Objects: LoginPage, ProfilePage, MailboxPage provide modular encapsulation for UI screens.
- Test script: Data-driven via testData, easily extensible.
- Logging: Console.log calls for high-visibility debugging.
- Test data supports positive, negative, edge case scenarios.
- MailboxPage demonstrates integration with public email testing inbox (adapt for your environment as needed).
===============================
*/

// End of file
```