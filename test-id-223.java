```java
// AvailabilityChangeTest.java

// This file implements the test case:
// "Availability change is immediately reflected in student course view"
// using Java, TestNG, Selenium WebDriver, and the Page Object Model (POM).
// It includes Page Object classes for Admin and Student views, a test data set,
// and the TestNG test class with logging for debug visibility.

package com.example.tests;

import org.testng.annotations.*;
import org.testng.Assert;
import org.openqa.selenium.*;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.support.ui.*;
import java.time.Duration;
import java.util.logging.Logger;
import java.util.Arrays;
import java.util.List;

// --- Test Data Object ---
class CourseAvailabilityTestData {
    public String adminUsername;
    public String adminPassword;
    public String studentUsername;
    public String studentPassword;
    public String courseName;

    public CourseAvailabilityTestData(String adminUsername, String adminPassword, String studentUsername, String studentPassword, String courseName) {
        this.adminUsername = adminUsername;
        this.adminPassword = adminPassword;
        this.studentUsername = studentUsername;
        this.studentPassword = studentPassword;
        this.courseName = courseName;
    }
}

// --- Page Object: Admin Login Page ---
class AdminLoginPage {
    private WebDriver driver;
    private By usernameField = By.id("admin-username");
    private By passwordField = By.id("admin-password");
    private By loginButton = By.id("admin-login-btn");

    public AdminLoginPage(WebDriver driver) {
        this.driver = driver;
    }

    public void login(String username, String password) {
        driver.findElement(usernameField).clear();
        driver.findElement(usernameField).sendKeys(username);
        driver.findElement(passwordField).clear();
        driver.findElement(passwordField).sendKeys(password);
        driver.findElement(loginButton).click();
    }
}

// --- Page Object: Admin Course Management Page ---
class AdminCoursePage {
    private WebDriver driver;
    private WebDriverWait wait;

    public AdminCoursePage(WebDriver driver) {
        this.driver = driver;
        this.wait = new WebDriverWait(driver, Duration.ofSeconds(10));
    }

    private By getCourseRowByName(String courseName) {
        return By.xpath("//tr[td[contains(text(),'" + courseName + "')]]");
    }

    private By getAvailabilityToggleByCourse(String courseName) {
        return By.xpath("//tr[td[contains(text(),'" + courseName + "')]]//button[contains(@class,'toggle-availability')]");
    }

    private By getStatusCellByCourse(String courseName) {
        return By.xpath("//tr[td[contains(text(),'" + courseName + "')]]//td[contains(@class,'status')]");
    }

    public void setCourseAvailability(String courseName, boolean available) {
        wait.until(ExpectedConditions.visibilityOfElementLocated(getCourseRowByName(courseName)));
        WebElement toggleBtn = driver.findElement(getAvailabilityToggleByCourse(courseName));
        String currentStatus = getCourseStatus(courseName);
        if ((available && currentStatus.equalsIgnoreCase("Unavailable")) ||
            (!available && currentStatus.equalsIgnoreCase("Available"))) {
            toggleBtn.click();
            wait.until(ExpectedConditions.textToBe(getStatusCellByCourse(courseName), available ? "Available" : "Unavailable"));
        }
    }

    public String getCourseStatus(String courseName) {
        wait.until(ExpectedConditions.visibilityOfElementLocated(getStatusCellByCourse(courseName)));
        return driver.findElement(getStatusCellByCourse(courseName)).getText().trim();
    }
}

// --- Page Object: Student Login Page ---
class StudentLoginPage {
    private WebDriver driver;
    private By usernameField = By.id("student-username");
    private By passwordField = By.id("student-password");
    private By loginButton = By.id("student-login-btn");

    public StudentLoginPage(WebDriver driver) {
        this.driver = driver;
    }

    public void login(String username, String password) {
        driver.findElement(usernameField).clear();
        driver.findElement(usernameField).sendKeys(username);
        driver.findElement(passwordField).clear();
        driver.findElement(passwordField).sendKeys(password);
        driver.findElement(loginButton).click();
    }
}

// --- Page Object: Student Course List Page ---
class StudentCourseListPage {
    private WebDriver driver;
    private WebDriverWait wait;

    public StudentCourseListPage(WebDriver driver) {
        this.driver = driver;
        this.wait = new WebDriverWait(driver, Duration.ofSeconds(10));
    }

    private By courseRowByName(String courseName) {
        return By.xpath("//div[contains(@class,'course-list')]//div[contains(@class,'course-row') and .//span[contains(text(),'" + courseName + "')]]");
    }

    private By courseStatusByName(String courseName) {
        return By.xpath("//div[contains(@class,'course-list')]//div[contains(@class,'course-row') and .//span[contains(text(),'" + courseName + "')]]//span[contains(@class,'status')]");
    }

    public boolean isCourseVisible(String courseName) {
        try {
            wait.until(ExpectedConditions.visibilityOfElementLocated(By.className("course-list")));
            return driver.findElements(courseRowByName(courseName)).size() > 0;
        } catch (TimeoutException e) {
            return false;
        }
    }

    public String getCourseStatus(String courseName) {
        if (!isCourseVisible(courseName)) return "NotVisible";
        return driver.findElement(courseStatusByName(courseName)).getText().trim();
    }

    public void refresh() {
        driver.navigate().refresh();
        wait.until(ExpectedConditions.visibilityOfElementLocated(By.className("course-list")));
    }
}

// --- TestNG Test Class ---
public class AvailabilityChangeTest {
    private WebDriver adminDriver;
    private WebDriver studentDriver;
    private Logger logger = Logger.getLogger(AvailabilityChangeTest.class.getName());

    // --- Test Data Set ---
    // Diverse data: normal, edge (course with special chars), negative (course does not exist)
    private List<CourseAvailabilityTestData> testDataSet = Arrays.asList(
        new CourseAvailabilityTestData("admin1", "adminPass", "student1", "studentPass", "Math 101"),
        new CourseAvailabilityTestData("admin1", "adminPass", "student1", "studentPass", "Science & Technology"),
        new CourseAvailabilityTestData("admin1", "adminPass", "student1", "studentPass", "NonExistentCourse")
    );

    @BeforeClass
    public void setUp() {
        // Set up two browser sessions: one for admin, one for student
        adminDriver = new ChromeDriver();
        studentDriver = new ChromeDriver();
        adminDriver.manage().timeouts().implicitlyWait(Duration.ofSeconds(10));
        studentDriver.manage().timeouts().implicitlyWait(Duration.ofSeconds(10));
    }

    @AfterClass
    public void tearDown() {
        if (adminDriver != null) adminDriver.quit();
        if (studentDriver != null) studentDriver.quit();
    }

    @DataProvider(name = "courseAvailabilityData")
    public Object[][] courseAvailabilityData() {
        return testDataSet.stream().map(data -> new Object[]{data}).toArray(Object[][]::new);
    }

    @Test(dataProvider = "courseAvailabilityData")
    public void testCourseAvailabilityChangeReflected(CourseAvailabilityTestData data) {
        logger.info("=== Starting test for course: " + data.courseName + " ===");

        // --- Admin logs in ---
        adminDriver.get("https://example.com/admin/login");
        AdminLoginPage adminLogin = new AdminLoginPage(adminDriver);
        adminLogin.login(data.adminUsername, data.adminPassword);

        // --- Student logs in ---
        studentDriver.get("https://example.com/student/login");
        StudentLoginPage studentLogin = new StudentLoginPage(studentDriver);
        studentLogin.login(data.studentUsername, data.studentPassword);

        // --- Admin navigates to course management ---
        adminDriver.get("https://example.com/admin/courses");
        AdminCoursePage adminCoursePage = new AdminCoursePage(adminDriver);

        // --- Student navigates to course list ---
        studentDriver.get("https://example.com/student/courses");
        StudentCourseListPage studentCourseList = new StudentCourseListPage(studentDriver);

        // Step 1: Admin sets course to 'unavailable'
        logger.info("Step 1: Admin sets course to 'unavailable'");
        try {
            adminCoursePage.setCourseAvailability(data.courseName, false);
            String adminStatus = adminCoursePage.getCourseStatus(data.courseName);
            Assert.assertEquals(adminStatus, "Unavailable", "Admin backend status should be 'Unavailable'");
        } catch (NoSuchElementException e) {
            logger.warning("Course not found in admin view: " + data.courseName);
            Assert.fail("Course not found in admin view: " + data.courseName);
        }

        // Step 2: Student refreshes course list
        logger.info("Step 2: Student refreshes course list");
        studentCourseList.refresh();
        boolean courseVisible = studentCourseList.isCourseVisible(data.courseName);
        String studentStatus = studentCourseList.getCourseStatus(data.courseName);
        if (data.courseName.equals("NonExistentCourse")) {
            Assert.assertFalse(courseVisible, "Non-existent course should not be visible to student");
        } else {
            Assert.assertTrue(!courseVisible || studentStatus.equalsIgnoreCase("Unavailable"),
                "Course should not be visible or should be marked as unavailable in student view");
        }

        // Step 3: Admin sets course to 'available'
        logger.info("Step 3: Admin sets course to 'available'");
        try {
            adminCoursePage.setCourseAvailability(data.courseName, true);
            String adminStatus = adminCoursePage.getCourseStatus(data.courseName);
            Assert.assertEquals(adminStatus, "Available", "Admin backend status should be 'Available'");
        } catch (NoSuchElementException e) {
            logger.warning("Course not found in admin view (on re-enable): " + data.courseName);
            Assert.fail("Course not found in admin view (on re-enable): " + data.courseName);
        }

        // Step 4: Student refreshes course list again
        logger.info("Step 4: Student refreshes course list again");
        studentCourseList.refresh();
        courseVisible = studentCourseList.isCourseVisible(data.courseName);
        studentStatus = studentCourseList.getCourseStatus(data.courseName);
        if (data.courseName.equals("NonExistentCourse")) {
            Assert.assertFalse(courseVisible, "Non-existent course should not be visible to student");
        } else {
            Assert.assertTrue(courseVisible, "Course should be visible to student after re-enabling");
            Assert.assertEquals(studentStatus, "Available", "Course should be marked as available in student view");
        }

        logger.info("=== Test completed for course: " + data.courseName + " ===");
    }
}

/*
Test Data Set (as Java objects):

- Normal case: "Math 101"
- Edge case: "Science & Technology" (special chars)
- Negative case: "NonExistentCourse"

Page Objects:
- AdminLoginPage: login(username, password)
- AdminCoursePage: setCourseAvailability(courseName, available), getCourseStatus(courseName)
- StudentLoginPage: login(username, password)
- StudentCourseListPage: isCourseVisible(courseName), getCourseStatus(courseName), refresh()

Test Steps:
1. Admin sets course to unavailable, verify backend.
2. Student refreshes, verify course not visible or marked unavailable.
3. Admin sets course to available, verify backend.
4. Student refreshes, verify course visible and marked available.

Logging is used for debug visibility.
*/
```