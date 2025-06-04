```java
// Automation Test Script for: Filter courses by category and display matching courses
// Test Case Details:
// Test Title: Filter courses by category and display matching courses
// Preconditions: Admin user is logged into the course management dashboard. There are multiple courses assigned to different terms, years, and departments.
// Test Steps:
// 1. Navigate to the 'Bulk Settings' section in the admin dashboard.
// 2. Select a specific category (e.g., Term 'Fall 2024', Year '2024', or Department 'Computer Science').
// 3. Verify that each course listed falls under the selected category.
// Post-Conditions: Category filter displays only courses correctly grouped by the selected category.

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
import java.util.*;
import java.time.Duration;

// Test Data Model for Category Filtering
class CategoryFilterTestData {
    public String filterType; // "Term", "Year", "Department"
    public String filterValue;
    public List<CourseData> expectedCourses;

    public CategoryFilterTestData(String filterType, String filterValue, List<CourseData> expectedCourses) {
        this.filterType = filterType;
        this.filterValue = filterValue;
        this.expectedCourses = expectedCourses;
    }
}

// Model for Course Data
class CourseData {
    public String courseName;
    public String term;
    public String year;
    public String department;

    public CourseData(String courseName, String term, String year, String department) {
        this.courseName = courseName;
        this.term = term;
        this.year = year;
        this.department = department;
    }
}

// Page Object for Admin Dashboard Page
class AdminDashboardPage {
    private WebDriver driver;
    private WebDriverWait wait;

    @FindBy(how = How.ID, using = "bulkSettingsNav")
    private WebElement bulkSettingsNavLink;

    public AdminDashboardPage(WebDriver driver) {
        this.driver = driver;
        this.wait = new WebDriverWait(driver, Duration.ofSeconds(10));
        PageFactory.initElements(driver, this);
    }

    public void goToBulkSettings() {
        wait.until(ExpectedConditions.elementToBeClickable(bulkSettingsNavLink)).click();
    }
}

// Page Object for Bulk Settings Page
class BulkSettingsPage {
    private WebDriver driver;
    private WebDriverWait wait;

    @FindBy(how = How.ID, using = "filterTermDropdown")
    private WebElement termDropdown;

    @FindBy(how = How.ID, using = "filterYearDropdown")
    private WebElement yearDropdown;

    @FindBy(how = How.ID, using = "filterDepartmentDropdown")
    private WebElement departmentDropdown;

    @FindBy(how = How.ID, using = "applyFilterBtn")
    private WebElement applyFilterBtn;

    @FindBy(how = How.CSS, using = ".course-list .course-item")
    private List<WebElement> courseItems;

    public BulkSettingsPage(WebDriver driver) {
        this.driver = driver;
        this.wait = new WebDriverWait(driver, Duration.ofSeconds(10));
        PageFactory.initElements(driver, this);
    }

    public void selectCategoryFilter(String filterType, String filterValue) {
        WebElement dropdown = null;
        switch (filterType) {
            case "Term":
                dropdown = termDropdown;
                break;
            case "Year":
                dropdown = yearDropdown;
                break;
            case "Department":
                dropdown = departmentDropdown;
                break;
            default:
                throw new IllegalArgumentException("Unknown filter type: " + filterType);
        }
        Select select = new Select(dropdown);
        select.selectByVisibleText(filterValue);
    }

    public void applyFilter() {
        wait.until(ExpectedConditions.elementToBeClickable(applyFilterBtn)).click();
        wait.until(ExpectedConditions.visibilityOfAllElements(courseItems));
    }

    public List<CourseData> getDisplayedCourses() {
        List<CourseData> displayedCourses = new ArrayList<>();
        for (WebElement item : courseItems) {
            String name = item.findElement(By.cssSelector(".course-name")).getText();
            String term = item.findElement(By.cssSelector(".course-term")).getText();
            String year = item.findElement(By.cssSelector(".course-year")).getText();
            String dept = item.findElement(By.cssSelector(".course-department")).getText();
            displayedCourses.add(new CourseData(name, term, year, dept));
        }
        return displayedCourses;
    }
}

// TestNG Test Class
public class FilterCoursesByCategoryTest {
    private WebDriver driver;
    private AdminDashboardPage adminDashboardPage;
    private BulkSettingsPage bulkSettingsPage;
    private static final Logger logger = LogManager.getLogger(FilterCoursesByCategoryTest.class);

    // Test Data Set: Positive, Negative, and Edge Cases
    // (In real-world, expectedCourses would be fetched from DB or API, here it's hardcoded for illustration)
    private static final List<CategoryFilterTestData> testDataSet = Arrays.asList(
        // Positive: Filter by Term
        new CategoryFilterTestData(
            "Term", "Fall 2024",
            Arrays.asList(
                new CourseData("Intro to Java", "Fall 2024", "2024", "Computer Science"),
                new CourseData("Data Structures", "Fall 2024", "2024", "Computer Science")
            )
        ),
        // Positive: Filter by Year
        new CategoryFilterTestData(
            "Year", "2024",
            Arrays.asList(
                new CourseData("Intro to Java", "Fall 2024", "2024", "Computer Science"),
                new CourseData("Data Structures", "Fall 2024", "2024", "Computer Science"),
                new CourseData("Calculus I", "Spring 2024", "2024", "Mathematics")
            )
        ),
        // Positive: Filter by Department
        new CategoryFilterTestData(
            "Department", "Mathematics",
            Arrays.asList(
                new CourseData("Calculus I", "Spring 2024", "2024", "Mathematics"),
                new CourseData("Linear Algebra", "Fall 2023", "2023", "Mathematics")
            )
        ),
        // Negative: Filter by non-existent Term
        new CategoryFilterTestData(
            "Term", "Winter 2030",
            Collections.emptyList()
        ),
        // Edge: Filter by Department with only one course
        new CategoryFilterTestData(
            "Department", "Physics",
            Arrays.asList(
                new CourseData("Quantum Mechanics", "Fall 2024", "2024", "Physics")
            )
        )
    );

    @BeforeClass
    public void setUp() {
        // Setup ChromeDriver (ensure chromedriver is in PATH)
        driver = new ChromeDriver();
        driver.manage().window().maximize();
        driver.get("https://example.com/admin/dashboard");
        adminDashboardPage = new AdminDashboardPage(driver);
        bulkSettingsPage = new BulkSettingsPage(driver);
        // Assume admin is already logged in as per precondition
        logger.info("Setup complete, navigated to admin dashboard.");
    }

    @AfterClass
    public void tearDown() {
        if (driver != null) {
            driver.quit();
            logger.info("Driver closed.");
        }
    }

    @DataProvider(name = "categoryFilterData")
    public Object[][] categoryFilterData() {
        Object[][] data = new Object[testDataSet.size()][1];
        for (int i = 0; i < testDataSet.size(); i++) {
            data[i][0] = testDataSet.get(i);
        }
        return data;
    }

    @Test(dataProvider = "categoryFilterData")
    public void testFilterCoursesByCategory(CategoryFilterTestData testData) {
        logger.info("Starting test for filterType: {}, filterValue: {}", testData.filterType, testData.filterValue);

        // Step 1: Navigate to 'Bulk Settings'
        adminDashboardPage.goToBulkSettings();
        logger.info("Navigated to Bulk Settings section.");

        // Step 2: Select category filter
        bulkSettingsPage.selectCategoryFilter(testData.filterType, testData.filterValue);
        logger.info("Selected filter: {} = {}", testData.filterType, testData.filterValue);

        // Step 2b: Apply filter
        bulkSettingsPage.applyFilter();
        logger.info("Applied filter and waiting for results.");

        // Step 3: Verify displayed courses match filter
        List<CourseData> displayedCourses = bulkSettingsPage.getDisplayedCourses();
        logger.info("Displayed courses count: {}", displayedCourses.size());

        if (testData.expectedCourses.isEmpty()) {
            assert displayedCourses.isEmpty() : "Expected no courses, but some were displayed.";
            logger.info("Verified no courses displayed for filter: {} = {}", testData.filterType, testData.filterValue);
        } else {
            for (CourseData course : displayedCourses) {
                switch (testData.filterType) {
                    case "Term":
                        assert course.term.equals(testData.filterValue) : "Course " + course.courseName + " does not match term filter.";
                        break;
                    case "Year":
                        assert course.year.equals(testData.filterValue) : "Course " + course.courseName + " does not match year filter.";
                        break;
                    case "Department":
                        assert course.department.equals(testData.filterValue) : "Course " + course.courseName + " does not match department filter.";
                        break;
                }
            }
            // Optionally, verify the expected courses match exactly (order-insensitive)
            Set<String> expectedNames = new HashSet<>();
            for (CourseData c : testData.expectedCourses) expectedNames.add(c.courseName);
            Set<String> actualNames = new HashSet<>();
            for (CourseData c : displayedCourses) actualNames.add(c.courseName);
            assert expectedNames.equals(actualNames) : "Displayed courses do not match expected courses.";
            logger.info("Verified all displayed courses match the selected filter.");
        }
    }
}

/*
Test Data Set (as Java objects):

testDataSet = [
    // Positive: Filter by Term
    {
        filterType: "Term",
        filterValue: "Fall 2024",
        expectedCourses: [
            { courseName: "Intro to Java", term: "Fall 2024", year: "2024", department: "Computer Science" },
            { courseName: "Data Structures", term: "Fall 2024", year: "2024", department: "Computer Science" }
        ]
    },
    // Positive: Filter by Year
    {
        filterType: "Year",
        filterValue: "2024",
        expectedCourses: [
            { courseName: "Intro to Java", term: "Fall 2024", year: "2024", department: "Computer Science" },
            { courseName: "Data Structures", term: "Fall 2024", year: "2024", department: "Computer Science" },
            { courseName: "Calculus I", term: "Spring 2024", year: "2024", department: "Mathematics" }
        ]
    },
    // Positive: Filter by Department
    {
        filterType: "Department",
        filterValue: "Mathematics",
        expectedCourses: [
            { courseName: "Calculus I", term: "Spring 2024", year: "2024", department: "Mathematics" },
            { courseName: "Linear Algebra", term: "Fall 2023", year: "2023", department: "Mathematics" }
        ]
    },
    // Negative: Filter by non-existent Term
    {
        filterType: "Term",
        filterValue: "Winter 2030",
        expectedCourses: []
    },
    // Edge: Filter by Department with only one course
    {
        filterType: "Department",
        filterValue: "Physics",
        expectedCourses: [
            { courseName: "Quantum Mechanics", term: "Fall 2024", year: "2024", department: "Physics" }
        ]
    }
]

Page Object Classes:
- AdminDashboardPage: goToBulkSettings()
- BulkSettingsPage: selectCategoryFilter(), applyFilter(), getDisplayedCourses()

Logging: Uses log4j2 for debug visibility.

*/
```