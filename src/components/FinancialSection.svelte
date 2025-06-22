<script>
  import { plannerStore } from '../lib/store.svelte.js';
</script>

<div class="section">
  <h3 class="title">FINANCIAL</h3>
  <div class="text-xs">
    {#each plannerStore.financials as item, i (item.id)}
      <span>
        <span>{item.name}:</span>
        £<input 
          type="text" 
          class="input input--inline" 
          bind:value={item.value} 
          placeholder={item.placeholder} 
          onchange={() => plannerStore.saveData()}
        >
        <span>{item.account}</span>
        {#if i < plannerStore.financials.length - 1}, {/if}
      </span>
    {/each}
  </div>
</div>