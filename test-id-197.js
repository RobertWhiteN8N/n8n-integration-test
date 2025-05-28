```javascript
// -----------------------------------------------------------------------------
// Test Title: Verify notification email content includes relevant information
// about account creation or modification
// Preconditions: A system-triggered email notification for user creation or
// update action is sent to 'Jessica Lane' (jessica.lane@example.com).
// -----------------------------------------------------------------------------
// Test Steps:
// 1. Access the inbox of 'jessica.lane@example.com' after an account creation or modification.
//    - Expected: Notification email from system is present in inbox.
// 2. Open the notification email and review its content.
//    - Expected: Email includes user name, current role, access level, and type of action (created or modified).
// -----------------------------------------------------------------------------
// Test Data Set: Covers positive (valid), negative (missing info), and edge (multiple similars) cases.
// -----------------------------------------------------------------------------
// Playwright JavaScript Implementation using Page Object Model (POM)
// -----------------------------------------------------------------------------

const { test, expect } = require('@playwright/test')

// -----------------------------------------------------------------------------
// Logging utility for debug visibility
function log(message) {
  console.log(`[AUTOMATION-LOG]: ${message}`);
}

// -----------------------------------------------------------------------------
// Test Data: Multiple scenarios including positive, negative, and edge cases

const testDataSet = [
  // Positive scenario: All info present, action = created
  {
    desc: 'Positive - account created',
    actionType: 'created',
    email: {
      from: 'no-reply@system.com',
      subjectContains: 'Account Created',
      expectedContent: {
        userName: 'Jessica Lane',
        role: 'Administrator',
        accessLevel: 'Full',
        actionText: 'created'
      }
    }
  },
  // Positive scenario: All info present, action = modified
  {
    desc: 'Positive - account modified',
    actionType: 'modified',
    email: {
      from: 'no-reply@system.com',
      subjectContains: 'Account Modified',
      expectedContent: {
        userName: 'Jessica Lane',
        role: 'Editor',
        accessLevel: 'Limited',
        actionText: 'modified'
      }
    }
  },
  // Negative scenario: Email missing user name
  {
    desc: 'Negative - missing user name',
    actionType: 'created',
    email: {
      from: 'no-reply@system.com',
      subjectContains: 'Account Created',
      expectedContent: {
        userName: '',          // Should not be empty
        role: 'Viewer',
        accessLevel: 'Read-Only',
        actionText: 'created'
      }
    }
  },
  // Edge: Multiple notifications with similar subjects, should match newest
  {
    desc: 'Edge - multiple emails, pick latest',
    actionType: 'modified',
    email: {
      from: 'no-reply@system.com',
      subjectContains: 'Account Modified',
      expectedContent: {
        userName: 'Jessica Lane',
        role: 'Admin',
        accessLevel: 'Full',
        actionText: 'modified'
      },
      isMultiple: true // Simulate multiple emails, latest should be checked
    }
  }
];

// -----------------------------------------------------------------------------
// Page Object: LoginPage (for web email login, if required)
// -----------------------------------------------------------------------------
class LoginPage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page
    // Locators - adjust as per actual webmail login page
    this.usernameInput = page.locator('input[type="email"], input[name="username"], input#login-username')
    this.passwordInput = page.locator('input[type="password"], input[name="password"], input#login-password')
    this.loginButton = page.locator('button[type="submit"], input[type="submit"], button#login')
  }

  async login(username, password) {
    log(`Attempting login as: ${username}`)
    await this.usernameInput.fill(username)
    await this.passwordInput.fill(password)
    await this.loginButton.click()
    log(`Login submitted for: ${username}`)
  }
}

// -----------------------------------------------------------------------------
// Page Object: InboxPage (listing emails)
// -----------------------------------------------------------------------------
class InboxPage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page
    // Locators
    this.emailListItems = page.locator('.email-item, .mail-list-item, tr.email-row')
    this.senderSelector = '.email-sender, .from, .sender'
    this.subjectSelector = '.email-subject, .subject'
  }

  // Find the latest email by subject and sender, or all matching if isMultiple
  async getEmailBySubjectAndSender(subjectText, sender, isMultiple = false) {
    log(`Searching for email from "${sender}" with subject containing "${subjectText}"`);
    // Wait for at least one email to load, increase timeout if required
    await this.emailListItems.first().waitFor({ state: 'visible', timeout: 10000 });

    const emailCount = await this.emailListItems.count();
    let matches = []
    for (let i = 0; i < emailCount; i++) {
      const item = this.emailListItems.nth(i);
      const subjectVal = await item.locator(this.subjectSelector).innerText();
      const senderVal = await item.locator(this.senderSelector).innerText();
      log(`Checking email #${i}: subject="${subjectVal}", sender="${senderVal}"`)
      if (
        subjectVal.toLowerCase().includes(subjectText.toLowerCase()) &&
        senderVal.toLowerCase().includes(sender.toLowerCase())
      ) {
        matches.push(item)
      }
    }
    if (matches.length === 0) {
      log('No matching email found!')
      return null
    }
    log(`Found ${matches.length} matching email(s)`);
    // For edge case, return latest (topmost)
    return isMultiple ? matches[0] : matches[0]
  }

  async openEmail(emailItem) {
    log('Opening found email...')
    await emailItem.click()
    // Wait for detail view to open
    await this.page.waitForSelector('.email-body, .mail-body, .email-message', { timeout: 10000 });
  }
}

