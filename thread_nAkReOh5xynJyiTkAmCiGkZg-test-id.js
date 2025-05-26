// =====================================================================================================
// Test Title: User Registration with Diverse Input Coverage
// Preconditions: User is on the Registration page
// Test Steps: 
// Step 1:
//   Step: Fill in registration form with {{username}}, {{email}}, {{password}} and click Register
//   Expected Results: System processes input and shows either success or relevant validation message.
//
// Step 2:
//   Step: If registration is successful, user is redirected to Welcome page
//   Expected Results: Welcome page is displayed with user's name.
//
// Step 3:
//   Step: If registration fails, error/validation message displayed
//   Expected Results: Error/validation message is shown appropriately.
//
// =====================================================================================================

// ======================================== Imports =====================================================

const { test, expect } = require('@playwright/test');

// ======================================== Page Object Model Classes ====================================

// RegistrationPage Class encapsulates all elements and actions for the Registration screen
class RegistrationPage {
    /**
     * @param {import('@playwright/test').Page} page
     */
    constructor(page) {
        this.page = page;
        this.usernameInput = page.locator('#username');         // Username input field
        this.emailInput = page.locator('#email');               // Email input field
        this.passwordInput = page.locator('#password');         // Password input field
        this.registerButton = page.locator('#register');        // Register button
        this.errorBanner = page.locator('.error-message');      // Error/validation banner
    }

    async goto() {
        console.log('[LOG] Navigating to Registration page');
        await this.page.goto('https://example.com/register');
    }

    async fillRegistrationForm(username, email, password) {
        console.log(`[LOG] Filling registration form: username=${username}, email=${email}, password=[HIDDEN]`);
        await this.usernameInput.fill(username);
        await this.emailInput.fill(email);
        await this.passwordInput.fill(password);
    }

    async submitRegistration() {
        console.log('[LOG] Submitting registration form');
        await this.registerButton.click();
    }

    async getErrorMessage() {
        if (await this.errorBanner.isVisible()) {
            const msg = await this.errorBanner.textContent();
            console.log(`[LOG] Error message displayed: ${msg}`);
            return msg;
        }
        return null;
    }
}

// WelcomePage Class encapsulates all elements and actions for the Welcome screen
class WelcomePage {
    /**
     * @param {import('@playwright/test').Page} page
     */
    constructor(page) {
        this.page = page;
        this.welcomeHeader = page.locator('h1.welcome');
        this.userNameLabel = page.locator('#user-name');
    }

    async isAtWelcomePage() {
        const visible = await this.welcomeHeader.isVisible();
        console.log(`[LOG] Welcome header visible: ${visible}`);
        return visible;
    }

    async getDisplayedUserName() {
        const name = await this.userNameLabel.textContent();
        console.log(`[LOG] User name displayed: ${name}`);
        return name;
    }
}

// ======================================== Test Data Set ===============================================

// The testDataSet contains diverse and data-driven scenarios:
// - Positive case (valid inputs)
// - Negative cases (invalid email, too short password, etc.)
// - Edge cases (very long username, empty fields, special characters)
const testDataSet = [
    {
        title: 'Positive - Successful registration',
        username: 'testuser1',
        email: 'testuser1@example.com',
        password: 'ValidPass123!',
        expectSuccess: true,
        expectedWelcomeName: 'testuser1',
        expectedErrorMsg: null
    },
    {
        title: 'Negative - Invalid email format',
        username: 'user2',
        email: 'user2example.com',
        password: 'AnotherPass!2',
        expectSuccess: false,
        expectedWelcomeName: null,
        expectedErrorMsg: 'Please enter a valid email address.'
    },
    {
        title: 'Negative - Password too short',
        username: 'user3',
        email: 'user3@example.com',
        password: '12',
        expectSuccess: false,
        expectedWelcomeName: null,
        expectedErrorMsg: 'Password must be at least 8 characters long.'
    },
    {
        title: 'Edge - Empty fields',
        username: '',
        email: '',
        password: '',
        expectSuccess: false,
        expectedWelcomeName: null,
        expectedErrorMsg: 'All fields are required.'
    },
    {
        title: 'Edge - Username max length',
        username: 'a'.repeat(50),
        email: 'user50@example.com',
        password: 'User50Valid!',
        expectSuccess: true,
        expectedWelcomeName: 'a'.repeat(50),
        expectedErrorMsg: null
    },
    {
        title: 'Negative - Username with invalid characters',
        username: 'test$user*',
        email: 'userstar@example.com',
        password: 'UserStarPass1!',
        expectSuccess: false,
        expectedWelcomeName: null,
        expectedErrorMsg: 'Username contains invalid characters.'
    }
];

// ======================================== Test Script =================================================

test.describe('User Registration - Comprehensive Data-Driven Test', () => {
    for (const data of testDataSet) {
        test(`${data.title}`, async ({ page }) => {
            // Arrange: Instantiate page objects
            const registrationPage = new RegistrationPage(page);
            const welcomePage = new WelcomePage(page);

            // Step 1: Navigate and fill form
            await registrationPage.goto();
            await registrationPage.fillRegistrationForm(data.username, data.email, data.password);
            await registrationPage.submitRegistration();

            // Step 2 & 3: Validate registration outcome
            if (data.expectSuccess) {
                // Expect successful registration
                await expect(welcomePage.welcomeHeader).toBeVisible({ timeout: 5000 });
                const actualUserName = await welcomePage.getDisplayedUserName();
                expect(actualUserName).toBe(data.expectedWelcomeName);
                console.log(`[ASSERT] Registration successful for user: ${actualUserName}`);
            } else {
                // Expect error/validation message
                const errorMessage = await registrationPage.getErrorMessage();
                expect(errorMessage).toBe(data.expectedErrorMsg);
                console.log(`[ASSERT] Error message verified: ${errorMessage}`);
            }
        });
    }
});

// ======================================== End of File =================================================

/*
Summary:
- This Playwright script automates the registration flow using Page Object Model.
- Class: RegistrationPage handles form input and error validation.
- Class: WelcomePage checks for successful registration.
- Data-driven: Multiple input scenarios are covered (positive, negative, edge cases).
- Logging is included for detailed debug information.
To extend, add further negative or edge cases to testDataSet or enhance Page Objects for more robust checks.
*/