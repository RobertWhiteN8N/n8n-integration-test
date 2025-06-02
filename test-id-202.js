```javascript
// playwright-add-new-user.test.js

// ==========================================================================
// Test Case: Add new user with valid data and verify storage in database
// Preconditions: 
//   - Admin user is on 'Add New User' form.
//   - Test email 'sarah.lee@company.com' does not exist in user database.
// Test Steps:
//   1. Enter 'Sarah Lee' in the Name field.
//   2. Enter 'sarah.lee@company.com' in the Email field (valid and unique).
//   3. Select 'Administrator' as Role and 'Full Access' as Access Level.
//   4. Click on 'Save' button.
// Expected Results:
//   - Fields accept input.
//   - Success message displays.
//   - User appears in user management table.
// Post-Condition: User 'Sarah Lee' exists in user management list and in database.
// ==========================================================================

// Imports
const { test, expect } = require('@playwright/test');

// ==========================================================================
// Test Data Set
// The object below contains positive, negative, and edge cases to support
// data-driven execution. Only the positive scenario used for primary test.
// ==========================================================================
const addUserTestDataSet = [
  {
    scenario: 'Positive: Valid inputs, unique email',
    name: 'Sarah Lee',
    email: 'sarah.lee@company.com',
    role: 'Administrator',
    accessLevel: 'Full Access',
    expectedSuccess: true,
    expectedMessage: 'User successfully created'
  },
  {
    scenario: 'Negative: Duplicate email',
    name: 'Sarah Lee',
    email: 'existing.user@company.com',
    role: 'Administrator',
    accessLevel: 'Full Access',
    expectedSuccess: false,
    expectedMessage: 'Email already exists'
  },
  {
    scenario: 'Negative: Invalid email format',
    name: 'Sarah Lee',
    email: 'invalid_email_format',
    role: 'Administrator',
    accessLevel: 'Full Access',
    expectedSuccess: false,
    expectedMessage: 'Invalid email format'
  },
  {
    scenario: 'Negative: Empty Name',
    name: '',
    email: 'new_user@company.com',
    role: 'Administrator',
    accessLevel: 'Full Access',
    expectedSuccess: false,
    expectedMessage: 'Name is required'
  },
  {
    scenario: 'Edge: Name with special characters',
    name: 'Sarah @#Lee!!!',
    email: 'sarah.special@company.com',
    role: 'Administrator',
    accessLevel: 'Full Access',
    expectedSuccess: true,
    expectedMessage: 'User successfully created'
  }
];
// ==========================================================================

// ==========================================================================
// Page Object: AddNewUserPage
// Encapsulates selectors and actions for 'Add New User' form.
// ==========================================================================
class AddNewUserPage {
  /**
   * @param {import('@playwright/test').Page} page 
   */
  constructor(page) {
    this.page = page;
    this.nameInput = page.locator('input[name="name"]');
    this.emailInput = page.locator('input[name="email"]');
    this.roleDropdown = page.locator('select[name="role"]');
    this.accessLevelDropdown = page.locator('select[name="accessLevel"]');
    this.saveButton = page.locator('button[type="submit"], button:has-text("Save")');
    this.successMessage = page.locator('.alert-success, .success-message');
    this.errorMessage = page.locator('.alert-danger, .error-message');
  }

  async enterName(name) {
    await this.nameInput.fill('');
    await this.nameInput.fill(name);
    console.log(`[ACTION] Name input set to: "${name}"`);
  }

  async enterEmail(email) {
    await this.emailInput.fill('');
    await this.emailInput.fill(email);
    console.log(`[ACTION] Email input set to: "${email}"`);
  }

  async selectRole(role) {
    await this.roleDropdown.selectOption({ label: role });
    console.log(`[ACTION] Role selected: "${role}"`);
  }

  async selectAccessLevel(accessLevel) {
    await this.accessLevelDropdown.selectOption({ label: accessLevel });
    console.log(`[ACTION] Access Level selected: "${accessLevel}"`);
  }

  async clickSave() {
    await this.saveButton.click();
    console.log(`[ACTION] Save button clicked`);
  }

  async getSuccessMessage() {
    if (await this.successMessage.isVisible())
      return await this.successMessage.textContent();
    return null;
  }

  async getErrorMessage() {
    if (await this.errorMessage.isVisible())
      return await this.errorMessage.textContent();
    return null;
  }
}
// ==========================================================================

// ==========================================================================
// Page Object: UserManagementPage
// For post-condition check: verify if user exists in the management table.
// ==========================================================================
class UserManagementPage {
  /**
   * @param {import('@playwright/test').Page} page 
   */
  constructor(page) {
    this.page = page;
    this.userTableRows = page.locator('table#user-list tbody tr');
  }

  async isUserPresentByEmail(email) {
    // Look for a table row containing the email
    const userRow = this.page.locator(`table#user-list >> text=${email}`);
    const count = await userRow.count();
    console.log(`[INFO] Searched user email "${email}" in users table, found: ${count}`);
    return count > 0;
  }
}
// ==========================================================================