// -----------------------------------------------------------------------------
// Page Object: EmailDetailPage (reading the email itself)
// -----------------------------------------------------------------------------
class EmailDetailPage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page
    // Locators
    this.emailBody = page.locator('.email-body, .mail-body, .email-message')
    this.subjectHeader = page.locator('.email-subject-header, h1.subject, .msg-subject')
    this.senderHeader = page.locator('.email-from, .from-header, .sender-header')
  }

  // Return all visible email body text
  async getBodyText() {
    await this.emailBody.waitFor({ state: 'visible', timeout: 10000 });
    return await this.emailBody.textContent()
  }

  async getHeaderText() {
    let [subject, sender] = await Promise.all([
      this.subjectHeader.textContent(),
      this.senderHeader.textContent()
    ])
    return { subject, sender }
  }
}


// -----------------------------------------------------------------------------
// Test - Data Driven: Loop over testDataSet and execute test for each
// -----------------------------------------------------------------------------

test.describe('Notification Email Content Test', () => {
  // Reuse username/password as per test setup (assuming ready mailbox)
  const EMAIL_USERNAME = 'jessica.lane@example.com'
  const EMAIL_PASSWORD = 'MailPassword!23'

  // Webmail URL (replace as per actual system)
  const WEBMAIL_URL = 'https://webmail.example.com'

  for (const data of testDataSet) {
    test(`Validate notification email - ${data.desc}`, async ({ page }) => {
      log('Test Start: ' + data.desc)

      // Step 1: Login to email inbox
      await page.goto(WEBMAIL_URL);
      log('Webmail login page opened...')
      const loginPage = new LoginPage(page)
      await loginPage.login(EMAIL_USERNAME, EMAIL_PASSWORD)

      // Step 2: Locate notification email in inbox
      const inboxPage = new InboxPage(page)
      const emailItem = await inboxPage.getEmailBySubjectAndSender(
        data.email.subjectContains,
        data.email.from,
        data.email.isMultiple
      )
      expect(emailItem, 'Notification email must be present in inbox').not.toBeNull()

      // Step 3: Open email and validate content
      await inboxPage.openEmail(emailItem)
      const detailPage = new EmailDetailPage(page)
      const bodyText = await detailPage.getBodyText()

      // Debug log email content
      log('Email body: ' + bodyText)

      // Step 4: Validate presence and correctness of required info
      const { userName, role, accessLevel, actionText } = data.email.expectedContent
      if (userName) {
        expect(bodyText).toContain(userName)
      } else {
        expect(bodyText).not.toMatch(/Jessica\s+Lane/)
      }
      expect(bodyText).toContain(role)
      expect(bodyText).toContain(accessLevel)
      expect(bodyText).toContain(actionText)

      log('Required information verified for notification email.')

      // Post-Condition covered: Notification must contain correct and relevant info
    })
  }
})

// -----------------------------------------------------------------------------
// End of test script
// -----------------------------------------------------------------------------

// -----------------------------------------------------------------------------
// Instructions for maintenance and adaptability:
// - Update selectors as per your webmail UI structure.
// - Adjust login method and fields for security and webmail provider differences.
// - Expand testDataSet to cover other notification and negative scenarios.
// -----------------------------------------------------------------------------
```