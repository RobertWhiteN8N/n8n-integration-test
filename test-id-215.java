```java
// Automation Script for Test Case: Admin selects and saves default tool visibility for courses
// Test Steps:
// 1. View the list of available course tools within 'Tool Visibility Settings'.
// 2. Select or deselect tools as desired by toggling their respective controls.
// 3. Click the 'Save' (or 'Apply') button to store the new visibility settings.
// 4. Verify confirmation message appears indicating settings have been saved successfully.
// Preconditions: Admin user is logged in and has accessed the 'Tool Visibility Settings' section from the course management dashboard.
// Post-Conditions: New visibility configuration is saved and active for future courses.

package com.example.tests;

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
import java.time.Duration;
import java.util.*;
import java.util.logging.Logger;

// Page Object: ToolVisibilitySettingsPage
class ToolVisibilitySettingsPage {
    WebDriver driver;
    Logger logger = Logger.getLogger(ToolVisibilitySettingsPage.class.getName());

    @FindBy(css = ".tool-list .tool-item")
    List<WebElement> toolItems;

    @FindBy(css = ".tool-list .tool-item label")
    List<WebElement> toolLabels;

    @FindBy(css = ".tool-list .tool-item input[type='checkbox']")
    List<WebElement> toolToggles;

    @FindBy(css = "button.save-settings, button.apply-settings")
    WebElement saveButton;

    @FindBy(css = ".alert-success, .confirmation-message")
    WebElement confirmationMessage;

    public ToolVisibilitySettingsPage(WebDriver driver) {
        this.driver = driver;
        PageFactory.initElements(driver, this);
    }

    // Step 1: View the list of available course tools
    public List<String> getAvailableTools() {
        logger.info("Fetching list of available tools...");
        List<String> toolNames = new ArrayList<>();
        for (WebElement label : toolLabels) {
            toolNames.add(label.getText().trim());
        }
        logger.info("Available tools: " + toolNames);
        return toolNames;
    }

    // Step 2: Set tool visibility according to the desired configuration
    public void setToolVisibility(Map<String, Boolean> toolVisibilityMap) {
        logger.info("Setting tool visibility as per test data...");
        for (int i = 0; i < toolLabels.size(); i++) {
            String toolName = toolLabels.get(i).getText().trim();
            if (toolVisibilityMap.containsKey(toolName)) {
                boolean shouldBeVisible = toolVisibilityMap.get(toolName);
                WebElement toggle = toolToggles.get(i);
                boolean isChecked = toggle.isSelected();
                if (shouldBeVisible != isChecked) {
                    logger.info("Toggling tool: " + toolName + " to " + (shouldBeVisible ? "checked" : "unchecked"));
                    toggle.click();
                }
            }
        }
    }

    // Step 3: Click the 'Save' or 'Apply' button
    public void clickSave() {
        logger.info("Clicking the Save/Apply button...");
        saveButton.click();
    }

    // Step 4: Wait for and return the confirmation message
    public String getConfirmationMessage() {
        logger.info("Waiting for confirmation message...");
        WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(10));
        wait.until(ExpectedConditions.visibilityOf(confirmationMessage));
        String msg = confirmationMessage.getText().trim();
        logger.info("Confirmation message received: " + msg);
        return msg;
    }

    // Utility: Get current tool visibility states
    public Map<String, Boolean> getCurrentToolVisibility() {
        Map<String, Boolean> visibility = new HashMap<>();
        for (int i = 0; i < toolLabels.size(); i++) {
            String toolName = toolLabels.get(i).getText().trim();
            boolean isChecked = toolToggles.get(i).isSelected();
            visibility.put(toolName, isChecked);
        }
        logger.info("Current tool visibility: " + visibility);
        return visibility;
    }
}

// Test Data Object: ToolVisibilityTestData
class ToolVisibilityTestData {
    public String testName;
    public Map<String, Boolean> toolVisibilityMap;
    public String expectedConfirmation;
    public boolean expectSuccess;

    public ToolVisibilityTestData(String testName, Map<String, Boolean> toolVisibilityMap, String expectedConfirmation, boolean expectSuccess) {
        this.testName = testName;
        this.toolVisibilityMap = toolVisibilityMap;
        this.expectedConfirmation = expectedConfirmation;
        this.expectSuccess = expectSuccess;
    }
}

// TestNG Test Class
public class ToolVisibilitySettingsTest {
    WebDriver driver;
    Logger logger = Logger.getLogger(ToolVisibilitySettingsTest.class.getName());
    ToolVisibilitySettingsPage toolVisibilityPage;

    // Test Data Set: Diverse scenarios (positive, negative, edge cases)
    // For maintainability, this can be loaded from an external source (e.g., JSON, Excel), but here it's hardcoded.
    @DataProvider(name = "toolVisibilityData")
    public Object[][] toolVisibilityData() {
        // Example tool names (should match actual UI)
        List<String> allTools = Arrays.asList("Assignments", "Discussions", "Quizzes", "Grades", "Files");

        // Positive: Enable all tools
        Map<String, Boolean> allEnabled = new HashMap<>();
        for (String tool : allTools) allEnabled.put(tool, true);

        // Positive: Disable all tools
        Map<String, Boolean> allDisabled = new HashMap<>();
        for (String tool : allTools) allDisabled.put(tool, false);

        // Edge: Enable only one tool
        Map<String, Boolean> onlyAssignments = new HashMap<>();
        for (String tool : allTools) onlyAssignments.put(tool, false);
        onlyAssignments.put("Assignments", true);

        // Negative: Provide a non-existent tool (should be ignored)
        Map<String, Boolean> invalidTool = new HashMap<>();
        for (String tool : allTools) invalidTool.put(tool, true);
        invalidTool.put("NonExistentTool", true);

        // Edge: No changes (current state remains)
        Map<String, Boolean> noChange = null; // Will be handled in test

        return new Object[][]{
            {new ToolVisibilityTestData("Enable all tools", allEnabled, "Settings saved successfully", true)},
            {new ToolVisibilityTestData("Disable all tools", allDisabled, "Settings saved successfully", true)},
            {new ToolVisibilityTestData("Enable only Assignments", onlyAssignments, "Settings saved successfully", true)},
            {new ToolVisibilityTestData("Invalid tool in map", invalidTool, "Settings saved successfully", true)},
            {new ToolVisibilityTestData("No changes made", noChange, "Settings saved successfully", true)}
        };
    }

    @BeforeClass
    public void setUp(ITestContext context) {
        // Set up WebDriver (assume ChromeDriver is in PATH)
        driver = new ChromeDriver();
        driver.manage().timeouts().implicitlyWait(Duration.ofSeconds(10));
        // Precondition: Admin is already logged in and navigated to Tool Visibility Settings
        // This can be handled via direct navigation or session cookie injection in a real test
        driver.get("https://example.com/admin/course-management/tool-visibility");
        toolVisibilityPage = new ToolVisibilitySettingsPage(driver);
        logger.info("Test setup complete. Navigated to Tool Visibility Settings page.");
    }

    @AfterClass
    public void tearDown() {
        if (driver != null) {
            driver.quit();
            logger.info("WebDriver closed.");
        }
    }

    @Test(dataProvider = "toolVisibilityData")
    public void testToolVisibilitySettings(ToolVisibilityTestData testData) {
        logger.info("Running test: " + testData.testName);

        // Step 1: View list of tools
        List<String> availableTools = toolVisibilityPage.getAvailableTools();
        Assert.assertTrue(availableTools.size() > 0, "No tools found in Tool Visibility Settings.");

        // Step 2: Select/deselect tools as per test data
        if (testData.toolVisibilityMap != null) {
            toolVisibilityPage.setToolVisibility(testData.toolVisibilityMap);
            // Verify toggles updated
            Map<String, Boolean> currentVisibility = toolVisibilityPage.getCurrentToolVisibility();
            for (Map.Entry<String, Boolean> entry : testData.toolVisibilityMap.entrySet()) {
                if (availableTools.contains(entry.getKey())) {
                    Assert.assertEquals(currentVisibility.get(entry.getKey()), entry.getValue(),
                            "Visibility state mismatch for tool: " + entry.getKey());
                }
            }
        } else {
            logger.info("No changes to tool visibility for this test case.");
        }

        // Step 3: Click Save/Apply
        toolVisibilityPage.clickSave();

        // Step 4: Verify confirmation message
        String confirmation = toolVisibilityPage.getConfirmationMessage();
        Assert.assertTrue(confirmation.contains(testData.expectedConfirmation),
                "Expected confirmation message not found. Actual: " + confirmation);

        logger.info("Test '" + testData.testName + "' completed successfully.");
    }
}

/*
Test Data Set (as Java object):

// Example tool names: "Assignments", "Discussions", "Quizzes", "Grades", "Files"
// Diverse scenarios:
// 1. Enable all tools
// 2. Disable all tools
// 3. Enable only Assignments
// 4. Invalid tool in map (should be ignored)
// 5. No changes made

Object[][] toolVisibilityData = {
    {new ToolVisibilityTestData("Enable all tools", allEnabled, "Settings saved successfully", true)},
    {new ToolVisibilityTestData("Disable all tools", allDisabled, "Settings saved successfully", true)},
    {new ToolVisibilityTestData("Enable only Assignments", onlyAssignments, "Settings saved successfully", true)},
    {new ToolVisibilityTestData("Invalid tool in map", invalidTool, "Settings saved successfully", true)},
    {new ToolVisibilityTestData("No changes made", noChange, "Settings saved successfully", true)}
};

*/

// End of Automation Script
```