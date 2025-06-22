import { chromium } from 'playwright';

async function verifyFixes() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  await page.goto('https://dev.a4.48d1.cc');
  await page.waitForTimeout(3000);
  
  // Check what version is deployed
  const deployedVersion = await page.evaluate(() => {
    const logs = [];
    // Override console temporarily
    const old = console.log;
    console.log = (...args) => logs.push(args.join(' '));
    
    // Try to trigger loadWeek
    if (window.plannerStore) {
      window.plannerStore.loadWeek('2025-W26', false);
    }
    
    console.log = old;
    
    // Check for version markers
    const hasV4 = logs.some(log => log.includes('v4 FIXED'));
    const hasV3 = logs.some(log => log.includes('v3:'));
    const hasV2 = logs.some(log => log.includes('v2:'));
    
    // Check table structure
    const headers = Array.from(document.querySelectorAll('table:first-of-type thead th')).map(th => th.textContent);
    const hasMaxColumns = headers.includes('MAX');
    
    // Check first row
    const firstRow = document.querySelector('table tbody tr');
    const firstSectionName = firstRow?.querySelector('td')?.textContent;
    
    return {
      version: hasV4 ? 'v4' : hasV3 ? 'v3' : hasV2 ? 'v2' : 'old',
      hasMaxColumns,
      headers: headers.slice(0, 10),
      firstSection: firstSectionName,
      logs: logs.slice(0, 3)
    };
  });
  
  console.log('Deployed version:', deployedVersion);
  await browser.close();
}

verifyFixes().catch(console.error);