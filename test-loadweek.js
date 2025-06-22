import { chromium } from 'playwright';

async function testLoadWeek() {
  console.log('🔍 Testing loadWeek flow...\n');
  
  const browser = await chromium.launch({ headless: false, devtools: true });
  const page = await browser.newPage();

  // Capture ALL console messages
  const logs = [];
  page.on('console', msg => {
    const text = `[${msg.type()}] ${msg.text()}`;
    logs.push(text);
    console.log(text);
  });

  try {
    await page.goto('https://dev.a4.48d1.cc');
    console.log('\n⏳ Waiting for initialization...\n');
    await page.waitForTimeout(10000);

    // Check if the expected logs appeared
    console.log('\n📋 Checking for missing logs:');
    const expectedLogs = [
      'Fetching planner record...',
      'Planner record:',
      'Fetching default template...',
      'Template fetched:',
      'Applying template structure...',
      'applyTemplateStructure called'
    ];

    expectedLogs.forEach(expected => {
      const found = logs.some(log => log.includes(expected));
      console.log(`  ${found ? '✓' : '✗'} "${expected}"`);
    });

    // Get the actual state
    const state = await page.evaluate(() => {
      const store = window.plannerStore;
      return {
        scheduleLength: store?.schedule?.length,
        firstScheduleName: store?.schedule?>[0]?.name,
        templateName: store?.currentTemplate?.name
      };
    });

    console.log('\n📊 Final State:');
    console.log(JSON.stringify(state, null, 2));

    console.log('\n🔍 Analyzing the issue...');
    
    // The issue is clear from the logs
    if (!logs.some(log => log.includes('Fetching planner record'))) {
      console.log('\n❌ PROBLEM FOUND: The loadWeek method is not executing its try block!');
      console.log('   The console.log statements inside loadWeek are not running.');
      console.log('   This suggests the method might be returning early or throwing before the try block.');
    }

    console.log('\n✨ Keeping browser open for inspection. Press Ctrl+C to exit.');
    await new Promise(() => {}); // Keep open

  } catch (error) {
    console.error('Error:', error);
    await browser.close();
  }
}

testLoadWeek().catch(console.error);