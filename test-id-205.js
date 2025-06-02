```javascript
// Filename: changeUserAccessLevel.test.js

// ------------------------------------
// Test Automation Script: Change Access Level for Existing User
// ------------------------------------

// Import required Playwright test modules
const { test, expect } = require('@playwright/test');

//------------------------------------
// Test Data Set for Data-Driven Testing
//------------------------------------
/*
Test data includes:
- Positive: Changing from "Read Only" to "Full Access"
- Negative/Edge: Attempting invalid access level or using a non-existent user
*/
const testData = [
  {
    title: 'Positive: Change Read Only to Full Access',
    userName: 'Angela Martin',
    currentAccessLevel: 'Read Only',
    newAccessLevel: 'Full Access',
    expectedDatabaseAccessLevel: 'Full Access',
    expectedSuccess: true
  },
  {
    title: 'Negative: Invalid Access Level Option',
    userName: 'Angela Martin',
    currentAccessLevel: 'Read Only',
    newAccessLevel: 'SuperAdmin', // assuming invalid
    expectedDatabaseAccessLevel: 'Read Only', // should not change
    expectedSuccess: false
  },
  {
    title: 'Negative: Non-existent User',
    userName: 'Fake User',
    currentAccessLevel: undefined,
    newAccessLevel: 'Full Access',
    expectedDatabaseAccessLevel: undefined,
    expectedSuccess: false
  }
];

//------------------------------------
// Page Object Classes
//------------------------------------

// EditUserPage encapsulates actions and elements on the Edit User screen
class EditUserPage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;
    this.accessLevelSelect = page.locator('[data-test=access-level-select]');
    this.saveButton = page.locator('[data-test=save-btn]');
    this.successToast = page.locator('[data-test=success-message]');
    this.usernameInput = page.locator('[data-test=user-name-input]');
  }

  async isOnEditUserForm(userName) {
    return await this.usernameInput.inputValue() === userName;
  }

  async getCurrentAccessLevel() {
    return await this.accessLevelSelect.inputValue();
  }

  async changeAccessLevel(newAccessLevel) {
    await this.accessLevelSelect.selectOption({ label: newAccessLevel });
    // Logging the attempted access level change
    console.log(`Changed Access Level dropdown to: ${newAccessLevel}`);
  }

  async saveChanges() {
    await this.saveButton.click();
    console.log('Clicked Save.');
  }

  async waitForSuccessMessage() {
    await expect(this.successToast).toBeVisible({ timeout: 5000 });
    const msg = await this.successToast.textContent();
    console.log('Success message:', msg);
    return msg;
  }
}

// UserListPage encapsulates actions and elements on the User List screen
class UserListPage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;
    this.searchField = page.locator('[data-test=user-list-search]');
  }
  async navigate() {
    await this.page.goto('/users');
    console.log('Navigated to User List');
  }

  async findUserRow(userName) {
    const row = this.page.locator(`[data-test=user-row][data-user-name="${userName}"]`);
    return row;
  }

  async getUserAccessLevel(userName) {
    const row = await this.findUserRow(userName);
    const accessCell = row.locator('[data-test=user-row-access-level]');
    return await accessCell.textContent();
  }
}

// Mocked Database Helper for demonstration (replace with actual DB calls in integration setup)
class DatabaseHelper {
  /**
   * Simulates querying the user database for a user's access level.
   * @param {string} userName
   * @returns {Promise<string|null>} The access level or null if not found.
   */
  static async queryUserAccessLevel(userName) {
    // LOGGING: Would connect to DB in real integration
    console.log(`Querying database for user: ${userName}`);
    // --- Placeholder for integration: Replace this part with an actual call ---
    // For demo, only Angela Martin exists and her access level is changed by the test.
    if (userName === 'Angela Martin') {
      // Retrieve value from a shared context in a real test or update after UI save.
      // Here, mock as 'Full Access' for positive scenario
      return global.__mockAngelaAccessLevel || 'Read Only';
    }
    return null;
  }
}

//------------------------------------
// Test Implementation
//------------------------------------

test.describe('Change User Access Level - Data Driven', () => {
  for (const data of testData) {
    test(`${data.title}`, async ({ page }) => {
      console.log(`----- Test Start: ${data.title} -----`);

      // Step 1: Assume admin is already on Edit User form for 'Angela Martin'
      await page.goto(`/users/edit?name=${encodeURIComponent(data.userName)}`);
      const editUserPage = new EditUserPage(page);

      // Verify Edit User form loaded for correct user
      const isCorrectUser = await editUserPage.isOnEditUserForm(data.userName);
      if (!isCorrectUser) {
        console.log('Edit User form not loaded for expected user.');
        if (!data.expectedSuccess) {
          expect(isCorrectUser).toBeFalsy();
          return;
        } else {
          throw new Error('Failed on precondition: User not found');
        }
      }

      // Verify precondition access level (if provided)
      if (data.currentAccessLevel) {
        const access = await editUserPage.getCurrentAccessLevel();
        console.log('Current access level:', access);
        expect(access).toBe(data.currentAccessLevel);
      }

      // Step 2: Change Access Level
      try {
        await editUserPage.changeAccessLevel(data.newAccessLevel);
        // Verify field update (UI reflect)
        const updatedAccess = await editUserPage.getCurrentAccessLevel();
        const expectedUIUpdate = data.expectedSuccess ? data.newAccessLevel : data.currentAccessLevel;
        expect(updatedAccess).toBe(expectedUIUpdate);
      } catch (e) {
        console.log('Error changing access level:', e.message);
        if (!data.expectedSuccess) return;
        throw e;
      }

      // Step 3: Save changes
      try {
        await editUserPage.saveChanges();
        if (data.expectedSuccess) {
          const msg = await editUserPage.waitForSuccessMessage();
          expect(msg).toMatch(/success/i);
        } else {
          // In negative cases, expect no success message
          await expect(editUserPage.successToast).not.toBeVisible({ timeout: 3000 });
        }
      } catch (e) {
        console.log('Error saving:', e.message);
        if (!data.expectedSuccess) return;
        throw e;
      }

      // Postcondition-mock: Save current value in global for DB checks
      if (data.expectedSuccess && data.userName === 'Angela Martin') {
        global.__mockAngelaAccessLevel = data.newAccessLevel;
      }

      // Step 4: Verify User List updated
      const userListPage = new UserListPage(page);
      await userListPage.navigate();
      const accessLevelInList = await userListPage.getUserAccessLevel(data.userName);
      const expectedListLevel = data.expectedSuccess ? data.newAccessLevel : data.currentAccessLevel;
      expect(accessLevelInList).toBe(expectedListLevel);

      // Step 5: Verify Database update (mocked)
      const accessLevelInDB = await DatabaseHelper.queryUserAccessLevel(data.userName);
      expect(accessLevelInDB).toBe(data.expectedDatabaseAccessLevel);

      console.log(`Postcondition - ${data.userName} access in UI: ${accessLevelInList}, DB: ${accessLevelInDB}`);

      console.log(`----- Test End: ${data.title} -----`);
    });
  }
});

/*
--- Notes ---
- The above test loops through a data set for positive, negative, and edge cases.
- DatabaseHelper is a mock/stub. In real framework, replace with direct DB integration or API validation.
- Logging (console.log) is used at logical checkpoints to help with debugging and traceability.
- Element selectors ([data-test=...]) should match the application under test.
- Best practices: Page Object Model promotes maintainability and encapsulation.
- To run: Place this file in your Playwright test suite and ensure Playwright test runner is set up.
*/
```
