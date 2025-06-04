```java
// Automation Script for Test Case: Assign multiple categories (term and department) to a course and verify display
// Preconditions: Admin user is logged in; at least two departments and terms exist; at least one course is created.
// Test Steps:
// 1. Edit an existing course from the courses list.
// 2. Assign 'Spring 2024' as an additional term and 'Mathematics' as an additional department.
// 3. Save the changes to the course.
// 4. Filter the course list by 'Spring 2024' and 'Mathematics'.
// Post-Conditions: Courses correctly appear under all assigned categories. System supports multiple term and department associations per course.

package com.example.tests;

import org.testng.annotations.*;
import org.testng.Assert;
import org.openqa.selenium.*;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.support.ui.*;
import java.util.*;
import java.util.logging.Logger;

// Test Data Object
class CourseCategoryAssignmentData {
    public String courseName;
    public List<String> additionalTerms;
    public List<String> additionalDepartments;
    public String filterTerm;
    public String filterDepartment;
    public boolean expectSuccess;

    public CourseCategoryAssignmentData(String courseName, List<String> additionalTerms, List<String> additionalDepartments, String filterTerm, String filterDepartment, boolean expectSuccess) {
        this.courseName = courseName;
        this.additionalTerms = additionalTerms;
        this.additionalDepartments = additionalDepartments;
        this.filterTerm = filterTerm;
        this.filterDepartment = filterDepartment;
        this.expectSuccess = expectSuccess;
    }
}

// Page Object: Courses List Page
class CoursesListPage {
    private WebDriver driver;
    private WebDriverWait wait;
    private Logger logger = Logger.getLogger(CoursesListPage.class.getName());

    public CoursesListPage(WebDriver driver) {
        this.driver = driver;
        this.wait = new WebDriverWait(driver, 10);
    }

    // Locate course row by course name and click edit
    public void clickEditCourse(String courseName) {
        logger.info("Locating course row for course: " + courseName);
        WebElement courseRow = wait.until(ExpectedConditions.visibilityOfElementLocated(By.xpath("//tr[td[contains(text(),'" + courseName + "')]]")));
        WebElement editBtn = courseRow.findElement(By.xpath(".//button[contains(@class,'edit-course')]"));
        logger.info("Clicking edit button for course: " + courseName);
        editBtn.click();
    }

    // Filter by term and department
    public void filterByTermAndDepartment(String term, String department) {
        logger.info("Filtering course list by term: " + term + " and department: " + department);
        Select termDropdown = new Select(wait.until(ExpectedConditions.visibilityOfElementLocated(By.id("filter-term"))));
        termDropdown.selectByVisibleText(term);
        Select deptDropdown = new Select(wait.until(ExpectedConditions.visibilityOfElementLocated(By.id("filter-department"))));
        deptDropdown.selectByVisibleText(department);
        WebElement filterBtn = driver.findElement(By.id("filter-btn"));
        filterBtn.click();
    }

    // Verify course is displayed in the filtered list
    public boolean isCourseDisplayed(String courseName) {
        logger.info("Verifying if course is displayed: " + courseName);
        try {
            wait.until(ExpectedConditions.visibilityOfElementLocated(By.xpath("//tr[td[contains(text(),'" + courseName + "')]]")));
            return true;
        } catch (TimeoutException e) {
            return false;
        }
    }
}

// Page Object: Course Edit Page
class CourseEditPage {
    private WebDriver driver;
    private WebDriverWait wait;
    private Logger logger = Logger.getLogger(CourseEditPage.class.getName());

    public CourseEditPage(WebDriver driver) {
        this.driver = driver;
        this.wait = new WebDriverWait(driver, 10);
    }

    // Wait for course details form to load
    public void waitForForm() {
        logger.info("Waiting for course details form to load.");
        wait.until(ExpectedConditions.visibilityOfElementLocated(By.id("course-edit-form")));
    }

    // Assign additional terms
    public void assignTerms(List<String> terms) {
        logger.info("Assigning terms: " + terms);
        for (String term : terms) {
            WebElement termCheckbox = wait.until(ExpectedConditions.elementToBeClickable(By.xpath("//label[contains(text(),'" + term + "')]/preceding-sibling::input[@type='checkbox']")));
            if (!termCheckbox.isSelected()) {
                termCheckbox.click();
            }
        }
    }

    // Assign additional departments
    public void assignDepartments(List<String> departments) {
        logger.info("Assigning departments: " + departments);
        for (String dept : departments) {
            WebElement deptCheckbox = wait.until(ExpectedConditions.elementToBeClickable(By.xpath("//label[contains(text(),'" + dept + "')]/preceding-sibling::input[@type='checkbox']")));
            if (!deptCheckbox.isSelected()) {
                deptCheckbox.click();
            }
        }
    }

    // Save changes
    public void saveChanges() {
        logger.info("Saving changes to the course.");
        WebElement saveBtn = driver.findElement(By.id("save-course-btn"));
        saveBtn.click();
    }

    // Verify confirmation message
    public boolean isUpdateConfirmationDisplayed() {
        logger.info("Checking for update confirmation message.");
        try {
            wait.until(ExpectedConditions.visibilityOfElementLocated(By.xpath("//div[contains(@class,'alert-success') and contains(text(),'successfully updated')]")));
            return true;
        } catch (TimeoutException e) {
            return false;
        }
    }

    // Verify assigned categories are visible
    public boolean areCategoriesVisible(List<String> terms, List<String> departments) {
        logger.info("Verifying assigned terms and departments are visible.");
        for (String term : terms) {
            if (driver.findElements(By.xpath("//span[contains(@class,'assigned-term') and text()='" + term + "']")).isEmpty()) {
                logger.warning("Term not visible: " + term);
                return false;
            }
        }
        for (String dept : departments) {
            if (driver.findElements(By.xpath("//span[contains(@class,'assigned-department') and text()='" + dept + "']")).isEmpty()) {
                logger.warning("Department not visible: " + dept);
                return false;
            }
        }
        return true;
    }
}

// Test Class
public class AssignMultipleCategoriesTest {
    private WebDriver driver;
    private Logger logger = Logger.getLogger(AssignMultipleCategoriesTest.class.getName());

    // Test Data Set (Positive, Negative, Edge Cases)
    // - Positive: Assign valid additional term and department
    // - Negative: Assign non-existent term/department (should fail)
    // - Edge: Assign already assigned term/department (should remain assigned, no error)
    private static final List<CourseCategoryAssignmentData> testData = Arrays.asList(
        // Positive case
        new CourseCategoryAssignmentData(
            "Calculus I",
            Arrays.asList("Spring 2024"),
            Arrays.asList("Mathematics"),
            "Spring 2024",
            "Mathematics",
            true
        ),
        // Negative case: non-existent term/department
        new CourseCategoryAssignmentData(
            "Calculus I",
            Arrays.asList("NonExistentTerm"),
            Arrays.asList("NonExistentDept"),
            "NonExistentTerm",
            "NonExistentDept",
            false
        ),
        // Edge case: already assigned term/department
        new CourseCategoryAssignmentData(
            "Calculus I",
            Arrays.asList("Fall 2023"), // Assume already assigned
            Arrays.asList("Science"),   // Assume already assigned
            "Fall 2023",
            "Science",
            true
        )
    );

    @BeforeClass
    public void setUp() {
        // Setup ChromeDriver (ensure chromedriver is in PATH)
        driver = new ChromeDriver();
        driver.manage().window().maximize();
        driver.get("https://example.com/admin/courses"); // Replace with actual URL
        // Assume admin is already logged in as per precondition
    }

    @AfterClass
    public void tearDown() {
        if (driver != null) driver.quit();
    }

    @DataProvider(name = "categoryAssignmentData")
    public Object[][] categoryAssignmentData() {
        Object[][] data = new Object[testData.size()][1];
        for (int i = 0; i < testData.size(); i++) {
            data[i][0] = testData.get(i);
        }
        return data;
    }

    @Test(dataProvider = "categoryAssignmentData")
    public void testAssignMultipleCategories(CourseCategoryAssignmentData data) {
        logger.info("Starting test for course: " + data.courseName);

        CoursesListPage coursesListPage = new CoursesListPage(driver);
        CourseEditPage courseEditPage = new CourseEditPage(driver);

        // Step 1: Edit an existing course
        coursesListPage.clickEditCourse(data.courseName);
        courseEditPage.waitForForm();

        // Step 2: Assign additional term and department
        courseEditPage.assignTerms(data.additionalTerms);
        courseEditPage.assignDepartments(data.additionalDepartments);

        // Step 2 Expected: Selections are registered and visible
        boolean categoriesVisible = courseEditPage.areCategoriesVisible(data.additionalTerms, data.additionalDepartments);
        if (data.expectSuccess) {
            Assert.assertTrue(categoriesVisible, "Assigned categories should be visible in course details.");
        } else {
            Assert.assertFalse(categoriesVisible, "Non-existent categories should not be visible.");
        }

        // Step 3: Save changes
        courseEditPage.saveChanges();

        // Step 3 Expected: Confirmation message
        boolean confirmation = courseEditPage.isUpdateConfirmationDisplayed();
        if (data.expectSuccess) {
            Assert.assertTrue(confirmation, "Confirmation message should be displayed after successful update.");
        } else {
            Assert.assertFalse(confirmation, "Confirmation message should not be displayed for invalid assignment.");
        }

        // Step 4: Filter course list by term and department
        driver.get("https://example.com/admin/courses"); // Reload list page
        coursesListPage.filterByTermAndDepartment(data.filterTerm, data.filterDepartment);

        // Step 4 Expected: Edited course is displayed under both categories
        boolean courseDisplayed = coursesListPage.isCourseDisplayed(data.courseName);
        if (data.expectSuccess) {
            Assert.assertTrue(courseDisplayed, "Course should be displayed under the assigned term and department.");
        } else {
            Assert.assertFalse(courseDisplayed, "Course should not be displayed under non-existent categories.");
        }
    }
}
```
