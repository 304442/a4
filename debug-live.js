import { chromium } from 'playwright';

async function debugLiveSite() {
  console.log('🎭 Starting live debug of dev.a4.48d1.cc...\n');
  
  const browser = await chromium.launch({
    headless: true, // Run headless for automation
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  // Capture console logs
  const consoleLogs = [];
  page.on('console', msg => {
    const log = `[${msg.type()}] ${msg.text()}`;
    consoleLogs.push(log);
    console.log(log);
  });

  // Capture errors
  page.on('pageerror', error => {
    console.error('❌ Page error:', error.message);
  });

  try {
    console.log('🌐 Navigating to https://dev.a4.48d1.cc ...\n');
    await page.goto('https://dev.a4.48d1.cc', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    console.log('✅ Page loaded, waiting for app initialization...\n');
    await page.waitForTimeout(5000);

    // Get the current state
    const pageState = await page.evaluate(() => {
      const getText = (selector) => {
        const el = document.querySelector(selector);
        return el ? el.textContent.trim() : null;
      };

      const getTableRows = (selector) => {
        const rows = document.querySelectorAll(selector);
        return Array.from(rows).length;
      };

      return {
        // Check if app rendered
        appExists: !!document.getElementById('app'),
        appChildCount: document.getElementById('app')?.children.length || 0,
        
        // Get visible content
        pageTitle: document.title,
        plannerTitle: getText('h1'),
        currentWeek: getText('.viewport-container span'),
        
        // Check debug overlay
        debugOverlay: getText('div[style*="position: fixed"]'),
        
        // Count data rows
        scheduleRows: getTableRows('.schedule-table tbody tr'),
        taskRows: getTableRows('table tbody tr'),
        
        // Get plannerStore state if available
        storeState: window.plannerStore ? {
          isInitializing: window.plannerStore.isInitializing,
          currentWeek: window.plannerStore.currentWeek,
          scheduleLength: window.plannerStore.schedule?.length,
          tasksLength: window.plannerStore.tasks?.length,
          city: window.plannerStore.city,
          showSetupModal: window.plannerStore.showSetupModal,
          
          // Check first schedule item
          firstSchedule: window.plannerStore.schedule?.[0] ? {
            name: window.plannerStore.schedule[0].name,
            activitiesCount: window.plannerStore.schedule[0].activities?.length
          } : null,
          
          // Check if template was applied
          currentTemplate: window.plannerStore.currentTemplate ? {
            id: window.plannerStore.currentTemplate.id,
            name: window.plannerStore.currentTemplate.name,
            hasStructure: !!window.plannerStore.currentTemplate.structure
          } : null
        } : null,
        
        // Get any error messages
        errorNotifications: Array.from(document.querySelectorAll('.error, .notification')).map(el => el.textContent)
      };
    });

    console.log('\n📊 Page State Analysis:\n');
    console.log(JSON.stringify(pageState, null, 2));

    // Try to debug why schedule is empty
    if (pageState.storeState && pageState.storeState.scheduleLength === 0) {
      console.log('\n🔍 Debugging empty schedule...\n');
      
      const debugInfo = await page.evaluate(async () => {
        if (!window.plannerStore) return { error: 'No plannerStore found' };
        
        const store = window.plannerStore;
        
        // Try to manually fetch template
        try {
          const template = await store.fetchTemplate('default');
          return {
            templateFetched: !!template,
            templateId: template?.id,
            templateName: template?.name,
            templateStructure: template?.structure ? {
              type: typeof template.structure,
              isString: typeof template.structure === 'string',
              hasSchedule: Array.isArray(template.structure?.schedule),
              scheduleLength: template.structure?.schedule?.length,
              firstSection: template.structure?.schedule?.[0]?.name
            } : null,
            
            // Try applying template manually
            manualApply: (() => {
              if (template) {
                store.applyTemplateStructure(template);
                return {
                  scheduleAfterApply: store.schedule?.length,
                  firstSectionAfterApply: store.schedule?.[0]?.name
                };
              }
              return null;
            })()
          };
        } catch (error) {
          return { error: error.message };
        }
      });
      
      console.log('Debug info:', JSON.stringify(debugInfo, null, 2));
    }

    // Take screenshot
    await page.screenshot({ path: 'debug-live-screenshot.png', fullPage: true });
    console.log('\n📸 Screenshot saved: debug-live-screenshot.png');

    // Get console logs summary
    console.log('\n📋 Console Log Summary:');
    console.log(`Total logs: ${consoleLogs.length}`);
    const errorLogs = consoleLogs.filter(log => log.includes('[error]'));
    if (errorLogs.length > 0) {
      console.log(`\nErrors found (${errorLogs.length}):`);
      errorLogs.forEach(log => console.log(log));
    }

  } catch (error) {
    console.error('❌ Error during debugging:', error);
  } finally {
    await browser.close();
    console.log('\n✨ Debug session complete.');
  }
}

// Run the debug
debugLiveSite().catch(console.error);