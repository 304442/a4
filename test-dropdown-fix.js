import { chromium } from 'playwright';

async function testDropdownFix() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  console.log('🔍 Testing dropdown functionality...');
  await page.goto('https://dev.a4.48d1.cc');
  await page.waitForTimeout(3000);
  
  // Test city dropdown
  const cityTest = await page.evaluate(() => {
    const citySpan = document.querySelector('.clickable.ml-1');
    if (!citySpan) return { error: 'City span not found' };
    
    // Check initial state
    const beforeClick = {
      showCitySelector: window.plannerStore?.showCitySelector,
      cityDropdownStyle: window.plannerStore?.cityDropdownStyle,
      dropdownExists: !!document.querySelector('.dropdown-portal')
    };
    
    // Click the city
    citySpan.click();
    
    // Wait a bit for state update
    return new Promise(resolve => {
      setTimeout(() => {
        const afterClick = {
          showCitySelector: window.plannerStore?.showCitySelector,
          cityDropdownStyle: window.plannerStore?.cityDropdownStyle,
          dropdownExists: !!document.querySelector('.dropdown-portal'),
          dropdownContent: document.querySelector('.dropdown__content')?.innerHTML || 'not found'
        };
        
        resolve({ beforeClick, afterClick, cityText: citySpan.textContent });
      }, 100);
    });
  });
  
  console.log('City dropdown test:', cityTest);
  
  // If dropdown is showing, try to select a city
  if (cityTest.afterClick.showCitySelector) {
    const selectResult = await page.evaluate(() => {
      const items = document.querySelectorAll('.dropdown__item');
      if (items.length > 1) {
        // Click Cairo (second item)
        items[1].click();
        return { 
          clicked: true, 
          cityAfterClick: window.plannerStore?.city,
          dropdownStillVisible: window.plannerStore?.showCitySelector
        };
      }
      return { clicked: false, itemCount: items.length };
    });
    
    console.log('Select city result:', selectResult);
  }
  
  console.log('\n✅ Browser open for inspection. Press Ctrl+C to exit.');
  await new Promise(() => {});
}

testDropdownFix().catch(console.error);