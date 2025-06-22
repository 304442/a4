<script>
  import { plannerStore } from '../lib/store.svelte.js';
</script>

<div id="save-status" class="status status--save status-{plannerStore.saveStatus}">
  {plannerStore.saveStatus === 'saving' ? 'Saving...' : (plannerStore.saveStatus === 'error' ? 'Error!' : 'Saved')}
</div>

{#if plannerStore.pendingSync.length > 0 || !plannerStore.isOnline}
  <div id="sync-status" class="status status--sync {plannerStore.pendingSync.length > 0 ? 'status-pending' : 'status-synced'}">
    <span>{plannerStore.isOnline ? (plannerStore.pendingSync.length > 0 ? 'Pending: ' + plannerStore.pendingSync.length : '') : 'Offline'}</span>
  </div>
{/if}

{#if plannerStore.showNotification}
  <div id="notification" class="notification notification--show">
    {plannerStore.notificationMessage}
  </div>
{/if}