<script>
  import { plannerStore } from '../lib/store.svelte.js';
</script>

<div class="section">
  <h3 class="title">BODY</h3>
  <div class="text-xs">
    {#each plannerStore.bodyMeasurements as m, i (m.id)}
      <span>
        <span>{m.name}:</span>
        <input 
          type="text" 
          class="input input--inline" 
          bind:value={m.value} 
          placeholder={m.placeholder} 
          onchange={() => plannerStore.saveData()}
        >
        {#if i < plannerStore.bodyMeasurements.length - 1}, {/if}
      </span>
    {/each}
  </div>
</div>