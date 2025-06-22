import { chromium } from 'playwright';

async function checkTableStructure() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  await page.goto('https://dev.a4.48d1.cc');
  await page.waitForTimeout(3000);
  
  const tableInfo = await page.evaluate(() => {
    // Find all tables
    const tables = document.querySelectorAll('table');
    const tableData = [];
    
    tables.forEach((table, index) => {
      const headers = Array.from(table.querySelectorAll('thead th')).map(th => th.textContent.trim());
      const firstRow = table.querySelector('tbody tr');
      const cellCount = firstRow ? firstRow.querySelectorAll('td').length : 0;
      
      tableData.push({
        tableIndex: index,
        headerCount: headers.length,
        headers: headers,
        firstRowCellCount: cellCount,
        tableClass: table.className || 'no-class'
      });
    });
    
    // Check if there's a closing tag issue
    const scheduleTable = document.querySelector('table');
    const scheduleTableHTML = scheduleTable ? scheduleTable.outerHTML.substring(0, 200) : '';
    
    return {
      tableCount: tables.length,
      tables: tableData,
      scheduleTableStart: scheduleTableHTML
    };
  });
  
  console.log('Table Structure Analysis:');
  console.log(JSON.stringify(tableInfo, null, 2));
  
  await browser.close();
}

checkTableStructure().catch(console.error);