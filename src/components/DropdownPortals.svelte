<script>
  import { plannerStore } from '../lib/store.svelte.js';
  
  // Debug logging
  $effect(() => {
    console.log('DropdownPortals reactive state:', {
      showCitySelector: plannerStore.showCitySelector,
      showWeekSelector: plannerStore.showWeekSelector
    });
  });
</script>

{#if plannerStore.showCitySelector}
  <div 
    class="dropdown-portal"
    style={plannerStore.cityDropdownStyle}
  >
    <div class="dropdown__content">
      {#each plannerStore.cityOptions as cityItem}
        <div 
          class="dropdown__item" 
          onclick={() => plannerStore.selectCity(cityItem)}
        >
          {cityItem.name}
        </div>
      {/each}
    </div>
  </div>
{/if}

{#if plannerStore.showWeekSelector}
  <div 
    class="dropdown-portal"
    style={plannerStore.weekDropdownStyle}
  >
    <div class="dropdown__content">
      {#if plannerStore.savedWeeks.length > 0}
        {#each plannerStore.savedWeeks as week}
          <div 
            class="flex between center dropdown__item" 
            class:dropdown__item--current={week.isCurrent}
          >
            <span onclick={() => plannerStore.confirmLoadWeek(week.iso_week)}>
              {week.iso_week} {week.dateRange}
            </span>
            <span 
              onclick={() => plannerStore.confirmDeleteWeek(week.iso_week)} 
              class="dropdown__delete"
            >
              ×
            </span>
          </div>
        {/each}
      {:else}
        <div class="dropdown__item--empty">No saved schedules</div>
      {/if}
    </div>
  </div>
{/if}