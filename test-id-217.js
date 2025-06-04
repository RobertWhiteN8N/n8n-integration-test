```java
// Automation Script for Test Case: New courses reflect updated default tool visibility settings
// Preconditions: Admin has updated and saved new default tool visibility settings; test admin user is logged in.

package com.company.automation.tests;

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

// Test Data Object
class ToolVisibilityTestData {
    public String courseName;
    public List<String> expectedVisibleTools;
    public List<String> expectedHiddenTools;

    public ToolVisibilityTestData(String courseName, List<String> expectedVisibleTools, List<String> expectedHiddenTools) {
        this.courseName = courseName;
        this.expectedVisibleTools = expectedVisibleTools;
        this.expectedHiddenTools = expectedHiddenTools;
    }
}

// Page Object: DashboardPage
class DashboardPage {
    WebDriver driver;
    WebDriverWait wait;
    Logger logger = Logger.getLogger(DashboardPage.class.getName());

    @FindBy(how = How.LINK_TEXT, using = "Course Management")
    WebElement courseManagementLink;

    public DashboardPage(WebDriver driver) {
        this.driver = driver;
        this.wait = new WebDriverWait(driver, 15);
        PageFactory.initElements(driver, this);
    }

    public void goToCourseManagement() {
        logger.info("Navigating to Course Management.");
        wait.until(ExpectedConditions.elementToBeClickable(courseManagementLink)).click();
    }
}

// Page Object: CourseManagementPage
class CourseManagementPage {
    WebDriver driver;
    WebDriverWait wait;
    Logger logger = Logger.getLogger(CourseManagementPage.class.getName());

    @FindBy(how = How.ID, using = "createCourseBtn")
    WebElement createCourseButton;

    public CourseManagementPage(WebDriver driver) {
        this.driver = driver;
        this.wait = new WebDriverWait(driver, 15);
        PageFactory.initElements(driver, this);
    }

    public void initiateCourseCreation() {
        logger.info("Initiating creation of a new course.");
        wait.until(ExpectedConditions.elementToBeClickable(createCourseButton)).click();
    }
}

// Page Object: CourseCreationPage
class CourseCreationPage {
    WebDriver driver;
    WebDriverWait wait;
    Logger logger = Logger.getLogger(CourseCreationPage.class.getName());

    @FindBy(how = How.ID, using = "courseName")
    WebElement courseNameInput;

    @FindBy(how = How.CSS, using = ".tool-list .tool-item")
    List<WebElement> toolItems;

    public CourseCreationPage(WebDriver driver) {
        this.driver = driver;
        this.wait = new WebDriverWait(driver, 15);
        PageFactory.initElements(driver, this);
    }

    public void enterCourseName(String courseName) {
        logger.info("Entering course name: " + courseName);
        wait.until(ExpectedConditions.visibilityOf(courseNameInput)).clear();
        courseNameInput.sendKeys(courseName);
    }

    public List<String> getVisibleTools() {
        logger.info("Retrieving list of visible tools.");
        List<String> visibleTools = new ArrayList<>();
        for (WebElement tool : toolItems) {
            if (tool.isDisplayed() && tool.isEnabled()) {
                visibleTools.add(tool.getText().trim());
            }
        }
        logger.info("Visible tools: " + visibleTools);
        return visibleTools;
    }

    public List<String> getAllTools() {
        logger.info("Retrieving list of all tools (visible or not).");
        List<String> allTools = new ArrayList<>();
        for (WebElement tool : toolItems) {
            allTools.add(tool.getText().trim());
        }
        logger.info("All tools: " + allTools);
        return allTools;
    }
}

// Test Class
public class NewCourseToolVisibilityTest {
    WebDriver driver;
    Logger logger = Logger.getLogger(NewCourseToolVisibilityTest.class.getName());

    // Test Data Set
    // Including positive, negative, and edge cases
    List<ToolVisibilityTestData> testDataSet = Arrays.asList(
        // Positive: Only enabled tools are visible
        new ToolVisibilityTestData(
            "QA Automation Course 1",
            Arrays.asList("Assignments", "Discussions", "Grades"),
            Arrays.asList("Quizzes", "Attendance")
        ),
        // Negative: All tools disabled (edge case)
        new ToolVisibilityTestData(
            "QA Automation Course 2",
            Arrays.asList(),
            Arrays.asList("Assignments", "Discussions", "Grades", "Quizzes", "Attendance")
        ),
        // Edge: All tools enabled
        new ToolVisibilityTestData(
            "QA Automation Course 3",
            Arrays.asList("Assignments", "Discussions", "Grades", "Quizzes", "Attendance"),
            Arrays.asList()
        ),
        // Edge: Only one tool enabled
        new ToolVisibilityTestData(
            "QA Automation Course 4",
            Arrays.asList("Assignments"),
            Arrays.asList("Discussions", "Grades", "Quizzes", "Attendance")
        )
    );

    @BeforeClass
    public void setUp() {
        // Setup WebDriver (Assuming ChromeDriver is in PATH)
        driver = new ChromeDriver();
        driver.manage().window().maximize();
        driver.get("https://your-application-url.com"); // Replace with actual URL
        logger.info("Test admin user is assumed to be already logged in as per precondition.");
    }

    @AfterClass
    public void tearDown() {
        if (driver != null) {
            driver.quit();
        }
    }

    @DataProvider(name = "toolVisibilityData")
    public Iterator<Object[]> toolVisibilityDataProvider() {
        List<Object[]> data = new ArrayList<>();
        for (ToolVisibilityTestData td : testDataSet) {
            data.add(new Object[]{td});
        }
        return data.iterator();
    }

    @Test(dataProvider = "toolVisibilityData")
    public void testNewCourseReflectsUpdatedToolVisibility(ToolVisibilityTestData testData) {
        logger.info("Starting test for course: " + testData.courseName);

        // Step 1: Navigate to 'Course Management' and initiate creation of a new course.
        DashboardPage dashboardPage = new DashboardPage(driver);
        dashboardPage.goToCourseManagement();

        CourseManagementPage courseManagementPage = new CourseManagementPage(driver);
        courseManagementPage.initiateCourseCreation();

        // Step 2: Course creation form loads with tool list using the updated default visibility settings.
        CourseCreationPage courseCreationPage = new CourseCreationPage(driver);
        courseCreationPage.enterCourseName(testData.courseName);

        // Wait for tool list to load
        List<String> visibleTools = courseCreationPage.getVisibleTools();
        List<String> allTools = courseCreationPage.getAllTools();

        // Step 3: Review the visible tools as presented in the new course setup.
        // Expected: Only the tools enabled in the most recent admin configuration are present by default; disabled tools are hidden or set as inactive.

        // Assert visible tools match expected
        logger.info("Asserting visible tools match expected enabled tools.");
        Assert.assertEqualsNoOrder(
            visibleTools.toArray(),
            testData.expectedVisibleTools.toArray(),
            "Visible tools do not match expected enabled tools."
        );

        // Assert hidden/inactive tools are not visible
        logger.info("Asserting hidden/inactive tools are not visible.");
        for (String hiddenTool : testData.expectedHiddenTools) {
            Assert.assertFalse(
                visibleTools.contains(hiddenTool),
                "Hidden/inactive tool '" + hiddenTool + "' should not be visible."
            );
        }

        // Edge case: If all tools are disabled, tool list should be empty or show appropriate message
        if (testData.expectedVisibleTools.isEmpty()) {
            logger.info("Edge case: All tools disabled, verifying tool list is empty.");
            Assert.assertTrue(
                visibleTools.isEmpty(),
                "No tools should be visible when all are disabled."
            );
        }

        logger.info("Test completed for course: " + testData.courseName);
    }
}

/*
Test Data Set (as Java object):

List<ToolVisibilityTestData> testDataSet = Arrays.asList(
    // Positive: Only enabled tools are visible
    new ToolVisibilityTestData(
        "QA Automation Course 1",
        Arrays.asList("Assignments", "Discussions", "Grades"),
        Arrays.asList("Quizzes", "Attendance")
    ),
    // Negative: All tools disabled (edge case)
    new ToolVisibilityTestData(
        "QA Automation Course 2",
        Arrays.asList(),
        Arrays.asList("Assignments", "Discussions", "Grades", "Quizzes", "Attendance")
    ),
    // Edge: All tools enabled
    new ToolVisibilityTestData(
        "QA Automation Course 3",
        Arrays.asList("Assignments", "Discussions", "Grades", "Quizzes", "Attendance"),
        Arrays.asList()
    ),
    // Edge: Only one tool enabled
    new ToolVisibilityTestData(
        "QA Automation Course 4",
        Arrays.asList("Assignments"),
        Arrays.asList("Discussions", "Grades", "Quizzes", "Attendance")
    )
);

Page Object Classes:
- DashboardPage: goToCourseManagement()
- CourseManagementPage: initiateCourseCreation()
- CourseCreationPage: enterCourseName(), getVisibleTools(), getAllTools()

Test Steps:
1. Navigate to 'Course Management' and initiate creation of a new course.
2. Course creation form loads with tool list using the updated default visibility settings.
3. Review the visible tools as presented in the new course setup.
4. Assert only enabled tools are visible, disabled tools are hidden/inactive.

Logging is included for debug visibility.
*/
```