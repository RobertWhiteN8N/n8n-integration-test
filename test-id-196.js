```javascript
// Automated Test Script for: Send email notification to user on new account creation
// Framework: Playwright (JavaScript) using the Page Object Model (POM)
// This script is data-driven and covers positive, negative, and edge cases
// Logging is enabled for step-by-step debugging

// ========================== Test Data ==========================

const testDataSet = [
  // Positive case
  {
    name: "Jessica Lane",
    email: "jessica.lane@example.com",
    role: "Editor",
    accessLevel: "Standard",
    expectSuccess: true,
    description: "Valid new user creation, expect email"
  },
  // Negative case: Invalid email format
  {
    name: "Invalid Email",
    email: "invalid-email-format",
    role: "Editor",
    accessLevel: "Standard",
    expectSuccess: false,
    description: "Invalid email format, should not allow creation"
  },
  // Edge case: Duplicate email
  {
    name: "Duplicate Name",
    email: "jessica.lane@example.com",
    role: "Viewer",
    accessLevel: "Limited",
    expectSuccess: false,
    description: "Duplicate email, should not allow creation"
  },
  // Edge case: Empty name
  {
    name: "",
    email: "empty.name@example.com",
    role: "Admin",
    accessLevel: "Full",
    expectSuccess: false,
    description: "Empty name field"
  },
  // Edge case: Excessively long name
  {
    name: "A".repeat(256),
    email: "long.name@example.com",
    role: "Editor",
    accessLevel: "Standard",
    expectSuccess: false,
    description: "Name exceeds character limit"
  }
];

// ========================== Page Object Classes ==========================

// LoginPage is skipped as test assumes admin pre-logged in (per precondition)

class DashboardPage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;
    this.userManagementLink = page.locator('text=User Management');
  }
  async gotoUserManagement() {
    console.log("[DashBoard] Navigating to User Management section");
    await this.userManagementLink.click();
  }
}

class UserManagementPage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;
    this.addUserButton = page.locator('button:has-text("Add User")');
    this.userTable = page.locator('[data-test="user-table"]');
    this.getUserRow = (email) => this.page.locator(`tr:has(td:text("${email}"))`);
  }
  async clickAddUser() {
    console.log("[UserManagement] Clicking Add User");
    await this.addUserButton.click();
  }
  async isUserPresent(email) {
    return await this.getUserRow(email).isVisible();
  }
}

class AddUserPage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;
    this.nameInput = page.locator('input[name="name"]');
    this.emailInput = page.locator('input[name="email"]');
    this.roleSelect = page.locator('select[name="role"]');
    this.accessLevelSelect = page.locator('select[name="accessLevel"]');
    this.saveButton = page.locator('button:has-text("Save"), button:has-text("Create User")');
    this.successMsg = page.locator('.alert-success');
    this.errorMsg = page.locator('.alert-danger, .form-error');
  }

  async fillForm({ name, email, role, accessLevel }) {
    console.log(`[AddUser] Filling form: name=${name}, email=${email}, role=${role}, accessLevel=${accessLevel}`);
    await this.nameInput.fill(name);
    await this.emailInput.fill(email);
    await this.roleSelect.selectOption({ label: role });
    await this.accessLevelSelect.selectOption({ label: accessLevel });
  }

  async submit() {
    console.log("[AddUser] Submitting form");
    await this.saveButton.click();
  }

  async getSuccessMessage() {
    return await this.successMsg.textContent();
  }

  async getErrorMessage() {
    return await this.errorMsg.textContent();
  }
}

// Assumption: A test inbox utility (e.g., Mailosaur, Mailtrap, Ethereal) is used for email assertion.
// The utility exposes fetchEmail(toEmail, subjectMatcher) for checking received emails.

class EmailInbox {
  /**
   * @param {object} serviceConfig - config object for your test email service
   */
  constructor(serviceConfig) {
    this.serviceConfig = serviceConfig;
    // In real case, use SDK or API for email fetching, here it's stubbed.
  }

  // Simulate fetching latest email matching subject for recipient
  async fetchEmail(toEmail, subjectContains, waitSeconds = 30) {
    // In real implementation, poll for new email
    console.log(`[EmailInbox] Waiting for email to ${toEmail} with subject containing '${subjectContains}'`);
    let attempts = Math.ceil(waitSeconds / 5);
    while (attempts-- > 0) {
      // Simulated call: Replace with actual API/service call
      let email = await this.simulateFetch(toEmail, subjectContains);
      if (email) return email;
      await new Promise(res => setTimeout(res, 5000));
    }
    return null;
  }

  // This method should be replaced by actual service SDK call
  async simulateFetch(toEmail, subjectContains) {
    // "Receive" only for correct test data
    if (toEmail === "jessica.lane@example.com" && subjectContains === "Account Created") {
      return {
        to: toEmail,
        subject: "Your Account Was Created",
        body: "Dear Jessica Lane, your account has been created"
      };
    }
    return null;
  }
}

// ========================= Playwright Test Definition =========================

// To run: $ npx playwright test thisfile.js
const { test, expect } = require('@playwright/test');

// Email service (stubbed)
const emailServiceConfig = {}; // e.g. { apiKey: "...", ... }
const emailInbox = new EmailInbox(emailServiceConfig);

test.describe('User Account Creation and Email Notification', () => {
  for (const data of testDataSet) {
    test(`${data.description}`, async ({ page }) => {
      // Step 1: Navigate to 'User Management' and click 'Add User'
      const dashboard = new DashboardPage(page);
      const userManagement = new UserManagementPage(page);

      await page.goto('https://your-admin-dashboard-url.example.com/dashboard');
      await dashboard.gotoUserManagement();
      await expect(userManagement.addUserButton).toBeVisible();

      // Step 2: Click Add User and fill out the form
      await userManagement.clickAddUser();
      const addUser = new AddUserPage(page);

      await expect(addUser.nameInput).toBeVisible();
      await expect(addUser.emailInput).toBeVisible();

      await addUser.fillForm(data);

      // Optional: Validate field-level constraints (e.g., if negative cases)
      if (!data.expectSuccess) {
        await addUser.submit();
        const errorText = await addUser.getErrorMessage();
        console.log(`[Test] Error message (if any): ${errorText}`);
        expect(errorText || '').not.toEqual('');
        return; // Negative cases: stop here
      }

      // Step 3: Submit the form
      await addUser.submit();
      await expect(addUser.successMsg).toBeVisible();

      const successText = await addUser.getSuccessMessage();
      console.log(`[Test] Success message: ${successText}`);
      expect(successText).toContain('User created');

      // Step 4: Validate user in DB (as per UI)
      const isUserPresent = await userManagement.isUserPresent(data.email);
      expect(isUserPresent).toBeTruthy();

      // Step 5: Check that new user received account creation email (positive case only)
      if (data.expectSuccess) {
        const email = await emailInbox.fetchEmail(data.email, "Account Created");
        expect(email).not.toBeNull();
        expect(email.to).toEqual(data.email);
        expect(email.subject).toContain("Account");
        expect(email.body).toContain(data.name);
        console.log(`[Test] Email received: subject=${email.subject}`);
      }
    });
  }
});

// =================== End of Test Script ===================
```