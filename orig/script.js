function plannerApp() {
  const pb = new PocketBase('/');
  pb.autoCancellation(false);
  let isInitializing = true;
  let lastSavedState = null;
  let uniqueIdCounter = 0;
  const generateId = () => `id_${Date.now()}_${uniqueIdCounter++}`;

  const ensureIds = (items, idField = 'id') => items.map(item => ({ ...item, [idField]: item[idField] || generateId() }));
  const ensureDeepIds = (schedule) => schedule.map(section => ({
    ...section,
    id: section.id || generateId(),
    activities: ensureIds(section.activities)
  }));

  const getDefaultUiConfig = () => ({
    mainTableHeaders: ['TIME', 'DAY', 'ACTIVITY', 'SCR', 'MAX', '🔥'],
    dayHeaders: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'],
    maxHeaders: Array(7).fill('MAX'),
    taskHeaders: ['№', '🔥', '🏷️', '✏️ Task/Event/Note', '📅', '✓'],
    sectionTitles: { tasks: 'TASKS & NOTES', workout: 'WORKOUT PLAN', meals: 'MEAL PREP', grocery: 'GROCERY LIST', measurements: 'BODY MEASUREMENTS', financials: 'MONTH/1ST: FINANCIAL' }
  });

  const initialSchedule = [
      { id: generateId(), name: 'QIYAM', activities: ensureIds([
          { name: 'DAILY: Wakeup early', days: { mon: {value:'',max:1}, tue: {value:'',max:1}, wed: {value:'',max:1}, thu: {value:'',max:1}, fri: {value:'',max:1}, sat: {value:'',max:1}, sun: {value:'',max:1} }, score:0, maxScore:7, streaks:{current:0,longest:0}},
          { name: 'DAILY: Qiyam/Tahajjud', days: { mon: {value:'',max:1}, tue: {value:'',max:1}, wed: {value:'',max:1}, thu: {value:'',max:1}, fri: {value:'',max:1}, sat: {value:'',max:1}, sun: {value:'',max:1} }, score:0, maxScore:7, streaks:{current:0,longest:0}},
          { name: 'DAILY: Nutty Pudding', days: { mon: {value:'',max:1}, tue: {value:'',max:1}, wed: {value:'',max:1}, thu: {value:'',max:1}, fri: {value:'',max:1}, sat: {value:'',max:1}, sun: {value:'',max:1} }, score:0, maxScore:7, streaks:{current:0,longest:0}}
      ])},
      { id: generateId(), name: 'FAJR', activities: ensureIds([
          { name: 'DAILY: Fajr prayer', days: { mon: {value:'',max:1}, tue: {value:'',max:1}, wed: {value:'',max:1}, thu: {value:'',max:1}, fri: {value:'',max:1}, sat: {value:'',max:1}, sun: {value:'',max:1} }, score:0, maxScore:7, streaks:{current:0,longest:0}},
          { name: 'DAILY: Quran - 1 Juz', days: { mon: {value:'',max:1}, tue: {value:'',max:1}, wed: {value:'',max:1}, thu: {value:'',max:1}, fri: {value:'',max:1}, sat: {value:'',max:1}, sun: {value:'',max:1} }, score:0, maxScore:7, streaks:{current:0,longest:0}},
          { name: 'DAILY: 5min Cold Shower', days: { mon: {value:'',max:1}, tue: {value:'',max:1}, wed: {value:'',max:1}, thu: {value:'',max:1}, fri: {value:'',max:1}, sat: {value:'',max:1}, sun: {value:'',max:1} }, score:0, maxScore:7, streaks:{current:0,longest:0}}
      ])},
      { id: generateId(), name: '7AM - 9AM', activities: ensureIds([
          { name: 'MON/THU: COMMUTE', days: { mon: {value:'',max:1}, thu: {value:'',max:1} }, score:0, maxScore:2, streaks:{current:0,longest:0}},
          { name: 'TUE/WED/FRI: Reading/Study (book/course/skill)', days: { tue: {value:'',max:1}, wed: {value:'',max:1}, fri: {value:'',max:1} }, score:0, maxScore:3, streaks:{current:0,longest:0}},
          { name: 'SAT: Errands, Grocery shopping, Meal prep', days: { sat: {value:'',max:3} }, score:0, maxScore:3, streaks:{current:0,longest:0}},
          { name: 'SUN: House cleaning, laundry', days: { sun: {value:'',max:2} }, score:0, maxScore:2, streaks:{current:0,longest:0}}
      ])},
      { id: generateId(), name: '9AM - 5PM', activities: ensureIds([
          { name: 'MON - FRI: Work', days: { mon: {value:'',max:1}, tue: {value:'',max:1}, wed: {value:'',max:1}, thu: {value:'',max:1}, fri: {value:'',max:1} }, score:0, maxScore:5, streaks:{current:0,longest:0}},
          { name: 'DAILY: ZeroInbox (E1, E2, E3, E4, LI, Slack)', days: { mon: {value:'',max:6}, tue: {value:'',max:6}, wed: {value:'',max:6}, thu: {value:'',max:6}, fri: {value:'',max:6} }, score:0, maxScore:30, streaks:{current:0,longest:0}},
          { name: 'SAT/SUN: Nature time / Outdoor Activity / Adventure', days: { sat: {value:'',max:1}, sun: {value:'',max:1} }, score:0, maxScore:2, streaks:{current:0,longest:0}}
      ])},
      { id: generateId(), name: 'DHUHR', activities: ensureIds([
          { name: 'DAILY: Dhuhr prayer', days: { mon: {value:'',max:1}, tue: {value:'',max:1}, wed: {value:'',max:1}, thu: {value:'',max:1}, fri: {value:'',max:1}, sat: {value:'',max:1}, sun: {value:'',max:1} }, score:0, maxScore:7, streaks:{current:0,longest:0}},
          { name: 'TUE/WED/FRI: Sun walk (30-45 minutes)', days: { tue: {value:'',max:1}, wed: {value:'',max:1}, fri: {value:'',max:1} }, score:0, maxScore:3, streaks:{current:0,longest:0}},
          { name: 'FRI: £10 Sadaqa', days: { fri: {value:'',max:1} }, score:0, maxScore:1, streaks:{current:0,longest:0}}
      ])},
      { id: generateId(), name: 'ASR', activities: ensureIds([
          { name: 'DAILY: Asr prayer', days: { mon: {value:'',max:1}, tue: {value:'',max:1}, wed: {value:'',max:1}, thu: {value:'',max:1}, fri: {value:'',max:1}, sat: {value:'',max:1}, sun: {value:'',max:1} }, score:0, maxScore:7, streaks:{current:0,longest:0}}
      ])},
      { id: generateId(), name: '5PM - 6:30PM', activities: ensureIds([
          { name: 'MON/THU: COMMUTE', days: { mon: {value:'',max:1}, thu: {value:'',max:1} }, score:0, maxScore:2, streaks:{current:0,longest:0}},
          { name: 'TUE/WED/FRI: Workout', days: { tue: {value:'',max:1}, wed: {value:'',max:1}, fri: {value:'',max:1} }, score:0, maxScore:3, streaks:{current:0,longest:0}},
          { name: 'TUE/WED/FRI: Third Meal', days: { tue: {value:'',max:1}, wed: {value:'',max:1}, fri: {value:'',max:1} }, score:0, maxScore:3, streaks:{current:0,longest:0}}
      ])},
      { id: generateId(), name: '6:30PM - ISHA', activities: ensureIds([
          { name: 'MON/TUE/WED/THU: Personal', days: { mon: {value:'',max:1}, tue: {value:'',max:1}, wed: {value:'',max:1}, thu: {value:'',max:1} }, score:0, maxScore:4, streaks:{current:0,longest:0}},
          { name: 'DAILY: Family/Friends/Date calls(M, WA, Phone)', days: { mon: {value:'',max:3}, tue: {value:'',max:3}, wed: {value:'',max:3}, thu: {value:'',max:3} }, score:0, maxScore:12, streaks:{current:0,longest:0}},
          { name: 'FRI/SAT/SUN: Family/Friends/Date visits/outings/activities', days: { fri: {value:'',max:3}, sat: {value:'',max:3}, sun: {value:'',max:3} }, score:0, maxScore:9, streaks:{current:0,longest:0}}
      ])},
      { id: generateId(), name: 'MAGHRIB', activities: ensureIds([
          { name: 'DAILY: Maghrib prayer', days: { mon: {value:'',max:1}, tue: {value:'',max:1}, wed: {value:'',max:1}, thu: {value:'',max:1}, fri: {value:'',max:1}, sat: {value:'',max:1}, sun: {value:'',max:1} }, score:0, maxScore:7, streaks:{current:0,longest:0}},
          { name: 'DAILY: Super Veggie', days: { mon: {value:'',max:1}, tue: {value:'',max:1}, wed: {value:'',max:1}, thu: {value:'',max:1}, fri: {value:'',max:1}, sat: {value:'',max:1}, sun: {value:'',max:1} }, score:0, maxScore:7, streaks:{current:0,longest:0}}
      ])},
      { id: generateId(), name: 'ISHA', activities: ensureIds([
          { name: 'DAILY: Isha prayer', days: { mon: {value:'',max:1}, tue: {value:'',max:1}, wed: {value:'',max:1}, thu: {value:'',max:1}, fri: {value:'',max:1}, sat: {value:'',max:1}, sun: {value:'',max:1} }, score:0, maxScore:7, streaks:{current:0,longest:0}},
          { name: 'DAILY: Sleep early', days: { mon: {value:'',max:1}, tue: {value:'',max:1}, wed: {value:'',max:1}, thu: {value:'',max:1}, fri: {value:'',max:1}, sat: {value:'',max:1}, sun: {value:'',max:1} }, score:0, maxScore:7, streaks:{current:0,longest:0}}
      ])},
      { id: generateId(), name: 'ALLDAY', activities: ensureIds([
          { name: 'DAILY: No Doomscrolling; (FB, YTB, LKDN, & IG)', days: { mon: {value:'',max:4}, tue: {value:'',max:4}, wed: {value:'',max:4}, thu: {value:'',max:4}, fri: {value:'',max:4}, sat: {value:'',max:4}, sun: {value:'',max:4} }, score:0, maxScore:28, streaks:{current:0,longest:0}},
          { name: 'DAILY: No Fap; (P, & M)', days: { mon: {value:'',max:2}, tue: {value:'',max:2}, wed: {value:'',max:2}, thu: {value:'',max:2}, fri: {value:'',max:2}, sat: {value:'',max:2}, sun: {value:'',max:2} }, score:0, maxScore:14, streaks:{current:0,longest:0}},
          { name: 'DAILY: No Processed; (Sugar, RefinedFlour, SeedOils, Soda, FastFood)', days: { mon: {value:'',max:5}, tue: {value:'',max:5}, wed: {value:'',max:5}, thu: {value:'',max:5}, fri: {value:'',max:5}, sat: {value:'',max:5}, sun: {value:'',max:5} }, score:0, maxScore:35, streaks:{current:0,longest:0}},
          { name: 'MON/THU: Fasting', days: { mon: {value:'',max:1}, thu: {value:'',max:1} }, score:0, maxScore:2, streaks:{current:0,longest:0}},
          { name: 'DAILY: Expense Tracker <25', days: { mon: {value:'',max:0}, tue: {value:'',max:0}, wed: {value:'',max:0}, thu: {value:'',max:0}, fri: {value:'',max:0}, sat: {value:'',max:0}, sun: {value:'',max:0} }, score:0, maxScore:0, streaks:{current:0,longest:0}}
      ])},
      { id: generateId(), name: 'TOTAL', activities: ensureIds([
          { name: 'DAILY POINTS', days: { mon: {value:'0',max:0}, tue: {value:'0',max:0}, wed: {value:'0',max:0}, thu: {value:'0',max:0}, fri: {value:'0',max:0}, sat: {value:'0',max:0}, sun: {value:'0',max:0} }, score:0, maxScore:0, streaks:{current:0,longest:0}}
      ])}
  ];
  const initialWorkoutPlan = [
      { id: generateId(), name: 'TUESDAY', exercises: ensureIds([
          { prefix: '• ', name: 'Incline Dumbbell Press', weight: '', sets: '', reps: '', defaultWeight: '30', defaultSets: '3', defaultReps: '12' },
          { prefix: '• ', name: 'Barbell Squats', weight: '', sets: '', reps: '', defaultWeight: '80', defaultSets: '3', defaultReps: '8' },
          { prefix: '• ', name: 'DB Chest-Supported Row', weight: '', sets: '', reps: '', defaultWeight: '25', defaultSets: '3', defaultReps: '12' },
          { prefix: '• ', name: 'Leg Curls', weight: '', sets: '', reps: '', defaultWeight: '40', defaultSets: '3', defaultReps: '15' },
          { prefix: '• SS: ', name: 'Incline DB Curls', weight: '', sets: '', reps: '', defaultWeight: '15', defaultSets: '3', defaultReps: '12' },
          { prefix: '• SS: ', name: 'Tricep Extensions', weight: '', sets: '', reps: '', defaultWeight: '20', defaultSets: '3', defaultReps: '12' }
      ])},
      { id: generateId(), name: 'WEDNESDAY', exercises: ensureIds([
          { prefix: '• ', name: 'Barbell Bench Press', weight: '', sets: '', reps: '', defaultWeight: '70', defaultSets: '3', defaultReps: '6' },
          { prefix: '• ', name: 'Romanian Deadlift', weight: '', sets: '', reps: '', defaultWeight: '90', defaultSets: '3', defaultReps: '8' },
          { prefix: '• ', name: 'Lat Pulldown', weight: '', sets: '', reps: '', defaultWeight: '60', defaultSets: '3', defaultReps: '12' },
          { prefix: '• ', name: 'Walking Lunges', weight: '', sets: '', reps: '', defaultWeight: '20', defaultSets: '3', defaultReps: '10' },
          { prefix: '• SS: ', name: 'Cable Lateral Raises', weight: '', sets: '', reps: '', defaultWeight: '15', defaultSets: '3', defaultReps: '15' },
          { prefix: '• SS: ', name: 'Reverse Crunches', weight: '', sets: '', reps: '', defaultWeight: '0', defaultSets: '3', defaultReps: '15' }
      ])},
      { id: generateId(), name: 'FRIDAY', exercises: ensureIds([
          { prefix: '• ', name: 'Seated DB Shoulder Press', weight: '', sets: '', reps: '', defaultWeight: '20', defaultSets: '3', defaultReps: '12' },
          { prefix: '• ', name: 'Dumbbell Row', weight: '', sets: '', reps: '', defaultWeight: '25', defaultSets: '3', defaultReps: '12' },
          { prefix: '• ', name: 'Barbell Hip Thrust', weight: '', sets: '', reps: '', defaultWeight: '100', defaultSets: '3', defaultReps: '15' },
          { prefix: '• ', name: 'Leg Extensions', weight: '', sets: '', reps: '', defaultWeight: '50', defaultSets: '3', defaultReps: '15' },
          { prefix: '• ', name: 'Seated Chest Flyes', weight: '', sets: '', reps: '', defaultWeight: '15', defaultSets: '3', defaultReps: '15' },
          { prefix: '• SS: ', name: 'Standing Calf Raises', weight: '', sets: '', reps: '', defaultWeight: '30', defaultSets: '3', defaultReps: '15' },
          { prefix: '• SS: ', name: 'Reverse Cable Flyes', weight: '', sets: '', reps: '', defaultWeight: '20', defaultSets: '3', defaultReps: '15' }
      ])}
  ];
  const initialMeals = ensureIds([
      { name: 'Nutty Pudding', ingredients: 'Berries ½c, Cherries 3, Pomegranate Juice 2oz, Macadamia nuts (raw) 45g, Walnuts (raw) 5g, Cocoa 1t, Brazil Nuts ¼, Milk 50-100ml, Chia Seeds 2T, Flax (ground, refr) 1t, Lecithin 1t, Ceylon Cinnamon ½t' },
      { name: 'Super Veggie', ingredients: 'Broccoli 250g, Cauliflower 150g, Mushrooms 50g, Garlic 1 clove, Ginger 3g, Cumin 1T, Black Lentils 45g, Hemp Seeds 1T, Apple Cider Vinegar 1T' },
      { name: 'Third Meal', ingredients: 'Sweet Potato 350-400g, Protein 100-150g, Grape Tomatoes 12, Avocado ½, Radishes 4, Cilantro ¼c, Lemon 1, Jalapeño (lg) 1, Chili Powder 1t' }
  ]);
  const initialGroceryList = ensureIds([
      { name: 'Produce', items: 'Broccoli 1.75kg, Cauliflower 1.05kg, Mushrooms 350g, Garlic 1 bulb, Ginger 1pc, Sweet Potato 2.8kg, Grape Tomatoes 84, Avocados (ripe) 4, Radishes 28, Cilantro 2-3 bunch' },
      { name: 'Fruits & Protein', items: 'Lemons 7, Jalapeños (lg) 7, Berries 3.5c, Cherries 21, Black Lentils 315g, Protein 1.05kg, Milk (fortified) 1L' }
  ]);
  const initialBodyMeasurements = ensureIds([
      { name: 'Weight', value: '', placeholder: '75kg' }, { name: 'Chest', value: '', placeholder: '42in' },
      { name: 'Waist', value: '', placeholder: '34in' }, { name: 'Hips', value: '', placeholder: '40in' },
      { name: 'Arms', value: '', placeholder: '15in' }, { name: 'Thighs', value: '', placeholder: '24in' }
  ]);
  const initialFinancials = ensureIds([
      { name: 'Rent', value: '', placeholder: '850', account: 'Cash' },
      { name: 'Allowance', value: '', placeholder: '850', account: 'Revolut' },
      { name: 'Savings', value: '', placeholder: '3,800', account: 'HSBCUK' }
  ]);


  return {
    currentWeek: '', dateRange: '', city: 'London', saveStatus: 'saved', saveTimeout: null,
    showNotification: false, notificationMessage: '', notificationTimeout: null, isOnline: navigator.onLine,
    pendingSync: [], showCitySelector: false, showWeekSelector: false, dropdownPosition: { top: 0, left: 0 },
    currentDay: (new Date()).getDay(), plannerTitle: 'Weekly Planner', uiConfig: getDefaultUiConfig(),
    times: [ { label: 'Q', value: '' }, { label: 'F', value: '' }, { label: 'D', value: '' }, { label: 'A', value: '' }, { label: 'M', value: '' }, { label: 'I', value: '' } ],
    cityOptions: [ { name: 'London', lat: 51.5074, lon: -0.1278 }, { name: 'Cairo', lat: 30.0444, lon: 31.2357 }, { name: 'Cape Town', lat: -33.9249, lon: 18.4241 }, { name: 'Amsterdam', lat: 52.3676, lon: 4.9041 }, { name: 'Current Location', lat: null, lon: null } ],
    savedWeeks: [],
    schedule: JSON.parse(JSON.stringify(initialSchedule)), // Deep copy with IDs
    tasks: Array(20).fill().map(() => ({ id: generateId(), num: '', priority: '', tag: '', description: '', date: '', completed: '' })),
    workoutPlan: JSON.parse(JSON.stringify(initialWorkoutPlan)),
    meals: JSON.parse(JSON.stringify(initialMeals)),
    groceryBudget: '',
    groceryList: JSON.parse(JSON.stringify(initialGroceryList)),
    bodyMeasurements: JSON.parse(JSON.stringify(initialBodyMeasurements)),
    financials: JSON.parse(JSON.stringify(initialFinancials)),

    async init() {
      window.addEventListener('online', () => { this.isOnline = true; this.syncPendingData(); });
      window.addEventListener('offline', () => this.isOnline = false);
      document.addEventListener('click', e => { if (!e.target.closest('.dropdown,.clickable')) this.showCitySelector = this.showWeekSelector = false; });
      this.pendingSync = JSON.parse(localStorage.getItem('planner_pending_sync') || '[]');
      this.currentWeek = this.getCurrentIsoWeek();
      this.dateRange = this.getWeekDateRange(this.parseISOWeek(this.currentWeek));
      this.schedule = ensureDeepIds(this.schedule); // Ensure IDs on initial load if somehow missing
      await this.loadWeek(this.currentWeek, true);
      setInterval(() => { if (!isInitializing && this.hasSignificantChanges()) this.saveData(); }, 30000);
      if (this.isOnline) this.syncPendingData();
      isInitializing = false;
    },

    editInline(event, type, index, defaultValue = '') {
      const element = event.currentTarget;
      const originalText = element.innerText;
      const isTextarea = ['mealIngredients', 'groceryCategoryItems'].includes(type);
      const input = document.createElement(isTextarea ? 'textarea' : 'input');
      input.type = 'text'; input.value = defaultValue;
      input.className = isTextarea ? 'inline-edit-textarea' : 'inline-edit-input';
      if (isTextarea) input.rows = 3;
      element.innerHTML = ''; element.appendChild(input); input.focus(); input.select();

      const save = () => {
        const newValue = input.value;
        let sIdxMapped = -1, activity, parts;
        if (type === 'sectionName' || (typeof index === 'object' && index !== null && typeof index.sIdx === 'number')) {
            sIdxMapped = this.schedule.length - 1 - (typeof index === 'object' ? index.sIdx : index);
        }
        
        const scheduleActivity = (idx) => this.schedule[sIdxMapped]?.activities[idx.aIdx];

        switch (type) {
          case 'plannerTitle': this.plannerTitle = newValue; break;
          case 'timeLabel': if (this.times[index]) this.times[index].label = newValue; break;
          case 'sectionName': if (sIdxMapped !== -1 && this.schedule[sIdxMapped]) this.schedule[sIdxMapped].name = newValue; break;
          case 'activityPrefix':
            activity = scheduleActivity(index);
            if (activity) { parts = activity.name.split(':'); activity.name = newValue + (parts.length > 1 ? ':' + parts.slice(1).join(':').trimStart() : ''); }
            break;
          case 'activityName':
            activity = scheduleActivity(index);
            if (activity) { parts = activity.name.split(':'); activity.name = (parts.length > 1 ? parts[0].trim() + ': ' : '') + newValue; }
            break;
          case 'maxValue':
            activity = scheduleActivity(index);
            if (activity?.days[index.day]) activity.days[index.day].max = parseInt(newValue) || 0;
            break;
          case 'maxScore':
            activity = scheduleActivity(index);
            if (activity) activity.maxScore = parseInt(newValue) || 0;
            break;
          case 'sectionTitle': if (this.uiConfig.sectionTitles[index]) this.uiConfig.sectionTitles[index] = newValue; break;
          case 'mainTableHeader': if (this.uiConfig.mainTableHeaders[index] !== undefined) this.uiConfig.mainTableHeaders[index] = newValue; break;
          case 'dayHeader': if (this.uiConfig.dayHeaders[index] !== undefined) this.uiConfig.dayHeaders[index] = newValue; break;
          case 'maxHeader': if (this.uiConfig.maxHeaders[index] !== undefined) this.uiConfig.maxHeaders[index] = newValue; break;
          case 'taskHeader': if (this.uiConfig.taskHeaders[index] !== undefined) this.uiConfig.taskHeaders[index] = newValue; break;
          case 'workoutDayName': if (this.workoutPlan[index]) this.workoutPlan[index].name = newValue; break;
          case 'exercisePrefix': if (this.workoutPlan[index.dayIdx]?.exercises[index.exIdx]) this.workoutPlan[index.dayIdx].exercises[index.exIdx].prefix = newValue; break;
          case 'exerciseName': if (this.workoutPlan[index.dayIdx]?.exercises[index.exIdx]) this.workoutPlan[index.dayIdx].exercises[index.exIdx].name = newValue; break;
          case 'mealName': if (this.meals[index]) this.meals[index].name = newValue; break;
          case 'mealIngredients': if (this.meals[index]) this.meals[index].ingredients = newValue; break;
          case 'groceryCategoryName': if (this.groceryList[index]) this.groceryList[index].name = newValue; break;
          case 'groceryCategoryItems': if (this.groceryList[index]) this.groceryList[index].items = newValue; break;
          case 'measurementName': if (this.bodyMeasurements[index]) this.bodyMeasurements[index].name = newValue; break;
          case 'financialName': if (this.financials[index]) this.financials[index].name = newValue; break;
          case 'financialAccount': if (this.financials[index]) this.financials[index].account = newValue; break;
        }
        if (input.parentNode === element) element.removeChild(input);
        element.innerText = newValue || originalText; this.saveData();
      };
      const handleKey = (e) => {
        if (e.key === 'Enter' && !isTextarea) { e.preventDefault(); cleanupAndSave(); }
        else if (e.key === 'Escape') { cleanupAndRestore(); }
      };
      const cleanupAndSave = () => { input.removeEventListener('blur', cleanupAndSave); input.removeEventListener('keydown', handleKey); save(); };
      const cleanupAndRestore = () => {
        input.removeEventListener('blur', cleanupAndSave); input.removeEventListener('keydown', handleKey);
        if (input.parentNode === element) element.removeChild(input);
        element.innerText = originalText;
      };
      input.addEventListener('blur', cleanupAndSave); input.addEventListener('keydown', handleKey);
    },

    toggleTaskCompletion(task) { task.completed = task.completed === '✓' ? '☐' : '✓'; this.saveData(); },
    showErrorMessage(message) {
      this.notificationMessage = message; this.showNotification = true; clearTimeout(this.notificationTimeout);
      this.notificationTimeout = setTimeout(() => this.showNotification = false, 5000);
    },
    validateValue(value, isNumber = false, min = null, max = null) {
      const sValue = String(value || ''); if (sValue.trim() === '') return '';
      if (isNumber) {
        const num = parseFloat(sValue); if (isNaN(num)) return '';
        if (min !== null && num < min) return min.toString(); if (max !== null && num > max) return max.toString(); return num.toString();
      } return sValue;
    },
    getCurrentIsoWeek() {
      const now = new Date(), d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
      d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
      const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
      return `${d.getUTCFullYear()}-W${Math.ceil((((d - yearStart) / 864e5) + 1) / 7).toString().padStart(2, '0')}`;
    },
    parseISOWeek(isoWeekStr) {
      if (!/^\d{4}-W(0[1-9]|[1-4]\d|5[0-3])$/.test(isoWeekStr)) return new Date();
      const [year, weekPart] = isoWeekStr.split('-'), week = parseInt(weekPart.substring(1));
      const d = new Date(Date.UTC(parseInt(year), 0, 1 + (week - 1) * 7));
      d.setUTCDate(d.getUTCDate() - (d.getUTCDay() || 7) + 1); return d;
    },
    getWeekDateRange(date) {
      const start = new Date(date), end = new Date(start); end.setUTCDate(start.getUTCDate() + 6);
      return `${this.formatDate(start)}-${this.formatDate(end)}`;
    },
    formatDate: (d) => `${(d.getUTCMonth() + 1).toString().padStart(2, '0')}/${d.getUTCDate().toString().padStart(2, '0')}`,
    formatShortDate(index) { const d = new Date(); d.setDate(d.getDate() + index); return `${d.getMonth() + 1}/${d.getDate()}`; },
    toggleDropdown(type, event) {
      const showProp = `show${type.charAt(0).toUpperCase() + type.slice(1)}Selector`;
      const otherShowProp = type === 'city' ? 'showWeekSelector' : 'showCitySelector';
      this[otherShowProp] = false;
      const rect = event.target.getBoundingClientRect();
      this.dropdownPosition = { top: rect.bottom + window.scrollY, left: rect.left + window.scrollX };
      this[showProp] = !this[showProp];
      if (type === 'week' && this[showProp]) this.fetchSavedWeeks();
    },
    toggleCitySelector(event) { this.toggleDropdown('city', event); },
    toggleWeekSelector(event) { this.toggleDropdown('week', event); },

    async loadWeek(isoWeek, isInitLoad = false) {
      if (!/^\d{4}-W(0[1-9]|[1-4]\d|5[0-3])$/.test(isoWeek)) { this.showErrorMessage("Invalid week format"); return; }
      this.showWeekSelector = false; this.currentWeek = isoWeek; this.dateRange = this.getWeekDateRange(this.parseISOWeek(isoWeek));
      let record = null;
      if (this.isOnline) {
        try { record = await pb.collection('planners').getFirstListItem(`week_id="${isoWeek}"`); }
        catch (e) { if (e.status !== 404) console.error("PB load error:", e); }
      }
      if (!record) { const local = localStorage.getItem(`planner_${isoWeek}`); if (local) try {record = JSON.parse(local);} catch(e){console.error("Local parse error",e); record={};} }
      this.populateFields(record || {});
      this.calculateScores();
      if (isInitLoad && (!this.times[0].value || !this.times[1].value)) await this.getPrayerTimes();
      if (isInitLoad) isInitializing = false; // Moved here to ensure it's set after all initial loading logic
      lastSavedState = JSON.stringify(this.getCurrentDataState()); // Set lastSavedState *after* populating
    },
    populateFields(data) {
      this.plannerTitle = data.plannerTitle || 'Weekly Planner';
      const defConf = getDefaultUiConfig();
      this.uiConfig = { ...defConf, ...(data.uiConfig || {}), sectionTitles: { ...defConf.sectionTitles, ...(data.uiConfig?.sectionTitles || {}) } };
      this.times.forEach((t, i) => { t.value = data.times?.[i]?.value || ''; t.label = data.times?.[i]?.label || t.label; });
      
      const defaultScheduleCopy = JSON.parse(JSON.stringify(initialSchedule));
      this.schedule = ensureDeepIds(data.schedule || defaultScheduleCopy).map((s, sIdx) => ({
        ...s,
        name: s.name || defaultScheduleCopy[sIdx]?.name,
        activities: ensureIds(s.activities || defaultScheduleCopy[sIdx]?.activities || []).map((a, aIdx) => ({
          ...a,
          name: a.name || defaultScheduleCopy[sIdx]?.activities[aIdx]?.name,
          maxScore: typeof a.maxScore === 'number' ? a.maxScore : (defaultScheduleCopy[sIdx]?.activities[aIdx]?.maxScore || 0),
          streaks: { current:0, longest:0, ...(a.streaks || defaultScheduleCopy[sIdx]?.activities[aIdx]?.streaks) },
          days: Object.fromEntries(Object.entries(a.days || defaultScheduleCopy[sIdx]?.activities[aIdx]?.days || {}).map(([dayKey, dayData]) => [
            dayKey, {
              value: this.validateValue(dayData?.value, true, 0, (dayData?.max < 10 ? 9 : 99)),
              max: typeof dayData?.max === 'number' ? dayData.max : 1
            }
          ]))
        }))
      }));

      this.tasks = (data.tasks || Array(20).fill({})).map((t, i) => ({
        id: t.id || this.tasks[i]?.id || generateId(),
        num: this.validateValue(t.num), priority: this.validateValue(t.priority), tag: this.validateValue(t.tag),
        description: this.validateValue(t.description), date: this.validateValue(t.date), completed: this.validateValue(t.completed)
      }));
      
      const defaultWorkoutCopy = JSON.parse(JSON.stringify(initialWorkoutPlan));
      this.workoutPlan = (data.workoutPlan || defaultWorkoutCopy).map((d, dIdx) => ({
        ...d, id: d.id || defaultWorkoutCopy[dIdx]?.id || generateId(), name: d.name || defaultWorkoutCopy[dIdx]?.name,
        exercises: ensureIds(d.exercises || defaultWorkoutCopy[dIdx]?.exercises || []).map((ex, exIdx) => ({
          ...ex, name: ex.name || defaultWorkoutCopy[dIdx]?.exercises[exIdx]?.name, prefix: ex.prefix || defaultWorkoutCopy[dIdx]?.exercises[exIdx]?.prefix,
          weight: this.validateValue(ex.weight, true,0,999), sets: this.validateValue(ex.sets,true,0,99), reps: this.validateValue(ex.reps,true,0,99),
          defaultWeight: ex.defaultWeight || defaultWorkoutCopy[dIdx]?.exercises[exIdx]?.defaultWeight, defaultSets: ex.defaultSets || defaultWorkoutCopy[dIdx]?.exercises[exIdx]?.defaultSets, defaultReps: ex.defaultReps || defaultWorkoutCopy[dIdx]?.exercises[exIdx]?.defaultReps
        }))
      }));

      const defaultMealsCopy = JSON.parse(JSON.stringify(initialMeals));
      this.meals = (data.meals || defaultMealsCopy).map((m, i) => ({ ...m, id: m.id || defaultMealsCopy[i]?.id || generateId(), name: m.name || defaultMealsCopy[i]?.name, ingredients: m.ingredients || defaultMealsCopy[i]?.ingredients }));
      this.groceryBudget = this.validateValue(data.groceryBudget);
      const defaultGroceryCopy = JSON.parse(JSON.stringify(initialGroceryList));
      this.groceryList = (data.groceryList || defaultGroceryCopy).map((g, i) => ({ ...g, id: g.id || defaultGroceryCopy[i]?.id || generateId(), name: g.name || defaultGroceryCopy[i]?.name, items: g.items || defaultGroceryCopy[i]?.items }));
      const defaultMeasurementsCopy = JSON.parse(JSON.stringify(initialBodyMeasurements));
      this.bodyMeasurements = (data.bodyMeasurements || defaultMeasurementsCopy).map((bm, i) => ({ ...bm, id: bm.id || defaultMeasurementsCopy[i]?.id || generateId(), name: bm.name || defaultMeasurementsCopy[i]?.name, value: this.validateValue(bm.value), placeholder: bm.placeholder || defaultMeasurementsCopy[i]?.placeholder }));
      const defaultFinancialsCopy = JSON.parse(JSON.stringify(initialFinancials));
      this.financials = (data.financials || defaultFinancialsCopy).map((f, i) => ({ ...f, id: f.id || defaultFinancialsCopy[i]?.id || generateId(), name: f.name || defaultFinancialsCopy[i]?.name, value: this.validateValue(f.value), account: f.account || defaultFinancialsCopy[i]?.account, placeholder: f.placeholder || defaultFinancialsCopy[i]?.placeholder }));
      if (data.city) this.city = data.city;
    },
    getCurrentDataState() {
      return { plannerTitle: this.plannerTitle, uiConfig: this.uiConfig, times: this.times, schedule: this.schedule, tasks: this.tasks, workoutPlan: this.workoutPlan, meals: this.meals, groceryBudget: this.groceryBudget, groceryList: this.groceryList, bodyMeasurements: this.bodyMeasurements, financials: this.financials, city: this.city, dateRange: this.dateRange, week_id: this.currentWeek };
    },
    validateTextInput(event) { event.target.value = this.validateValue(event.target.value); this.saveData(); },
    validateNumberInput(event) {
      const input = event.target, min = parseFloat(input.min), max = parseFloat(input.max);
      input.value = this.validateValue(input.value, true, isNaN(min)?null:min, isNaN(max)?null:max);
      this.calculateScores(); this.saveData(); // saveData is now called here, no need for @change in HTML
    },
    calculateScores() {
      const dailyTotals = { mon:0,tue:0,wed:0,thu:0,fri:0,sat:0,sun:0 }, dayKeys = Object.keys(dailyTotals);
      this.schedule.forEach(section => {
        if (section.name === 'TOTAL') return;
        section.activities.forEach(act => {
          let actScore = 0;
          Object.entries(act.days || {}).forEach(([day, data]) => {
            if (!data) return; const val = parseInt(data.value) || 0;
            if (val > 0 && (data.max || 0) > 0) { dailyTotals[day] = (dailyTotals[day] || 0) + val; actScore += val; }
            data.value = val === 0 ? '' : val.toString();
          });
          act.score = actScore;
          act.streaks = act.streaks || {current:0,longest:0}; const todayIdx = this.currentDay === 0 ? 6 : this.currentDay - 1; let currentStreak = 0;
          for (let i=0; i<7; i++) { const dayToCheckIdx = (todayIdx - i + 7)%7, dayKey = dayKeys[dayToCheckIdx];
            if (act.days[dayKey] && parseInt(act.days[dayKey].value) > 0 && (act.days[dayKey].max || 0) > 0) currentStreak++; else break;
          } act.streaks.current = currentStreak; act.streaks.longest = Math.max(act.streaks.longest || 0, currentStreak);
        });
      });
      const totalSec = this.schedule.find(s => s.name === 'TOTAL');
      if (totalSec?.activities?.[0]) {
        const totalAct = totalSec.activities[0]; let grandTotalScore = 0, grandTotalMax = 0;
        Object.entries(dailyTotals).forEach(([day, total]) => { if (totalAct.days[day]) totalAct.days[day].value = total.toString(); grandTotalScore += total; });
        totalAct.score = grandTotalScore;
        this.schedule.forEach(s => { if (s.name !== 'TOTAL') s.activities.forEach(act => grandTotalMax += (act.maxScore || 0)); });
        totalAct.maxScore = grandTotalMax;
      }
    },
    saveData() {
      if (isInitializing) return; clearTimeout(this.saveTimeout); this.saveStatus = 'saving';
      this.saveTimeout = setTimeout(async () => {
        try {
          this.calculateScores(); const data = this.getCurrentDataState();
          localStorage.setItem(`planner_${this.currentWeek}`, JSON.stringify(data));
          if (this.isOnline) {
            await this.saveToPocketbase(this.currentWeek, data);
            this.pendingSync = this.pendingSync.filter(item => item.weekId !== this.currentWeek || item.operation === 'delete');
          } else this.addToPendingSync(this.currentWeek, data);
          localStorage.setItem('planner_pending_sync', JSON.stringify(this.pendingSync));
          lastSavedState = JSON.stringify(data); this.saveStatus = 'saved';
        } catch (e) { this.saveStatus = 'error'; this.showErrorMessage("Save error: " + e.message); setTimeout(() => this.saveStatus = 'saved', 3000); }
      }, 500);
    },
    hasSignificantChanges() {
      if (!lastSavedState) return true;
      const current = { ...this.getCurrentDataState() }; delete current.dateRange; delete current.week_id;
      const last = JSON.parse(lastSavedState); delete last.dateRange; delete last.week_id;
      return JSON.stringify(current) !== JSON.stringify(last);
    },
    addToPendingSync(weekId, data, operation = 'save') {
      this.pendingSync = this.pendingSync.filter(item => !(item.weekId === weekId && item.operation === operation));
      this.pendingSync.push({ weekId, data: data ? JSON.parse(JSON.stringify(data)) : null, operation, timestamp: new Date().toISOString() });
      localStorage.setItem('planner_pending_sync', JSON.stringify(this.pendingSync));
    },
    async syncPendingData() {
      if (!this.isOnline || this.pendingSync.length === 0) return;
      const itemsToSync = [...this.pendingSync]; this.pendingSync = []; // Optimistically clear
      for (const item of itemsToSync) {
        try {
          if (item.operation === 'delete') await this.deleteFromPocketbase(item.weekId);
          else await this.saveToPocketbase(item.weekId, item.data);
          const currentPending = JSON.parse(localStorage.getItem('planner_pending_sync') || '[]');
          localStorage.setItem('planner_pending_sync', JSON.stringify(currentPending.filter(i => i.timestamp !== item.timestamp)));
        } catch (e) { this.pendingSync.push(item); } // Re-add if failed
      }
      if (this.pendingSync.length > 0) localStorage.setItem('planner_pending_sync', JSON.stringify(this.pendingSync)); // Save if any re-added
    },
    async saveToPocketbase(weekId, data) {
      const existing = await pb.collection('planners').getFirstListItem(`week_id="${weekId}"`).catch(e => { if(e.status === 404) return null; throw e;});
      if (existing) await pb.collection('planners').update(existing.id, data); else await pb.collection('planners').create(data);
    },
    async deleteFromPocketbase(weekId) {
      const existing = await pb.collection('planners').getFirstListItem(`week_id="${weekId}"`).catch(e => { if(e.status === 404) return null; throw e;});
      if (existing) await pb.collection('planners').delete(existing.id);
    },
    async fetchSavedWeeks() {
      const weeks = new Map(), currentIso = this.getCurrentIsoWeek();
      const add = (iso, dr, src, isCur) => {
        const ex = weeks.get(iso), newDr = dr || this.getWeekDateRange(this.parseISOWeek(iso));
        if (!ex || (src === 'pocketbase' && ex.source !== 'pocketbase') || (src === 'local' && ex.source === 'current')) weeks.set(iso, { iso_week: iso, dateRange: newDr, source: src, isCurrent: isCur });
        else if (ex && !ex.dateRange && newDr) ex.dateRange = newDr;
      };
      add(currentIso, this.getWeekDateRange(this.parseISOWeek(currentIso)), 'current', true);
      if (this.isOnline) { try { (await pb.collection('planners').getFullList({ sort: '-week_id', fields: 'week_id,dateRange' })).forEach(it => add(it.week_id, it.dateRange, 'pocketbase', it.week_id === currentIso)); } catch (e) { console.error("PB fetch weeks error:", e); } }
      for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k.startsWith('planner_') && !k.includes('pending_sync')) { const iso = k.replace('planner_', ''); try { const d = JSON.parse(localStorage.getItem(k)); add(iso, d.dateRange, 'local', iso === currentIso); } catch (e) {} } }
      this.savedWeeks = Array.from(weeks.values()).sort((a,b) => (a.isCurrent && !b.isCurrent) ? -1 : ((!a.isCurrent && b.isCurrent) ? 1 : b.iso_week.localeCompare(a.iso_week)));
    },
    confirmLoadWeek(isoWeek) { (this.hasSignificantChanges() && isoWeek !== this.currentWeek && !confirm("Unsaved changes. Load anyway?")) ? null : this.loadWeek(isoWeek); },
    confirmDeleteWeek(isoWeek) { if (confirm(`Delete schedule for ${isoWeek}?`)) this.deleteWeek(isoWeek); },
    async deleteWeek(isoWeek) {
      localStorage.removeItem(`planner_${isoWeek}`);
      if (this.isOnline) try { await this.deleteFromPocketbase(isoWeek); } catch (e) { this.addToPendingSync(isoWeek, null, 'delete'); }
      else this.addToPendingSync(isoWeek, null, 'delete');
      this.savedWeeks = this.savedWeeks.filter(w => w.iso_week !== isoWeek);
      if (this.currentWeek === isoWeek) { this.currentWeek = this.getCurrentIsoWeek(); await this.loadWeek(this.currentWeek); }
    },
    async selectCity(cityOpt) {
      this.city = cityOpt.name; this.showCitySelector = false;
      try {
        if (cityOpt.lat === null) await this.getPrayerTimes(); else await this.fetchPrayerTimes(cityOpt.lat, cityOpt.lon);
        this.saveData();
      } catch (e) { this.showErrorMessage("Failed to load prayer times."); }
    },
    async getPrayerTimes() {
      try {
        const pos = await new Promise((res, rej) => navigator.geolocation.getCurrentPosition(res, rej, {timeout:5000,maximumAge:60000}));
        const { latitude, longitude } = pos.coords;
        try {
          const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&accept-language=en`);
          const geoData = await geoRes.json(); this.city = geoData.address?.city || geoData.address?.town || geoData.address?.village || geoData.address?.county || "Current Location";
        } catch (e) { this.city = "Current Location"; console.warn("Geocoding error", e)}
        await this.fetchPrayerTimes(latitude, longitude);
      } catch (e) { this.showErrorMessage("Could not get location. Using London default."); this.city = "London"; await this.fetchPrayerTimes(51.5074, -0.1278); }
    },
    async fetchPrayerTimes(lat, lon) {
      const t = new Date(), dStr = `${t.getFullYear()}_${t.getMonth()+1}_${t.getDate()}`, cacheKey = `prayer_times_${dStr}_${lat.toFixed(2)}_${lon.toFixed(2)}`;
      const cached = localStorage.getItem(cacheKey); if (cached) { try {this.setPrayerTimes(JSON.parse(cached)); return;} catch(e){localStorage.removeItem(cacheKey);}}
      try {
        const res = await fetch(`https://api.aladhan.com/v1/calendar/${t.getFullYear()}/${t.getMonth()+1}?latitude=${lat}&longitude=${lon}&method=2`);
        if (!res.ok) throw new Error(`API error: ${res.statusText} (${res.status})`); const apiData = await res.json();
        if (apiData.code === 200 && apiData.data?.[t.getDate()-1]?.timings) { localStorage.setItem(cacheKey, JSON.stringify(apiData.data[t.getDate()-1].timings)); this.setPrayerTimes(apiData.data[t.getDate()-1].timings); }
        else throw new Error("Invalid prayer time data from API");
      } catch (e) { this.showErrorMessage("Failed to fetch prayer times: "+e.message); this.setPrayerTimes({ Fajr:"05:30",Dhuhr:"12:30",Asr:"15:45",Maghrib:"18:30",Isha:"20:00" }); }
    },
    setPrayerTimes(timings) {
      const qiyam = this.calculateQiyamTime(timings.Fajr), prayerMap = { Q:qiyam, F:timings.Fajr, D:timings.Dhuhr, A:timings.Asr, M:timings.Maghrib, I:timings.Isha };
      let changed = false; this.times.forEach(ts => { const newTime = this.formatTime(prayerMap[ts.label]); if(ts.value !== newTime){ts.value=newTime; changed=true;} });
      if (changed && !isInitializing) this.saveData();
    },
    formatTime(timeStr) {
      if (!timeStr || typeof timeStr !== 'string') return ""; const t = timeStr.split(" ")[0], [hS, mS] = t.split(":"); if (!hS||!mS) return "";
      let h=parseInt(hS), m=parseInt(mS); if(isNaN(h)||isNaN(m)) return ""; return `${h%12||12}:${m.toString().padStart(2,'0')}${h>=12?"PM":"AM"}`;
    },
    calculateQiyamTime(fajrTime) {
      if (!fajrTime || typeof fajrTime !== 'string') return ""; const fP = fajrTime.split(" ")[0].split(":"); if (fP.length<2) return "";
      let fH = parseInt(fP[0]), fM = parseInt(fP[1]); if(isNaN(fH)||isNaN(fM)) return "";
      let qD = new Date(); qD.setHours(fH, fM, 0, 0); qD.setHours(qD.getHours() - 1); return `${qD.getHours()}:${fM.toString().padStart(2,'0')}`;
    }
  };
}
