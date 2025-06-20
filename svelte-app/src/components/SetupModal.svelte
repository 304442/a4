<script>
  import { plannerStore } from '../lib/store.svelte.js';
  import { onMount } from 'svelte';
  
  let url = $state(window.location.origin);
  let username = $state('admin@example.com');
  let password = $state('');
  let showPassword = $state(false);
  let currentStep = $state(1);
  let testStatus = $state('');
  let isCreating = $state(false);
  let isTesting = $state(false);
  let isInitializing = $state(false);
  let initializeProgress = $state(0);
  let initializeStatus = $state('');
  let seeds = $state({
    templates: false,
    planners: false
  });
  
  const steps = [
    { num: 1, name: 'PocketBase URL' },
    { num: 2, name: 'Admin Credentials' },
    { num: 3, name: 'Create Collections' },
    { num: 4, name: 'Seed Database' },
    { num: 5, name: 'Complete' }
  ];
  
  function closeModal() {
    plannerStore.showSetupModal = false;
    // Remove the setup notification if it exists
    const notification = document.querySelector('.setup-notification');
    if (notification) notification.remove();
  }
  
  async function testConnection() {
    isTesting = true;
    testStatus = '';
    
    try {
      const response = await fetch(`${url}/api/health`);
      if (response.ok) {
        testStatus = 'success';
        currentStep = 2;
      } else {
        testStatus = 'error';
      }
    } catch (e) {
      testStatus = 'error';
    } finally {
      isTesting = false;
    }
  }
  
  async function authenticateAdmin() {
    isCreating = true;
    try {
      plannerStore.pb.baseURL = url;
      await plannerStore.pb.admins.authWithPassword(username, password);
      currentStep = 3;
    } catch (e) {
      alert('Authentication failed: ' + e.message);
    } finally {
      isCreating = false;
    }
  }
  
  async function createCollections() {
    isCreating = true;
    try {
      // Create templates collection
      try {
        await plannerStore.pb.collections.getOne('templates');
      } catch (e) {
        if (e.status === 404) {
          await plannerStore.pb.collections.create(getTemplatesSchema());
        }
      }
      
      // Create planners collection
      try {
        await plannerStore.pb.collections.getOne('planners');
      } catch (e) {
        if (e.status === 404) {
          await plannerStore.pb.collections.create(getPlannersSchema());
        }
      }
      
      currentStep = 4;
    } catch (e) {
      alert('Failed to create collections: ' + e.message);
    } finally {
      isCreating = false;
    }
  }
  
  async function seedDatabase() {
    isInitializing = true;
    initializeProgress = 0;
    
    try {
      // Seed templates
      initializeStatus = 'Seeding templates...';
      initializeProgress = 33;
      
      const templates = await plannerStore.pb.collection('templates').getFullList();
      if (templates.length === 0) {
        await plannerStore.pb.collection('templates').create(getDefaultTemplate());
        seeds.templates = true;
      }
      
      initializeProgress = 66;
      initializeStatus = 'Database seeded successfully';
      
      currentStep = 5;
      initializeProgress = 100;
    } catch (e) {
      alert('Failed to seed database: ' + e.message);
      initializeStatus = 'Error: ' + e.message;
    } finally {
      isInitializing = false;
    }
  }
  
  async function completeSetup() {
    closeModal();
    await plannerStore.init();
  }
  
  function getTemplatesSchema() {
    return {
      name: "templates",
      type: "base",
      schema: [
        {
          name: "name",
          type: "text",
          required: true,
          options: { min: 1, max: 50 }
        },
        {
          name: "is_default",
          type: "bool"
        },
        {
          name: "structure",
          type: "json",
          required: true
        }
      ],
      indexes: ["CREATE UNIQUE INDEX idx_templates_name ON templates (name)"]
    };
  }
  
  function getPlannersSchema() {
    return {
      name: "planners",
      type: "base",
      schema: [
        {
          name: "week_id",
          type: "text",
          required: true,
          options: {
            min: 8,
            max: 8,
            pattern: "^\\d{4}-W(0[1-9]|[1-4]\\d|5[0-3])$"
          }
        },
        {
          name: "template_id",
          type: "relation",
          required: true,
          options: {
            collectionId: "templates",
            cascadeDelete: false,
            maxSelect: 1
          }
        },
        {
          name: "title",
          type: "text",
          options: { max: 100 }
        },
        {
          name: "city",
          type: "text",
          options: { max: 50 }
        },
        {
          name: "date_range",
          type: "text",
          options: { max: 20 }
        },
        {
          name: "prayer_times",
          type: "json"
        },
        {
          name: "schedule_data",
          type: "json"
        },
        {
          name: "tasks_data",
          type: "json"
        },
        {
          name: "workout_data",
          type: "json"
        },
        {
          name: "meals_data",
          type: "json"
        },
        {
          name: "grocery_data",
          type: "json"
        },
        {
          name: "measurements_data",
          type: "json"
        },
        {
          name: "financials_data",
          type: "json"
        }
      ],
      indexes: ["CREATE UNIQUE INDEX idx_planners_week ON planners (week_id)"]
    };
  }
  
  function getDefaultTemplate() {
    return {
      name: "default",
      is_default: true,
      structure: {
        title_default: "Weekly Planner",
        city_default: "London",
        prayer_times: [
          { label: "Q", value: "" },
          { label: "F", value: "" },
          { label: "D", value: "" },
          { label: "A", value: "" },
          { label: "M", value: "" },
          { label: "I", value: "" }
        ],
        schedule: [
          {
            name: "HABITS",
            activities: [
              { name: "Q: Quran", max_per_day: 5, max_score: 35 },
              { name: "P: Prayer", max_per_day: 5, max_score: 35 },
              { name: "E: Exercise", max_per_day: 1, max_score: 7 },
              { name: "R: Read", max_per_day: 1, max_score: 7 },
              { name: "L: Learn", max_per_day: 1, max_score: 7 }
            ]
          },
          {
            name: "TOTAL",
            activities: [
              { name: "DAILY POINTS", max_per_day: 0, max_score: 0 }
            ]
          }
        ],
        tasks: {
          count: 15,
          fields: ["num", "priority", "tag", "description", "start_date", "expected_date", "actual_date", "completed"]
        },
        workout: [
          {
            name: "PUSH",
            exercises: [
              { name: "Bench Press", default_weight: 60, default_sets: 4, default_reps: 8 },
              { name: "Shoulder Press", default_weight: 40, default_sets: 3, default_reps: 10 },
              { name: "Dips", default_weight: 0, default_sets: 3, default_reps: 12 }
            ]
          },
          {
            name: "PULL",
            exercises: [
              { name: "Deadlift", default_weight: 80, default_sets: 4, default_reps: 6 },
              { name: "Pull-ups", default_weight: 0, default_sets: 3, default_reps: 10 },
              { name: "Rows", default_weight: 50, default_sets: 3, default_reps: 12 }
            ]
          },
          {
            name: "LEGS",
            exercises: [
              { name: "Squats", default_weight: 70, default_sets: 4, default_reps: 8 },
              { name: "Lunges", default_weight: 30, default_sets: 3, default_reps: 12 },
              { name: "Calf Raises", default_weight: 40, default_sets: 3, default_reps: 15 }
            ]
          }
        ],
        meals: [
          { name: "Breakfast", ingredients: "" },
          { name: "Lunch", ingredients: "" },
          { name: "Dinner", ingredients: "" },
          { name: "Snacks", ingredients: "" }
        ],
        grocery: {
          categories: [
            { name: "Proteins", items: "" },
            { name: "Vegetables", items: "" },
            { name: "Fruits", items: "" },
            { name: "Dairy", items: "" },
            { name: "Grains", items: "" },
            { name: "Others", items: "" }
          ]
        },
        measurements: [
          { name: "Weight", placeholder: "kg" },
          { name: "Waist", placeholder: "cm" },
          { name: "Chest", placeholder: "cm" },
          { name: "Arms", placeholder: "cm" }
        ],
        financials: [
          { name: "Income", placeholder: "0", account: "" },
          { name: "Expenses", placeholder: "0", account: "" },
          { name: "Savings", placeholder: "0", account: "" },
          { name: "Investments", placeholder: "0", account: "" }
        ]
      }
    };
  }
