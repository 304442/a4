<script>
  import { plannerStore } from '../lib/store.svelte.js';
  import { onMount } from 'svelte';
  
  // State variables
  let url = $state(window.location.origin);
  let username = $state('admin@example.com');
  let password = $state('unifiedpassword');
  let showPassword = $state(false);
  let showHelp = $state(false);
  
  // Progress and status
  let setupProgress = $state(0);
  let setupStats = $state({
    collections: 0,
    fields: 0,
    seeds: 0,
    health: '❓'
  });
  
  // Button states
  let buttonsEnabled = $state({
    validate: true,
    setup: true,
    schema: true,
    seed: true
  });
  
  // Validation states
  let validation = $state({
    collections: { valid: true, message: 'Ready' },
    seeds: { valid: true, message: 'Ready' }
  });
  
  // Editor content
  let collectionsJSON = $state('');
  let seedsJSON = $state('');
  
  // Output log
  let outputLog = $state([]);
  
  // Test status
  let testStatus = $state('');
  let isTesting = $state(false);
  let isRunning = $state(false);
  
  function closeModal(reload = false) {
    plannerStore.showSetupModal = false;
    // Remove the setup notification if it exists
    const notification = document.querySelector('.setup-notification');
    if (notification) notification.remove();
    
    // Reload page after successful setup to properly initialize the app
    if (reload) {
      window.location.reload();
    }
  }
  
  function log(msg, type = 'i') {
    const time = new Date().toLocaleTimeString();
    const typeMap = { e: 'error', s: 'success', w: 'warning', i: 'info' };
    outputLog = [...outputLog, { time, msg, type: typeMap[type] || 'info' }];
    
    // Auto scroll output
    setTimeout(() => {
      const output = document.getElementById('setup-output');
      if (output) output.scrollTop = output.scrollHeight;
    }, 10);
  }
  
  function setProgress(percent, message) {
    setupProgress = percent;
    if (message) log(message, 'i');
  }
  
  function updateStats() {
    try {
      const collections = JSON.parse(collectionsJSON);
      const seeds = JSON.parse(seedsJSON);
      
      setupStats.collections = collections.length;
      setupStats.fields = collections.reduce((sum, c) => sum + (c.fields?.length || 0), 0);
      setupStats.seeds = seeds.reduce((sum, s) => sum + (s.records?.length || 0), 0);
    } catch (e) {
      // Keep current stats on parse error
    }
  }
  
  function validateJSON(text, type) {
    try {
      const data = JSON.parse(text);
      
      // Validate structure based on type
      if (type === 'collections') {
        return validateCollectionStructure(data);
      } else if (type === 'seeds') {
        return validateSeedStructure(data);
      }
      
      return { valid: true, message: 'Valid JSON', data };
    } catch (e) {
      const match = e.message.match(/position (\d+)/);
      const pos = match ? ` at position ${match[1]}` : '';
      return { valid: false, message: `Invalid JSON${pos}` };
    }
  }
  
  function validateCollectionStructure(data) {
    if (!Array.isArray(data)) {
      return { valid: false, message: 'Collections must be an array' };
    }
    
    for (let i = 0; i < data.length; i++) {
      const collection = data[i];
      
      // Check required collection properties
      if (!collection.name) {
        return { valid: false, message: `Collection at index ${i} missing name` };
      }
      if (!collection.type) {
        return { valid: false, message: `Collection ${collection.name} missing type` };
      }
      if (!Array.isArray(collection.fields)) {
        return { valid: false, message: `Collection ${collection.name} fields must be an array` };
      }
      
      // Validate each field
      for (let j = 0; j < collection.fields.length; j++) {
        const field = collection.fields[j];
        
        if (!field.name) {
          return { valid: false, message: `Field at index ${j} in ${collection.name} missing name` };
        }
        if (!field.type) {
          return { valid: false, message: `Field ${field.name} in ${collection.name} missing type` };
        }
        if (field.required === undefined) {
          return { valid: false, message: `Field ${field.name} in ${collection.name} missing required property` };
        }
        if (field.presentable === undefined) {
          return { valid: false, message: `Field ${field.name} in ${collection.name} missing presentable property` };
        }
        
        // Type-specific validations
        if (field.type === 'text' && field.pattern) {
          try {
            new RegExp(field.pattern);
          } catch (e) {
            return { valid: false, message: `Invalid regex pattern in field ${field.name}` };
          }
        }
        
        if (field.type === 'json' && !field.maxSize) {
          return { valid: false, message: `JSON field ${field.name} in ${collection.name} missing maxSize` };
        }
      }
    }
    
    return { valid: true, message: 'Valid collection structure', data };
  }
  
  function validateSeedStructure(data) {
    if (!Array.isArray(data)) {
      return { valid: false, message: 'Seeds must be an array' };
    }
    
    for (let i = 0; i < data.length; i++) {
      const seed = data[i];
      
      if (!seed.collection) {
        return { valid: false, message: `Seed at index ${i} missing collection name` };
      }
      if (!Array.isArray(seed.records)) {
        return { valid: false, message: `Seed for ${seed.collection} records must be an array` };
      }
      
      // Validate template records
      if (seed.collection === 'templates') {
        for (let j = 0; j < seed.records.length; j++) {
          const record = seed.records[j];
          
          if (!record.name) {
            return { valid: false, message: `Template record at index ${j} missing name` };
          }
          if (!record.structure || typeof record.structure !== 'object') {
            return { valid: false, message: `Template ${record.name} missing or invalid structure` };
          }
          
          // Validate template structure
          const structure = record.structure;
          if (!Array.isArray(structure.prayer_times)) {
            return { valid: false, message: `Template ${record.name} structure missing prayer_times array` };
          }
          if (!Array.isArray(structure.schedule)) {
            return { valid: false, message: `Template ${record.name} structure missing schedule array` };
          }
        }
      }
    }
    
    return { valid: true, message: 'Valid seed structure', data };
  }
  
  function validateCollections() {
    const result = validateJSON(collectionsJSON, 'collections');
    validation.collections = result;
    updateStats();
    return result.valid;
  }
  
  function validateSeeds() {
    const result = validateJSON(seedsJSON, 'seeds');
    validation.seeds = result;
    updateStats();
    return result.valid;
  }
  
  function clearOutput() {
    outputLog = [];
  }
  
  async function validateSetup() {
    log('Validating configuration...', 'i');
    
    if (!validateCollections()) {
      log('❌ Collection validation failed', 'e');
      return false;
    }
    
    if (!validateSeeds()) {
      log('❌ Seed validation failed', 'e');
      return false;
    }
    
    log('✅ Validation passed', 's');
    return true;
  }
  
  async function testConnection() {
    isTesting = true;
    testStatus = '';
    
    try {
      const response = await fetch(`${url}/api/health`);
      if (response.ok) {
        testStatus = 'success';
        log('✅ Connection successful', 's');
      } else {
        testStatus = 'error';
        log('❌ Connection failed', 'e');
      }
    } catch (e) {
      testStatus = 'error';
      log(`❌ Connection error: ${e.message}`, 'e');
    } finally {
      isTesting = false;
    }
  }
  
  async function runFullSetup() {
    clearOutput();
    isRunning = true;
    
    try {
      if (await runSchemaSetup() && await runSeedSetup()) {
        log('🎉 Full setup complete!', 's');
        setupStats.health = '✅';
        
        // Clear any cached templates before reload
        for (let key of Object.keys(localStorage)) {
          if (key.startsWith('template_')) {
            localStorage.removeItem(key);
          }
        }
        
        // Wait a moment before closing and reload
        setTimeout(() => {
          closeModal(true); // Pass true to reload after successful setup
        }, 2000);
      }
    } finally {
      isRunning = false;
    }
  }
  
  async function runSchemaOnly() {
    clearOutput();
    isRunning = true;
    
    try {
      await runSchemaSetup();
    } finally {
      isRunning = false;
    }
  }
  
  async function runSeedOnly() {
    clearOutput();
    isRunning = true;
    
    try {
      await runSeedSetup();
    } finally {
      isRunning = false;
    }
  }
  
  async function runSchemaSetup() {
    if (!validateCollections()) {
      log('❌ Collection validation failed', 'e');
      return false;
    }
    
    setProgress(20, 'Setting up schema...');
    
    try {
      const PocketBase = window.PocketBase;
      const setupPb = new PocketBase(url);
      await setupPb.admins.authWithPassword(username, password);
      
      const collections = JSON.parse(collectionsJSON);
      
      setProgress(40, 'Importing collections...');
      await setupPb.collections.import(collections, false);
      
      // Add template_id relation to planners if both collections exist
      const hasTemplates = collections.find(c => c.name === 'templates');
      const hasPlannersCollection = collections.find(c => c.name === 'planners');
      
      if (hasTemplates && hasPlannersCollection) {
        setProgress(70, 'Adding relations...');
        try {
          const templatesCollection = await setupPb.collections.getOne('templates');
          const plannersCollection = await setupPb.collections.getOne('planners');
          
          // Update template_id field to be a relation
          const templateFieldIndex = plannersCollection.fields.findIndex(f => f.name === 'template_id');
          
          if (templateFieldIndex !== -1) {
            const updatedFields = [...plannersCollection.fields];
            updatedFields[templateFieldIndex] = {
              name: "template_id",
              type: "relation",
              required: false,
              presentable: true,
              collectionId: templatesCollection.id,
              cascadeDelete: false,
              minSelect: 0,
              maxSelect: 1,
              displayFields: ["name", "description"]
            };
            
            await setupPb.collections.update(plannersCollection.id, {
              fields: updatedFields
            });
            
            log('✅ Updated template_id to relation field', 's');
          } else {
            log('⚠️ template_id field not found', 'w');
          }
        } catch (e) {
          log(`⚠️ Relation setup warning: ${e.message}`, 'w');
        }
      }
      
      setProgress(100, '✅ Schema setup complete');
      if (setupPb?.authStore?.isValid) setupPb.authStore.clear();
      return true;
    } catch (e) {
      log(`❌ Schema error: ${e.message}`, 'e');
      setupStats.health = '❌';
      return false;
    }
  }
  
  async function runSeedSetup() {
    if (!validateSeeds()) {
      log('❌ Seed validation failed', 'e');
      return false;
    }
    
    setProgress(10, 'Seeding data...');
    
    try {
      const PocketBase = window.PocketBase;
      const setupPb = new PocketBase(url);
      await setupPb.admins.authWithPassword(username, password);
      
      const seeds = JSON.parse(seedsJSON);
      let recordCount = 0;
      
      for (const seed of seeds) {
        if (!seed.collection || !seed.records) {
          log(`⚠️ Invalid seed format`, 'w');
          continue;
        }
        
        setProgress(30, `Seeding ${seed.collection}...`);
        
        for (const record of seed.records) {
          try {
            await setupPb.collection(seed.collection).create(record);
            recordCount++;
          } catch (e) {
            if (e.status === 400 && e.data?.data?.name?.code === 'validation_not_unique') {
              log(`ℹ️ Skipping duplicate: ${record.name || 'record'}`, 'i');
            } else {
              log(`⚠️ Seed error: ${e.message}`, 'w');
            }
          }
        }
      }
      
      setProgress(100, `✅ Seeded ${recordCount} records`);
      if (setupPb?.authStore?.isValid) setupPb.authStore.clear();
      return true;
    } catch (e) {
      log(`❌ Seed error: ${e.message}`, 'e');
      return false;
    }
  }
  
  function resetSetup() {
    if (confirm('Reset all setup fields to defaults?')) {
      clearOutput();
      url = window.location.origin;
      username = 'admin@example.com';
      password = 'unifiedpassword';
      initializeDefaults();
      log('🔄 Reset to defaults', 'i');
    }
  }
  
  function getDefaultCollections() {
    return [
      {
        name: "templates",
        type: "base",
        fields: [
          { name: "name", type: "text", required: true, presentable: true, min: 1, max: 50 },
          { name: "description", type: "text", required: false, presentable: false, max: 200 },
          { name: "is_default", type: "bool", required: false, presentable: false },
          { name: "version", type: "number", required: false, presentable: false, min: 1, noDecimal: true },
          { name: "structure", type: "json", required: true, presentable: false, maxSize: 5242880 }
        ],
        indexes: ["CREATE UNIQUE INDEX idx_templates_name ON templates (name)"],
        listRule: "",
        viewRule: "",
        createRule: null,
        updateRule: null,
        deleteRule: null
      },
      {
        name: "planners",
        type: "base",
        fields: [
          { name: "week_id", type: "text", required: true, presentable: true, pattern: "^\\d{4}-W(0[1-9]|[1-4]\\d|5[0-3])$", min: 8, max: 8 },
          { name: "template_id", type: "text", required: false, presentable: true, max: 50 },
          { name: "title", type: "text", required: false, presentable: false, max: 100 },
          { name: "city", type: "text", required: false, presentable: false, max: 50 },
          { name: "date_range", type: "text", required: false, presentable: false, max: 20 },
          { name: "prayer_times", type: "json", required: false, presentable: false, maxSize: 2048 },
          { name: "schedule_data", type: "json", required: false, presentable: false, maxSize: 1048576 },
          { name: "tasks_data", type: "json", required: false, presentable: false, maxSize: 524288 },
          { name: "workout_data", type: "json", required: false, presentable: false, maxSize: 262144 },
          { name: "meals_data", type: "json", required: false, presentable: false, maxSize: 131072 },
          { name: "grocery_data", type: "json", required: false, presentable: false, maxSize: 131072 },
          { name: "measurements_data", type: "json", required: false, presentable: false, maxSize: 65536 },
          { name: "financials_data", type: "json", required: false, presentable: false, maxSize: 65536 }
        ],
        indexes: ["CREATE UNIQUE INDEX idx_planners_week_id ON planners (week_id)"],
        listRule: "",
        viewRule: "",
        createRule: "",
        updateRule: "",
        deleteRule: ""
      }
    ];
  }
  
  function getDefaultSeeds() {
    return [
      {
        collection: "templates",
        records: [
          {
            name: "default",
            description: "Default weekly planner template with all sections",
            is_default: true,
            version: 5,
            structure: {
              prayer_times: [
                { label: "Q", value: "4:30AM" },
                { label: "F", value: "5:30AM" },
                { label: "D", value: "12:30PM" },
                { label: "A", value: "3:45PM" },
                { label: "M", value: "6:30PM" },
                { label: "I", value: "8:00PM" }
              ],
              schedule: [
                {
                  name: "QIYAM",
                  activities: [
                    { name: "DAILY: Wakeup early", max_per_day: 1, max_score: 7 },
                    { name: "DAILY: Qiyam/Tahajjud", max_per_day: 1, max_score: 7 },
                    { name: "DAILY: Nutty Pudding", max_per_day: 1, max_score: 7 }
                  ]
                },
                {
                  name: "FAJR",
                  activities: [
                    { name: "DAILY: Fajr prayer", max_per_day: 1, max_score: 7 },
                    { name: "DAILY: Quran - 1 Juz", max_per_day: 1, max_score: 7 },
                    { name: "DAILY: 5min Cold Shower", max_per_day: 1, max_score: 7 }
                  ]
                },
                {
                  name: "7AM - 9AM",
                  activities: [
                    { name: "MON/THU: COMMUTE", days: ["mon", "thu"], max_per_day: 1, max_score: 2 },
                    { name: "TUE/WED/FRI: Reading/Study (book/course/skill)", days: ["tue", "wed", "fri"], max_per_day: 1, max_score: 3 },
                    { name: "SAT: Errands, Grocery shopping, Meal prep", days: ["sat"], max_per_day: 3, max_score: 3 },
                    { name: "SUN: House cleaning, laundry", days: ["sun"], max_per_day: 2, max_score: 2 }
                  ]
                },
                {
                  name: "9AM - 5PM",
                  activities: [
                    { name: "MON-FRI: Work", days: ["mon", "tue", "wed", "thu", "fri"], max_per_day: 1, max_score: 5 },
                    { name: "DAILY: ZeroInbox (E1, E2, E3, E4, LI, Slack)", max_per_day: 1, max_score: 30 },
                    { name: "SAT/SUN: Nature time / Outdoor Activity / Adventure", days: ["sat", "sun"], max_per_day: 1, max_score: 2 }
                  ]
                },
                {
                  name: "DHUHR",
                  activities: [
                    { name: "DAILY: Dhuhr prayer", max_per_day: 1, max_score: 7 },
                    { name: "TUE/WED/FRI: Sun walk (30-45 minutes)", days: ["tue", "wed", "fri"], max_per_day: 1, max_score: 3 },
                    { name: "FRI: £10 Sadaqa", days: ["fri"], max_per_day: 1, max_score: 1 }
                  ]
                },
                {
                  name: "ASR",
                  activities: [
                    { name: "DAILY: Asr prayer", max_per_day: 1, max_score: 7 }
                  ]
                },
                {
                  name: "5PM - 6:30PM",
                  activities: [
                    { name: "MON/THU: COMMUTE", days: ["mon", "thu"], max_per_day: 1, max_score: 2 },
                    { name: "TUE/WED/FRI: Workout", days: ["tue", "wed", "fri"], max_per_day: 1, max_score: 3 },
                    { name: "TUE/WED/FRI: Third Meal", days: ["tue", "wed", "fri"], max_per_day: 1, max_score: 3 }
                  ]
                },
                {
                  name: "6:30PM - ISHA",
                  activities: [
                    { name: "MON/TUE/WED/THU: Personal", days: ["mon", "tue", "wed", "thu"], max_per_day: 1, max_score: 4 },
                    { name: "DAILY: Family/Friends/Date calls(M, WA, Phone)", max_per_day: 1, max_score: 12 },
                    { name: "FRI/SAT/SUN: Family/Friends/Date visits/outings/activities", days: ["fri", "sat", "sun"], max_per_day: 1, max_score: 9 }
                  ]
                },
                {
                  name: "MAGHRIB",
                  activities: [
                    { name: "DAILY: Maghrib prayer", max_per_day: 1, max_score: 7 },
                    { name: "DAILY: Super Veggie", max_per_day: 1, max_score: 7 }
                  ]
                },
                {
                  name: "ISHA",
                  activities: [
                    { name: "DAILY: Isha prayer", max_per_day: 1, max_score: 7 },
                    { name: "DAILY: Sleep early", max_per_day: 1, max_score: 7 }
                  ]
                },
                {
                  name: "ALLDAY",
                  activities: [
                    { name: "DAILY: No Doomscrolling; (FB, YTB, LKDN, & IG)", max_per_day: 4, max_score: 28 },
                    { name: "DAILY: No Fap; (P, & M)", max_per_day: 2, max_score: 14 },
                    { name: "DAILY: No Processed; (Sugar, RefinedFlour, SeedOils, Soda, FastFood)", max_per_day: 5, max_score: 35 },
                    { name: "MON/THU: Fasting", days: ["mon", "thu"], max_per_day: 1, max_score: 2 },
                    { name: "DAILY: Expense Tracker <25", max_per_day: 0, max_score: 0 }
                  ]
                },
                {
                  name: "TOTAL",
                  activities: [
                    { name: "DAILY POINTS", max_per_day: 0, max_score: 247 }
                  ]
                }
              ],
              tasks: {
                count: 15,
                fields: ["priority", "description", "tag", "start_date", "expected_date", "actual_date", "completed"]
              },
              workout: [
                {
                  name: "TUESDAY",
                  exercises: [
                    { name: "Incline Dumbbell Press", default_weight: 30, default_sets: 3, default_reps: 12 },
                    { name: "Barbell Squats", default_weight: 80, default_sets: 3, default_reps: 8 },
                    { name: "DB Chest-Supported Row", default_weight: 25, default_sets: 3, default_reps: 12 },
                    { name: "Leg Curls", default_weight: 40, default_sets: 3, default_reps: 12 },
                    { name: "SS: Incline DB Curls", default_weight: 15, default_sets: 3, default_reps: 12 },
                    { name: "SS: Tricep Extensions", default_weight: 20, default_sets: 3, default_reps: 12 }
                  ]
                },
                {
                  name: "WEDNESDAY",
                  exercises: [
                    { name: "Barbell Bench Press", default_weight: 70, default_sets: 3, default_reps: 6 },
                    { name: "Romanian Deadlift", default_weight: 90, default_sets: 3, default_reps: 8 },
                    { name: "Lat Pulldown", default_weight: 60, default_sets: 3, default_reps: 12 },
                    { name: "Walking Lunges", default_weight: 20, default_sets: 3, default_reps: 12 },
                    { name: "SS: Cable Lateral Raises", default_weight: 10, default_sets: 3, default_reps: 15 },
                    { name: "SS: Reverse Crunches", default_weight: 0, default_sets: 3, default_reps: 15 }
                  ]
                },
                {
                  name: "FRIDAY",
                  exercises: [
                    { name: "Seated DB Shoulder Press", default_weight: 20, default_sets: 3, default_reps: 12 },
                    { name: "Dumbbell Row", default_weight: 25, default_sets: 3, default_reps: 12 },
                    { name: "Barbell Hip Thrust", default_weight: 100, default_sets: 3, default_reps: 15 },
                    { name: "Leg Extensions", default_weight: 50, default_sets: 3, default_reps: 12 },
                    { name: "Seated Chest Flyes", default_weight: 15, default_sets: 3, default_reps: 12 },
                    { name: "SS: Standing Calf Raises", default_weight: 30, default_sets: 3, default_reps: 20 },
                    { name: "SS: Reverse Cable Flyes", default_weight: 10, default_sets: 3, default_reps: 15 }
                  ]
                }
              ],
              meals: [
                {
                  name: "Nutty Pudding",
                  ingredients: "Berries ½c, Cherries 3, Pomegranate Juice 2oz, Macadamia nuts (raw) 45g, Walnuts (raw) 5g, Cocoa 1t, Brazil Nuts ¼, Milk 50-100ml, Chia Seeds 2T, Flax (ground, refr) 1t, Lecithin 1t, Ceylon Cinnamon ½t"
                },
                {
                  name: "Super Veggie",
                  ingredients: "Broccoli 250g, Cauliflower 150g, Mushrooms 50g, Garlic 1 clove, Ginger 3g, Cumin 1T, Black Lentils 45g, Hemp Seeds 1T, Apple Cider Vinegar 1T"
                },
                {
                  name: "Third Meal",
                  ingredients: "Sweet Potato 350-400g, Protein 100-150g, Grape Tomatoes 12, Avocado ½, Radishes 4, Cilantro ¼c, Lemon 1, Jalapeño (lg) 1, Chili Powder 1t"
                }
              ],
              grocery: {
                categories: [
                  {
                    name: "Produce",
                    items: "Broccoli 1.75kg, Cauliflower 1.05kg, Mushrooms 350g, Garlic 1 bulb, Ginger 1pc, Sweet Potato 2.8kg, Grape Tomatoes 84, Avocados (ripe) 4, Radishes 28, Cilantro 2-3 bunch"
                  },
                  {
                    name: "Fruits & Protein",
                    items: "Lemons 7, Jalapeños (lg) 7, Berries 3.5c, Cherries 21, Black Lentils 315g, Protein 1.05kg, Milk (fortified) 1L"
                  }
                ]
              },
              measurements: [
                { name: "Weight", placeholder: "75kg" },
                { name: "Chest", placeholder: "42in" },
                { name: "Waist", placeholder: "34in" },
                { name: "Hips", placeholder: "36in" },
                { name: "Arms", placeholder: "15in" },
                { name: "Thighs", placeholder: "24in" }
              ],
              financials: [
                { name: "Rent", placeholder: "850", account: "Cash" },
                { name: "Allowance", placeholder: "850", account: "Revolut" },
                { name: "Savings", placeholder: "3800", account: "HSBCUK" }
              ],
              city_default: "London"
            }
          }
        ]
      }
    ];
  }
  
  function initializeDefaults() {
    collectionsJSON = JSON.stringify(getDefaultCollections(), null, 2);
    seedsJSON = JSON.stringify(getDefaultSeeds(), null, 2);
    updateStats();
    validateCollections();
    validateSeeds();
  }
  
  onMount(() => {
    initializeDefaults();
  });
