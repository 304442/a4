<script>
  import { plannerStore } from '../lib/store.svelte.js';
</script>

<div class="section">
  <h3 class="title">WORKOUT</h3>
  <div class="grid">
    {#each plannerStore.workoutPlan as day (day.id)}
      <div>
        <p class="bold text-center mb-1">{day.name}</p>
        {#each day.exercises as ex (ex.id)}
          <div class="exercise">
            <div class="exercise-name" title="{ex.prefix}{ex.name}">
              <span>{ex.prefix}</span>
              <span>{ex.name}</span>:
            </div>
            <div class="exercise-inputs">
              <input 
                type="number" 
                class="input" 
                bind:value={ex.weight} 
                oninput={() => plannerStore.saveData()}
                placeholder={ex.defaultWeight}
              >
              <span class="exercise-unit">kg,</span>
              <input 
                type="number" 
                class="input sets" 
                bind:value={ex.sets} 
                oninput={() => plannerStore.saveData()}
                placeholder={ex.defaultSets}
              >
              <span class="exercise-unit">×</span>
              <input 
                type="number" 
                class="input reps" 
                bind:value={ex.reps} 
                oninput={() => plannerStore.saveData()}
                placeholder={ex.defaultReps}
              >
            </div>
          </div>
        {/each}
      </div>
    {/each}
  </div>
</div>