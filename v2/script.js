// --- Utility Functions ---
function deepCopy(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj);
  if (Array.isArray(obj)) return obj.map(deepCopy);
  const copiedObject = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      copiedObject[key] = deepCopy(obj[key]);
    }
  }
  return copiedObject;
}

function generateId(prefix = 'id_') {
  return prefix + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

// --- Alpine.js Application ---
function plannerApp() {
  const PB_BASE_URL = '/'; 
  const pb = new PocketBase(PB_BASE_URL);
  pb.autoCancellation(false);

  let isInitializing = true;
  let lastSavedState = null;
  let appDefaults = null; 

  const DefaultDataManager = {
    configKey: "default_v1",
    data: null,
    error: null,

    async fetch() {
      this.error = null; // Reset error state
      try {
        this.data = await pb.collection('app_config').getFirstListItem(`config_key="${this.configKey}"`);
        if (!this.data) {
          this.error = "Default application configuration (app_config) not found in PocketBase.";
          throw new Error(this.error);
        }
        console.log("App defaults fetched successfully:", this.data);
      } catch (error) {
        console.error("Fatal Error: Could not initialize app defaults from PocketBase:", error);
        this.error = error.message || "Failed to load app settings from PocketBase.";
        this.data = null; // Ensure data is null on error
      }
      appDefaults = this.data;
      return this.data;
    },
    // Getters will now return undefined or empty structures if data is null (due to fetch error)
    getPlannerTitle: function() { return this.data?.planner_title_default; },
    getUiConfig: function() { return deepCopy(this.data?.ui_config_default); },
    getTimes: function() { return deepCopy(this.data?.times_default); },
    getSchedule: function() { 
        const schedule = deepCopy(this.data?.schedule_default);
        (schedule || []).forEach(s => (s.activities || []).forEach(a => {
            if (!a.id) a.id = generateId('act_');
            if (!a.streaks) a.streaks = { mon:0, tue:0, wed:0, thu:0, fri:0, sat:0, sun:0, current:0, longest:0 };
        }));
        return schedule;
    },
    getTasksCount: function() { return this.data?.tasks_default_count || 0; }, // Default to 0 tasks if not specified
    getWorkoutPlan: function() { 
        const plan = deepCopy(this.data?.workout_plan_default);
        (plan || []).forEach(day => (day.exercises || []).forEach(ex => { if(!ex.id) ex.id = generateId('ex_'); }));
        return plan;
    },
    getMeals: function() { 
        const meals = deepCopy(this.data?.meals_default);
        (meals || []).forEach(m => { if(!m.id) m.id = generateId('meal_'); });
        return meals;
    },
    getGroceryList: function() { 
        const list = deepCopy(this.data?.grocery_list_default);
        (list || []).forEach(cat => { if(!cat.id) cat.id = generateId('gcat_'); });
        return list;
    },
    getGroceryBudgetPlaceholder: function() { return this.data?.grocery_budget_default_placeholder; },
    getBodyMeasurements: function() { 
        const bm = deepCopy(this.data?.body_measurements_default);
        (bm || []).forEach(m => { if(!m.id) m.id = generateId('bm_');});
        return bm;
    },
    getFinancials: function() { 
        const fin = deepCopy(this.data?.financials_default);
        (fin || []).forEach(f => { if(!f.id) f.id = generateId('fin_'); });
        return fin;
    }
  };

  const CityOptionsManager = { /* ... remains the same as previous full version ... */ 
    options: [],
    async fetch() {
        try {
            const cities = await pb.collection('city_options').getFullList({ sort: 'order' });
            this.options = cities.map(c => ({
                id: c.id, name: c.name, lat: c.latitude, lon: c.longitude,
                isCurrentLocationTrigger: c.is_current_location_trigger
            }));
        } catch (error) {
            console.error("Error fetching city options:", error);
            this.options = [{ name: 'London (Fallback)', lat: 51.5074, lon: -0.1278, isCurrentLocationTrigger: false }]; // Minimal fallback for cities
        }
        return this.options;
    },
    get: function() { return this.options; }
  };
  
  const DateTimeUtils = { /* ... remains the same as previous full version ... */ 
    getCurrentIsoWeek: () => { 
        const now = new Date(); const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
        d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        const weekNum = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
        return `${d.getUTCFullYear()}-W${weekNum.toString().padStart(2, '0')}`;
    },
    parseISOWeek: (isoWeekString) => { 
        if (!/^\d{4}-W(0[1-9]|[1-4][0-9]|5[0-3])$/.test(isoWeekString)) return new Date();
        const [year, weekPart] = isoWeekString.split('-'); const week = parseInt(weekPart.substring(1));
        const simple = new Date(Date.UTC(parseInt(year), 0, 1 + (week - 1) * 7));
        const dayOfWeek = simple.getUTCDay() || 7; simple.setUTCDate(simple.getUTCDate() - dayOfWeek + 1);
        return simple;
    },
    getWeekDateRange: (date) => { 
        const start = new Date(date); const end = new Date(start);
        end.setUTCDate(start.getUTCDate() + 6);
        return `${DateTimeUtils.formatDate(start)}-${DateTimeUtils.formatDate(end)}`;
    },
    formatDate: (date) => `${(date.getUTCMonth() + 1).toString().padStart(2, '0')}/${date.getUTCDate().toString().padStart(2, '0')}`,
    formatShortDate: (index) => { const now = new Date(); now.setDate(now.getDate() + index); return `${(now.getMonth() + 1)}/${now.getDate()}`; },
    formatPrayerTime: (timeString) => {
        if (!timeString || typeof timeString !== 'string') return "";
        const time = timeString.split(" ")[0]; const [hoursStr, minutesStr] = time.split(":");
        if (!hoursStr || !minutesStr) return ""; let h = parseInt(hoursStr); let m = parseInt(minutesStr);
        if (isNaN(h) || isNaN(m) || h < 0 || h > 23 || m < 0 || m > 59) return ""; 
        const ampm = h >= 12 ? "PM" : "AM"; h = h % 12; h = h ? h : 12; 
        return `${h}:${m.toString().padStart(2, '0')}${ampm}`;
    },
    calculateQiyamTime: (fajrTime) => { 
        if (!fajrTime || typeof fajrTime !== 'string') return "";
        const fajrParts = fajrTime.split(" ")[0].split(":"); if (fajrParts.length < 2) return "";
        let fajrHour = parseInt(fajrParts[0]); let fajrMinute = parseInt(fajrParts[1]);
        if (isNaN(fajrHour) || isNaN(fajrMinute) || fajrHour < 0 || fajrHour > 23 || fajrMinute < 0 || fajrMinute > 59) return "";
        let qiyamDate = new Date(); qiyamDate.setHours(fajrHour, fajrMinute, 0, 0);
        qiyamDate.setHours(qiyamDate.getHours() - 1); 
        return `${qiyamDate.getHours().toString().padStart(2, '0')}:${qiyamDate.getMinutes().toString().padStart(2, '0')}`;
    }
  };

  return {
    // Core State
    currentWeek: '', dateRange: '', city: 'London', saveStatus: 'saved', isOnline: navigator.onLine, pendingSync: [],
    // UI State
    showNotification: false, notificationMessage: '', showCitySelector: false, showWeekSelector: false,
    dropdownPosition: { top: 0, left: 0 }, currentDay: (new Date()).getDay(),
    // Data Structures - Initialized empty, populated by init/loadWeek
    plannerTitle: 'Loading Planner...', // Initial title before defaults load
    uiConfig: {}, times: [], schedule: [], tasks: [], workoutPlan: [],
    meals: [], groceryBudget: '', groceryList: [], bodyMeasurements: [], financials: [],
    cityOptions: [], savedWeeks: [],
    saveDataTimeout: null, notificationTimeout: null,

    async init() {
      isInitializing = true;
      console.log("App init starting...");
      
      await DefaultDataManager.fetch(); // Fetches and sets appDefaults
      if (DefaultDataManager.error) {
        this.showErrorMessage(`CRITICAL: ${DefaultDataManager.error}. App may not work correctly.`);
        // App will proceed with empty/minimal data for UI structures to bind.
        this.plannerTitle = "Planner Configuration Error";
      }
      
      this.cityOptions = await CityOptionsManager.fetch();
      if (this.cityOptions.length > 0 && this.cityOptions.find(co => co.name === this.city) === undefined) {
        this.city = this.cityOptions[0]?.name || "Error City";
      }

      window.addEventListener('online', () => { this.isOnline = true; this.syncPendingData(); });
      window.addEventListener('offline', () => this.isOnline = false);
      document.addEventListener('click', e => {
        if (!e.target.closest('.dropdown') && !e.target.closest('.clickable')) {
          this.showCitySelector = this.showWeekSelector = false;
        }
      });

      this.pendingSync = JSON.parse(localStorage.getItem('planner_pending_sync') || '[]');
      this.currentWeek = DateTimeUtils.getCurrentIsoWeek();
      this.dateRange = DateTimeUtils.getWeekDateRange(DateTimeUtils.parseISOWeek(this.currentWeek));
      
      await this.loadWeek(this.currentWeek, true); 

      // Only set interval if defaults were successfully loaded and no critical error occurred
      if (appDefaults && !DefaultDataManager.error) {
          setInterval(() => { if (!isInitializing && this.hasSignificantChanges()) this.saveData(); }, 30000);
      }
      if (this.isOnline) this.syncPendingData();
      console.log("App init finished.");
    },

    applyDefaults() {
      if (!appDefaults || DefaultDataManager.error) {
        console.warn("applyDefaults: Defaults not available or error occurred during fetch. Applying minimal structure.");
        // Set empty structures to prevent Alpine errors, but UI will be mostly blank or show loading/error states
        this.plannerTitle = appDefaults?.planner_title_default || "Planner (Defaults Missing)";
        this.uiConfig = appDefaults?.ui_config_default || {};
        this.times = appDefaults?.times_default || [];
        this.schedule = appDefaults?.schedule_default || [];
        this.tasks = Array(appDefaults?.tasks_default_count || 0).fill(null).map((_,i) => ({ id: generateId('task_'), num: '', priority: '', tag: '', description: '', date: '', completed: '' }));
        this.workoutPlan = appDefaults?.workout_plan_default || [];
        this.meals = appDefaults?.meals_default || [];
        this.groceryList = appDefaults?.grocery_list_default || [];
        this.groceryBudget = ''; // Placeholder would come from ui_config or a specific default field
        this.bodyMeasurements = appDefaults?.body_measurements_default || [];
        this.financials = appDefaults?.financials_default || [];
        return;
      }
      console.log("Applying defaults from fetched app_config.");
      this.plannerTitle = DefaultDataManager.getPlannerTitle() || "Weekly Planner";
      this.uiConfig = DefaultDataManager.getUiConfig() || {}; // Ensure uiConfig is at least an empty object
      this.times = DefaultDataManager.getTimes() || [];
      this.schedule = DefaultDataManager.getSchedule() || [];
      this.tasks = Array(DefaultDataManager.getTasksCount()).fill(null).map((_,i) => ({ id: generateId('task_'), num: '', priority: '', tag: '', description: '', date: '', completed: '' }));
      this.workoutPlan = DefaultDataManager.getWorkoutPlan() || [];
      this.meals = DefaultDataManager.getMeals() || [];
      this.groceryList = DefaultDataManager.getGroceryList() || [];
      this.groceryBudget = ''; // Actual budget value is weekly; placeholder might be in uiConfig or appDefaults
      this.bodyMeasurements = DefaultDataManager.getBodyMeasurements() || [];
      this.financials = DefaultDataManager.getFinancials() || [];
    },

    populateFieldsFromSaved(savedData) {
      console.log("Populating fields from saved data:", savedData);
      // Fallback to appDefaults (which might be null/empty if DB failed)
      const fallbackTitle = appDefaults?.planner_title_default || "Weekly Planner";
      const fallbackUiConfig = appDefaults?.ui_config_default || {};
      const fallbackTimes = appDefaults?.times_default || [];
      // ... and so on for other sections

      this.plannerTitle = savedData.planner_title || fallbackTitle;
      this.uiConfig = deepCopy(savedData.ui_config || fallbackUiConfig);
      this.times = deepCopy(savedData.times_display || fallbackTimes);
      
      const fallbackSchedule = appDefaults?.schedule_default || [];
      const savedSchedule = deepCopy(savedData.schedule_data || fallbackSchedule);
      (savedSchedule || []).forEach(s => (s.activities || []).forEach(a => {
          if (!a.id) a.id = generateId('act_');
          if (!a.streaks) a.streaks = { mon:0, tue:0, wed:0, thu:0, fri:0, sat:0, sun:0, current:0, longest:0 };
      }));
      this.schedule = savedSchedule;

      const fallbackTaskCount = appDefaults?.tasks_default_count || 0;
      const taskCount = (savedData.tasks_data?.length) ? savedData.tasks_data.length : fallbackTaskCount;
      this.tasks = Array(taskCount).fill(null).map((_, i) => {
          const sTask = savedData.tasks_data?.[i];
          return {
              id: sTask?.id || generateId('task_'),
              num: this.validateValue(sTask?.num), priority: this.validateValue(sTask?.priority),
              tag: this.validateValue(sTask?.tag), description: this.validateValue(sTask?.description),
              date: this.validateValue(sTask?.date), completed: this.validateValue(sTask?.completed)
          };
      });
      
      const fallbackWorkoutPlan = appDefaults?.workout_plan_default || [];
      const savedWorkoutPlan = deepCopy(savedData.workout_plan_data || fallbackWorkoutPlan);
      (savedWorkoutPlan || []).forEach(d => (d.exercises || []).forEach(ex => { if(!ex.id) ex.id = generateId('ex_');}));
      this.workoutPlan = savedWorkoutPlan;

      const fallbackMeals = appDefaults?.meals_default || [];
      const savedMeals = deepCopy(savedData.meals_data || fallbackMeals);
      (savedMeals || []).forEach(m => { if(!m.id) m.id = generateId('meal_');});
      this.meals = savedMeals;
      
      this.groceryBudget = this.validateValue(savedData.grocery_budget || '');
      
      const fallbackGroceryList = appDefaults?.grocery_list_default || [];
      const savedGroceryList = deepCopy(savedData.grocery_list_data || fallbackGroceryList);
      (savedGroceryList || []).forEach(cat => {if(!cat.id) cat.id = generateId('gcat_');});
      this.groceryList = savedGroceryList;
      
      const fallbackBodyMeasurements = appDefaults?.body_measurements_default || [];
      const savedBodyMeasurements = deepCopy(savedData.body_measurements_data || fallbackBodyMeasurements);
      (savedBodyMeasurements || []).forEach(bm => {if(!bm.id) bm.id = generateId('bm_');});
      this.bodyMeasurements = savedBodyMeasurements;

      const fallbackFinancials = appDefaults?.financials_default || [];
      const savedFinancials = deepCopy(savedData.financials_data || fallbackFinancials);
      (savedFinancials || []).forEach(f => {if(!f.id) f.id = generateId('fin_');});
      this.financials = savedFinancials;

      this.city = savedData.city_name || this.city;
      lastSavedState = JSON.stringify(this.getCurrentDataStateForPersistence());
    },
    
    async loadWeek(isoWeek, isInitLoad = false) {
      if (!appDefaults && isInitLoad) { 
          console.log("loadWeek: appDefaults not ready, fetching (this should ideally have happened in init)...");
          await DefaultDataManager.fetch();
          if(DefaultDataManager.error) {
              this.showErrorMessage(`CRITICAL: ${DefaultDataManager.error}. Cannot load week.`);
              if(isInitLoad) isInitializing = false;
              return;
          }
          this.cityOptions = await CityOptionsManager.fetch();
          if (this.cityOptions.length > 0 && this.cityOptions.find(co => co.name === this.city) === undefined) {
                this.city = this.cityOptions[0]?.name || "Error City";
           }
      }
      if (!appDefaults) { // This check is vital if called outside init or if init's fetch failed.
          this.showErrorMessage("Critical error: App defaults are not loaded. Week load aborted.");
          if(isInitLoad) isInitializing = false;
          return;
      }

      console.log(`Loading week: ${isoWeek}, isInitLoad: ${isInitLoad}`);
      if (!/^\d{4}-W(0[1-9]|[1-4][0-9]|5[0-3])$/.test(isoWeek)) {
        this.showErrorMessage("Invalid week format"); if(isInitLoad) isInitializing = false; return;
      }
      this.showWeekSelector = false; this.currentWeek = isoWeek;
      this.dateRange = DateTimeUtils.getWeekDateRange(DateTimeUtils.parseISOWeek(isoWeek));
      let record = null;

      if (this.isOnline) {
        try { record = await pb.collection('planners').getFirstListItem(`week_id="${isoWeek}"`); }
        catch (error) { if (error.status !== 404) console.error("Pocketbase load error:", error); }
      }
      if (!record) {
        const localData = localStorage.getItem(`planner_${isoWeek}`);
        if (localData) try { record = JSON.parse(localData); } catch(e) { console.error(`Error parsing local data for ${isoWeek}:`, e); record = null;}
      }

      if (record) { this.populateFieldsFromSaved(record); }
      else { this.applyDefaults(); }

      this.calculateScores();
      // Fetch prayer times if no time values are set (either from saved or defaults)
      if (this.times.every(t => !t.value)) { 
        await this.fetchAndSetPrayerTimes();
      }
      if (isInitLoad) { isInitializing = false; console.log("Initial load process finished."); }
    },
    
    // ... [getCurrentDataStateForPersistence, saveData, hasSignificantChanges, sync logic, CRUD operations for lists] ...
    // These methods would be largely the same as the previous full script, 
    // just ensure they use the now centrally managed DefaultDataManager for any default values needed
    // during add operations, and that field names in getCurrentDataStateForPersistence match PB schema.
    // For brevity, I'll skip re-pasting all of them but they should be here from the previous version.
    // Ensure methods like addNewTask, deleteMeal, etc., use DefaultDataManager if they need to construct
    // new items based on a default template structure not fully defined by simple prompts.

    // Example:
    addNewTask() {
        // If a task had a more complex default structure from app_config:
        // const defaultTaskStructure = DefaultDataManager.getTaskTemplate();
        // this.tasks.push({ ...defaultTaskStructure, id: generateId('task_') });
        this.tasks.push({ id: generateId('task_'), num: '', priority: '', tag: '', description: '', date: '', completed: '' });
        this.saveData();
    },
    // ... (All other methods: editInline, toggleTaskCompletion, showErrorMessage, validateValue,
    //      validateTextInput, validateNumberInput, calculateScores,
    //      fetchAndSetPrayerTimes, getDevicePrayerTimes, fetchPrayerTimesForCoords, setPrayerTimesDisplay,
    //      fetchSavedWeeks, confirmLoadWeek, confirmDeleteWeek, selectCity,
    //      all add/delete methods for other sections)
    // Ensure these are all present from the previous "do all!" response.
    // The key change is that any reference to hardcoded defaults in these functions
    // should now go through `DefaultDataManager.get...()` methods.
    // For example, if `addNewActivityToSection` needs default day structures:
    addNewActivityToSection(sIdxMapped) { 
        const name = prompt("New activity name for " + (this.schedule[sIdxMapped]?.name || 'section') + ":");
        if (name?.trim() && this.schedule[sIdxMapped]) {
            // Get default day structure from appDefaults if needed, or define minimal here
            let defaultDays = {};
            const defaultScheduleItem = (DefaultDataManager.getSchedule() || [])[0]?.activities[0]?.days; // Example path
            if (defaultScheduleItem) {
                defaultDays = deepCopy(defaultScheduleItem);
                for (const day in defaultDays) defaultDays[day].value = ''; // Clear values
            } else { // Minimal fallback if complex default not found
                 ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].forEach(d => defaultDays[d] = { value: '', max: 1 });
            }

            this.schedule[sIdxMapped].activities.push({
                id: generateId('act_'), name: name.trim(),
                days: defaultDays,
                score: 0, maxScore: (appDefaults?.schedule_default?.[0]?.activities?.[0]?.maxScore || 7), 
                streaks: { mon:0, tue:0, wed:0, thu:0, fri:0, sat:0, sun:0, current:0, longest:0 }});
            this.saveData();
        }
    },
    // Ensure all other add/delete methods follow this pattern of potentially getting defaults.
    // The rest of the methods from the previous full script should be here. I'll just list them for brevity.
    deleteTask(taskIndex) { if (taskIndex >= 0 && taskIndex < this.tasks.length) { this.tasks.splice(taskIndex, 1); this.saveData();}},
    addNewMeal() { const name = prompt("New meal name:"); if (name?.trim()) { this.meals.push({ id: generateId('meal_'), name: name.trim(), ingredients: (appDefaults?.meals_default?.[0]?.ingredients || '') }); this.saveData();}},
    deleteMeal(mealIndex) { if (mealIndex >= 0 && mealIndex < this.meals.length) { this.meals.splice(mealIndex, 1); this.saveData();}},
    deleteActivity(sIdxMapped, activityId) { if (this.schedule[sIdxMapped]?.activities) { const actIdx = this.schedule[sIdxMapped].activities.findIndex(a => a.id === activityId); if (actIdx > -1) { this.schedule[sIdxMapped].activities.splice(actIdx, 1); this.saveData(); }}},
    addNewExerciseToWorkoutDay(dayIdx) { const name = prompt("New exercise name for " + (this.workoutPlan[dayIdx]?.name || 'day') + ":"); if (name?.trim() && this.workoutPlan[dayIdx]) { this.workoutPlan[dayIdx].exercises.push({ id: generateId('ex_'), prefix: '• ', name: name.trim(), weight: '', sets: '', reps: '', defaultWeight: (appDefaults?.workout_plan_default?.[0]?.exercises?.[0]?.defaultWeight || '10'), defaultSets: '3', defaultReps: '10' }); this.saveData();}},
    deleteExerciseFromWorkoutDay(dayIdx, exerciseId) { if (this.workoutPlan[dayIdx]?.exercises) { const exIdx = this.workoutPlan[dayIdx].exercises.findIndex(ex => ex.id === exerciseId); if (exIdx > -1) { this.workoutPlan[dayIdx].exercises.splice(exIdx, 1); this.saveData(); }}},
    addNewGroceryCategory() { const name = prompt("New grocery category name:"); if (name?.trim()) { this.groceryList.push({ id: generateId('gcat_'), name: name.trim(), items: (appDefaults?.grocery_list_default?.[0]?.items || '') }); this.saveData(); }},
    deleteGroceryCategory(index) { if (index >= 0 && index < this.groceryList.length) { this.groceryList.splice(index, 1); this.saveData();}},
    addNewBodyMeasurement() { const name = prompt("New measurement name:"); if (name?.trim()) { this.bodyMeasurements.push({ id: generateId('bm_'), name: name.trim(), value: '', placeholder: (appDefaults?.body_measurements_default?.[0]?.placeholder || '0') }); this.saveData(); }},
    deleteBodyMeasurement(index) { if (index >= 0 && index < this.bodyMeasurements.length) { this.bodyMeasurements.splice(index, 1); this.saveData();}},
    addNewFinancialItem() { const name = prompt("New financial item name:"); if (name?.trim()) { this.financials.push({ id: generateId('fin_'), name: name.trim(), value: '', placeholder: (appDefaults?.financials_default?.[0]?.placeholder || '0'), account: '' }); this.saveData(); }},
    deleteFinancialItem(index) { if (index >= 0 && index < this.financials.length) { this.financials.splice(index, 1); this.saveData();}}

  }; // End of Alpine component return object
} // End of plannerApp function

// No longer needed as defaults come from DB:
// function getDefaultUiConfigFallback() { ... }
