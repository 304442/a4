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

  <DropdownPortals />
{/if}

{#if plannerStore.showSetupModal}
  <SetupModal />
{/if}