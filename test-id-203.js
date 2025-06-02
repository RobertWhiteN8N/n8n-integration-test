```javascript
// Playwright Automation Script
// Test Title: Validate error for duplicate email during user creation

// ---------------------
// PAGE OBJECT CLASSES
// ---------------------

// AddNewUserPage encapsulates actions and element selectors for the "Add New User" form
class AddNewUserPage {
    /**
     * @param {import('@playwright/test').Page} page
     */
    constructor(page) {
        this.page = page;
        this.nameField = page.locator('input[name="name"]');
        this.emailField = page.locator('input[name="email"]');
        this.roleDropdown = page.locator('select[name="role"]');
        this.accessLevelDropdown = page.locator('select[name="accessLevel"]');
        this.saveButton = page.locator('button:has-text("Save")');
        this.errorNotification = page.locator('.error-message'); // selector for error message element
    }

    async enterName(name) {
        console.log(`Entering Name: ${name}`);
        await this.nameField.fill('');
        await this.nameField.type(name);
    }

    async enterEmail(email) {
        console.log(`Entering Email: ${email}`);
        await this.emailField.fill('');
        await this.emailField.type(email);
    }

    async selectRole(role) {
        console.log(`Selecting Role: ${role}`);
        await this.roleDropdown.selectOption({ label: role });
    }

    async selectAccessLevel(level) {
        console.log(`Selecting Access Level: ${level}`);
        await this.accessLevelDropdown.selectOption({ label: level });
    }

    async clickSave() {
        console.log(`Clicking the Save button`);
        await this.saveButton.click();
    }

    /**
     * Wait for and get the error message text if present.
     * @returns {Promise<string|null>}
     */
    async getErrorMessage() {
        const visible = await this.errorNotification.isVisible();
        if (visible) {
            const message = await this.errorNotification.textContent();
            console.log(`Error message displayed: ${message}`);
            return message;
        } else {
            console.log('No error message displayed.');
            return null;
        }
    }
}

// ---------------------
// TEST DATA SET
// ---------------------

// A set of scenarios including the duplicate email case (positive, negative, edge cases)
//
// Structure:
//  - name: string
//  - email: string
//  - role: string
//  - accessLevel: string
//  - expectedError: string|null (null if should succeed, string if expecting error)
//
const addUserTestScenarios = [
    // Positive scenario for baseline (should pass, not used email)
    {
        name: "New Unique User",
        email: "unique.user" + Math.floor(Math.random()*10000) + "@mail.com", // ensure unique
        role: "Editor",
        accessLevel: "Write",
        expectedError: null
    },
    // Negative scenario: duplicate email
    {
        name: "Duplicate User",
        email: "duplicate.user@mail.com",
        role: "Viewer",
        accessLevel: "Read Only",
        expectedError: "Email already exists"
    },
    // Edge case: missing email
    {
        name: "Missing Email User",
        email: "",
        role: "Viewer",
        accessLevel: "Read Only",
        expectedError: "Email is required"
    },
    // Edge case: invalid email format
    {
        name: "Bad Email Format",
        email: "bademail@.com",
        role: "Viewer",
        accessLevel: "Read Only",
        expectedError: "Enter a valid email address"
    },
];

// ---------------------
// MAIN TEST SCRIPT
// ---------------------

const { test, expect } = require('@playwright/test');

test.describe('Add New User Form - Duplicate Email Validation', () => {
    // Loop through each data set to drive both positive, negative, and edge scenarios
    for (const scenario of addUserTestScenarios) {
        test(`Add user: [${scenario.name}] [${scenario.email}]`, async ({ page }) => {
            // 1. Ensure "Add New User" form is loaded for admin
            // You may have to perform login/navigation here.
            // For this script, assume precondition is fulfilled as per the test case instructions.

            // Instantiate the page object
            const addUserPage = new AddNewUserPage(page);

            // LOG: Scenario start
            console.log(`\n=== Starting scenario: ${JSON.stringify(scenario)} ===`);

            // Step 1: Enter Name
            await addUserPage.enterName(scenario.name);
            // Step 2: Enter Email
            await addUserPage.enterEmail(scenario.email);
            // Step 3: Select Role
            await addUserPage.selectRole(scenario.role);
            // Step 4: Select Access Level
            await addUserPage.selectAccessLevel(scenario.accessLevel);
            // Step 5: Click Save
            await addUserPage.clickSave();

            // Validation / Assertion Section
            // Expect error for duplicate (and other invalid) emails, or success if unique
            if (scenario.expectedError) {
                const errorMessage = await addUserPage.getErrorMessage();
                expect(errorMessage).toContain(scenario.expectedError);
                console.log(`Validated error scenario as expected: "${scenario.expectedError}"`);
            } else {
                // For success, ensure no error message, possibly check redirection or success info
                const errorMessage = await addUserPage.getErrorMessage();
                expect(errorMessage).toBeNull();
                // Optionally, check for user added confirmation message or user list update
                // e.g. await page.waitForSelector('.user-added-success', { timeout: 2000 });
                console.log(`Validated successful user addition (no error displayed).`);
            }

            // LOG: Scenario end
            console.log(`=== Finished scenario: ${scenario.name} ===\n`);
        });
    }
});

/*
---------------------
Page Object Model (POM) Usage Diagram:
---------------------
Test (Playwright)
   |
   v
AddNewUserPage  <--- encapsulates selectors & actions for "Add New User" form
   |
   |-- .enterName()
   |-- .enterEmail()
   |-- .selectRole()
   |-- .selectAccessLevel()
   |-- .clickSave()
   |-- .getErrorMessage()

---------------------
Test Data Set
---------------------
const addUserTestScenarios = [ ... ];

---------------------
Logging
---------------------
Console logs indicate stepwise execution and any errors/messages returned by the app during the test case.

---------------------
Test Execution Coverage
---------------------
- Duplicate email (main negative path)
- Unique email (positive path)
- Missing email (edge)
- Bad format (edge)

---------------------
Test Maintenance
---------------------
- Page object selectors and methods can be updated as form UI evolves.
- More scenarios can be added/modified in `addUserTestScenarios` array.

---------------------
End of Script
---------------------
*/
```