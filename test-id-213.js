```javascript
// playwright-admin-delete-user.spec.js

// ======================================================================
// Test Title: Admin selects and deletes a user account
// Preconditions: Admin user is logged in. At least one user 'kevin.malone@company.com' exists.
// Steps:
//   1. Navigate to 'User Management' from the dashboard
//   2. Select user 'kevin.malone@company.com'
//   3. Click 'Delete' button/icon
//   4. Confirm deletion
// Post-Conditions: User 'kevin.malone@company.com' no longer exists
// ======================================================================

// Required Playwright imports
const { test, expect } = require('@playwright/test');

// ======================================================================
// Page Object: DashboardPage
// Encapsulates access to the dashboard and navigation to User Management
// ======================================================================
class DashboardPage {
    /**
     * @param {import('@playwright/test').Page} page
     */
    constructor(page) {
        this.page = page;
        this.userManagementLink = page.locator('a:has-text("User Management")');
    }
    async goto() {
        await this.page.goto('https://your-app-url/dashboard');
    }
    async navigateToUserManagement() {
        console.log('Navigating to User Management section...');
        await this.userManagementLink.click();
    }
}

// ======================================================================
// Page Object: UserManagementPage
// Encapsulates interactions with the User Management screen
// ======================================================================
class UserManagementPage {
    /**
     * @param {import('@playwright/test').Page} page
     */
    constructor(page) {
        this.page = page;
        this.pageTitle = page.locator('h1', { hasText: 'User Management' });
        this.successMessage = page.locator('.alert-success');
    }

    async isDisplayed() {
        await expect(this.pageTitle).toBeVisible();
    }

    userRowLocator(email) {
        return this.page.locator(`tr:has(td:has-text("${email}"))`);
    }

    userSelectCheckbox(email) {
        return this.userRowLocator(email).locator('input[type="checkbox"]');
    }

    deleteButtonForUser(email) {
        return this.userRowLocator(email).locator('button[title="Delete"], .icon-trash');
    }
    async selectUser(email) {
        const checkbox = this.userSelectCheckbox(email);
        await expect(checkbox).toBeVisible();
        console.log(`Selecting user: ${email}`);
        await checkbox.check();
    }
    async clickDeleteForUser(email) {
        const deleteBtn = this.deleteButtonForUser(email);
        await expect(deleteBtn).toBeEnabled();
        console.log(`Clicking delete for user: ${email}`);
        await deleteBtn.click();
    }
    async userExists(email) {
        return await this.userRowLocator(email).isVisible();
    }
    async verifyUserRemoved(email) {
        await expect(this.userRowLocator(email)).not.toBeVisible();
    }
    async verifySuccess(messageSnippet) {
        await expect(this.successMessage).toContainText(messageSnippet);
    }
}

// ======================================================================
// Page Object: ConfirmationDialog
// Handles confirmation modal/dialog
// ======================================================================
class ConfirmationDialog {
    /**
     * @param {import('@playwright/test').Page} page
     */
    constructor(page) {
        this.page = page;
        this.dialog = page.locator('.modal-dialog, [role="dialog"], .confirmation-dialog');
        this.confirmButton = this.dialog.locator('button:has-text("Confirm"), button:has-text("Delete")');
        this.cancelButton = this.dialog.locator('button:has-text("Cancel")');
    }
    async waitForDialog() {
        await expect(this.dialog).toBeVisible();
    }
    async confirm() {
        console.log('Confirming deletion in dialog...');
        await this.confirmButton.click();
    }
}

// ======================================================================
// Test Data Set: Users to delete
// Includes positive (user exists), negative (user does not exist), and edge case (user with long email)
// ======================================================================
const deleteUserTestData = [
    {
        description: 'Positive: Delete existing user',
        email: 'kevin.malone@company.com',
        userShouldExist: true,
        expectedSuccessSnippet: 'successfully deleted',
    },
    {
        description: 'Negative: Attempt delete non-existing user',
        email: 'nonexistent.user@company.com',
        userShouldExist: false,
        expectedSuccessSnippet: '',
    },    
    {
        description: 'Edge: Delete user with long email',
        email: 'averylongusernameforuserdeletiontestcase@examplecompanydomain.com',
        userShouldExist: true,
        expectedSuccessSnippet: 'successfully deleted',
    }    
];

// ======================================================================
// Test Implementation: Playwright test using Page Objects and Test Data
// ======================================================================
test.describe('Admin deletes a user from User Management', () => {
    deleteUserTestData.forEach((testData) => {
        test(testData.description, async ({ page }) => {
            const dashboardPage = new DashboardPage(page);
            const userManagementPage = new UserManagementPage(page);
            const confirmationDialog = new ConfirmationDialog(page);

            // ========== Step 1: Navigate to User Management ==========
            await dashboardPage.goto();
            await dashboardPage.navigateToUserManagement();
            await userManagementPage.isDisplayed();

            // ========== Step 2: Select the user ==========
            if (testData.userShouldExist) {
                // Wait for the user to be visible; fail if absent
                const exists = await userManagementPage.userExists(testData.email);
                expect(exists).toBeTruthy();
                await userManagementPage.selectUser(testData.email);

                // ========== Step 3: Trigger user delete ==========
                await userManagementPage.clickDeleteForUser(testData.email);

                // ========== Step 4: Confirm deletion dialog ==========
                await confirmationDialog.waitForDialog();
                await confirmationDialog.confirm();

                // ========== Post-Condition: User no longer in system ==========
                await userManagementPage.verifyUserRemoved(testData.email);
                await userManagementPage.verifySuccess(testData.expectedSuccessSnippet);
            } else {
                // Negative test: User not in list, verify delete not possible
                const exists = await userManagementPage.userExists(testData.email);
                expect(exists).toBeFalsy();
                console.log(`User ${testData.email} not found as expected.`);
            }
        });
    });
});
```
