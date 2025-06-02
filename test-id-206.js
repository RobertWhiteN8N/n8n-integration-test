```javascript
// ===========================================================================
// Test Case: Verify email is sent upon successful user account creation
//
// Preconditions:
// - Admin has access to the dashboard
// - Test email ('john.smith@domain.com' or dataset value) is unique and accessible
//
// Test Steps (automated simulation):
// 1. Admin creates a new user account with valid details (UI automation)
// 2. System shows a success message in UI
// 3. Check the new user's email inbox (integration/third-party mailbox access)
// 4. Validate email received: content, sender, recipient
//
// Note: This script requires support for inbox checking.
// It uses Playwright for browser automation and an example Mail API for email checks (replace with actual services as needed).
// ===========================================================================


// --------- Test Data
const testUsers = [
  {
    description: "Positive: Valid account creation",
    adminUsername: "adminuser",
    adminPassword: "adminpass123",
    newUser: {
      email: "john.smith+test1@domain.com",
      firstName: "John",
      lastName: "Smith",
      username: "johnsmith2024",
      tempPassword: "Temp123!abc",
    },
    expectedSender: "no-reply@system.com",
    supportContact: "support@domain.com",
    expectEmail: true
  },
  {
    description: "Negative: Invalid Email Address",
    adminUsername: "adminuser",
    adminPassword: "adminpass123",
    newUser: {
      email: "invalidemail@@domain..com",
      firstName: "Invalid",
      lastName: "Email",
      username: "invalidemailuser",
      tempPassword: "Temp123!abc",
    },
    expectedSender: "no-reply@system.com",
    supportContact: "support@domain.com",
    expectEmail: false
  },
  {
    description: "Edge: Long Name & Username",
    adminUsername: "adminuser",
    adminPassword: "adminpass123",
    newUser: {
      email: "edgecase.longname+test2@domain.com",
      firstName: "A".repeat(50),
      lastName: "B".repeat(50),
      username: "user" + "X".repeat(45),
      tempPassword: "Temp123!abc",
    },
    expectedSender: "no-reply@system.com",
    supportContact: "support@domain.com",
    expectEmail: true
  },
];

// --------- Page Objects

// -- Admin Login Page Object
class AdminLoginPage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;
    this.usernameInput = page.locator('#username');
    this.passwordInput = page.locator('#password');
    this.loginButton = page.locator('button[type="submit"]');
  }

  async login(username, password) {
    console.log(`[LoginPage] Logging in as admin: ${username}`);
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }
}

// -- Admin Dashboard/User Management Page Object
class AdminDashboardPage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;
    this.userMgmtNav = page.locator('a[href*="user-management"]');
    this.createUserButton = page.locator('button#create-user');
    // Form fields
    this.emailInput = page.locator('input[name="email"]');
    this.firstNameInput = page.locator('input[name="firstName"]');
    this.lastNameInput = page.locator('input[name="lastName"]');
    this.usernameInput = page.locator('input[name="username"]');
    this.tempPasswordInput = page.locator('input[name="tempPassword"]');
    this.saveUserButton = page.locator('button[type="submit"]');
    this.successAlert = page.locator('.alert-success');
    this.errorAlert = page.locator('.alert-danger');
  }

  async goToUserManagement() {
    console.log(`[Dashboard] Navigating to User Management`);
    await this.userMgmtNav.click();
    await this.page.waitForSelector('button#create-user', {timeout: 5000});
  }

  async createUser(user) {
    console.log(`[Dashboard] Creating user: ${user.email}`);
    await this.createUserButton.click();
    await this.emailInput.fill(user.email);
    await this.firstNameInput.fill(user.firstName);
    await this.lastNameInput.fill(user.lastName);
    await this.usernameInput.fill(user.username);
    await this.tempPasswordInput.fill(user.tempPassword);
    await this.saveUserButton.click();
  }

  async getSuccessMessage() {
    if (await this.successAlert.isVisible()) {
      const msg = await this.successAlert.textContent();
      console.log(`[Dashboard] Success Message: ${msg}`);
      return msg;
    }
    return null;
  }

  async getErrorMessage() {
    if (await this.errorAlert.isVisible()) {
      const msg = await this.errorAlert.textContent();
      console.log(`[Dashboard] Error Message: ${msg}`);
      return msg;
    }
    return null;
  }
}

// -- (Example) Mailbox API Test Helper (Replace with actual service access)
class MailboxHelper {
  /**
   * Example mailbox helper using Mailosaur, Mailinator, or similar APIs.
   * Replace implementation as needed for your test environment.
   **/
  constructor(mailboxApiConfig) {
    this.apiKey = mailboxApiConfig.apiKey;
    this.serverId = mailboxApiConfig.serverId;
    this.baseUrl = mailboxApiConfig.baseUrl; // e.g., 'https://api.mailosaur.com'
  }

  async getLatestEmail(recipientEmail, subjectContains, timeoutMs = 30000) {
    console.log(`[Mailbox] Waiting for email to ${recipientEmail}...`);
    // Polling for email
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const email = await this.fetchLatestEmail(recipientEmail, subjectContains);
      if (email) {
        console.log(`[Mailbox] Email received: subject "${email.subject}"`);
        return email;
      }
      await new Promise(res => setTimeout(res, 3000));
    }
    throw new Error(`No email received for ${recipientEmail} within timeout`);
  }

  async fetchLatestEmail(recipientEmail, subjectContains) {
    // This is just an example: Replace with your mail API logic.
    // For example, with Mailosaur:
    // const res = await fetch(`${this.baseUrl}/messages?server=${this.serverId}&sentTo=${recipientEmail}`, { headers: { 'Authorization': `Basic ${Buffer.from(this.apiKey + ':').toString('base64')}` } });
    // const json = await res.json();
    // const msg = json.items.find(e => e.subject.includes(subjectContains));
    // if (msg) return { subject: msg.subject, body: msg.html ? msg.html.body : msg.text.body, to: msg.to[0].email, from: msg.from[0].email };
    // return null;
    return null // <-- Implement actual interaction here
  }
}

// --------- Playwright Test Script

const { test, expect } = require('@playwright/test');

// Inbox service config: set up with your real mailbox provider/sandbox.
const mailboxHelper = new MailboxHelper({
  apiKey: 'YOUR_MAILBOX_API_KEY',
  serverId: 'YOUR_MAILBOX_SERVER_ID',
  baseUrl: 'https://api.mailosaur.com', // Replace as needed
});

test.describe('Account Creation Email Notification', () => {
  for (const data of testUsers) {
    test(`${data.description}`, async ({ page }) => {
      // Step 1: Login as Admin
      const loginPage = new AdminLoginPage(page);
      await page.goto('https://your-admin-app-url.com/login');
      await loginPage.login(data.adminUsername, data.adminPassword);

      // Step 2: Go to User Management and Create User
      const dashboardPage = new AdminDashboardPage(page);
      await dashboardPage.goToUserManagement();
      await dashboardPage.createUser(data.newUser);

      // Step 3: Validate create user result
      let creationPassed = false;
      const successMsg = await dashboardPage.getSuccessMessage();
      const errorMsg = await dashboardPage.getErrorMessage();

      if (data.expectEmail) {
        expect(successMsg).toBeTruthy(); // Should see creation success
        expect(successMsg).toMatch(/success|created/i);
        creationPassed = true;
      } else {
        expect(errorMsg).toBeTruthy();
        creationPassed = false;
      }

      // Step 4: If expected to receive email, poll mailbox and check content
      if (creationPassed && data.expectEmail) {
        let email = null;
        try {
          email = await mailboxHelper.getLatestEmail(data.newUser.email, "account", 60000);
        } catch (e) {
          console.error(`[Test] Failed to fetch email for ${data.newUser.email}: ${e.message}`);
        }

        expect(email).toBeTruthy();

        // Step 5: Validate Email - Presence
        expect(email.subject).toMatch(/account|created|welcome/i);

        // Step 6: Validate Email - Content
        expect(email.body).toMatch(new RegExp(`${data.newUser.username}`, 'i'));
        expect(email.body).toMatch(/temporary password/i);
        expect(email.body).toMatch(new RegExp(data.supportContact, 'i'));

        // Step 7: Validate sender/recipient
        expect(email.to).toEqual(data.newUser.email);
        expect(email.from).toEqual(data.expectedSender);

        console.log(`[Test] Email sent successfully for ${data.newUser.email}`);
      } else if (!data.expectEmail) {
        // Should NOT receive an email due to invalid user account creation
        let email = null;
        try {
          email = await mailboxHelper.getLatestEmail(data.newUser.email, "account", 15000);
        } catch (e) {
          // Expected to not receive an email
        }
        expect(email).toBeFalsy();
        console.log(`[Test] No email sent for invalid scenario (as expected)`);
      }
    });
  }
});


// ===========================================================================
// End of test case implementation
// ===========================================================================
```
