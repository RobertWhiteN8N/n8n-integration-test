```java
// Automation Test Script for:
// Test Title: Verify course appears under correct term, year, and department categories
// Preconditions: At least one course exists and is categorized by term, year, and department. Admin is logged in.
// Test Steps:
// 1. Go to 'Courses' and select the filter for 'Fall 2024'.
//    Expected: Only courses assigned to 'Fall 2024' are displayed.
// 2. Apply additional filter for year '2024'.
//    Expected: List is updated to only show courses from 'Fall 2024' and year '2024'.
// 3. Apply department filter for 'Computer Science'.
//    Expected: List displays only courses in 'Computer Science' for 'Fall 2024', year '2024'.
// Post-Conditions: Filtered course views correctly represent the assigned categories.

package com.example.tests;

import org.testng.annotations.*;
import org.testng.Assert;
import org.openqa.selenium.*;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.support.ui.*;
import java.util.*;
import java.util.logging.Logger;

// Test Data Object for Data-Driven Testing
class CourseFilterTestData {
    public String term;
    public String year;
    public String department;
    public List<String> expectedCourses;

    public CourseFilterTestData(String term, String year, String department, List<String> expectedCourses) {
        this.term = term;
        this.year = year;
        this.department = department;
        this.expectedCourses = expectedCourses;
    }
}

// Page Object for Login Page (if needed for login step)
class LoginPage {
    private WebDriver driver;
    private By usernameField = By.id("username");
    private By passwordField = By.id("password");
    private By loginButton = By.id("loginBtn");

    public LoginPage(WebDriver driver) {
        this.driver = driver;
    }

    public void loginAsAdmin(String username, String password) {
        driver.findElement(usernameField).sendKeys(username);
        driver.findElement(passwordField).sendKeys(password);
        driver.findElement(loginButton).click();
    }
}

// Page Object for Courses Page
class CoursesPage {
    private WebDriver driver;
    private WebDriverWait wait;
    private Logger logger = Logger.getLogger(CoursesPage.class.getName());

    // Locators
    private By termFilterDropdown = By.id("termFilter");
    private By yearFilterDropdown = By.id("yearFilter");
    private By departmentFilterDropdown = By.id("departmentFilter");
    private By courseRows = By.cssSelector(".course-row");
    private By courseTerm = By.cssSelector(".course-term");
    private By courseYear = By.cssSelector(".course-year");
    private By courseDepartment = By.cssSelector(".course-department");
    private By courseTitle = By.cssSelector(".course-title");

    public CoursesPage(WebDriver driver) {
        this.driver = driver;
        this.wait = new WebDriverWait(driver, 10);
    }

    public void goTo() {
        driver.findElement(By.linkText("Courses")).click();
        wait.until(ExpectedConditions.visibilityOfElementLocated(termFilterDropdown));
        logger.info("Navigated to Courses page.");
    }

    public void selectTerm(String term) {
        Select select = new Select(driver.findElement(termFilterDropdown));
        select.selectByVisibleText(term);
        waitForCourseListUpdate();
        logger.info("Selected term filter: " + term);
    }

    public void selectYear(String year) {
        Select select = new Select(driver.findElement(yearFilterDropdown));
        select.selectByVisibleText(year);
        waitForCourseListUpdate();
        logger.info("Selected year filter: " + year);
    }

    public void selectDepartment(String department) {
        Select select = new Select(driver.findElement(departmentFilterDropdown));
        select.selectByVisibleText(department);
        waitForCourseListUpdate();
        logger.info("Selected department filter: " + department);
    }

    public List<Map<String, String>> getDisplayedCourses() {
        List<Map<String, String>> courses = new ArrayList<>();
        List<WebElement> rows = driver.findElements(courseRows);
        for (WebElement row : rows) {
            Map<String, String> course = new HashMap<>();
            course.put("term", row.findElement(courseTerm).getText());
            course.put("year", row.findElement(courseYear).getText());
            course.put("department", row.findElement(courseDepartment).getText());
            course.put("title", row.findElement(courseTitle).getText());
            courses.add(course);
        }
        logger.info("Found " + courses.size() + " courses displayed.");
        return courses;
    }

    private void waitForCourseListUpdate() {
        wait.until(ExpectedConditions.invisibilityOfElementLocated(By.cssSelector(".loading-indicator")));
    }
}

// TestNG Test Class
public class CourseFilterTest {
    private WebDriver driver;
    private Logger logger = Logger.getLogger(CourseFilterTest.class.getName());

    // Test Data Set
    // Includes positive, negative, and edge cases
    private static final List<CourseFilterTestData> testDataSet = Arrays.asList(
        // Positive case: All filters match existing courses
        new CourseFilterTestData(
            "Fall 2024", "2024", "Computer Science",
            Arrays.asList("Intro to Algorithms", "Data Structures")
        ),
        // Negative case: No courses for given filters
        new CourseFilterTestData(
            "Spring 2023", "2023", "History",
            Collections.emptyList()
        ),
        // Edge case: Only term filter applied, multiple departments
        new CourseFilterTestData(
            "Fall 2024", "", "",
            Arrays.asList("Intro to Algorithms", "Data Structures", "Modern Art")
        ),
        // Edge case: Only year filter applied
        new CourseFilterTestData(
            "", "2024", "",
            Arrays.asList("Intro to Algorithms", "Data Structures", "Modern Art")
        ),
        // Edge case: Only department filter applied
        new CourseFilterTestData(
            "", "", "Computer Science",
            Arrays.asList("Intro to Algorithms", "Data Structures")
        )
    );

    @BeforeClass
    public void setUp() {
        driver = new ChromeDriver();
        driver.manage().window().maximize();
        driver.get("https://example.com/login");
        // Login as admin (assuming credentials are 'admin'/'adminpass')
        LoginPage loginPage = new LoginPage(driver);
        loginPage.loginAsAdmin("admin", "adminpass");
        logger.info("Logged in as admin.");
    }

    @AfterClass
    public void tearDown() {
        if (driver != null) {
            driver.quit();
            logger.info("Browser closed.");
        }
    }

    @DataProvider(name = "courseFilterData")
    public Object[][] courseFilterData() {
        Object[][] data = new Object[testDataSet.size()][1];
        for (int i = 0; i < testDataSet.size(); i++) {
            data[i][0] = testDataSet.get(i);
        }
        return data;
    }

    @Test(dataProvider = "courseFilterData")
    public void testCourseFilters(CourseFilterTestData testData) {
        CoursesPage coursesPage = new CoursesPage(driver);
        coursesPage.goTo();

        if (!testData.term.isEmpty()) {
            coursesPage.selectTerm(testData.term);
        }
        if (!testData.year.isEmpty()) {
            coursesPage.selectYear(testData.year);
        }
        if (!testData.department.isEmpty()) {
            coursesPage.selectDepartment(testData.department);
        }

        List<Map<String, String>> displayedCourses = coursesPage.getDisplayedCourses();
        List<String> displayedTitles = new ArrayList<>();
        for (Map<String, String> course : displayedCourses) {
            displayedTitles.add(course.get("title"));
            if (!testData.term.isEmpty()) {
                Assert.assertEquals(course.get("term"), testData.term, "Course term mismatch");
            }
            if (!testData.year.isEmpty()) {
                Assert.assertEquals(course.get("year"), testData.year, "Course year mismatch");
            }
            if (!testData.department.isEmpty()) {
                Assert.assertEquals(course.get("department"), testData.department, "Course department mismatch");
            }
        }

        Assert.assertEqualsNoOrder(
            displayedTitles.toArray(),
            testData.expectedCourses.toArray(),
            "Displayed courses do not match expected for filters: " +
                testData.term + ", " + testData.year + ", " + testData.department
        );
        logger.info("Test passed for filters: Term=" + testData.term + ", Year=" + testData.year + ", Department=" + testData.department);
    }
}
```