</script>

<div class="setup-modal-overlay" onclick={(e) => e.target === e.currentTarget && closeModal()}>
  <div class="setup-modal-content">
    <div class="setup-container">
      <div class="flex between center mb-1">
        <h1 class="text-sm bold">A4 Planner - Database Setup</h1>
        <button class="clickable" onclick={closeModal}>×</button>
      </div>
      
      <div class="setup-steps">
        <div class="flex center mb-1">
          {#each steps as step}
            <div class="setup-step" class:active={currentStep >= step.num}>
              <span class="setup-step-num">{step.num}</span>
              <span class="setup-step-name text-xs">{step.name}</span>
            </div>
          {/each}
        </div>
      </div>
      
      {#if currentStep === 1}
        <div class="setup-section">
          <h2>Step 1: PocketBase URL</h2>
          <p class="text-xs mb-05">Enter your PocketBase server URL</p>
          <input 
            type="url" 
            class="input input--text" 
            bind:value={url}
            placeholder="http://localhost:8090"
          >
          <div class="flex center mt-1">
            <button 
              onclick={testConnection}
              disabled={isTesting || !url}
              class:setup-disabled={isTesting || !url}
            >
              {isTesting ? 'Testing...' : 'Test Connection'}
            </button>
            {#if testStatus === 'success'}
              <span class="text-xs ml-1 green">✓ Connected</span>
            {:else if testStatus === 'error'}
              <span class="text-xs ml-1 red">✗ Connection failed</span>
            {/if}
          </div>
        </div>
      {/if}
      
      {#if currentStep === 2}
        <div class="setup-section">
          <h2>Step 2: Admin Credentials</h2>
          <p class="text-xs mb-05">Enter your PocketBase admin credentials</p>
          <div class="mb-05">
            <input 
              type="email" 
              class="input input--text" 
              bind:value={username}
              placeholder="admin@example.com"
            >
          </div>
          <div class="mb-05" style="position: relative;">
            <input 
              type={showPassword ? 'text' : 'password'}
              class="input input--text" 
              bind:value={password}
              placeholder="Password"
            >
            <button 
              class="setup-pass-toggle"
              onclick={() => showPassword = !showPassword}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
          <button 
            onclick={authenticateAdmin}
            disabled={isCreating || !username || !password}
            class:setup-disabled={isCreating || !username || !password}
          >
            {isCreating ? 'Authenticating...' : 'Authenticate'}
          </button>
        </div>
      {/if}
      
      {#if currentStep === 3}
        <div class="setup-section">
          <h2>Step 3: Create Collections</h2>
          <p class="text-xs mb-05">Create required database collections</p>
          <div class="setup-collections">
            <div class="text-xs mb-05">• templates - Store planner templates</div>
            <div class="text-xs mb-05">• planners - Store weekly planner data</div>
          </div>
          <button 
            onclick={createCollections}
            disabled={isCreating}
            class:setup-disabled={isCreating}
          >
            {isCreating ? 'Creating...' : 'Create Collections'}
          </button>
        </div>
      {/if}
      
      {#if currentStep === 4}
        <div class="setup-section">
          <h2>Step 4: Seed Database</h2>
          <p class="text-xs mb-05">Initialize database with default template</p>
          {#if isInitializing}
            <div class="progress mb-05">
              <div 
                class="progress__bar progress--high" 
                style="width: {initializeProgress}%"
              ></div>
            </div>
            <p class="text-xs">{initializeStatus}</p>
          {:else}
            <div class="text-xs mb-05">
              {#if seeds.templates}✓{:else}•{/if} Default template
            </div>
            <button 
              onclick={seedDatabase}
              disabled={isInitializing}
              class:setup-disabled={isInitializing}
            >
              Seed Database
            </button>
          {/if}
        </div>
      {/if}
      
      {#if currentStep === 5}
        <div class="setup-section">
          <h2>✓ Setup Complete!</h2>
          <p class="text-xs mb-05">Your A4 Planner database is ready to use.</p>
          <button onclick={completeSetup}>
            Start Using Planner
          </button>
        </div>
      {/if}
      
      <div class="setup-help mt-1">
        <details>
          <summary class="text-xs bold">Help & Documentation</summary>
          <div class="text-xs mt-05">
            <h3 class="bold mb-05">Prerequisites:</h3>
            <p class="mb-05">1. PocketBase server running and accessible</p>
            <p class="mb-05">2. Admin account created in PocketBase</p>
            
            <h3 class="bold mb-05 mt-1">Setup Steps:</h3>
            <p class="mb-05">1. <b>PocketBase URL:</b> Enter the URL where your PocketBase is running (e.g., http://localhost:8090)</p>
            <p class="mb-05">2. <b>Admin Credentials:</b> Use your PocketBase admin email and password</p>
            <p class="mb-05">3. <b>Create Collections:</b> This creates the database structure</p>
            <p class="mb-05">4. <b>Seed Database:</b> Adds the default template</p>
            
            <h3 class="bold mb-05 mt-1">Troubleshooting:</h3>
            <p class="mb-05">• <b>Connection failed:</b> Check if PocketBase is running and the URL is correct</p>
            <p class="mb-05">• <b>Authentication failed:</b> Verify your admin credentials</p>
            <p class="mb-05">• <b>Collection exists:</b> Collections may already be created</p>
          </div>
        </details>
      </div>
    </div>
  </div>
</div>

<style>
  .setup-modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    z-index: 10000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
  }
  
  .setup-modal-content {
    background: white;
    border-radius: 8px;
    width: 100%;
    max-width: 600px;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  }
  
  .setup-container {
    padding: 20px;
    font-family: monospace;
    font-size: 12px;
    line-height: 1.4;
    color: #333;
  }
  
  .setup-container h2 {
    font-size: 14px;
    font-weight: 600;
    margin: 10px 0 8px 0;
    color: #444;
  }
  
  .setup-container button {
    padding: 6px 12px;
    background: #007bff;
    color: white;
    border: 0;
    border-radius: 3px;
    cursor: pointer;
    font-size: 11px;
    margin: 2px;
  }
  
  .setup-container button:hover:not(:disabled) {
    background: #0056b3;
  }
  
  .setup-container button:disabled {
    background: #ccc;
    cursor: not-allowed;
  }
  
  .setup-steps {
    display: flex;
    justify-content: space-between;
    margin: 20px 0;
    padding: 0 10px;
  }
  
  .setup-step {
    display: flex;
    flex-direction: column;
    align-items: center;
    opacity: 0.5;
    transition: opacity 0.3s;
  }
  
  .setup-step.active {
    opacity: 1;
  }
  
  .setup-step-num {
    width: 30px;
    height: 30px;
    border-radius: 50%;
    background: #e0e0e0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    margin-bottom: 5px;
  }
  
  .setup-step.active .setup-step-num {
    background: #007bff;
    color: white;
  }
  
  .setup-step-name {
    font-size: 10px;
    text-align: center;
  }
  
  .setup-section {
    margin: 20px 0;
  }
  
  .setup-pass-toggle {
    position: absolute;
    right: 2px;
    top: 1px;
    padding: 2px 6px !important;
    font-size: 9px !important;
    background: #f8f9fa !important;
    color: #333 !important;
    border: 1px solid #ddd !important;
  }
  
  .setup-help {
    border-top: 1px solid #e0e0e0;
    padding-top: 10px;
  }
  
  .setup-help summary {
    cursor: pointer;
    padding: 5px;
    background: #f8f9fa;
    border-radius: 3px;
  }
  
  .setup-help details[open] summary {
    margin-bottom: 10px;
  }
  
  .setup-collections {
    background: #f8f9fa;
    padding: 10px;
    border-radius: 3px;
    margin: 10px 0;
  }
  
  .mt-05 { margin-top: 5px; }
  .mt-1 { margin-top: 10px; }
  .mb-05 { margin-bottom: 5px; }
  .mb-1 { margin-bottom: 10px; }
  .ml-1 { margin-left: 10px; }
</style>