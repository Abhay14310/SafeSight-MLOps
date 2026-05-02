const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  page.on('pageerror', err => console.error('PAGE ERROR:', err.message));
  page.on('console', msg => {
    if(msg.type() === 'error') console.log('CONSOLE ERROR:', msg.text());
  });
  await page.goto('http://localhost:3010/login');
  await page.fill('input[type="email"]', 'nurse@medflow.io');
  await page.fill('input[type="password"]', 'medflow123');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);
  await browser.close();
})();
