<script>
  import { plannerStore } from '../lib/store.svelte.js';
</script>

<div class="section">
  <h3 class="title">GROCERY</h3>
  <div class="text-xs">
    {#each plannerStore.groceryList as cat (cat.id)}
      <div class="mb-05">
        <span class="bold">{cat.name}:</span>
        <span>{cat.items}</span>
      </div>
    {/each}
  </div>
</div>