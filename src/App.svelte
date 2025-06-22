<script>
  import { onMount } from 'svelte';
  import { plannerStore } from './lib/store.svelte.js';
  import Header from './components/Header.svelte';
  import ScheduleTable from './components/ScheduleTable.svelte';
  import TasksSection from './components/TasksSection.svelte';
  import WorkoutSection from './components/WorkoutSection.svelte';
  import MealsSection from './components/MealsSection.svelte';
  import GrocerySection from './components/GrocerySection.svelte';
  import BodySection from './components/BodySection.svelte';
  import FinancialSection from './components/FinancialSection.svelte';
  import StatusIndicators from './components/StatusIndicators.svelte';
  import DropdownPortals from './components/DropdownPortals.svelte';
  import SetupModal from './components/SetupModal.svelte';
  
  // Create a local reactive reference to force reactivity
  let showModal = $state(false);
  
  // Watch for changes in plannerStore
  $effect(() => {
    showModal = plannerStore.showSetupModal;
  });
  
  onMount(() => {
    console.log('🚀 App.svelte mounted, calling plannerStore.init()');
    
    // Make debugging info globally available
    window.plannerStore = plannerStore;
    window.appDebug = {
      mountTime: new Date().toISOString(),
      storeExists: !!plannerStore,
      initialState: {
        isInitializing: plannerStore?.isInitializing,
        currentWeek: plannerStore?.currentWeek,
        showSetupModal: plannerStore?.showSetupModal
      }
    };
    
    plannerStore.init();
    
    // Enhanced debug monitoring
    let debugCount = 0;
    const debugInterval = setInterval(() => {
      debugCount++;
      const debugInfo = {
        count: debugCount,
        isInitializing: plannerStore.isInitializing,
        currentWeek: plannerStore.currentWeek,
        hasSchedule: plannerStore.schedule?.length > 0,
        hasTasks: plannerStore.tasks?.length > 0,
        showSetupModal: plannerStore.showSetupModal,
        appDivContent: document.getElementById('app')?.children.length || 0
      };
      console.log(`🔍 Debug #${debugCount}:`, debugInfo);
      window.appDebug.latestState = debugInfo;
    }, 1000);
    
    // Clean up after 15 seconds
    setTimeout(() => {
      clearInterval(debugInterval);
      console.log('🛑 Debug monitoring stopped');
    }, 15000);
  });
</script>

<!-- Debug Overlay -->
<div style="position: fixed; top: 0; left: 0; background: rgba(255,0,0,0.8); color: white; padding: 10px; z-index: 9999; font-family: monospace; font-size: 12px;">
  <strong>DEBUG MODE</strong><br>
  isInitializing: {plannerStore.isInitializing}<br>
  currentWeek: {plannerStore.currentWeek || 'null'}<br>
  showSetupModal: {plannerStore.showSetupModal}<br>
  schedule: {plannerStore.schedule?.length || 0} items<br>
  tasks: {plannerStore.tasks?.length || 0} items
</div>

<StatusIndicators />

{#if !plannerStore.isInitializing}
  <div class="viewport-container">
    <div class="card">
      <Header />
      <ScheduleTable />
      <TasksSection />
      <WorkoutSection />
      <MealsSection />
      <GrocerySection />
      <BodySection />
      <FinancialSection />
    </div>
  </div>

  <DropdownPortals />
{:else}
  <!-- Show loading state when initializing -->
  <div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center; font-family: monospace;">
    <h2>Initializing...</h2>
    <p>isInitializing: {plannerStore.isInitializing}</p>
    <p>If this takes more than 5 seconds, something is wrong.</p>
  </div>
{/if}

{#if showModal}
  <SetupModal />
{/if}