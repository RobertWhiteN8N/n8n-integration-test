// Automated Playwright Test Script Using Page Object Model (POM)  
// Test Case: User Registration Flow  
// ===============================================================
// Test Title: User Registration: Handle positive, negative, and edge cases
// Preconditions: User is on the Registration page ("/register")
// Test Steps and Expected Results:
//  Step 1:
//    Step: Enter registration details (username, email, password, confirm password) and submit.
//    Expected Result: "Registration successful" message or appropriate validation error shown.
//  Step 2:
//    Step: Verify new user's presence (on successful registration) or remain on registration form (on errors).
//    Expected Result: If registration succeeds, lands on Welcome page/dashboard. If fails, error is shown and remains on page.
//  Step 3:
//    Step: Attempt registration with edge test data (e.g., blank fields, invalid email, mismatched passwords, existing user).
//    Expected Result: Page validation blocks submission and error messages are displayed.
// ===============================================================

const { test, expect } = require('@playwright/test')

// ===================== Page Object Classes =====================

// Registration Page Object Model
class RegistrationPage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page
    this.usernameInput = page.locator('#username')
    this.emailInput = page.locator('#email')
    this.passwordInput = page.locator('#password')
    this.confirmPasswordInput = page.locator('#confirmPassword')
    this.submitButton = page.locator('button[type="submit"]')
    this.successMessage = page.locator('.alert-success')
    this.errorMessages = page.locator('.alert-danger, .error-message')
  }

  async goto() {
    await this.page.goto('/register')
  }

  async fillRegistrationForm({ username, email, password, confirmPassword }) {
    await this.usernameInput.fill(username)
    await this.emailInput.fill(email)
    await this.passwordInput.fill(password)
    await this.confirmPasswordInput.fill(confirmPassword)
  }

  async submit() {
    await this.submitButton.click()
  }

  async registerUser(data) {
    await this.fillRegistrationForm(data)
    await this.submit()
  }

  async getSuccessText() {
    if (await this.successMessage.isVisible())
      return await this.successMessage.textContent()
    return null
  }

  async getErrorTexts() {
    const errorsCount = await this.errorMessages.count()
    const errors = []
    for (let i = 0; i < errorsCount; i++) {
      errors.push(await this.errorMessages.nth(i).textContent())
    }
    return errors
  }
}

// Dashboard/Welcome Page Object (for post-registration success)
class DashboardPage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page
    this.welcomeTitle = page.locator('h1')
    this.userProfile = page.locator('.user-profile')
  }

  async isLoaded() {
    return await this.welcomeTitle.isVisible()
  }

  async getWelcomeText() {
    return await this.welcomeTitle.textContent()
  }
}

// ======================= Test Data Set =========================
// Diverse registration data: positive, negative, edge cases

const registrationTestData = [
  {
    name: 'Valid registration',
    data: {
      username: 'testuser1',
      email: 'testuser1@example.com',
      password: 'StrongPass123!',
      confirmPassword: 'StrongPass123!'
    },
    expected: {
      success: true,
      message: 'Registration successful',
      errors: []
    }
  },
  {
    name: 'Username already taken',
    data: {
      username: 'existinguser',
      email: 'uniqueemail1@example.com',
      password: 'AnotherPass12!',
      confirmPassword: 'AnotherPass12!'
    },
    expected: {
      success: false,
      errorsInclude: ['Username already exists']
    }
  },
  {
    name: 'Invalid email format',
    data: {
      username: 'newuser2',
      email: 'not-an-email',
      password: 'GoodPass88!',
      confirmPassword: 'GoodPass88!'
    },
    expected: {
      success: false,
      errorsInclude: ['Invalid email']
    }
  },
  {
    name: 'Password mismatch',
    data: {
      username: 'testuser3',
      email: 'testuser3@example.com',
      password: 'Password123!',
      confirmPassword: 'DifferentPass!'
    },
    expected: {
      success: false,
      errorsInclude: ['Passwords do not match']
    }
  },
  {
    name: 'Blank fields',
    data: {
      username: '',
      email: '',
      password: '',
      confirmPassword: ''
    },
    expected: {
      success: false,
      errorsInclude: ['Username is required', 'Email is required', 'Password is required']
    }
  },
  {
    name: 'Short password',
    data: {
      username: 'user4',
      email: 'user4@example.com',
      password: '123',
      confirmPassword: '123'
    },
    expected: {
      success: false,
      errorsInclude: ['Password must be at least']
    }
  }
]

// ======================= Logging Utility =======================

function logStep(message) {
  console.log(`\n[STEP] ${message}`)
}
function logDebug(message) {
  console.log(`[DEBUG] ${message}`)
}
function logError(message) {
  console.error(`[ERROR] ${message}`)
}

// ========================= Test Script =========================

// Playwright test with data-driven execution
test.describe('User Registration Page Automation', () => {
  for (const td of registrationTestData) {
    test(`${td.name}`, async ({ page }) => {
      const registrationPage = new RegistrationPage(page)
      const dashboardPage = new DashboardPage(page)

      // Step 1: Goto registration page and enter user data
      logStep(`Navigating to registration page for: ${td.name}`)
      await registrationPage.goto()

      logStep('Filling registration form')
      await registrationPage.fillRegistrationForm(td.data)

      logStep('Submitting registration form')
      await registrationPage.submit()

      // Step 2: Handle success/validation/error cases
      if (td.expected.success) {
        // Success scenario, should land on Welcome/dashboard page
        await expect(registrationPage.successMessage).toBeVisible()
        const successText = await registrationPage.getSuccessText()
        logDebug(`Success message shown: "${successText}"`)
        expect(successText).toContain(td.expected.message)
        // Optionally, check dashboard loaded
        await expect(dashboardPage.welcomeTitle).toBeVisible()
        const welcomeText = await dashboardPage.getWelcomeText()
        expect(welcomeText).toMatch(/Welcome/i)
      } else {
        // Error/negative scenario: still on registration, errors shown
        logStep('Validating error messages on failure/edge case')
        await expect(registrationPage.errorMessages.nth(0)).toBeVisible()
        const errorTexts = await registrationPage.getErrorTexts()
        logDebug(`Error messages: ${JSON.stringify(errorTexts)}`)
        for (const err of td.expected.errorsInclude || []) {
          expect(errorTexts.join('|')).toContain(err)
        }
      }
    })
  }
})

// ======================= End of Script =========================

/*
===============================================================
  Script Structure:

  1. Test Analysis & Steps: See comments/top of file.
  2. Page Objects: RegistrationPage, DashboardPage.
  3. Test Data Set: registrationTestData array.
  4. Logging: logStep(), logDebug(), logError().
  5. Playwright test.describe block: Iterates test data and runs full flow.
===============================================================
*/