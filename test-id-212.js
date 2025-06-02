```javascript
// ===================================================================
// Test Title: Edit user name, role, and access level and verify update
// Preconditions:
//   - Admin user is on 'User Management' page.
//   - User 'Pam Beesly' exists with Role 'Viewer' and Access Level 'Read Only'.
// Steps:
//   1. Select 'Pam Beesly' from the user list and click 'Edit'.
//      ⇒ Expect: 'Edit User' form with current details is displayed.
//   2. Change Name to 'Pam Halpert', Role to 'Editor', and Access Level to 'Read/Write'.
//      ⇒ Expect: Fields are updated with new values.
//   3. Click 'Save' to submit changes.
//      ⇒ Expect: Success message. User details updated in user list.
//   4. Query user database for Pam's user ID.
//      ⇒ Expect: Database reflects updated Name, Role, and Access Level.
// Post-Conditions:
//   - User profile for Pam reflects the updated fields in the UI and database.
// ===================================================================

// ===================================================================
// Imports
// ===================================================================
const { test, expect } = require('@playwright/test')

// ===================================================================
// Page Object: UserManagementPage
// ===================================================================
class UserManagementPage {
    /**
     * @param {import('@playwright/test').Page} page 
     */
    constructor(page) {
        this.page = page
        this.userTable = page.locator('table#user-list')
        this.userRows = page.locator('table#user-list tbody tr')
        this.editButton = userName => page.locator(`tr:has-text("${userName}") button.edit-btn`)
    }
    async selectUserAndEdit(userName) {
        console.log(`[INFO] Selecting user '${userName}' and clicking 'Edit'`)
        const row = this.page.locator(`tr:has-text("${userName}")`)
        await expect(row).toBeVisible()
        await this.editButton(userName).click()
    }
    async isUserInList(userName, role, accessLevel) {
        const row = this.page.locator(
            `tr:has-text("${userName}") >> td:has-text("${role}") >> td:has-text("${accessLevel}")`
        )
        return await row.isVisible()
    }
    async getRowTextByUser(userName) {
        const row = this.page.locator(`tr:has-text("${userName}")`)
        return await row.textContent()
    }
}

// ===================================================================
// Page Object: EditUserFormPage
// ===================================================================
class EditUserFormPage {
    /**
     * @param {import('@playwright/test').Page} page 
     */
    constructor(page) {
        this.page = page
        this.form = page.locator('form#edit-user')
        this.nameInput = page.locator('input[name="name"]')
        this.roleSelect = page.locator('select[name="role"]')
        this.accessLevelSelect = page.locator('select[name="accessLevel"]')
        this.saveBtn = page.locator('button[type=submit]')
        this.cancelBtn = page.locator('button.cancel')
        this.successMsg = page.locator('.alert-success:has-text("success")')
    }
    async verifyInitialValues(expected) {
        console.log(`[INFO] Verifying initial 'Edit User' form values`)
        await expect(this.nameInput).toHaveValue(expected.name)
        await expect(this.roleSelect).toHaveValue(expected.role)
        await expect(this.accessLevelSelect).toHaveValue(expected.accessLevel)
    }
    async fillEditUserFields(updated) {
        console.log(`[INFO] Updating values in 'Edit User' form`)
        await this.nameInput.fill(updated.name)
        await this.roleSelect.selectOption(updated.role)
        await this.accessLevelSelect.selectOption(updated.accessLevel)
    }
    async saveChanges() {
        console.log("[INFO] Clicking 'Save' button")
        await this.saveBtn.click()
    }
    async waitForSuccessMessage() {
        console.log('[INFO] Waiting for success message to appear')
        await expect(this.successMsg).toBeVisible()
    }
}

// ===================================================================
// Utility: Mock database query/API
// For illustration only; assumes a real API would be available
// ===================================================================
async function queryUserById(userId) {
    // Example: Replace with actual DB/API integration
    console.log(`[MOCK] Querying database for user ID: ${userId}`)
    // Simulated database lookup
    const fakeDb = [
        {
            userId: 12,
            name: 'Pam Halpert',
            role: 'Editor',
            accessLevel: 'Read/Write'
        },
        {
            userId: 13,
            name: 'Jim Halpert',
            role: 'Admin',
            accessLevel: 'Full'
        }
    ]
    return fakeDb.find(u => u.userId === userId)
}

// ===================================================================
// Test Data
// Diverse scenario coverage: positive, negative, edge
// ===================================================================
const testData = [
    {
        description: 'Positive - Normal edit (valid data)',
        initial: { name: 'Pam Beesly', role: 'Viewer', accessLevel: 'Read Only', userId: 12 },
        updated: { name: 'Pam Halpert', role: 'Editor', accessLevel: 'Read/Write' },
        expectedDb: { name: 'Pam Halpert', role: 'Editor', accessLevel: 'Read/Write' },
        expectSuccess: true
    },
    {
        description: 'Negative - Name field empty',
        initial: { name: 'Pam Beesly', role: 'Viewer', accessLevel: 'Read Only', userId: 12 },
        updated: { name: '', role: 'Editor', accessLevel: 'Read/Write' },
        expectedDb: null, // No update expected
        expectSuccess: false
    },
    {
        description: 'Negative - Invalid role',
        initial: { name: 'Pam Beesly', role: 'Viewer', accessLevel: 'Read Only', userId: 12 },
        updated: { name: 'Pam Halpert', role: 'InvalidRole', accessLevel: 'Read/Write' },
        expectedDb: null, // No update expected
        expectSuccess: false
    },
    {
        description: 'Edge - Name with maximum length (50 chars)',
        initial: { name: 'Pam Beesly', role: 'Viewer', accessLevel: 'Read Only', userId: 12 },
        updated: { name: 'X'.repeat(50), role: 'Editor', accessLevel: 'Read/Write' },
        expectedDb: { name: 'X'.repeat(50), role: 'Editor', accessLevel: 'Read/Write' },
        expectSuccess: true
    },
    {
        description: 'Edge - Extremely long name (over 256 chars)',
        initial: { name: 'Pam Beesly', role: 'Viewer', accessLevel: 'Read Only', userId: 12 },
        updated: { name: 'Y'.repeat(257), role: 'Editor', accessLevel: 'Read/Write' },
        expectedDb: null, // No update expected, validation should fail
        expectSuccess: false
    }
]

// ===================================================================
// Playwright Test: Data-driven execution with comprehensive logs
// ===================================================================
test.describe('User Management - Edit User Profile Automation', () => {
    testData.forEach(data => {
        test.only(data.description, async ({ page }) => {
            console.log(`========== TEST: ${data.description} ==========`)
            // Pre-Step: Go to User Management page
            await page.goto('https://your-app-url.com/admin/user-management')
            const userMgmt = new UserManagementPage(page)
            const editForm = new EditUserFormPage(page)
            // Step 1: Select user and click 'Edit'
            await userMgmt.selectUserAndEdit(data.initial.name)
            // Step 1 Expected: Edit form loads with correct details
            await editForm.verifyInitialValues(data.initial)
            // Step 2: Update fields
            await editForm.fillEditUserFields(data.updated)
            // Step 2 Expected: Fields show new values (verified by fill + next events)
            // Step 3: Save changes
            await editForm.saveChanges()
            // Step 3 Expected: Success message? Or error if invalid
            if (data.expectSuccess) {
                await editForm.waitForSuccessMessage()
                // Step 3.1: Check UI updates in user list
                const isPresent = await userMgmt.isUserInList(
                    data.updated.name,
                    data.updated.role,
                    data.updated.accessLevel
                )
                expect(isPresent).toBeTruthy()
            } else {
                // Expect error/toast message (assume .alert-danger present)
                const errorMsg = page.locator('.alert-danger')
                await expect(errorMsg).toBeVisible()
            }
            // Step 4: Verify via DB or API, if positive
            if (data.expectSuccess && data.expectedDb) {
                const user = await queryUserById(data.initial.userId)
                expect(user).toMatchObject(data.expectedDb)
                console.log(
                    `[INFO] DB check PASSED: userId=${data.initial.userId} == ${JSON.stringify(data.expectedDb)}`
                )
            } else if (!data.expectSuccess) {
                // DB should not reflect change
                const user = await queryUserById(data.initial.userId)
                expect(user && user.name).not.toBe(data.updated.name)
                console.log('[INFO] DB check (negative) PASSED: No change applied')
            }
        })
    })
})

// ===================================================================
// End of script
// - Use 'npx playwright test' to run this file
// - Update selectors & URLs as per AUT
// ===================================================================
```