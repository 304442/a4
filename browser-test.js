// Browser test script - paste this in the browser console on dev.a4.48d1.cc

console.log('=== Browser Test Starting ===');

// Test 1: Check global objects
console.log('\n1. Global Objects:');
console.log('- window.PocketBase:', typeof window.PocketBase);
console.log('- window.plannerStore:', typeof window.plannerStore);

if (window.plannerStore) {
  console.log('- plannerStore.isInitializing:', window.plannerStore.isInitializing);
  console.log('- plannerStore.showSetupModal:', window.plannerStore.showSetupModal);
  console.log('- plannerStore.pb:', window.plannerStore.pb ? 'exists' : 'null');
}

// Test 2: Check for notification
console.log('\n2. Setup Notification:');
const notification = document.querySelector('.setup-notification');
if (notification) {
  console.log('- Notification found!');
  console.log('- HTML:', notification.outerHTML);
  
  const button = notification.querySelector('button');
  if (button) {
    console.log('- Button found!');
    console.log('- Button HTML:', button.outerHTML);
  } else {
    console.log('- Button NOT found in notification');
    console.log('- Notification innerHTML:', notification.innerHTML);
  }
} else {
  console.log('- Notification NOT found');
}

// Test 3: Try to trigger notification manually
console.log('\n3. Manual Trigger Test:');
if (window.plannerStore && window.plannerStore.showSetupNotification) {
  console.log('- Calling showSetupNotification()...');
  window.plannerStore.showSetupNotification();
  
  // Check again after a delay
  setTimeout(() => {
    console.log('\n4. After Manual Trigger:');
    const notif2 = document.querySelector('.setup-notification');
    if (notif2) {
      console.log('- Notification now exists!');
      console.log('- HTML:', notif2.outerHTML);
      
      const btn2 = notif2.querySelector('button');
      if (btn2) {
        console.log('- Button found!');
        
        // Test clicking the button
        console.log('\n5. Testing Button Click:');
        console.log('- showSetupModal before click:', window.plannerStore.showSetupModal);
        btn2.click();
        setTimeout(() => {
          console.log('- showSetupModal after click:', window.plannerStore.showSetupModal);
          
          // Check for modal
          const modal = document.querySelector('.setup-modal-overlay');
          console.log('- Setup modal visible:', modal ? 'YES' : 'NO');
        }, 100);
      } else {
        console.log('- Button still NOT found');
      }
    } else {
      console.log('- Notification still NOT found after trigger');
    }
  }, 500);
} else {
  console.log('- showSetupNotification method not available');
}

// Test 4: Check DOM structure
console.log('\n6. DOM Structure:');
console.log('- Body children:', document.body.children.length);
for (let i = 0; i < document.body.children.length; i++) {
  const child = document.body.children[i];
  console.log(`  [${i}] ${child.tagName}.${child.className || '(no class)'}`);
}

// Save this for copy-paste
console.log('\n=== Copy this script and run in browser console ===');