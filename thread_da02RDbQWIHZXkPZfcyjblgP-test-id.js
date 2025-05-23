Based on the guidelines provided, here is an outline for creating a Playwright automation script in JavaScript for your test case. Since specifics like the test title, steps, and expected results weren't detailed, make sure to adjust the steps and expected results based on the actual test case you are referring to.

### Page Object Model Structure

1. **Page Object Classes**
   - Define classes for each page involved in the test.

2. **Playwright Test Script**
   - Implement logic using the defined Page Object classes in a single JavaScript file.

3. **Test Data**
   - Use a JSON or JavaScript object for data-driven testing with different inputs.

Here's a structured example:

```javascript
// loginPage.js
class LoginPage {
  constructor(page) {
    this.page = page;
    this.usernameField = page.locator('#username');
    this.passwordField = page.locator('#password');
    this.loginButton = page.locator('#login');
  }

  async enterUsername(username) {
    await this.usernameField.fill(username);
  }

  async enterPassword(password) {
    await this.passwordField.fill(password);
  }

  async clickLogin() {
    await this.loginButton.click();
  }
}

// mainTest.spec.js
const { chromium } = require('playwright');
const LoginPage = require('./loginPage');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  const loginPage = new LoginPage(page);

  // Test Step 1
  await page.goto('https://example.com/login');
  await loginPage.enterUsername('testuser');
  await loginPage.enterPassword('password123');
  await loginPage.clickLogin();

  // Test Step 2
  // Add assertions to verify the expected outcomes

  await browser.close();
})();

// testData.js
const testData = [
  { username: 'validUser', password: 'validPassword', expected: 'Login Successful' },
  { username: 'invalidUser', password: 'password', expected: 'Login Failed' }
];
```

### Notes:
- **Adjust Page Selectors**: Ensure the selectors like `#username`, `#password`, `#login` match the actual elements in your application.
- **Assertions**: Add assertions after each step to compare actual outcomes with expected results.
- **Test Data**: Employ a JSON or JS object for varying the test data inputs to cover multiple scenarios like valid and invalid login.
- **Structure**: Keep your test modular by separating concerns between test logic and page interactions, adhering to the Page Object Model【4:0†Web Automation Testing - System Prompt.txt】.