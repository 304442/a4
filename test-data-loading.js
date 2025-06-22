// Test script to debug data loading issue

async function testDataLoading() {
  console.log('=== Testing Data Loading ===');
  
  // Wait for PocketBase to be available
  if (!window.PocketBase) {
    console.error('PocketBase not loaded');
    return;
  }
  
  const pb = new window.PocketBase(window.location.origin);
  
  try {
    // Test 1: Check if we can connect to PocketBase
    console.log('\n1. Testing PocketBase connection...');
    const health = await fetch(`${window.location.origin}/api/health`);
    console.log('Health check:', health.ok ? 'OK' : 'FAILED');
    
    // Test 2: Fetch the default template
    console.log('\n2. Fetching default template...');
    const template = await pb.collection('templates').getFirstListItem('is_default=true');
    console.log('Template:', template);
    console.log('Template structure type:', typeof template.structure);
    
    // Test 3: Parse structure if needed
    console.log('\n3. Parsing template structure...');
    let structure = template.structure;
    if (typeof structure === 'string') {
      console.log('Structure is a string, parsing...');
      structure = JSON.parse(structure);
    }
    console.log('Parsed structure:', structure);
    console.log('Schedule sections:', structure.schedule?.length || 0);
    console.log('First schedule section:', structure.schedule?.[0]);
    
    // Test 4: Check localStorage
    console.log('\n4. Checking localStorage...');
    const cachedTemplate = localStorage.getItem('template_default');
    if (cachedTemplate) {
      const parsed = JSON.parse(cachedTemplate);
      console.log('Cached template exists:', parsed);
      console.log('Cached structure type:', typeof parsed.structure);
    } else {
      console.log('No cached template found');
    }
    
    // Test 5: Check current week data
    console.log('\n5. Checking current week data...');
    const currentWeek = new Date().toISOString().match(/(\d{4})-W(\d{2})/)?.[0] || 
      `${new Date().getFullYear()}-W${Math.ceil(((new Date() - new Date(new Date().getFullYear(), 0, 1)) / 86400000 + 1) / 7).toString().padStart(2, '0')}`;
    console.log('Current week:', currentWeek);
    
    try {
      const weekData = await pb.collection('planners').getFirstListItem(`week_id="${currentWeek}"`);
      console.log('Week data found:', weekData);
    } catch (e) {
      console.log('No week data found (this is normal for new weeks)');
    }
    
    // Test 6: Check the store state
    console.log('\n6. Checking store state...');
    if (window.plannerStore) {
      console.log('Store state:', {
        isInitializing: window.plannerStore.isInitializing,
        currentWeek: window.plannerStore.currentWeek,
        scheduleLength: window.plannerStore.schedule?.length,
        tasksLength: window.plannerStore.tasks?.length,
        currentTemplate: window.plannerStore.currentTemplate?.name,
        currentTemplateId: window.plannerStore.currentTemplateId
      });
      
      // Log first few schedule items
      if (window.plannerStore.schedule?.length > 0) {
        console.log('First schedule section:', window.plannerStore.schedule[0]);
      }
    } else {
      console.log('Store not available');
    }
    
  } catch (error) {
    console.error('Test error:', error);
  }
}

// Run the test when the page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', testDataLoading);
} else {
  // Wait a bit for the app to initialize
  setTimeout(testDataLoading, 2000);
}

// Also make it available globally
window.testDataLoading = testDataLoading;