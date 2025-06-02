```javascript
// ************************************************************
// Test Title: Verify notification email is not sent to unregistered or empty email addresses
// Preconditions: Attempt account creation or update with a blank or invalid email field.
//
// Test Steps:
// Step 1: Admin attempts to create or update a user with a blank or malformed email.
//         Expected: Operation is rejected and user record is not created or updated.
// Step 2: Check email logs/server for emails sent to the invalid or missing address.
//         Expected: No email notification is sent to blank or invalid addresses.
//
// Post-Conditions: No notification emails are sent to unregistered or invalid email addresses; system enforces correct behavior.
// ************************************************************

// Import Playwright test framework
const { test, expect } = require('@playwright/test');

// ************************************************************
// Page Object: AdminLoginPage
// Description: Encapsulates login functionality for the admin
// ************************************************************
class AdminLoginPage {
    /**
     * @param {import('@playwright/test').Page} page 
     */
    constructor(page) {
        this.page = page;
        this.usernameInput = 'input[name="username"]';
        this.passwordInput = 'input[name="password"]';
        this.loginButton = 'button[type="submit"]';
    }

    async goto() {
        await this.page.goto('https://yourapp.example.com/admin/login');
    }

    async login(username, password) {
        await this.page.fill(this.usernameInput, username);
        await this.page.fill(this.passwordInput, password);
        await this.page.click(this.loginButton);
        await this.page.waitForLoadState('networkidle');
    }
}

// ************************************************************
// Page Object: UserManagementPage
// Description: Encapsulates user creation/updation logic
// ************************************************************
class UserManagementPage {
    /**
     * @param {import('@playwright/test').Page} page 
     */
    constructor(page) {
        this.page = page;
        this.addUserButton = 'button[data-testid="add-user"]';
        this.emailInput = 'input[name="email"]';
        this.nameInput = 'input[name="name"]';
        this.saveButton = 'button[data-testid="save-user"]';
        this.errorMsg = 'div[role="alert"]';
    }

    async goto() {
        await this.page.goto('https://yourapp.example.com/admin/users');
    }

    async createOrUpdateUser({ name, email }) {
        await this.page.click(this.addUserButton);
        await this.page.fill(this.nameInput, name);
        await this.page.fill(this.emailInput, email);
        await this.page.click(this.saveButton);
    }

    async getErrorMessage() {
        return await this.page.textContent(this.errorMsg);
    }

    async isUserPresent(email) {
        return await this.page.locator(`text=${email}`).count() > 0;
    }
}

// ************************************************************
// Page Object: EmailLogsPage
// Description: Encapsulates email logs checking logic
// ************************************************************
class EmailLogsPage {
    /**
     * @param {import('@playwright/test').Page} page 
     */
    constructor(page) {
        this.page = page;
        this.searchInput = 'input[data-testid="email-log-search"]';
        this.searchButton = 'button[data-testid="email-log-search-btn"]';
        this.resultsTable = 'table[data-testid="email-log-table"]';
    }

    async goto() {
        await this.page.goto('https://yourapp.example.com/admin/email-logs');
    }

    async searchForEmail(email) {
        await this.page.fill(this.searchInput, email);
        await this.page.click(this.searchButton);
        await this.page.waitForSelector(this.resultsTable);
    }

    async isEmailPresent(email) {
        // Returns true if any log entry contains the email
        return await this.page.locator(`${this.resultsTable} td:has-text("${email}")`).count() > 0;
    }
}

// ************************************************************
// Test Data: Diverse scenarios, including positive, negative, and edge cases
// ************************************************************
const testDataSet = [
    {
        scenario: "Blank email field",
        name: "Test User Blank Email",
        email: "",
        expectedSuccess: false,
        expectedError: "Email is required",
    },
    {
        scenario: "Malformed email address (missing @)",
        name: "Test User Malformed No At",
        email: "invalidemail.com",
        expectedSuccess: false,
        expectedError: "Enter a valid email address",
    },
    {
        scenario: "Malformed email address (missing domain)",
        name: "Test User Malformed No Domain",
        email: "user@",
        expectedSuccess: false,
        expectedError: "Enter a valid email address",
    },
    {
        scenario: "Whitespace email",
        name: "Test User Whitespace Email",
        email: "   ",
        expectedSuccess: false,
        expectedError: "Email is required",
    },
    {
        scenario: "Valid email (control - should pass, for context)",
        name: "Test User Valid Email",
        email: "validuser@example.com",
        expectedSuccess: true,
        expectedError: "",
    },
];

// ************************************************************
// Logging Utility
// ************************************************************
function logInfo(message) {
    console.log(`[INFO] ${message}`);
}
function logError(message) {
    console.error(`[ERROR] ${message}`);
}

// ************************************************************
// Main Playwright Test Script (data-driven)
// ************************************************************
test.describe('Verify notification email is not sent to unregistered or empty email addresses', () => {
    // Admin credentials (Should be stored securely in actual use)
    const adminUsername = 'admin';
    const adminPassword = 'admin_password';

    // For each data row, run the scenario.
    for (const testData of testDataSet) {
        test(`Scenario: ${testData.scenario}`, async ({ page }) => {
            logInfo(`Starting scenario: ${testData.scenario}`);

            // Step 1: Admin login
            const loginPage = new AdminLoginPage(page);
            await loginPage.goto();
            await loginPage.login(adminUsername, adminPassword);
            logInfo('Logged in as admin');

            // Step 2: Go to user management and attempt user record creation/update
            const userMgmtPage = new UserManagementPage(page);
            await userMgmtPage.goto();
            await userMgmtPage.createOrUpdateUser({
                name: testData.name,
                email: testData.email,
            });
            
            // Step 3: Check if error is shown as expected or not
            if (!testData.expectedSuccess) {
                const errorMsg = await userMgmtPage.getErrorMessage();
                try {
                    expect(errorMsg).toContain(testData.expectedError);
                    logInfo(`Proper error message displayed: "${errorMsg}"`);
                } catch (ex) {
                    logError(`Error message verification failed. Found: "${errorMsg}"`);
                    throw ex;
                }
                // Also ensure user is NOT created
                const userFound = await userMgmtPage.isUserPresent(testData.email.trim());
                expect(userFound).toBeFalsy();
                logInfo('Verified user record did not get created/updated');
            } else {
                // Control: For success case, check user presence
                const userFound = await userMgmtPage.isUserPresent(testData.email.trim());
                expect(userFound).toBeTruthy();
                logInfo('Verified user record was created as expected');
            }

            // Step 4: Go to Email Logs and verify email was not sent for invalid cases
            const emailLogsPage = new EmailLogsPage(page);
            await emailLogsPage.goto();
            if (testData.email.trim() === "" || !testData.expectedSuccess) {
                // Expect NO email sent
                await emailLogsPage.searchForEmail(testData.email.trim());
                const emailPresent = await emailLogsPage.isEmailPresent(testData.email.trim());
                expect(emailPresent).toBeFalsy();
                logInfo('Verified no notification email was sent to invalid/missing address');
            } else {
                // Control case: the valid user should have email logs
                await emailLogsPage.searchForEmail(testData.email.trim());
                const emailPresent = await emailLogsPage.isEmailPresent(testData.email.trim());
                expect(emailPresent).toBeTruthy();
                logInfo('Verified notification email was sent to valid address');
            }
        });
    }
});

// ************************************************************
// End of test script
// ************************************************************
```