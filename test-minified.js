// Test script to check minified code execution
const fs = require('fs');
const path = require('path');

// Read the minified file
const minifiedPath = path.join(__dirname, 'svelte-app/dist/assets/index-BLNEHanq.js');
const content = fs.readFileSync(minifiedPath, 'utf8');

// Search for the showSetupNotification function pattern
console.log('Searching for showSetupNotification patterns...\n');

// Look for the function definition
const funcPattern = /showSetupNotification[^{]*{[^}]*}/g;
let match;
while ((match = funcPattern.exec(content)) !== null) {
  console.log('Found function pattern:', match[0].substring(0, 200));
}

// Look for createElement('div')
const divPattern = /createElement\("div"\)/g;
const divMatches = content.match(divPattern);
console.log('\nFound createElement("div") occurrences:', divMatches ? divMatches.length : 0);

// Look for className = "setup-notification"
const classPattern = /className\s*=\s*"setup-notification"/g;
const classMatches = content.match(classPattern);
console.log('Found className="setup-notification" occurrences:', classMatches ? classMatches.length : 0);

// Look for the actual innerHTML content
console.log('\nSearching for innerHTML content...');
const parts = content.split('Database not initialized');
if (parts.length > 1) {
  console.log('Found "Database not initialized" at positions:');
  let pos = 0;
  for (let i = 0; i < parts.length - 1; i++) {
    pos += parts[i].length;
    console.log(`  Position ${pos}: ...${content.substring(pos - 50, pos + 100)}...`);
    pos += 'Database not initialized'.length;
  }
}

// Check if button HTML exists
const buttonPattern = /<button[^>]*setup-notification-button[^>]*>Setup<\/button>/g;
const buttonMatches = content.match(buttonPattern);
console.log('\nFound button HTML patterns:', buttonMatches ? buttonMatches.length : 0);

// Look for template literal syntax
const templatePattern = /\`[^`]*Database not initialized[^`]*\`/g;
const templateMatches = content.match(templatePattern);
console.log('Found template literal with "Database not initialized":', templateMatches ? templateMatches.length : 0);
if (templateMatches) {
  templateMatches.forEach((match, i) => {
    console.log(`  Template ${i + 1}:`, match);
  });
}