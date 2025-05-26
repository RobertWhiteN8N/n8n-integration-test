// Test Automation Script for Playwright (JavaScript) - Page Object Model
//
// -------------------------------------
// Test Case: User Registration Functionality
// Preconditions: User navigates to the registration page
// Test Steps and Expected Results:
// Step 1: Fill in registration form with {{username}}, {{email}}, and {{password}}
//         Expected: Fields accept input, and any invalid feedback appears if applicable
// Step 2: Click the Register button
//         Expected: Form submits if valid, and user is redirected or sees confirmation; error appears if invalid
// Step 3: Validate registration result (success message or error)
//         Expected: If registration successful, see 'Registration Successful'. If invalid, see error message
//
// POM Structure:
//  - RegistrationPage
//    - fillUsername(username)
//    - fillEmail(email)
//    - fillPassword(password)
//    - submitRegistration()
//    - getSuccessMessage()
//    - getErrorMessage()
//
// Test Data:
//  - Multiple scenarios (positive, negative, edge)
//
// -------------------------------------
// BEGIN SOURCE CODE
// -------------------------------------

const { test, expect } = require('@playwright/test');

// -------------------------------------
// Page Object: RegistrationPage
// -------------------------------------

class RegistrationPage {
    /**
     * @param {import('@playwright/test').Page} page 
     */
    constructor(page) {
        this.page = page;
        // Selectors for the registration page (Update the selectors as per the AUT)
        this.usernameInput = page.locator('input[name="username"]');
        this.emailInput = page.locator('input[name="email"]');
        this.passwordInput = page.locator('input[name="password"]');
        this.registerButton = page.locator('button[type="submit"]');
        this.successMessage = page.locator('.success-message');
        this.errorMessage = page.locator('.error-message');
    }

    /**
     * Navigates to the registration page
     */
    async goto() {
        await this.page.goto('https://example.com/register'); // <-- Adapt URL
        console.log('[INFO] Navigated to registration page.');
    }

    /**
     * Fills in the username field
     * @param {string} username 
     */
    async fillUsername(username) {
        await this.usernameInput.fill(username);
        console.log(`[INFO] Username filled: ${username}`);
    }

    /**
     * Fills in the email field
     * @param {string} email 
     */
    async fillEmail(email) {
        await this.emailInput.fill(email);
        console.log(`[INFO] Email filled: ${email}`);
    }

    /**
     * Fills in the password field
     * @param {string} password 
     */
    async fillPassword(password) {
        await this.passwordInput.fill(password);
        console.log(`[INFO] Password filled: ${'*'.repeat(password.length)}`);
    }

    /**
     * Clicks the register/submit button
     */
    async submitRegistration() {
        await this.registerButton.click();
        console.log('[INFO] Registration form submitted.');
    }

    /**
     * Returns the registration success message text
     */
    async getSuccessMessage() {
        if (await this.successMessage.isVisible()) {
            return await this.successMessage.textContent();
        }
        return '';
    }

    /**
     * Returns the registration error message text
     */
    async getErrorMessage() {
        if (await this.errorMessage.isVisible()) {
            return await this.errorMessage.textContent();
        }
        return '';
    }
}

// -------------------------------------
// Test Data Sets (Data-driven approach)
// -------------------------------------

// Registration Data Scenarios
const registrationTestData = [
    // Positive test case
    {
        title: 'Valid registration',
        data: { username: 'john_doe001', email: 'john.doe001@example.com', password: 'Password123!' },
        expected: { success: true, successMsg: 'Registration Successful', errorMsgContains: '' }
    },
    // Negative: Missing Username
    {
        title: 'Missing username',
        data: { username: '', email: 'abc@domain.com', password: 'ValidPass1!' },
        expected: { success: false, successMsg: '', errorMsgContains: 'username' }
    },
    // Negative: Invalid Email
    {
        title: 'Invalid email address',
        data: { username: 'janedoe', email: 'not-an-email', password: 'SuperSecure2#' },
        expected: { success: false, successMsg: '', errorMsgContains: 'email' }
    },
    // Negative: Password too short (edge)
    {
        title: 'Password too short',
        data: { username: 'shortpass', email: 'short@domain.com', password: '123' },
        expected: { success: false, successMsg: '', errorMsgContains: 'password' }
    },
    // Edge: Very long username
    {
        title: 'Edge case: very long username',
        data: { username: 'a'.repeat(256), email: 'longuser@domain.com', password: 'ValidPass2$' },
        expected: { success: false, successMsg: '', errorMsgContains: 'username' }
    },
    // Negative: Duplicate email
    {
        title: 'Duplicate email registration',
        data: { username: 'uniqueuser', email: 'john.doe001@example.com', password: 'DifferentPass3!' },
        expected: { success: false, successMsg: '', errorMsgContains: 'already' }
    },
    // Edge: All fields empty
    {
        title: 'Edge case: empty fields',
        data: { username: '', email: '', password: '' },
        expected: { success: false, successMsg: '', errorMsgContains: '' }
    }
];

// -------------------------------------
// Test Script (data-driven execution)
// -------------------------------------

test.describe('User Registration Functionality', () => {
    for (const td of registrationTestData) {
        test(td.title, async ({ page }) => {
            // Instantiate the RegistrationPage POM
            const registrationPage = new RegistrationPage(page);

            // Step 1: Navigate and fill in registration form
            await registrationPage.goto();
            await registrationPage.fillUsername(td.data.username);
            await registrationPage.fillEmail(td.data.email);
            await registrationPage.fillPassword(td.data.password);

            // Step 2: Submit the form
            await registrationPage.submitRegistration();

            // Step 3: Validate outcome
            const successMsg = await registrationPage.getSuccessMessage();
            const errorMsg = await registrationPage.getErrorMessage();

            // Logging collected status
            console.log(`[DEBUG] Success message: "${successMsg}"`);
            console.log(`[DEBUG] Error message: "${errorMsg}"`);

            if (td.expected.success) {
                await expect(successMsg).toContain(td.expected.successMsg);
                await expect(errorMsg).toBe('');
                console.log('[PASS] Registration succeeded as expected.');
            } else {
                if (td.expected.errorMsgContains) {
                    await expect(errorMsg.toLowerCase()).toContain(td.expected.errorMsgContains.toLowerCase());
                } else {
                    await expect(errorMsg.length).toBeGreaterThan(0);
                }
                await expect(successMsg).toBe('');
                console.log('[PASS] Registration failed as expected.');
            }
        });
    }
});

// -------------------------------------
// END OF FILE
// -------------------------------------