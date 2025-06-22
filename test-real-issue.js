import { chromium } from 'playwright';

async function findRealIssue() {
  const browser = await chromium.launch({ headless: false, devtools: true });
  const page = await browser.newPage();

  page.on('console', msg => console.log(`[${msg.type()}] ${msg.text()}`));

  await page.goto('https://dev.a4.48d1.cc');
  await page.waitForTimeout(3000);

  // Get the ACTUAL deployed code
  const analysis = await page.evaluate(async () => {
    const store = window.plannerStore;
    
    // Check what loadWeek ACTUALLY does
    const originalLoadWeek = store.loadWeek.bind(store);
    let logs = [];
    
    // Override console.log temporarily
    const oldLog = console.log;
    console.log = (...args) => {
      logs.push(args.join(' '));
      oldLog(...args);
    };
    
    // Call loadWeek
    try {
      await originalLoadWeek('2025-W25', false);
    } catch (e) {
      logs.push('ERROR: ' + e.message);
    }
    
    console.log = oldLog;
    
    // Get the actual state
    return {
      logs,
      scheduleLength: store.schedule?.length,
      tasksLength: store.tasks?.length,
      currentTemplate: store.currentTemplate?.name,
      
      // Check the actual properties
      hasApplyTemplateStructure: typeof store.applyTemplateStructure === 'function',
      hasFetchTemplate: typeof store.fetchTemplate === 'function',
      
      // Try to apply template manually
      manualTest: await (async () => {
        try {
          const template = await store.fetchTemplate('default');
          store.applyTemplateStructure(template);
          return { success: true, scheduleAfter: store.schedule?.length };
        } catch (e) {
          return { success: false, error: e.message };
        }
      })()
    };
  });

  console.log('\n🔍 REAL ANALYSIS:');
  console.log(JSON.stringify(analysis, null, 2));

  // Keep browser open
  console.log('\nBrowser open for inspection. Press Ctrl+C to exit.');
  await new Promise(() => {});
}

findRealIssue().catch(console.error);