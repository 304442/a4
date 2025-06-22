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
    console.log('⚠️  No table found, checking page content...');
    const content = await page.evaluate(() => {
      return {
        tables: document.querySelectorAll('table').length,
        sections: Array.from(document.querySelectorAll('section')).map(s => s.textContent.substring(0, 50)),
        body: document.body.textContent.substring(0, 200)
      };
    });
    console.log('Page info:', content);
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
      const style = window.getComputedStyle(col);
      return {
        index,
        text: col.textContent.trim(),
        width: rect.width,
        computedWidth: style.width,
        padding: style.padding,
        border: style.border
      };
    });
    
    // Count total columns and rows
    const rowCount = table.querySelectorAll('tr').length;
    
    return {
      table: {
        width: tableRect.width,
        height: tableRect.height,
        computedWidth: computedStyle.width,
        computedHeight: computedStyle.height,
        border: computedStyle.border,
        borderCollapse: computedStyle.borderCollapse
      },
      columnCount: columns.length,
      rowCount,
      columnWidths,
      // Get first few cell contents to verify structure
      sampleCells: Array.from(table.querySelectorAll('tr')).slice(0, 3).map(row => 
        Array.from(row.querySelectorAll('td, th')).slice(0, 5).map(cell => ({
          text: cell.textContent.trim(),
          tagName: cell.tagName.toLowerCase(),
          className: cell.className
        }))
      )
    };
  });
  
  return measurements;
}

async function performDatabaseSetup(page) {
  console.log('\n📦 Performing database setup...');
  
  // Check if setup is needed
  const setupButton = await page.$('button:has-text("Setup")');
  if (!setupButton) {
    console.log('✅ Database already initialized, no setup needed');
    return false;
  }
  
  // Click setup button
  await setupButton.click();
  console.log('🔄 Clicked setup button');
  
  // Wait for modal
  await page.waitForSelector('.setup-modal', { timeout: 5000 });
  
  // Fill in PocketBase URL
  await page.fill('input[placeholder="https://your-pocketbase-url.com"]', 'https://dev.a4.48d1.cc');
  
  // Test connection
  await page.click('button:has-text("Test Connection")');
  await page.waitForSelector('text=✓ Connection successful', { timeout: 10000 });
  console.log('✅ Connection test passed');
  
  // Proceed to authentication
  await page.click('button:has-text("Next: Authentication")');
  
  // Fill in admin credentials (using defaults or environment variables)
  const adminEmail = process.env.POCKETBASE_ADMIN_EMAIL || 'test@example.com';
  const adminPassword = process.env.POCKETBASE_ADMIN_PASSWORD || 'testpassword123';
  
  await page.fill('input[type="email"]', adminEmail);
  await page.fill('input[type="password"]', adminPassword);
  
  // Authenticate
  await page.click('button:has-text("Authenticate")');
  await page.waitForSelector('text=✓ Authentication successful', { timeout: 10000 });
  console.log('✅ Authentication successful');
  
  // Proceed to database setup
  await page.click('button:has-text("Next: Database Setup")');
  
  // Perform full setup
  await page.click('button:has-text("Full Setup")');
  
  // Wait for setup to complete
  await page.waitForSelector('text=✓ Database setup complete!', { timeout: 30000 });
  console.log('✅ Database setup complete');
  
  // Close modal
  await page.click('button:has-text("Close and Reload")');
  
  // Wait for page reload
  await page.waitForLoadState('networkidle');
  
  return true;
}

