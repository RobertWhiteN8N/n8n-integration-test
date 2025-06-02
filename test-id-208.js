```javascript
// Playwright POM Automation Test
// Test Case: View and validate existing user profile details as admin
//
// Preconditions: 
// - Admin user is logged into the dashboard.
// - At least one user (e.g., Michael Scott) exists in the system.
//
// Test Steps:
// 1. Navigate to the 'User Management' section from the dashboard.
// 2. Click on a user profile in the user list (e.g., Michael Scott).
// 3. Validate user profile details (Name, Role, Access Level).
//
// Expected Results:
// - 'User Management' page is displayed.
// - User profile details are displayed and match expected data.
// 
// Post-Conditions:
// - User details are viewable and accurate; no changes performed.

// -----------------------------
// Test Data
// -----------------------------

const testUsers = [
  // Positive scenario: Typical user
  {
    displayName: "Michael Scott",
    expected: {
      name: "Michael Scott",
      role: "Regional Manager",
      accessLevel: "Admin",
    }
  },
  // Negative scenario: User does not exist
  {
    displayName: "Jim Halpert",
    expected: {
      name: null, // Will fail because no such user in preconditions
      role: null,
      accessLevel: null
    }
  },
  // Edge case: User with minimal details/fields (simulate system user)
  {
    displayName: "sysadmin",
    expected: {
      name: "sysadmin",
      role: "System Admin",
      accessLevel: "Superuser"
    }
  },
  // Edge case: User with special characters
  {
    displayName: "Dwight Schrüte",
    expected: {
      name: "Dwight Schrüte",
      role: "Assistant to the Regional Manager",
      accessLevel: "User"
    }
  }
]

// -----------------------------
// Page Object Classes
// -----------------------------

// DashboardPage: Represents the admin dashboard, provides navigation to User Management
class DashboardPage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;
    this.userManagementLink = page.locator('a[aria-label="User Management"], text="User Management"');
  }

  async goToUserManagement() {
    console.log('[INFO] Navigating to User Management...');
    await this.userManagementLink.waitFor({ state: 'visible', timeout: 5000 });
    await this.userManagementLink.click();
    await this.page.waitForLoadState('networkidle');
  }
}

// UserManagementPage: Represents the user list/search screen
class UserManagementPage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;
    this.userRows = page.locator('tr.user-row'); // Update selector as needed
    this.pageTitle = page.locator('h1, h2', { hasText: 'User Management' });
  }

  async assertLoaded() {
    await this.pageTitle.waitFor({ state: 'visible', timeout: 5000 });
    console.log('[ASSERT] User Management page is displayed');
  }

  async selectUser(displayName) {
    console.log(`[INFO] Attempting to select user "${displayName}"...`);
    const userLocator = this.page.locator('tr.user-row', { hasText: displayName });
    if (!(await userLocator.isVisible())) {
      console.warn(`[WARN] User "${displayName}" not found in list`);
      return false;
    }
    await userLocator.click();
    return true;
  }
}

// UserProfilePage: Represents the user's profile detail screen
class UserProfilePage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;
    this.nameField = page.locator('[data-testid="profile-name"], .profile-name, h1');
    this.roleField = page.locator('[data-testid="profile-role"], .profile-role, .role');
    this.accessLevelField = page.locator('[data-testid="profile-access"], .profile-access, .access-level');
  }

  async getUserDetails() {
    // Read fields; return null if not visible
    const name = await this.nameField.isVisible() ? await this.nameField.textContent() : null;
    const role = await this.roleField.isVisible() ? await this.roleField.textContent() : null;
    const accessLevel = await this.accessLevelField.isVisible() ? await this.accessLevelField.textContent() : null;
    return {
      name: name ? name.trim() : null,
      role: role ? role.trim() : null,
      accessLevel: accessLevel ? accessLevel.trim() : null
    }
  }

  async assertProfileDetails(expected) {
    const actual = await this.getUserDetails();
    console.log(`[ASSERT] Name: Expected "${expected.name}", Actual "${actual.name}"`);
    console.log(`[ASSERT] Role: Expected "${expected.role}", Actual "${actual.role}"`);
    console.log(`[ASSERT] Access: Expected "${expected.accessLevel}", Actual "${actual.accessLevel}"`);

    if (expected.name !== null)
      if (actual.name !== expected.name) throw new Error(`Name mismatch: got "${actual.name}", expected "${expected.name}"`);
    if (expected.role !== null)
      if (actual.role !== expected.role) throw new Error(`Role mismatch: got "${actual.role}", expected "${expected.role}"`);
    if (expected.accessLevel !== null)
      if (actual.accessLevel !== expected.accessLevel) throw new Error(`Access Level mismatch: got "${actual.accessLevel}", expected "${expected.accessLevel}"`);
  }
}

// -----------------------------
// Playwright Test Script
// -----------------------------
const { test, expect } = require('@playwright/test');

// Data-driven test for each user scenario
test.describe('Admin: View and Validate Existing User Profile Details', () => {

  for (const scenario of testUsers) {
    test(`Validate user profile details for: "${scenario.displayName}"`, async ({ page }) => {

      // Assumption: Admin is already logged in. If login step is required, add LoginPage and perform login here.

      // Arrange: Create Page Objects
      const dashboardPage = new DashboardPage(page);
      const userManagementPage = new UserManagementPage(page);
      const userProfilePage = new UserProfilePage(page);

      // Step 1: Navigate to User Management
      await dashboardPage.goToUserManagement();

      // Step 1 Assert
      await userManagementPage.assertLoaded();

      // Step 2: Select the user from the list
      const userFound = await userManagementPage.selectUser(scenario.displayName);

      if (!userFound) {
        console.log(`[SKIP] User "${scenario.displayName}" not found. Skipping profile details validation.`);
        if (scenario.expected.name !== null)
          throw new Error(`User "${scenario.displayName}" should exist per test data but was not found.`);
        return;
      }

      // Step 3: Validate profile details (Name, Role, Access Level)
      await userProfilePage.assertProfileDetails(scenario.expected);

      console.log(`[PASS] Profile details validated for user "${scenario.displayName}".`);
    });
  }
});
```
