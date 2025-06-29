// PocketBase will be accessed when needed, not at module load time

let uniqueIdCounter = 0;
const generateId = () => `id_${Date.now()}_${uniqueIdCounter++}`;

// Constants
const SAVE_DEBOUNCE_MS = 500;
const SAVE_ERROR_TIMEOUT_MS = 3000;
const SAVE_TIMEOUT_MS = 5000;
const AUTO_SAVE_INTERVAL_MS = 30000;
const GEOLOCATION_MAX_AGE_MS = 60000;
const NOTIFICATION_TIMEOUT_MS = 3000;
const MIN_PERCENTAGE = 0;
const MAX_PERCENTAGE = 100;
const PROGRESS_LOW_THRESHOLD = 0.33;
const PROGRESS_MEDIUM_THRESHOLD = 0.66;

class PlannerStore {
  // State
  pb = null;
  isInitializing = $state(true);
  lastSavedState = null;
  
  // Core data
  currentWeek = $state('');
  dateRange = $state('');
  city = $state('London');
  saveStatus = $state('saved');
  saveTimeout = null;
  showNotification = $state(false);
  notificationMessage = $state('');
  notificationTimeout = null;
  isOnline = $state(navigator.onLine);
  pendingSync = $state([]);
  showCitySelector = $state(false);
  showWeekSelector = $state(false);
  cityDropdownStyle = $state('');
  weekDropdownStyle = $state('');
  currentDay = $state((new Date()).getDay());
  plannerTitle = $state('Weekly Planner');
  times = $state([]);
  schedule = $state([]);
  tasks = $state([]);
  workoutPlan = $state([]);
  meals = $state([]);
  groceryList = $state([]);
  bodyMeasurements = $state([]);
  financials = $state([]);
  currentTemplate = $state(null);
  currentTemplateId = $state(null);
  savedWeeks = $state([]);
  cityOptions = $state([
    { name: 'London', lat: 51.5074, lon: -0.1278 },
    { name: 'Cairo', lat: 30.0444, lon: 31.2357 },
    { name: 'Cape Town', lat: -33.9249, lon: 18.4241 },
    { name: 'Amsterdam', lat: 52.3676, lon: 4.9041 },
    { name: 'Current Location', lat: null, lon: null }
  ]);
  
  // Setup Modal
  showSetupModal = $state(false);
  
  constructor() {
    // Initialize PocketBase when constructor runs
    if (window.PocketBase) {
      this.pb = new window.PocketBase(window.location.origin);
      this.pb.autoCancellation(false);
    }
    this.setupEventListeners();
  }
  
  setupEventListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.syncPendingData();
    });
    window.addEventListener('offline', () => this.isOnline = false);
    document.addEventListener('click', e => {
      if (!e.target.closest('.dropdown-portal,.clickable')) {
        this.showCitySelector = this.showWeekSelector = false;
      }
    });
  }
  
  async init() {
    // Ensure PocketBase is initialized
    if (!this.pb && window.PocketBase) {
      this.pb = new window.PocketBase(window.location.origin);
      this.pb.autoCancellation(false);
    }
    
    if (!this.pb) {
      console.error('PocketBase not available, showing setup notification');
      this.showSetupNotification();
      this.isInitializing = false;
      return;
    }
    
    // Check if database is initialized
    if (!(await this.checkDatabaseInitialized())) {
      // Show notification to setup database
      this.showSetupNotification();
      // Also set isInitializing to false so the app renders
      this.isInitializing = false;
      return;
    }
    
    this.pendingSync = JSON.parse(localStorage.getItem('planner_pending_sync') || '[]');
    this.currentWeek = this.getCurrentIsoWeek();
    this.dateRange = this.getWeekDateRange(this.parseISOWeek(this.currentWeek));
    
    try {
      await this.loadWeek(this.currentWeek, true);
    } catch (error) {
      console.error('Error loading week during initialization:', error);
      this.showMessage('Error loading planner data. Please refresh the page.');
      // Ensure we set isInitializing to false even on error so the UI renders
      this.isInitializing = false;
    } finally {
      // Extra safety: ensure isInitializing is false after 5 seconds no matter what
      setTimeout(() => {
        if (this.isInitializing) {
          console.error('Initialization timeout - forcing isInitializing to false');
          this.isInitializing = false;
        }
      }, SAVE_TIMEOUT_MS);
    }
    
    setInterval(() => {
      if (!this.isInitializing && this.hasSignificantChanges()) this.saveData();
    }, AUTO_SAVE_INTERVAL_MS);
    if (this.isOnline) this.syncPendingData();
  }
  
  async checkDatabaseInitialized() {
    try {
      // Try to get the default template
      const template = await this.pb.collection('templates').getFirstListItem('is_default=true');
      
      // Verify template has proper structure
      let structure = template.structure;
      if (typeof structure === 'string') {
        structure = JSON.parse(structure);
      }
      
      if (!structure.schedule || !Array.isArray(structure.schedule)) {
        console.error('Template structure is invalid - missing schedule array');
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error checking database initialization:', error);
      return false;
    }
  }
  
  showSetupNotification() {
    // Ensure DOM is ready
    if (!document.body) {
      setTimeout(() => this.showSetupNotification(), 100);
      return;
    }
    
    // Check if notification already exists
    if (document.querySelector('.setup-notification')) {
      return;
    }
    
    // Create a persistent setup notification
    const notification = document.createElement('div');
    notification.className = 'setup-notification';
    
    // Create span element
    const span = document.createElement('span');
    span.textContent = 'Database not initialized';
    notification.appendChild(span);
    
    // Create button element
    const button = document.createElement('button');
    button.className = 'setup-notification-button';
    button.textContent = 'Setup';
    notification.appendChild(button);
    
    // Add to DOM
    document.body.appendChild(notification);
    
    // Add event listener to the button
    button.addEventListener('click', () => {
      this.showSetupModal = true;
      
      // Force check if modal appears
      setTimeout(() => {
        const modal = document.querySelector('.setup-modal-overlay');
      }, 100);
    });
  }
  
  // Template Management
  async fetchTemplate(templateName = "default") {
    const cacheKey = `template_${templateName}`;
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) return JSON.parse(cached);
    } catch (e) {
      localStorage.removeItem(cacheKey);
    }
    
    if (!this.isOnline) {
      this.showMessage("Offline: Using fallback template");
      return this.getFallbackTemplate();
    }
    
    try {
      const filter = templateName === "default" ? 'is_default=true' : `name="${templateName}"`;
      const template = await this.pb.collection('templates').getFirstListItem(filter);
      localStorage.setItem(cacheKey, JSON.stringify(template));
      return template;
    } catch (error) {
      console.error('Template fetch error:', error);
      this.showMessage("Template error: Using fallback");
      return this.getFallbackTemplate();
    }
  }
  
  getFallbackTemplate() {
    return {
      id: 'fallback',
      name: 'fallback',
      structure: {
        prayer_times: [
          { label: 'Q', value: '' },
          { label: 'F', value: '' },
          { label: 'D', value: '' },
          { label: 'A', value: '' },
          { label: 'M', value: '' },
          { label: 'I', value: '' }
        ],
        schedule: [
          {
            name: 'TOTAL',
            activities: [
              { name: 'DAILY POINTS', max_per_day: 0, max_score: 0 }
            ]
          }
        ],
        tasks: {
          count: 5,
          fields: ['num', 'priority', 'tag', 'description', 'start_date', 'expected_date', 'actual_date', 'completed']
        },
        workout: [],
        meals: [],
        grocery: { categories: [] },
        measurements: [],
        financials: [],
        city_default: "London"
      }
    };
  }
  
  applyTemplateStructure(template) {
    this.currentTemplate = template;
    this.currentTemplateId = template.id;
    
    // Parse structure if it's a string (PocketBase might return JSON fields as strings)
    let s = template.structure;
    if (typeof s === 'string') {
      try {
        s = JSON.parse(s);
      } catch (e) {
        console.error('Failed to parse template structure:', e);
        s = {};
      }
    }
    
    this.plannerTitle = s.title_default || 'Weekly Planner';
    this.times = s.prayer_times || [];
    this.schedule = this.buildScheduleFromTemplate(s.schedule || []);
    
    this.tasks = Array(s.tasks?.count || 20).fill().map(() => ({
      id: generateId(),
      priority: '',
      tag: '',
      description: '',
      startDate: '',
      expectedDate: '',
      actualDate: '',
      completed: ''
    }));
    
    this.workoutPlan = this.buildWorkoutFromTemplate(s.workout || []);
    this.meals = this.ensureIds(s.meals || []);
    this.groceryList = this.ensureIds(s.grocery?.categories || []);
    this.bodyMeasurements = this.ensureIds(s.measurements || []);
    this.financials = this.ensureIds(s.financials || []);
    this.city = s.city_default || 'London';
  }
  
  buildScheduleFromTemplate(templateSchedule) {
    if (!Array.isArray(templateSchedule)) {
      console.error('templateSchedule is not an array:', templateSchedule);
      return [];
    }
    
    // Define order map for efficient sorting
    const orderMap = {
      'QIYAM': 0, 'FAJR': 1, '7AM - 9AM': 2, '9AM - 5PM': 3, 
      'DHUHR': 4, 'ASR': 5, '5PM - 6:30PM': 6, '6:30PM - ISHA': 7, 
      'MAGHRIB': 8, 'ISHA': 9, 'ALLDAY': 10, 'TOTAL': 11
    };
    
    // Map and sort in one pass
    return templateSchedule
      .map(section => ({
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
      }))
      .sort((a, b) => (orderMap[a.name] ?? 999) - (orderMap[b.name] ?? 999));
  }
  
  createDaysStructure(specificDays, maxPerDay) {
    const allDays = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
    const days = {};
    const targetDays = specificDays && Array.isArray(specificDays) ? specificDays : allDays;
    targetDays.forEach(day => {
      days[day] = { value: '', max: maxPerDay };
    });
    return days;
  }
  
  buildWorkoutFromTemplate(templateWorkout) {
    return templateWorkout.map(day => ({
      id: generateId(),
      name: day.name,
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
  }
  
  ensureIds(items) {
    return items.map(item => ({
      ...item,
      id: item.id || generateId()
    }));
  }
  
  // Data Loading
  async loadWeek(isoWeek, isInitLoad = false) {
    // REAL FIX: During init, ensure we have valid data
    if (!isoWeek) {
      console.error('ERROR: No week provided to loadWeek!');
      if (isInitLoad) this.isInitializing = false;
      return;
    }
    
    // Validate week format
    const weekRegex = /^\d{4}-W(0[1-9]|[1-4]\d|5[0-3])$/;
    if (!weekRegex.test(isoWeek)) {
      this.showMessage("Invalid week format");
      if (isInitLoad) this.isInitializing = false;
      return;
    }
    this.showWeekSelector = false;
    this.currentWeek = isoWeek;
    this.dateRange = this.getWeekDateRange(this.parseISOWeek(isoWeek));
    
    // REAL FIX: Just load the template directly during init
    if (isInitLoad && !this.currentTemplate) {
      try {
        const template = await this.fetchTemplate("default");
        this.applyTemplateStructure(template);
      } catch (e) {
        console.error('INIT LOAD: Failed to load template:', e);
      }
    }
    
    try {
      let plannerRecord = await this.fetchPlannerRecord(isoWeek);
      
      let template;
      
      if (plannerRecord?.template_id) {
        template = await this.fetchTemplateById(plannerRecord.template_id);
      } else {
        template = await this.fetchTemplate("default");
      }
      
      this.applyTemplateStructure(template);
      
      if (plannerRecord) {
        this.overlayUserData(plannerRecord);
      }
      
      this.calculateScores();
      
      if (isInitLoad && !this.times.some(t => t.value)) {
        await this.getPrayerTimes();
      }
      
      this.lastSavedState = JSON.stringify(this.getCurrentUserData());
    } catch (error) {
      console.error('❌ Error in loadWeek:', error);
      this.showMessage('Error loading week data');
    }
    
    // REAL FIX: Always set isInitializing to false if this is init load
    if (isInitLoad) {
      this.isInitializing = false;
    }
  }
  
  async fetchPlannerRecord(isoWeek) {
    if (this.isOnline) {
      try {
        return await this.pb.collection('planners').getFirstListItem(`week_id="${isoWeek}"`);
      } catch (e) {
        // Not found
      }
    }
    
    const local = localStorage.getItem(`planner_${isoWeek}`);
    if (local) {
      try {
        return JSON.parse(local);
      } catch(e) {
        // Invalid JSON in localStorage
      }
    }
    return null;
  }
  
  async fetchTemplateById(templateId) {
    try {
      const template = await this.pb.collection('templates').getOne(templateId);
      return template;
    } catch (e) {
      console.error('Error fetching template by ID:', e);
      return await this.fetchTemplate("default");
    }
  }
  
  overlayUserData(record) {
    if (record.title) this.plannerTitle = record.title;
    if (record.city) this.city = record.city;
    if (record.prayer_times) this.overlayArray(this.times, record.prayer_times);
    if (record.schedule_data) this.overlayComplexData(this.schedule, record.schedule_data, 'name', this.overlayScheduleActivity);
    if (record.tasks_data) this.overlayArray(this.tasks, record.tasks_data);
    if (record.workout_data) this.overlayComplexData(this.workoutPlan, record.workout_data, 'name', this.overlayWorkoutExercise);
    if (record.meals_data) this.overlayArray(this.meals, record.meals_data);
    if (record.grocery_data?.categories) this.overlayArray(this.groceryList, record.grocery_data.categories);
    if (record.measurements_data) this.overlayArray(this.bodyMeasurements, record.measurements_data);
    if (record.financials_data) this.overlayArray(this.financials, record.financials_data);
  }
  
  overlayArray(target, source) {
    source.forEach((item, i) => {
      if (target[i]) Object.assign(target[i], item);
    });
  }
  
  overlayComplexData(target, source, matchKey, itemProcessor) {
    source.forEach(savedItem => {
      const item = target.find(t => t[matchKey] === savedItem[matchKey]);
      if (item) itemProcessor.call(this, item, savedItem);
    });
  }
  
  overlayScheduleActivity(section, savedSection) {
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
  
  overlayWorkoutExercise(day, savedDay) {
    savedDay.exercises?.forEach(savedEx => {
      const exercise = day.exercises.find(ex => ex.name === savedEx.name);
      if (exercise) {
        exercise.weight = savedEx.weight || '';
        exercise.sets = savedEx.sets || '';
        exercise.reps = savedEx.reps || '';
      }
    });
  }
  
  // User Data Extraction
  getCurrentUserData() {
    return {
      week_id: this.currentWeek,
      template_id: this.currentTemplateId,
      title: this.plannerTitle !== this.currentTemplate?.structure?.title_default ? this.plannerTitle : null,
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
  }
  
  extractScheduleData() {
    return this.extractComplexData(this.schedule, section => ({
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
    }), section => section.activities.length > 0);
  }
  
  extractUserTasks() {
    return this.tasks.filter(task =>
      task.priority || task.tag || task.description ||
      task.startDate || task.expectedDate || task.actualDate || task.completed
    );
  }
  
  extractWorkoutData() {
    return this.extractComplexData(this.workoutPlan, day => ({
      name: day.name,
      exercises: day.exercises.filter(ex => ex.weight || ex.sets || ex.reps).map(ex => ({
        name: ex.name, weight: ex.weight, sets: ex.sets, reps: ex.reps
      }))
    }), day => day.exercises.length > 0);
  }
  
  extractComplexData(items, mapper, filter = () => true) {
    return items.map(mapper).filter(filter);
  }
  
  extractUserItems(items, fields) {
    return items.filter(item => fields.some(field => item[field]));
  }
  
  extractGroceryData() {
    const categories = this.extractUserItems(this.groceryList, ['name', 'items']);
    return categories.length > 0 ? { categories } : null;
  }
  
  // Helper to parse MM/DD or YYYY-MM-DD dates
  parseTaskDate(dateStr) {
    if (!dateStr) return null;
    
    // Handle MM/DD format
    if (dateStr.includes('/') && !dateStr.includes('-')) {
      const [month, day] = dateStr.split('/').map(n => parseInt(n));
      const year = new Date().getFullYear();
      return new Date(year, month - 1, day);
    }
    
    // Handle YYYY-MM-DD format (for backwards compatibility)
    return new Date(dateStr);
  }
  
  // Project Management
  getTaskDelay(task) {
    if (!task.expectedDate || !task.actualDate) return 0;
    const expected = this.parseTaskDate(task.expectedDate);
    const actual = this.parseTaskDate(task.actualDate);
    if (!expected || !actual) return 0;
    return Math.ceil((actual - expected) / (1000 * 60 * 60 * 24));
  }
  
  calculateTaskDelay(task) {
    task._delay = this.getTaskDelay(task);
    return task._delay;
  }
  
  formatDelay(days) {
    if (days === 0) return '0d';
    return days > 0 ? `+${days}d` : `${days}d`;
  }
  
  toggleTaskCompletion(task) {
    task.completed = task.completed === '✓' ? '☐' : '✓';
    if (task.completed === '✓') {
      // Auto-fill done date when checking
      if (!task.actualDate) {
        task.actualDate = this.getTodayMMDD();
      }
    } else {
      // Clear done date when unchecking
      task.actualDate = '';
    }
    this.calculateTaskDelay(task);
    this.saveData();
  }
  
  // Selectors with Portal Positioning
  toggleSelector(event, type) {
    const selectors = { city: 'showCitySelector', week: 'showWeekSelector' };
    const oppositeType = type === 'city' ? 'week' : 'city';
    
    // Close opposite selector
    this[selectors[oppositeType]] = false;
    
    // Toggle current selector
    if (this[selectors[type]]) {
      this[selectors[type]] = false;
    } else {
      const rect = event.target.getBoundingClientRect();
      this[`${type}DropdownStyle`] = `position:fixed;top:${rect.bottom + 4}px;left:${Math.max(10, rect.left - 100)}px;z-index:9999;min-width:150px;max-width:250px;`;
      this[selectors[type]] = true;
      if (type === 'week') this.fetchSavedWeeks();
    }
  }
  
  async selectCity(cityOption) {
    this.city = cityOption.name;
    this.showCitySelector = false;
    try {
      if (cityOption.lat === null) await this.getPrayerTimes();
      else await this.fetchPrayerTimes(cityOption.lat, cityOption.lon);
      this.saveData();
    } catch (e) {
      this.showMessage("Failed to load prayer times");
    }
  }
  
  // Prayer Times
  async getPrayerTimes() {
    try {
      const position = await new Promise((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          timeout: SAVE_TIMEOUT_MS,
          maximumAge: GEOLOCATION_MAX_AGE_MS
        })
      );
      const { latitude, longitude } = position.coords;
      
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&accept-language=en`);
        const data = await response.json();
        this.city = data.address?.city || data.address?.town || data.address?.village || "Current Location";
      } catch (e) {
        this.city = "Current Location";
      }
      
      await this.fetchPrayerTimes(latitude, longitude);
    } catch (e) {
      this.showMessage("Location access failed. Using London");
      this.city = "London";
      await this.fetchPrayerTimes(51.5074, -0.1278);
    }
  }
  
  async fetchPrayerTimes(lat, lon) {
    const today = new Date();
    const dateKey = `${today.getFullYear()}_${today.getMonth()+1}_${today.getDate()}`;
    const cacheKey = `prayer_times_${dateKey}_${lat.toFixed(2)}_${lon.toFixed(2)}`;
    
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        this.setPrayerTimes(JSON.parse(cached));
        return;
      } catch (e) {
        localStorage.removeItem(cacheKey);
      }
    }
    
    try {
      const response = await fetch(`https://api.aladhan.com/v1/calendar/${today.getFullYear()}/${today.getMonth()+1}?latitude=${lat}&longitude=${lon}&method=2`);
      if (!response.ok) throw new Error(`API error: ${response.status}`);
      
      const data = await response.json();
      if (data.code === 200 && data.data?.[today.getDate()-1]?.timings) {
        localStorage.setItem(cacheKey, JSON.stringify(data.data[today.getDate()-1].timings));
        this.setPrayerTimes(data.data[today.getDate()-1].timings);
      } else {
        throw new Error("Invalid prayer time data");
      }
    } catch (e) {
      this.showMessage("Prayer times fetch failed");
      this.setPrayerTimes({
        Fajr:"05:30",
        Dhuhr:"12:30",
        Asr:"15:45",
        Maghrib:"18:30",
        Isha:"20:00"
      });
    }
  }
  
  setPrayerTimes(timings) {
    const prayerMap = {
      Q: this.calculateQiyamTime(timings.Fajr),
      F: timings.Fajr,
      D: timings.Dhuhr,
      A: timings.Asr,
      M: timings.Maghrib,
      I: timings.Isha
    };
    
    const changed = this.times.reduce((acc, time) => {
      const newTime = this.formatTime(prayerMap[time.label]);
      if (time.value !== newTime) {
        time.value = newTime;
        return true;
      }
      return acc;
    }, false);
    
    if (changed && !this.isInitializing) this.saveData();
  }
  
  formatTime(timeStr) {
    if (!timeStr) return "";
    const [hourStr, minStr] = timeStr.split(" ")[0].split(":");
    const hour = parseInt(hourStr), min = parseInt(minStr);
    if (isNaN(hour) || isNaN(min)) return "";
    return `${hour % 12 || 12}:${min.toString().padStart(2,'0')}${hour >= 12 ? "PM" : "AM"}`;
  }
  
  calculateQiyamTime(fajrTime) {
    if (!fajrTime) return "";
    const [hourStr, minStr] = fajrTime.split(" ")[0].split(":");
    let hour = parseInt(hourStr), min = parseInt(minStr);
    if (isNaN(hour) || isNaN(min)) return "";
    hour = hour - 1;
    if (hour < 0) hour = 23;
    return `${hour}:${min.toString().padStart(2,'0')}`;
  }
  
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
        
        // Calculate current streak
        const todayIndex = this.currentDay === 0 ? 6 : this.currentDay - 1;
        let currentStreak = 0;
        for (let i = 0; i < 7; i++) {
          const dayIndex = (todayIndex - i + 7) % 7;
          const dayKey = dayKeys[dayIndex];
          if (activity.days[dayKey] &&
              parseInt(activity.days[dayKey].value) > 0 &&
              (activity.days[dayKey].max || 0) > 0) {
            currentStreak++;
          } else {
            break;
          }
        }
        activity.streaks.current = currentStreak;
        activity.streaks.longest = Math.max(activity.streaks.longest || 0, currentStreak);
      });
    });
    
    // Update TOTAL section
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
  }
  
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
  }
  
  // Consolidated task update methods
  updateTaskField(task, field, value) {
    task[field] = value;
    
    // Auto-fill start date when description is entered
    if (field === 'description' && value && !task.startDate) {
      task.startDate = this.getTodayMMDD();
    }
    
    // Auto-tag based on keywords
    if (field === 'description' && value && !task.tag) {
      const workKeywords = ['meeting', 'report', 'client', 'project', 'deadline', 'presentation', 'office', 'work', 'review', 'email'];
      const lowerDesc = value.toLowerCase();
      if (workKeywords.some(keyword => lowerDesc.includes(keyword))) {
        task.tag = 'W';
      }
    }
    
    this.saveData();
  }
  
  updateTaskDate(task, field, value) {
    task[field] = value;
    
    // Auto-set priority based on due date urgency
    if (field === 'expectedDate' && value && !task.priority) {
      const dueDate = this.parseTaskDate(value);
      if (dueDate) {
        const daysUntilDue = Math.floor((dueDate - new Date()) / (1000 * 60 * 60 * 24));
        if (daysUntilDue <= 1) task.priority = 'A';
        else if (daysUntilDue <= 3) task.priority = 'B';
        else if (daysUntilDue <= 7) task.priority = 'C';
      }
    }
    
    // Auto-set expected date if start date is set but no expected date
    if (field === 'startDate' && value && !task.expectedDate) {
      const startDate = this.parseTaskDate(value);
      if (startDate) {
        startDate.setDate(startDate.getDate() + 3);
        const month = (startDate.getMonth() + 1).toString().padStart(2, '0');
        const day = startDate.getDate().toString().padStart(2, '0');
        task.expectedDate = `${month}/${day}`;
      }
    }
    
    this.calculateTaskDelay(task);
    this.saveData();
  }
  
  // Data Management
  saveData() {
    if (this.isInitializing) return;
    
    clearTimeout(this.saveTimeout);
    this.saveStatus = 'saving';
    
    this.saveTimeout = setTimeout(async () => {
      try {
        this.calculateScores();
        const userData = this.getCurrentUserData();
        
        localStorage.setItem(`planner_${this.currentWeek}`, JSON.stringify(userData));
        
        if (this.isOnline) {
          await this.saveToPocketbase(this.currentWeek, userData);
          this.pendingSync = this.pendingSync.filter(item =>
            !(item.weekId === this.currentWeek && item.operation !== 'delete')
          );
        } else {
          this.addToPendingSync(this.currentWeek, userData);
        }
        
        localStorage.setItem('planner_pending_sync', JSON.stringify(this.pendingSync));
        this.lastSavedState = JSON.stringify(userData);
        this.saveStatus = 'saved';
      } catch (e) {
        this.saveStatus = 'error';
        this.showMessage("Save error: " + e.message);
        setTimeout(() => this.saveStatus = 'saved', SAVE_ERROR_TIMEOUT_MS);
      }
    }, SAVE_DEBOUNCE_MS);
  }
  
  hasSignificantChanges() {
    if (!this.lastSavedState) return true;
    const current = this.getCurrentUserData();
    return JSON.stringify(current) !== this.lastSavedState;
  }
  
  addToPendingSync(weekId, data, operation = 'save') {
    this.pendingSync = this.pendingSync.filter(item =>
      !(item.weekId === weekId && item.operation === operation)
    );
    this.pendingSync.push({
      weekId,
      data: data ? JSON.parse(JSON.stringify(data)) : null,
      operation,
      timestamp: new Date().toISOString()
    });
    localStorage.setItem('planner_pending_sync', JSON.stringify(this.pendingSync));
  }
  
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
      } catch (e) {
        this.pendingSync.push(item);
      }
    }
    
    if (this.pendingSync.length > 0) {
      localStorage.setItem('planner_pending_sync', JSON.stringify(this.pendingSync));
    }
  }
  
  async saveToPocketbase(weekId, userData) {
    try {
      const existing = await this.pb.collection('planners').getFirstListItem(`week_id="${weekId}"`);
      await this.pb.collection('planners').update(existing.id, userData);
    } catch (e) {
      if (e.status === 404) {
        await this.pb.collection('planners').create(userData);
      } else {
        throw e;
      }
    }
  }
  
  async deleteFromPocketbase(weekId) {
    try {
      const existing = await this.pb.collection('planners').getFirstListItem(`week_id="${weekId}"`);
      await this.pb.collection('planners').delete(existing.id);
    } catch (e) {
      if (e.status !== 404) throw e;
    }
  }
  
  // Week Management
  async fetchSavedWeeks() {
    const weekMap = new Map();
    const currentIso = this.getCurrentIsoWeek();
    
    const addWeek = (iso, dateRange, source, isCurrent) => {
      const existing = weekMap.get(iso);
      const newDateRange = dateRange || this.getWeekDateRange(this.parseISOWeek(iso));
      
      if (!existing ||
          (source === 'pocketbase' && existing.source !== 'pocketbase') ||
          (source === 'local' && existing.source === 'current')) {
        weekMap.set(iso, {
          iso_week: iso,
          dateRange: newDateRange,
          source,
          isCurrent
        });
      } else if (existing && !existing.dateRange && newDateRange) {
        existing.dateRange = newDateRange;
      }
    };
    
    addWeek(currentIso, this.getWeekDateRange(this.parseISOWeek(currentIso)), 'current', true);
    
    if (this.isOnline) {
      try {
        const records = await this.pb.collection('planners').getFullList({
          sort: '-week_id',
          fields: 'week_id,date_range'
        });
        records.forEach(record =>
          addWeek(record.week_id, record.date_range, 'pocketbase', record.week_id === currentIso)
        );
      } catch (e) {
        // Failed to fetch from PocketBase
      }
    }
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith('planner_') &&
          !key.includes('pending_sync') &&
          !key.startsWith('planner_template_')) {
        const iso = key.replace('planner_', '');
        try {
          const data = JSON.parse(localStorage.getItem(key));
          addWeek(iso, data.date_range, 'local', iso === currentIso);
        } catch (e) {
          // Skip invalid entries
        }
      }
    }
    
    this.savedWeeks = Array.from(weekMap.values()).sort((a, b) => {
      if (a.isCurrent && !b.isCurrent) return -1;
      if (!a.isCurrent && b.isCurrent) return 1;
      return b.iso_week.localeCompare(a.iso_week);
    });
  }
  
  confirmLoadWeek(isoWeek) {
    if (this.hasSignificantChanges() &&
        isoWeek !== this.currentWeek &&
        !confirm("Unsaved changes. Load anyway?")) {
      return;
    }
    this.showWeekSelector = false;
    this.loadWeek(isoWeek);
  }
  
  confirmDeleteWeek(isoWeek) {
    if (confirm(`Delete schedule for ${isoWeek}?`)) {
      this.deleteWeek(isoWeek);
    }
  }
  
  async deleteWeek(isoWeek) {
    localStorage.removeItem(`planner_${isoWeek}`);
    
    if (this.isOnline) {
      try {
        await this.deleteFromPocketbase(isoWeek);
      } catch (e) {
        this.addToPendingSync(isoWeek, null, 'delete');
      }
    } else {
      this.addToPendingSync(isoWeek, null, 'delete');
    }
    
    this.savedWeeks = this.savedWeeks.filter(w => w.iso_week !== isoWeek);
    
    if (this.currentWeek === isoWeek) {
      this.currentWeek = this.getCurrentIsoWeek();
      await this.loadWeek(this.currentWeek);
    }
  }
  
  // Utilities
  getCurrentIsoWeek() {
    const now = new Date();
    const date = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    const weekNumber = Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
    return `${date.getUTCFullYear()}-W${weekNumber.toString().padStart(2, '0')}`;
  }
  
  parseISOWeek(isoString) {
    if (!/^\\d{4}-W(0[1-9]|[1-4]\\d|5[0-3])$/.test(isoString)) return new Date();
    const [year, weekPart] = isoString.split('-');
    const week = parseInt(weekPart.substring(1));
    const date = new Date(Date.UTC(parseInt(year), 0, 1 + (week - 1) * 7));
    date.setUTCDate(date.getUTCDate() - (date.getUTCDay() || 7) + 1);
    return date;
  }
  
  getWeekDateRange(date) {
    const start = new Date(date);
    const end = new Date(start);
    end.setUTCDate(start.getUTCDate() + 6);
    
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // If same month, show: Jun 23-29
    if (start.getUTCMonth() === end.getUTCMonth()) {
      const month = monthNames[start.getUTCMonth()];
      const startDay = start.getUTCDate();
      const endDay = end.getUTCDate();
      return `${month} ${startDay}-${endDay}`;
    }
    
    // Different months, show: Jun 29 - Jul 5
    const startMonth = monthNames[start.getUTCMonth()];
    const endMonth = monthNames[end.getUTCMonth()];
    return `${startMonth} ${start.getUTCDate()} - ${endMonth} ${end.getUTCDate()}`;
  }
  
  formatDate(date) {
    return `${(date.getUTCMonth() + 1).toString().padStart(2, '0')}/${date.getUTCDate().toString().padStart(2, '0')}`;
  }
  
  getTodayMMDD() {
    const today = new Date();
    return `${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getDate().toString().padStart(2, '0')}`;
  }
  
  showMessage(message) {
    this.notificationMessage = message;
    this.showNotification = true;
    clearTimeout(this.notificationTimeout);
    this.notificationTimeout = setTimeout(() => this.showNotification = false, NOTIFICATION_TIMEOUT_MS);
  }
}

export const plannerStore = new PlannerStore();
window.plannerStore = plannerStore;