```java
// Automation Test Script for: Admin accesses tool visibility settings from course management dashboard
// Test Case Steps:
// 1. Navigate to the 'Course Management' dashboard.
// 2. Locate and click on 'Tool Visibility Settings' or equivalent option.
// Preconditions: Admin user is logged into the dashboard with appropriate permissions.
// Post-Conditions: Admin is able to view and access the tool visibility configuration interface.

package com.example.tests;

import org.testng.annotations.*;
import org.openqa.selenium.*;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.support.ui.*;
import org.testng.Assert;
import java.time.Duration;
import java.util.logging.Logger;

// Test Data Object for Data-Driven Testing
class AdminDashboardTestData {
    public String username;
    public String password;
    public String dashboardUrl;
    public String toolVisibilityOptionText;

    public AdminDashboardTestData(String username, String password, String dashboardUrl, String toolVisibilityOptionText) {
        this.username = username;
        this.password = password;
        this.dashboardUrl = dashboardUrl;
        this.toolVisibilityOptionText = toolVisibilityOptionText;
    }
}

// Page Object for Login Page
class LoginPage {
    private WebDriver driver;
    private Logger logger = Logger.getLogger(LoginPage.class.getName());

    private By usernameField = By.id("username");
    private By passwordField = By.id("password");
    private By loginButton = By.id("loginBtn");

    public LoginPage(WebDriver driver) {
        this.driver = driver;
    }

    public void enterUsername(String username) {
        logger.info("Entering username: " + username);
        driver.findElement(usernameField).clear();
        driver.findElement(usernameField).sendKeys(username);
    }

    public void enterPassword(String password) {
        logger.info("Entering password.");
        driver.findElement(passwordField).clear();
        driver.findElement(passwordField).sendKeys(password);
    }

    public void clickLogin() {
        logger.info("Clicking login button.");
        driver.findElement(loginButton).click();
    }

    public void loginAs(String username, String password) {
        enterUsername(username);
        enterPassword(password);
        clickLogin();
    }
}

// Page Object for Course Management Dashboard Page
class CourseManagementDashboardPage {
    private WebDriver driver;
    private Logger logger = Logger.getLogger(CourseManagementDashboardPage.class.getName());

    private By dashboardHeader = By.xpath("//h1[contains(text(),'Course Management')]");
    private By toolVisibilitySettingsOption = By.xpath("//a[contains(text(),'Tool Visibility Settings') or contains(text(),'Tool Visibility')]");

    public CourseManagementDashboardPage(WebDriver driver) {
        this.driver = driver;
    }

    public boolean isDashboardDisplayed() {
        logger.info("Checking if Course Management dashboard is displayed.");
        try {
            return driver.findElement(dashboardHeader).isDisplayed();
        } catch (NoSuchElementException e) {
            logger.warning("Dashboard header not found.");
            return false;
        }
    }

    public void clickToolVisibilitySettings() {
        logger.info("Clicking on Tool Visibility Settings option.");
        driver.findElement(toolVisibilitySettingsOption).click();
    }
}

// Page Object for Tool Visibility Settings Page/Modal
class ToolVisibilitySettingsPage {
    private WebDriver driver;
    private Logger logger = Logger.getLogger(ToolVisibilitySettingsPage.class.getName());

    private By toolVisibilityHeader = By.xpath("//h2[contains(text(),'Tool Visibility Settings') or contains(text(),'Tool Visibility')]");

    public ToolVisibilitySettingsPage(WebDriver driver) {
        this.driver = driver;
    }

    public boolean isToolVisibilitySettingsDisplayed() {
        logger.info("Checking if Tool Visibility Settings page/modal is displayed.");
        try {
            return driver.findElement(toolVisibilityHeader).isDisplayed();
        } catch (NoSuchElementException e) {
            logger.warning("Tool Visibility Settings header not found.");
            return false;
        }
    }
}

// TestNG Test Class
public class AdminToolVisibilitySettingsTest {
    private WebDriver driver;
    private WebDriverWait wait;
    private Logger logger = Logger.getLogger(AdminToolVisibilitySettingsTest.class.getName());

    // Diverse Test Data Set
    // Includes positive, negative, and edge cases
    private Object[][] testData = new Object[][] {
        // Positive scenario: valid admin credentials, correct dashboard URL, expected option text
        { new AdminDashboardTestData("adminUser", "adminPass123", "https://example.com/admin/dashboard", "Tool Visibility Settings") },
        // Negative scenario: invalid admin credentials
        { new AdminDashboardTestData("wrongUser", "wrongPass", "https://example.com/admin/dashboard", "Tool Visibility Settings") },
        // Edge case: valid credentials, dashboard URL missing 'https'
        { new AdminDashboardTestData("adminUser", "adminPass123", "http://example.com/admin/dashboard", "Tool Visibility Settings") },
        // Edge case: valid credentials, alternate option text
        { new AdminDashboardTestData("adminUser", "adminPass123", "https://example.com/admin/dashboard", "Tool Visibility") }
    };

    @BeforeClass
    public void setUp() {
        // Set up ChromeDriver path as needed
        driver = new ChromeDriver();
        wait = new WebDriverWait(driver, Duration.ofSeconds(10));
        driver.manage().window().maximize();
        logger.info("WebDriver initialized and browser window maximized.");
    }

    @AfterClass
    public void tearDown() {
        if (driver != null) {
            driver.quit();
            logger.info("WebDriver closed.");
        }
    }

    @DataProvider(name = "adminDashboardDataProvider")
    public Object[][] adminDashboardDataProvider() {
        return testData;
    }

    @Test(dataProvider = "adminDashboardDataProvider")
    public void testAdminAccessesToolVisibilitySettings(AdminDashboardTestData data) {
        logger.info("Starting test with data: " + data.username + ", " + data.dashboardUrl + ", " + data.toolVisibilityOptionText);

        // Step 1: Log in as Admin (if not already logged in)
        driver.get(data.dashboardUrl);
        LoginPage loginPage = new LoginPage(driver);

        // Attempt login (for negative test, expect failure)
        loginPage.loginAs(data.username, data.password);

        // Wait for dashboard or error
        CourseManagementDashboardPage dashboardPage = new CourseManagementDashboardPage(driver);
        boolean dashboardDisplayed = false;
        try {
            wait.until(d -> dashboardPage.isDashboardDisplayed());
            dashboardDisplayed = dashboardPage.isDashboardDisplayed();
        } catch (TimeoutException e) {
            logger.warning("Dashboard not displayed after login.");
        }

        if (data.username.equals("wrongUser")) {
            Assert.assertFalse(dashboardDisplayed, "Dashboard should not be displayed for invalid credentials.");
            logger.info("Negative test: login failed as expected.");
            return;
        } else {
            Assert.assertTrue(dashboardDisplayed, "Course Management dashboard should be displayed.");
            logger.info("Dashboard displayed successfully.");
        }

        // Step 2: Locate and click on 'Tool Visibility Settings' or equivalent option
        try {
            dashboardPage.clickToolVisibilitySettings();
        } catch (NoSuchElementException e) {
            logger.warning("Tool Visibility Settings option not found.");
            Assert.fail("Tool Visibility Settings option not found.");
        }

        // Step 3: Verify Tool Visibility Settings page/modal is displayed
        ToolVisibilitySettingsPage toolVisibilityPage = new ToolVisibilitySettingsPage(driver);
        boolean toolVisibilityDisplayed = false;
        try {
            wait.until(d -> toolVisibilityPage.isToolVisibilitySettingsDisplayed());
            toolVisibilityDisplayed = toolVisibilityPage.isToolVisibilitySettingsDisplayed();
        } catch (TimeoutException e) {
            logger.warning("Tool Visibility Settings page/modal not displayed.");
        }

        Assert.assertTrue(toolVisibilityDisplayed, "Tool Visibility Settings page/modal should be displayed.");
        logger.info("Tool Visibility Settings interface displayed successfully.");
    }
}

/*
Test Data Set Details:
- Positive scenario: Valid admin credentials, correct dashboard URL, expected option text.
- Negative scenario: Invalid admin credentials.
- Edge case: Valid credentials, dashboard URL missing 'https'.
- Edge case: Valid credentials, alternate option text for the menu.

Page Object Classes:
- LoginPage: Handles login actions.
- CourseManagementDashboardPage: Handles dashboard verification and navigation to Tool Visibility Settings.
- ToolVisibilitySettingsPage: Handles verification of the Tool Visibility Settings interface.

Test Logic:
- Logs in as admin.
- Navigates to Course Management dashboard.
- Clicks Tool Visibility Settings.
- Verifies the settings interface is displayed.

Logging:
- Uses java.util.logging.Logger for debug and traceability.

Best Practices:
- Modular Page Object Model.
- Data-driven with TestNG DataProvider.
- Comprehensive assertions and error handling.
*/
```