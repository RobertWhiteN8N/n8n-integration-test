To create a Playwright test automation script in JavaScript for your test case titled "Course Package Includes All Content, Tests, and Tools", I'll outline the approach based on the testing strategy described in your document. The key focus will be developing a script with modularity and maintainability.

### Playwright Test Script Outline

1. **Create Page Object Classes** for key pages in the test:
    - **LoginPage:** For handling login actions.
    - **CourseExportPage:** For actions related to course export configurations.

2. **Write Test Script**:
   - Implement the test logic using the Page Object classes.
   - Integrate structured test data for configuration settings and course selections.

3. **Define Test Data Set**:
   - Create a JS object containing scenarios for positive test cases.

4. **Ensure Best Practices**:
   - Follow modular code practices and maintain the ability to extend them for additional test cases.

Below is a structured JavaScript Playwright script:

```javascript
// Import Playwright
const { chromium } = require('playwright');

// Page object for LoginPage
class LoginPage {
  constructor(page) {
    this.page = page;
    this.usernameField = '#username';
    this.passwordField = '#password';
    this.loginButton = '#loginBtn';
  }

  async login(username, password) {
    await this.page.fill(this.usernameField, username);
    await this.page.fill(this.passwordField, password);
    await this.page.click(this.loginButton);
  }
}

// Page object for CourseExportPage
class CourseExportPage {
  constructor(page) {
    this.page = page;
    this.courseSelect = '#courseSelect';
    this.includeTestsCheckbox = '#includeTests';
    this.includeContentCheckbox = '#includeContent';
    this.includeToolsCheckbox = '#includeTools';
    this.exportButton = '#exportBtn';
  }

  async navigate() {
    await this.page.goto('https://example.com/course-export');
  }

  async configureExport() {
    await this.page.check(this.includeTestsCheckbox);
    await this.page.check(this.includeContentCheckbox);
    await this.page.check(this.includeToolsCheckbox);
  }

  async selectCourseAndExport(courseName) {
    await this.page.selectOption(this.courseSelect, courseName);
    await this.configureExport();
    await this.page.click(this.exportButton);
  }
}

// Playwright test script
(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  const loginPage = new LoginPage(page);
  await loginPage.login('admin', 'password123');

  const courseExportPage = new CourseExportPage(page);
  await courseExportPage.navigate();
  await courseExportPage.selectCourseAndExport('Intro to QA');

  // Add validation steps for confirming export settings

  await browser.close();
})();
```

### Test Data
Define a structured JS object for test data:

```javascript
const testData = {
  user: {
    username: 'admin',
    password: 'password123'
  },
  courseName: 'Intro to QA',
  exportOptions: {
    includeTests: true,
    includeContent: true,
    includeTools: true
  }
};
```

### Notes:
- Adjust page selectors based on the actual rendering of your web application's elements.
- Incorporate the retrieval and validation of test results after execution to confirm expected behaviors.

This setup ensures a robust and adaptable testing framework that can be expanded for additional scenarios and tests【4:0†source】.