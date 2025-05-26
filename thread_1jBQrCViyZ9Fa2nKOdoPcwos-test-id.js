```javascript
// playwright.config.js and necessary setup assumed present in the project
// This .js script contains all required Page Object classes, test logic, and test datasets
// =====================================
// Test Title: Verify import feature supports packages exported from other courses
// =====================================

// ========================
// Page Object: LoginPage
// (Assumption: Login may be required before accessing Course Management. Remove if SSO/autologin.)
// ========================
class LoginPage {
    /**
     * @param {import('@playwright/test').Page} page 
     */
    constructor(page) {
        this.page = page;
        this.usernameInput = page.locator('#username');
        this.passwordInput = page.locator('#password');
        this.loginButton = page.locator('button[type="submit"]');
    }
    async login(username, password) {
        console.log(`Attempt to log in as ${username}`);
        await this.usernameInput.fill(username);
        await this.passwordInput.fill(password);
        await this.loginButton.click();
    }
}

// ========================
// Page Object: CourseManagementPage
// ========================
class CourseManagementPage {
    /**
     * @param {import('@playwright/test').Page} page 
     */
    constructor(page) {
        this.page = page;
        this.pageTitle = page.locator('h1', { hasText: 'Course Management' });
        this.importPackageButton = page.locator('button#import-course-package, a#import-course-package');
    }
    async navigate() {
        console.log('Navigating to Course Management page');
        await this.page.goto('/courses/management');
        await this.pageTitle.waitFor({ state: 'visible' });
    }
    async openImportDialog() {
        console.log('Opening import options');
        await this.importPackageButton.click();
    }
}

// ========================
// Page Object: ImportCoursePackagePage
// ========================
class ImportCoursePackagePage {
    /**
     * @param {import('@playwright/test').Page} page 
     */
    constructor(page) {
        this.page = page;
        this.dialogTitle = page.locator('h2', { hasText: 'Import Course Package' });
        this.fileInput = page.locator('input[type="file"][name="packageFile"]');
        this.uploadButton = page.locator('button:has-text("Upload")');
        this.successMessage = page.locator('.alert-success, .notification-success');
        this.errorMessage = page.locator('.alert-danger, .notification-error');
    }
    async verifyDisplayed() {
        console.log('Verifying Import options screen is displayed');
        await this.dialogTitle.waitFor({ state: 'visible' });
    }
    async uploadPackage(filePath) {
        console.log(`Attempting to upload package: ${filePath}`);
        const [fileChooser] = await Promise.all([
            this.page.waitForEvent('filechooser'),
            this.fileInput.click(),
        ]);
        await fileChooser.setFiles(filePath);
        await this.uploadButton.click();
    }
    async verifyUploadSuccess() {
        console.log('Waiting for success notification');
        await this.successMessage.waitFor({ state: 'visible', timeout: 10000 });
        return await this.successMessage.textContent();
    }
    async verifyUploadFailure() {
        console.log('Checking for upload failure');
        await this.errorMessage.waitFor({ state: 'visible', timeout: 10000 });
        return await this.errorMessage.textContent();
    }
}

// ========================
// Test Data Set
// ========================

const importCoursePackageTestData = [
    // Positive test case: valid package from another course
    {
        id: "T01",
        description: "Valid exported package from a different course",
        filePath: "testdata/packages/course-export-valid.zip",
        expectedResult: "success",
        expectedMessageContains: "uploaded successfully"
    },
    // Negative test case: Corrupt/invalid zip file
    {
        id: "T02",
        description: "Corrupt ZIP file",
        filePath: "testdata/packages/corrupt-package.zip",
        expectedResult: "failure",
        expectedMessageContains: "invalid" // or specific error message
    },
    // Edge case: Export from same course (should still work, but system-specific)
    {
        id: "T03",
        description: "Exported package from the same course",
        filePath: "testdata/packages/course-export-samecourse.zip",
        expectedResult: "success",
        expectedMessageContains: "uploaded successfully"
    },
    // Edge case: Large file
    {
        id: "T04",
        description: "Large package file",
        filePath: "testdata/packages/large-course-export.zip",
        expectedResult: "success",
        expectedMessageContains: "uploaded successfully"
    },
    // Negative: Missing/unsupported file type
    {
        id: "T05",
        description: "Unsupported file type",
        filePath: "testdata/packages/not-zip-file.txt",
        expectedResult: "failure",
        expectedMessageContains: "unsupported"
    }
];

// ========================
// Main Test Script (Playwright test runner format)
// ========================

const { test, expect } = require('@playwright/test');
const path = require('path');

test.describe('Course Package Import Feature', () => {
    // Optional: Credentials, update if authentication is needed
    const validUsername = "admin";
    const validPassword = "password123";

    for (const testData of importCoursePackageTestData) {
        test(`(${testData.id}) Import course package: ${testData.description}`, async ({ page }) => {
            // ---------- Step 0: (Optional) Login -----------
            // Uncomment if your application requires login
            // const loginPage = new LoginPage(page);
            // await loginPage.login(validUsername, validPassword);
            
            // ---------- Step 1: Navigate to Course Management -----------
            const cmPage = new CourseManagementPage(page);
            await cmPage.navigate();
            expect(await cmPage.pageTitle.isVisible()).toBeTruthy();
            console.log('Step 1: Navigated to Course Management page');

            // ---------- Step 2: Open Import Options -----------
            await cmPage.openImportDialog();
            const importPage = new ImportCoursePackagePage(page);
            await importPage.verifyDisplayed();
            console.log('Step 2: Import options screen is displayed');

            // ---------- Step 3: Upload the course package -----------
            const resolvedFilePath = path.resolve(__dirname, testData.filePath);
            await importPage.uploadPackage(resolvedFilePath);

            // Validate outcome per expected result
            if (testData.expectedResult === "success") {
                const msg = await importPage.verifyUploadSuccess();
                console.log('Step 3: Upload successful -', msg);
                expect(msg.toLowerCase()).toContain(testData.expectedMessageContains);
            } else {
                const errorMsg = await importPage.verifyUploadFailure();
                console.log('Step 3: Upload failed -', errorMsg);
                expect(errorMsg.toLowerCase()).toContain(testData.expectedMessageContains);
            }
        });
    }
});

/*
========================
NOTE FOR MAINTAINERS:
- Adjust selectors based on application's actual DOM.
- `filePath` assumes fixture test data structure: update to your local test data path.
- This script provides logging via console for debug visibility.
- To run: `npx playwright test`
- To extend: Add additional test data cases or further page objects as needed.
========================
*/
```