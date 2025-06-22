import { chromium } from 'playwright';

async function testDropdowns() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log(`[${msg.type()}] ${msg.text()}`));
  
  await page.goto('https://dev.a4.48d1.cc');
  await page.waitForTimeout(3000);
  
  // Test city dropdown
  console.log('\n🔍 Testing city dropdown...');
  
  const cityClickResult = await page.evaluate(() => {
    const citySpan = document.querySelector('.clickable.ml-1');
    if (!citySpan) return { error: 'City span not found' };
    
    const before = window.plannerStore?.showCitySelector;
    
    // Simulate click
    const event = new MouseEvent('click', { bubbles: true });
    citySpan.dispatchEvent(event);
    
    const after = window.plannerStore?.showCitySelector;
    
    // Check if dropdown appeared
    const dropdown = document.querySelector('.dropdown-portal');
    
    return {
      cityText: citySpan.textContent,
      beforeClick: before,
      afterClick: after,
      dropdownFound: !!dropdown,
      toggleSelectorExists: typeof window.plannerStore?.toggleSelector === 'function'
    };
  });
  
  console.log('City dropdown test:', cityClickResult);
  
  await page.waitForTimeout(2000);
  
  // Test week dropdown
  console.log('\n🔍 Testing week dropdown...');
  
  const weekClickResult = await page.evaluate(() => {
    const weekSpan = document.querySelector('.text-sm .clickable');
    if (!weekSpan) return { error: 'Week span not found' };
    
    const before = window.plannerStore?.showWeekSelector;
    
    // Simulate click
    const event = new MouseEvent('click', { bubbles: true });
    weekSpan.dispatchEvent(event);
    
    const after = window.plannerStore?.showWeekSelector;
    
    return {
      weekText: weekSpan.textContent,
      beforeClick: before,
      afterClick: after
    };
  });
  
  console.log('Week dropdown test:', weekClickResult);
  
  console.log('\n✨ Browser open for manual testing. Click on city or week to test.');
  console.log('Press Ctrl+C to exit.');
  
  await new Promise(() => {});
}

testDropdowns().catch(console.error);