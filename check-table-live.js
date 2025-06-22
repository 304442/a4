import { chromium } from 'playwright';

async function checkTableLive() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  console.log('🔍 Loading dev.a4.48d1.cc...');
  await page.goto('https://dev.a4.48d1.cc');
  await page.waitForTimeout(3000);
  
  // Take screenshot
  await page.screenshot({ path: 'table-current-state.png', fullPage: true });
  
  // Get table info
  const tableInfo = await page.evaluate(() => {
    const table = document.querySelector('table');
    if (!table) return { error: 'No table found' };
    
    const firstRow = table.querySelector('tr');
    const headers = Array.from(table.querySelectorAll('thead th'));
    const cells = Array.from(firstRow?.querySelectorAll('td') || []);
    
    return {
      tableWidth: table.offsetWidth,
      tableClass: table.className,
      columnCount: headers.length,
      headers: headers.map(th => ({
        text: th.textContent,
        width: th.offsetWidth,
        className: th.className,
        computedStyle: window.getComputedStyle(th).width
      })),
      firstRowCells: cells.map(td => ({
        text: td.textContent?.substring(0, 20),
        width: td.offsetWidth,
        className: td.className
      }))
    };
  });
  
  console.log('\n📊 Table Analysis:');
  console.log('Table width:', tableInfo.tableWidth, 'px');
  console.log('Column count:', tableInfo.columnCount);
  console.log('\nColumn widths:');
  tableInfo.headers?.forEach((h, i) => {
    console.log(`  ${i+1}. "${h.text}" - ${h.width}px (${h.computedStyle}) [${h.className}]`);
  });
  
  console.log('\n⚠️  Browser open for inspection. Press Ctrl+C to exit.');
  await new Promise(() => {});
}

checkTableLive().catch(console.error);