// ==========================================================================
// Test Script Starts
// The test runs data-driven execution for all scenarios in the test data set.
// ==========================================================================
test.describe('Add New User - Data Driven Automation', () => {
  for (const userData of addUserTestDataSet) {
    test(`${userData.scenario}`, async ({ page }) => {
      console.log(`[TEST] Starting scenario: ${userData.scenario}`);

      // [Pre-Condition] Assumes the admin is already signed in and at Add New User form
      const addUserPage = new AddNewUserPage(page);

      // If not at the correct path, programmatically navigate (URL is example)
      await page.goto('https://your-app-url.com/admin/users/add');

      // --- Step 1: Enter Name ---
      await addUserPage.enterName(userData.name);
      await expect(addUserPage.nameInput).toHaveValue(userData.name);
      console.log('[ASSERT] Name field validated.');

      // --- Step 2: Enter Email ---
      await addUserPage.enterEmail(userData.email);
      await expect(addUserPage.emailInput).toHaveValue(userData.email);
      console.log('[ASSERT] Email field validated.');

      // --- Step 3: Select role and access level ---
      await addUserPage.selectRole(userData.role);
      await expect(addUserPage.roleDropdown).toHaveValue(userData.role); // assumes value == label
      await addUserPage.selectAccessLevel(userData.accessLevel);
      await expect(addUserPage.accessLevelDropdown).toHaveValue(userData.accessLevel); // assumes value == label
      console.log('[ASSERT] Role and Access Level validated.');

      // --- Step 4: Click Save ---
      await addUserPage.clickSave();

      // --- Check Results ---
      if (userData.expectedSuccess) {
        // Expect success message
        await expect(addUserPage.successMessage).toBeVisible({ timeout: 8000 });
        const successMsg = await addUserPage.getSuccessMessage();
        expect(successMsg).toContain(userData.expectedMessage);
        console.log(`[ASSERT] Success message validated: ${successMsg}`);

        // Post-condition: User appears in management table (UI check only)
        // Navigate to user management table page if necessary
        await page.goto('https://your-app-url.com/admin/users');
        const userListPage = new UserManagementPage(page);

        const isCreated = await userListPage.isUserPresentByEmail(userData.email);
        expect(isCreated).toBeTruthy();
        console.log(`[ASSERT] User ${userData.email} present in management list.`);

        // Post-condition: Database check could be done via API or DB (omitted)
        // To be implemented as needed
      } else {
        // Negative Test: Expect error message
        await expect(addUserPage.errorMessage).toBeVisible({ timeout: 8000 });
        const errorMsg = await addUserPage.getErrorMessage();
        expect(errorMsg).toContain(userData.expectedMessage);
        console.log(`[ASSERT] Error message validated: ${errorMsg}`);
      }
    });
  }
});
// ==========================================================================

// End of playwright-add-new-user.test.js
```