</script>

<div class="setup-modal-overlay" onclick={(e) => e.target === e.currentTarget && closeModal()}>
  <div class="setup-modal-content">
    <div class="setup-container">
      <!-- Stats Bar -->
      <div class="setup-stats">
        <div class="setup-stat">
          <span class="setup-stat-val">{setupStats.collections}</span>
          Collections
        </div>
        <div class="setup-stat">
          <span class="setup-stat-val">{setupStats.fields}</span>
          Fields
        </div>
        <div class="setup-stat">
          <span class="setup-stat-val">{setupStats.seeds}</span>
          Seeds
        </div>
        <div class="setup-stat">
          <span class="setup-stat-val">{setupStats.health}</span>
          Health
        </div>
      </div>
      
      <!-- Progress Bar -->
      <div class="setup-progress">
        <div class="setup-progress-fill" style="width: {setupProgress}%"></div>
      </div>
      
      <!-- Connection Configuration -->
      <div class="setup-row">
        <div class="setup-col">
          <label for="setup-url">PocketBase URL:</label>
          <input id="setup-url" bind:value={url} placeholder="http://localhost:8090">
        </div>
        <div class="setup-col">
          <label for="setup-email">Admin Email:</label>
          <input id="setup-email" bind:value={username} placeholder="admin@example.com">
        </div>
        <div class="setup-col">
          <label for="setup-pass">Password:</label>
          <div style="position:relative;">
            <input 
              id="setup-pass" 
              type={showPassword ? 'text' : 'password'} 
              bind:value={password}
              style="padding-right: 30px;"
            >
            <button 
              type="button" 
              onclick={() => showPassword = !showPassword} 
              class="setup-pass-toggle"
            >
              {showPassword ? '🙈' : '👁️'}
            </button>
          </div>
        </div>
      </div>
      
      <!-- Action Buttons -->
      <div class="setup-row">
        <button onclick={testConnection} disabled={isTesting || isRunning}>
          {isTesting ? '⏳' : '🔌'} Test Connection
        </button>
        <button onclick={validateSetup} disabled={isRunning || !buttonsEnabled.validate}>
          ✅ Validate
        </button>
        <button onclick={runFullSetup} disabled={isRunning || !buttonsEnabled.setup}>
          🚀 Full Setup
        </button>
        <button onclick={runSchemaOnly} disabled={isRunning || !buttonsEnabled.schema}>
          📋 Schema Only
        </button>
        <button onclick={runSeedOnly} disabled={isRunning || !buttonsEnabled.seed}>
          🌱 Seed Only
        </button>
        <button onclick={() => showHelp = true}>
          📚 Help & Docs
        </button>
      </div>
      
      <div class="setup-row">
        <button onclick={resetSetup} class="setup-danger" disabled={isRunning}>
          🗑️ Reset
        </button>
        <button onclick={closeModal}>
          ❌ Close
        </button>
      </div>
      
      <!-- Editors -->
      <div class="setup-row">
        <div class="setup-col">
          <h2>📋 Collections Schema</h2>
          <textarea 
            bind:value={collectionsJSON} 
            class="setup-editor" 
            placeholder="Collections JSON..."
            oninput={validateCollections}
            disabled={isRunning}
          ></textarea>
          <div 
            class="setup-status" 
            class:setup-valid={validation.collections.valid}
            class:setup-invalid={!validation.collections.valid}
          >
            {validation.collections.message}
          </div>
        </div>
        <div class="setup-col">
          <h2>🌱 Seed Data</h2>
          <textarea 
            bind:value={seedsJSON} 
            class="setup-editor" 
            placeholder="Seed data JSON..."
            oninput={validateSeeds}
            disabled={isRunning}
          ></textarea>
          <div 
            class="setup-status"
            class:setup-valid={validation.seeds.valid}
            class:setup-invalid={!validation.seeds.valid}
          >
            {validation.seeds.message}
          </div>
        </div>
      </div>
      
      <!-- Output Console -->
      <div id="setup-output" class="setup-output">
        {#each outputLog as entry}
          <div class="log-{entry.type}">
            [{entry.time}] {entry.msg}
          </div>
        {/each}
      </div>
    </div>
  </div>
</div>

<!-- Help Modal -->
{#if showHelp}
<div 
  class="setup-modal-overlay" 
  onclick={(e) => e.target === e.currentTarget && (showHelp = false)}
  style="z-index: 11000;"
>
  <div class="setup-help-content">
    <button onclick={() => showHelp = false} class="setup-help-close">
      ✕ Close
    </button>
    
    <h1>📚 PocketBase Schema Reference</h1>
    
    <h2>🔧 Field Types & Properties</h2>
    
    <h3>Text Fields</h3>
    <pre>{`{
  "name": "title",
  "type": "text",
  "required": true,
  "presentable": true,
  "min": 1,                // Minimum length
  "max": 100,              // Maximum length
  "pattern": "^[A-Z].*"    // Regex pattern
}`}</pre>

    <h3>Number Fields</h3>
    <pre>{`{
  "name": "age",
  "type": "number",
  "required": false,
  "presentable": false,
  "min": 0,                // Minimum value
  "max": 150,              // Maximum value
  "noDecimal": true        // Integer only
}`}</pre>

    <h3>Boolean Fields</h3>
    <pre>{`{
  "name": "is_active",
  "type": "bool",
  "required": false,
  "presentable": false
}`}</pre>

    <h3>JSON Fields</h3>
    <pre>{`{
  "name": "metadata",
  "type": "json",
  "required": false,
  "presentable": false,
  "maxSize": 2097152       // Max size in bytes (2MB)
}`}</pre>

    <h3>Relation Fields</h3>
    <pre>{`{
  "name": "template_id",
  "type": "relation",
  "required": true,
  "presentable": true,
  "collectionId": "xyz123",     // Target collection ID
  "cascadeDelete": false,       // Delete this when related deleted
  "minSelect": 1,               // Minimum selections
  "maxSelect": 1,               // Maximum selections (1 = single)
  "displayFields": ["name"]     // Fields to show in UI
}`}</pre>

    <h2>📊 Required Collections</h2>
    
    <h3>Templates Collection</h3>
    <p>Stores planner structure templates:</p>
    <pre>{`{
  "name": "templates",
  "type": "base",
  "fields": [
    {
      "name": "name",
      "type": "text",
      "required": true,
      "presentable": true,
      "min": 1,
      "max": 50
    },
    {
      "name": "description",
      "type": "text",
      "required": false,
      "presentable": false,
      "max": 200
    },
    {
      "name": "is_default",
      "type": "bool",
      "required": false,
      "presentable": false
    },
    {
      "name": "version",
      "type": "number",
      "required": false,
      "presentable": false,
      "min": 1,
      "noDecimal": true
    },
    {
      "name": "structure",
      "type": "json",
      "required": true,
      "presentable": false,
      "maxSize": 5242880  // 5MB
    }
  ]
}`}</pre>

    <h3>Planners Collection</h3>
    <p>Stores weekly planner data:</p>
    <pre>{`{
  "name": "planners",
  "type": "base",
  "fields": [
    {
      "name": "week_id",
      "type": "text",
      "required": true,
      "presentable": true,
      "pattern": "^\\\\d{4}-W(0[1-9]|[1-4]\\\\d|5[0-3])$",
      "min": 8,
      "max": 8
    },
    {
      "name": "template_id",
      "type": "text",  // Converted to relation after creation
      "required": false,
      "presentable": true,
      "max": 50
    },
    // ... other fields (title, city, prayer_times, etc.)
  ]
}`}</pre>

    <h2>📋 Collection Properties</h2>
    <pre>{`{
  "name": "planners",              // Collection name (a-z, 0-9, _)
  "type": "base",                  // "base" or "auth"
  "listRule": "",                  // API rules (see below)
  "viewRule": "",
  "createRule": "",
  "updateRule": "",
  "deleteRule": "",
  "indexes": [                     // SQL indexes for performance
    "CREATE INDEX idx_week ON planners (week_id)"
  ],
  "fields": [...]                  // Array of field definitions
}`}</pre>

    <h2>🔒 API Rules</h2>
    <p>Rules control who can access records via API. Common patterns:</p>
    
    <h3>Public Access</h3>
    <pre>{`{
  "listRule": "",          // Empty string = public access
  "viewRule": "",          // Anyone can read
  "createRule": null,      // null = admin only
  "updateRule": null,      // No public updates
  "deleteRule": null       // No public deletes
}`}</pre>

    <h3>Authenticated Users</h3>
    <pre>{`{
  "listRule": "@request.auth.id != ''",    // Any logged in user
  "viewRule": "@request.auth.id != ''",    
  "createRule": "@request.auth.id != ''",  
  "updateRule": "@request.auth.id != ''",  
  "deleteRule": "@request.auth.id != ''"   
}`}</pre>

    <h3>Owner Only Access</h3>
    <pre>{`{
  "listRule": "user = @request.auth.id",     // List own records only
  "viewRule": "user = @request.auth.id",     // View own records only
  "createRule": "@request.auth.id != ''",    // Any auth user can create
  "updateRule": "user = @request.auth.id",   // Update own records only
  "deleteRule": "user = @request.auth.id"    // Delete own records only
}`}</pre>

    <h2>🌱 Seed Data Structure</h2>
    <p>Seeds must follow this format:</p>
    <pre>{`[
  {
    "collection": "templates",
    "records": [
      {
        "name": "default",
        "description": "Default weekly planner template",
        "is_default": true,
        "version": 5,
        "structure": {
          "prayer_times": [
            { "label": "Q", "value": "4:30AM" },
            { "label": "F", "value": "5:30AM" },
            // ... more prayer times
          ],
          "schedule": [
            {
              "name": "QIYAM",
              "activities": [
                { 
                  "name": "DAILY: Wakeup early", 
                  "max_per_day": 1, 
                  "max_score": 7 
                },
                // ... more activities
              ]
            },
            // ... more schedule sections
          ],
          "tasks": {
            "count": 15,
            "fields": ["num", "priority", "tag", "description", ...]
          },
          "workout": [...],
          "meals": [...],
          "grocery": { "categories": [...] },
          "measurements": [...],
          "financials": [...],
          "city_default": "London"
        }
      }
    ]
  }
]`}</pre>

    <h2>❌ CRITICAL ERRORS TO AVOID</h2>
    
    <h3>🚫 NEVER Use These Patterns (DEPRECATED)</h3>
    <pre class="error-example">{`// ❌ WRONG: Nested options structure (old PocketBase version)
{
  "name": "title",
  "type": "text",
  "required": true,
  "options": {              // ❌ DON'T USE "options" wrapper
    "max": 100,
    "min": 1
  }
}

// ❌ WRONG: Schema key instead of fields
{
  "name": "posts",
  "schema": [...]           // ❌ DON'T USE "schema" key
}

// ❌ WRONG: Invalid field names
{
  "name": "field name",     // ❌ No spaces
  "name": "field-name",     // ❌ No hyphens
  "name": "123field",       // ❌ Can't start with number
  "name": "id",             // ❌ Reserved name
}`}</pre>

    <h3>✅ CORRECT Patterns (Current PocketBase)</h3>
    <pre class="success-example">{`// ✅ CORRECT: Direct properties
{
  "name": "title",
  "type": "text",
  "required": true,
  "presentable": true,
  "max": 100,               // ✅ Direct property
  "min": 1                  // ✅ Direct property
}

// ✅ CORRECT: Fields key
{
  "name": "posts",
  "fields": [...]           // ✅ Use "fields" key
}

// ✅ CORRECT: Valid field names
{
  "name": "field_name",     // ✅ Underscores OK
  "name": "fieldName",      // ✅ camelCase OK
  "name": "field123"        // ✅ Numbers at end OK
}`}</pre>

    <h2>💡 Pro Tips</h2>
    <ul>
      <li>Always include <code>type</code>, <code>required</code>, and <code>presentable</code> for every field</li>
      <li>Use <code>indexes</code> for fields you'll search/filter frequently</li>
      <li>JSON fields are powerful but can't be indexed - use wisely</li>
      <li>Test your API rules thoroughly before production</li>
      <li>Keep field names simple: lowercase, no spaces, underscores OK</li>
      <li>Set reasonable <code>maxSize</code> limits on JSON fields</li>
      <li>Use <code>pattern</code> for email, phone, or custom validation</li>
      <li>Remember: empty string "" = public access, null = admin only</li>
    </ul>

    <h2>🔍 Quick Validation Checklist</h2>
    <ol>
      <li>✓ Every field has: name, type, required, presentable</li>
      <li>✓ Collection has: name, type, fields array</li>
      <li>✓ No "options" wrapper on field properties</li>
      <li>✓ No spaces or hyphens in field names</li>
      <li>✓ API rules are either "", null, or valid expressions</li>
      <li>✓ JSON is valid (no trailing commas, proper quotes)</li>
    </ol>
  </div>
</div>
{/if}

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
    max-width: 1400px;
    height: 90vh;
    max-height: 800px;
    overflow-y: auto;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  }

  .setup-container {
    padding: 20px;
    font-family: monospace;
    font-size: 11px;
    line-height: 1.4;
    color: #333;
  }

  .setup-container h2 {
    font-size: 12px;
    font-weight: 600;
    margin: 10px 0 5px 0;
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
    font-family: monospace;
  }

  .setup-container button:disabled {
    background: #ccc;
    cursor: not-allowed;
  }

  .setup-container button:hover:not(:disabled) {
    background: #0056b3;
  }

  .setup-danger {
    background: #6c757d !important;
  }

  .setup-danger:hover:not(:disabled) {
    background: #5a6268 !important;
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

  .setup-pass-toggle:hover {
    background: #e9ecef !important;
  }

  .setup-row {
    display: flex;
    gap: 10px;
    margin: 10px 0;
    justify-content: center;
  }

  .setup-col {
    flex: 1;
  }

  .setup-editor {
    width: 100%;
    min-height: 200px;
    font-family: monospace;
    font-size: 10px;
    border: 1px solid #ccc;
    border-radius: 3px;
    padding: 6px;
    resize: vertical;
  }

  .setup-editor:focus {
    outline: none;
    border-color: #007bff;
  }

  .setup-editor:disabled {
    background-color: #f8f9fa;
    color: #6c757d;
  }

  .setup-container input {
    width: 100%;
    padding: 4px 6px;
    border: 1px solid #ccc;
    border-radius: 3px;
    font-size: 11px;
    font-family: monospace;
  }

  .setup-container input:focus {
    outline: none;
    border-color: #007bff;
  }

  .setup-container label {
    display: block;
    font-weight: 600;
    font-size: 10px;
    margin-bottom: 2px;
    color: #555;
  }

  .setup-status {
    padding: 4px 8px;
    border-radius: 3px;
    font-size: 10px;
    margin-top: 5px;
    display: inline-block;
  }

  .setup-valid {
    background: #d4edda;
    color: #155724;
  }

  .setup-invalid {
    background: #f8d7da;
    color: #721c24;
  }

  .setup-warning {
    background: #fff3cd;
    color: #856404;
  }

  .setup-stats {
    display: flex;
    gap: 20px;
    padding: 10px;
    background: #f8f9fa;
    border-radius: 5px;
    margin-bottom: 10px;
    justify-content: center;
  }

  .setup-stat {
    text-align: center;
  }

  .setup-stat-val {
    font-weight: bold;
    font-size: 16px;
    display: block;
    color: #007bff;
  }

  .setup-output {
    margin-top: 15px;
    padding: 10px;
    background: #1e1e1e;
    color: #d4d4d4;
    border-radius: 5px;
    font-family: 'Consolas', 'Monaco', monospace;
    font-size: 11px;
    max-height: 250px;
    overflow-y: auto;
    line-height: 1.4;
  }

  .setup-output:empty::before {
    content: "Console output will appear here...";
    color: #666;
  }

  .log-error {
    color: #ff6b6b;
  }

  .log-success {
    color: #51cf66;
  }

  .log-warning {
    color: #ffd43b;
  }

  .log-info {
    color: #74c0fc;
  }

  .setup-progress {
    width: 100%;
    height: 4px;
    background: #e9ecef;
    border-radius: 2px;
    margin: 10px 0;
    overflow: hidden;
  }

  .setup-progress-fill {
    height: 100%;
    background: #007bff;
    transition: width 0.3s ease;
  }

  /* Help Modal Styles */
  .setup-help-content {
    background: white;
    margin: 2% auto;
    padding: 30px;
    width: 95%;
    max-width: 1200px;
    border-radius: 8px;
    max-height: 90vh;
    overflow-y: auto;
    font-size: 12px;
    line-height: 1.6;
    position: relative;
  }

  .setup-help-close {
    position: absolute;
    top: 15px;
    right: 15px;
    background: #f8f9fa !important;
    border: 1px solid #dee2e6 !important;
    padding: 8px 15px !important;
    color: #333 !important;
  }

  .setup-help-content h1 {
    font-size: 20px;
    margin-bottom: 20px;
    color: #333;
  }

  .setup-help-content h2 {
    font-size: 16px;
    margin: 25px 0 15px 0;
    color: #444;
    border-bottom: 1px solid #eee;
    padding-bottom: 5px;
  }

  .setup-help-content h3 {
    font-size: 14px;
    margin: 15px 0 10px 0;
    color: #555;
  }

  .setup-help-content pre {
    background: #f8f9fa;
    padding: 15px;
    border-radius: 5px;
    margin: 10px 0;
    overflow-x: auto;
    border: 1px solid #e9ecef;
    font-size: 11px;
  }

  .setup-help-content .error-example {
    background: #ffebee;
    border-color: #ffcdd2;
    color: #c62828;
  }

  .setup-help-content .success-example {
    background: #e8f5e9;
    border-color: #c8e6c9;
    color: #2e7d32;
  }

  .setup-help-content ul, .setup-help-content ol {
    margin: 10px 0;
    padding-left: 25px;
  }

  .setup-help-content li {
    margin: 5px 0;
  }

  .setup-help-content code {
    background: #f0f0f0;
    padding: 2px 6px;
    border-radius: 3px;
    font-size: 11px;
    color: #d73a49;
  }

  .setup-help-content p {
    margin: 10px 0;
  }

  /* Mobile responsiveness */
  @media (max-width: 768px) {
    .setup-modal-content {
      max-width: 100%;
      height: 100vh;
      max-height: 100vh;
      border-radius: 0;
    }
    
    .setup-row {
      flex-direction: column;
    }
    
    .setup-col {
      width: 100%;
    }

    .setup-stats {
      flex-wrap: wrap;
      gap: 10px;
    }

    .setup-help-content {
      margin: 0;
      height: 100vh;
      max-height: 100vh;
      border-radius: 0;
    }
  }

  @media print {
    .setup-modal-overlay {
      display: none !important;
    }
  }
</style>