import { chromium } from 'playwright';

async function debugDropdowns() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  await page.goto('https://dev.a4.48d1.cc');
  await page.waitForTimeout(3000);
  
  // Debug dropdown state
  const debugInfo = await page.evaluate(() => {
    const store = window.plannerStore;
    
    // Find city element
    const cityEl = document.querySelector('.clickable.ml-1');
    
    // Click it programmatically
    if (cityEl) {
      cityEl.click();
    }
    
    // Wait a bit for React/Svelte to update
    return new Promise(resolve => {
      setTimeout(() => {
        const portal = document.querySelector('.dropdown-portal');
        const allElements = Array.from(document.querySelectorAll('*')).filter(el => 
          el.className && el.className.toString().includes('dropdown')
        );
        
        resolve({
          storeState: {
            showCitySelector: store?.showCitySelector,
            showWeekSelector: store?.showWeekSelector,
            cityDropdownStyle: store?.cityDropdownStyle,
            cityOptions: store?.cityOptions?.length
          },
          domState: {
            cityElementFound: !!cityEl,
            dropdownPortalFound: !!portal,
            dropdownElements: allElements.map(el => ({
              tagName: el.tagName,
              className: el.className,
              visible: el.offsetParent !== null
            }))
          }
        });
      }, 500);
    });
  });
  
  console.log('Debug Info:', JSON.stringify(debugInfo, null, 2));
  
  await browser.close();
}

debugDropdowns().catch(console.error);