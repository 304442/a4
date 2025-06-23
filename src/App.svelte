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
    plannerStore.init();
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

  {#key plannerStore.showCitySelector || plannerStore.showWeekSelector}
    <DropdownPortals />
  {/key}
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