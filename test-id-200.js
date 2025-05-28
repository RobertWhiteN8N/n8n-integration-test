```javascript
// Playwright Automation Script for:
// Test Title: Add a new user with name, email, role, and access level
// Preconditions: Admin user is logged in, can access user creation.
// Scenario includes positive, negative, and edge cases for data-driven execution.

//-------------------------------------------------------
// Page Objects
//-------------------------------------------------------

class DashboardPage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;
    this.userManagementNav = page.locator('nav >> text=User Management');
    this.addUserButton = page.locator('button', { hasText: 'Add User' });
  }

  async gotoUserManagement() {
    console.log('Navigating to User Management section.');
    await this.userManagementNav.click();
  }

  async clickAddUser() {
    console.log('Clicking Add User button.');
    await this.addUserButton.click();
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
    this.roleDropdown = page.locator('select[name="role"]');
    this.accessLevelDropdown = page.locator('select[name="accessLevel"]');
    this.saveButton = page.locator('button', { hasText: /Save|Create/i });
    this.feedbackMessage = page.locator('[data-testid="add-user-feedback"], .alert-success, .notification-success');
  }

  async fillName(name) {
    console.log(`Entering name: ${name}`);
    await this.nameInput.fill(name);
  }

  async fillEmail(email) {
    console.log(`Entering email: ${email}`);
    await this.emailInput.fill(email);
  }

  async selectRole(role) {
    console.log(`Selecting role: ${role}`);
    await this.roleDropdown.selectOption({ label: role });
  }

  async selectAccessLevel(level) {
    console.log(`Selecting access level: ${level}`);
    await this.accessLevelDropdown.selectOption({ label: level });
  }

  async submit() {
    console.log('Submitting user creation form.');
    await this.saveButton.click();
  }

  async waitForFeedback() {
    console.log('Waiting for feedback message.');
    await this.feedbackMessage.waitFor({ state: 'visible', timeout: 5000 });
    return await this.feedbackMessage.textContent();
  }
}

class UserListPage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;
    this.userTableRows = page.locator('table >> tbody >> tr');
  }
  async isUserPresent(name, email) {
    console.log(`Checking if user '${name}' with email '${email}' is present in the list.`);
    const rows = await this.userTableRows.all();
    for (const row of rows) {
      const rowText = await row.textContent();
      if (rowText.includes(name) && rowText.includes(email)) {
        return true;
      }
    }
    return false;
  }
}

//-------------------------------------------------------
// Test Data (Positive, Negative & Edge Cases)
//-------------------------------------------------------

const userTestData = [
  // Positive case
  {
    testCase: 'Positive - Valid Admin user full access',
    name: 'Laura Green',
    email: 'laura.green@example.com',
    role: 'Admin',
    accessLevel: 'Full',
    expectSuccess: true,
    expectedFeedback: 'successfully created'
  },
  // Negative case: missing name
  {
    testCase: 'Negative - Missing name',
    name: '',
    email: 'noname@example.com',
    role: 'User',
    accessLevel: 'Read',
    expectSuccess: false,
    expectedFeedback: 'required field'
  },
  // Negative case: invalid email
  {
    testCase: 'Negative - Invalid email format',
    name: 'Eve Adams',
    email: 'eve.adams_at_example.com',
    role: 'Editor',
    accessLevel: 'Full',
    expectSuccess: false,
    expectedFeedback: 'valid email'
  },
  // Edge case: minimal name length
  {
    testCase: 'Edge - Minimal name length (1 char)',
    name: 'A',
    email: 'a@example.com',
    role: 'Viewer',
    accessLevel: 'Read',
    expectSuccess: true,
    expectedFeedback: 'successfully created'
  },
  // Edge case: excessively long name
  {
    testCase: 'Edge - Excessively long name',
    name: 'A'.repeat(256),
    email: 'longname@example.com',
    role: 'User',
    accessLevel: 'Full',
    expectSuccess: false,
    expectedFeedback: 'maximum length'
  },
  // Edge case: duplicate user (assuming unique email constraint)
  {
    testCase: 'Edge - Duplicate email',
    name: 'Duplicate User',
    email: 'laura.green@example.com', // Same as positive
    role: 'User',
    accessLevel: 'Read',
    expectSuccess: false,
    expectedFeedback: 'already exists'
  }
];

//-------------------------------------------------------
// Playwright Test Script
//-------------------------------------------------------

const { test, expect } = require('@playwright/test');

// NOTE: Assumes global login setup for admin user is handled in Playwright setup or fixture.

test.describe('Add New User - Data Driven', () => {
  for (const td of userTestData) {
    test(td.testCase, async ({ page }) => {
      // Logging scenario
      console.log(`Test Case: ${td.testCase}`);
      const dashboard = new DashboardPage(page);
      const addUser = new AddUserPage(page);
      const userList = new UserListPage(page);

      // Step 1: Go to User Management & click Add User
      await page.goto('https://yourapp.example.com/dashboard'); // Replace with your real dashboard URL
      await dashboard.gotoUserManagement();
      await dashboard.clickAddUser();
      // Confirm form loaded
      await expect(addUser.nameInput).toBeVisible();
      await expect(addUser.emailInput).toBeVisible();
      await expect(addUser.roleDropdown).toBeVisible();
      await expect(addUser.accessLevelDropdown).toBeVisible();

      // Step 2: Fill Add User Form
      await addUser.fillName(td.name);
      await addUser.fillEmail(td.email);
      await addUser.selectRole(td.role);
      await addUser.selectAccessLevel(td.accessLevel);
      // Custom validation for email input (frontend)
      if (!td.name) {
        await expect(addUser.nameInput).toHaveAttribute('aria-invalid', /true|/);
      }
      if (td.email && !td.email.match(/^[\w-.]+@([\w-]+.)+[\w-]{2,4}$/)) {
        await expect(addUser.emailInput).toHaveAttribute('aria-invalid', /true|/);
      }

      // Step 3: Submit
      await addUser.submit();

      // Step 4: Observe feedback (success or error)
      let feedback = '';
      try {
        feedback = (await addUser.waitForFeedback()) || '';
        console.log('Feedback:', feedback);
      } catch (e) {
        console.log('No feedback appeared:', e.message);
      }

      // Assert on the result (success/failure)
      if (td.expectSuccess) {
        expect(feedback.toLowerCase()).toContain(td.expectedFeedback);
        // Post condition: user visible in user list (avoid for duplicate test)
        if (!td.testCase.includes('Duplicate')) {
          await dashboard.gotoUserManagement(); // Refresh user list view
          const userExists = await userList.isUserPresent(td.name, td.email);
          expect(userExists).toBeTruthy();
        }
      } else {
        expect(feedback.toLowerCase()).toContain(td.expectedFeedback);
      }
    });
  }
});

//-------------------------------------------------------
// End of Script
//-------------------------------------------------------
```