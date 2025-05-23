To create a Web Automation Testing script using Playwright in JavaScript for the provided test case "Export Confirmation Message", we will proceed with the following steps based on the Page Object Model (POM) as outlined in the documents:

### Playwright Automation Setup

1. **Page Object Classes**:
   - **ExportPage**: This will include methods to initiate the export, check for progress indicator, and verify confirmation message.

2. **Test Script**:
   - Integrate the Page Object classes.
   - Include test logic for step execution as per the test case.

3. **Test Data**:
   - Create a sample data set if necessary for any dynamic content.

### JavaScript Script

#### Page Object Class (ExportPage.js)

```javascript
class ExportPage {
    /**
     * Constructor to initialize page instance
     * @param {object} page - Playwright page object
     */
    constructor(page) {
        this.page = page;
        this.exportButton = 'button#export'; // Example selector
        this.progressIndicator = 'div.progress'; // Example selector
        this.confirmationMessage = 'div#confirmation-message'; // Example selector
    }

    /**
     * Initiates the export process
     */
    async initiateExport() {
        await this.page.click(this.exportButton);
    }

    /**
     * Checks the presence of progress indicator
     * @returns {Promise<boolean>}
     */
    async isProgressIndicatorVisible() {
        return await this.page.isVisible(this.progressIndicator);
    }

    /**
     * Checks if the confirmation message is displayed
     * @returns {Promise<boolean>}
     */
    async isConfirmationMessageDisplayed() {
        return await this.page.isVisible(this.confirmationMessage);
    }
}

module.exports = { ExportPage };
```

#### Test Script (exportConfirmationMessage.test.js)

```javascript
const { chromium } = require('playwright');
const { ExportPage } = require('./ExportPage');

(async () => {
    const browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();
    const exportPage = new ExportPage(page);

    // Precondition: Navigate to the course export page (URL needs to be set)
    await page.goto('http://example.com/course-export');

    // Test Steps
    // Step 1: Initiate the export process
    await exportPage.initiateExport();

    // Verify: System starts export and displays progress indicator
    const progressVisible = await exportPage.isProgressIndicatorVisible();
    console.assert(progressVisible, 'Progress indicator should be visible.');

    // Step 2: Wait for the export process to finish
    await page.waitForSelector(exportPage.confirmationMessage);

    // Verify: Confirmation message is displayed
    const messageDisplayed = await exportPage.isConfirmationMessageDisplayed();
    console.assert(messageDisplayed, 'Confirmation message should be displayed.');

    await browser.close();
})();
```

### Notes:
- Replace the CSS selectors in the `ExportPage` class with actual selectors from your application.
- Set the correct URL to test the "Export Confirmation Message" functionality.
- In a real-world scenario, further error handling and assertion with test frameworks like Jest or Mocha could be implemented for better validation and reporting.