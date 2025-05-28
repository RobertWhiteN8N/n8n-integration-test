```javascript
// playwright-edit-user.test.js

// ========================================================================
// Test Title: Edit an existing user's name, role, and access level
// Preconditions: 
// - Admin is logged in (assumed handled outside or as initial step)
// - User 'Michael Brown' exists
// - Admin has permissions
//
// Test Steps:
// 1. Navigate to User Management -> Find 'Michael Brown'
// 2. Click 'Edit'
// 3. Change Name, Role, Access Level
// 4. Save/Update and verify changes
//
// Data-driven for user details and scenarios (positive, negative, edge)
//
// ========================================================================

// ========================== Test Data Sets ==============================

const editUserTestData = [
  // Positive: change all fields
  {
    testName: "Positive: Update name, role, access for existing user",
    userToEdit: "Michael Brown",
    newName: "Mike Brown",
    newRole: "Supervisor",
    newAccess: "Restricted",
    expectSuccess: true,
    expectedResult: {
      name: "Mike Brown",
      role: "Supervisor",
      access: "Restricted"
    }
  },
  // Negative: empty name
  {
    testName: "Negative: Leave name empty",
    userToEdit: "Michael Brown",
    newName: "",
    newRole: "Supervisor",
    newAccess: "Restricted",
    expectSuccess: false,
    expectedErrorField: "name"
  },
  // Negative: unsupported role
  {
    testName: "Negative: Set invalid role",
    userToEdit: "Michael Brown",
    newName: "Mike Brown",
    newRole: "Alien",
    newAccess: "Restricted",
    expectSuccess: false,
    expectedErrorField: "role"
  },
  // Edge: excessively long name
  {
    testName: "Edge: Excessively long name",
    userToEdit: "Michael Brown",
    newName: "A".repeat(300),
    newRole: "Supervisor",
    newAccess: "Restricted",
    expectSuccess: false,
    expectedErrorField: "name"
  }
];

// ========================== Page Object Classes =========================

// DashboardPage: assumed post-login landing, entry to User Management
class DashboardPage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;
    this.userManagementLink = page.locator('a:has-text("User Management")'); // Actual selector may vary
  }
  async gotoUserManagement() {
    console.log("[LOG] Navigating to User Management section...");
    await this.userManagementLink.click();
  }
}

// UserManagementPage: user listing table, edit finder
class UserManagementPage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;
    this.userTable = page.locator('table#user-list');
    this.searchInput = page.locator('input[placeholder="Search"]');
  }
  async findUserRowByName(userName) {
    // Use table row with userName cell (customize selector as needed)
    const row = this.page.locator(`tr:has(td:text-is("${userName}"))`);
    await row.waitFor({ state: "visible", timeout: 5000 });
    return row;
  }
  async clickEditForUser(userName) {
    console.log(`[LOG] Locating user '${userName}' and clicking Edit...`);
    const userRow = await this.findUserRowByName(userName);
    const editButton = userRow.locator('button:has-text("Edit"), a:has-text("Edit"), button[aria-label="Edit"]');
    await editButton.waitFor({ state: "visible" });
    await editButton.click();
  }
}

// EditUserPage: edit form and fields
class EditUserPage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;
    // Assume label/IDs for fields
    this.nameInput = page.locator('input[name="name"]');
    this.roleSelect = page.locator('select[name="role"]');
    this.accessSelect = page.locator('select[name="accessLevel"]');
    this.saveBtn = page.locator('button:has-text("Save"), button:has-text("Update")');
    this.form = page.locator('form#edit-user-form');
    this.errorMessages = page.locator('.form-error, .input-error, .error');
  }
  async waitForForm() {
    await this.form.waitFor({ state: "visible" });
  }
  async setName(name) {
    await this.nameInput.fill(name);
  }
  async setRole(role) {
    await this.roleSelect.selectOption({ label: role });
  }
  async setAccessLevel(accessLevel) {
    await this.accessSelect.selectOption({ label: accessLevel });
  }
  async submit() {
    await this.saveBtn.click();
  }
  async getValidationErrors() {
    return await this.errorMessages.allTextContents();
  }
  async getFieldValue(field) {
    if (field === 'name') return await this.nameInput.inputValue();
    if (field === 'role') return await this.roleSelect.inputValue();
    if (field === 'access') return await this.accessSelect.inputValue();
  }
}

// ========================== Playwright Test Script =====================

const { test, expect } = require('@playwright/test');

test.describe('Edit User Functionality', () => {

  editUserTestData.forEach((data) => {
    test(data.testName, async ({ page }) => {
      // Precondition: Assume logged in as Admin already -- start on dashboard
      const dashboard = new DashboardPage(page);
      const userMgmt = new UserManagementPage(page);
      const editUser = new EditUserPage(page);

      // Step 1: Navigate to User Management and locate user
      await dashboard.gotoUserManagement();
      const userRow = await userMgmt.findUserRowByName(data.userToEdit);

      // Validate user row and Edit link/btn is present
      await expect(userRow).toBeVisible();
      const editBtn = userRow.locator('button:has-text("Edit"), a:has-text("Edit"), button[aria-label="Edit"]');
      await expect(editBtn).toBeVisible();

      // Step 2: Click Edit, assert form appears with pre-filled data
      await userMgmt.clickEditForUser(data.userToEdit);
      await editUser.waitForForm();
      await expect(editUser.nameInput).toBeVisible();
      // (Extend here: check pre-filled values if you wish)

      // Step 3: Change Name, Role, Access
      console.log(`[LOG] Editing user. New name: '${data.newName}', role: '${data.newRole}', access: '${data.newAccess}'`);
      await editUser.setName(data.newName);
      await editUser.setRole(data.newRole);
      await editUser.setAccessLevel(data.newAccess);

      // Validate modified form state (fields set as expected)
      expect(await editUser.getFieldValue('name')).toBe(data.newName);
      // Role and access typically yield the select value (value, not label), but skip here.

      // Step 4: Click Save/Update and validate
      await editUser.submit();

      if (data.expectSuccess) {
        // Expect: changes saved & user list reflects update. Wait for navigation or list reload.
        // (Assume some mechanism to identify update – confirmation or presence in table)
        // Wait for redirection back to user management or for toast message
        await userMgmt.userTable.waitFor({ state: "visible" });
        console.log("[LOG] Verifying updated user appears in list...");
        const updatedRow = await userMgmt.findUserRowByName(data.expectedResult.name);
        await expect(updatedRow).toBeVisible();
        const roleCell = updatedRow.locator('td').nth(1); // assuming second cell = role
        const accessCell = updatedRow.locator('td').nth(2); // assuming third cell = access
        await expect(roleCell).toContainText(data.expectedResult.role);
        await expect(accessCell).toContainText(data.expectedResult.access);
      } else {
        // Expect: error or some kind of validation fails, form remains
        // Look for error message on appropriate field or general
        const errors = await editUser.getValidationErrors();
        console.log("[LOG] Validation errors found:", errors);
        expect(errors.join(' ')).toMatch(new RegExp(data.expectedErrorField, 'i'));
        // Also ensure user form is still present
        await expect(editUser.form).toBeVisible();
      }
    });
  });
});
```
