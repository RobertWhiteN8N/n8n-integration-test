```java
// Automation Script for: Perform bulk action to make all courses in selected category unavailable
// Test Framework: TestNG
// Design Pattern: Page Object Model (POM)
// Logging: org.apache.logging.log4j.Logger
// Data-Driven: TestNG @DataProvider
// Test Data: Includes positive, negative, and edge cases

package com.company.automation.tests;

import org.testng.annotations.*;
import org.openqa.selenium.*;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.support.*;
import org.openqa.selenium.support.ui.*;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import java.time.Duration;
import java.util.List;

//-------------------- Test Data Object --------------------//
// Test data object for bulk action scenarios
class BulkActionTestData {
    public String categoryName;
    public boolean expectCoursesListed;
    public boolean expectBulkActionSuccess;
    public String description;

    public BulkActionTestData(String categoryName, boolean expectCoursesListed, boolean expectBulkActionSuccess, String description) {
        this.categoryName = categoryName;
        this.expectCoursesListed = expectCoursesListed;
        this.expectBulkActionSuccess = expectBulkActionSuccess;
        this.description = description;
    }
}

//-------------------- Page Object: DashboardPage --------------------//
class DashboardPage {
    private WebDriver driver;
    private WebDriverWait wait;

    @FindBy(linkText = "Bulk Settings")
    private WebElement bulkSettingsLink;

    public DashboardPage(WebDriver driver) {
        this.driver = driver;
        this.wait = new WebDriverWait(driver, Duration.ofSeconds(10));
        PageFactory.initElements(driver, this);
    }

    public void goToBulkSettings() {
        wait.until(ExpectedConditions.elementToBeClickable(bulkSettingsLink)).click();
    }
}

//-------------------- Page Object: BulkSettingsPage --------------------//
class BulkSettingsPage {
    private WebDriver driver;
    private WebDriverWait wait;

    @FindBy(id = "category-filter")
    private WebElement categoryFilterDropdown;

    @FindBy(css = ".category-option")
    private List<WebElement> categoryOptions;

    @FindBy(id = "filter-submit")
    private WebElement filterSubmitButton;

    @FindBy(css = ".course-row")
    private List<WebElement> courseRows;

    @FindBy(id = "select-all-courses")
    private WebElement selectAllCheckbox;

    @FindBy(id = "bulk-action-dropdown")
    private WebElement bulkActionDropdown;

    @FindBy(xpath = "//option[contains(text(),'Make Unavailable')]")
    private WebElement makeUnavailableOption;

    @FindBy(id = "bulk-action-submit")
    private WebElement bulkActionSubmitButton;

    @FindBy(id = "confirmation-modal")
    private WebElement confirmationModal;

    @FindBy(id = "confirm-action")
    private WebElement confirmActionButton;

    @FindBy(css = ".alert-success, .alert-info, .alert-danger")
    private WebElement alertMessage;

    public BulkSettingsPage(WebDriver driver) {
        this.driver = driver;
        this.wait = new WebDriverWait(driver, Duration.ofSeconds(10));
        PageFactory.initElements(driver, this);
    }

    public void filterByCategory(String categoryName) {
        wait.until(ExpectedConditions.elementToBeClickable(categoryFilterDropdown)).click();
        boolean found = false;
        for (WebElement option : categoryOptions) {
            if (option.getText().trim().equalsIgnoreCase(categoryName)) {
                option.click();
                found = true;
                break;
            }
        }
        if (!found) throw new NoSuchElementException("Category not found: " + categoryName);
        filterSubmitButton.click();
    }

    public boolean areCoursesListed() {
        wait.until(ExpectedConditions.visibilityOfElementLocated(By.cssSelector(".course-row")));
        return courseRows.size() > 0;
    }

    public void selectAllCourses() {
        wait.until(ExpectedConditions.elementToBeClickable(selectAllCheckbox)).click();
    }

    public void selectBulkActionMakeUnavailable() {
        wait.until(ExpectedConditions.elementToBeClickable(bulkActionDropdown)).click();
        makeUnavailableOption.click();
    }

    public void submitBulkAction() {
        wait.until(ExpectedConditions.elementToBeClickable(bulkActionSubmitButton)).click();
    }

    public void confirmBulkAction() {
        wait.until(ExpectedConditions.visibilityOf(confirmationModal));
        wait.until(ExpectedConditions.elementToBeClickable(confirmActionButton)).click();
    }

    public String getAlertMessage() {
        wait.until(ExpectedConditions.visibilityOf(alertMessage));
        return alertMessage.getText();
    }
}

//-------------------- Test Class --------------------//
public class BulkActionMakeCoursesUnavailableTest {
    private WebDriver driver;
    private Logger logger = LogManager.getLogger(BulkActionMakeCoursesUnavailableTest.class);

    @BeforeClass
    public void setUp() {
        // Set up WebDriver (assume chromedriver is in PATH)
        driver = new ChromeDriver();
        driver.manage().window().maximize();
        driver.get("https://your-app-url.com/admin/dashboard");
        // Assume admin is already logged in as per precondition
        logger.info("Navigated to admin dashboard.");
    }

    @AfterClass
    public void tearDown() {
        if (driver != null) driver.quit();
        logger.info("Closed browser.");
    }

    @DataProvider(name = "bulkActionData")
    public Object[][] bulkActionData() {
        return new Object[][]{
            // Positive: Category exists, courses present
            {new BulkActionTestData("Mathematics", true, true, "Positive: All Mathematics courses should be made unavailable.")},
            // Negative: Category does not exist
            {new BulkActionTestData("NonExistentDept", false, false, "Negative: Category does not exist, no courses listed.")},
            // Edge: Category exists but no courses
            {new BulkActionTestData("EmptyDepartment", false, false, "Edge: Category exists but has no courses.")},
        };
    }

    @Test(dataProvider = "bulkActionData")
    public void testBulkMakeCoursesUnavailable(BulkActionTestData testData) {
        logger.info("Starting test: " + testData.description);

        DashboardPage dashboardPage = new DashboardPage(driver);
        BulkSettingsPage bulkSettingsPage = new BulkSettingsPage(driver);

        // Step 1: Go to Bulk Settings
        dashboardPage.goToBulkSettings();
        logger.info("Navigated to Bulk Settings page.");

        // Step 2: Filter by category
        try {
            bulkSettingsPage.filterByCategory(testData.categoryName);
            logger.info("Filtered by category: " + testData.categoryName);
        } catch (NoSuchElementException e) {
            logger.error("Category not found: " + testData.categoryName);
            assert !testData.expectCoursesListed : "Expected courses to be listed, but category not found.";
            return;
        }

        boolean coursesListed = false;
        try {
            coursesListed = bulkSettingsPage.areCoursesListed();
        } catch (TimeoutException e) {
            logger.warn("No courses listed for category: " + testData.categoryName);
        }

        if (testData.expectCoursesListed) {
            assert coursesListed : "Expected courses to be listed, but none found.";
            logger.info("Courses are listed for category: " + testData.categoryName);

            // Step 3: Select all and perform bulk action
            bulkSettingsPage.selectAllCourses();
            logger.info("Selected all courses.");

            bulkSettingsPage.selectBulkActionMakeUnavailable();
            logger.info("Selected 'Make Unavailable' bulk action.");

            bulkSettingsPage.submitBulkAction();
            logger.info("Submitted bulk action.");

            // Step 4: Confirm and check for success message
            bulkSettingsPage.confirmBulkAction();
            logger.info("Confirmed bulk action.");

            String alertMsg = bulkSettingsPage.getAlertMessage();
            logger.info("System message: " + alertMsg);

            assert alertMsg.toLowerCase().contains("unavailable") : "Expected success message about making courses unavailable.";
            assert testData.expectBulkActionSuccess : "Bulk action should have succeeded but did not.";
        } else {
            assert !coursesListed : "Expected no courses to be listed, but some were found.";
            logger.info("No courses listed as expected for category: " + testData.categoryName);
        }
    }
}

/*
-------------------- Test Data Set (as Java object) --------------------
Test Data:
1. Positive:
   - categoryName: "Mathematics"
   - expectCoursesListed: true
   - expectBulkActionSuccess: true
   - description: "Positive: All Mathematics courses should be made unavailable."
2. Negative:
   - categoryName: "NonExistentDept"
   - expectCoursesListed: false
   - expectBulkActionSuccess: false
   - description: "Negative: Category does not exist, no courses listed."
3. Edge:
   - categoryName: "EmptyDepartment"
   - expectCoursesListed: false
   - expectBulkActionSuccess: false
   - description: "Edge: Category exists but has no courses."
-----------------------------------------------------------------------
*/

/*
-------------------- Summary of Page Objects --------------------
DashboardPage:
    - goToBulkSettings()

BulkSettingsPage:
    - filterByCategory(String categoryName)
    - areCoursesListed()
    - selectAllCourses()
    - selectBulkActionMakeUnavailable()
    - submitBulkAction()
    - confirmBulkAction()
    - getAlertMessage()
-----------------------------------------------------------------
*/

/*
-------------------- Logging --------------------
Logging is implemented using org.apache.logging.log4j.Logger.
Each major step and assertion is logged for debug visibility.
-------------------------------------------------
*/
```