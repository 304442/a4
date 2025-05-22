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
      this.error = null;
      try {
        this.data = await pb.collection('app_config').getFirstListItem(`config_key="${this.configKey}"`);
        if (!this.data) {
          this.error = "Default application configuration (app_config) not found in PocketBase.";
          throw new Error(this.error);
        }
        console.log("App defaults fetched successfully.");
      } catch (error) {
        console.error("Fatal Error: Could not initialize app defaults from PocketBase:", error);
        this.error = error.message || "Failed to load app settings from PocketBase.";
        this.data = null; 
      }
      appDefaults = this.data;
      return this.data;
    },
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
    getTasksCount: function() { return this.data?.tasks_default_count || 0; },
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

  const CityOptionsManager = { 
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
            this.options = [{ name: 'London (Fallback)', lat: 51.5074, lon: -0.1278, isCurrentLocationTrigger: false }];
        }
        return this.options;
    },
    get: function() { return this.options; }
  };
  
  const DateTimeUtils = { 
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
    currentWeek: '', dateRange: '', city: 'London', saveStatus: 'saved', isOnline: navigator.onLine, pendingSync: [],
    showNotification: false, notificationMessage: '', showCitySelector: false, showWeekSelector: false,
    dropdownPosition: { top: 0, left: 0 }, currentDay: (new Date()).getDay(),
    plannerTitle: 'Loading Planner...', uiConfig: {}, times: [], schedule: [], tasks: [], workoutPlan: [],
    meals: [], groceryBudget: '', groceryList: [], bodyMeasurements: [], financials: [],
    cityOptions: [], savedWeeks: [],
    saveDataTimeout: null, notificationTimeout: null,

    async init() {
      isInitializing = true;
      console.log("App init starting...");
      
      await DefaultDataManager.fetch(); 
      if (DefaultDataManager.error) {
        this.showErrorMessage(`CRITICAL: ${DefaultDataManager.error}. App may not work correctly.`);
        this.plannerTitle = "Planner Configuration Error";
      } else {
        this.plannerTitle = DefaultDataManager.getPlannerTitle() || "Weekly Planner"; // Set initial title after fetch
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

      if (appDefaults && !DefaultDataManager.error) {
          setInterval(() => { if (!isInitializing && this.hasSignificantChanges()) this.saveData(); }, 30000);
      }
      if (this.isOnline) this.syncPendingData();
      console.log("App init finished.");
    },

    applyDefaults() {
      if (!appDefaults || DefaultDataManager.error) {
        console.warn("applyDefaults: Defaults not available or error occurred. Applying minimal/empty structures.");
        this.plannerTitle = appDefaults?.planner_title_default || "Planner (Defaults Missing)"; // Use from potentially errored appDefaults
        this.uiConfig = appDefaults?.ui_config_default || {};
        this.times = appDefaults?.times_default || [];
        this.schedule = (appDefaults?.schedule_default || []).map(s => ({...s, activities: (s.activities || []).map(a => ({...a, id: a.id || generateId('act_')})) }));
        this.tasks = Array(appDefaults?.tasks_default_count || 0).fill(null).map((_,i) => ({ id: generateId('task_'), num: '', priority: '', tag: '', description: '', date: '', completed: '' }));
        this.workoutPlan = (appDefaults?.workout_plan_default || []).map(d => ({...d, exercises: (d.exercises || []).map(e => ({...e, id: e.id || generateId('ex_')})) }));
        this.meals = (appDefaults?.meals_default || []).map(m => ({...m, id: m.id || generateId('meal_')}));
        this.groceryList = (appDefaults?.grocery_list_default || []).map(g => ({...g, id: g.id || generateId('gcat_')}));
        this.groceryBudget = ''; 
        this.bodyMeasurements = (appDefaults?.body_measurements_default || []).map(b => ({...b, id: b.id || generateId('bm_')}));
        this.financials = (appDefaults?.financials_default || []).map(f => ({...f, id: f.id || generateId('fin_')}));
        return;
      }
      console.log("Applying defaults from fetched app_config.");
      this.plannerTitle = DefaultDataManager.getPlannerTitle() || "Weekly Planner";
      this.uiConfig = DefaultDataManager.getUiConfig() || {};
      this.times = DefaultDataManager.getTimes() || [];
      this.schedule = DefaultDataManager.getSchedule() || [];
      this.tasks = Array(DefaultDataManager.getTasksCount()).fill(null).map((_,i) => ({ id: generateId('task_'), num: '', priority: '', tag: '', description: '', date: '', completed: '' }));
      this.workoutPlan = DefaultDataManager.getWorkoutPlan() || [];
      this.meals = DefaultDataManager.getMeals() || [];
      this.groceryList = DefaultDataManager.getGroceryList() || [];
      this.groceryBudget = ''; 
      this.bodyMeasurements = DefaultDataManager.getBodyMeasurements() || [];
      this.financials = DefaultDataManager.getFinancials() || [];
    },

    populateFieldsFromSaved(savedData) {
      console.log("Populating fields from saved data:", savedData);
      const getDef = (getterFn, emptyVal = undefined) => appDefaults ? getterFn.call(DefaultDataManager) : emptyVal;

      this.plannerTitle = savedData.planner_title || getDef(DefaultDataManager.getPlannerTitle, "Weekly Planner");
      this.uiConfig = deepCopy(savedData.ui_config || getDef(DefaultDataManager.getUiConfig, {}));
      this.times = deepCopy(savedData.times_display || getDef(DefaultDataManager.getTimes, []));
      
      const defaultSchedule = getDef(DefaultDataManager.getSchedule, []);
      const savedSchedule = deepCopy(savedData.schedule_data || defaultSchedule);
      (savedSchedule || []).forEach(s => (s.activities || []).forEach(a => {
          if (!a.id) a.id = generateId('act_');
          if (!a.streaks) a.streaks = { mon:0, tue:0, wed:0, thu:0, fri:0, sat:0, sun:0, current:0, longest:0 };
      }));
      this.schedule = savedSchedule;

      const defaultTaskCount = getDef(DefaultDataManager.getTasksCount, 0);
      const taskCount = (savedData.tasks_data?.length) ? savedData.tasks_data.length : defaultTaskCount;
      this.tasks = Array(taskCount).fill(null).map((_, i) => {
          const sTask = savedData.tasks_data?.[i];
          return {
              id: sTask?.id || generateId('task_'), num: this.validateValue(sTask?.num), priority: this.validateValue(sTask?.priority),
              tag: this.validateValue(sTask?.tag), description: this.validateValue(sTask?.description),
              date: this.validateValue(sTask?.date), completed: this.validateValue(sTask?.completed)
          };
      });
      
      const defaultWorkoutPlan = getDef(DefaultDataManager.getWorkoutPlan, []);
      const savedWorkoutPlan = deepCopy(savedData.workout_plan_data || defaultWorkoutPlan);
      (savedWorkoutPlan || []).forEach(d => (d.exercises || []).forEach(ex => { if(!ex.id) ex.id = generateId('ex_');}));
      this.workoutPlan = savedWorkoutPlan;

      const defaultMeals = getDef(DefaultDataManager.getMeals, []);
      const savedMeals = deepCopy(savedData.meals_data || defaultMeals);
      (savedMeals || []).forEach(m => { if(!m.id) m.id = generateId('meal_');});
      this.meals = savedMeals;
      
      this.groceryBudget = this.validateValue(savedData.grocery_budget || '');
      
      const defaultGroceryList = getDef(DefaultDataManager.getGroceryList, []);
      const savedGroceryList = deepCopy(savedData.grocery_list_data || defaultGroceryList);
      (savedGroceryList || []).forEach(cat => {if(!cat.id) cat.id = generateId('gcat_');});
      this.groceryList = savedGroceryList;
      
      const defaultBodyMeasurements = getDef(DefaultDataManager.getBodyMeasurements, []);
      const savedBodyMeasurements = deepCopy(savedData.body_measurements_data || defaultBodyMeasurements);
      (savedBodyMeasurements || []).forEach(bm => {if(!bm.id) bm.id = generateId('bm_');});
      this.bodyMeasurements = savedBodyMeasurements;

      const defaultFinancials = getDef(DefaultDataManager.getFinancials, []);
      const savedFinancials = deepCopy(savedData.financials_data || defaultFinancials);
      (savedFinancials || []).forEach(f => {if(!f.id) f.id = generateId('fin_');});
      this.financials = savedFinancials;

      this.city = savedData.city_name || this.city;
      lastSavedState = JSON.stringify(this.getCurrentDataStateForPersistence());
    },
    
    async loadWeek(isoWeek, isInitLoad = false) {
      if (!appDefaults && isInitLoad) { 
          await DefaultDataManager.fetch();
          if(DefaultDataManager.error) { this.showErrorMessage(`CRITICAL: ${DefaultDataManager.error}. Cannot load week.`); if(isInitLoad) isInitializing = false; return; }
          this.cityOptions = await CityOptionsManager.fetch();
          if (this.cityOptions.length > 0 && this.cityOptions.find(co => co.name === this.city) === undefined) { this.city = this.cityOptions[0]?.name || "Error City"; }
      }
      if (!appDefaults) { this.showErrorMessage("Critical error: App defaults not loaded. Week load aborted."); if(isInitLoad) isInitializing = false; return; }

      if (!/^\d{4}-W(0[1-9]|[1-4][0-9]|5[0-3])$/.test(isoWeek)) { this.showErrorMessage("Invalid week format"); if(isInitLoad) isInitializing = false; return; }
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

      if (record) { this.populateFieldsFromSaved(record); } else { this.applyDefaults(); }
      this.calculateScores();
      if (this.times.every(t => !t.value)) { await this.fetchAndSetPrayerTimes(); }
      if (isInitLoad) { isInitializing = false; console.log("Initial load process finished."); }
    },
    
    getCurrentDataStateForPersistence() { 
        return {
            week_id: this.currentWeek, date_range: this.dateRange, city_name: this.city,
            planner_title: this.plannerTitle, ui_config: this.uiConfig,
            times_display: this.times, schedule_data: this.schedule, tasks_data: this.tasks,
            workout_plan_data: this.workoutPlan, meals_data: this.meals, grocery_budget: this.groceryBudget,
            grocery_list_data: this.groceryList, body_measurements_data: this.bodyMeasurements,
            financials_data: this.financials
        };
    },
    
    saveData() {
      if (isInitializing) { return; }
      if (this.saveDataTimeout) clearTimeout(this.saveDataTimeout);
      this.saveStatus = 'saving';
      this.saveDataTimeout = setTimeout(async () => {
        try {
          this.calculateScores(); 
          const plannerDataToSave = this.getCurrentDataStateForPersistence();
          localStorage.setItem(`planner_${this.currentWeek}`, JSON.stringify(plannerDataToSave));
          
          if (this.isOnline) {
            await this.saveToPocketbase(this.currentWeek, plannerDataToSave);
            this.pendingSync = this.pendingSync.filter(item => !(item.weekId === this.currentWeek && item.operation === 'save'));
            localStorage.setItem('planner_pending_sync', JSON.stringify(this.pendingSync));
          } else {
            this.addToPendingSync(this.currentWeek, plannerDataToSave, 'save');
          }
          lastSavedState = JSON.stringify(plannerDataToSave); 
          this.saveStatus = 'saved';
        } catch (error) {
          console.error("Error in saveData:", error);
          this.saveStatus = 'error'; this.showErrorMessage("Error saving data: " + error.message);
          setTimeout(() => { this.saveStatus = 'saved'; }, 3000);
        }
      }, 750);
    },

    hasSignificantChanges() {
      if (isInitializing) return false;
      if (!lastSavedState) return true;
      const currentStateString = JSON.stringify(this.getCurrentDataStateForPersistence());
      return currentStateString !== lastSavedState;
    },
        
    addToPendingSync(weekId, data, operation = 'save') {
      this.pendingSync = this.pendingSync.filter(item => !(item.weekId === weekId && item.operation === operation));
      this.pendingSync.push({ weekId, data: data ? deepCopy(data) : null, operation, timestamp: new Date().toISOString() });
      localStorage.setItem('planner_pending_sync', JSON.stringify(this.pendingSync));
    },
    async syncPendingData() {
      if (!this.isOnline || this.pendingSync.length === 0) return;
      const itemsToProcess = [...this.pendingSync]; 
      let currentPendingSyncState = [...this.pendingSync]; 
      for (const item of itemsToProcess) {
        try {
          if (item.operation === 'delete') { await this.deleteFromPocketbase(item.weekId); }
          else { await this.saveToPocketbase(item.weekId, item.data); }
          currentPendingSyncState = currentPendingSyncState.filter(i => i.timestamp !== item.timestamp);
        } catch (error) { console.error("Sync error for item:", item, error); }
      }
      this.pendingSync = currentPendingSyncState; 
      localStorage.setItem('planner_pending_sync', JSON.stringify(this.pendingSync));
    },
    async saveToPocketbase(weekId, data) {
      try {
        const existing = await pb.collection('planners').getFirstListItem(`week_id="${weekId}"`).catch(e => { if(e.status === 404) return null; throw e;});
        if (existing) { await pb.collection('planners').update(existing.id, data); }
        else { await pb.collection('planners').create(data); }
      } catch (error) { console.error(`PB save error for ${weekId}:`, error, "Data:", data); throw error; }
    },
    async deleteFromPocketbase(weekId) {
      try {
        const existing = await pb.collection('planners').getFirstListItem(`week_id="${weekId}"`).catch(e => { if(e.status === 404) return null; throw e;});
        if (existing) await pb.collection('planners').delete(existing.id);
      } catch (error) { console.error(`PB delete error for ${weekId}:`, error); throw error; }
    },
            
    editInline(event, type, index, defaultValue = '') { 
        const element = event.currentTarget; const originalText = element.innerText;
        const isTextarea = ['mealIngredients', 'groceryCategoryItems'].includes(type);
        const input = document.createElement(isTextarea ? 'textarea' : 'input');
        input.type = 'text'; input.value = defaultValue;
        input.className = isTextarea ? 'inline-edit-textarea' : 'inline-edit-input';
        if (isTextarea) input.rows = 3;
        element.innerHTML = ''; element.appendChild(input); input.focus(); input.select();
        const saveEdit = () => {
            const newValue = input.value; let sIdxMapped = -1;
            if (type === 'sectionName' || (typeof index === 'object' && index !== null && typeof index.sIdx === 'number')) {
                 sIdxMapped = this.schedule.length - 1 - (typeof index === 'object' ? index.sIdx : index);
            }
            switch (type) {
              case 'plannerTitle': this.plannerTitle = newValue; break;
              case 'timeLabel': if (this.times[index]) this.times[index].label = newValue; break;
              case 'sectionName': if (sIdxMapped !== -1 && this.schedule[sIdxMapped]) this.schedule[sIdxMapped].name = newValue; break;
              case 'activityPrefix': if (sIdxMapped !== -1 && this.schedule[sIdxMapped]?.activities[index.aIdx]) { const act = this.schedule[sIdxMapped].activities[index.aIdx]; const parts = act.name.split(':'); act.name = newValue.trim() + (parts.length > 1 ? ':' + parts.slice(1).join(':').trimStart() : ''); } break;
              case 'activityName': if (sIdxMapped !== -1 && this.schedule[sIdxMapped]?.activities[index.aIdx]) { const act = this.schedule[sIdxMapped].activities[index.aIdx]; const parts = act.name.split(':'); act.name = (parts.length > 1 && parts[0].trim() ? parts[0].trim() + ': ' : '') + newValue; } break;
              case 'maxValue': if (sIdxMapped !== -1 && this.schedule[sIdxMapped]?.activities[index.aIdx]?.days[index.day]) { this.schedule[sIdxMapped].activities[index.aIdx].days[index.day].max = parseInt(newValue) || 0; } break;
              case 'maxScore': if (sIdxMapped !== -1 && this.schedule[sIdxMapped]?.activities[index.aIdx]) { this.schedule[sIdxMapped].activities[index.aIdx].maxScore = parseInt(newValue) || 0; } break;
              case 'sectionTitle': if (this.uiConfig.sectionTitles && this.uiConfig.sectionTitles[index] !== undefined) this.uiConfig.sectionTitles[index] = newValue; break;
              case 'mainTableHeader': if (this.uiConfig.mainTableHeaders && this.uiConfig.mainTableHeaders[index] !== undefined) this.uiConfig.mainTableHeaders[index] = newValue; break;
              case 'dayHeader': if (this.uiConfig.dayHeaders && this.uiConfig.dayHeaders[index] !== undefined) this.uiConfig.dayHeaders[index] = newValue; break;
              case 'maxHeader': if (this.uiConfig.maxHeaders && this.uiConfig.maxHeaders[index] !== undefined) this.uiConfig.maxHeaders[index] = newValue; break;
              case 'taskHeader': if (this.uiConfig.taskHeaders && this.uiConfig.taskHeaders[index] !== undefined) this.uiConfig.taskHeaders[index] = newValue; break;
              case 'workoutDayName': if (this.workoutPlan[index]) this.workoutPlan[index].name = newValue; break;
              case 'exercisePrefix': if (this.workoutPlan[index.dayIdx]?.exercises[index.exIdx]) { this.workoutPlan[index.dayIdx].exercises[index.exIdx].prefix = newValue; } break;
              case 'exerciseName': if (this.workoutPlan[index.dayIdx]?.exercises[index.exIdx]) { this.workoutPlan[index.dayIdx].exercises[index.exIdx].name = newValue; } break;
              case 'mealName': if (this.meals[index]) this.meals[index].name = newValue; break;
              case 'mealIngredients': if (this.meals[index]) this.meals[index].ingredients = newValue; break;
              case 'groceryCategoryName': if (this.groceryList[index]) this.groceryList[index].name = newValue; break;
              case 'groceryCategoryItems': if (this.groceryList[index]) this.groceryList[index].items = newValue; break;
              case 'measurementName': if (this.bodyMeasurements[index]) this.bodyMeasurements[index].name = newValue; break;
              case 'financialName': if (this.financials[index]) this.financials[index].name = newValue; break;
              case 'financialAccount': if (this.financials[index]) this.financials[index].account = newValue; break;
            }
            if (input.parentNode === element) { element.removeChild(input); }
            element.innerText = newValue || originalText; this.saveData();
        };
        const handleKeyDown = (e) => { if (e.key === 'Enter' && !isTextarea) { cleanupAndSave(); e.preventDefault();  } else if (e.key === 'Escape') { cleanupAndRestore(); }};
        const cleanupAndSave = () => { input.removeEventListener('blur', cleanupAndSave); input.removeEventListener('keydown', handleKeyDown); saveEdit(); };
        const cleanupAndRestore = () => { input.removeEventListener('blur', cleanupAndSave); input.removeEventListener('keydown', handleKeyDown); if (input.parentNode === element) { element.removeChild(input); } element.innerText = originalText; };
        input.addEventListener('blur', cleanupAndSave); input.addEventListener('keydown', handleKeyDown);
    },
    toggleTaskCompletion(task) { task.completed = task.completed === '✓' ? '☐' : '✓'; this.saveData(); },
    showErrorMessage(message) { this.notificationMessage = message; this.showNotification = true; if(this.notificationTimeout) clearTimeout(this.notificationTimeout); this.notificationTimeout = setTimeout(() => this.showNotification = false, 7000);},
    validateValue(value, isNumber = false, min = null, max = null) { const sVal = String(value || ''); if (sVal.trim() === '') return ''; if (isNumber) { const num = parseFloat(sVal); if (isNaN(num)) return ''; if (min !== null && num < min) return min.toString(); if (max !== null && num > max) return max.toString(); return num.toString(); } return sVal;},
    validateTextInput(event){ this.saveData(); },
    validateNumberInput(event){ this.calculateScores(); this.saveData(); },
    calculateScores() {
      if (!this.schedule || this.schedule.length === 0) return;
      const dailyTotals = { mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0 };
      const dayKeys = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
      this.schedule.forEach(section => {
        if (section.name === 'TOTAL') return;
        (section.activities || []).forEach(activity => {
          let activityScore = 0;
          Object.entries(activity.days || {}).forEach(([day, dayData]) => {
            if (!dayData) return; const value = parseInt(dayData.value) || 0; const maxVal = parseInt(dayData.max) || 0; 
            if (value > 0 && maxVal > 0) { dailyTotals[day] = (dailyTotals[day] || 0) + Math.min(value, maxVal); activityScore += Math.min(value, maxVal); }
            dayData.value = value === 0 ? '' : value.toString();
          });
          activity.score = activityScore;
          if (!activity.streaks) activity.streaks = { mon:0, tue:0, wed:0, thu:0, fri:0, sat:0, sun:0, current:0, longest:0 };
          const todayIdx = this.currentDay === 0 ? 6 : this.currentDay - 1; let currentStreak = 0;
          for (let i = 0; i < 7; i++) { const dayToCheckIdx = (todayIdx - i + 7) % 7; const dayKey = dayKeys[dayToCheckIdx]; if (activity.days[dayKey] && (parseInt(activity.days[dayKey].value) || 0) > 0 && (parseInt(activity.days[dayKey].max) || 0) > 0) { currentStreak++; } else if (activity.days[dayKey] && (parseInt(activity.days[dayKey].max) || 0) > 0) { break; }}
          activity.streaks.current = currentStreak; activity.streaks.longest = Math.max(activity.streaks.longest || 0, currentStreak);
        });
      });
      const totalSection = this.schedule.find(s => s.name === 'TOTAL');
      if (totalSection?.activities?.[0]) {
        const totalActivity = totalSection.activities[0]; let grandTotalScore = 0; let grandTotalMaxScore = 0; 
        dayKeys.forEach(day => { let dailyMax = 0; this.schedule.forEach(s => { if (s.name !== 'TOTAL') { (s.activities || []).forEach(act => { if(act.days[day] && act.days[day].max) { dailyMax += parseInt(act.days[day].max) || 0; }});}}); if (totalActivity.days[day]) totalActivity.days[day].max = dailyMax;});
        Object.entries(dailyTotals).forEach(([day, total]) => { if (totalActivity.days[day]) totalActivity.days[day].value = total.toString(); grandTotalScore += total; });
        totalActivity.score = grandTotalScore;
        this.schedule.forEach(s => { if (s.name !== 'TOTAL') { (s.activities || []).forEach(act => grandTotalMaxScore += (parseInt(act.maxScore) || 0));}});
        totalActivity.maxScore = grandTotalMaxScore;
      }
    },
    async fetchAndSetPrayerTimes() { const cityData = this.cityOptions.find(c => c.name === this.city); if (cityData) { if (cityData.isCurrentLocationTrigger) await this.getDevicePrayerTimes(); else await this.fetchPrayerTimesForCoords(cityData.lat, cityData.lon); } else { await this.getDevicePrayerTimes(); }},
    async getDevicePrayerTimes() { 
        try {
            const pos = await new Promise((res, rej) => navigator.geolocation.getCurrentPosition(res, rej, { timeout: 7000, maximumAge: 60000, enableHighAccuracy: false }));
            const { latitude, longitude } = pos.coords;
            try { const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&accept-language=en`); if (!geoRes.ok) throw new Error(`Geocoding API error: ${geoRes.status}`); const geoData = await geoRes.json(); this.city = geoData.address?.city || geoData.address?.town || geoData.address?.village || "Current Location"; } 
            catch (e) { this.city = "Current Location"; console.warn("Geocoding error:", e)}
            await this.fetchPrayerTimesForCoords(latitude, longitude);
        } catch (error) { console.warn("Geolocation error:", error); this.showErrorMessage("Could not get location. Using London."); const lonOpt = this.cityOptions.find(c=>c.name==='London'); if(lonOpt){this.city=lonOpt.name;await this.fetchPrayerTimesForCoords(lonOpt.lat,lonOpt.lon);}else{this.city="London";await this.fetchPrayerTimesForCoords(51.5074,-0.1278);}}
    },
    async fetchPrayerTimesForCoords(latitude, longitude) { 
        const today = new Date(); const date = today.getDate(); const month = today.getMonth() + 1; const year = today.getFullYear();
        const cacheKey = `prayer_times_${year}_${month}_${date}_${latitude.toFixed(2)}_${longitude.toFixed(2)}`;
        const cached = localStorage.getItem(cacheKey); if (cached) { try {this.setPrayerTimesDisplay(JSON.parse(cached)); return; } catch(e){localStorage.removeItem(cacheKey);}}
        try { const res = await fetch(`https://api.aladhan.com/v1/calendar/${year}/${month}?latitude=${latitude}&longitude=${longitude}&method=2`); if (!res.ok) throw new Error(`Aladhan API error: ${res.statusText} (${res.status})`); const apiData = await res.json(); if (apiData.code === 200 && apiData.data?.[date-1]?.timings) { const timings = apiData.data[date-1].timings; localStorage.setItem(cacheKey, JSON.stringify(timings)); this.setPrayerTimesDisplay(timings); } else throw new Error("Invalid Aladhan API data"); } 
        catch (error) { console.error("Fetch prayer times error:", error); this.showErrorMessage("Failed to fetch prayer times. Defaults used."); this.setPrayerTimesDisplay({ Fajr: "05:30", Dhuhr: "12:30", Asr: "15:45", Maghrib: "18:30", Isha: "20:00" });}
    },
    setPrayerTimesDisplay(timings) { 
        const qiyam = DateTimeUtils.calculateQiyamTime(timings.Fajr); const map = { Q: qiyam, F: timings.Fajr, D: timings.Dhuhr, A: timings.Asr, M: timings.Maghrib, I: timings.Isha };
        let changed = false; this.times.forEach(ts => { const nt = DateTimeUtils.formatPrayerTime(map[ts.label]); if (ts.value !== nt) { ts.value = nt; changed = true; }});
        if (changed && !isInitializing) this.saveData();
    },
    fetchSavedWeeks() { 
        const weeksData = new Map(); const currentIsoWeek = DateTimeUtils.getCurrentIsoWeek();
        const addUpdateWeek = (iso, dr, src, isCur) => { const ex = weeksData.get(iso); const ndr = dr || DateTimeUtils.getWeekDateRange(DateTimeUtils.parseISOWeek(iso)); if (!ex || (src==='pocketbase'&&ex.source!=='pocketbase')||(src==='local'&&ex.source==='current')){ weeksData.set(iso, {iso_week:iso,dateRange:ndr,source:src,isCurrent:isCur});} else if(ex&&!ex.dateRange&&ndr){ex.dateRange=ndr;}};
        addUpdateWeek(currentIsoWeek, DateTimeUtils.getWeekDateRange(DateTimeUtils.parseISOWeek(currentIsoWeek)), 'current', true);
        const updateDisplay = () => { this.savedWeeks = Array.from(weeksData.values()).sort((a,b) => (a.isCurrent&&!b.isCurrent)?-1:(!a.isCurrent&&b.isCurrent)?1:b.iso_week.localeCompare(a.iso_week));};
        if (this.isOnline) { pb.collection('planners').getFullList({ sort: '-week_id', fields: 'week_id,date_range' }).then(rec => { rec.forEach(it => addUpdateWeek(it.week_id, it.date_range, 'pocketbase', it.week_id === currentIsoWeek)); updateDisplay(); }).catch(e => { console.error("PB fetch saved weeks error:", e); for (let i=0;i<localStorage.length;i++){ const k=localStorage.key(i); if(k?.startsWith('planner_')&&!k.includes('pending_sync')){const iw=k.replace('planner_',''); try{const d=JSON.parse(localStorage.getItem(k));addUpdateWeek(iw,d.date_range,'local',iw===currentIsoWeek);}catch(le){}}} updateDisplay();});}
        else { for (let i=0;i<localStorage.length;i++){ const k=localStorage.key(i); if(k?.startsWith('planner_')&&!k.includes('pending_sync')){const iw=k.replace('planner_',''); try{const d=JSON.parse(localStorage.getItem(k));addUpdateWeek(iw,d.date_range,'local',iw===currentIsoWeek);}catch(e){}}} updateDisplay();}
    },
    confirmLoadWeek(isoWeek) { if (this.hasSignificantChanges() && isoWeek !== this.currentWeek) { if (confirm("Unsaved changes. Load anyway?")) this.loadWeek(isoWeek); } else { this.loadWeek(isoWeek); }},
    confirmDeleteWeek(isoWeek) { if (confirm(`Delete schedule for ${isoWeek}?`)) this.deleteWeek(isoWeek);},
    async deleteWeek(isoWeek) { localStorage.removeItem(`planner_${isoWeek}`); if(this.isOnline){try{await this.deleteFromPocketbase(isoWeek);}catch(e){this.addToPendingSync(isoWeek,null,'delete');}}else{this.addToPendingSync(isoWeek,null,'delete');} this.savedWeeks=this.savedWeeks.filter(w=>w.iso_week!==isoWeek); if(this.currentWeek===isoWeek){this.currentWeek=DateTimeUtils.getCurrentIsoWeek();await this.loadWeek(this.currentWeek);}},
    selectCity(cityOption) { this.city = cityOption.name; this.showCitySelector = false; this.fetchAndSetPrayerTimes().then(() => this.saveData()); },
    
    // CRUD Methods
    addNewTask() { const defDesc = appDefaults?.tasks_default?.[0]?.description || ''; this.tasks.push({ id: generateId('task_'), num: '', priority: '', tag: '', description: defDesc, date: '', completed: '' }); this.saveData();},
    deleteTask(taskIndex) { if (taskIndex >= 0 && taskIndex < this.tasks.length) { this.tasks.splice(taskIndex, 1); this.saveData();}},
    addNewMeal() { const name = prompt("New meal name:"); if (name?.trim()) { const defIng = appDefaults?.meals_default?.[0]?.ingredients || ''; this.meals.push({ id: generateId('meal_'), name: name.trim(), ingredients: defIng }); this.saveData();}},
    deleteMeal(mealIndex) { if (mealIndex >= 0 && mealIndex < this.meals.length) { this.meals.splice(mealIndex, 1); this.saveData();}},
    addNewActivityToSection(sIdxMapped) { 
        const secName = this.schedule[sIdxMapped]?.name || 'section';
        const name = prompt(`New activity name for ${secName}:`);
        if (name?.trim() && this.schedule[sIdxMapped]) {
            let defDays = {}; const defActDays = appDefaults?.schedule_default?.[0]?.activities?.[0]?.days;
            if(defActDays){ defDays = deepCopy(defActDays); for(const day in defDays) defDays[day].value = ''; } else { ['mon','tue','wed','thu','fri','sat','sun'].forEach(d => defDays[d] = {value:'', max:1}); }
            this.schedule[sIdxMapped].activities.push({ id: generateId('act_'), name: name.trim(), days: defDays, score: 0, maxScore: (appDefaults?.schedule_default?.[0]?.activities?.[0]?.maxScore || 7), streaks: { mon:0, tue:0, wed:0, thu:0, fri:0, sat:0, sun:0, current:0, longest:0 }});
            this.saveData();
        }
    },
    deleteActivity(sIdxMapped, activityId) { if (this.schedule[sIdxMapped]?.activities) { const idx = this.schedule[sIdxMapped].activities.findIndex(a => a.id === activityId); if (idx > -1) { this.schedule[sIdxMapped].activities.splice(idx, 1); this.saveData(); }}},
    addNewExerciseToWorkoutDay(dayIdx) {
        const dayName = this.workoutPlan[dayIdx]?.name || 'day';
        const name = prompt(`New exercise for ${dayName}:`);
        if (name?.trim() && this.workoutPlan[dayIdx]) {
            const defEx = appDefaults?.workout_plan_default?.[0]?.exercises?.[0];
            this.workoutPlan[dayIdx].exercises.push({ id: generateId('ex_'), prefix: defEx?.prefix || '• ', name: name.trim(), weight: '', sets: '', reps: '', defaultWeight: defEx?.defaultWeight || '10', defaultSets: defEx?.defaultSets || '3', defaultReps: defEx?.defaultReps || '10' });
            this.saveData();
        }
    },
    deleteExerciseFromWorkoutDay(dayIdx, exerciseId) { if (this.workoutPlan[dayIdx]?.exercises) { const idx = this.workoutPlan[dayIdx].exercises.findIndex(ex => ex.id === exerciseId); if (idx > -1) { this.workoutPlan[dayIdx].exercises.splice(idx, 1); this.saveData(); }}},
    addNewGroceryCategory() { const name = prompt("New grocery category:"); if (name?.trim()) { this.groceryList.push({ id: generateId('gcat_'), name: name.trim(), items: (appDefaults?.grocery_list_default?.[0]?.items || '') }); this.saveData(); }},
    deleteGroceryCategory(index) { if (index >= 0 && index < this.groceryList.length) { this.groceryList.splice(index, 1); this.saveData();}},
    addNewBodyMeasurement() { const name = prompt("New measurement name:"); if (name?.trim()) { this.bodyMeasurements.push({ id: generateId('bm_'), name: name.trim(), value: '', placeholder: (appDefaults?.body_measurements_default?.[0]?.placeholder || '0') }); this.saveData(); }},
    deleteBodyMeasurement(index) { if (index >= 0 && index < this.bodyMeasurements.length) { this.bodyMeasurements.splice(index, 1); this.saveData();}},
    addNewFinancialItem() { const name = prompt("New financial item:"); if (name?.trim()) { this.financials.push({ id: generateId('fin_'), name: name.trim(), value: '', placeholder: (appDefaults?.financials_default?.[0]?.placeholder || '0'), account: '' }); this.saveData(); }},
    deleteFinancialItem(index) { if (index >= 0 && index < this.financials.length) { this.financials.splice(index, 1); this.saveData();}}
  };
}
