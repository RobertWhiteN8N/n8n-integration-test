To implement the test case "Students Receive Notifications on New Posts" using Playwright and JavaScript, we'll follow the Page Object Model (POM) pattern for maintainability and scalability. Here's how you can structure the JavaScript code in a single file with embedded Page Objects and test logic:

```javascript
// Import Playwright
const { chromium } = require('playwright');

// Test Data Example
const testData = [
  {
    content: 'New Assignment: Algebra Worksheet',
    studentSections: ['Section A', 'Section B']
  }
];

// Page Object for Login Page
class LoginPage {
  constructor(page) {
    this.page = page;
    this.usernameInput = page.locator('#username');
    this.passwordInput = page.locator('#password');
    this.loginButton = page.locator('#login');
  }

  async login(username, password) {
    await this.page.fill(this.usernameInput, username);
    await this.page.fill(this.passwordInput, password);
    await this.page.click(this.loginButton);
  }
}

// Page Object for Dashboard Page
class DashboardPage {
  constructor(page) {
    this.page = page;
    this.contentInput = page.locator('#newPostContent');
    this.sectionsDropdown = page.locator('#sectionSelect');
    this.postButton = page.locator('#postButton');
  }

  async postNewContent(content, sections) {
    await this.page.fill(this.contentInput, content);
    for (const section of sections) {
      await this.page.selectOption(this.sectionsDropdown, section);
    }
    await this.page.click(this.postButton);
  }
}

// Page Object for Notifications
class NotificationsPage {
  constructor(page) {
    this.page = page;
    this.notificationsList = page.locator('#notificationsList');
  }

  async checkNotificationReceived(content) {
    const notifications = await this.page.innerText(this.notificationsList);
    return notifications.includes(content);
  }
}

// Test Script
(async () => {
  // Launch Browser
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Instantiate Page Objects
  const loginPage = new LoginPage(page);
  const dashboardPage = new DashboardPage(page);
  const notificationsPage = new NotificationsPage(page);

  // Step 1: User logs in
  await page.goto('http://school-portal/login');
  await loginPage.login('teacher1', 'password123');

  // Step 2: Post new content
  await dashboardPage.postNewContent(testData[0].content, testData[0].studentSections);

  // Step 3: Verify student notifications
  const notificationReceived = await notificationsPage.checkNotificationReceived(testData[0].content);
  console.assert(notificationReceived, 'Notification for new content was not received by students.');

  // Close Browser
  await browser.close();
})();
```

### Explanation:

1. **Page Objects**: Three classes (`LoginPage`, `DashboardPage`, and `NotificationsPage`) encapsulate the logic for interacting with each page's elements, maintaining separation of concerns.

2. **Test Data**: A JSON-like object `testData` provides data examples to run the test script under different scenarios, though here only one scenario is presented.

3. **Test Execution**:
   - The script uses Playwright to launch a browser, performs login, posts new content, and finally verifies that the notifications are generated and received correctly.

4. **Assertions**: Using `console.assert()` to ensure the notification was received, adhering to the expected result of the test case.

This setup should be integrated within your testing infrastructure to handle user authentication, and it may be extended with additional steps such as handling multiple test scenarios using varied data sets provided within `testData`【4:0†source】.