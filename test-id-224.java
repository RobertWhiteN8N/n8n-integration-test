```java
// Automation Script for Test Case: Verify setting changes are applied to all courses in the selected category
// Preconditions: Admin user is logged in and has performed a bulk action (e.g., made courses unavailable) on a specific category. The courses have unique identifiers for tracking.
// Test Steps:
// 1. Navigate to the 'Bulk Settings' page and select a category previously subjected to a bulk update.
// 2. Review the status field or indicator for each course in the list.
// 3. Optionally, log in as a student and attempt to access the affected courses.
// Post-Conditions: All courses in the updated category reflect the new settings both in admin and student views.

package com.automation.tests;

import org.testng.annotations.*;
import org.testng.Assert;
import org.openqa.selenium.*;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.support.ui.*;
import org.openqa.selenium.support.PageFactory;
import org.openqa.selenium.support.FindBy;
import org.openqa.selenium.support.How;
import java.util.*;
import java.util.logging.Logger;

// Test Data Object for Data-Driven Testing
class BulkSettingsTestData {
    public String adminUsername;
    public String adminPassword;
    public String studentUsername;
    public String studentPassword;
    public String categoryName;
    public List<String> courseIds;
    public String expectedStatus; // e.g., "Unavailable"
    public boolean isNegativeScenario; // for negative/edge cases

    public BulkSettingsTestData(String adminUsername, String adminPassword, String studentUsername, String studentPassword,
                                String categoryName, List<String> courseIds, String expectedStatus, boolean isNegativeScenario) {
        this.adminUsername = adminUsername;
        this.adminPassword = adminPassword;
        this.studentUsername = studentUsername;
        this.studentPassword = studentPassword;
        this.categoryName = categoryName;
        this.courseIds = courseIds;
        this.expectedStatus = expectedStatus;
        this.isNegativeScenario = isNegativeScenario;
    }
}

// Page Object: Login Page
class LoginPage {
    WebDriver driver;
    Logger logger = Logger.getLogger(LoginPage.class.getName());

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

    public void login(String username, String password) {
        logger.info("Logging in with username: " + username);
        usernameInput.clear();
        usernameInput.sendKeys(username);
        passwordInput.clear();
        passwordInput.sendKeys(password);
        loginButton.click();
    }
}

// Page Object: Bulk Settings Page (Admin)
class BulkSettingsPage {
    WebDriver driver;
    Logger logger = Logger.getLogger(BulkSettingsPage.class.getName());

    @FindBy(how = How.ID, using = "categoryDropdown")
    WebElement categoryDropdown;

    @FindBy(how = How.ID, using = "showCoursesBtn")
    WebElement showCoursesButton;

    @FindBy(how = How.CSS, using = ".course-row")
    List<WebElement> courseRows;

    public BulkSettingsPage(WebDriver driver) {
        this.driver = driver;
        PageFactory.initElements(driver, this);
    }

    public void selectCategory(String categoryName) {
        logger.info("Selecting category: " + categoryName);
        Select select = new Select(categoryDropdown);
        select.selectByVisibleText(categoryName);
        showCoursesButton.click();
    }

    public Map<String, String> getCourseStatuses(List<String> courseIds) {
        logger.info("Fetching course statuses for courses: " + courseIds);
        Map<String, String> courseStatusMap = new HashMap<>();
        for (WebElement row : courseRows) {
            String courseId = row.getAttribute("data-course-id");
            if (courseIds.contains(courseId)) {
                String status = row.findElement(By.cssSelector(".status-indicator")).getText();
                courseStatusMap.put(courseId, status);
            }
        }
        return courseStatusMap;
    }
}

// Page Object: Student Courses Page
class StudentCoursesPage {
    WebDriver driver;
    Logger logger = Logger.getLogger(StudentCoursesPage.class.getName());

    @FindBy(how = How.CSS, using = ".student-course-row")
    List<WebElement> studentCourseRows;

    public StudentCoursesPage(WebDriver driver) {
        this.driver = driver;
        PageFactory.initElements(driver, this);
    }

    public boolean isCourseVisible(String courseId) {
        logger.info("Checking visibility for course: " + courseId);
        for (WebElement row : studentCourseRows) {
            if (row.getAttribute("data-course-id").equals(courseId)) {
                return true;
            }
        }
        return false;
    }
}

// Test Class
public class BulkSettingsCategoryTest {
    WebDriver driver;
    Logger logger = Logger.getLogger(BulkSettingsCategoryTest.class.getName());

    // Test Data Set (Positive, Negative, Edge Cases)
    // Comment: This list can be extended for more scenarios.
    public static List<BulkSettingsTestData> testDataSet() {
        List<BulkSettingsTestData> data = new ArrayList<>();
        // Positive scenario: All courses should be unavailable
        data.add(new BulkSettingsTestData(
                "adminUser", "adminPass", "studentUser", "studentPass",
                "Mathematics", Arrays.asList("COURSE101", "COURSE102", "COURSE103"),
                "Unavailable", false
        ));
        // Negative scenario: Category with no courses
        data.add(new BulkSettingsTestData(
                "adminUser", "adminPass", "studentUser", "studentPass",
                "EmptyCategory", new ArrayList<>(),
                "Unavailable", true
        ));
        // Edge case: Course ID does not exist
        data.add(new BulkSettingsTestData(
                "adminUser", "adminPass", "studentUser", "studentPass",
                "Mathematics", Arrays.asList("COURSE999"),
                "Unavailable", true
        ));
        return data;
    }

    @BeforeMethod
    public void setUp() {
        // Comment: Set up ChromeDriver path as needed
        driver = new ChromeDriver();
        driver.manage().window().maximize();
        logger.info("WebDriver initialized and browser window maximized.");
    }

    @AfterMethod
    public void tearDown() {
        if (driver != null) {
            driver.quit();
            logger.info("WebDriver session ended.");
        }
    }

    @DataProvider(name = "bulkSettingsData")
    public Object[][] bulkSettingsData() {
        List<BulkSettingsTestData> data = testDataSet();
        Object[][] arr = new Object[data.size()][1];
        for (int i = 0; i < data.size(); i++) {
            arr[i][0] = data.get(i);
        }
        return arr;
    }

    @Test(dataProvider = "bulkSettingsData")
    public void verifyBulkSettingsAppliedToCategory(BulkSettingsTestData testData) {
        logger.info("Starting test for category: " + testData.categoryName);

        // Step 1: Admin Login
        driver.get("https://your-app-url/login");
        LoginPage loginPage = new LoginPage(driver);
        loginPage.login(testData.adminUsername, testData.adminPassword);

        // Step 2: Navigate to Bulk Settings and select category
        driver.get("https://your-app-url/admin/bulk-settings");
        BulkSettingsPage bulkSettingsPage = new BulkSettingsPage(driver);
        bulkSettingsPage.selectCategory(testData.categoryName);

        // Step 3: Validate courses are displayed (if any)
        Map<String, String> courseStatuses = bulkSettingsPage.getCourseStatuses(testData.courseIds);
        if (testData.courseIds.isEmpty()) {
            logger.warning("No courses found for category: " + testData.categoryName);
            Assert.assertTrue(courseStatuses.isEmpty(), "Expected no courses, but some were found.");
        } else {
            for (String courseId : testData.courseIds) {
                if (!courseStatuses.containsKey(courseId)) {
                    logger.warning("Course ID not found in UI: " + courseId);
                    if (testData.isNegativeScenario) {
                        Assert.assertFalse(courseStatuses.containsKey(courseId), "Non-existent course should not be present.");
                    } else {
                        Assert.fail("Expected course not found: " + courseId);
                    }
                } else {
                    String actualStatus = courseStatuses.get(courseId);
                    logger.info("Course " + courseId + " status: " + actualStatus);
                    Assert.assertEquals(actualStatus, testData.expectedStatus, "Course status mismatch for " + courseId);
                }
            }
        }

        // Step 4: Optionally, log in as student and check course visibility
        if (!testData.isNegativeScenario && !testData.courseIds.isEmpty()) {
            driver.get("https://your-app-url/logout");
            loginPage.login(testData.studentUsername, testData.studentPassword);
            driver.get("https://your-app-url/student/courses");
            StudentCoursesPage studentCoursesPage = new StudentCoursesPage(driver);
            for (String courseId : testData.courseIds) {
                boolean visible = studentCoursesPage.isCourseVisible(courseId);
                logger.info("Student view - Course " + courseId + " visible: " + visible);
                Assert.assertFalse(visible, "Course " + courseId + " should not be visible to student.");
            }
        }
    }
}

/*
Test Data Set Used:
[
    {
        "adminUsername": "adminUser",
        "adminPassword": "adminPass",
        "studentUsername": "studentUser",
        "studentPassword": "studentPass",
        "categoryName": "Mathematics",
        "courseIds": ["COURSE101", "COURSE102", "COURSE103"],
        "expectedStatus": "Unavailable",
        "isNegativeScenario": false
    },
    {
        "adminUsername": "adminUser",
        "adminPassword": "adminPass",
        "studentUsername": "studentUser",
        "studentPassword": "studentPass",
        "categoryName": "EmptyCategory",
        "courseIds": [],
        "expectedStatus": "Unavailable",
        "isNegativeScenario": true
    },
    {
        "adminUsername": "adminUser",
        "adminPassword": "adminPass",
        "studentUsername": "studentUser",
        "studentPassword": "studentPass",
        "categoryName": "Mathematics",
        "courseIds": ["COURSE999"],
        "expectedStatus": "Unavailable",
        "isNegativeScenario": true
    }
]
*/
```