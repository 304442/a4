<script>
  import { plannerStore } from '../lib/store.svelte.js';
</script>

<div class="section">
  <h3 class="title">MEALS</h3>
  <div class="text-xs">
    {#each plannerStore.meals as meal (meal.id)}
      <div class="mb-05">
        <span class="bold">{meal.name}:</span>
        <span>{meal.ingredients}</span>
      </div>
    {/each}
  </div>
</div>