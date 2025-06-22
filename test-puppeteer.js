const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

async function testLocalFile() {
  console.log('\n=== Testing Local File ===');
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  // Enable console logging
  page.on('console', msg => console.log('[Browser Console]', msg.text()));
  page.on('pageerror', error => console.log('[Page Error]', error.message));
  
  // Test local notification creation
  await page.goto(`file://${path.join(__dirname, 'test-notification.html')}`);
  await page.waitForTimeout(2000);
  
  // Check if notification exists
  const notification = await page.$('.setup-notification');
  if (notification) {
    console.log('✓ Notification found in local test');
    
    // Get the HTML content
    const html = await page.evaluate(el => el.innerHTML, notification);
    console.log('Notification HTML:', html);
    
    // Check for button
    const button = await page.$('.setup-notification button');
    if (button) {
      console.log('✓ Button found in local test');
      
      // Click the button
      await button.click();
      await page.waitForTimeout(500);
    } else {
      console.log('✗ Button NOT found in local test');
    }
  } else {
    console.log('✗ Notification NOT found in local test');
  }
  
  await browser.close();
}

async function testLiveSite() {
  console.log('\n=== Testing Live Site ===');
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  // Enable console logging
  page.on('console', msg => console.log('[Browser Console]', msg.text()));
  page.on('pageerror', error => console.log('[Page Error]', error.message));
  page.on('requestfailed', request => {
    console.log('[Request Failed]', request.url(), request.failure().errorText);
  });
  
  // Navigate to live site
  console.log('Navigating to https://dev.a4.48d1.cc ...');
  await page.goto('https://dev.a4.48d1.cc', { waitUntil: 'networkidle2' });
  
  // Wait a bit for JavaScript to execute
  await page.waitForTimeout(3000);
  
  // Check if PocketBase is loaded
  const hasPocketBase = await page.evaluate(() => {
    return typeof window.PocketBase !== 'undefined';
  });
  console.log('PocketBase loaded:', hasPocketBase);
  
  // Check if plannerStore exists
  const hasPlannerStore = await page.evaluate(() => {
    return typeof window.plannerStore !== 'undefined';
  });
  console.log('plannerStore exists:', hasPlannerStore);
  
  if (hasPlannerStore) {
    // Get store state
    const storeState = await page.evaluate(() => {
      return {
        isInitializing: window.plannerStore.isInitializing,
        showSetupModal: window.plannerStore.showSetupModal,
        pb: window.plannerStore.pb ? 'exists' : 'null'
      };
    });
    console.log('Store state:', storeState);
    
    // Try to manually trigger notification
    console.log('Manually triggering showSetupNotification...');
    await page.evaluate(() => {
      if (window.plannerStore && window.plannerStore.showSetupNotification) {
        window.plannerStore.showSetupNotification();
      }
    });
    
    await page.waitForTimeout(1000);
  }
  
  // Check for notification
  const notification = await page.$('.setup-notification');
  if (notification) {
    console.log('✓ Setup notification found!');
    
    // Get the HTML
    const html = await page.evaluate(el => el.outerHTML, notification);
    console.log('Notification HTML:', html);
    
    // Check for button
    const button = await page.$('.setup-notification button');
    if (button) {
      console.log('✓ Button found!');
      
      // Get button details
      const buttonDetails = await page.evaluate(el => ({
        outerHTML: el.outerHTML,
        textContent: el.textContent,
        className: el.className
      }), button);
      console.log('Button details:', buttonDetails);
      
      // Try clicking
      await button.click();
      console.log('Button clicked');
      
      await page.waitForTimeout(1000);
      
      // Check if modal opened
      const modalState = await page.evaluate(() => {
        return window.plannerStore ? window.plannerStore.showSetupModal : 'no store';
      });
      console.log('Modal state after click:', modalState);
    } else {
      console.log('✗ Button NOT found');
      
      // Check what's actually in the notification
      const innerContent = await page.evaluate(el => {
        return {
          innerHTML: el.innerHTML,
          children: Array.from(el.children).map(child => ({
            tagName: child.tagName,
            className: child.className,
            textContent: child.textContent
          }))
        };
      }, notification);
      console.log('Notification inner content:', JSON.stringify(innerContent, null, 2));
    }
  } else {
    console.log('✗ Setup notification NOT found');
    
    // Check all elements with setup in classname
    const setupElements = await page.$$eval('[class*="setup"]', elements => {
      return elements.map(el => ({
        tagName: el.tagName,
        className: el.className,
        id: el.id
      }));
    });
    console.log('Elements with "setup" in class:', setupElements);
    
    // Check body HTML for the text
    const bodyContainsText = await page.evaluate(() => {
      return document.body.innerHTML.includes('Database not initialized');
    });
    console.log('Body contains "Database not initialized":', bodyContainsText);
  }
  
  // Take a screenshot
  await page.screenshot({ path: 'live-site-screenshot.png', fullPage: true });
  console.log('Screenshot saved as live-site-screenshot.png');
  
  await browser.close();
}

