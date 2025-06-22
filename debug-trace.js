import { chromium } from 'playwright';

async function traceTemplateProblem() {
  console.log('🔍 Tracing template loading issue...\n');
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Capture ALL console logs
  page.on('console', msg => {
    console.log(`[${msg.type()}] ${msg.text()}`);
  });

  try {
    await page.goto('https://dev.a4.48d1.cc', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);

    // Inject debugging directly into the page
    const result = await page.evaluate(async () => {
      const store = window.plannerStore;
      if (!store) return { error: 'No store found' };

      const logs = [];
      const log = (msg) => logs.push(msg);

      log('Starting trace...');
      log(`Current schedule length: ${store.schedule?.length}`);
      log(`Current template: ${store.currentTemplate?.name || 'none'}`);

      // Check the fetchTemplate method
      try {
        log('Fetching default template...');
        const template = await store.fetchTemplate('default');
        log(`Template fetched: ${template?.name}, id: ${template?.id}`);
        log(`Template structure type: ${typeof template?.structure}`);
        
        // Check if structure needs parsing
        if (typeof template?.structure === 'string') {
          log('Structure is a string, needs parsing');
          const parsed = JSON.parse(template.structure);
          log(`Parsed structure has schedule: ${!!parsed.schedule}`);
          log(`Schedule length after parse: ${parsed.schedule?.length}`);
        } else {
          log(`Structure is already object, has schedule: ${!!template?.structure?.schedule}`);
          log(`Schedule length: ${template?.structure?.schedule?.length}`);
        }

        // Try manually applying
        log('Manually applying template...');
        store.applyTemplateStructure(template);
        log(`Schedule length after apply: ${store.schedule?.length}`);
        
        // Check first schedule item
        if (store.schedule?.[0]) {
          log(`First schedule section: ${store.schedule[0].name}`);
          log(`First section activities: ${store.schedule[0].activities?.length}`);
        }

      } catch (error) {
        log(`Error: ${error.message}`);
      }

      return { logs, finalScheduleLength: store.schedule?.length };
    });

    console.log('\n📋 Trace Results:');
    result.logs.forEach(log => console.log(`  ${log}`));
    console.log(`\nFinal schedule length: ${result.finalScheduleLength}`);

    // Check the current page content
    const visibleContent = await page.evaluate(() => {
      const scheduleRows = document.querySelectorAll('.schedule-table tbody tr').length;
      const taskRows = document.querySelectorAll('table:nth-of-type(2) tbody tr').length;
      return { scheduleRows, taskRows };
    });

    console.log('\n📊 Visible Content:');
    console.log(`  Schedule rows: ${visibleContent.scheduleRows}`);
    console.log(`  Task rows: ${visibleContent.taskRows}`);

  } finally {
    await browser.close();
  }
}

traceTemplateProblem().catch(console.error);