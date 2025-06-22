import { chromium } from 'playwright';

async function measureTableSizes(page) {
  // Try different selectors for the schedule table
  const selectors = [
    '.schedule-table',
    'table:has(th:has-text("Activity"))',
    'section:has-text("Schedule") table',
    'table'
  ];
  
  let tableFound = false;
  for (const selector of selectors) {
    try {
      await page.waitForSelector(selector, { timeout: 3000 });
      tableFound = true;
      break;
    } catch (e) {
      // Try next selector
    }
  }
  
  if (!tableFound) {
    console.log('⚠️  No table found');
    return null;
  }
  
  // Measure the schedule table
  const measurements = await page.evaluate(() => {
    // Try to find the schedule table with different approaches
    let table = document.querySelector('.schedule-table');
    if (!table) {
      // Look for a table that contains "Activity" header
      const tables = document.querySelectorAll('table');
      for (const t of tables) {
        if (t.textContent.includes('Activity') || t.textContent.includes('Sun') || t.textContent.includes('Mon')) {
          table = t;
          break;
        }
      }
    }
    if (!table) {
      // Just get the first table
      table = document.querySelector('table');
    }
    if (!table) return null;
    
    // Get table dimensions
    const tableRect = table.getBoundingClientRect();
    const computedStyle = window.getComputedStyle(table);
    
    // Get all columns (first row cells)
    const firstRow = table.querySelector('tr');
    const columns = firstRow ? Array.from(firstRow.querySelectorAll('th, td')) : [];
    
    // Measure each column
    const columnWidths = columns.map((col, index) => {
      const rect = col.getBoundingClientRect();
      return {
        index,
        text: col.textContent.trim(),
        width: rect.width
      };
    });
    
    return {
      table: {
        width: tableRect.width,
        height: tableRect.height
      },
      columnCount: columns.length,
      rowCount: table.querySelectorAll('tr').length,
      columnWidths
    };
  });
  
  return measurements;
}

async function main() {
  const browser = await chromium.launch({ 
    headless: true // Run headless for speed
  });
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 }
  });
  
  const page = await context.newPage();
  
  try {
    console.log('🌐 Navigating to dev.a4.48d1.cc...');
    await page.goto('https://dev.a4.48d1.cc', { waitUntil: 'networkidle' });
    
    // Wait a bit for any initial loading
    await page.waitForTimeout(2000);
    
    const measurements = await measureTableSizes(page);
    
    if (measurements) {
      console.log('\n✅ Table Measurements:');
      console.log(`  Width: ${measurements.table.width}px`);
      console.log(`  Columns: ${measurements.columnCount}`);
      console.log(`  Rows: ${measurements.rowCount}`);
      console.log('\nColumn widths:');
      measurements.columnWidths.forEach(col => {
        console.log(`  ${col.text}: ${col.width}px`);
      });
      
      // Check if table width is reasonable for A4 (should be around 755px)
      const expectedWidth = 755;
      const tolerance = 10;
      if (Math.abs(measurements.table.width - expectedWidth) <= tolerance) {
        console.log(`\n✅ Table width (${measurements.table.width}px) is within expected range`);
      } else {
        console.log(`\n⚠️  Table width (${measurements.table.width}px) differs from expected ${expectedWidth}px`);
      }
    } else {
      console.log('❌ Could not find schedule table');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
}

main().catch(console.error);