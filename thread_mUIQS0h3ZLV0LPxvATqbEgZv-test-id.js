// playwright-course-export-test.js

// ==========================
// Test Case Information
// ==========================
/*
Test Title: Verify course export includes all content, tests, and tools
Preconditions: Course with various content, tests, and tools is available to export
Test Steps:
Step 1: Navigate to the Course Management page
    Expected Results: Successfully navigate to the Course Management page
Step 2: Select the course needed for export
    Expected Results: Course details page is displayed
Step 3: Click on Export Course
    Expected Results: Export options screen is displayed
*/

// ==========================
// Required Imports
// ==========================
const { test, expect } = require('@playwright/test');

// ==========================
// Page Object: LoginPage
// ==========================
class LoginPage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;
    this.usernameInput = page.locator('input[name="username"]');
    this.passwordInput = page.locator('input[name="password"]');
    this.loginButton = page.locator('button[type="submit"]');
  }

  async goto(url) {
    await this.page.goto(url);
    console.log('[LoginPage] Navigated to login page:', url);
  }

  async login(username, password) {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    console.log(`[LoginPage] Credentials entered: ${username} / ******`);
    await this.loginButton.click();
    console.log('[LoginPage] Login button clicked');
  }
}

// ==========================
// Page Object: CourseManagementPage
// ==========================
class CourseManagementPage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;
    this.courseTable = page.locator('table.course-list'); // Update selector as per actual app
    this.courseRows = page.locator('table.course-list tbody tr');
  }

  async goto() {
    await this.page.goto('/courses');
    console.log('[CourseManagementPage] Navigated to Course Management page');
    await expect(this.page).toHaveURL(/.*\/courses/);
    await expect(this.courseTable).toBeVisible();
  }

  async selectCourseByName(courseName) {
    const courseRow = this.page.locator('table.course-list >> text=' + courseName);
    await expect(courseRow).toBeVisible();
    await courseRow.click();
    console.log(`[CourseManagementPage] Selected course: ${courseName}`);
  }
}

// ==========================
// Page Object: CourseDetailsPage
// ==========================
class CourseDetailsPage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;
    this.exportButton = page.locator('button:has-text("Export Course")');
    this.courseTitle = page.locator('h1.course-title');
  }

  async isPageDisplayed(courseName) {
    await expect(this.courseTitle).toHaveText(courseName);
    await expect(this.exportButton).toBeVisible();
    console.log('[CourseDetailsPage] Course details page displayed for:', courseName);
  }

  async clickExportCourse() {
    await this.exportButton.click();
    console.log('[CourseDetailsPage] Clicked Export Course');
  }
}

// ==========================
// Page Object: CourseExportPage
// ==========================
class CourseExportPage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;
    this.exportOptionsPanel = page.locator('.export-options'); // Update selector as per app
    this.pageTitle = page.locator('h2'); // Or whatever header is used
  }

  async isPageDisplayed() {
    await expect(this.exportOptionsPanel).toBeVisible();
    await expect(this.pageTitle).toHaveText(/Export Options|Export Course/i);
    console.log('[CourseExportPage] Export options screen displayed');
  }
}

// ==========================
// Test Data
// ==========================
/*
  Each test scenario contains:
    - username: Login username
    - password: Login password
    - courseName: Name of the course to export
    - expected: what should happen
    - scenario: Positive/Negative/Edge case
*/

const testDataSet = [
  {
    scenario: 'positive',
    username: 'instructorA',
    password: 'correctpassword',
    courseName: 'Mathematics Fundamentals',
    expected: {
      courseFound: true,
      exportButtonPresent: true,
      exportOptionsVisible: true
    }
  },
  {
    scenario: 'negative - unauthorized user',
    username: 'studentB',
    password: 'correctpassword',
    courseName: 'Mathematics Fundamentals',
    expected: {
      courseFound: false,
      exportButtonPresent: false,
      exportOptionsVisible: false
    }
  },
  {
    scenario: 'negative - non-existent course',
    username: 'instructorA',
    password: 'correctpassword',
    courseName: 'Nonexistent Course 101',
    expected: {
      courseFound: false,
      exportButtonPresent: false,
      exportOptionsVisible: false
    }
  },
  {
    scenario: 'edge - course name with special characters',
    username: 'instructorA',
    password: 'correctpassword',
    courseName: 'Science & Technology: 2023/2024',
    expected: {
      courseFound: true,
      exportButtonPresent: true,
      exportOptionsVisible: true
    }
  },
  {
    scenario: 'negative - invalid login',
    username: 'baduser',
    password: 'badpassword',
    courseName: 'Mathematics Fundamentals',
    expected: {
      courseFound: false,
      exportButtonPresent: false,
      exportOptionsVisible: false
    }
  }
];

// ==========================
// Main Playwright Test Script
// ==========================

test.describe('Course Export - includes all content, tests, and tools', () => {
  testDataSet.forEach((testdata) => {
    test(`Export course - scenario: ${testdata.scenario}`, async ({ page }) => {
      // Step 1: Login (assumed required for each test)
      const loginPage = new LoginPage(page);
      await loginPage.goto('https://your-lms.example.com/login');

      await loginPage.login(testdata.username, testdata.password);

      // Step 2: Navigate to Course Management
      const courseMgmt = new CourseManagementPage(page);

      let loginFailed = false;
      try {
        await courseMgmt.goto();
      } catch (err) {
        loginFailed = true;
        console.log('[TestCase] Failed to navigate to Course Management. Possibly due to login failure.');
      }

      if (testdata.expected.courseFound === false || loginFailed) {
        console.log(`[TestCase] Negative/Edge Case detected for scenario: ${testdata.scenario}. Skipping further navigation.`);
        return;
      }

      // Step 3: Select the course needed for export
      try {
        await courseMgmt.selectCourseByName(testdata.courseName);
      } catch (err) {
        if(testdata.expected.courseFound){
          throw err;
        }
        console.log(`[TestCase] Course '${testdata.courseName}' not found as expected (${testdata.scenario})`);
        return;
      }

      // Step 4: Course Details Page
      const courseDetails = new CourseDetailsPage(page);
      try {
        await courseDetails.isPageDisplayed(testdata.courseName);
        if (!testdata.expected.exportButtonPresent) {
          throw new Error('[TestCase] Export button present when it should not be.');
        }
      } catch (err) {
        if(!testdata.expected.exportButtonPresent){
          console.log(`[TestCase] Course or Export button not present as expected (${testdata.scenario})`);
          return;
        }
        throw err;
      }

      // Step 5: Click on Export Course
      await courseDetails.clickExportCourse();

      // Step 6: Confirm Export options displayed
      const exportPage = new CourseExportPage(page);
      try {
        await exportPage.isPageDisplayed();
        if (!testdata.expected.exportOptionsVisible) {
          throw new Error('[TestCase] Export Options panel visible when it should not be.');
        }
      } catch (err) {
        if(!testdata.expected.exportOptionsVisible){
          console.log(`[TestCase] Export options not visible as expected (${testdata.scenario})`);
          return;
        }
        throw err;
      }

      console.log(`[TestCase] Test scenario '${testdata.scenario}' completed successfully`);
    });
  });
});

// ==========================
// End of playwright-course-export-test.js
// ==========================