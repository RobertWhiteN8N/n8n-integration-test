// Automation Script for Playwright - Page Object Model
// Test Title: Example Form Submission Test (Template)
// Preconditions: The user is on the Sample Form page (example: https://demoqa.com/automation-practice-form)
// Test Steps:
//
// Step 1:
// Step: Enter valid/invalid/edge values into the form fields (First Name, Last Name, Email, Mobile, Gender, etc.)
// Expected Results: Fields accept the expected data (accept/reject as per validation).
//
// Step 2:
// Step: Submit the form.
// Expected Results: The form accepts submission if all required fields are valid (error messages otherwise).
//
// Step 3:
// Step: Verify submission dialog displays with input data or appropriate error shown.
// Expected Results: Confirmation dialog data matches submission OR relevant validation error shown.
//
// This script demonstrates the use of Page Objects and data-driven execution with JSON test data.

// ------------------- Page Objects -------------------

// SampleFormPage.js
class SampleFormPage {
    /**
     * @param {import('@playwright/test').Page} page
     */
    constructor(page) {
        this.page = page;
        // Locators - update selectors for real app as needed
        this.firstName = page.locator('#firstName');
        this.lastName = page.locator('#lastName');
        this.email = page.locator('#userEmail');
        this.genderMale = page.locator('input[name="gender"][value="Male"]');
        this.genderFemale = page.locator('input[name="gender"][value="Female"]');
        this.mobile = page.locator('#userNumber');
        this.submitButton = page.locator('#submit');
        this.confirmationDialog = page.locator('#example-modal-sizes-title-lg');
        this.errorMessages = page.locator('.field-error, .input-error, .was-validated');
    }

    async goto() {
        await this.page.goto('https://demoqa.com/automation-practice-form');
        console.log('[INFO] Navigated to Sample Form page');
    }

    async fillFirstName(name) {
        await this.firstName.fill(name);
        console.log(`[INFO] Filled first name: ${name}`);
    }

    async fillLastName(name) {
        await this.lastName.fill(name);
        console.log(`[INFO] Filled last name: ${name}`);
    }

    async fillEmail(email) {
        await this.email.fill(email);
        console.log(`[INFO] Filled email: ${email}`);
    }

    async selectGender(genderStr) {
        if (genderStr.toLowerCase() === 'male') {
            await this.genderMale.check();
        } else if (genderStr.toLowerCase() === 'female') {
            await this.genderFemale.check();
        }
        console.log(`[INFO] Selected gender: ${genderStr}`);
    }

    async fillMobile(number) {
        await this.mobile.fill(number);
        console.log(`[INFO] Filled mobile: ${number}`);
    }

    async submitForm() {
        await this.submitButton.click();
        console.log('[INFO] Form submitted');
    }

    async getConfirmationDialog() {
        const visible = await this.confirmationDialog.isVisible();
        if (visible) {
            const text = await this.confirmationDialog.textContent();
            console.log('[INFO] Submission confirmation dialog displayed');
            return text;
        }
        return null;
    }

    async isErrorDisplayed() {
        // Check if any error messages are visible
        const count = await this.errorMessages.count();
        if (count > 0) {
            for (let i = 0; i < count; i++) {
                if (await this.errorMessages.nth(i).isVisible()) {
                    const msg = await this.errorMessages.nth(i).textContent();
                    console.log(`[ERROR] Field error: ${msg}`);
                }
            }
            return true;
        }
        return false;
    }
}

// ------------------- Test Data -------------------

const testDataSets = [
    // Positive Test Case
    {
        title: "All valid data",
        data: {
            firstName: "John",
            lastName: "Doe",
            email: "john.doe@example.com",
            gender: "Male",
            mobile: "1234567890"
        },
        expectSuccess: true
    },
    // Negative Test Case - Missing email
    {
        title: "Missing email",
        data: {
            firstName: "Jane",
            lastName: "Smith",
            email: "",
            gender: "Female",
            mobile: "9876543210"
        },
        expectSuccess: false
    },
    // Edge Case - Max length fields
    {
        title: "Very long names",
        data: {
            firstName: "A".repeat(50),
            lastName: "B".repeat(50),
            email: "test.edge@example.com",
            gender: "Female",
            mobile: "1112223333"
        },
        expectSuccess: true
    },
    // Negative - Invalid email format
    {
        title: "Invalid email format",
        data: {
            firstName: "Chris",
            lastName: "Evans",
            email: "invalid-email",
            gender: "Male",
            mobile: "4445556666"
        },
        expectSuccess: false
    },
    // Negative - Short mobile number
    {
        title: "Short mobile number",
        data: {
            firstName: "Lee",
            lastName: "Chan",
            email: "lee.chan@example.com",
            gender: "Male",
            mobile: "12345"
        },
        expectSuccess: false
    }
];

// ------------------- Test Script -------------------

const { test, expect } = require('@playwright/test');

test.describe('Sample Form Submission - Data Driven Tests', () => {
    for (const scenario of testDataSets) {
        test(`Form Test: ${scenario.title}`, async ({ page }) => {
            console.log(`\n[TEST CASE] ${scenario.title}`);
            const formPage = new SampleFormPage(page);

            // Step 1: Navigate and fill form fields
            await formPage.goto();
            await formPage.fillFirstName(scenario.data.firstName);
            await formPage.fillLastName(scenario.data.lastName);
            await formPage.fillEmail(scenario.data.email);
            await formPage.selectGender(scenario.data.gender);
            await formPage.fillMobile(scenario.data.mobile);

            // Step 2: Submit the form
            await formPage.submitForm();

            // Step 3: Verification and Assertions
            const confirmationTitle = await formPage.getConfirmationDialog();

            if (scenario.expectSuccess) {
                expect(confirmationTitle).toBeTruthy();
                expect(confirmationTitle).toContain('Thanks for submitting the form');
                console.log('[PASS] Submission successful and dialog displayed');
            } else {
                const errorDisplayed = await formPage.isErrorDisplayed();
                expect(errorDisplayed).toBeTruthy();
                // Negative: Confirmation dialog should not display
                expect(confirmationTitle).toBeFalsy();
                console.log('[PASS] Error message displayed for invalid input');
            }
        });
    }
});


// ------------------- END OF FILE -------------------