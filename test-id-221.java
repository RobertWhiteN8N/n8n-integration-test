```java
// Automation Test Script for: Confirmation message appears after toggling course availability
// Test Case Details:
// Preconditions: Admin user is logged in and on the 'Courses' page with at least one course listed.
// Steps:
// 1. Click the availability toggle for a specific course.
//    - Expected: System processes the status change request.
// 2. Observe the screen after toggling the availability.
//    - Expected: A confirmation message (e.g., 'Course availability updated successfully') appears on the UI.
// Post-Conditions: Admin sees visual confirmation of availability change and is aware of current system state.

package com.example.tests;

import org.testng.annotations.*;
import org.openqa.selenium.*;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.support.ui.*;
import org.openqa.selenium.support.PageFactory;
import org.openqa.selenium.support.FindBy;
import org.openqa.selenium.support.How;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import java.time.Duration;
import java.util.*;

// Test Data Model for Data-Driven Testing
class CourseToggleTestData {
    public String courseName;
    public boolean initialAvailability;
    public boolean toggleToAvailability;
    public String expectedConfirmationMessage;

    public CourseToggleTestData(String courseName, boolean initialAvailability, boolean toggleToAvailability, String expectedConfirmationMessage) {
        this.courseName = courseName;
        this.initialAvailability = initialAvailability;
        this.toggleToAvailability = toggleToAvailability;
        this.expectedConfirmationMessage = expectedConfirmationMessage;
    }
}

// Page Object for Login Page (if needed for extensibility)
class LoginPage {
    WebDriver driver;

    @FindBy(how = How.ID, using = "username")
    WebElement usernameInput;

    @FindBy(how = How.ID, using = "password")
    WebElement passwordInput;

    @FindBy(how = How.ID, using = "loginBtn")
    WebElement loginButton;

    public LoginPage(WebDriver driver) {
        this.driver = driver;
        PageFactory.initElements(driver, this);
    }

    public void loginAs(String username, String password) {
        usernameInput.clear();
        usernameInput.sendKeys(username);
        passwordInput.clear();
        passwordInput.sendKeys(password);
        loginButton.click();
    }
}

// Page Object for Courses Page
class CoursesPage {
    WebDriver driver;
    WebDriverWait wait;

    public CoursesPage(WebDriver driver) {
        this.driver = driver;
        this.wait = new WebDriverWait(driver, Duration.ofSeconds(10));
        PageFactory.initElements(driver, this);
    }

    // Locates the course row by course name
    public WebElement getCourseRowByName(String courseName) {
        String xpath = String.format("//tr[td[contains(text(),'%s')]]", courseName);
        return wait.until(ExpectedConditions.visibilityOfElementLocated(By.xpath(xpath)));
    }

    // Locates the toggle button for the given course
    public WebElement getAvailabilityToggleForCourse(String courseName) {
        String xpath = String.format("//tr[td[contains(text(),'%s')]]//button[contains(@class,'availability-toggle')]", courseName);
        return wait.until(ExpectedConditions.elementToBeClickable(By.xpath(xpath)));
    }

    // Gets the current availability status for the course
    public boolean isCourseAvailable(String courseName) {
        String xpath = String.format("//tr[td[contains(text(),'%s')]]//span[contains(@class,'status')]", courseName);
        WebElement statusElement = wait.until(ExpectedConditions.visibilityOfElementLocated(By.xpath(xpath)));
        String statusText = statusElement.getText().trim().toLowerCase();
        return statusText.equals("available") || statusText.equals("enabled");
    }

    // Clicks the availability toggle for the course
    public void toggleCourseAvailability(String courseName) {
        WebElement toggleBtn = getAvailabilityToggleForCourse(courseName);
        toggleBtn.click();
    }

    // Waits for and returns the confirmation message element
    public String waitForConfirmationMessage() {
        WebElement confirmation = wait.until(ExpectedConditions.visibilityOfElementLocated(
                By.xpath("//div[contains(@class,'alert') and contains(@class,'success')]")));
        return confirmation.getText().trim();
    }
}

// The TestNG Test Class
public class CourseAvailabilityToggleTest {
    private WebDriver driver;
    private CoursesPage coursesPage;
    private static final Logger logger = LogManager.getLogger(CourseAvailabilityToggleTest.class);

    // Test Data Set: Diverse scenarios (positive, negative, edge cases)
    // Note: For negative/edge cases, confirmation message may differ or not appear.
    private static final List<CourseToggleTestData> testDataSet = Arrays.asList(
        // Positive case: Toggle from available to unavailable
        new CourseToggleTestData("Intro to Automation", true, false, "Course availability updated successfully"),
        // Positive case: Toggle from unavailable to available
        new CourseToggleTestData("Advanced Java", false, true, "Course availability updated successfully"),
        // Edge case: Toggle on a course that is already in the desired state (should still show confirmation)
        new CourseToggleTestData("Selenium Basics", true, true, "Course availability updated successfully"),
        // Negative case: Non-existent course (should handle gracefully)
        new CourseToggleTestData("NonExistentCourse", true, false, "Course not found"),
        // Edge case: Toggle with empty course name (should handle gracefully)
        new CourseToggleTestData("", true, false, "Course not found")
    );

    @BeforeClass
    public void setUp() {
        // Set up WebDriver (ChromeDriver assumed to be in PATH)
        driver = new ChromeDriver();
        driver.manage().timeouts().implicitlyWait(Duration.ofSeconds(5));
        driver.manage().window().maximize();
        // Navigate to Courses page (assume already logged in as admin)
        driver.get("https://example.com/admin/courses");
        coursesPage = new CoursesPage(driver);
        logger.info("Navigated to Courses page as admin.");
    }

    @AfterClass
    public void tearDown() {
        if (driver != null) {
            driver.quit();
            logger.info("Closed browser and cleaned up WebDriver.");
        }
    }

    @DataProvider(name = "courseToggleData")
    public Object[][] courseToggleData() {
        Object[][] data = new Object[testDataSet.size()][1];
        for (int i = 0; i < testDataSet.size(); i++) {
            data[i][0] = testDataSet.get(i);
        }
        return data;
    }

    @Test(dataProvider = "courseToggleData")
    public void testCourseAvailabilityToggle(CourseToggleTestData testData) {
        logger.info("Starting test for course: " + testData.courseName);

        try {
            if (testData.courseName == null || testData.courseName.isEmpty()) {
                logger.warn("Course name is empty. Skipping toggle action.");
                // Attempt to toggle and expect failure/appropriate message
                try {
                    coursesPage.toggleCourseAvailability(testData.courseName);
                } catch (Exception e) {
                    logger.info("Expected failure for empty course name: " + e.getMessage());
                }
                // Check for confirmation/error message
                String actualMessage = coursesPage.waitForConfirmationMessage();
                Assert.assertEquals(actualMessage, testData.expectedConfirmationMessage,
                        "Confirmation message mismatch for empty course name.");
                return;
            }

            // Check if course row exists
            WebElement courseRow = null;
            try {
                courseRow = coursesPage.getCourseRowByName(testData.courseName);
            } catch (TimeoutException e) {
                logger.warn("Course not found: " + testData.courseName);
                // Try to toggle anyway, expect error message
                try {
                    coursesPage.toggleCourseAvailability(testData.courseName);
                } catch (Exception ex) {
                    logger.info("Expected failure for non-existent course: " + ex.getMessage());
                }
                String actualMessage = coursesPage.waitForConfirmationMessage();
                Assert.assertEquals(actualMessage, testData.expectedConfirmationMessage,
                        "Confirmation message mismatch for non-existent course.");
                return;
            }

            // Check initial availability status
            boolean currentAvailability = coursesPage.isCourseAvailable(testData.courseName);
            logger.info("Initial availability for '" + testData.courseName + "': " + currentAvailability);

            // If already in desired state (edge case), still perform toggle for test
            if (currentAvailability != testData.toggleToAvailability) {
                coursesPage.toggleCourseAvailability(testData.courseName);
                logger.info("Toggled availability for course: " + testData.courseName);
            } else {
                logger.info("Course already in desired state, toggling anyway for confirmation.");
                coursesPage.toggleCourseAvailability(testData.courseName);
            }

            // Wait for and verify confirmation message
            String actualMessage = coursesPage.waitForConfirmationMessage();
            logger.info("Confirmation message displayed: " + actualMessage);
            Assert.assertEquals(actualMessage, testData.expectedConfirmationMessage,
                    "Confirmation message mismatch for course: " + testData.courseName);

        } catch (Exception e) {
            logger.error("Test failed for course: " + testData.courseName, e);
            Assert.fail("Exception occurred: " + e.getMessage());
        }
    }
}

/*
Test Data Set (as Java object):
[
    {
        "courseName": "Intro to Automation",
        "initialAvailability": true,
        "toggleToAvailability": false,
        "expectedConfirmationMessage": "Course availability updated successfully"
    },
    {
        "courseName": "Advanced Java",
        "initialAvailability": false,
        "toggleToAvailability": true,
        "expectedConfirmationMessage": "Course availability updated successfully"
    },
    {
        "courseName": "Selenium Basics",
        "initialAvailability": true,
        "toggleToAvailability": true,
        "expectedConfirmationMessage": "Course availability updated successfully"
    },
    {
        "courseName": "NonExistentCourse",
        "initialAvailability": true,
        "toggleToAvailability": false,
        "expectedConfirmationMessage": "Course not found"
    },
    {
        "courseName": "",
        "initialAvailability": true,
        "toggleToAvailability": false,
        "expectedConfirmationMessage": "Course not found"
    }
]
*/

/*
Summary:
- Page Object Model used for CoursesPage and (optionally) LoginPage.
- Data-driven test using @DataProvider and a Java object for test data.
- Logging via Log4j for traceability and debugging.
- Handles positive, negative, and edge cases.
- Clean, modular, and maintainable code.
*/
```