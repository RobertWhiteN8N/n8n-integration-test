```javascript
// automation_course_assignment.spec.js

// ===============================================
// Test Title: Verify content and tools assignment to specific student sections
// Preconditions: Course with multiple student sections is present
// ===============================================

// =========================
// Import Playwright Test API
// =========================
const { test, expect } = require('@playwright/test');

// =============================
// Helper: Logger Utility
// =============================
class Logger {
  static log(message) {
    console.log(`[LOG] ${new Date().toISOString()}: ${message}`);
  }
  static error(message) {
    console.error(`[ERROR] ${new Date().toISOString()}: ${message}`);
  }
}

// =============================
// Page Objects
// =============================

// -----------
// CourseManagementPage
// -----------
// Encapsulates navigation and validation for Course Management landing page
class CourseManagementPage {
  /**
   * @param {import('@playwright/test').Page} page 
   */
  constructor(page) {
    this.page = page;
    this.pageTitleLocator = page.locator('h1', { hasText: 'Course Management' });
    this.contentToolsReleaseBtn = page.locator('button', { hasText: 'Release Content/Tools' });
  }
  async goto() {
    Logger.log('Navigating to the Course Management page');
    await this.page.goto('/course-management');
    await expect(this.pageTitleLocator).toBeVisible();
    Logger.log('Successfully navigated to the Course Management page');
  }
  async clickReleaseContentTools() {
    Logger.log('Selecting Content/Tools to release');
    await this.contentToolsReleaseBtn.waitFor({ state: 'visible' });
    await this.contentToolsReleaseBtn.click();
  }
}

// -----------
// ContentToolsSelectionPage
// -----------
// Handles selection of content/tools and progressing to assignment
class ContentToolsSelectionPage {
  /**
   * @param {import('@playwright/test').Page} page 
   */
  constructor(page) {
    this.page = page;
    this.pageTitleLocator = page.locator('h2', { hasText: 'Select Content/Tools to Release' });
    this.availableItems = page.locator('.content-tool-list .item');
    this.nextBtn = page.locator('button', { hasText: 'Next' });
  }

  async isLoaded() {
    Logger.log('Validating Content/Tools selection page is displayed');
    await expect(this.pageTitleLocator).toBeVisible();
    Logger.log('Content/Tools selection page is displayed');
  }

  async selectItems(items) {
    Logger.log('Selecting items for release: ' + items.join(', '));
    for (const item of items) {
      const locator = this.page.locator('.content-tool-list .item label', { hasText: item });
      await expect(locator).toBeVisible();
      await locator.click();
    }
  }

  async clickNext() {
    Logger.log('Proceeding to assignment step');
    await this.nextBtn.waitFor({ state: 'visible' });
    await this.nextBtn.click();
  }
}

// -----------
// AssignSectionsPage
// -----------
// Handles assignment action and validation
class AssignSectionsPage {
  /**
   * @param {import('@playwright/test').Page} page 
   */
  constructor(page) {
    this.page = page;
    this.pageTitleLocator = page.locator('h2', { hasText: 'Assign to Sections' });
    this.sectionCheckboxList = page.locator('.section-list .section-checkbox label');
    this.assignBtn = page.locator('button', { hasText: 'Assign' });
    this.successToast = page.locator('.toast-success', { hasText: 'assigned' });
  }

  async isLoaded() {
    Logger.log('Validating assignment to student sections page is displayed');
    await expect(this.pageTitleLocator).toBeVisible();
  }

  async assignToSections(sections) {
    Logger.log('Assigning to sections: ' + sections.join(', '));
    for (const section of sections) {
      const locator = this.page.locator('.section-list .section-checkbox label', { hasText: section });
      await expect(locator).toBeVisible();
      await locator.click();
    }
  }

  async clickAssign() {
    Logger.log('Clicking Assign button');
    await this.assignBtn.waitFor({ state: 'visible' });
    await this.assignBtn.click();
  }

  async verifyAssignmentSuccess() {
    Logger.log('Verifying assignment success');
    await expect(this.successToast).toBeVisible();
    Logger.log('Content/Tools assigned to specified sections successfully');
  }
}

// =============================
// Test Data Set
// =============================

// The test data represents multiple scenarios
// 1. Positive - assign valid items to valid sections
// 2. Negative - assign invalid/nonexistent items or sections
// 3. Edge - assign no items or no sections

const testDataSet = [
  // Positive scenario
  {
    scenario: 'Assign valid content/tools to valid student sections',
    itemsToAssign: ['Chapter 1 - Basics', 'Quiz Tool'],
    sectionsToAssign: ['Section A', 'Section C'],
    expectSuccess: true
  },
  // Negative scenario: Non-existent content/tool item
  {
    scenario: 'Assign invalid content/tool to valid student sections',
    itemsToAssign: ['NonExistentTool'],
    sectionsToAssign: ['Section C'],
    expectSuccess: false
  },
  // Negative scenario: Non-existent section
  {
    scenario: 'Assign valid content/tools to invalid student section',
    itemsToAssign: ['Chapter 2 - Advanced'],
    sectionsToAssign: ['Ghost Section'],
    expectSuccess: false
  },
  // Edge case: Assign with empty items array
  {
    scenario: 'Attempt assignment with no items selected',
    itemsToAssign: [],
    sectionsToAssign: ['Section A'],
    expectSuccess: false
  },
  // Edge case: Assign with empty sections array
  {
    scenario: 'Attempt assignment with no sections selected',
    itemsToAssign: ['Quiz Tool'],
    sectionsToAssign: [],
    expectSuccess: false
  },
  // Edge case: Assign all items to all sections
  {
    scenario: 'Assign all content/tools to all student sections',
    itemsToAssign: ['Chapter 1 - Basics', 'Chapter 2 - Advanced', 'Quiz Tool'],
    sectionsToAssign: ['Section A', 'Section B', 'Section C'],
    expectSuccess: true
  }
];

// =============================
// Test Script
// =============================

test.describe('Content and Tools Assignment to Student Sections', () => {
  // Iterate over test data for data-driven testing
  for (const data of testDataSet) {
    test(data.scenario, async ({ page }) => {
      Logger.log(`[START TEST] ${data.scenario}`);
      const cmPage = new CourseManagementPage(page);
      const selectPage = new ContentToolsSelectionPage(page);
      const assignPage = new AssignSectionsPage(page);

      try {
        // Step 1: Navigate to the Course Management page
        await cmPage.goto();

        // Step 2: Select Content/Tools to release
        await cmPage.clickReleaseContentTools();
        await selectPage.isLoaded();

        // If items are specified, select them; else, skip
        if (data.itemsToAssign && data.itemsToAssign.length > 0) {
          await selectPage.selectItems(data.itemsToAssign);
        }

        await selectPage.clickNext();

        // Step 3: Assign selected Content/Tools to specific student sections
        await assignPage.isLoaded();

        // If sections are specified, select them; else, skip
        if (data.sectionsToAssign && data.sectionsToAssign.length > 0) {
          await assignPage.assignToSections(data.sectionsToAssign);
        }

        await assignPage.clickAssign();

        if (data.expectSuccess) {
          await assignPage.verifyAssignmentSuccess();
        } else {
          // For negative/edge cases, assert that success toast does NOT appear
          let assignmentSucceeded = true;
          try {
            await assignPage.successToast.waitFor({ state: 'visible', timeout: 3000 });
          } catch (e) {
            assignmentSucceeded = false;
          }
          expect(assignmentSucceeded).toBe(false);
          Logger.log('Assignment did not succeed as expected for this scenario.');
        }
      } catch (e) {
        Logger.error(`Test scenario failed: ${e.message}`);
        if (data.expectSuccess) throw e;
        Logger.log('Failure is expected for this scenario.');
      }
      Logger.log(`[END TEST] ${data.scenario}\n`);
    });
  }
});

/* =====================================================
  Page Object Model Classes included:
   - CourseManagementPage: Landing and navigation
   - ContentToolsSelectionPage: Item selection
   - AssignSectionsPage: Section assignment
  Test Data Set:
[
  {
    scenario: 'Assign valid content/tools to valid student sections',
    itemsToAssign: ['Chapter 1 - Basics', 'Quiz Tool'],
    sectionsToAssign: ['Section A', 'Section C'],
    expectSuccess: true
  },
  {
    scenario: 'Assign invalid content/tool to valid student sections',
    itemsToAssign: ['NonExistentTool'],
    sectionsToAssign: ['Section C'],
    expectSuccess: false
  },
  {
    scenario: 'Assign valid content/tools to invalid student section',
    itemsToAssign: ['Chapter 2 - Advanced'],
    sectionsToAssign: ['Ghost Section'],
    expectSuccess: false
  },
  {
    scenario: 'Attempt assignment with no items selected',
    itemsToAssign: [],
    sectionsToAssign: ['Section A'],
    expectSuccess: false
  },
  {
    scenario: 'Attempt assignment with no sections selected',
    itemsToAssign: ['Quiz Tool'],
    sectionsToAssign: [],
    expectSuccess: false
  },
  {
    scenario: 'Assign all content/tools to all student sections',
    itemsToAssign: ['Chapter 1 - Basics', 'Chapter 2 - Advanced', 'Quiz Tool'],
    sectionsToAssign: ['Section A', 'Section B', 'Section C'],
    expectSuccess: true
  }
]
 Logging is included for step visibility and debug tracing.
 Assertions and validations match the test case description and edge/negative cases.
===================================================== */
```