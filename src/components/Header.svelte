<script>
  import { plannerStore } from '../lib/store.svelte.js';
</script>

<div class="flex between center mb-1">
  <h1 class="text-sm bold">{plannerStore.plannerTitle}</h1>
  <div class="flex center text-xs">
    {#each plannerStore.times as time}
      <div class="flex center">
        <span>{time.label}:</span>
        <input 
          type="text" 
          class="input input--time" 
          bind:value={time.value} 
          onchange={() => plannerStore.saveData()}
        >
      </div>
    {/each}
    <span class="ml-1">|</span>
    <span 
      class="clickable ml-1" 
      onclick={(e) => plannerStore.toggleSelector(e, 'city')}
    >
      {plannerStore.city}
    </span>
  </div>
  <div class="text-sm">
    <span 
      class="clickable" 
      onclick={(e) => plannerStore.toggleSelector(e, 'week')}
    >
      {plannerStore.currentWeek}
    </span> 
    <span>{plannerStore.dateRange}</span>
  </div>
</div>