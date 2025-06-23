<script>
  import { plannerStore } from '../lib/store.svelte.js';
  
  function getRowClass(task) {
    const classes = [];
    if (task.completed === '✓') classes.push('green');
    const delay = plannerStore.getTaskDelay(task);
    if (delay > 0) classes.push('red');
    else if (delay < 0) classes.push('blue');
    return classes.join(' ');
  }
  
  function getDelayClass(delay) {
    if (delay < 0) return 'green';
    if (delay > 0) return 'red';
    return 'yellow';
  }
</script>

<div class="section">
  <h3 class="title">TASKS & PROJECT MANAGEMENT</h3>
  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>⭐</th>
        <th>Task</th>
        <th>🏷️</th>
        <th class="icon-header">Start</th>
        <th class="icon-header">Due</th>
        <th class="icon-header">Delay</th>
        <th class="icon-header">Done</th>
        <th>✓</th>
      </tr>
    </thead>
    <tbody>
      {#each plannerStore.tasks as task, i (task.id || i)}
        <tr class={getRowClass(task)}>
          <td class="dc">{i + 1}</td>
          <td>
            <select class="input" bind:value={task.priority} onchange={() => plannerStore.updateTaskField(task, 'priority', task.priority)}>
              <option value=""></option>
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="C">C</option>
              <option value="D">D</option>
            </select>
          </td>
          <td>
            <input 
              type="text" 
              class="input input--text" 
              bind:value={task.description} 
              onchange={() => plannerStore.updateTaskField(task, 'description', task.description)}
            >
          </td>
          <td>
            <select class="input" bind:value={task.tag} onchange={() => plannerStore.updateTaskField(task, 'tag', task.tag)}>
              <option value=""></option>
              <option value="P">Personal</option>
              <option value="W">Work</option>
            </select>
          </td>
          <td>
            <input 
              type="text" 
              class="input input--date" 
              bind:value={task.startDate} 
              onchange={() => plannerStore.updateTaskDate(task, 'startDate', task.startDate)}
            >
          </td>
          <td>
            <input 
              type="text" 
              class="input input--date" 
              bind:value={task.expectedDate} 
              onchange={() => plannerStore.updateTaskDate(task, 'expectedDate', task.expectedDate)}
            >
          </td>
          <td class="dc cell cell--bold {getDelayClass(plannerStore.getTaskDelay(task))}">
            <span>{plannerStore.formatDelay(plannerStore.getTaskDelay(task))}</span>
          </td>
          <td>
            <input 
              type="text" 
              class="input input--date" 
              bind:value={task.actualDate} 
              onchange={() => plannerStore.updateTaskDate(task, 'actualDate', task.actualDate)}
            >
          </td>
          <td>
            <input 
              type="text" 
              class="input" 
              value={task.completed} 
              onclick={(e) => { e.preventDefault(); plannerStore.toggleTaskCompletion(task); }}
              class:task-done={task.completed === '✓'}
              placeholder="☐"
              readonly
            >
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>