// Automated Playwright Test Script (Page Object Model) for an Example Test Case
// All details and code are combined into a single `.js` file as requested.

// --------------------------------------------------
// TEST CASE DETAILS (replace these with real values)
// --------------------------------------------------
/*
Test Title: User Registration Functionality

Preconditions: User is on the Registration Page.

Test Steps: 
Step 1:
  Step: Enter registration details (username, email, password, confirm password) and submit.
  Expected Results: Registration form is submitted; success or error message is displayed.

Step 2:
  Step: Verify user is navigated to the Welcome page upon successful registration.
  Expected Results: Welcome page and "Registration Successful" message visible.

Step 3:
  Step: Try registering with invalid data (e.g., existing username, mismatched passwords, invalid email)
  Expected Results: Appropriate error messages are displayed; registration blocked.
*/
// --------------------------------------------------

// ==================================================
// PAGE OBJECT: RegistrationPage
// ==================================================
class RegistrationPage {
    constructor(page) {
        this.page = page;
        this.usernameInput = page.locator('#username');
        this.emailInput = page.locator('#email');
        this.passwordInput = page.locator('#password');
        this.confirmPasswordInput = page.locator('#confirmPassword');
        this.registerButton = page.locator('#register');
        this.errorMsg = page.locator('.error-message'); // generic error container
        this.successMsg = page.locator('.success-message');
    }

    async goto() {
        await this.page.goto('https://example.com/register');
        console.log('[INFO] Navigated to Registration Page');
    }
    
    async enterRegistrationDetails(data) {
        if (data.username) {
            await this.usernameInput.fill(data.username);
            console.log(`[INFO] Entered Username: ${data.username}`);
        }
        if (data.email) {
            await this.emailInput.fill(data.email);
            console.log(`[INFO] Entered Email: ${data.email}`);
        }
        if (data.password) {
            await this.passwordInput.fill(data.password);
            console.log(`[INFO] Entered Password`);
        }
        if (data.confirmPassword) {
            await this.confirmPasswordInput.fill(data.confirmPassword);
            console.log(`[INFO] Entered Confirm Password`);
        }
    }
    
    async submit() {
        await this.registerButton.click();
        console.log('[INFO] Clicked Register');
    }

    async getErrorMessage() {
        if (await this.errorMsg.isVisible()) {
            const msg = await this.errorMsg.textContent();
            console.log(`[WARN] Error Message Displayed: ${msg}`);
            return msg;
        }
        return null;
    }

    async getSuccessMessage() {
        if (await this.successMsg.isVisible()) {
            const msg = await this.successMsg.textContent();
            console.log(`[INFO] Success Message: ${msg}`);
            return msg;
        }
        return null;
    }
}

// ==================================================
// PAGE OBJECT: WelcomePage
// ==================================================
class WelcomePage {
    constructor(page) {
        this.page = page;
        this.welcomeHeader = page.locator('h1.welcome-title');
        this.successBanner = page.locator('.success-message');
    }
    async isLoaded() {
        const headerVisible = await this.welcomeHeader.isVisible();
        return headerVisible;
    }
    async getWelcomeMessage() {
        if (await this.successBanner.isVisible()) {
            const msg = await this.successBanner.textContent();
            console.log(`[INFO] Welcome Message: ${msg}`);
            return msg;
        }
        return null;
    }
}

// ==================================================
// TEST DATA SET (Positive, Negative, Edge cases)
// ==================================================
/*
   Each object represents a test scenario:
   - description: for log clarity
   - username, email, password, confirmPassword: input fields
   - expectSuccess: whether to expect successful registration
   - expectedError: expected error string, if any
*/
const registrationTestData = [
    {
        description: 'Valid new user registration',
        username: 'testuser123',
        email: 'testuser123@example.com',
        password: 'Password@1',
        confirmPassword: 'Password@1',
        expectSuccess: true,
        expectedError: null
    },
    {
        description: 'Existing username',
        username: 'existinguser',
        email: 'uniqueemail1@example.com',
        password: 'Password@1',
        confirmPassword: 'Password@1',
        expectSuccess: false,
        expectedError: 'Username already taken'
    },
    {
        description: 'Mismatched passwords',
        username: 'someuser',
        email: 'uniqueemail2@example.com',
        password: 'Password@1',
        confirmPassword: 'Password@2',
        expectSuccess: false,
        expectedError: 'Passwords do not match'
    },
    {
        description: 'Invalid email format',
        username: 'anotheruser',
        email: 'invalidemail',
        password: 'Password@1',
        confirmPassword: 'Password@1',
        expectSuccess: false,
        expectedError: 'Please enter a valid email address'
    },
    {
        description: 'Empty fields',
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        expectSuccess: false,
        expectedError: 'All fields are required'
    },
    {
        description: 'Password too short',
        username: 'shortpassuser',
        email: 'shortpass@example.com',
        password: 'pass',
        confirmPassword: 'pass',
        expectSuccess: false,
        expectedError: 'Password must be at least 8 characters'
    }
];

// ==================================================
// PLAYWRIGHT TEST SCRIPT (Data-Driven Execution)
// ==================================================

const { test, expect } = require('@playwright/test');

// Main test suite for User Registration
test.describe('User Registration Test Suite', () => {

    // Data-driven: Each test scenario runs as a separate test
    for (const testData of registrationTestData) {
        test(`Registration Scenario: ${testData.description}`, async ({ page }) => {
            const registrationPage = new RegistrationPage(page);

            // Step 1: Load Registration Page and enter details
            await registrationPage.goto();
            await registrationPage.enterRegistrationDetails(testData);
            await registrationPage.submit();
            
            // Step 2 and 3: Validate success or error cases
            if (testData.expectSuccess) {
                // Expect success message on Registration page
                const successMsg = await registrationPage.getSuccessMessage();
                expect(successMsg).toContain('Registration Successful');
                
                // Optional: Validate Welcome Page content
                const welcomePage = new WelcomePage(page);
                await expect(welcomePage.welcomeHeader).toBeVisible();
                const welcomeMessage = await welcomePage.getWelcomeMessage();
                expect(welcomeMessage).toContain('Registration Successful');

                console.log(`[PASS] Registration succeeded as expected: ${testData.description}`);
            } else {
                // Expect an error message
                const errorMsg = await registrationPage.getErrorMessage();
                expect(errorMsg).toContain(testData.expectedError);
                console.log(`[PASS] Correct error for invalid input "${testData.description}": ${errorMsg}`);
            }
        });
    }
});

// ==================================================
// END OF SCRIPT
// ==================================================