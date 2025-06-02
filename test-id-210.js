```javascript
// Playwright Automation Script for:
// Test Title: Verify immediate revocation of deleted user's access

// ----------------------
// Page Object Classes
// ----------------------

// AdminLoginPage.js
class AdminLoginPage {
    /**
     * Page Object for the Admin Login Page
     * Methods: login(adminUsername, adminPassword)
     */
    constructor(page) {
        this.page = page;
        this.usernameInput = page.locator('#admin-username');
        this.passwordInput = page.locator('#admin-password');
        this.loginButton = page.locator('button[type="submit"]');
    }
    async login(adminUsername, adminPassword) {
        console.log('Admin: Logging in...');
        await this.usernameInput.fill(adminUsername);
        await this.passwordInput.fill(adminPassword);
        await this.loginButton.click();
    }
}

// AdminUserManagementPage.js
class AdminUserManagementPage {
    /**
     * Page Object for the Admin User Management page
     * Methods: searchUser(email), deleteUser(email)
     */
    constructor(page) {
        this.page = page;
        this.userSearchInput = page.locator('#user-search');
        this.searchButton = page.locator('button#search-user');
        this.resultRow = (email) => page.locator(`tr:has(td:text("${email}"))`);
        this.deleteButton = (email) => this.resultRow(email).locator('button.delete-user');
        this.confirmDeleteButton = page.locator('button.confirm');
        this.successToast = page.locator('.toast-success');
    }
    async searchUser(email) {
        console.log(`Admin: Searching for user ${email}...`);
        await this.userSearchInput.fill(email);
        await this.searchButton.click();
        await this.resultRow(email).waitFor({state: 'visible', timeout: 7000});
    }
    async deleteUser(email) {
        console.log(`Admin: Deleting user ${email}...`);
        await this.deleteButton(email).click();
        await this.confirmDeleteButton.click();
        await this.successToast.waitFor({ state: 'visible', timeout: 7000 });
    }
}

// UserLoginPage.js
class UserLoginPage {
    /**
     * Page Object for the User Login Page
     * Methods: login(userEmail, userPassword)
     */
    constructor(page) {
        this.page = page;
        this.emailInput = page.locator('#user-email');
        this.passwordInput = page.locator('#user-password');
        this.loginButton = page.locator('button[type="submit"]');
    }
    async login(userEmail, userPassword) {
        console.log('User: Logging in...');
        await this.emailInput.fill(userEmail);
        await this.passwordInput.fill(userPassword);
        await this.loginButton.click();
    }
}

// UserDashboardPage.js
class UserDashboardPage {
    /**
     * Page Object for the User Dashboard Page
     * Methods: goto(), isAccessRevoked(), isRedirectedToLogin(), getAccessDeniedMessage()
     */
    constructor(page) {
        this.page = page;
        this.dashboardUrl = '/user/dashboard';
        this.loginUrl = '/login';
        this.accessDeniedBanner = page.locator('.access-denied-message');
        this.loginForm = page.locator('#user-login-form');
    }
    async goto() {
        console.log('User: Navigating to dashboard...');
        await this.page.goto(this.dashboardUrl);
    }
    async isRedirectedToLogin() {
        return this.page.url().includes(this.loginUrl) || await this.loginForm.isVisible();
    }
    async isAccessRevoked() {
        return await this.accessDeniedBanner.isVisible();
    }
    async getAccessDeniedMessage() {
        return await this.accessDeniedBanner.textContent();
    }
}

// ----------------------
// Test Data Set
// ----------------------

/**
 * Diverse test scenarios, including positive, negative, and edge cases.
 */
const testDataSet = [
    // Positive: User exists, deletion performed, expect access revoked immediately
    {
        admin:     { username: 'admin', password: 'adminPass123' },
        user:      { email: 'angela.martin@company.com', password: 'UserPass!234' },
        expectRevoked: true,
        description: 'Existing user is deleted, access revoked in all sessions'
    },
    // Negative: User does not exist, deletion fails, access remains (simulate deletion failure)
    {
        admin:     { username: 'admin', password: 'adminPass123' },
        user:      { email: 'user.notfound@company.com', password: 'NoPass' },
        expectRevoked: false,
        description: 'Non-existing user deletion attempt, user access is not revoked'
    },
    // Edge: User already deleted, admin tries to delete again, user still cannot access
    {
        admin:     { username: 'admin', password: 'adminPass123' },
        user:      { email: 'angela.martin@company.com', password: 'UserPass!234' },
        preDeleted: true,
        expectRevoked: true,
        description: 'User was already deleted; cannot re-delete; still access revoked'
    }
];

// ----------------------
// test-case.ts
// ----------------------

const { test, expect, chromium } = require('@playwright/test');

test.describe('Immediate Revocation of Deleted User Access', () => {
    for (const data of testDataSet) {
        test(`Verify deletion and session revocation: ${data.description}`, async () => {
            console.log('== Starting scenario:', data.description);

            // Launch two separate browser contexts
            const adminBrowser = await chromium.launch();
            const adminContext = await adminBrowser.newContext();
            const adminPage = await adminContext.newPage();

            const userBrowser = await chromium.launch();
            const userContext = await userBrowser.newContext();
            const userPage = await userContext.newPage();

            const adminLoginPage = new AdminLoginPage(adminPage);
            const adminUMPage = new AdminUserManagementPage(adminPage);

            const userLoginPage = new UserLoginPage(userPage);
            const userDashboardPage = new UserDashboardPage(userPage);

            // USER: Login and establish session
            await userPage.goto('/login');
            await userLoginPage.login(data.user.email, data.user.password);
            await userDashboardPage.goto();

            // Optionally prepare: If testing already-deleted scenario, delete user first before anything else
            if (data.preDeleted) {
                await adminPage.goto('/admin/login');
                await adminLoginPage.login(data.admin.username, data.admin.password);
                await adminPage.goto('/admin/user-management');
                await adminUMPage.searchUser(data.user.email);
                await adminUMPage.deleteUser(data.user.email);
                // User still tries to open dashboard after deletion (simulate old session)
            }

            // ADMIN: Now delete user (unless it's negative or preDeleted scenario)
            if (!data.preDeleted && data.expectRevoked) {
                await adminPage.goto('/admin/login');
                await adminLoginPage.login(data.admin.username, data.admin.password);
                await adminPage.goto('/admin/user-management');
                await adminUMPage.searchUser(data.user.email);
                await adminUMPage.deleteUser(data.user.email);
            } else if (!data.expectRevoked) {
                // simulate failed deletion or user not found
                await adminPage.goto('/admin/login');
                await adminLoginPage.login(data.admin.username, data.admin.password);
                await adminPage.goto('/admin/user-management');
                try {
                    await adminUMPage.searchUser(data.user.email);
                    // Don't call deleteUser. Let user remain.
                } catch (err) {
                    console.log('Admin: User not found, skipping delete.');
                }
            }

            // USER: Try to access dashboard after admin deletion
            await userDashboardPage.goto();

            let revoked = false;
            let redirect = false;
            let message = '';
            
            revoked = await userDashboardPage.isAccessRevoked();
            redirect = await userDashboardPage.isRedirectedToLogin();
            if (revoked) {
                message = await userDashboardPage.getAccessDeniedMessage();
            }

            // Logging for debug visibility
            console.log('User session revoked:', revoked);
            console.log('User redirected to login:', redirect);
            console.log('Access denied message:', message);

            // Verify result based on scenario
            if (data.expectRevoked) {
                expect(
                  revoked || redirect,
                  'User access is not revoked after deletion'
                ).toBeTruthy();
            } else {
                expect(
                  !(revoked || redirect),
                  'User access was revoked despite expected access'
                ).toBeTruthy();
            }

            // Teardown sessions
            await adminBrowser.close();
            await userBrowser.close();
        });
    }
});

// ----------------------
// End of file
// ----------------------
```
