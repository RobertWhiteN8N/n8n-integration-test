```javascript
// Automation Test Script for:
// Test Title: Send email notification to user on modification of account details

// USING: Playwright Test (JS), Page Object Model, and Data Driven Test

// ================= SETUP & IMPORTS =================
const { test, expect } = require('@playwright/test');

// ================= PAGE OBJECT CLASSES =================

// Page Object: LoginPage
class LoginPage {
    /**
    * @param {import('@playwright/test').Page} page
    */
    constructor(page) {
        this.page = page;
        this.usernameInput = page.locator('#username'); // Adjust selector to the application's markup
        this.passwordInput = page.locator('#password');
        this.loginButton = page.locator('button[type="submit"]');
    }

    async login(username, password) {
        console.log('Logging in as:', username);
        await this.usernameInput.fill(username);
        await this.passwordInput.fill(password);
        await this.loginButton.click();
    }
}

// Page Object: UserManagementPage
class UserManagementPage {
    /**
    * @param {import('@playwright/test').Page} page
    */
    constructor(page) {
        this.page = page;
        this.menuUserManagement = page.locator('nav >> text=User Management'); // Adjust selector accordingly
        this.searchInput = page.locator('input[placeholder="Search User"]'); // Adjust
        // We'll use text-based locator for Jessica Lane's row
    }

    async navigate() {
        console.log('Navigating to User Management page');
        await this.menuUserManagement.click();
    }

    async searchUser(username) {
        console.log('Searching for user:', username);
        await this.searchInput.fill(username);
        await this.page.keyboard.press('Enter');
    }

    async clickEditForUser(username) {
        // Assume a row contains the name and an Edit button in the last column:
        const row = this.page.locator(`tr:has(td:text("${username}"))`);
        await expect(row).toBeVisible();
        const editButton = row.locator('button:has-text("Edit")');
        console.log('Clicking Edit for user:', username);
        await editButton.click();
    }
}

// Page Object: EditUserPage
class EditUserPage {
    /**
    * @param {import('@playwright/test').Page} page
    */
    constructor(page) {
        this.page = page;
        this.nameInput = page.locator('input[name="name"]');
        this.roleDropdown = page.locator('select[name="role"]');
        this.accessLevelDropdown = page.locator('select[name="accessLevel"]');
        this.saveButton = page.locator('button:has-text("Save"), button:has-text("Update")');
        this.confirmationMsg = page.locator('.alert-success, .notification-success');
    }

    async verifyLoadedWith(userData) {
        console.log('Verifying Edit form is pre-filled');
        await expect(this.nameInput).toHaveValue(userData.name);
        await expect(this.roleDropdown).toHaveValue(userData.role);
        await expect(this.accessLevelDropdown).toHaveValue(userData.accessLevel);
    }

    async modifyRoleAndAccess(newRole, newAccessLevel) {
        console.log(`Updating Role to ${newRole}, Access Level to ${newAccessLevel}`);
        await this.roleDropdown.selectOption({ label: newRole });
        await this.accessLevelDropdown.selectOption({ label: newAccessLevel });
    }

    async verifyModifications(newRole, newAccessLevel) {
        await expect(this.roleDropdown).toHaveValue(newRole.toLowerCase());
        await expect(this.accessLevelDropdown).toHaveValue(newAccessLevel.toLowerCase());
    }

    async saveChanges() {
        console.log('Saving user changes');
        await this.saveButton.click();
    }

    async expectConfirmation() {
        await expect(this.confirmationMsg).toBeVisible();
    }
}

// Page Object: Mock/EmailInboxPage
// For demonstration, this checks a mock email view or a Mailhog/mailcatcher UI.
// Adjust selectors and URL as per actual system or test environment.
class EmailInboxPage {
    /**
    * @param {import('@playwright/test').Page} page
    */
    constructor(page, email) {
        this.page = page;
        this.email = email;
    }

    async openInbox() {
        // For mock mail system; adjust as necessary.
        console.log(`Opening mailbox for: ${this.email}`);
        // Suppose the system is MailHog at http://localhost:8025/#/
        await this.page.goto('http://localhost:8025/');
        await this.page.fill('input[type="search"]', this.email);
        await this.page.keyboard.press('Enter');
    }

    async assertEmailReceived(subjectContains, bodyChecks) {
        // Wait and click on the newest email, check subject and body for expected content
        const mailSubject = this.page.locator('.msglist-subject').first();
        await expect(mailSubject).toContainText(subjectContains);

        await mailSubject.click();
        const mailBody = this.page.locator('.msgviewer-content'); // Adjust selector
        for (const text of bodyChecks) {
            await expect(mailBody).toContainText(text);
        }
        console.log(`Verified notification email received about account modification.`);
    }
}

// ================== TEST DATA SET (DATA-DRIVEN) ==================

// Each entry is a scenario: positive, negative, or edge.
// As per requirement, this mainly covers positive scenario, but structure allows for more.
const testDataSet = [
    // POSITIVE: Standard role/access level update
    {
        description: 'Update Jessica Lane role to Admin and access to Full',
        adminUser: { username: 'admin', password: 'adminpass' },
        targetUser: {
            name: 'Jessica Lane',
            email: 'jessica.lane@example.com',
            oldRole: 'User',
            oldAccessLevel: 'Limited'
        },
        update: {
            newRole: 'Admin',
            newAccessLevel: 'Full'
        },
        expectEmail: {
            subject: 'Your account has been updated',
            bodyContains: [
                'Dear Jessica Lane',
                'Your user account has been modified',
                'Role: Admin',
                'Access Level: Full'
            ]
        }
    },
    // NEGATIVE: Try updating to empty values (should not allow)
    {
        description: 'Attempt to set empty role/access level (validation expected)',
        adminUser: { username: 'admin', password: 'adminpass' },
        targetUser: {
            name: 'Jessica Lane',
            email: 'jessica.lane@example.com',
            oldRole: 'User',
            oldAccessLevel: 'Limited'
        },
        update: {
            newRole: '', // Edge/Negative: attempt to blank fields
            newAccessLevel: ''
        },
        expectError: true
    },
    // EDGE: No change scenario (should not send email)
    {
        description: 'No change to role/access; no email expected',
        adminUser: { username: 'admin', password: 'adminpass' },
        targetUser: {
            name: 'Jessica Lane',
            email: 'jessica.lane@example.com',
            oldRole: 'User',
            oldAccessLevel: 'Limited'
        },
        update: {
            newRole: 'User',
            newAccessLevel: 'Limited'
        },
        expectNoEmail: true
    }
]

// ================== TEST SCRIPT ==================

test.describe('Account modification sends email notification', () => {
    // Page object handles
    /** @type {LoginPage} */
    let loginPage;
    /** @type {UserManagementPage} */
    let userMgmtPage;
    /** @type {EditUserPage} */
    let editUserPage;
    /** @type {EmailInboxPage} */
    let emailInboxPage;

    for (const data of testDataSet) {
        test(data.description, async ({ page }) => {

            loginPage = new LoginPage(page);
            userMgmtPage = new UserManagementPage(page);
            editUserPage = new EditUserPage(page);
            // Step 1: Login as Admin
            await page.goto('https://your-app-under-test.example.com/login');
            await loginPage.login(data.adminUser.username, data.adminUser.password);

            // Step 2: Navigate User Management, search Jessica Lane, click Edit
            await userMgmtPage.navigate();
            await userMgmtPage.searchUser(data.targetUser.name);
            await userMgmtPage.clickEditForUser(data.targetUser.name);

            // Step 3: Edit form loaded with current details
            await editUserPage.verifyLoadedWith({
                name: data.targetUser.name,
                role: data.targetUser.oldRole.toLowerCase(),
                accessLevel: data.targetUser.oldAccessLevel.toLowerCase()
            });

            // Step 4: Modify Role & Access Level (or simulate negative/edge as per data)
            await editUserPage.modifyRoleAndAccess(data.update.newRole, data.update.newAccessLevel);

            // Validation/confirmation step as per scenario
            if (data.expectError) {
                // Try saving and expect validation error
                await editUserPage.saveChanges();
                const err = page.locator('.error, .invalid-feedback');
                await expect(err).toBeVisible();
                // Skip email validation in this case
                return;
            } else {
                await editUserPage.verifyModifications(
                    data.update.newRole,
                    data.update.newAccessLevel
                );
                await editUserPage.saveChanges();
                await editUserPage.expectConfirmation();
            }

            // Step 5: Validate mailbox receipt (skip for negative/no change cases)
            if (data.expectNoEmail) {
                // In real tests, you would check mailbox is NOT updated
                emailInboxPage = new EmailInboxPage(page, data.targetUser.email);
                await emailInboxPage.openInbox();
                // Wait some seconds and verify inbox has no new message
                const noMailMsg = page.locator('.msglist-nomessages'); // Or appropriate empty inbox selector
                await expect(noMailMsg).toHaveText(/No messages/i);
                // Or count messages before/after as precondition
            } else if (data.expectEmail) {
                // Go to test mail inbox and confirm
                // (wait for email delivery if async; possibly add retries/polling)
                await page.waitForTimeout(2000);
                emailInboxPage = new EmailInboxPage(page, data.targetUser.email);
                await emailInboxPage.openInbox();
                await emailInboxPage.assertEmailReceived(
                    data.expectEmail.subject,
                    data.expectEmail.bodyContains
                );
            }
        });
    }
});

// ================== END OF TEST SCRIPT ==================

// Note: 
// - Adjust all CSS selectors and test URLs according to actual application and test email environment.
// - If verifying real email may not be feasible, use a mocked SMTP or mailcatcher/MailHog for automated inbox assertions.
// - Logging provided via console.log for step visibility during test runs.
```