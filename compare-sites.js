import { chromium } from 'playwright';

async function compareSites() {
  console.log('🔍 Comparing dev.a4.48d1.cc vs a4.48d1.cc...\n');
  
  const browser = await chromium.launch({ headless: false });
  
  // Open both sites
  const devPage = await browser.newPage();
  const prodPage = await browser.newPage();
  
  await Promise.all([
    devPage.goto('https://dev.a4.48d1.cc'),
    prodPage.goto('https://a4.48d1.cc')
  ]);
  
  await devPage.waitForTimeout(5000);
  await prodPage.waitForTimeout(5000);
  
  // Compare schedule tables
  const devData = await devPage.evaluate(() => {
    const rows = [];
    document.querySelectorAll('table:first-of-type tbody tr').forEach(tr => {
      const cells = Array.from(tr.querySelectorAll('td')).map(td => {
        const input = td.querySelector('input');
        return input ? input.value : td.textContent.trim();
      });
      rows.push(cells);
    });
    
    // Get headers
    const headers = Array.from(document.querySelectorAll('table:first-of-type thead th')).map(th => th.textContent.trim());
    
    // Get first activity values
    const firstActivity = document.querySelector('table:first-of-type tbody tr');
    const inputs = firstActivity ? Array.from(firstActivity.querySelectorAll('input')).map(i => ({
      value: i.value,
      max: i.max,
      readonly: i.readOnly
    })) : [];
    
    return { headers, rows: rows.slice(0, 5), inputs };
  });
  
  const prodData = await prodPage.evaluate(() => {
    const rows = [];
    document.querySelectorAll('table:first-of-type tbody tr').forEach(tr => {
      const cells = Array.from(tr.querySelectorAll('td')).map(td => {
        const input = td.querySelector('input');
        return input ? input.value : td.textContent.trim();
      });
      rows.push(cells);
    });
    
    const headers = Array.from(document.querySelectorAll('table:first-of-type thead th')).map(th => th.textContent.trim());
    
    const firstActivity = document.querySelector('table:first-of-type tbody tr');
    const inputs = firstActivity ? Array.from(firstActivity.querySelectorAll('input')).map(i => ({
      value: i.value,
      max: i.max,
      readonly: i.readOnly
    })) : [];
    
    return { headers, rows: rows.slice(0, 5), inputs };
  });
  
  console.log('📊 DEV SITE:');
  console.log('Headers:', devData.headers);
  console.log('First row:', devData.rows[0]);
  console.log('Input values:', devData.inputs);
  
  console.log('\n📊 PROD SITE:');
  console.log('Headers:', prodData.headers);
  console.log('First row:', prodData.rows[0]);
  console.log('Input values:', prodData.inputs);
  
  // Check store state
  const devStore = await devPage.evaluate(() => {
    const store = window.plannerStore;
    const firstSection = store?.schedule?.[0];
    const firstActivity = firstSection?.activities?.[0];
    return {
      scheduleLength: store?.schedule?.length,
      firstSectionName: firstSection?.name,
      firstActivityName: firstActivity?.name,
      firstActivityDays: firstActivity?.days,
      sampleDay: firstActivity?.days?.mon
    };
  });
  
  console.log('\n🔍 DEV STORE STATE:');
  console.log(JSON.stringify(devStore, null, 2));
  
  // Take screenshots
  await devPage.screenshot({ path: 'dev-site.png' });
  await prodPage.screenshot({ path: 'prod-site.png' });
  console.log('\n📸 Screenshots saved: dev-site.png, prod-site.png');
  
  console.log('\n✨ Browser windows open for inspection. Press Ctrl+C to exit.');
  await new Promise(() => {});
}

compareSites().catch(console.error);