async function testLocalBuild() {
  console.log('\n=== Testing Local Build ===');
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  // Enable console logging
  page.on('console', msg => console.log('[Browser Console]', msg.text()));
  page.on('pageerror', error => console.log('[Page Error]', error.message));
  
  // Test the built files locally
  await page.goto(`file://${path.join(__dirname, 'index.html')}`);
  await page.waitForTimeout(3000);
  
  // Similar checks as live site
  const notification = await page.$('.setup-notification');
  if (notification) {
    console.log('✓ Notification found in local build');
    const html = await page.evaluate(el => el.outerHTML, notification);
    console.log('HTML:', html);
  } else {
    console.log('✗ Notification NOT found in local build');
    
    // Try manual trigger
    const triggered = await page.evaluate(() => {
      if (window.plannerStore && window.plannerStore.showSetupNotification) {
        window.plannerStore.showSetupNotification();
        return true;
      }
      return false;
    });
    
    if (triggered) {
      console.log('Manual trigger executed');
      await page.waitForTimeout(1000);
      
      const notifAfter = await page.$('.setup-notification');
      console.log('Notification after trigger:', notifAfter ? 'Found' : 'Not found');
    }
  }
  
  await browser.close();
}

async function analyzeMinifiedCode() {
  console.log('\n=== Analyzing Minified Code ===');
  
  const minifiedPath = path.join(__dirname, 'svelte-app/dist/assets/index-BLNEHanq.js');
  const content = await fs.readFile(minifiedPath, 'utf8');
  
  // Search for the notification HTML pattern
  const patterns = [
    'Database not initialized',
    'setup-notification-button',
    'innerHTML.*Database.*Setup',
    '<button.*setup-notification-button.*>Setup</button>'
  ];
  
  for (const pattern of patterns) {
    const regex = new RegExp(pattern, 'gi');
    const matches = content.match(regex);
    console.log(`Pattern "${pattern}": ${matches ? matches.length : 0} matches`);
    if (matches && matches.length > 0) {
      // Show context around first match
      const index = content.indexOf(matches[0]);
      const context = content.substring(Math.max(0, index - 100), Math.min(content.length, index + 200));
      console.log(`  Context: ...${context}...`);
    }
  }
  
  // Check if the innerHTML assignment is preserved correctly
  const innerHTMLPattern = /\.innerHTML\s*=\s*[`"']([^`"']*Database[^`"']*)[`"']/g;
  let match;
  while ((match = innerHTMLPattern.exec(content)) !== null) {
    console.log('\nFound innerHTML assignment:');
    console.log('  Content:', match[1]);
  }
}

async function runAllTests() {
  try {
    await testLocalFile();
    await testLocalBuild();
    await testLiveSite();
    await analyzeMinifiedCode();
  } catch (error) {
    console.error('Test error:', error);
  }
}

runAllTests();