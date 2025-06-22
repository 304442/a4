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
    console.log('App.svelte mounted, calling plannerStore.init()');
    plannerStore.init();
    
    // Debug: log the isInitializing state every second
    const debugInterval = setInterval(() => {
      console.log('App.svelte - isInitializing:', plannerStore.isInitializing);
    }, 1000);
    
    // Clean up after 10 seconds
    setTimeout(() => clearInterval(debugInterval), 10000);
  });
</script>

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
{/if}

{#if showModal}
  <SetupModal />
{/if}