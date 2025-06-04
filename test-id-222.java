```java
// Automation Script for Test Case: Toggle course availability status as an admin
// Preconditions: Admin user is logged into the admin dashboard. At least one course exists to be managed.
// Test Steps:
// 1. Navigate to the 'Courses' section in the admin dashboard.
// 2. Locate the availability toggle for a specific course.
// 3. Click the toggle to change the course status from available to unavailable or vice versa.
// Post-Conditions: Course's availability status is updated in the system.

package com.automation.admin.courses;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.support.FindBy;
import org.openqa.selenium.support.PageFactory;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;
import org.testng.Assert;
import org.testng.ITestContext;
import org.testng.annotations.*;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;

// Test Data Object
class CourseToggleTestData {
    public String courseName;
    public boolean initialStatus; // true = available, false = unavailable
    public boolean toggleTo;      // true = set to available, false = set to unavailable

    public CourseToggleTestData(String courseName, boolean initialStatus, boolean toggleTo) {
        this.courseName = courseName;
        this.initialStatus = initialStatus;
        this.toggleTo = toggleTo;
    }
}

// Page Object: Admin Dashboard Page
class AdminDashboardPage {
    private WebDriver driver;
    private Logger logger = LogManager.getLogger(AdminDashboardPage.class);

    @FindBy(xpath = "//nav//a[contains(text(),'Courses')]")
    private WebElement coursesSectionLink;

    public AdminDashboardPage(WebDriver driver) {
        this.driver = driver;
        PageFactory.initElements(driver, this);
    }

    public void goToCoursesSection() {
        logger.info("Navigating to the 'Courses' section.");
        coursesSectionLink.click();
    }
}

// Page Object: Courses Page
class CoursesPage {
    private WebDriver driver;
    private Logger logger = LogManager.getLogger(CoursesPage.class);

    public CoursesPage(WebDriver driver) {
        this.driver = driver;
        PageFactory.initElements(driver, this);
    }

    // Locates the course row by course name
    public WebElement getCourseRowByName(String courseName) {
        logger.info("Locating course row for course: " + courseName);
        String xpath = "//tr[td[contains(text(),'" + courseName + "')]]";
        return driver.findElement(By.xpath(xpath));
    }

    // Locates the toggle switch for a specific course
    public WebElement getAvailabilityToggleForCourse(String courseName) {
        logger.info("Locating availability toggle for course: " + courseName);
        String xpath = "//tr[td[contains(text(),'" + courseName + "')]]//input[@type='checkbox' and contains(@class,'availability-toggle')]";
        return driver.findElement(By.xpath(xpath));
    }

    // Checks the current status of the toggle (On/Off)
    public boolean isCourseAvailable(String courseName) {
        WebElement toggle = getAvailabilityToggleForCourse(courseName);
        boolean isChecked = toggle.isSelected();
        logger.info("Course '" + courseName + "' availability status: " + (isChecked ? "Available" : "Unavailable"));
        return isChecked;
    }

    // Toggles the availability status
    public void toggleCourseAvailability(String courseName) {
        WebElement toggle = getAvailabilityToggleForCourse(courseName);
        logger.info("Clicking the availability toggle for course: " + courseName);
        toggle.click();
    }

    // Waits for the toggle to reflect the expected state
    public void waitForToggleState(String courseName, boolean expectedState) {
        WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(10));
        logger.info("Waiting for course '" + courseName + "' toggle to be in state: " + expectedState);
        wait.until(driver -> isCourseAvailable(courseName) == expectedState);
    }
}

// TestNG Test Class
public class ToggleCourseAvailabilityTest {
    private WebDriver driver;
    private Logger logger = LogManager.getLogger(ToggleCourseAvailabilityTest.class);
    private AdminDashboardPage adminDashboardPage;
    private CoursesPage coursesPage;

    // Test Data Set
    // Diverse scenarios: positive (toggle from available to unavailable), negative (toggle from unavailable to available), edge (toggle already in desired state)
    private static List<CourseToggleTestData> testDataSet() {
        List<CourseToggleTestData> data = new ArrayList<>();
        data.add(new CourseToggleTestData("Intro to Java", true, false));  // Positive: Available -> Unavailable
        data.add(new CourseToggleTestData("Advanced Python", false, true)); // Positive: Unavailable -> Available
        data.add(new CourseToggleTestData("Data Science 101", true, true)); // Edge: Already Available, try to set to Available
        data.add(new CourseToggleTestData("Machine Learning", false, false)); // Edge: Already Unavailable, try to set to Unavailable
        return data;
    }

    @BeforeClass
    public void setUp(ITestContext context) {
        // Set up WebDriver (Assuming ChromeDriver is in PATH)
        driver = new ChromeDriver();
        driver.manage().window().maximize();
        driver.get("https://your-admin-dashboard-url.com"); // Replace with actual URL

        // Assume admin is already logged in as per precondition
        adminDashboardPage = new AdminDashboardPage(driver);
        coursesPage = new CoursesPage(driver);
        logger.info("Test setup complete.");
    }

    @AfterClass
    public void tearDown() {
        if (driver != null) {
            driver.quit();
            logger.info("Test teardown complete. Browser closed.");
        }
    }

    @DataProvider(name = "courseToggleData")
    public Object[][] courseToggleDataProvider() {
        List<CourseToggleTestData> data = testDataSet();
        Object[][] arr = new Object[data.size()][1];
        for (int i = 0; i < data.size(); i++) {
            arr[i][0] = data.get(i);
        }
        return arr;
    }

    @Test(dataProvider = "courseToggleData")
    public void testToggleCourseAvailability(CourseToggleTestData testData) {
        logger.info("===== Starting test for course: " + testData.courseName + " =====");

        // Step 1: Navigate to the 'Courses' section
        adminDashboardPage.goToCoursesSection();
        WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(10));
        wait.until(ExpectedConditions.visibilityOfElementLocated(By.xpath("//h1[contains(text(),'Courses')]")));
        logger.info("Courses section loaded.");

        // Step 2: Locate the availability toggle for a specific course
        WebElement courseRow = coursesPage.getCourseRowByName(testData.courseName);
        Assert.assertNotNull(courseRow, "Course row should be present for: " + testData.courseName);
        WebElement toggle = coursesPage.getAvailabilityToggleForCourse(testData.courseName);
        Assert.assertTrue(toggle.isDisplayed(), "Availability toggle should be visible for course: " + testData.courseName);

        // Step 3: Click the toggle to change the course status if needed
        boolean currentStatus = coursesPage.isCourseAvailable(testData.courseName);
        if (currentStatus != testData.toggleTo) {
            coursesPage.toggleCourseAvailability(testData.courseName);
            coursesPage.waitForToggleState(testData.courseName, testData.toggleTo);
            boolean newStatus = coursesPage.isCourseAvailable(testData.courseName);
            Assert.assertEquals(newStatus, testData.toggleTo, "Course availability status should be updated.");
            logger.info("Course '" + testData.courseName + "' availability toggled successfully.");
        } else {
            logger.info("Course '" + testData.courseName + "' already in desired state. No toggle performed.");
            boolean status = coursesPage.isCourseAvailable(testData.courseName);
            Assert.assertEquals(status, testData.toggleTo, "Course availability status should remain unchanged.");
        }

        logger.info("===== Test completed for course: " + testData.courseName + " =====");
    }
}

/*
Test Data Set (as Java object):

List<CourseToggleTestData> testDataSet = [
    new CourseToggleTestData("Intro to Java", true, false),      // Positive: Available -> Unavailable
    new CourseToggleTestData("Advanced Python", false, true),    // Positive: Unavailable -> Available
    new CourseToggleTestData("Data Science 101", true, true),    // Edge: Already Available, try to set to Available
    new CourseToggleTestData("Machine Learning", false, false)   // Edge: Already Unavailable, try to set to Unavailable
];

Page Objects:
- AdminDashboardPage: goToCoursesSection()
- CoursesPage: getCourseRowByName(), getAvailabilityToggleForCourse(), isCourseAvailable(), toggleCourseAvailability(), waitForToggleState()

Test Script:
- Loads test data via DataProvider
- Navigates to Courses section
- Locates course and toggle
- Toggles status if needed, verifies result
- Logs actions for debug visibility

Best Practices:
- Modular Page Objects
- Data-driven test
- Logging for traceability
- Assertions for all key steps
*/
```