async function main() {
  const forceReset = process.argv.includes('--reset');
  
  const browser = await chromium.launch({ 
    headless: false,
    devtools: true 
  });
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 }
  });
  
  const page = await context.newPage();
  
  // Clear localStorage if reset flag is set
  if (forceReset) {
    console.log('🔄 Clearing localStorage to force database reset...');
    await page.goto('https://dev.a4.48d1.cc');
    await page.evaluate(() => {
      localStorage.clear();
    });
  }
  
  try {
    console.log('🌐 Navigating to dev.a4.48d1.cc...');
    await page.goto('https://dev.a4.48d1.cc', { waitUntil: 'networkidle' });
    
    // Wait a bit for any initial loading
    await page.waitForTimeout(2000);
    
    console.log('\n📏 BEFORE DATABASE SETUP:');
    console.log('========================');
    const beforeMeasurements = await measureTableSizes(page);
    
    if (beforeMeasurements) {
      // Take screenshot before setup
      await page.screenshot({ path: 'table-before-setup.png', fullPage: false });
      console.log('📸 Screenshot saved: table-before-setup.png');
      
      console.log(`\nTable dimensions:`);
      console.log(`  Width: ${beforeMeasurements.table.width}px (computed: ${beforeMeasurements.table.computedWidth})`);
      console.log(`  Height: ${beforeMeasurements.table.height}px`);
      console.log(`  Border: ${beforeMeasurements.table.border}`);
      console.log(`  Border-collapse: ${beforeMeasurements.table.borderCollapse}`);
      console.log(`\nTable structure:`);
      console.log(`  Columns: ${beforeMeasurements.columnCount}`);
      console.log(`  Rows: ${beforeMeasurements.rowCount}`);
      console.log(`\nColumn widths:`);
      beforeMeasurements.columnWidths.forEach(col => {
        console.log(`  Column ${col.index} ("${col.text}"): ${col.width}px (computed: ${col.computedWidth})`);
      });
      console.log(`\nFirst few rows:`);
      beforeMeasurements.sampleCells.forEach((row, i) => {
        console.log(`  Row ${i}: ${row.map(cell => `[${cell.tagName}] "${cell.text}"`).join(' | ')}`);
      });
    } else {
      console.log('❌ Could not find schedule table');
    }
    
    // Perform database setup if needed
    const setupPerformed = await performDatabaseSetup(page);
    
    if (setupPerformed) {
      // Wait for the page to stabilize after setup
      await page.waitForTimeout(3000);
      
      console.log('\n📏 AFTER DATABASE SETUP:');
      console.log('=======================');
      const afterMeasurements = await measureTableSizes(page);
      
      if (afterMeasurements) {
        // Take screenshot after setup
        await page.screenshot({ path: 'table-after-setup.png', fullPage: false });
        console.log('📸 Screenshot saved: table-after-setup.png');
        
        console.log(`\nTable dimensions:`);
        console.log(`  Width: ${afterMeasurements.table.width}px (computed: ${afterMeasurements.table.computedWidth})`);
        console.log(`  Height: ${afterMeasurements.table.height}px`);
        console.log(`  Border: ${afterMeasurements.table.border}`);
        console.log(`  Border-collapse: ${afterMeasurements.table.borderCollapse}`);
        console.log(`\nTable structure:`);
        console.log(`  Columns: ${afterMeasurements.columnCount}`);
        console.log(`  Rows: ${afterMeasurements.rowCount}`);
        console.log(`\nColumn widths:`);
        afterMeasurements.columnWidths.forEach(col => {
          console.log(`  Column ${col.index} ("${col.text}"): ${col.width}px (computed: ${col.computedWidth})`);
        });
        console.log(`\nFirst few rows:`);
        afterMeasurements.sampleCells.forEach((row, i) => {
          console.log(`  Row ${i}: ${row.map(cell => `[${cell.tagName}] "${cell.text}"`).join(' | ')}`);
        });
        
        // Compare measurements
        console.log('\n📊 COMPARISON:');
        console.log('==============');
        if (beforeMeasurements) {
          const widthDiff = afterMeasurements.table.width - beforeMeasurements.table.width;
          const heightDiff = afterMeasurements.table.height - beforeMeasurements.table.height;
          const columnDiff = afterMeasurements.columnCount - beforeMeasurements.columnCount;
          const rowDiff = afterMeasurements.rowCount - beforeMeasurements.rowCount;
          
          console.log(`Table width change: ${widthDiff > 0 ? '+' : ''}${widthDiff}px`);
          console.log(`Table height change: ${heightDiff > 0 ? '+' : ''}${heightDiff}px`);
          console.log(`Column count change: ${columnDiff > 0 ? '+' : ''}${columnDiff}`);
          console.log(`Row count change: ${rowDiff > 0 ? '+' : ''}${rowDiff}`);
          
          console.log('\nColumn width changes:');
          for (let i = 0; i < Math.max(beforeMeasurements.columnWidths.length, afterMeasurements.columnWidths.length); i++) {
            const before = beforeMeasurements.columnWidths[i];
            const after = afterMeasurements.columnWidths[i];
            if (before && after) {
              const diff = after.width - before.width;
              console.log(`  Column ${i}: ${diff > 0 ? '+' : ''}${diff}px (${before.text} → ${after.text})`);
            } else if (after && !before) {
              console.log(`  Column ${i}: NEW (${after.text}, ${after.width}px)`);
            } else if (before && !after) {
              console.log(`  Column ${i}: REMOVED (was ${before.text})`);
            }
          }
        }
      } else {
        console.log('❌ Could not find schedule table after setup');
      }
    } else {
      console.log('\n✅ No database setup needed, measurements remain the same');
    }
    
    // Keep browser open for inspection
    console.log('\n🔍 Browser will remain open for inspection. Press Ctrl+C to exit.');
    await page.waitForTimeout(300000); // Wait 5 minutes
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await browser.close();
  }
}

main().catch(console.error);