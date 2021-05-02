// node playwright/test.js


const { firefox } = require('playwright');
(async () => {
    const browser = await firefox.launch({
        headless: false
    });
    const context = await browser.newContext(Permissions = ['camera', 'microphone'], 'http://localhost:7000/');
    //context.grantPermissions('http://localhost:7000/')
    // Open new page
    const page = await context.newPage();
    // Go to http://localhost:7000/
    await page.goto('http://localhost:7000/');
    // Click button:has-text("Create")
    await page.click('button:has-text("Create")');
    // Click button:has-text("Join")
    await page.click('button:has-text("Join")');
    // ---------------------
    // Pause the page, and start recording manually.
    await page.pause();
    //await context.close();
    //await browser.close();
})();