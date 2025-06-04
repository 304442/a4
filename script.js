function plannerApp() {
  const pb = new PocketBase('/');
  pb.autoCancellation(false);
  let isInitializing = true;
  let lastSavedState = null;
  let uniqueIdCounter = 0;
  const generateId = () => `id_${Date.now()}_${uniqueIdCounter++}`;

  return {
    // State
    currentWeek: '', dateRange: '', city: 'London', saveStatus: 'saved', saveTimeout: null,
    showNotification: false, notificationMessage: '', notificationTimeout: null, isOnline: navigator.onLine,
    pendingSync: [], showCitySelector: false, showWeekSelector: false,
    currentDay: (new Date()).getDay(), plannerTitle: 'Weekly Planner',
    uiConfig: {}, times: [], schedule: [], tasks: [], workoutPlan: [], meals: [],
    groceryBudget: '', groceryList: [], bodyMeasurements: [], financials: [],
    currentTemplate: null, currentTemplateId: null, savedWeeks: [], cityOptions: [],

    // Initialization
    async init() {
      this.setupEventListeners();
      this.pendingSync = JSON.parse(localStorage.getItem('planner_pending_sync') || '[]');
      this.currentWeek = this.getCurrentIsoWeek();
      this.dateRange = this.getWeekDateRange(this.parseISOWeek(this.currentWeek));
      await this.loadCityOptions();
      await this.loadWeek(this.currentWeek, true);
      setInterval(() => { if (!isInitializing && this.hasSignificantChanges()) this.saveData(); }, 30000);
      if (this.isOnline) this.syncPendingData();
    },

    setupEventListeners() {
      window.addEventListener('online', () => { this.isOnline = true; this.syncPendingData(); });
      window.addEventListener('offline', () => this.isOnline = false);
      document.addEventListener('click', e => { 
        if (!e.target.closest('.dropdown,.clickable')) {
          this.showCitySelector = this.showWeekSelector = false; 
        }
      });
    },

    // PocketBase-only template fetching
    async fetchTemplate(templateName = "default") {
      const cacheKey = `template_${templateName}`;
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const template = JSON.parse(cached);
        if (template.id && template.id !== 'fallback') {
          return template;
        }
        localStorage.removeItem(cacheKey);
      }

      try {
        const filter = templateName === "default" ? 'is_default=true' : `name="${templateName}"`;
        const template = await pb.collection('templates').getFirstListItem(filter);
        localStorage.setItem(cacheKey, JSON.stringify(template));
        return template;
      } catch (error) {
        return this.getFallbackTemplate();
      }
    },

    getFallbackTemplate() {
      return {
        id: 'fallback',
        name: 'fallback',
        structure: {
          ui: {
            title_default: 'Weekly Planner',
            headers: {
              main_table: ['TIME', 'DAY', 'ACTIVITY', 'SCR', 'MAX', '🔥'],
              days: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'],
              max_cols: Array(7).fill('MAX'),
              tasks: ['№', '🔥', '🏷️', '✏️ Task/Project/Note', '📅', '🎯', '✅', '⏰', '✓']
            },
            sections: {
              tasks: 'TASKS & PROJECT MANAGEMENT',
              workout: 'WORKOUT PLAN',
              meals: 'MEAL PREP',
              grocery: 'GROCERY LIST',
              measurements: 'BODY MEASUREMENTS',
              financials: 'FINANCIALS'
            }
          },
          prayer_times: [
            { label: 'Q', value: '' }, { label: 'F', value: '' }, { label: 'D', value: '' },
            { label: 'A', value: '' }, { label: 'M', value: '' }, { label: 'I', value: '' }
          ],
          schedule: [
            {
              name: 'TOTAL',
              activities: [
                { name: 'DAILY POINTS', max_per_day: 0, max_score: 0 }
              ]
            }
          ],
          tasks: { count: 20 },
          workout: [],
          meals: [],
          grocery: { budget_default: '£120', categories: [] },
          measurements: [],
          financials: [],
          city_default: "London"
        }
      };
    },

    async loadCityOptions() {
      try {
        const cities = await pb.collection('cities').getFullList();
        this.cityOptions = cities.map(city => ({
          name: city.name,
          lat: city.latitude,
          lon: city.longitude
        }));
      } catch (error) {
        this.cityOptions = [
          { name: 'London', lat: 51.5074, lon: -0.1278 },
          { name: 'Cairo', lat: 30.0444, lon: 31.2357 },
          { name: 'Cape Town', lat: -33.9249, lon: 18.4241 },
          { name: 'Amsterdam', lat: 52.3676, lon: 4.9041 },
          { name: 'Current Location', lat: null, lon: null }
        ];
      }
    },

    applyTemplateStructure(template) {
      this.currentTemplate = template;
      this.currentTemplateId = template.id;
      const s = template.structure;

      this.plannerTitle = s.ui?.title_default || 'Weekly Planner';
      this.uiConfig = {
        mainTableHeaders: s.ui?.headers?.main_table || [],
        dayHeaders: s.ui?.headers?.days || [],
        maxHeaders: s.ui?.headers?.max_cols || [],
        taskHeaders: s.ui?.headers?.tasks || [],
        sectionTitles: s.ui?.sections || {}
      };

      this.times = [...(s.prayer_times || [])];
      this.schedule = this.buildScheduleFromTemplate(s.schedule);
      
      const taskCount = s.tasks?.count || 20;
      this.tasks = Array(taskCount).fill().map(() => ({
        id: generateId(), num: '', priority: '', tag: '', description: '', 
        startDate: '', expectedDate: '', actualDate: '', completed: ''
      }));

      this.workoutPlan = this.buildWorkoutFromTemplate(s.workout || []);
      this.meals = this.ensureIds([...(s.meals || [])]);
      this.groceryBudget = s.grocery?.budget_default || '';
      this.groceryList = this.ensureIds([...(s.grocery?.categories || [])]);
      this.bodyMeasurements = this.ensureIds([...(s.measurements || [])]);
      this.financials = this.ensureIds([...(s.financials || [])]);
      this.city = s.city_default || 'London';
    },

    buildScheduleFromTemplate(templateSchedule) {
      return templateSchedule.map(section => ({
        id: generateId(), 
        name: section.name,
        activities: (section.activities || []).map(activity => ({
          id: generateId(), 
          name: activity.name,
          days: this.createDaysStructure(activity.days, activity.max_per_day || 1),
          score: 0, 
          maxScore: activity.max_score || 0,
          streaks: { current: 0, longest: 0 }
        }))
      }));
    },

    createDaysStructure(specificDays, maxPerDay) {
      const allDays = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
      const days = {};
      const targetDays = specificDays && Array.isArray(specificDays) && specificDays.length > 0 
        ? specificDays.filter(day => allDays.includes(day.toLowerCase())) 
        : allDays;
      
      targetDays.forEach(day => { 
        days[day] = { value: '', max: Math.max(0, parseInt(maxPerDay) || 1) }; 
      });
      return days;
    },

    buildWorkoutFromTemplate(templateWorkout) {
      return templateWorkout.map(day => ({
        id: generateId(), name: day.name,
        exercises: this.ensureIds((day.exercises || []).map(ex => ({
          prefix: '• ', 
          name: ex.name, 
          weight: '', 
          sets: '', 
          reps: '',
          defaultWeight: ex.default_weight?.toString() || '',
          defaultSets: ex.default_sets?.toString() || '',
          defaultReps: ex.default_reps?.toString() || ''
        })))
      }));
    },

    ensureIds(items) {
      return items.map(item => ({ ...item, id: item.id || generateId() }));
    },

    // Data Loading
    async loadWeek(isoWeek, isInitLoad = false) {
      this.showWeekSelector = false; 
      this.currentWeek = isoWeek; 
      this.dateRange = this.getWeekDateRange(this.parseISOWeek(isoWeek));

      let plannerRecord = await this.fetchPlannerRecord(isoWeek);
      let template;

      if (plannerRecord?.template_id) {
        template = await this.fetchTemplateById(plannerRecord.template_id);
      } else {
        template = await this.fetchTemplate("default");
      }

      this.applyTemplateStructure(template);
      if (plannerRecord) this.overlayUserData(plannerRecord);
      this.calculateScores();
      if (isInitLoad && !this.times.some(t => t.value)) {
        await this.getPrayerTimes();
      }
      lastSavedState = JSON.stringify(this.getCurrentUserData());
      if (isInitLoad) isInitializing = false;
    },

    async fetchPlannerRecord(isoWeek) {
      if (this.isOnline) {
        try {
          const record = await pb.collection('planners').getFirstListItem(`week_id="${isoWeek}"`);
          return record;
        } catch (error) {
          if (error.status === 404) {
            return null;
          }
          throw error;
        }
      }
      const local = localStorage.getItem(`planner_${isoWeek}`);
      return local ? JSON.parse(local) : null;
    },

    async fetchTemplateById(templateId) {
      try {
        return await pb.collection('templates').getOne(templateId);
      } catch (error) {
        return this.getFallbackTemplate();
      }
    },

    overlayUserData(record) {
      if (record.title) this.plannerTitle = record.title;
      if (record.city) this.city = record.city;
      if (record.prayer_times) this.overlayArray(this.times, record.prayer_times);
      if (record.schedule_data) this.overlayScheduleData(record.schedule_data);
      if (record.tasks_data) this.overlayArray(this.tasks, record.tasks_data);
      if (record.workout_data) this.overlayWorkoutData(record.workout_data);
      if (record.meals_data) this.overlayArray(this.meals, record.meals_data);
      if (record.grocery_data) this.overlayGroceryData(record.grocery_data);
      if (record.measurements_data) this.overlayArray(this.bodyMeasurements, record.measurements_data);
      if (record.financials_data) this.overlayArray(this.financials, record.financials_data);
    },

    overlayArray(target, source) {
      source.forEach((item, i) => {
        if (target[i]) Object.assign(target[i], item);
      });
    },

    overlayScheduleData(scheduleData) {
      scheduleData.forEach(savedSection => {
        const section = this.schedule.find(s => s.name === savedSection.name);
        if (section) {
          savedSection.activities?.forEach(savedActivity => {
            const activity = section.activities.find(a => a.name === savedActivity.name);
            if (activity) {
              if (savedActivity.days) {
                Object.keys(activity.days).forEach(day => {
                  if (savedActivity.days[day]) {
                    activity.days[day].value = savedActivity.days[day].value || '';
                  }
                });
              }
              activity.score = savedActivity.score || 0;
              activity.streaks = savedActivity.streaks || { current: 0, longest: 0 };
            }
          });
        }
      });
    },

    overlayWorkoutData(workoutData) {
      workoutData.forEach(savedDay => {
        const day = this.workoutPlan.find(d => d.name === savedDay.name);
        if (day) {
          savedDay.exercises?.forEach(savedEx => {
            const exercise = day.exercises.find(ex => ex.name === savedEx.name);
            if (exercise) {
              exercise.weight = savedEx.weight || '';
              exercise.sets = savedEx.sets || '';
              exercise.reps = savedEx.reps || '';
            }
          });
        }
      });
    },

    overlayGroceryData(groceryData) {
      if (groceryData.budget) this.groceryBudget = groceryData.budget;
      if (groceryData.categories) this.overlayArray(this.groceryList, groceryData.categories);
    },

    // User Data Extraction
    getCurrentUserData() {
      return {
        week_id: this.currentWeek,
        template_id: this.currentTemplateId,
        title: this.plannerTitle !== this.currentTemplate?.structure?.ui?.title_default ? this.plannerTitle : null,
        city: this.city !== this.currentTemplate?.structure?.city_default ? this.city : null,
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

    extractScheduleData() {
      return this.schedule.map(section => ({
        name: section.name,
        activities: section.activities.map(activity => ({
          name: activity.name,
          days: Object.keys(activity.days).reduce((acc, day) => {
            if (activity.days[day].value) acc[day] = { value: activity.days[day].value };
            return acc;
          }, {}),
          score: activity.score,
          streaks: activity.streaks
        })).filter(activity => Object.keys(activity.days).length > 0 || activity.score > 0)
      })).filter(section => section.activities.length > 0);
    },

    extractUserTasks() {
      return this.tasks.filter(task => 
        task.num || task.priority || task.tag || task.description || 
        task.startDate || task.expectedDate || task.actualDate || task.completed
      );
    },

    extractWorkoutData() {
      return this.workoutPlan.map(day => ({
        name: day.name,
        exercises: day.exercises.filter(ex => ex.weight || ex.sets || ex.reps).map(ex => ({
          name: ex.name, weight: ex.weight, sets: ex.sets, reps: ex.reps
        }))
      })).filter(day => day.exercises.length > 0);
    },

    extractUserItems(items, fields) {
      return items.filter(item => fields.some(field => item[field]));
    },

    extractGroceryData() {
      const categories = this.extractUserItems(this.groceryList, ['name', 'items']);
      return {
        budget: this.groceryBudget || null,
        categories: categories.length > 0 ? categories : null
      };
    },

    // Editing
    editField(event, type, currentValue = '', ...args) {
      const element = event.currentTarget;
      const isTextarea = ['mealIngredients', 'groceryCategoryItems'].includes(type);
      const input = document.createElement(isTextarea ? 'textarea' : 'input');
      
      input.type = 'text';
      input.value = currentValue;
      input.className = isTextarea ? 'inline-edit-textarea' : 'inline-edit-input';
      if (isTextarea) input.rows = 3;

      const originalText = element.innerText;
      element.innerHTML = '';
      element.appendChild(input);
      input.focus();
      input.select();

      const save = () => {
        const newValue = input.value;
        this.updateField(type, newValue, ...args);
        this.cleanup(element, input, newValue || originalText);
        this.save
