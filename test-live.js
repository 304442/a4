const https = require('https');

function fetchLiveSite() {
  return new Promise((resolve, reject) => {
    https.get('https://dev.a4.48d1.cc/', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function testLive() {
  try {
    console.log('Fetching live site...');
    const html = await fetchLiveSite();
    
    // Check if assets are loaded with correct paths
    const scriptMatch = html.match(/<script[^>]*src="([^"]*index-[^"]+\.js)"/);
    const cssMatch = html.match(/<link[^>]*href="([^"]*index-[^"]+\.css)"/);
    const pbMatch = html.match(/<script[^>]*src="([^"]*pocketbase[^"]*)"/);
    
    console.log('\nAsset paths in HTML:');
    console.log('Script:', scriptMatch ? scriptMatch[1] : 'NOT FOUND');
    console.log('CSS:', cssMatch ? cssMatch[1] : 'NOT FOUND');
    console.log('PocketBase:', pbMatch ? pbMatch[1] : 'NOT FOUND');
    
    // Check if paths are absolute or relative
    if (scriptMatch && scriptMatch[1].startsWith('/')) {
      console.log('\n⚠️  Script path is absolute! Should be relative.');
    }
    if (cssMatch && cssMatch[1].startsWith('/')) {
      console.log('⚠️  CSS path is absolute! Should be relative.');
    }
    if (pbMatch && pbMatch[1].startsWith('/')) {
      console.log('⚠️  PocketBase path is absolute! Should be relative.');
    }
    
    // Try to fetch the JavaScript file
    if (scriptMatch) {
      const jsPath = scriptMatch[1];
      const jsUrl = jsPath.startsWith('/') ? 
        `https://dev.a4.48d1.cc${jsPath}` : 
        `https://dev.a4.48d1.cc/${jsPath}`;
      
      console.log(`\nFetching JS from: ${jsUrl}`);
      https.get(jsUrl, (res) => {
        console.log('JS Status:', res.statusCode);
        if (res.statusCode === 200) {
          let jsData = '';
          res.on('data', chunk => jsData += chunk);
          res.on('end', () => {
            console.log('JS Size:', jsData.length, 'bytes');
            
            // Check for key patterns
            const hasSetupNotification = jsData.includes('setup-notification');
            const hasDatabase = jsData.includes('Database not initialized');
            const hasButton = jsData.includes('setup-notification-button');
            
            console.log('\nJS Content checks:');
            console.log('Has setup-notification class:', hasSetupNotification);
            console.log('Has "Database not initialized":', hasDatabase);
            console.log('Has button class:', hasButton);
          });
        }
      }).on('error', console.error);
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testLive();