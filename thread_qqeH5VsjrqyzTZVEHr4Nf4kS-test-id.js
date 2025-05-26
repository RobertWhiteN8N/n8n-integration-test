// Test Case Automation Script for Playwright using POM (JavaScript)
// =================================================================

// Test Title: User Registration Flow

// Preconditions:
// - User accesses the registration page on a web application

// Test Steps:
// Step 1:
// Step: Fill registration form with data-set values and submit
// Expected Results: Registration request is sent, and user is redirected to confirmation/welcome page

// Step 2:
// Step: On confirmation/welcome page, verify user details are displayed
// Expected Results: Greeting message with the user’s name/email is shown

// Step 3:
// Step: Log out user by clicking logout button
// Expected Results: User is redirected to login/landing page; login button visible

// =================================================================
// Page Object Model Classes (POM) implementation
// =================================================================

const { test, expect } = require('@playwright/test');

// -------------------------------
// RegistrationPage Page Object
// -------------------------------
class RegistrationPage {
    /**
     * @param {import('@playwright/test').Page} page
     */
    constructor(page) {
        this.page = page;
        this.selectors = {
            firstNameInput: '#firstName',
            lastNameInput: '#lastName',
            emailInput: '#email',
            passwordInput: '#password',
            confirmPasswordInput: '#confirmPassword',
            submitBtn: '#registerBtn'
        }
    }
    async goto() {
        await this.page.goto('https://your-app-url.com/register');
        console.log('Navigated to Registration page');
    }
    async fillRegistrationForm({ firstName, lastName, email, password, confirmPassword }) {
        await this.page.fill(this.selectors.firstNameInput, firstName);
        await this.page.fill(this.selectors.lastNameInput, lastName);
        await this.page.fill(this.selectors.emailInput, email);
        await this.page.fill(this.selectors.passwordInput, password);
        await this.page.fill(this.selectors.confirmPasswordInput, confirmPassword);
        console.log(`Filled registration form for ${email}`);
    }
    async submitForm() {
        await this.page.click(this.selectors.submitBtn);
        console.log('Submitted registration form');
    }
}

// -------------------------------
// WelcomePage Page Object
// -------------------------------
class WelcomePage {
    /**
     * @param {import('@playwright/test').Page} page
     */
    constructor(page) {
        this.page = page;
        this.selectors = {
            greetingText: '#greeting',
            logoutBtn: '#logoutBtn'
        }
    }
    async getGreetingText() {
        const text = await this.page.textContent(this.selectors.greetingText);
        console.log(`Greeting text found: ${text}`);
        return text;
    }
    async logout() {
        await this.page.click(this.selectors.logoutBtn);
        console.log('Clicked logout button');
    }
}

// -------------------------------
// LoginPage Page Object
// -------------------------------
class LoginPage {
    /**
     * @param {import('@playwright/test').Page} page
     */
    constructor(page) {
        this.page = page;
        this.selectors = {
            loginBtn: '#loginBtn',
        }
    }
    async isLoginButtonVisible() {
        const visible = await this.page.isVisible(this.selectors.loginBtn);
        console.log(`Login button visible: ${visible}`);
        return visible;
    }
}

// =================================================================
// Test Data Set - Data Driven Scenarios
// =================================================================

const registrationTestDataSet = [
    // Positive case – valid registration data
    {
        title: 'Valid Registration',
        data: {
            firstName: 'Alice',
            lastName: 'Test',
            email: 'alice.test1@example.com',
            password: 'Password123!',
            confirmPassword: 'Password123!',
        },
        expectedGreeting: 'Welcome, Alice!',
        expectSuccess: true
    },
    // Negative case – mismatched passwords
    {
        title: 'Password mismatch',
        data: {
            firstName: 'Bob',
            lastName: 'Mismatch',
            email: 'bob.mismatch@example.com',
            password: 'Password456!',
            confirmPassword: 'Password789!',
        },
        expectedError: 'Passwords do not match',
        expectSuccess: false
    },
    // Edge case - empty fields
    {
        title: 'Empty Fields',
        data: {
            firstName: '',
            lastName: '',
            email: '',
            password: '',
            confirmPassword: '',
        },
        expectedError: 'Required field',
        expectSuccess: false
    },
    // Edge case - invalid email address
    {
        title: 'Invalid Email',
        data: {
            firstName: 'Dana',
            lastName: 'Email',
            email: 'invalid-email',
            password: 'EmailPass!1',
            confirmPassword: 'EmailPass!1',
        },
        expectedError: 'Enter a valid email',
        expectSuccess: false
    },
    // Edge case - weak password
    {
        title: 'Weak Password',
        data: {
            firstName: 'Eve',
            lastName: 'WeakPwd',
            email: 'eve.weak@example.com',
            password: 'abc',
            confirmPassword: 'abc',
        },
        expectedError: 'Password is too weak',
        expectSuccess: false
    }
];

// =================================================================
// Playwright Test Script - Data Driven Execution
// =================================================================

test.describe('User Registration Flow', () => {
    for (const testCase of registrationTestDataSet) {
        test(`${testCase.title}`, async ({ page }) => {
            const regPage = new RegistrationPage(page);
            await regPage.goto();

            await regPage.fillRegistrationForm(testCase.data);
            await regPage.submitForm();

            if (testCase.expectSuccess) {
                const welcomePage = new WelcomePage(page);
                await expect(page).toHaveURL(/\/welcome|\/confirmation/);
                const greeting = await welcomePage.getGreetingText();
                expect(greeting).toContain(testCase.expectedGreeting);

                await welcomePage.logout();

                const loginPage = new LoginPage(page);
                await expect(page).toHaveURL(/\/login|\/landing/);
                const loginBtnVisible = await loginPage.isLoginButtonVisible();
                expect(loginBtnVisible).toBe(true);
            } else {
                // Expect error message, field error, or failed navigation
                let errorFound = false;

                // Try to detect generic form error
                try {
                    const errorMsg = await page.textContent('.error-message');
                    if (errorMsg && errorMsg.includes(testCase.expectedError)) {
                        errorFound = true;
                        console.log('Error found:', errorMsg);
                    }
                } catch (e) {
                    // Element might not be present
                }
                // Try to detect field validation errors
                try {
                    const errorField = await page.textContent('text=' + testCase.expectedError);
                    if (errorField) {
                        errorFound = true;
                        console.log('Field error detected:', errorField);
                    }
                } catch (e) {
                    // Ignore not found
                }
                expect(errorFound).toBe(true);
            }
        });
    }
});

// =================================================================
// End of Automation Script
// =================================================================

/*
Notes:

- This file includes all required Page Object classes and test logic in a single JS file for Playwright.
- UI selectors (CSS/XPath) must match your actual application’s DOM structure.
- Logging is handled via console.log for step-by-step debug output.
- Test data includes a variety of positive, negative, and edge cases.
- Data-driven: Each scenario is described and will be logged by its "title".
- Adjust selectors, URLs, error messages, and structure as needed for your application.
- Can be run with: npx playwright test <thisfile.js>
*/