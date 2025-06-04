```java
// Automation Test Script for: Assign term, year, and department to a new course
// Test Case Steps and Data-driven Scenarios included below

package com.example.tests;

import org.testng.annotations.*;
import org.openqa.selenium.*;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.support.ui.*;
import org.openqa.selenium.support.PageFactory;
import org.openqa.selenium.support.FindBy;
import org.openqa.selenium.support.How;
import org.testng.Assert;
import java.util.concurrent.TimeUnit;
import java.util.logging.Logger;
import java.util.*;

// ==================== Test Data Object ====================
// Test data for course creation, covering positive, negative, and edge cases

class CourseTestData {
    public String title;
    public String description;
    public String term;
    public String year;
    public String department;
    public boolean expectSuccess;
    public String expectedMessage;

    public CourseTestData(String title, String description, String term, String year, String department, boolean expectSuccess, String expectedMessage) {
        this.title = title;
        this.description = description;
        this.term = term;
        this.year = year;
        this.department = department;
        this.expectSuccess = expectSuccess;
        this.expectedMessage = expectedMessage;
    }
}

// ==================== Page Object: DashboardPage ====================

class DashboardPage {
    WebDriver driver;
    WebDriverWait wait;

    @FindBy(how = How.LINK_TEXT, using = "Create Course")
    WebElement createCourseLink;

    public DashboardPage(WebDriver driver) {
        this.driver = driver;
        this.wait = new WebDriverWait(driver, 10);
        PageFactory.initElements(driver, this);
    }

    public void goToCreateCoursePage() {
        wait.until(ExpectedConditions.elementToBeClickable(createCourseLink));
        createCourseLink.click();
    }
}

// ==================== Page Object: CreateCoursePage ====================

class CreateCoursePage {
    WebDriver driver;
    WebDriverWait wait;

    @FindBy(how = How.ID, using = "courseTitle")
    WebElement courseTitleInput;

    @FindBy(how = How.ID, using = "courseDescription")
    WebElement courseDescriptionInput;

    @FindBy(how = How.ID, using = "termDropdown")
    WebElement termDropdown;

    @FindBy(how = How.ID, using = "yearDropdown")
    WebElement yearDropdown;

    @FindBy(how = How.ID, using = "departmentDropdown")
    WebElement departmentDropdown;

    @FindBy(how = How.ID, using = "saveCourseBtn")
    WebElement saveCourseBtn;

    @FindBy(how = How.CSS, using = ".alert-success")
    WebElement successAlert;

    @FindBy(how = How.CSS, using = ".alert-danger")
    WebElement errorAlert;

    public CreateCoursePage(WebDriver driver) {
        this.driver = driver;
        this.wait = new WebDriverWait(driver, 10);
        PageFactory.initElements(driver, this);
    }

    public void fillCourseTitle(String title) {
        wait.until(ExpectedConditions.visibilityOf(courseTitleInput));
        courseTitleInput.clear();
        courseTitleInput.sendKeys(title);
    }

    public void fillCourseDescription(String description) {
        wait.until(ExpectedConditions.visibilityOf(courseDescriptionInput));
        courseDescriptionInput.clear();
        courseDescriptionInput.sendKeys(description);
    }

    public void selectTerm(String term) {
        wait.until(ExpectedConditions.elementToBeClickable(termDropdown));
        new Select(termDropdown).selectByVisibleText(term);
    }

    public void selectYear(String year) {
        wait.until(ExpectedConditions.elementToBeClickable(yearDropdown));
        new Select(yearDropdown).selectByVisibleText(year);
    }

    public void selectDepartment(String department) {
        wait.until(ExpectedConditions.elementToBeClickable(departmentDropdown));
        new Select(departmentDropdown).selectByVisibleText(department);
    }

    public void clickSave() {
        wait.until(ExpectedConditions.elementToBeClickable(saveCourseBtn));
        saveCourseBtn.click();
    }

    public String getSuccessMessage() {
        try {
            wait.until(ExpectedConditions.visibilityOf(successAlert));
            return successAlert.getText();
        } catch (TimeoutException e) {
            return null;
        }
    }

    public String getErrorMessage() {
        try {
            wait.until(ExpectedConditions.visibilityOf(errorAlert));
            return errorAlert.getText();
        } catch (TimeoutException e) {
            return null;
        }
    }
}

// ==================== Page Object: CourseListPage ====================

class CourseListPage {
    WebDriver driver;
    WebDriverWait wait;

    @FindBy(how = How.ID, using = "courseTable")
    WebElement courseTable;

    public CourseListPage(WebDriver driver) {
        this.driver = driver;
        this.wait = new WebDriverWait(driver, 10);
        PageFactory.initElements(driver, this);
    }

    public boolean isCoursePresent(String title, String term, String year, String department) {
        wait.until(ExpectedConditions.visibilityOf(courseTable));
        List<WebElement> rows = courseTable.findElements(By.tagName("tr"));
        for (WebElement row : rows) {
            List<WebElement> cols = row.findElements(By.tagName("td"));
            if (cols.size() >= 4) {
                String t = cols.get(0).getText().trim();
                String tr = cols.get(1).getText().trim();
                String y = cols.get(2).getText().trim();
                String d = cols.get(3).getText().trim();
                if (t.equals(title) && tr.equals(term) && y.equals(year) && d.equals(department)) {
                    return true;
                }
            }
        }
        return false;
    }
}

// ==================== Test Class: CourseCreationTest ====================

public class CourseCreationTest {
    WebDriver driver;
    Logger logger = Logger.getLogger(CourseCreationTest.class.getName());

    @BeforeClass
    public void setUp() {
        // Set up ChromeDriver path as needed
        driver = new ChromeDriver();
        driver.manage().timeouts().implicitlyWait(10, TimeUnit.SECONDS);
        driver.manage().window().maximize();
        // Precondition: Admin is already logged in
        driver.get("https://your-admin-portal-url/dashboard");
    }

    @AfterClass
    public void tearDown() {
        if (driver != null) driver.quit();
    }

    @DataProvider(name = "courseData")
    public Object[][] courseData() {
        return new Object[][]{
            // Positive scenario
            {new CourseTestData("Intro to Automation", "Learn test automation basics", "Fall 2024", "2024", "Computer Science", true, "Course created successfully")},
            // Negative: Missing title
            {new CourseTestData("", "No title provided", "Fall 2024", "2024", "Computer Science", false, "Title is required")},
            // Negative: Invalid year
            {new CourseTestData("Edge Year Course", "Year not in dropdown", "Fall 2024", "1999", "Computer Science", false, "Invalid academic year")},
            // Negative: Department not selected
            {new CourseTestData("No Department", "Department missing", "Fall 2024", "2024", "", false, "Department is required")},
            // Edge: Long title
            {new CourseTestData("A".repeat(255), "Max length title", "Fall 2024", "2024", "Computer Science", true, "Course created successfully")},
            // Edge: Special characters in title
            {new CourseTestData("Course!@#$%^&*()", "Special chars in title", "Fall 2024", "2024", "Computer Science", true, "Course created successfully")},
        };
    }

    @Test(dataProvider = "courseData")
    public void testCreateCourse(CourseTestData data) {
        logger.info("Navigating to Create Course page");
        DashboardPage dashboard = new DashboardPage(driver);
        dashboard.goToCreateCoursePage();

        logger.info("Filling in course details: " + data.title);
        CreateCoursePage createCourse = new CreateCoursePage(driver);
        createCourse.fillCourseTitle(data.title);
        createCourse.fillCourseDescription(data.description);

        if (!data.term.isEmpty()) {
            createCourse.selectTerm(data.term);
        }
        if (!data.year.isEmpty()) {
            createCourse.selectYear(data.year);
        }
        if (!data.department.isEmpty()) {
            createCourse.selectDepartment(data.department);
        }

        logger.info("Submitting the course creation form");
        createCourse.clickSave();

        if (data.expectSuccess) {
            String successMsg = createCourse.getSuccessMessage();
            logger.info("Verifying success message: " + successMsg);
            Assert.assertNotNull(successMsg, "Expected a success message but none was found.");
            Assert.assertTrue(successMsg.contains(data.expectedMessage), "Success message mismatch.");

            // Post-condition: Verify course appears in the course list
            logger.info("Verifying new course appears in the course list");
            driver.get("https://your-admin-portal-url/courses");
            CourseListPage courseList = new CourseListPage(driver);
            Assert.assertTrue(courseList.isCoursePresent(data.title, data.term, data.year, data.department),
                    "Course not found in the course list with correct attributes.");
        } else {
            String errorMsg = createCourse.getErrorMessage();
            logger.info("Verifying error message: " + errorMsg);
            Assert.assertNotNull(errorMsg, "Expected an error message but none was found.");
            Assert.assertTrue(errorMsg.contains(data.expectedMessage), "Error message mismatch.");
        }
    }
}

/*
==================== Test Data Scenarios ====================

1. Positive:
   - title: "Intro to Automation"
   - description: "Learn test automation basics"
   - term: "Fall 2024"
   - year: "2024"
   - department: "Computer Science"
   - expectSuccess: true
   - expectedMessage: "Course created successfully"

2. Negative (Missing title):
   - title: ""
   - description: "No title provided"
   - term: "Fall 2024"
   - year: "2024"
   - department: "Computer Science"
   - expectSuccess: false
   - expectedMessage: "Title is required"

3. Negative (Invalid year):
   - title: "Edge Year Course"
   - description: "Year not in dropdown"
   - term: "Fall 2024"
   - year: "1999"
   - department: "Computer Science"
   - expectSuccess: false
   - expectedMessage: "Invalid academic year"

4. Negative (Department not selected):
   - title: "No Department"
   - description: "Department missing"
   - term: "Fall 2024"
   - year: "2024"
   - department: ""
   - expectSuccess: false
   - expectedMessage: "Department is required"

5. Edge (Long title):
   - title: 255 characters 'A'
   - description: "Max length title"
   - term: "Fall 2024"
   - year: "2024"
   - department: "Computer Science"
   - expectSuccess: true
   - expectedMessage: "Course created successfully"

6. Edge (Special characters in title):
   - title: "Course!@#$%^&*()"
   - description: "Special chars in title"
   - term: "Fall 2024"
   - year: "2024"
   - department: "Computer Science"
   - expectSuccess: true
   - expectedMessage: "Course created successfully"

============================================================

Page Object Model (POM) Classes:
- DashboardPage: Navigates to Create Course page.
- CreateCoursePage: Fills course form, selects dropdowns, submits, and reads messages.
- CourseListPage: Verifies course presence in admin list.

Logging is used for step-by-step debug visibility.
TestNG DataProvider enables data-driven execution.
*/
```