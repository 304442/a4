function plannerApp() {
  const pb = new PocketBase('/');
  pb.autoCancellation(false);
  let isInitializing = true;
  let lastSavedState = null;

  const defaultUiConfig = {
    plannerTitle: 'A4 Planner',
    mainTableHeaders: ['SECTION', 'ACT', 'ACTIVITY NAME', '', '', '', '', '', '', '', '', '', '', '', '', '', '', 'SCORE', 'MAX', 'STRK'],
    dayHeaders: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'],
    maxHeaders: ['M', 'M', 'M', 'M', 'M', 'M', 'M'],
    sectionTitles: {
      tasks: 'TASKS & REMINDERS',
      workout: 'WORKOUT PLAN',
      meals: 'MEALS',
      grocery: 'GROCERY LIST',
      measurements: 'BODY MEASUREMENTS',
      financials: 'FINANCIALS'
    },
    taskHeaders: ['#', 'P', 'T', 'DESCRIPTION', 'DATE', 'DONE']
  };

  const defaultSchedule = [ { name: 'QIYAM', activities: [ { name: 'DAILY: Wakeup early', days: { mon: { value: '', max: 1 }, tue: { value: '', max: 1 }, wed: { value: '', max: 1 }, thu: { value: '', max: 1 }, fri: { value: '', max: 1 }, sat: { value: '', max: 1 }, sun: { value: '', max: 1 } }, score: 0, maxScore: 7, streaks: { current: 0, longest: 0 } }, { name: 'DAILY: Qiyam/Tahajjud', days: { mon: { value: '', max: 1 }, tue: { value: '', max: 1 }, wed: { value: '', max: 1 }, thu: { value: '', max: 1 }, fri: { value: '', max: 1 }, sat: { value: '', max: 1 }, sun: { value: '', max: 1 } }, score: 0, maxScore: 7, streaks: { current: 0, longest: 0 } }, { name: 'DAILY: Nutty Pudding', days: { mon: { value: '', max: 1 }, tue: { value: '', max: 1 }, wed: { value: '', max: 1 }, thu: { value: '', max: 1 }, fri: { value: '', max: 1 }, sat: { value: '', max: 1 }, sun: { value: '', max: 1 } }, score: 0, maxScore: 7, streaks: { current: 0, longest: 0 } } ] }, { name: 'FAJR', activities: [ { name: 'DAILY: Fajr prayer', days: { mon: { value: '', max: 1 }, tue: { value: '', max: 1 }, wed: { value: '', max: 1 }, thu: { value: '', max: 1 }, fri: { value: '', max: 1 }, sat: { value: '', max: 1 }, sun: { value: '', max: 1 } }, score: 0, maxScore: 7, streaks: { current: 0, longest: 0 } }, { name: 'DAILY: Quran - 1 Juz', days: { mon: { value: '', max: 1 }, tue: { value: '', max: 1 }, wed: { value: '', max: 1 }, thu: { value: '', max: 1 }, fri: { value: '', max: 1 }, sat: { value: '', max: 1 }, sun: { value: '', max: 1 } }, score: 0, maxScore: 7, streaks: { current: 0, longest: 0 } }, { name: 'DAILY: 5min Cold Shower', days: { mon: { value: '', max: 1 }, tue: { value: '', max: 1 }, wed: { value: '', max: 1 }, thu: { value: '', max: 1 }, fri: { value: '', max: 1 }, sat: { value: '', max: 1 }, sun: { value: '', max: 1 } }, score: 0, maxScore: 7, streaks: { current: 0, longest: 0 } } ] }, { name: '7AM - 9AM', activities: [ { name: 'MON/THU: COMMUTE', days: { mon: { value: '', max: 1 }, thu: { value: '', max: 1 } }, score: 0, maxScore: 2, streaks: { current: 0, longest: 0 } }, { name: 'TUE/WED/FRI: Reading/Study (book/course/skill)', days: { tue: { value: '', max: 1 }, wed: { value: '', max: 1 }, fri: { value: '', max: 1 } }, score: 0, maxScore: 3, streaks: { current: 0, longest: 0 } }, { name: 'SAT: Errands, Grocery shopping, Meal prep', days: { sat: { value: '', max: 3 } }, score: 0, maxScore: 3, streaks: { current: 0, longest: 0 } }, { name: 'SUN: House cleaning, laundry', days: { sun: { value: '', max: 2 } }, score: 0, maxScore: 2, streaks: { current: 0, longest: 0 } } ] }, { name: '9AM - 5PM', activities: [ { name: 'MON - FRI: Work', days: { mon: { value: '', max: 1 }, tue: { value: '', max: 1 }, wed: { value: '', max: 1 }, thu: { value: '', max: 1 }, fri: { value: '', max: 1 } }, score: 0, maxScore: 5, streaks: { current: 0, longest: 0 } }, { name: 'DAILY: ZeroInbox (E1, E2, E3, E4, LI, Slack)', days: { mon: { value: '', max: 6 }, tue: { value: '', max: 6 }, wed: { value: '', max: 6 }, thu: { value: '', max: 6 }, fri: { value: '', max: 6 } }, score: 0, maxScore: 30, streaks: { current: 0, longest: 0 } }, { name: 'SAT/SUN: Nature time / Outdoor Activity / Adventure', days: { sat: { value: '', max: 1 }, sun: { value: '', max: 1 } }, score: 0, maxScore: 2, streaks: { current: 0, longest: 0 } } ] }, { name: 'DHUHR', activities: [ { name: 'DAILY: Dhuhr prayer', days: { mon: { value: '', max: 1 }, tue: { value: '', max: 1 }, wed: { value: '', max: 1 }, thu: { value: '', max: 1 }, fri: { value: '', max: 1 }, sat: { value: '', max: 1 }, sun: { value: '', max: 1 } }, score: 0, maxScore: 7, streaks: { current: 0, longest: 0 } }, { name: 'TUE/WED/FRI: Sun walk (30-45 minutes)', days: { tue: { value: '', max: 1 }, wed: { value: '', max: 1 }, fri: { value: '', max: 1 } }, score: 0, maxScore: 3, streaks: { current: 0, longest: 0 } }, { name: 'FRI: £10 Sadaqa', days: { fri: { value: '', max: 1 } }, score: 0, maxScore: 1, streaks: { current: 0, longest: 0 } } ] }, { name: 'ASR', activities: [ { name: 'DAILY: Asr prayer', days: { mon: { value: '', max: 1 }, tue: { value: '', max: 1 }, wed: { value: '', max: 1 }, thu: { value: '', max: 1 }, fri: { value: '', max: 1 }, sat: { value: '', max: 1 }, sun: { value: '', max: 1 } }, score: 0, maxScore: 7, streaks: { current: 0, longest: 0 } } ] }, { name: '5PM - 6:30PM', activities: [ { name: 'MON/THU: COMMUTE', days: { mon: { value: '', max: 1 }, thu: { value: '', max: 1 } }, score: 0, maxScore: 2, streaks: { current: 0, longest: 0 } }, { name: 'TUE/WED/FRI: Workout', days: { tue: { value: '', max: 1 }, wed: { value: '', max: 1 }, fri: { value: '', max: 1 } }, score: 0, maxScore: 3, streaks: { current: 0, longest: 0 } }, { name: 'TUE/WED/FRI: Third Meal', days: { tue: { value: '', max: 1 }, wed: { value: '', max: 1 }, fri: { value: '', max: 1 } }, score: 0, maxScore: 3, streaks: { current: 0, longest: 0 } } ] }, { name: '6:30PM - ISHA', activities: [ { name: 'MON/TUE/WED/THU: Personal', days: { mon: { value: '', max: 1 }, tue: { value: '', max: 1 }, wed: { value: '', max: 1 }, thu: { value: '', max: 1 } }, score: 0, maxScore: 4, streaks: { current: 0, longest: 0 } }, { name: 'DAILY: Family/Friends/Date calls(M, WA, Phone)', days: { mon: { value: '', max: 3 }, tue: { value: '', max: 3 }, wed: { value: '', max: 3 }, thu: { value: '', max: 3 } }, score: 0, maxScore: 12, streaks: { current: 0, longest: 0 } }, { name: 'FRI/SAT/SUN: Family/Friends/Date visits/outings/activities', days: { fri: { value: '', max: 3 }, sat: { value: '', max: 3 }, sun: { value: '', max: 3 } }, score: 0, maxScore: 9, streaks: { current: 0, longest: 0 } } ] }, { name: 'MAGHRIB', activities: [ { name: 'DAILY: Maghrib prayer', days: { mon: { value: '', max: 1 }, tue: { value: '', max: 1 }, wed: { value: '', max: 1 }, thu: { value: '', max: 1 }, fri: { value: '', max: 1 }, sat: { value: '', max: 1 }, sun: { value: '', max: 1 } }, score: 0, maxScore: 7, streaks: { current: 0, longest: 0 } }, { name: 'DAILY: Super Veggie', days: { mon: { value: '', max: 1 }, tue: { value: '', max: 1 }, wed: { value: '', max: 1 }, thu: { value: '', max: 1 }, fri: { value: '', max: 1 }, sat: { value: '', max: 1 }, sun: { value: '', max: 1 } }, score: 0, maxScore: 7, streaks: { current: 0, longest: 0 } } ] }, { name: 'ISHA', activities: [ { name: 'DAILY: Isha prayer', days: { mon: { value: '', max: 1 }, tue: { value: '', max: 1 }, wed: { value: '', max: 1 }, thu: { value: '', max: 1 }, fri: { value: '', max: 1 }, sat: { value: '', max: 1 }, sun: { value: '', max: 1 } }, score: 0, maxScore: 7, streaks: { current: 0, longest: 0 } }, { name: 'DAILY: Sleep early', days: { mon: { value: '', max: 1 }, tue: { value: '', max: 1 }, wed: { value: '', max: 1 }, thu: { value: '', max: 1 }, fri: { value: '', max: 1 }, sat: { value: '', max: 1 }, sun: { value: '', max: 1 } }, score: 0, maxScore: 7, streaks: { current: 0, longest: 0 } } ] }, { name: 'ALLDAY', activities: [ { name: 'DAILY: No Doomscrolling; (FB, YTB, LKDN, & IG)', days: { mon: { value: '', max: 4 }, tue: { value: '', max: 4 }, wed: { value: '', max: 4 }, thu: { value: '', max: 4 }, fri: { value: '', max: 4 }, sat: { value: '', max: 4 }, sun: { value: '', max: 4 } }, score: 0, maxScore: 28, streaks: { current: 0, longest: 0 } }, { name: 'DAILY: No Fap; (P, & M)', days: { mon: { value: '', max: 2 }, tue: { value: '', max: 2 }, wed: { value: '', max: 2 }, thu: { value: '', max: 2 }, fri: { value: '', max: 2 }, sat: { value: '', max: 2 }, sun: { value: '', max: 2 } }, score: 0, maxScore: 14, streaks: { current: 0, longest: 0 } }, { name: 'DAILY: No Processed; (Sugar, RefinedFlour, SeedOils, Soda, FastFood)', days: { mon: { value: '', max: 5 }, tue: { value: '', max: 5 }, wed: { value: '', max: 5 }, thu: { value: '', max: 5 }, fri: { value: '', max: 5 }, sat: { value: '', max: 5 }, sun: { value: '', max: 5 } }, score: 0, maxScore: 35, streaks: { current: 0, longest: 0 } }, { name: 'MON/THU: Fasting', days: { mon: { value: '', max: 1 }, thu: { value: '', max: 1 } }, score: 0, maxScore: 2, streaks: { current: 0, longest: 0 } }, { name: 'DAILY: Expense Tracker <25', days: { mon: { value: '', max: 0 }, tue: { value: '', max: 0 }, wed: { value: '', max: 0 }, thu: { value: '', max: 0 }, fri: { value: '', max: 0 }, sat: { value: '', max: 0 }, sun: { value: '', max: 0 } }, score: 0, maxScore: 0, streaks: { current: 0, longest: 0 } } ] }, { name: 'TOTAL', activities: [ { name: 'DAILY POINTS', days: { mon: { value: '0', max: 0 }, tue: { value: '0', max: 0 }, wed: { value: '0', max: 0 }, thu: { value: '0', max: 0 }, fri: { value: '0', max: 0 }, sat: { value: '0', max: 0 }, sun: { value: '0', max: 0 } }, score: 0, maxScore: 0, streaks: { current: 0, longest: 0 } } ] } ];
  const defaultTasks = Array(20).fill().map(() => ({ num: '', priority: '', tag: '', description: '', date: '', completed: '' }));
  const defaultWorkoutPlan = [ { name: 'TUESDAY', exercises: [ { prefix: '• ', name: 'Incline Dumbbell Press', weight: '', sets: '', reps: '', defaultWeight: '30', defaultSets: '3', defaultReps: '12' }, { prefix: '• ', name: 'Barbell Squats', weight: '', sets: '', reps: '', defaultWeight: '80', defaultSets: '3', defaultReps: '8' }, { prefix: '• ', name: 'DB Chest-Supported Row', weight: '', sets: '', reps: '', defaultWeight: '25', defaultSets: '3', defaultReps: '12' }, { prefix: '• ', name: 'Leg Curls', weight: '', sets: '', reps: '', defaultWeight: '40', defaultSets: '3', defaultReps: '15' }, { prefix: '• SS: ', name: 'Incline DB Curls', weight: '', sets: '', reps: '', defaultWeight: '15', defaultSets: '3', defaultReps: '12' }, { prefix: '• SS: ', name: 'Tricep Extensions', weight: '', sets: '', reps: '', defaultWeight: '20', defaultSets: '3', defaultReps: '12' } ] }, { name: 'WEDNESDAY', exercises: [ { prefix: '• ', name: 'Barbell Bench Press', weight: '', sets: '', reps: '', defaultWeight: '70', defaultSets: '3', defaultReps: '6' }, { prefix: '• ', name: 'Romanian Deadlift', weight: '', sets: '', reps: '', defaultWeight: '90', defaultSets: '3', defaultReps: '8' }, { prefix: '• ', name: 'Lat Pulldown', weight: '', sets: '', reps: '', defaultWeight: '60', defaultSets: '3', defaultReps: '12' }, { prefix: '• ', name: 'Walking Lunges', weight: '', sets: '', reps: '', defaultWeight: '20', defaultSets: '3', defaultReps: '10' }, { prefix: '• SS: ', name: 'Cable Lateral Raises', weight: '', sets: '', reps: '', defaultWeight: '15', defaultSets: '3', defaultReps: '15' }, { prefix: '• SS: ', name: 'Reverse Crunches', weight: '', sets: '', reps: '', defaultWeight: '0', defaultSets: '3', defaultReps: '15' } ] }, { name: 'FRIDAY', exercises: [ { prefix: '• ', name: 'Seated DB Shoulder Press', weight: '', sets: '', reps: '', defaultWeight: '20', defaultSets: '3', defaultReps: '12' }, { prefix: '• ', name: 'Dumbbell Row', weight: '', sets: '', reps: '', defaultWeight: '25', defaultSets: '3', defaultReps: '12' }, { prefix: '• ', name: 'Barbell Hip Thrust', weight: '', sets: '', reps: '', defaultWeight: '100', defaultSets: '3', defaultReps: '15' }, { prefix: '• ', name: 'Leg Extensions', weight: '', sets: '', reps: '', defaultWeight: '50', defaultSets: '3', defaultReps: '15' }, { prefix: '• ', name: 'Seated Chest Flyes', weight: '', sets: '', reps: '', defaultWeight: '15', defaultSets: '3', defaultReps: '15' }, { prefix: '• SS: ', name: 'Standing Calf Raises', weight: '', sets: '', reps: '', defaultWeight: '30', defaultSets: '3', defaultReps: '15' }, { prefix: '• SS: ', name: 'Reverse Cable Flyes', weight: '', sets: '', reps: '', defaultWeight: '20', defaultSets: '3', defaultReps: '15' } ] } ];
  const defaultMeals = [ { name: 'Nutty Pudding', ingredients: 'Berries ½c, Cherries 3, Pomegranate Juice 2oz, Macadamia nuts (raw) 45g, Walnuts (raw) 5g, Cocoa 1t, Brazil Nuts ¼, Milk 50-100ml, Chia Seeds 2T, Flax (ground, refr) 1t, Lecithin 1t, Ceylon Cinnamon ½t' }, { name: 'Super Veggie', ingredients: 'Broccoli 250g, Cauliflower 150g, Mushrooms 50g, Garlic 1 clove, Ginger 3g, Cumin 1T, Black Lentils 45g, Hemp Seeds 1T, Apple Cider Vinegar 1T' }, { name: 'Third Meal', ingredients: 'Sweet Potato 350-400g, Protein 100-150g, Grape Tomatoes 12, Avocado ½, Radishes 4, Cilantro ¼c, Lemon 1, Jalapeño (lg) 1, Chili Powder 1t' } ];
  const defaultGroceryList = [ { name: 'Produce', items: 'Broccoli 1.75kg, Cauliflower 1.05kg, Mushrooms 350g, Garlic 1 bulb, Ginger 1pc, Sweet Potato 2.8kg, Grape Tomatoes 84, Avocados (ripe) 4, Radishes 28, Cilantro 2-3 bunch' }, { name: 'Fruits & Protein', items: 'Lemons 7, Jalapeños (lg) 7, Berries 3.5c, Cherries 21, Black Lentils 315g, Protein 1.05kg, Milk (fortified) 1L' } ];
  const defaultBodyMeasurements = [ { name: 'Weight', value: '', placeholder: '75kg' }, { name: 'Chest', value: '', placeholder: '42in' }, { name: 'Waist', value: '', placeholder: '34in' }, { name: 'Hips', value: '', placeholder: '40in' }, { name: 'Arms', value: '', placeholder: '15in' }, { name: 'Thighs', value: '', placeholder: '24in' } ];
  const defaultFinancials = [ { name: 'Rent', value: '', placeholder: '850', account: 'Cash' }, { name: 'Allowance', value: '', placeholder: '850', account: 'Revolut' }, { name: 'Savings', value: '', placeholder: '3,800', account: 'HSBCUK' } ];
  const defaultTimes = [ { label: 'Q', value: '' }, { label: 'F', value: '' }, { label: 'D', value: '' }, { label: 'A', value: '' }, { label: 'M', value: '' }, { label: 'I', value: '' } ];

  return {
    plannerTitle: defaultUiConfig.plannerTitle,
    uiConfig: JSON.parse(JSON.stringify(defaultUiConfig)),
    currentWeek: '',
    dateRange: '',
    city: 'London',
    saveStatus: 'saved',
    saveTimeout: null,
    showNotification: false,
    notificationMessage: '',
    notificationTimeout: null,
    isOnline: navigator.onLine,
    pendingSync: [],
    showCitySelector: false,
    showWeekSelector: false,
    dropdownPosition: { top: 0, left: 0 },
    currentDay: (new Date()).getDay(),
    newActivityName: '',
    contextMenu: { show: false, top: 0, left: 0, type: null, data: null },
    hasUnsavedChanges: false,

    times: JSON.parse(JSON.stringify(defaultTimes)),
    cityOptions: [ { name: 'London', lat: 51.5074, lon: -0.1278 }, { name: 'Cairo', lat: 30.0444, lon: 31.2357 }, { name: 'Cape Town', lat: -33.9249, lon: 18.4241 }, { name: 'Amsterdam', lat: 52.3676, lon: 4.9041 }, { name: 'Current Location', lat: null, lon: null } ],
    savedWeeks: [],
    schedule: JSON.parse(JSON.stringify(defaultSchedule)),
    tasks: JSON.parse(JSON.stringify(defaultTasks)),
    workoutPlan: JSON.parse(JSON.stringify(defaultWorkoutPlan)),
    meals: JSON.parse(JSON.stringify(defaultMeals)),
    groceryBudget: '',
    groceryList: JSON.parse(JSON.stringify(defaultGroceryList)),
    bodyMeasurements: JSON.parse(JSON.stringify(defaultBodyMeasurements)),
    financials: JSON.parse(JSON.stringify(defaultFinancials)),

    async init() {
      this.currentDay = (new Date()).getDay();
      try {
        window.addEventListener('online', () => { this.isOnline = true; this.syncPendingData(); });
        window.addEventListener('offline', () => this.isOnline = false);
        document.addEventListener('click', e => {
          if (!e.target.closest('.dropdown') && !e.target.closest('.clickable')) this.showCitySelector = this.showWeekSelector = false;
          if (!e.target.closest('.context-menu') && this.contextMenu.show) this.hideContextMenu();
        });
        this.pendingSync = JSON.parse(localStorage.getItem('planner_pending_sync') || '[]');
        this.currentWeek = this.getCurrentIsoWeek();
        this.dateRange = this.getWeekDateRange(this.parseISOWeek(this.currentWeek));
        this.schedule.forEach(s => s.activities.forEach(a => { if (!a.streaks) a.streaks = { current: 0, longest: 0 }; }));
        await this.loadWeek(this.currentWeek, true);
        setInterval(() => { if (!isInitializing && this.hasUnsavedChanges && this.saveStatus !== 'saving') this.saveData(); }, 30000);
        if (this.isOnline) this.syncPendingData();
      } catch (error) { console.error("Init Error:", error); this.showErrorMessage("Failed to initialize."); }
      finally { isInitializing = false; }
    },

    editInline(event, type, index, defaultValue) {
        const element = event.currentTarget;
        if (!element || element.classList.contains('editing-active-js')) return;
        element.classList.add('editing-active-js');

        let initialInputValue = (defaultValue !== undefined && defaultValue !== null) ? String(defaultValue) : (element.dataset.originalValue || element.innerText || '');

        const originalChildren = Array.from(element.childNodes);
        originalChildren.forEach(child => {
            if (child.nodeType === Node.ELEMENT_NODE) {
                 child.dataset.originalDisplay = child.style.display;
                 child.style.display = 'none';
            }
        });

        const isTextarea = ['mealIngredients', 'groceryCategoryItems'].includes(type);
        const input = document.createElement(isTextarea ? 'textarea' : 'input');
        input.type = 'text';
        input.value = initialInputValue;
        input.className = isTextarea ? 'inline-edit-textarea' : 'inline-edit-input';
        if (isTextarea) input.rows = 3;


        element.appendChild(input);
        input.focus();
        input.select();

        const finishEdit = (shouldSaveChanges) => {
            if (!element.contains(input)) return;

            const newValue = input.value;
            input.remove();

            originalChildren.forEach(child => {
                if (child.nodeType === Node.ELEMENT_NODE) {
                    child.style.display = child.dataset.originalDisplay || '';
                    delete child.dataset.originalDisplay;
                }
            });
            element.classList.remove('editing-active-js');

            if (shouldSaveChanges) {
                if (newValue.trim() !== initialInputValue.trim()) {
                    this.updateValue(type, index, newValue);
                }
            }
            
            this.$nextTick(() => {
                if (document.body.contains(element)) {
                    try { element.focus({ preventScroll: true }); }
                    catch(e) { /* Failsafe */ }
                }
            });
        };

        let blurTimeout;
        const blurHandler = () => {
            blurTimeout = setTimeout(() => {
                 if (document.body.contains(input)) {
                    finishEdit(true);
                 }
            }, 100);
        };

        const keydownHandler = (e) => {
            clearTimeout(blurTimeout);
            if (e.key === 'Enter' && !(isTextarea && e.shiftKey)) {
                e.preventDefault();
                input.removeEventListener('blur', blurHandler);
                finishEdit(true);
            } else if (e.key === 'Escape') {
                e.preventDefault();
                input.removeEventListener('blur', blurHandler);
                finishEdit(false);
            }
        };

        input.addEventListener('blur', blurHandler);
        input.addEventListener('keydown', keydownHandler);
    },

    updateValue(type, index, value) {
      const getActualScheduleIndex = (sIdx) => this.schedule.length - 1 - sIdx; // schedule is reversed in template
      let sRealIdx, aIdx, dayKey, dayIdx, exIdx, act, actNameData, prefix;
      this.hasUnsavedChanges = true;

      switch (type) {
        case 'plannerTitle': this.plannerTitle = value; break;
        case 'timeLabel': if (this.times[index]) this.times[index].label = value; break;
        case 'mainTableHeader': if (index < this.uiConfig.mainTableHeaders.length) this.uiConfig.mainTableHeaders[index] = value; break;
        case 'dayHeader': if (index < this.uiConfig.dayHeaders.length) this.uiConfig.dayHeaders[index] = value; break;
        case 'maxHeader': if (index < this.uiConfig.maxHeaders.length) this.uiConfig.maxHeaders[index] = value; break;
        case 'sectionTitle': if (this.uiConfig.sectionTitles[index]) this.uiConfig.sectionTitles[index] = value; break;
        case 'taskHeader': if (index < this.uiConfig.taskHeaders.length) this.uiConfig.taskHeaders[index] = value; break;
        
        case 'sectionName': sRealIdx = getActualScheduleIndex(index); if(this.schedule[sRealIdx]) this.schedule[sRealIdx].name = value; break;
        case 'activityPrefix': ({sIdx, aIdx} = index); sRealIdx = getActualScheduleIndex(sIdx); act = this.schedule[sRealIdx]?.activities?.[aIdx];
                             if(act) act.name = `${value.trim()}:${act.name.split(':').pop().trim()}`; break;
        case 'activityName': ({sIdx, aIdx} = index); sRealIdx = getActualScheduleIndex(sIdx); actNameData = this.schedule[sRealIdx]?.activities?.[aIdx];
                             if(actNameData) { prefix = actNameData.name.includes(':') ? actNameData.name.split(':')[0].trim() : ''; actNameData.name = prefix ? `${prefix}: ${value.trim()}` : value.trim(); } break;
        case 'maxValue': ({sIdx, aIdx, day} = index); sRealIdx = getActualScheduleIndex(sIdx); dayKey = day;
                         if (this.schedule[sRealIdx]?.activities?.[aIdx]?.days?.[dayKey]) this.schedule[sRealIdx].activities[aIdx].days[dayKey].max = parseInt(value) || 0; break;
        case 'maxScore': ({sIdx, aIdx} = index); sRealIdx = getActualScheduleIndex(sIdx);
                         if(this.schedule[sRealIdx]?.activities?.[aIdx]) this.schedule[sRealIdx].activities[aIdx].maxScore = parseInt(value) || 0; break;

        case 'workoutDayName': if(this.workoutPlan[index]) this.workoutPlan[index].name = value; break;
        case 'exercisePrefix': ({dayIdx, exIdx} = index); if(this.workoutPlan[dayIdx]?.exercises?.[exIdx]) this.workoutPlan[dayIdx].exercises[exIdx].prefix = value; break;
        case 'exerciseName': ({dayIdx, exIdx} = index); if(this.workoutPlan[dayIdx]?.exercises?.[exIdx]) this.workoutPlan[dayIdx].exercises[exIdx].name = value; break;
        
        case 'mealName': if(this.meals[index]) this.meals[index].name = value; break;
        case 'mealIngredients': if(this.meals[index]) this.meals[index].ingredients = value; break;
        
        case 'groceryCategoryName': if(this.groceryList[index]) this.groceryList[index].name = value; break;
        case 'groceryCategoryItems': if(this.groceryList[index]) this.groceryList[index].items = value; break;
        
        case 'measurementName': if(this.bodyMeasurements[index]) this.bodyMeasurements[index].name = value; break;
        case 'financialName': if(this.financials[index]) this.financials[index].name = value; break;
        case 'financialAccount': if(this.financials[index]) this.financials[index].account = value; break;
        default: console.warn('Unhandled type in updateValue:', type); this.hasUnsavedChanges = false; return;
      }
      // Implicit save via interval or other triggers now that hasUnsavedChanges is true
    },
    
    showContextMenu(event, type, data) { event.preventDefault(); this.contextMenu = { show: true, top: event.pageY, left: event.pageX, type, data }; },
    hideContextMenu() { this.contextMenu.show = false; },
    editContextItem() {
        const { type, data } = this.contextMenu; let item, newName, sRealIdx;
        const getActualScheduleIndex = (sIdx) = this.schedule.length - 1 - sIdx;
        switch (type) {
            case 'activity': ({sIdx, aIdx} = data); sRealIdx = getActualScheduleIndex(sIdx); item = this.schedule[sRealIdx]?.activities?.[aIdx]; if (!item) { this.showErrorMessage('Activity not found.'); break; } newName = prompt('Edit activity name:', item.name); if (newName && newName.trim()) item.name = newName.trim(); break;
            case 'task': this.showErrorMessage('Tasks can be edited directly.'); break;
            case 'workoutDay': item = this.workoutPlan[data]; newName = prompt('Edit workout day name:', item.name); if (newName && newName.trim()) item.name = newName.trim(); break;
            case 'exercise': const {dayIdx, exIdx} = data; item = this.workoutPlan[dayIdx]?.exercises?.[exIdx]; if (!item) break; newName = prompt('Edit exercise name:', item.name); if (newName && newName.trim()) item.name = newName.trim(); break;
            case 'meal': item = this.meals[data]; newName = prompt('Edit meal name:', item.name); if (newName && newName.trim()) item.name = newName.trim(); break;
            case 'groceryCategory': item = this.groceryList[data]; newName = prompt('Edit category name:', item.name); if (newName && newName.trim()) item.name = newName.trim(); break;
            case 'measurement': item = this.bodyMeasurements[data]; newName = prompt('Edit measurement name:', item.name); if (newName && newName.trim()) item.name = newName.trim(); break;
            case 'financial': item = this.financials[data]; newName = prompt('Edit financial item name:', item.name); if (newName && newName.trim()) item.name = newName.trim(); break;
        }
        if (newName !== undefined) { this.hasUnsavedChanges = true; this.saveData(); } this.hideContextMenu();
    },
    deleteContextItem() {
        const { type, data } = this.contextMenu; if (!confirm('Are you sure you want to delete this item?')) { this.hideContextMenu(); return; }
        let sRealIdx; const getActualScheduleIndex = (sIdx) = this.schedule.length - 1 - sIdx;
        switch (type) {
            case 'activity': const {sIdx, aIdx} = data; sRealIdx = getActualScheduleIndex(sIdx); if (this.schedule[sRealIdx]?.activities) this.schedule[sRealIdx].activities.splice(aIdx, 1); break;
            case 'task': this.tasks.splice(data, 1); this.tasks.push({ num: '', priority: '', tag: '', description: '', date: '', completed: '' }); break;
            case 'workoutDay': this.workoutPlan.splice(data, 1); break;
            case 'exercise': const {dayIdx, exIdx} = data; if (this.workoutPlan[dayIdx]?.exercises) this.workoutPlan[dayIdx].exercises.splice(exIdx, 1); break;
            case 'meal': this.meals.splice(data, 1); break;
            case 'groceryCategory': this.groceryList.splice(data, 1); break;
            case 'measurement': this.bodyMeasurements.splice(data, 1); break;
            case 'financial': this.financials.splice(data, 1); break;
        }
        this.calculateScores(); this.hasUnsavedChanges = true; this.saveData(); this.hideContextMenu();
    },
    addContextItem() {
        const { type, data } = this.contextMenu; let itemType = type, itemIndex = data;
        const getActualScheduleIndex = (sIdx) = this.schedule.length - 1 - sIdx;
        if (type === 'activity' && typeof data === 'object' && data.hasOwnProperty('sIdx')) { itemIndex = getActualScheduleIndex(data.sIdx); if (!this.schedule[itemIndex]) {this.showErrorMessage('Cannot add activity: Invalid section.'); this.hideContextMenu(); return;} }
        else if (type === 'exercise' && typeof data === 'object' && data.hasOwnProperty('dayIdx')) { itemIndex = data.dayIdx; }
        this.addItem(itemType, itemIndex); this.hideContextMenu();
    },
    addItem(type, index = null) {
        let newItemName, section;
        switch (type) {
            case 'activity': section = this.schedule[index]; if (!section) { this.showErrorMessage('Cannot add activity: Invalid section.'); return; } newItemName = prompt(`Enter new activity name for section "${section.name}":`); if (newItemName && newItemName.trim()) this.addActivity(index, newItemName.trim()); break;
            case 'task': this.tasks.unshift({ num: '', priority: '', tag: '', description: '', date: '', completed: '' }); break;
            case 'workoutDay': newItemName = prompt('Enter new workout day name:'); if (newItemName && newItemName.trim()) this.workoutPlan.push({ name: newItemName.trim(), exercises: [] }); break;
            case 'exercise': section = this.workoutPlan[index]; if (!section) { this.showErrorMessage('Cannot add exercise: Invalid workout day.'); return; } newItemName = prompt(`Enter new exercise name for "${section.name}":`); if (newItemName && newItemName.trim()) section.exercises.push({ prefix: '• ', name: newItemName.trim(), weight: '', sets: '', reps: '', defaultWeight: '20', defaultSets: '3', defaultReps: '12' }); break;
            case 'meal': newItemName = prompt('Enter new meal name:'); if (newItemName && newItemName.trim()) this.meals.push({ name: newItemName.trim(), ingredients: '' }); break;
            case 'groceryCategory': newItemName = prompt('Enter new grocery category name:'); if (newItemName && newItemName.trim()) this.groceryList.push({ name: newItemName.trim(), items: '' }); break;
            case 'measurement': newItemName = prompt('Enter new measurement name:'); if (newItemName && newItemName.trim()) this.bodyMeasurements.push({ name: newItemName.trim(), value: '', placeholder: '' }); break;
            case 'financial': newItemName = prompt('Enter new financial item name:'); if (newItemName && newItemName.trim()) this.financials.push({ name: newItemName.trim(), value: '', placeholder: '', account: 'Account' }); break;
        }
        if (type !== 'activity') { this.hasUnsavedChanges = true; this.saveData(); }
    },
    addActivity(sActualIdx, activityName) {
        if (!activityName.trim() || !this.schedule[sActualIdx]) return;
        const newActivity = { name: activityName, days: { mon: { value: '', max: 1 }, tue: { value: '', max: 1 }, wed: { value: '', max: 1 }, thu: { value: '', max: 1 }, fri: { value: '', max: 1 }, sat: { value: '', max: 1 }, sun: { value: '', max: 1 } }, score: 0, maxScore: 7, streaks: { current: 0, longest: 0 } };
        this.schedule[sActualIdx].activities.push(newActivity);
        this.hasUnsavedChanges = true; this.saveData();
    },

    showErrorMessage(message) { this.notificationMessage = message; this.showNotification = true; clearTimeout(this.notificationTimeout); this.notificationTimeout = setTimeout(() => this.showNotification = false, 5000); },
    validateValue(value, isNumber = false, min = null, max = null) { if (value === null || value === undefined || String(value).trim() === '') return ''; if (isNumber) { const nV = parseFloat(value); if (isNaN(nV)) return ''; if (min !== null && nV < min) return min.toString(); if (max !== null && nV > max) return max.toString(); return nV.toString(); } return String(value); }, // Keep original trim behavior here, or trim in updateValue
    getCurrentIsoWeek() { const n = new Date(), d = new Date(n); d.setHours(0,0,0,0); d.setDate(d.getDate()+4-(d.getDay()||7)); const yS = new Date(d.getFullYear(),0,1); const wN = Math.ceil((((d-yS)/864e5)+1)/7); return `${d.getFullYear()}-W${wN.toString().padStart(2,'0')}`; },
    parseISOWeek(iS) { if (!/^\d{4}-W(0[1-9]|[1-4][0-9]|5[0-3])$/.test(iS)) return new Date(); const [y,wP]=iS.split('-'); const w=parseInt(wP.substring(1)); const d=new Date(Date.UTC(parseInt(y),0,4)); d.setUTCDate(d.getUTCDate()+(w-1)*7-(d.getUTCDay()||7)+1); return d; },
    getWeekDateRange(date) { const s = new Date(date), e = new Date(s); e.setDate(s.getDate()+6); return `${this.formatDate(s)}-${this.formatDate(e)}`; },
    formatDate(d) { return `${(d.getMonth()+1).toString().padStart(2,'0')}/${d.getDate().toString().padStart(2,'0')}`; },
    formatShortDate(i) { const n=new Date(); n.setDate(n.getDate()+i); return `${(n.getMonth()+1)}/${n.getDate()}`; },
    toggleCitySelector(e) { if(!e||!e.target){this.showCitySelector=!this.showCitySelector;this.showWeekSelector=false;return} this.showWeekSelector=false;const r=e.target.getBoundingClientRect();this.dropdownPosition={top:r.bottom+window.scrollY,left:r.left+window.scrollX};this.showCitySelector=!this.showCitySelector; },
    toggleWeekSelector(e) { if(!e||!e.target){this.showCitySelector=false;this.showWeekSelector=!this.showWeekSelector;if(this.showWeekSelector)this.fetchSavedWeeks();return} this.showCitySelector=false;const r=e.target.getBoundingClientRect();this.dropdownPosition={top:r.bottom+window.scrollY,left:r.left+window.scrollX};this.showWeekSelector=!this.showWeekSelector;if(this.showWeekSelector)this.fetchSavedWeeks(); },
    
    async loadWeek(isoWeek, isInit = false) {
        if (!/^\d{4}-W(0[1-9]|[1-4][0-9]|5[0-3])$/.test(isoWeek)) { this.showErrorMessage("Invalid week format"); return; }
        if (!isInit && this.hasUnsavedChanges && isoWeek !== this.currentWeek) { if (!confirm("You have unsaved changes that will be lost. Load a different week anyway?")) return; }

        this.showWeekSelector = false; this.currentWeek = isoWeek; this.dateRange = this.getWeekDateRange(this.parseISOWeek(isoWeek));
        let data = null;
        if (this.isOnline) { try { const recs = await pb.collection('planners').getList(1,1,{filter:`week_id="${isoWeek}"`}); if(recs.items.length>0) data=recs.items[0]; } catch (e) { console.error("Pocketbase load error:",e);}}
        if (!data) { try { const lD = localStorage.getItem(`planner_${isoWeek}`); if(lD) data=JSON.parse(lD); } catch (e) { console.error("LocalStorage load error:",e);}}
        
        this.populateFields(data || {});
        this.calculateScores();
        if (isInit && (!this.times[0].value || !this.times[1].value)) { try { await this.getPrayerTimes(); } catch (e) { console.error("Error loading prayer times:", e);}}
        this.hasUnsavedChanges = false;
        if (isInit) isInitializing = false; // Only set isInitializing to false after the first loadWeek
    },
    
    populateFields(data) {
        this.plannerTitle = data.plannerTitle || defaultUiConfig.plannerTitle;
        this.uiConfig = {
            ...JSON.parse(JSON.stringify(defaultUiConfig)),
            ...(data.uiConfig || {}),
            sectionTitles: { ...defaultUiConfig.sectionTitles, ...(data.uiConfig?.sectionTitles || {}) },
            taskHeaders: data.uiConfig?.taskHeaders || [...defaultUiConfig.taskHeaders],
            mainTableHeaders: data.uiConfig?.mainTableHeaders || [...defaultUiConfig.mainTableHeaders],
            dayHeaders: data.uiConfig?.dayHeaders || [...defaultUiConfig.dayHeaders],
            maxHeaders: data.uiConfig?.maxHeaders || [...defaultUiConfig.maxHeaders]
        };
        this.times = (data.times && data.times.length === defaultTimes.length) ? data.times.map((t,i) => ({...defaultTimes[i], ...t, value: this.validateValue(t.value)})) : JSON.parse(JSON.stringify(defaultTimes));
        
        const mergeArrayData = (defaultArr, loadedArr) => (loadedArr ? JSON.parse(JSON.stringify(loadedArr)) : JSON.parse(JSON.stringify(defaultArr)));
        this.schedule = mergeArrayData(defaultSchedule, data.schedule);
        this.tasks = mergeArrayData(defaultTasks, data.tasks);
        this.workoutPlan = mergeArrayData(defaultWorkoutPlan, data.workoutPlan);
        this.meals = mergeArrayData(defaultMeals, data.meals);
        this.groceryList = mergeArrayData(defaultGroceryList, data.groceryList);
        this.bodyMeasurements = mergeArrayData(defaultBodyMeasurements, data.bodyMeasurements);
        this.financials = mergeArrayData(defaultFinancials, data.financials);
        
        this.groceryBudget = this.validateValue(data.groceryBudget || '');
        this.city = data.city || 'London';

        this.schedule.forEach(s => s.activities.forEach(a => {
            if (!a.streaks) a.streaks = { current: 0, longest: 0 };
            Object.keys(a.days).forEach(dKey => {
                if(a.days[dKey]) a.days[dKey].value = this.validateValue(a.days[dKey].value, true, 0, (a.days[dKey].max !== undefined && a.days[dKey].max < 10) ? 9 : ((a.days[dKey].max !== undefined && a.days[dKey].max > 99) ? 99 : (a.days[dKey].max || 99)));
            });
        }));
        this.tasks.forEach(t => Object.keys(t).forEach(k => { if(t.hasOwnProperty(k)) t[k] = this.validateValue(t[k]); }));

        lastSavedState = JSON.stringify(this.getCurrentStateForComparison()); // Important: compare with this structure
    },

    validateTextInput(event) { event.target.value = this.validateValue(event.target.value); this.hasUnsavedChanges = true; },
    validateNumberInput(event) { const i=event.target; const m=i.hasAttribute('min')?parseFloat(i.min):0; const x=i.hasAttribute('max')?parseFloat(i.max):99; i.value=this.validateValue(i.value,true,m,x); this.calculateScores(); this.hasUnsavedChanges=true; },
    
    calculateScores() { /* ... Same as before ... */ }, // Ensure this is the full version
    
    getCurrentStateForComparison() { return { plannerTitle: this.plannerTitle, uiConfig: this.uiConfig, times: this.times, schedule: this.schedule, tasks: this.tasks, workoutPlan: this.workoutPlan, groceryBudget: this.groceryBudget, groceryList: this.groceryList, bodyMeasurements: this.bodyMeasurements, financials: this.financials, city: this.city }; },
    
    saveData() {
        if (isInitializing || this.saveStatus === 'saving') return;
        clearTimeout(this.saveTimeout);
        this.saveStatus = 'saving';
        this.saveTimeout = setTimeout(async () => {
            try {
                this.calculateScores();
                const plannerDataToSave = { ...this.getCurrentStateForComparison(), week_id: this.currentWeek, dateRange: this.dateRange };
                localStorage.setItem(`planner_${this.currentWeek}`, JSON.stringify(plannerDataToSave));
                if (this.isOnline) {
                    try {
                        await this.saveToPocketbase(this.currentWeek, plannerDataToSave);
                        this.pendingSync = this.pendingSync.filter(item => item.weekId !== this.currentWeek || item.operation === 'delete');
                        localStorage.setItem('planner_pending_sync', JSON.stringify(this.pendingSync));
                    } catch (error) { this.addToPendingSync(this.currentWeek, plannerDataToSave); }
                } else { this.addToPendingSync(this.currentWeek, plannerDataToSave); }
                lastSavedState = JSON.stringify(this.getCurrentStateForComparison()); // Update lastSavedState to reflect current data without week_id/dateRange for comparison
                this.saveStatus = 'saved';
                this.hasUnsavedChanges = false;
            } catch (error) { console.error("Error in saveData:", error); this.saveStatus = 'error'; this.showErrorMessage("Error saving data"); setTimeout(() => { if(this.saveStatus === 'error') this.saveStatus = 'saved';}, 3000); }
        }, 500);
    },

    addToPendingSync(weekId, data) { this.pendingSync = this.pendingSync.filter(i=>i.weekId!==weekId||i.operation==='delete'); this.pendingSync.push({weekId,data,operation:'save',timestamp:new Date().toISOString()}); localStorage.setItem('planner_pending_sync',JSON.stringify(this.pendingSync)); },
    async syncPendingData() { if(!this.isOnline||this.pendingSync.length===0)return;const iTS=[...this.pendingSync];this.pendingSync=[];localStorage.setItem('planner_pending_sync',JSON.stringify(this.pendingSync));for(const i of iTS){try{if(i.operation==='delete')await this.deleteFromPocketbase(i.weekId);else await this.saveToPocketbase(i.weekId,i.data)}catch(e){this.pendingSync.push(i);localStorage.setItem('planner_pending_sync',JSON.stringify(this.pendingSync));console.error("Sync err:",i.weekId,e)}}},
    async saveToPocketbase(weekId, data) { const r=await pb.collection('planners').getList(1,1,{filter:`week_id="${weekId}"`});if(r.items.length>0)await pb.collection('planners').update(r.items[0].id,data);else await pb.collection('planners').create(data);return true;},
    async deleteFromPocketbase(weekId) { try { const r = await pb.collection('planners').getList(1,1,{filter:`week_id="${weekId}"`}); if(r.items.length>0) await pb.collection('planners').delete(r.items[0].id); return true; } catch (e) { console.error("PB delete err:",e); throw e;} },
    async fetchSavedWeeks() { const weeks = []; const currentIsoWeek = this.getCurrentIsoWeek(); weeks.push({ iso_week: currentIsoWeek, dateRange: this.getWeekDateRange(this.parseISOWeek(currentIsoWeek)), isCurrent: true }); if (this.isOnline) { try { const records = await pb.collection('planners').getList(1, 100, { sort: '-week_id' }); records.items.forEach(item => { if (item.week_id === currentIsoWeek) return; weeks.push({ iso_week: item.week_id, dateRange: item.dateRange || this.getWeekDateRange(this.parseISOWeek(item.week_id)), isCurrent: false }); }); } catch (e) { console.error("Error fetching saved weeks from Pocketbase:", e); } } for (let i = 0; i < localStorage.length; i++) { const key = localStorage.key(i); if (key.startsWith('planner_') && !key.includes('pending_sync')) { const isoWeek = key.replace('planner_', ''); if (weeks.some(w => w.iso_week === isoWeek)) continue; try { const data = JSON.parse(localStorage.getItem(key)); weeks.push({ iso_week: isoWeek, dateRange: data.dateRange || this.getWeekDateRange(this.parseISOWeek(isoWeek)), isCurrent: isoWeek === currentIsoWeek }); } catch (e) { /* Skip invalid data */ } } } this.savedWeeks = weeks.sort((a, b) => (a.isCurrent ? -1 : b.isCurrent ? 1 : b.iso_week.localeCompare(a.iso_week))); },
    confirmLoadWeek(isoWeek) { this.loadWeek(isoWeek); }, // Simplified from original, rely on loadWeek's internal check
    confirmDeleteWeek(isoWeek) { if (confirm(`Are you sure you want to delete the schedule for ${isoWeek}?`)) this.deleteWeek(isoWeek); },
    async deleteWeek(isoWeek) { localStorage.removeItem(`planner_${isoWeek}`); if(this.isOnline){try{await this.deleteFromPocketbase(isoWeek)}catch(e){this.pendingSync.push({weekId:isoWeek,operation:'delete',timestamp:new Date().toISOString()});localStorage.setItem('planner_pending_sync',JSON.stringify(this.pendingSync))}}else{this.pendingSync=this.pendingSync.filter(i=>i.weekId!==isoWeek||i.operation==='delete');this.pendingSync.push({weekId:isoWeek,operation:'delete',timestamp:new Date().toISOString()});localStorage.setItem('planner_pending_sync',JSON.stringify(this.pendingSync))}this.savedWeeks=this.savedWeeks.filter(w=>w.iso_week!==isoWeek);if(this.currentWeek===isoWeek){const cIW=this.getCurrentIsoWeek();this.loadWeek(cIW)}else{this.hasUnsavedChanges=true;this.saveData();}},
    async selectCity(cityOption) { this.city=cityOption.name;this.showCitySelector=false;try{if(cityOption.lat===null&&cityOption.lon===null)await this.getPrayerTimes();else await this.fetchPrayerTimes(cityOption.lat,cityOption.lon);this.hasUnsavedChanges=true;this.saveData()}catch(e){console.error("City sel err:",e);this.showErrorMessage("Failed to load prayer times.")}},
    async getPrayerTimes() { try { const pos = await new Promise((res,rej)=>navigator.geolocation.getCurrentPosition(res,rej,{timeout:5000,maximumAge:60000}));const{latitude,longitude}=pos.coords;try{const r=await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10`);if(r.ok){const d=await r.json();if(d.address)this.city=d.address.city||d.address.town||d.address.village||d.address.county||"Current Location"}}catch(e){this.city="Current Location"}await this.fetchPrayerTimes(latitude,longitude)}catch(e){console.warn("Geo err:",e);this.showErrorMessage("Could not get your location. Using London as default.");this.city="London";await this.fetchPrayerTimes(51.5074,-0.1278)}},
    async fetchPrayerTimes(lat, lon) { const t=new Date(),d=t.getDate(),m=t.getMonth()+1,y=t.getFullYear();try{const k=`prayer_times_${y}_${m}_${d}_${lat.toFixed(2)}_${lon.toFixed(2)}`,cD=localStorage.getItem(k);if(cD){this.setPrayerTimes(JSON.parse(cD));return}const r=await fetch(`https://api.aladhan.com/v1/calendar/${y}/${m}?latitude=${lat}&longitude=${lon}&method=2`);if(!r.ok)throw new Error(`Prayer API error: ${r.status}`);const dT=await r.json();if(dT.code===200&&dT.data&&dT.data[d-1]){const timings=dT.data[d-1].timings;localStorage.setItem(k,JSON.stringify(timings));this.setPrayerTimes(timings)}else throw new Error("Invalid prayer time data")}catch(e){console.error("Error fetching prayer times:",e);this.setPrayerTimes({Fajr:"05:30",Dhuhr:"12:30",Asr:"15:45",Maghrib:"18:30",Isha:"20:00"})}}, // Default fallback
    setPrayerTimes(timings) { if(!this.times[0].value||!this.times[1].value||isInitializing){this.times[0].value=this.calculateQiyamTime(timings.Fajr);this.times[1].value=this.formatTime(timings.Fajr);this.times[2].value=this.formatTime(timings.Dhuhr);this.times[3].value=this.formatTime(timings.Asr);this.times[4].value=this.formatTime(timings.Maghrib);this.times[5].value=this.formatTime(timings.Isha);if(!isInitializing){this.hasUnsavedChanges=true;this.saveData()}}},
    formatTime(ts) { if(!ts)return"";const t=ts.split(" ")[0],[h,m]=t.split(":");let hr=parseInt(h);if(isNaN(hr))return"";const ap=hr>=12?"PM":"AM";hr=hr%12;hr=hr?hr:12;return`${hr}:${m}${ap}`},
    calculateQiyamTime(fajr) { if(!fajr)return"";const p=fajr.split(" ")[0].split(":");if(p.length<2)return"";const fH=parseInt(p[0]),fM=parseInt(p[1]);if(isNaN(fH)||isNaN(fM))return"";let qH=fH-1;if(qH<0)qH+=24;const ap=qH>=12?"PM":"AM",hr=qH%12||12;return`${hr}:${fM.toString().padStart(2,'0')}${ap}`},
    toggleTaskCompletion(task) { task.completed = task.completed === '✓' ? '' : '✓'; this.hasUnsavedChanges = true; this.saveData(); },
  };
}
