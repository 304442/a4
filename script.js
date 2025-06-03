// Optimized Planner App - Consolidated & Compressed
const plannerApp = () => {
  const pb = new PocketBase('/');
  pb.autoCancellation(false);
  
  // Centralized constants
  const CONSTANTS = {
    DAYS: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
    DAY_HEADERS: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'],
    SYSTEM_FIELDS: ['id', 'created', 'updated', 'collectionId', 'collectionName', 'expand'],
    PRAYER_MAP: {Q: 'qiyam', F: 'Fajr', D: 'Dhuhr', A: 'Asr', M: 'Maghrib', I: 'Isha'},
    DEFAULTS: {
      CITIES: [
        {name: 'London', latitude: 51.5074, longitude: -0.1278},
        {name: 'Cairo', latitude: 30.0444, longitude: 31.2357},
        {name: 'Current Location', latitude: null, longitude: null}
      ],
      LAYOUT: {task_rows: 15, workout_days: 3, meal_items: 8, grocery_categories: 6, measurements_count: 6, financials_count: 4},
      COLORS: {current_day_bg: "#fff8e1", score_low: "#f8d7da", score_medium: "#fff3cd", score_high: "#d4edda"},
      CONFIG: {default_city: "London", auto_save_interval: 30000, prayer_time_method: 2}
    }
  };

  // Utility functions - consolidated
  const utils = {
    id: (() => {let c = 0; return () => `id_${Date.now()}_${c++}`;})(),
    validate: (val, type) => val != null && typeof val === type,
    safeGet: (obj, path, def) => path.split('.').reduce((o, k) => o?.[k], obj) ?? def,
    formatTime: str => {
      if (!str) return "";
      const [h, m] = str.split(" ")[0].split(":");
      const hour = +h, min = +m;
      return isNaN(hour) || isNaN(min) ? "" : `${hour % 12 || 12}:${min.toString().padStart(2,'0')}${hour >= 12 ? "PM" : "AM"}`;
    },
    formatDate: date => `${(date.getUTCMonth() + 1).toString().padStart(2, '0')}/${date.getUTCDate().toString().padStart(2, '0')}`,
    getCurrentIsoWeek: () => {
      const now = new Date();
      const date = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
      date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
      const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
      const weekNumber = Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
      return `${date.getUTCFullYear()}-W${weekNumber.toString().padStart(2, '0')}`;
    },
    parseISOWeek: iso => {
      const [year, weekPart] = iso.split('-');
      const week = parseInt(weekPart.substring(1));
      const date = new Date(Date.UTC(+year, 0, 1 + (week - 1) * 7));
      date.setUTCDate(date.getUTCDate() - (date.getUTCDay() || 7) + 1);
      return date;
    },
    getWeekDateRange: date => {
      const start = new Date(date), end = new Date(start);
      end.setUTCDate(start.getUTCDate() + 6);
      return `${utils.formatDate(start)}-${utils.formatDate(end)}`;
    }
  };

  // State management - consolidated
  let state = {
    isInitializing: true,
    lastSavedState: null,
    saveTimeout: null,
    notificationTimeout: null
  };

  return {
    // Core state
    currentWeek: utils.getCurrentIsoWeek(),
    dateRange: '', city: 'London', saveStatus: 'saved',
    showNotification: false, notificationMessage: '', isOnline: navigator.onLine,
    pendingSync: [], showCitySelector: false, showWeekSelector: false, 
    dropdownPosition: {top: 0, left: 0}, currentDay: new Date().getDay(),
    plannerTitle: 'Weekly Planner', uiConfig: {}, times: [], schedule: [], 
    tasks: [], workoutPlan: [], meals: [], groceryBudget: '', groceryList: [],
    bodyMeasurements: [], financials: [], currentTemplate: null, currentTemplateId: null,
    savedWeeks: [], settings: {}, cityOptions: [], layoutConfig: {}, 
    colorConfig: {}, defaultConfig: {}, featuresConfig: {},

    // Initialization
    async init() {
      this.setupEventListeners();
      this.pendingSync = JSON.parse(localStorage.getItem('planner_pending_sync') || '[]');
      this.dateRange = utils.getWeekDateRange(utils.parseISOWeek(this.currentWeek));
      await this.loadSettings();
      await this.loadWeek(this.currentWeek, true);
      setInterval(() => { if (!state.isInitializing && this.hasSignificantChanges()) this.saveData(); }, 30000);
      if (this.isOnline) this.syncPendingData();
    },

    setupEventListeners() {
      const handlers = {
        online: () => { this.isOnline = true; this.syncPendingData(); },
        offline: () => this.isOnline = false,
        click: e => { if (!e.target.closest('.dropdown,.clickable')) this.showCitySelector = this.showWeekSelector = false; }
      };
      Object.entries(handlers).forEach(([event, handler]) => 
        (event === 'click' ? document : window).addEventListener(event, handler));
    },

    // Settings management - consolidated
    async loadSettings() {
      try {
        const records = await pb.collection('settings').getFullList();
        this.settings = records.reduce((acc, {category, key, value}) => {
          if (!acc[category]) acc[category] = {};
          acc[category][key] = value;
          return acc;
        }, {});
        this.refreshSettingsConfig();
      } catch (error) {
        console.log('Settings fetch failed, using defaults:', error.message);
        this.loadDefaultSettings();
      }
    },

    loadDefaultSettings() {
      Object.assign(this, {
        cityOptions: CONSTANTS.DEFAULTS.CITIES,
        layoutConfig: CONSTANTS.DEFAULTS.LAYOUT,
        colorConfig: CONSTANTS.DEFAULTS.COLORS,
        defaultConfig: CONSTANTS.DEFAULTS.CONFIG,
        featuresConfig: {prayer_times: true, geolocation: true, offline_sync: true, streak_tracking: true}
      });
    },

    refreshSettingsConfig() {
      Object.assign(this, {
        cityOptions: utils.safeGet(this.settings, 'locations.cities', CONSTANTS.DEFAULTS.CITIES),
        layoutConfig: utils.safeGet(this.settings, 'ui.layout', CONSTANTS.DEFAULTS.LAYOUT),
        colorConfig: utils.safeGet(this.settings, 'ui.colors', CONSTANTS.DEFAULTS.COLORS),
        defaultConfig: utils.safeGet(this.settings, 'defaults.planner', CONSTANTS.DEFAULTS.CONFIG),
        featuresConfig: utils.safeGet(this.settings, 'features.enabled', {prayer_times: true, geolocation: true, offline_sync: true, streak_tracking: true})
      });
    },

    // Template management - consolidated
    async fetchTemplate(name = "default") {
      const cacheKey = `template_${name}`;
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const template = JSON.parse(cached);
        if (template.id !== 'fallback') return template;
        localStorage.removeItem(cacheKey);
      }
      const filter = name === "default" ? 'is_default=true' : `name="${name}"`;
      const template = await pb.collection('templates').getFirstListItem(filter);
      localStorage.setItem(cacheKey, JSON.stringify(template));
      return template;
    },

    applyTemplateStructure(template) {
      this.currentTemplate = template;
      this.currentTemplateId = template.id;
      const s = template.structure;

      this.plannerTitle = s.ui?.title_default || 'Weekly Planner';
      this.uiConfig = {
        mainTableHeaders: s.ui?.headers?.main_table || [],
        dayHeaders: s.ui?.headers?.days || CONSTANTS.DAY_HEADERS,
        maxHeaders: s.ui?.headers?.max_cols || Array(7).fill('MAX'),
        taskHeaders: s.ui?.headers?.tasks || [],
        sectionTitles: s.ui?.sections || {}
      };

      this.times = [...(s.prayer_times || [])];
      this.schedule = this.buildScheduleFromTemplate(s.schedule || []);
      
      const taskCount = this.layoutConfig?.task_rows || s.tasks?.count || 15;
      this.tasks = Array(taskCount).fill().map(() => ({
        id: utils.id(), num: '', priority: '', tag: '', description: '', 
        startDate: '', expectedDate: '', actualDate: '', completed: ''
      }));

      this.workoutPlan = this.buildWorkoutFromTemplate(s.workout || []);
      this.meals = this.ensureIds([...(s.meals || [])]);
      this.groceryBudget = s.grocery?.budget_default || '£120';
      this.groceryList = this.ensureIds([...(s.grocery?.categories || [])]);
      this.bodyMeasurements = this.ensureIds([...(s.measurements || [])]);
      this.financials = this.ensureIds([...(s.financials || [])]);
      this.city = s.city_default || this.defaultConfig?.default_city || 'London';
    },

    buildScheduleFromTemplate(templateSchedule) {
      return templateSchedule.map(section => ({
        id: utils.id(), 
        name: section.name,
        activities: (section.activities || []).map(activity => ({
          id: utils.id(), 
          name: activity.name,
          days: this.createDaysStructure(activity.days, activity.max_per_day || 1),
          score: 0, 
          maxScore: activity.max_score || 0,
          streaks: {current: 0, longest: 0}
        }))
      }));
    },

    createDaysStructure(specificDays, maxPerDay) {
      const targetDays = specificDays?.length > 0 ? 
        specificDays.filter(day => CONSTANTS.DAYS.includes(day.toLowerCase())) : 
        CONSTANTS.DAYS;
      
      return targetDays.reduce((days, day) => {
        days[day] = {value: '', max: Math.max(0, +maxPerDay || 1)};
        return days;
      }, {});
    },

    buildWorkoutFromTemplate(templateWorkout) {
      return templateWorkout.map(day => ({
        id: utils.id(), name: day.name,
        exercises: this.ensureIds((day.exercises || []).map(ex => ({
          prefix: '• ', name: ex.name, weight: '', sets: '', reps: '',
          defaultWeight: ex.default_weight?.toString() || '',
          defaultSets: ex.default_sets?.toString() || '',
          defaultReps: ex.default_reps?.toString() || ''
        })))
      }));
    },

    ensureIds: items => items.map(item => ({...item, id: item.id || utils.id()})),

    // Data loading - consolidated
    async loadWeek(isoWeek, isInitLoad = false) {
      this.showWeekSelector = false; 
      this.currentWeek = isoWeek; 
      this.dateRange = utils.getWeekDateRange(utils.parseISOWeek(isoWeek));

      const plannerRecord = await this.fetchPlannerRecord(isoWeek);
      const template = plannerRecord?.template_id ? 
        await this.fetchTemplateById(plannerRecord.template_id) : 
        await this.fetchTemplate("default");

      this.applyTemplateStructure(template);
      if (plannerRecord) this.overlayUserData(plannerRecord);
      this.calculateScores();
      
      if (isInitLoad && !this.times.some(t => t.value) && this.featuresConfig?.prayer_times) {
        await this.getPrayerTimes();
      }
      
      state.lastSavedState = JSON.stringify(this.getCurrentUserData());
      if (isInitLoad) state.isInitializing = false;
    },

    async fetchPlannerRecord(isoWeek) {
      if (this.isOnline) {
        try {
          return await pb.collection('planners').getFirstListItem(`week_id="${isoWeek}"`);
        } catch (error) {
          return error.status === 404 ? null : Promise.reject(error);
        }
      }
      const local = localStorage.getItem(`planner_${isoWeek}`);
      return local ? JSON.parse(local) : null;
    },

    fetchTemplateById: id => pb.collection('templates').getOne(id),

    // Data overlay - consolidated
    overlayUserData(record) {
      const overlays = {
        title: v => this.plannerTitle = v,
        city: v => this.city = v,
        prayer_times: v => this.overlayArray(this.times, v),
        schedule_data: v => this.overlayScheduleData(v),
        tasks_data: v => this.overlayArray(this.tasks, v),
        workout_data: v => this.overlayWorkoutData(v),
        meals_data: v => this.overlayArray(this.meals, v),
        grocery_data: v => this.overlayGroceryData(v),
        measurements_data: v => this.overlayArray(this.bodyMeasurements, v),
        financials_data: v => this.overlayArray(this.financials, v)
      };
      Object.entries(record).forEach(([key, value]) => overlays[key]?.(value));
    },

    overlayArray: (target, source) => source?.forEach((item, i) => target[i] && Object.assign(target[i], item)),

    overlayScheduleData(scheduleData) {
      scheduleData?.forEach(savedSection => {
        const section = this.schedule.find(s => s.name === savedSection.name);
        if (!section) return;
        
        savedSection.activities?.forEach(savedActivity => {
          const activity = section.activities.find(a => a.name === savedActivity.name);
          if (!activity) return;
          
          if (savedActivity.days) {
            Object.keys(activity.days).forEach(day => {
              if (savedActivity.days[day]) activity.days[day].value = savedActivity.days[day].value || '';
            });
          }
          Object.assign(activity, {
            score: savedActivity.score || 0,
            streaks: savedActivity.streaks || {current: 0, longest: 0}
          });
        });
      });
    },

    overlayWorkoutData(workoutData) {
      workoutData?.forEach(savedDay => {
        const day = this.workoutPlan.find(d => d.name === savedDay.name);
        if (!day) return;
        
        savedDay.exercises?.forEach(savedEx => {
          const exercise = day.exercises.find(ex => ex.name === savedEx.name);
          if (exercise) Object.assign(exercise, {
            weight: savedEx.weight || '',
            sets: savedEx.sets || '',
            reps: savedEx.reps || ''
          });
        });
      });
    },

    overlayGroceryData(groceryData) {
      if (groceryData.budget) this.groceryBudget = groceryData.budget;
      if (groceryData.categories) this.overlayArray(this.groceryList, groceryData.categories);
    },

    // Data extraction - consolidated
    getCurrentUserData() {
      return {
        week_id: this.currentWeek,
        template_id: this.currentTemplateId,
        title: this.plannerTitle !== this.currentTemplate?.structure?.ui?.title_default ? this.plannerTitle : null,
        city: this.city !== (this.currentTemplate?.structure?.city_default || this.defaultConfig?.default_city) ? this.city : null,
        date_range: this.dateRange,
        prayer_times: this.times.some(t => t.value) ? this.times : null,
        schedule_data: this.extractScheduleData(),
        tasks_data: this.extractUserTasks(),
        workout_data: this.extractWorkoutData(),
        meals_data: this.extractUserItems(this.meals, ['name', 'ingredients']),
        grocery_data: this.extractGroceryData(),
        measurements_data: this.extractUserItems(this.bodyMeasurements, ['value']),
        financials_data: this.extractUserItems(this.financials, ['value'])
      };
    },

    extractScheduleData: () => this.schedule.map(section => ({
      name: section.name,
      activities: section.activities.map(activity => ({
        name: activity.name,
        days: Object.keys(activity.days).reduce((acc, day) => {
          if (activity.days[day].value) acc[day] = {value: activity.days[day].value};
          return acc;
        }, {}),
        score: activity.score,
        streaks: activity.streaks
      })).filter(activity => Object.keys(activity.days).length > 0 || activity.score > 0)
    })).filter(section => section.activities.length > 0),

    extractUserTasks: () => this.tasks.filter(task => 
      ['num', 'priority', 'tag', 'description', 'startDate', 'expectedDate', 'actualDate', 'completed']
        .some(field => task[field])),

    extractWorkoutData: () => this.workoutPlan.map(day => ({
      name: day.name,
      exercises: day.exercises.filter(ex => ex.weight || ex.sets || ex.reps)
        .map(ex => ({name: ex.name, weight: ex.weight, sets: ex.sets, reps: ex.reps}))
    })).filter(day => day.exercises.length > 0),

    extractUserItems: (items, fields) => items.filter(item => fields.some(field => item[field])),

    extractGroceryData() {
      const categories = this.extractUserItems(this.groceryList, ['name', 'items']);
      return {
        budget: this.groceryBudget || null,
        categories: categories.length > 0 ? categories : null
      };
    },

    // Editing - consolidated
    editField(event, type, currentValue = '', ...args) {
      const element = event.currentTarget;
      const isTextarea = ['mealIngredients', 'groceryCategoryItems'].includes(type);
      const input = document.createElement(isTextarea ? 'textarea' : 'input');
      
      Object.assign(input, {
        type: 'text',
        value: currentValue,
        className: isTextarea ? 'inline-edit-textarea' : 'inline-edit-input'
      });
      if (isTextarea) input.rows = 3;

      const originalText = element.innerText;
      element.innerHTML = '';
      element.appendChild(input);
      input.focus();
      input.select();

      const save = () => {
        this.updateField(type, input.value, ...args);
        this.cleanup(element, input, input.value || originalText);
        this.saveData();
      };

      const cancel = () => this.cleanup(element, input, originalText);

      input.addEventListener('blur', save);
      input.addEventListener('keydown', e => {
        if (e.key === 'Enter' && !isTextarea) { e.preventDefault(); save(); }
        else if (e.key === 'Escape') cancel();
      });
    },

    cleanup(element, input, text) {
      if (input.parentNode === element) element.removeChild(input);
      element.innerText = text;
    },

    // Field updates - consolidated with handlers map
    updateField(type, value, ...args) {
      const handlers = {
        plannerTitle: () => this.plannerTitle = value,
        timeLabel: i => this.times[i] && (this.times[i].label = value),
        sectionTitle: section => this.uiConfig.sectionTitles?.[section] && (this.uiConfig.sectionTitles[section] = value),
        header: (headerType, index) => {
          const map = {main: 'mainTableHeaders', day: 'dayHeaders', max: 'maxHeaders', task: 'taskHeaders'};
          this.uiConfig[map[headerType]]?.[index] !== undefined && (this.uiConfig[map[headerType]][index] = value);
        },
        sectionName: sIdx => {
          const section = this.schedule[this.schedule.length - 1 - sIdx];
          if (section) section.name = value;
        },
        activityPrefix: indices => this.updateActivityName(indices, value, true),
        activityName: indices => this.updateActivityName(indices, value, false),
        maxValue: indices => {
          const activity = this.getScheduleActivity(indices);
          activity?.days[indices.day] && (activity.days[indices.day].max = +value || 0);
        },
        maxScore: indices => {
          const activity = this.getScheduleActivity(indices);
          if (activity) activity.maxScore = +value || 0;
        },
        workoutDayName: i => this.workoutPlan[i] && (this.workoutPlan[i].name = value),
        exercisePrefix: indices => {
          const ex = this.workoutPlan[indices.dayIdx]?.exercises[indices.exIdx];
          if (ex) ex.prefix = value;
        },
        exerciseName: indices => {
          const ex = this.workoutPlan[indices.dayIdx]?.exercises[indices.exIdx];
          if (ex) ex.name = value;
        }
      };

      // Generic field updates for arrays
      ['meal', 'groceryCategory', 'measurement', 'financial'].forEach(prefix => {
        ['Name', 'Ingredients', 'Items', 'Account'].forEach(suffix => {
          const key = prefix + suffix;
          if (type === key.toLowerCase()) {
            const arrayMap = {
              meal: this.meals, groceryCategory: this.groceryList,
              measurement: this.bodyMeasurements, financial: this.financials
            };
            const fieldMap = {Name: 'name', Ingredients: 'ingredients', Items: 'items', Account: 'account'};
            const array = arrayMap[prefix];
            const field = fieldMap[suffix];
            if (array?.[args[0]]) array[args[0]][field] = value;
          }
        });
      });

      handlers[type]?.(...args);
    },

    updateActivityName(indices, value, isPrefix) {
      const activity = this.getScheduleActivity(indices);
      if (!activity) return;
      
      const parts = activity.name.split(':');
      activity.name = isPrefix ? 
        value + (parts.length > 1 ? ':' + parts.slice(1).join(':').trimStart() : '') :
        (parts.length > 1 ? parts[0].trim() + ': ' : '') + value;
    },

    getScheduleActivity: indices => this.schedule[this.schedule.length - 1 - indices.sIdx]?.activities[indices.aIdx],

    // Task management - consolidated
    getTaskDelay: task => {
      if (!task.expectedDate || !task.actualDate) return 0;
      return Math.ceil((new Date(task.actualDate) - new Date(task.expectedDate)) / (1000 * 60 * 60 * 24));
    },

    calculateTaskDelay: task => task._delay = this.getTaskDelay(task),

    formatDelay: days => days === 0 ? '⏰' : days > 0 ? `+${days}d` : `${days}d`,

    toggleTaskCompletion(task) { 
      task.completed = task.completed === '✓' ? '☐' : '✓'; 
      if (task.completed === '✓' && !task.actualDate) {
        task.actualDate = new Date().toISOString().split('T')[0];
        this.calculateTaskDelay(task);
      }
      this.saveData(); 
    },

    // UI helpers - consolidated
    getScoreClass: activity => {
      if (activity.maxScore <= 0) return '';
      const ratio = activity.score / activity.maxScore;
      return ratio < 0.33 ? 'score-low' : ratio < 0.66 ? 'score-medium' : 'score-high';
    },

    getTaskRowClass(task) {
      const classes = [];
      if (task.completed === '✓') classes.push('task-completed');
      const delay = this.getTaskDelay(task);
      if (delay > 0) classes.push('task-delayed');
      else if (delay < 0) classes.push('task-early');
      return classes.join(' ');
    },

    getDelayClass: task => {
      const delay = this.getTaskDelay(task);
      return delay < 0 ? 'delay-negative' : delay > 0 ? 'delay-positive' : 'delay-zero';
    },

    getProgressStyle: activity => activity.maxScore <= 0 ? 'width: 0%' : 
      `width: ${Math.min(100, (activity.score / activity.maxScore) * 100)}%`,

    getProgressClass: activity => {
      if (activity.maxScore <= 0) return '';
      const ratio = activity.score / activity.maxScore;
      return ratio < 0.33 ? 'progress-low' : ratio < 0.66 ? 'progress-medium' : 'progress-high';
    },

    getTaskColumnStyle: i => {
      const widths = this.currentTemplate?.structure?.ui?.task_column_widths || [];
      return widths[i] ? `width:${widths[i]}` : 'text-align:left';
    },

    getDropdownStyle: () => `top: ${this.dropdownPosition.top}px; left: ${this.dropdownPosition.left}px;`,

    // Selectors - consolidated
    toggleSelector(event, type) {
      const prop = `show${type.charAt(0).toUpperCase() + type.slice(1)}Selector`;
      const other = type === 'city' ? 'showWeekSelector' : 'showCitySelector';
      this[other] = false;
      
      const rect = event.target.getBoundingClientRect();
      this.dropdownPosition = {
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX
      };
      
      this[prop] = !this[prop];
      if (type === 'week' && this[prop]) this.fetchSavedWeeks();
    },

    async selectCity(cityOption) {
      this.city = cityOption.name;
      this.showCitySelector = false;
      if (cityOption.lat === null && this.featuresConfig?.geolocation) {
        await this.getPrayerTimes();
      } else if (cityOption.lat !== null) {
        await this.fetchPrayerTimes(cityOption.lat, cityOption.lon);
      }
      this.saveData();
    },

    // Prayer times - consolidated
    async getPrayerTimes() {
      if (!this.featuresConfig?.prayer_times || !this.featuresConfig?.geolocation) return;
      
      try {
        const position = await new Promise((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject, {timeout: 5000, maximumAge: 60000}));
        const {latitude, longitude} = position.coords;
        
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&accept-language=en`);
        const data = await response.json();
        this.city = data.address?.city || data.address?.town || data.address?.village || "Current Location";
        
        await this.fetchPrayerTimes(latitude, longitude);
      } catch (error) {
        console.log('Geolocation failed:', error.message);
      }
    },

    async fetchPrayerTimes(lat, lon) {
      if (!this.featuresConfig?.prayer_times) return;
      
      try {
        const today = new Date();
        const dateKey = `${today.getFullYear()}_${today.getMonth()+1}_${today.getDate()}`;
        const cacheKey = `prayer_times_${dateKey}_${lat.toFixed(2)}_${lon.toFixed(2)}`;
        
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          this.setPrayerTimes(JSON.parse(cached));
          return;
        }

        const method = this.defaultConfig?.prayer_time_method || 2;
        const response = await fetch(`https://api.aladhan.com/v1/calendar/${today.getFullYear()}/${today.getMonth()+1}?latitude=${lat}&longitude=${lon}&method=${method}`);
        const data = await response.json();
        const timings = data.data[today.getDate()-1].timings;
        localStorage.setItem(cacheKey, JSON.stringify(timings));
        this.setPrayerTimes(timings);
      } catch (error) {
        console.log('Prayer times fetch failed:', error.message);
      }
    },

    setPrayerTimes(timings) {
      const qiyamTime = this.calculateQiyamTime(timings.Fajr);
      const prayerMap = {Q: qiyamTime, F: timings.Fajr, D: timings.Dhuhr, A: timings.Asr, M: timings.Maghrib, I: timings.Isha};
      
      let changed = false;
      this.times.forEach(time => {
        const newTime = utils.formatTime(prayerMap[time.label]);
        if (time.value !== newTime) {
          time.value = newTime;
          changed = true;
        }
      });
      
      if (changed && !state.isInitializing) this.saveData();
    },

    calculateQiyamTime(fajrTime) {
      if (!fajrTime) return "";
      const [hourStr, minStr] = fajrTime.split(" ")[0].split(":");
      let hour = +hourStr, min = +minStr;
      if (isNaN(hour) || isNaN(min)) return "";
      hour = hour - 1;
      if (hour < 0) hour = 23;
      return `${hour}:${min.toString().padStart(2,'0')}`;
    },

    // Score calculations - optimized
    calculateScores() {
      const dailyTotals = CONSTANTS.DAYS.reduce((acc, day) => (acc[day] = 0, acc), {});

      this.schedule.forEach(section => {
        if (section.name === 'TOTAL') return;
        
        section.activities.forEach(activity => {
          let activityScore = 0;
          
          Object.entries(activity.days || {}).forEach(([day, data]) => {
            if (!data) return;
            const value = +data.value || 0;
            if (value > 0 && (data.max || 0) > 0) {
              dailyTotals[day] += value;
              activityScore += value;
            }
            data.value = value === 0 ? '' : value.toString();
          });
          
          activity.score = activityScore;
          
          if (this.featuresConfig?.streak_tracking) {
            activity.streaks = activity.streaks || {current: 0, longest: 0};
            
            const todayIndex = this.currentDay === 0 ? 6 : this.currentDay - 1;
            let currentStreak = 0;
            for (let i = 0; i < 7; i++) {
              const dayIndex = (todayIndex - i + 7) % 7;
              const dayKey = CONSTANTS.DAYS[dayIndex];
              if (activity.days[dayKey] && +activity.days[dayKey].value > 0 && (activity.days[dayKey].max || 0) > 0) {
                currentStreak++;
              } else {
                break;
              }
            }
            activity.streaks.current = currentStreak;
            activity.streaks.longest = Math.max(activity.streaks.longest || 0, currentStreak);
          }
        });
      });

      const totalSection = this.schedule.find(s => s.name === 'TOTAL');
      if (totalSection?.activities?.[0]) {
        const totalActivity = totalSection.activities[0];
        let grandTotalScore = 0, grandMaxScore = 0;
        
        Object.entries(dailyTotals).forEach(([day, total]) => {
          if (totalActivity.days?.[day]) totalActivity.days[day].value = total.toString();
          grandTotalScore += total;
        });
        
        this.schedule.forEach(section => {
          if (section.name !== 'TOTAL') {
            section.activities.forEach(activity => grandMaxScore += (activity.maxScore || 0));
          }
        });
        
        Object.assign(totalActivity, {score: grandTotalScore, maxScore: grandMaxScore});
      }
    },

    validateAndSave(event) {
      const input = event.target;
      const min = +input.min, max = +input.max;
      let value = +input.value;
      
      if (isNaN(value)) value = 0;
      if (!isNaN(min) && value < min) value = min;
      if (!isNaN(max) && value > max) value = max;
      
      input.value = value === 0 ? '' : value.toString();
      this.calculateScores();
      this.saveData();
    },

    // Data management - consolidated
    saveData() {
      if (state.isInitializing) return;
      
      clearTimeout(state.saveTimeout);
      this.saveStatus = 'saving';
      
      const saveInterval = this.defaultConfig?.auto_save_interval || 500;
      state.saveTimeout = setTimeout(async () => {
        this.calculateScores();
        const userData = this.getCurrentUserData();
        
        localStorage.setItem(`planner_${this.currentWeek}`, JSON.stringify(userData));
        
        if (this.isOnline && this.featuresConfig?.offline_sync) {
          try {
            await this.saveToPocketbase(this.currentWeek, userData);
            this.pendingSync = this.pendingSync.filter(item => 
              !(item.weekId === this.currentWeek && item.operation !== 'delete'));
          } catch (error) {
            console.log('PocketBase save failed:', error.message);
            this.addToPendingSync(this.currentWeek, userData);
          }
        } else {
          this.addToPendingSync(this.currentWeek, userData);
        }
        
        localStorage.setItem('planner_pending_sync', JSON.stringify(this.pendingSync));
        state.lastSavedState = JSON.stringify(userData);
        this.saveStatus = 'saved';
      }, saveInterval);
    },

    hasSignificantChanges: () => !state.lastSavedState || JSON.stringify(this.getCurrentUserData()) !== state.lastSavedState,

    addToPendingSync(weekId, data, operation = 'save') {
      if (!this.featuresConfig?.offline_sync) return;
      
      this.pendingSync = this.pendingSync.filter(item => 
        !(item.weekId === weekId && item.operation === operation));
      this.pendingSync.push({
        weekId, data: data ? JSON.parse(JSON.stringify(data)) : null,
        operation, timestamp: new Date().toISOString()
      });
      localStorage.setItem('planner_pending_sync', JSON.stringify(this.pendingSync));
    },

    // PocketBase operations - consolidated
    async saveToPocketbase(weekId, userData) {
      try {
        const existing = await pb.collection('planners').getFirstListItem(`week_id="${weekId}"`);
        await pb.collection('planners').update(existing.id, userData);
      } catch (error) {
        if (error.status === 404) {
          await pb.collection('planners').create(userData);
        } else {
          throw error;
        }
      }
    },

    async deleteFromPocketbase(weekId) {
      try {
        const existing = await pb.collection('planners').getFirstListItem(`week_id="${weekId}"`);
        await pb.collection('planners').delete(existing.id);
      } catch (error) {
        if (error.status !== 404) throw error;
      }
    },

    async syncPendingData() {
      if (!this.isOnline || !this.pendingSync.length || !this.featuresConfig?.offline_sync) return;
      
      const itemsToSync = [...this.pendingSync];
      this.pendingSync = [];
      
      for (const item of itemsToSync) {
        try {
          if (item.operation === 'delete') {
            await this.deleteFromPocketbase(item.weekId);
          } else {
            await this.saveToPocketbase(item.weekId, item.data);
          }
          
          const remaining = JSON.parse(localStorage.getItem('planner_pending_sync') || '[]');
          localStorage.setItem('planner_pending_sync', 
            JSON.stringify(remaining.filter(i => i.timestamp !== item.timestamp)));
        } catch (error) {
          console.log('Sync failed:', error.message);
          this.pendingSync.push(item);
        }
      }
      
      if (this.pendingSync.length > 0) {
        localStorage.setItem('planner_pending_sync', JSON.stringify(this.pendingSync));
      }
    },

    // Week management - consolidated
    async fetchSavedWeeks() {
      const weekMap = new Map();
      const currentIso = this.currentWeek;
      
      const addWeek = (iso, dateRange, source, isCurrent) => {
        const existing = weekMap.get(iso);
        const newDateRange = dateRange || utils.getWeekDateRange(utils.parseISOWeek(iso));
        
        if (!existing || (source === 'pocketbase' && existing.source !== 'pocketbase') || 
            (source === 'local' && existing.source === 'current')) {
          weekMap.set(iso, {iso_week: iso, dateRange: newDateRange, source, isCurrent});
        } else if (existing && !existing.dateRange && newDateRange) {
          existing.dateRange = newDateRange;
        }
      };
      
      addWeek(currentIso, utils.getWeekDateRange(utils.parseISOWeek(currentIso)), 'current', true);
      
      if (this.isOnline) {
        try {
          const records = await pb.collection('planners').getFullList({
            sort: '-week_id', fields: 'week_id,date_range'
          });
          records.forEach(record => 
            addWeek(record.week_id, record.date_range, 'pocketbase', record.week_id === currentIso));
        } catch (error) {
          console.log('Fetch saved weeks failed:', error.message);
        }
      }
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('planner_') && !key.includes('pending_sync') && !key.startsWith('planner_template_')) {
          const iso = key.replace('planner_', '');
          const data = JSON.parse(localStorage.getItem(key) || '{}');
          addWeek(iso, data.date_range, 'local', iso === currentIso);
        }
      }
      
      this.savedWeeks = Array.from(weekMap.values()).sort((a, b) => {
        if (a.isCurrent && !b.isCurrent) return -1;
        if (!a.isCurrent && b.isCurrent) return 1;
        return b.iso_week.localeCompare(a.iso_week);
      });
    },

    confirmLoadWeek(isoWeek) {
      if (this.hasSignificantChanges() && isoWeek !== this.currentWeek && 
          !confirm("Unsaved changes. Load anyway?")) return;
      this.loadWeek(isoWeek);
    },

    confirmDeleteWeek(isoWeek) {
      if (confirm(`Delete schedule for ${isoWeek}?`)) this.deleteWeek(isoWeek);
    },

    async deleteWeek(isoWeek) {
      localStorage.removeItem(`planner_${isoWeek}`);
      
      if (this.isOnline) {
        try {
          await this.deleteFromPocketbase(isoWeek);
        } catch (error) {
          console.log('Delete failed:', error.message);
        }
      } else {
        this.addToPendingSync(isoWeek, null, 'delete');
      }
      
      this.savedWeeks = this.savedWeeks.filter(w => w.iso_week !== isoWeek);
      
      if (this.currentWeek === isoWeek) {
        this.currentWeek = utils.getCurrentIsoWeek();
        await this.loadWeek(this.currentWeek);
      }
    },

    showMessage(message) {
      this.notificationMessage = message;
      this.showNotification = true;
      clearTimeout(state.notificationTimeout);
      state.notificationTimeout = setTimeout(() => this.showNotification = false, 3000);
    }
  };
};
