import { chromium } from 'playwright';

async function debugInitFlow() {
  console.log('🔍 Debugging initialization flow...\n');
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Override console.log to capture everything
  await page.evaluateOnNewDocument(() => {
    const originalLog = console.log;
    const logs = [];
    console.log = (...args) => {
      logs.push(args.join(' '));
      originalLog(...args);
    };
    window.getAllLogs = () => logs;
  });

  page.on('console', msg => {
    if (msg.text().includes('loadWeek') || msg.text().includes('template') || msg.text().includes('Template')) {
      console.log(`[${msg.type()}] ${msg.text()}`);
    }
  });

  try {
    await page.goto('https://dev.a4.48d1.cc', { waitUntil: 'networkidle' });
    await page.waitForTimeout(5000);

    // Get all logs
    const allLogs = await page.evaluate(() => window.getAllLogs());
    
    console.log('\n📋 All logs related to loadWeek flow:');
    allLogs.filter(log => 
      log.includes('loadWeek') || 
      log.includes('template') || 
      log.includes('Template') ||
      log.includes('Fetching') ||
      log.includes('Applying') ||
      log.includes('Error')
    ).forEach(log => console.log(`  ${log}`));

    // Check what happened in loadWeek
    const debugInfo = await page.evaluate(() => {
      const store = window.plannerStore;
      return {
        hasStore: !!store,
        currentTemplate: store?.currentTemplate?.name || 'none',
        scheduleLength: store?.schedule?.length || 0,
        isInitializing: store?.isInitializing,
        
        // Get the actual loadWeek function code
        loadWeekCode: store?.loadWeek?.toString().substring(0, 200) + '...',
        
        // Check if console.log works
        consoleTest: (() => {
          console.log('TEST: Console.log works');
          return 'tested';
        })()
      };
    });

    console.log('\n📊 Debug Info:');
    console.log(JSON.stringify(debugInfo, null, 2));

    // Try to see the actual error
    const errorCheck = await page.evaluate(async () => {
      try {
        const store = window.plannerStore;
        console.log('ERROR CHECK: Starting');
        await store.loadWeek(store.currentWeek, false);
        console.log('ERROR CHECK: Completed');
        return { success: true, scheduleAfter: store.schedule?.length };
      } catch (error) {
        console.log('ERROR CHECK: Failed', error.message);
        return { success: false, error: error.message, stack: error.stack };
      }
    });

    console.log('\n🔍 Error Check Result:');
    console.log(JSON.stringify(errorCheck, null, 2));

  } finally {
    await browser.close();
  }
}

debugInitFlow().catch(console.error);