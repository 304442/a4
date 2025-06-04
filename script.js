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
    pendingSync: [], showCitySelector: false, showWeekSelector: false, dropdownPosition: { top: 0, left: 0 },
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

      const filter = templateName === "default" ? 'is_default=true' : `name="${templateName}"`;
      const template = await pb.collection('templates').getFirstListItem(filter);
      localStorage.setItem(cacheKey, JSON.stringify(template));
      return template;
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
        console.log('Cities fetch failed, using defaults:', error.message);
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
      
      // Always create exactly 20 tasks - no hardcoding
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
          // PocketBase returns 404 for both missing collection AND no matching records
          if (error.status === 404) {
            return null; // Treat as "no record found" - this is normal for new weeks
          }
          throw error; // Re-throw other errors (network issues, etc.)
        }
      }
      const local = localStorage.getItem(`planner_${isoWeek}`);
      return local ? JSON.parse(local) : null;
    },

    async fetchTemplateById(templateId) {
      return await pb.collection('templates').getOne(templateId);
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
        this.saveData();
      };

      const cancel = () => {
        this.cleanup(element, input, originalText);
      };

      const handleKey = (e) => {
        if (e.key === 'Enter' && !isTextarea) { e.preventDefault(); save(); }
        else if (e.key === 'Escape') cancel();
      };

      input.addEventListener('blur', save);
      input.addEventListener('keydown', handleKey);
    },

    cleanup(element, input, text) {
      if (input.parentNode === element) element.removeChild(input);
      element.innerText = text;
    },

    updateField(type, value, ...args) {
      const handlers = {
        plannerTitle: () => this.plannerTitle = value,
        timeLabel: (i) => { if (this.times[i]) this.times[i].label = value; },
        sectionTitle: (section) => { if (this.uiConfig.sectionTitles?.[section]) this.uiConfig.sectionTitles[section] = value; },
        header: (headerType, index) => {
          const map = { main: 'mainTableHeaders', day: 'dayHeaders', max: 'maxHeaders', task: 'taskHeaders' };
          if (this.uiConfig[map[headerType]]?.[index] !== undefined) this.uiConfig[map[headerType]][index] = value;
        },
        sectionName: (sIdx) => {
          const mappedIdx = this.schedule.length - 1 - sIdx;
          if (this.schedule[mappedIdx]) this.schedule[mappedIdx].name = value;
        },
        activityPrefix: (indices) => this.updateActivityName(indices, value, true),
        activityName: (indices) => this.updateActivityName(indices, value, false),
        maxValue: (indices) => {
          const activity = this.getScheduleActivity(indices);
          if (activity?.days[indices.day]) activity.days[indices.day].max = parseInt(value) || 0;
        },
        maxScore: (indices) => {
          const activity = this.getScheduleActivity(indices);
          if (activity) activity.maxScore = parseInt(value) || 0;
        },
        workoutDayName: (i) => { if (this.workoutPlan[i]) this.workoutPlan[i].name = value; },
        exercisePrefix: (indices) => { 
          const ex = this.workoutPlan[indices.dayIdx]?.exercises[indices.exIdx];
          if (ex) ex.prefix = value;
        },
        exerciseName: (indices) => {
          const ex = this.workoutPlan[indices.dayIdx]?.exercises[indices.exIdx];
          if (ex) ex.name = value;
        },
        mealName: (i) => { if (this.meals[i]) this.meals[i].name = value; },
        mealIngredients: (i) => { if (this.meals[i]) this.meals[i].ingredients = value; },
        groceryCategoryName: (i) => { if (this.groceryList[i]) this.groceryList[i].name = value; },
        groceryCategoryItems: (i) => { if (this.groceryList[i]) this.groceryList[i].items = value; },
        measurementName: (i) => { if (this.bodyMeasurements[i]) this.bodyMeasurements[i].name = value; },
        financialName: (i) => { if (this.financials[i]) this.financials[i].name = value; },
        financialAccount: (i) => { if (this.financials[i]) this.financials[i].account = value; }
      };

      const handler = handlers[type];
      if (handler) handler(...args);
    },

    updateActivityName(indices, value, isPrefix) {
      const activity = this.getScheduleActivity(indices);
      if (activity) {
        const parts = activity.name.split(':');
        if (isPrefix) {
          activity.name = value + (parts.length > 1 ? ':' + parts.slice(1).join(':').trimStart() : '');
        } else {
          activity.name = (parts.length > 1 ? parts[0].trim() + ': ' : '') + value;
        }
      }
    },

    getScheduleActivity(indices) {
      const sIdxMapped = this.schedule.length - 1 - indices.sIdx;
      return this.schedule[sIdxMapped]?.activities[indices.aIdx];
    },

    // Project Management
    getTaskDelay(task) {
      if (!task.expectedDate || !task.actualDate) return 0;
      const expected = new Date(task.expectedDate);
      const actual = new Date(task.actualDate);
      return Math.ceil((actual - expected) / (1000 * 60 * 60 * 24));
    },

    calculateTaskDelay(task) {
      task._delay = this.getTaskDelay(task);
      return task._delay;
    },

    formatDelay(days) {
      if (days === 0) return '⏰';
      return days > 0 ? `+${days}d` : `${days}d`;
    },

    toggleTaskCompletion(task) { 
      task.completed = task.completed === '✓' ? '☐' : '✓'; 
      if (task.completed === '✓' && !task.actualDate) {
        task.actualDate = new Date().toISOString().split('T')[0];
        this.calculateTaskDelay(task);
      }
      this.saveData(); 
    },

    // UI Helpers
    getScoreClass(activity) {
      if (activity.maxScore <= 0) return '';
      const ratio = activity.score / activity.maxScore;
      if (ratio < 0.33) return 'score-low';
      if (ratio < 0.66) return 'score-medium';
      return 'score-high';
    },

    getTaskRowClass(task) {
      const classes = [];
      if (task.completed === '✓') classes.push('task-completed');
      const delay = this.getTaskDelay(task);
      if (delay > 0) classes.push('task-delayed');
      else if (delay < 0) classes.push('task-early');
      return classes.join(' ');
    },

    getDelayClass(task) {
      const delay = this.getTaskDelay(task);
      if (delay < 0) return 'delay-negative';
      if (delay > 0) return 'delay-positive';
      return 'delay-zero';
    },

    getProgressStyle(activity) {
      if (activity.maxScore <= 0) return 'width: 0%';
      const percentage = Math.min(100, (activity.score / activity.maxScore) * 100);
      return `width: ${percentage}%`;
    },

    getProgressClass(activity) {
      if (activity.maxScore <= 0) return '';
      const ratio = activity.score / activity.maxScore;
      if (ratio < 0.33) return 'progress-low';
      if (ratio < 0.66) return 'progress-medium';
      return 'progress-high';
    },

    getTaskColumnStyle(i) {
      const widths = this.currentTemplate?.structure?.ui?.task_column_widths || [];
      return widths[i] ? `width:${widths[i]}` : 'text-align:left';
    },

    getDropdownStyle() {
      return `top: ${this.dropdownPosition.top}px; left: ${this.dropdownPosition.left}px;`;
    },

    // Selectors
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
      if (cityOption.lat === null) {
        await this.getPrayerTimes();
      } else {
        await this.fetchPrayerTimes(cityOption.lat, cityOption.lon);
      }
      this.saveData();
    },

    // Prayer Times
    async getPrayerTimes() {
      try {
        const position = await new Promise((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject, {timeout: 5000, maximumAge: 60000})
        );
        const { latitude, longitude } = position.coords;
        
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&accept-language=en`);
        const data = await response.json();
        this.city = data.address?.city || data.address?.town || data.address?.village || "Current Location";
        
        await this.fetchPrayerTimes(latitude, longitude);
      } catch (error) {
        console.log('Geolocation failed:', error.message);
      }
    },

    async fetchPrayerTimes(lat, lon) {
      try {
        const today = new Date();
        const dateKey = `${today.getFullYear()}_${today.getMonth()+1}_${today.getDate()}`;
        const cacheKey = `prayer_times_${dateKey}_${lat.toFixed(2)}_${lon.toFixed(2)}`;
        
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          this.setPrayerTimes(JSON.parse(cached));
          return;
        }

        const response = await fetch(`https://api.aladhan.com/v1/calendar/${today.getFullYear()}/${today.getMonth()+1}?latitude=${lat}&longitude=${lon}&method=2`);
        const data = await response.json();
        localStorage.setItem(cacheKey, JSON.stringify(data.data[today.getDate()-1].timings));
        this.setPrayerTimes(data.data[today.getDate()-1].timings);
      } catch (error) {
        console.log('Prayer times fetch failed:', error.message);
      }
    },

    setPrayerTimes(timings) {
      const qiyamTime = this.calculateQiyamTime(timings.Fajr);
      const prayerMap = {Q: qiyamTime, F: timings.Fajr, D: timings.Dhuhr, A: timings.Asr, M: timings.Maghrib, I: timings.Isha};
      
      let changed = false;
      this.times.forEach(time => {
        const newTime = this.formatTime(prayerMap[time.label]);
        if (time.value !== newTime) {
          time.value = newTime;
          changed = true;
        }
      });
      
      if (changed && !isInitializing) this.saveData();
    },

    formatTime(timeStr) {
      if (!timeStr) return "";
      const [hourStr, minStr] = timeStr.split(" ")[0].split(":");
      const hour = parseInt(hourStr), min = parseInt(minStr);
      if (isNaN(hour) || isNaN(min)) return "";
      return `${hour % 12 || 12}:${min.toString().padStart(2,'0')}${hour >= 12 ? "PM" : "AM"}`;
    },

    calculateQiyamTime(fajrTime) {
      if (!fajrTime) return "";
      const [hourStr, minStr] = fajrTime.split(" ")[0].split(":");
      let hour = parseInt(hourStr), min = parseInt(minStr);
      if (isNaN(hour) || isNaN(min)) return "";
      hour = hour - 1;
      if (hour < 0) hour = 23;
      return `${hour}:${min.toString().padStart(2,'0')}`;
    },

    // Calculations
    calculateScores() {
      const dailyTotals = {mon:0, tue:0, wed:0, thu:0, fri:0, sat:0, sun:0};
      const dayKeys = Object.keys(dailyTotals);

      this.schedule.forEach(section => {
        if (section.name === 'TOTAL') return;
        
        section.activities.forEach(activity => {
          let activityScore = 0;
          
          Object.entries(activity.days || {}).forEach(([day, data]) => {
            if (!data) return;
            const value = parseInt(data.value) || 0;
            if (value > 0 && (data.max || 0) > 0) {
              dailyTotals[day] += value;
              activityScore += value;
            }
            data.value = value === 0 ? '' : value.toString();
          });
          
          activity.score = activityScore;
          activity.streaks = activity.streaks || {current: 0, longest: 0};
          
          const todayIndex = this.currentDay === 0 ? 6 : this.currentDay - 1;
          let currentStreak = 0;
          for (let i = 0; i < 7; i++) {
            const dayIndex = (todayIndex - i + 7) % 7;
            const dayKey = dayKeys[dayIndex];
            if (activity.days[dayKey] && parseInt(activity.days[dayKey].value) > 0 && (activity.days[dayKey].max || 0) > 0) {
              currentStreak++;
            } else {
              break;
            }
          }
          activity.streaks.current = currentStreak;
          activity.streaks.longest = Math.max(activity.streaks.longest || 0, currentStreak);
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
        
        totalActivity.score = grandTotalScore;
        totalActivity.maxScore = grandMaxScore;
      }
    },

    validateAndSave(event) {
      const input = event.target;
      const min = parseFloat(input.min);
      const max = parseFloat(input.max);
      let value = parseFloat(input.value);
      
      if (isNaN(value)) value = 0;
      if (!isNaN(min) && value < min) value = min;
      if (!isNaN(max) && value > max) value = max;
      
      input.value = value === 0 ? '' : value.toString();
      this.calculateScores();
      this.saveData();
    },

    // Data Management
    saveData() {
      if (isInitializing) return;
      
      clearTimeout(this.saveTimeout);
      this.saveStatus = 'saving';
      
      this.saveTimeout = setTimeout(async () => {
        this.calculateScores();
        const userData = this.getCurrentUserData();
        
        localStorage.setItem(`planner_${this.currentWeek}`, JSON.stringify(userData));
        
        if (this.isOnline) {
          try {
            await this.saveToPocketbase(this.currentWeek, userData);
            this.pendingSync = this.pendingSync.filter(item => 
              !(item.weekId === this.currentWeek && item.operation !== 'delete')
            );
          } catch (error) {
            console.log('PocketBase save failed:', error.message);
            this.addToPendingSync(this.currentWeek, userData);
          }
        } else {
          this.addToPendingSync(this.currentWeek, userData);
        }
        
        localStorage.setItem('planner_pending_sync', JSON.stringify(this.pendingSync));
        lastSavedState = JSON.stringify(userData);
        this.saveStatus = 'saved';
      }, 500);
    },

    hasSignificantChanges() {
      if (!lastSavedState) return true;
      const current = this.getCurrentUserData();
      return JSON.stringify(current) !== lastSavedState;
    },

    addToPendingSync(weekId, data, operation = 'save') {
      this.pendingSync = this.pendingSync.filter(item => 
        !(item.weekId === weekId && item.operation === operation)
      );
      this.pendingSync.push({
        weekId, data: data ? JSON.parse(JSON.stringify(data)) : null,
        operation, timestamp: new Date().toISOString()
      });
      localStorage.setItem('planner_pending_sync', JSON.stringify(this.pendingSync));
    },

    async syncPendingData() {
      if (!this.isOnline || this.pendingSync.length === 0) return;
      
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
            JSON.stringify(remaining.filter(i => i.timestamp !== item.timestamp))
          );
        } catch (error) {
          console.log('Sync failed:', error.message);
          this.pendingSync.push(item);
        }
      }
      
      if (this.pendingSync.length > 0) {
        localStorage.setItem('planner_pending_sync', JSON.stringify(this.pendingSync));
      }
    },

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

    // Week Management
    async fetchSavedWeeks() {
      const weekMap = new Map();
      const currentIso = this.getCurrentIsoWeek();
      
      const addWeek = (iso, dateRange, source, isCurrent) => {
        const existing = weekMap.get(iso);
        const newDateRange = dateRange || this.getWeekDateRange(this.parseISOWeek(iso));
        
        if (!existing || (source === 'pocketbase' && existing.source !== 'pocketbase') || 
            (source === 'local' && existing.source === 'current')) {
          weekMap.set(iso, {iso_week: iso, dateRange: newDateRange, source, isCurrent});
        } else if (existing && !existing.dateRange && newDateRange) {
          existing.dateRange = newDateRange;
        }
      };
      
      addWeek(currentIso, this.getWeekDateRange(this.parseISOWeek(currentIso)), 'current', true);
      
      if (this.isOnline) {
        try {
          const records = await pb.collection('planners').getFullList({
            sort: '-week_id', fields: 'week_id,date_range'
          });
          records.forEach(record => 
            addWeek(record.week_id, record.date_range, 'pocketbase', record.week_id === currentIso)
          );
        } catch (error) {
          console.log('Fetch saved weeks failed:', error.message);
        }
      }
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('planner_') && !key.includes('pending_sync') && !key.startsWith('planner_template_')) {
          const iso = key.replace('planner_', '');
          const data = JSON.parse(localStorage.getItem(key));
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
          !confirm("Unsaved changes. Load anyway?")) {
        return;
      }
      this.loadWeek(isoWeek);
    },

    confirmDeleteWeek(isoWeek) {
      if (confirm(`Delete schedule for ${isoWeek}?`)) {
        this.deleteWeek(isoWeek);
      }
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
        this.currentWeek = this.getCurrentIsoWeek();
        await this.loadWeek(this.currentWeek);
      }
    },

    // Utilities
    getCurrentIsoWeek() {
      const now = new Date();
      const date = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
      date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
      const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
      const weekNumber = Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
      return `${date.getUTCFullYear()}-W${weekNumber.toString().padStart(2, '0')}`;
    },

    parseISOWeek(isoString) {
      const [year, weekPart] = isoString.split('-');
      const week = parseInt(weekPart.substring(1));
      const date = new Date(Date.UTC(parseInt(year), 0, 1 + (week - 1) * 7));
      date.setUTCDate(date.getUTCDate() - (date.getUTCDay() || 7) + 1);
      return date;
    },

    getWeekDateRange(date) {
      const start = new Date(date);
      const end = new Date(start);
      end.setUTCDate(start.getUTCDate() + 6);
      return `${this.formatDate(start)}-${this.formatDate(end)}`;
    },

    formatDate(date) {
      return `${(date.getUTCMonth() + 1).toString().padStart(2, '0')}/${date.getUTCDate().toString().padStart(2, '0')}`;
    },

    showMessage(message) {
      this.notificationMessage = message;
      this.showNotification = true;
      clearTimeout(this.notificationTimeout);
      this.notificationTimeout = setTimeout(() => this.showNotification = false, 3000);
    }
  };
}
