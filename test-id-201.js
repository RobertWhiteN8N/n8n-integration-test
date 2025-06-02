```javascript
// playwright-add-new-user-invalid-email.spec.js

// ============================================================================
// Test Title: Validate error for invalid email format during user creation
// Preconditions: Admin user is on 'Add New User' form.
// ============================================================================

// ========================== Test Data =======================================
const testData = [
  // Positive Case
  {
    name: "John Doe",
    email: "john.doe@example.com", // Valid email
    role: "Editor",
    accessLevel: "Read/Write",
    expectedError: null, // Should not expect error
  },
  // Negative Case (Target: invalid email format)
  {
    name: "John Doe",
    email: "john.doe@com", // Invalid email
    role: "Editor",
    accessLevel: "Read/Write",
    expectedError: "Please enter a valid email address", // Example error
  },
  // Edge Case: Empty email
  {
    name: "John Doe",
    email: "", // Empty
    role: "Editor",
    accessLevel: "Read/Write",
    expectedError: "Email is required",
  },
  // Edge Case: Email without '@'
  {
    name: "John Doe",
    email: "johndoe.com", // Invalid
    role: "Editor",
    accessLevel: "Read/Write",
    expectedError: "Please enter a valid email address",
  },
];
// ============================================================================


// ======================= Import Playwright Test =============================
const { test, expect } = require('@playwright/test');

// ======================= Page Object Classes ================================

// -------------------- AddNewUserPage Class ----------------------------------
// Represents the 'Add New User' form.
class AddNewUserPage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;
    // Selectors must be adapted to your application's actual HTML structure.
    this.nameInput = page.locator('input[name="name"]');
    this.emailInput = page.locator('input[name="email"]');
    this.roleDropdown = page.locator('select[name="role"]');
    this.accessLevelDropdown = page.locator('select[name="accessLevel"]');
    this.saveButton = page.locator('button:has-text("Save")');
    this.emailError = page.locator('.email-error, [data-testid="email-error"], .invalid-feedback'); // Update as per UI
    this.formError = page.locator('.form-error, .alert-danger, [role="alert"]'); // Catch-all for error banners
  }

  async enterName(name) {
    await this.nameInput.fill(''); // Clear before typing
    await this.nameInput.type(name);
    console.log(`[INFO] Entered Name: ${name}`);
  }

  async enterEmail(email) {
    await this.emailInput.fill('');
    await this.emailInput.type(email);
    console.log(`[INFO] Entered Email: ${email}`);
  }

  async selectRole(role) {
    await this.roleDropdown.selectOption({ label: role });
    console.log(`[INFO] Selected Role: ${role}`);
  }

  async selectAccessLevel(accessLevel) {
    await this.accessLevelDropdown.selectOption({ label: accessLevel });
    console.log(`[INFO] Selected Access Level: ${accessLevel}`);
  }

  async clickSave() {
    await this.saveButton.click();
    console.log(`[INFO] Clicked Save button`);
  }

  async getEmailError() {
    if (await this.emailError.isVisible()) {
      const text = await this.emailError.innerText();
      console.log(`[DEBUG] Email error text: ${text}`);
      return text.trim();
    }
    return null;
  }

  async getFormError() {
    if (await this.formError.isVisible()) {
      const text = await this.formError.innerText();
      console.log(`[DEBUG] Form error text: ${text}`);
      return text.trim();
    }
    return null;
  }
}

// ============================================================================


// ======================= Test Implementation ================================
test.describe('Add New User - Invalid Email Format', () => {
  test.beforeEach(async ({ page }) => {
    // Perform login and navigate to "Add New User" form as admin.
    // This code assumes you are already on 'Add New User' page (per precondition).
    // If not, you can add navigation/login steps here.
    await page.goto('https://your-admin-app-url.com/admin/users/new');
    console.log(`[INFO] Navigated to Add New User form`);
  });

  for (const data of testData) {
    test(`Should handle user creation with email='${data.email}'`, async ({ page }) => {
      const addUserPage = new AddNewUserPage(page);

      await addUserPage.enterName(data.name);
      await expect(addUserPage.nameInput).toHaveValue(data.name);
      console.log(`[ASSERT] Name field accepts '${data.name}'`);

      await addUserPage.enterEmail(data.email);

      // Email validation might be immediate or after clicking Save depending on the form implementation.

      await addUserPage.selectRole(data.role);
      await addUserPage.selectAccessLevel(data.accessLevel);

      await expect(addUserPage.roleDropdown).toHaveValue(data.role);
      await expect(addUserPage.accessLevelDropdown).toHaveValue(data.accessLevel);
      console.log(`[ASSERT] Role and Access Level fields accept input`);

      await addUserPage.clickSave();

      // Wait for error or success.
      if (data.expectedError) {
        // Try to retrieve error message either from email error or form error banner/toast.
        const emailError = await addUserPage.getEmailError();
        const formError = await addUserPage.getFormError();
        const errorText = emailError || formError || '';

        console.log(`[STEP RESULT] errorText='${errorText}' (expect='${data.expectedError}')`);

        expect(errorText.toLowerCase()).toContain(data.expectedError.toLowerCase());
        console.log(`[ASSERT] System displays a validation error for invalid email format`);
      } else {
        // When valid, check user was created (could be presence of user in list, navigation, or confirmation message).
        // Here, we check for absence of visible error.
        const emailError = await addUserPage.getEmailError();
        const formError = await addUserPage.getFormError();

        console.log(
          `[STEP RESULT] No error should be visible for valid email, found: ${emailError || formError || 'none'}`
        );

        // The test could also validate a success condition (e.g., redirected to users list, toast shown, etc.)
        expect(emailError).toBeNull();
        expect(formError).toBeNull();
      }
    });
  }
});
// ============================================================================


// ============================ END OF FILE ===================================
/*
Test Data (data-driven):
[
  {name: "John Doe", email: "john.doe@example.com", ...}, // Valid email
  {name: "John Doe", email: "john.doe@com", ...}, // Invalid email (missing TLD)
  {name: "John Doe", email: "", ...}, // Missing email
  {name: "John Doe", email: "johndoe.com", ...} // Missing @
]

Page Objects:
- AddNewUserPage: enterName, enterEmail, selectRole, selectAccessLevel, clickSave, getEmailError, getFormError

Test Steps:
- Fill name, email, role, access level -> Click Save -> Assert error or no error depending on the input.

Logging:
- [INFO] for control, [DEBUG] for details, [ASSERT] for checkpoints.

Maintenance:
- Error selectors and form URLs should be updated per app specifics.
- Data set is extensible for new edge cases.
*/
```