const puppeteer = require('puppeteer');

async function debugSite() {
  console.log('Starting Puppeteer debug session...');
  
  const browser = await puppeteer.launch({
    headless: false, // Show browser window
    devtools: true,  // Open DevTools automatically
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  
  // Enable console log capture
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    console.log(`[${type.toUpperCase()}] ${text}`);
  });

  // Capture errors
  page.on('error', err => {
    console.error('Page error:', err);
  });

  page.on('pageerror', err => {
    console.error('Page error:', err);
  });

  // Capture failed requests
  page.on('requestfailed', request => {
    console.error('Request failed:', request.url(), request.failure().errorText);
  });

  console.log('Navigating to https://dev.a4.48d1.cc ...');
  
  try {
    await page.goto('https://dev.a4.48d1.cc', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    console.log('Page loaded, waiting for content...');
    
    // Wait a bit for any async operations
    await page.waitForTimeout(5000);

    // Get page title
    const title = await page.title();
    console.log('Page title:', title);

    // Check if app div exists and has content
    const appContent = await page.evaluate(() => {
      const app = document.getElementById('app');
      return {
        exists: !!app,
        innerHTML: app ? app.innerHTML : null,
        childCount: app ? app.children.length : 0,
        textContent: app ? app.textContent : null
      };
    });
    
    console.log('App div status:', appContent);

    // Check for Svelte app initialization
    const svelteStatus = await page.evaluate(() => {
      return {
        hasWindow: typeof window !== 'undefined',
        hasPocketBase: typeof window.PocketBase !== 'undefined',
        hasPlannerStore: typeof window.plannerStore !== 'undefined',
        documentReady: document.readyState
      };
    });
    
    console.log('Svelte app status:', svelteStatus);

    // Get all localStorage data
    const localStorage = await page.evaluate(() => {
      const items = {};
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        try {
          items[key] = JSON.parse(window.localStorage.getItem(key));
        } catch {
          items[key] = window.localStorage.getItem(key);
        }
      }
      return items;
    });
    
    console.log('LocalStorage contents:', JSON.stringify(localStorage, null, 2));

    // Check for any visible error messages
    const errorMessages = await page.evaluate(() => {
      const errors = [];
      // Check for setup notification
      const setupNotif = document.querySelector('.setup-notification');
      if (setupNotif) errors.push('Setup notification: ' + setupNotif.textContent);
      
      // Check for any error classes
      const errorElems = document.querySelectorAll('.error, .error-message, [class*="error"]');
      errorElems.forEach(elem => {
        if (elem.textContent.trim()) {
          errors.push(elem.textContent.trim());
        }
      });
      
      return errors;
    });
    
    if (errorMessages.length > 0) {
      console.log('Error messages found:', errorMessages);
    }

    // Get computed styles of app div
    const appStyles = await page.evaluate(() => {
      const app = document.getElementById('app');
      if (!app) return null;
      const styles = window.getComputedStyle(app);
      return {
        display: styles.display,
        visibility: styles.visibility,
        opacity: styles.opacity,
        width: styles.width,
        height: styles.height
      };
    });
    
    console.log('App div styles:', appStyles);

    // Check network requests
    const requests = [];
    page.on('request', request => {
      requests.push({
        url: request.url(),
        method: request.method(),
        resourceType: request.resourceType()
      });
    });

    // Reload to capture all network requests
    console.log('Reloading page to capture network requests...');
    await page.reload({ waitUntil: 'networkidle2' });
    
    console.log('Network requests:', requests);

    // Take a screenshot
    await page.screenshot({ path: 'debug-screenshot.png', fullPage: true });
    console.log('Screenshot saved as debug-screenshot.png');

    // Keep browser open for manual inspection
    console.log('\nBrowser window is open for manual inspection.');
    console.log('Press Ctrl+C to close and exit.');
    
    // Keep the script running
    await new Promise(() => {});
    
  } catch (error) {
    console.error('Error during debugging:', error);
  }
}

debugSite();