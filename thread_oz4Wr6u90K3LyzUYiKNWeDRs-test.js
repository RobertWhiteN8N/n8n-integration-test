To create a web automation test script for the given test case "Students Receive Notifications on New Posts," we will follow a structured approach using a common automation framework like Selenium with Python. Below is an example of how you might structure this test case for automation:

### Prerequisites:
- Selenium WebDriver installed
- Python environment set up with necessary dependencies
- Access to the web application with appropriate credentials
- Web application locators identified for posting content, notifications, etc.

### Web Automation Test Script Example:

```python
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time

# Initialize WebDriver
driver = webdriver.Chrome()

try:
    # Step 1: Navigate to the application
    driver.get('http://yourwebapp.com')
    
    # Log into the application (assuming a login function exists)
    def login(username, password):
        driver.find_element(By.ID, 'username').send_keys(username)
        driver.find_element(By.ID, 'password').send_keys(password)
        driver.find_element(By.ID, 'loginButton').click()
    
    login('teacher', 'securepassword')
    
    # Step 1: Post new content or assessments
    def post_new_content():
        # Locate and click on 'New Post' button
        driver.find_element(By.ID, 'newPostButton').click()
        # Input content details
        driver.find_element(By.ID, 'postContent').send_keys('New Assessment: Math Test')
        driver.find_element(By.ID, 'submitPostButton').click()
        
    post_new_content()
    
    # Verify content is posted
    WebDriverWait(driver, 10).until(
        EC.presence_of_element_located((By.XPATH, "//div[contains(text(), 'New Assessment: Math Test')]"))
    )
    
    # Step 2: Verify notifications for students
    def verify_notifications():
        # Switch to student view (depends on app functionality)
        driver.get('http://yourwebapp.com/studentNotifications')
        
        # Wait and verify that a notification is present
        notification_text = 'New Assessment: Math Test'
        element_present = EC.presence_of_element_located((By.XPATH, f"//div[contains(text(), '{notification_text}')]"))
        WebDriverWait(driver, 10).until(element_present)
    
    verify_notifications()

finally:
    # Step 3: Cleanup and close browser
    time.sleep(1)  # Optional wait for observation
    driver.quit()
```

### Explanation:
- **Setup and Initialization**: Begin by setting up the Selenium WebDriver and logging in as either teacher or admin who can post new content.
- **Step 1**: Use UI interactions to post new content. Confirm it is posted by checking the appropriate UI element.
- **Step 2**: Verify if the notifications are working by checking the student notification area using a student account or by navigating to the notifications section.
- **Cleanup**: Ensure the browser is closed after the test to free resources.

### Notes:
- **Locators**: Ensure the IDs and XPaths used in the script match the actual IDs and XPaths in your application. Update these as needed.
- **Error Handling**: Consider adding more sophisticated error handling, logging, and reporting for robustness in real-world scenarios.

This script is a basic starting point. Depending on your project's complexity and the testing framework you use, you may need additional setup regarding data initialization and teardown.