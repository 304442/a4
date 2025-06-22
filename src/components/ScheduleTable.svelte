<script>
  import { plannerStore } from '../lib/store.svelte.js';
  
  // Fixed version - no MAX columns
  const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const dayKeys = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
</script>

<table>
  <thead>
    <tr>
      <th style="width:18mm">T</th>
      <th style="width:20mm">D</th>
      <th class="ac">ACTIVITY</th>
      {#each dayLabels as dayLabel, i}
        <th class="dc" class:current-day={i === (plannerStore.currentDay || 7) - 1}>{dayLabel}</th>
      {/each}
      <th class="dc">📊</th>
      <th class="dc">🎯</th>
      <th class="dc">🔥</th>
    </tr>
  </thead>
  <tbody>
    {#each plannerStore.schedule as section}
      {#each section.activities as activity, aIdx}
        <tr class:total={section.name === 'TOTAL'}>
          <td class="bold">{aIdx === 0 ? section.name : ''}</td>
          <td class="bold">{activity.name.includes(':') ? activity.name.split(':')[0] : ''}</td>
          <td class="ac">
            <span>{activity.name.includes(':') ? activity.name.split(':')[1].trim() : activity.name}</span>
          </td>
          {#each dayKeys as day, i}
            <td class="dc" class:current-day={i === (plannerStore.currentDay || 7) - 1}>
              {#if activity.days && activity.days[day]}
                <input 
                  type="number" 
                  class="input" 
                  bind:value={activity.days[day].value}
                  min="0"
                  max={activity.days[day].max < 10 ? 9 : 99}
                  oninput={(e) => plannerStore.validateAndSave(e)}
                  readonly={section.name === 'TOTAL'}
                >
              {/if}
            </td>
          {/each}
          <td class="dc">
            <input type="number" class="input" value={activity.score} readonly>
          </td>
          <td class="dc">{activity.maxScore}</td>
          <td class="dc cell cell--color" class:streak={activity.streaks?.current > 2} class:yellow={activity.streaks?.current > 2}>
            {#if activity.streaks?.current > 0}
              <span>{activity.streaks.current}</span>
            {/if}
          </td>
        </tr>
      {/each}
      {#if section.name === 'TOTAL' && section.activities?.length > 0 && section.activities[0].maxScore > 0}
        {@const totalActivity = section.activities[0]}
        {@const percentage = totalActivity.maxScore > 0 ? Math.min(100, (totalActivity.score / totalActivity.maxScore) * 100) : 0}
        {@const progressClass = totalActivity.maxScore > 0 ? 
          (totalActivity.score / totalActivity.maxScore < 0.33 ? 'progress--low' : 
           totalActivity.score / totalActivity.maxScore < 0.66 ? 'progress--medium' : 'progress--high') : ''}
        <tr>
          <td colspan="19" class="progress">
            <div 
              class="progress__bar {progressClass}" 
              style="width: {percentage}%"
            ></div>
          </td>
        </tr>
      {/if}
    {/each}
  </tbody>
</table>