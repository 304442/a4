import { chromium } from 'playwright';

async function debugLoadWeekIssue() {
  console.log('🔍 Debugging loadWeek issue...\n');
  
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  page.on('console', msg => {
    console.log(`[${msg.type()}] ${msg.text()}`);
  });

  try {
    await page.goto('https://dev.a4.48d1.cc');
    await page.waitForTimeout(5000);

    // Check what's happening in loadWeek
    const debugResult = await page.evaluate(async () => {
      const store = window.plannerStore;
      if (!store) return { error: 'No store' };

      // Get the loadWeek function as a string to see what code is deployed
      const loadWeekCode = store.loadWeek.toString();
      
      // Check if it has the new code
      const hasNewCode = loadWeekCode.includes('Fetching planner record');
      const hasTryBlock = loadWeekCode.includes('try {');
      
      // Try calling loadWeek manually to see what happens
      console.log('MANUAL TEST: Calling loadWeek...');
      try {
        await store.loadWeek('2025-W25', false);
      } catch (e) {
        console.log('MANUAL TEST: Error:', e.message);
      }
      
      return {
        loadWeekLength: loadWeekCode.length,
        hasNewCode,
        hasTryBlock,
        firstLines: loadWeekCode.substring(0, 500),
        scheduleAfterManual: store.schedule?.length
      };
    });

    console.log('\n📊 Debug Result:');
    console.log(JSON.stringify(debugResult, null, 2));

  } finally {
    await browser.close();
  }
}

debugLoadWeekIssue().catch(console.error);