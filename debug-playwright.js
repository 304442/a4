import { chromium } from 'playwright';

async function debugWithPlaywright() {
  console.log('🎭 Starting Playwright debug session...\n');
  
  const browser = await chromium.launch({
    headless: false,
    devtools: true,
    slowMo: 100 // Slow down operations by 100ms for visibility
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });

  const page = await context.newPage();

  // Enhanced console logging with colors
  page.on('console', msg => {
    const type = msg.type();
    const location = msg.location();
    const text = msg.text();
    
    const colors = {
      log: '\x1b[37m',    // White
      error: '\x1b[31m',  // Red
      warn: '\x1b[33m',   // Yellow
      info: '\x1b[36m',   // Cyan
      debug: '\x1b[35m'   // Magenta
    };
    
    const color = colors[type] || '\x1b[37m';
    const reset = '\x1b[0m';
    
    console.log(`${color}[${type.toUpperCase()}]${reset} ${text}`);
    if (location.url && !location.url.includes('playwright')) {
      console.log(`    at ${location.url}:${location.lineNumber}`);
    }
  });

  // Capture errors
  page.on('pageerror', error => {
    console.error('❌ Page error:', error.message);
  });

  // Track requests
  page.on('request', request => {
    if (request.url().includes('a4.48d1.cc')) {
      console.log(`📤 ${request.method()} ${request.url()}`);
    }
  });

  page.on('response', response => {
    if (response.url().includes('a4.48d1.cc') && response.status() >= 400) {
      console.error(`📥 ${response.status()} ${response.url()}`);
    }
  });

  console.log('🌐 Navigating to https://dev.a4.48d1.cc ...\n');
  
  try {
    await page.goto('https://dev.a4.48d1.cc', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    console.log('✅ Page loaded\n');

    // Wait for any async operations
    await page.waitForTimeout(3000);

    // Comprehensive app state check
    const appState = await page.evaluate(() => {
      const getNestedValue = (obj, path) => {
        try {
          return path.split('.').reduce((current, key) => current?.[key], obj);
        } catch {
          return undefined;
        }
      };

      return {
        // DOM State
        dom: {
          title: document.title,
          readyState: document.readyState,
          appDiv: {
            exists: !!document.getElementById('app'),
            innerHTML: document.getElementById('app')?.innerHTML?.substring(0, 200) + '...',
            childCount: document.getElementById('app')?.children.length || 0,
            hasContent: (document.getElementById('app')?.textContent?.trim().length || 0) > 0
          },
          bodyClasses: document.body.className,
          visibleElements: Array.from(document.querySelectorAll('*')).filter(el => {
            const style = window.getComputedStyle(el);
            return style.display !== 'none' && style.visibility !== 'hidden' && el.offsetHeight > 0;
          }).length
        },
        
        // JavaScript State
        javascript: {
          windowExists: typeof window !== 'undefined',
          pocketBaseLoaded: typeof window.PocketBase !== 'undefined',
          pocketBaseInstance: !!getNestedValue(window, 'plannerStore.pb'),
          plannerStoreExists: !!window.plannerStore,
          plannerStoreState: window.plannerStore ? {
            isInitializing: window.plannerStore.isInitializing,
            currentWeek: window.plannerStore.currentWeek,
            city: window.plannerStore.city,
            showSetupModal: window.plannerStore.showSetupModal,
            isOnline: window.plannerStore.isOnline,
            saveStatus: window.plannerStore.saveStatus
          } : null
        },
        
        // Network State
        network: {
          online: navigator.onLine,
          connection: navigator.connection?.effectiveType
        },
        
        // Storage
        storage: {
          localStorageKeys: Object.keys(localStorage),
          hasTemplateCache: Object.keys(localStorage).some(k => k.includes('template')),
          hasPlannerData: Object.keys(localStorage).some(k => k.includes('planner'))
        },
        
        // Errors
        errors: {
          setupNotification: document.querySelector('.setup-notification')?.textContent,
          errorElements: Array.from(document.querySelectorAll('[class*="error"]')).map(el => ({
            class: el.className,
            text: el.textContent.substring(0, 100)
          }))
        }
      };
    });

    console.log('📊 App State Analysis:\n');
    console.log(JSON.stringify(appState, null, 2));

    // Try to manually trigger initialization
    console.log('\n🔧 Attempting manual initialization...\n');
    
    const initResult = await page.evaluate(async () => {
      if (window.plannerStore && typeof window.plannerStore.init === 'function') {
        console.log('Found plannerStore.init, calling it...');
        try {
          await window.plannerStore.init();
          return { success: true, message: 'Init called successfully' };
        } catch (error) {
          return { success: false, error: error.message };
        }
      } else {
        return { success: false, error: 'plannerStore or init method not found' };
      }
    });
    
    console.log('Init result:', initResult);

    // Wait and check again
    await page.waitForTimeout(5000);

    // Final state check
    const finalState = await page.evaluate(() => {
      return {
        isInitializing: window.plannerStore?.isInitializing,
        appContent: document.getElementById('app')?.innerHTML?.length || 0,
        visibleText: document.body.innerText.substring(0, 500)
      };
    });
    
    console.log('\n📋 Final State:', finalState);

    // Take screenshots
    await page.screenshot({ path: 'debug-full.png', fullPage: true });
    await page.screenshot({ path: 'debug-viewport.png' });
    console.log('\n📸 Screenshots saved: debug-full.png, debug-viewport.png');

    // Create trace for detailed debugging
    await context.tracing.start({ screenshots: true, snapshots: true });
    await page.reload();
    await page.waitForTimeout(5000);
    await context.tracing.stop({ path: 'trace.zip' });
    console.log('\n🎬 Trace saved: trace.zip (view with: npx playwright show-trace trace.zip)');

    console.log('\n✨ Debug session complete. Browser window remains open.');
    console.log('Press Ctrl+C to exit.\n');

    // Keep browser open
    await new Promise(() => {});

  } catch (error) {
    console.error('❌ Error during debugging:', error);
    await browser.close();
  }
}

// Run the debug session
debugWithPlaywright().catch(console.error);