function plannerApp() {
  const pb = new PocketBase('/');
  pb.autoCancellation(false);
  let isInitializing = true;
  let lastSavedState = null;

  const getDefaultUiConfig = () => ({
    mainTableHeaders: ['TIME', 'DAY', 'ACTIVITY', 'SCR', 'MAX', '🔥'],
    dayHeaders: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'],
    maxHeaders: Array(7).fill('MAX'),
    taskHeaders: ['№', '🔥', '🏷️', '✏️ Task/Event/Note', '📅', '✓'],
    sectionTitles: {
      tasks: 'TASKS & NOTES',
      workout: 'WORKOUT PLAN',
      meals: 'MEAL PREP',
      grocery: 'GROCERY LIST',
      measurements: 'BODY MEASUREMENTS',
      financials: 'MONTH/1ST: FINANCIAL'
    }
  });

  return {
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
    plannerTitle: 'Weekly Planner',
    uiConfig: getDefaultUiConfig(),
    times: [
      { label: 'Q', value: '' }, { label: 'F', value: '' }, { label: 'D', value: '' },
      { label: 'A', value: '' }, { label: 'M', value: '' }, { label: 'I', value: '' }
    ],
    cityOptions: [
      { name: 'London', lat: 51.5074, lon: -0.1278 }, { name: 'Cairo', lat: 30.0444, lon: 31.2357 },
      { name: 'Cape Town', lat: -33.9249, lon: 18.4241 }, { name: 'Amsterdam', lat: 52.3676, lon: 4.9041 },
      { name: 'Current Location', lat: null, lon: null }
    ],
    savedWeeks: [],
    schedule: [
      {
        name: 'QIYAM',
        activities: [
          {
            name: 'DAILY: Wakeup early',
            days: { mon: { value: '', max: 1 }, tue: { value: '', max: 1 }, wed: { value: '', max: 1 }, thu: { value: '', max: 1 }, fri: { value: '', max: 1 }, sat: { value: '', max: 1 }, sun: { value: '', max: 1 } },
            score: 0, maxScore: 7, streaks: { mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0, current: 0, longest: 0 }
          },
          {
            name: 'DAILY: Qiyam/Tahajjud',
            days: { mon: { value: '', max: 1 }, tue: { value: '', max: 1 }, wed: { value: '', max: 1 }, thu: { value: '', max: 1 }, fri: { value: '', max: 1 }, sat: { value: '', max: 1 }, sun: { value: '', max: 1 } },
            score: 0, maxScore: 7, streaks: { mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0, current: 0, longest: 0 }
          },
          {
            name: 'DAILY: Nutty Pudding',
            days: { mon: { value: '', max: 1 }, tue: { value: '', max: 1 }, wed: { value: '', max: 1 }, thu: { value: '', max: 1 }, fri: { value: '', max: 1 }, sat: { value: '', max: 1 }, sun: { value: '', max: 1 } },
            score: 0, maxScore: 7, streaks: { mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0, current: 0, longest: 0 }
          }
        ]
      },
      {
        name: 'FAJR',
        activities: [
          {
            name: 'DAILY: Fajr prayer',
            days: { mon: { value: '', max: 1 }, tue: { value: '', max: 1 }, wed: { value: '', max: 1 }, thu: { value: '', max: 1 }, fri: { value: '', max: 1 }, sat: { value: '', max: 1 }, sun: { value: '', max: 1 } },
            score: 0, maxScore: 7, streaks: { mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0, current: 0, longest: 0 }
          },
          {
            name: 'DAILY: Quran - 1 Juz',
            days: { mon: { value: '', max: 1 }, tue: { value: '', max: 1 }, wed: { value: '', max: 1 }, thu: { value: '', max: 1 }, fri: { value: '', max: 1 }, sat: { value: '', max: 1 }, sun: { value: '', max: 1 } },
            score: 0, maxScore: 7, streaks: { mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0, current: 0, longest: 0 }
          },
          {
            name: 'DAILY: 5min Cold Shower',
            days: { mon: { value: '', max: 1 }, tue: { value: '', max: 1 }, wed: { value: '', max: 1 }, thu: { value: '', max: 1 }, fri: { value: '', max: 1 }, sat: { value: '', max: 1 }, sun: { value: '', max: 1 } },
            score: 0, maxScore: 7, streaks: { mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0, current: 0, longest: 0 }
          }
        ]
      },
      {
        name: '7AM - 9AM',
        activities: [
          { name: 'MON/THU: COMMUTE', days: { mon: { value: '', max: 1 }, thu: { value: '', max: 1 } }, score: 0, maxScore: 2, streaks: { mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0, current: 0, longest: 0 } },
          { name: 'TUE/WED/FRI: Reading/Study (book/course/skill)', days: { tue: { value: '', max: 1 }, wed: { value: '', max: 1 }, fri: { value: '', max: 1 } }, score: 0, maxScore: 3, streaks: { mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0, current: 0, longest: 0 } },
          { name: 'SAT: Errands, Grocery shopping, Meal prep', days: { sat: { value: '', max: 3 } }, score: 0, maxScore: 3, streaks: { mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0, current: 0, longest: 0 } },
          { name: 'SUN: House cleaning, laundry', days: { sun: { value: '', max: 2 } }, score: 0, maxScore: 2, streaks: { mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0, current: 0, longest: 0 } }
        ]
      },
      {
        name: '9AM - 5PM',
        activities: [
          { name: 'MON - FRI: Work', days: { mon: { value: '', max: 1 }, tue: { value: '', max: 1 }, wed: { value: '', max: 1 }, thu: { value: '', max: 1 }, fri: { value: '', max: 1 } }, score: 0, maxScore: 5, streaks: { mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0, current: 0, longest: 0 } },
          { name: 'DAILY: ZeroInbox (E1, E2, E3, E4, LI, Slack)', days: { mon: { value: '', max: 6 }, tue: { value: '', max: 6 }, wed: { value: '', max: 6 }, thu: { value: '', max: 6 }, fri: { value: '', max: 6 } }, score: 0, maxScore: 30, streaks: { mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0, current: 0, longest: 0 } },
          { name: 'SAT/SUN: Nature time / Outdoor Activity / Adventure', days: { sat: { value: '', max: 1 }, sun: { value: '', max: 1 } }, score: 0, maxScore: 2, streaks: { mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0, current: 0, longest: 0 } }
        ]
      },
      {
        name: 'DHUHR',
        activities: [
          { name: 'DAILY: Dhuhr prayer', days: { mon: { value: '', max: 1 }, tue: { value: '', max: 1 }, wed: { value: '', max: 1 }, thu: { value: '', max: 1 }, fri: { value: '', max: 1 }, sat: { value: '', max: 1 }, sun: { value: '', max: 1 } }, score: 0, maxScore: 7, streaks: { mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0, current: 0, longest: 0 } },
          { name: 'TUE/WED/FRI: Sun walk (30-45 minutes)', days: { tue: { value: '', max: 1 }, wed: { value: '', max: 1 }, fri: { value: '', max: 1 } }, score: 0, maxScore: 3, streaks: { mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0, current: 0, longest: 0 } },
          { name: 'FRI: £10 Sadaqa', days: { fri: { value: '', max: 1 } }, score: 0, maxScore: 1, streaks: { mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0, current: 0, longest: 0 } }
        ]
      },
      {
        name: 'ASR',
        activities: [
          { name: 'DAILY: Asr prayer', days: { mon: { value: '', max: 1 }, tue: { value: '', max: 1 }, wed: { value: '', max: 1 }, thu: { value: '', max: 1 }, fri: { value: '', max: 1 }, sat: { value: '', max: 1 }, sun: { value: '', max: 1 } }, score: 0, maxScore: 7, streaks: { mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0, current: 0, longest: 0 } }
        ]
      },
      {
        name: '5PM - 6:30PM',
        activities: [
          { name: 'MON/THU: COMMUTE', days: { mon: { value: '', max: 1 }, thu: { value: '', max: 1 } }, score: 0, maxScore: 2, streaks: { mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0, current: 0, longest: 0 } },
          { name: 'TUE/WED/FRI: Workout', days: { tue: { value: '', max: 1 }, wed: { value: '', max: 1 }, fri: { value: '', max: 1 } }, score: 0, maxScore: 3, streaks: { mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0, current: 0, longest: 0 } },
          { name: 'TUE/WED/FRI: Third Meal', days: { tue: { value: '', max: 1 }, wed: { value: '', max: 1 }, fri: { value: '', max: 1 } }, score: 0, maxScore: 3, streaks: { mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0, current: 0, longest: 0 } }
        ]
      },
      {
        name: '6:30PM - ISHA',
        activities: [
          { name: 'MON/TUE/WED/THU: Personal', days: { mon: { value: '', max: 1 }, tue: { value: '', max: 1 }, wed: { value: '', max: 1 }, thu: { value: '', max: 1 } }, score: 0, maxScore: 4, streaks: { mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0, current: 0, longest: 0 } },
          { name: 'DAILY: Family/Friends/Date calls(M, WA, Phone)', days: { mon: { value: '', max: 3 }, tue: { value: '', max: 3 }, wed: { value: '', max: 3 }, thu: { value: '', max: 3 } }, score: 0, maxScore: 12, streaks: { mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0, current: 0, longest: 0 } },
          { name: 'FRI/SAT/SUN: Family/Friends/Date visits/outings/activities', days: { fri: { value: '', max: 3 }, sat: { value: '', max: 3 }, sun: { value: '', max: 3 } }, score: 0, maxScore: 9, streaks: { mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0, current: 0, longest: 0 } }
        ]
      },
      {
        name: 'MAGHRIB',
        activities: [
          { name: 'DAILY: Maghrib prayer', days: { mon: { value: '', max: 1 }, tue: { value: '', max: 1 }, wed: { value: '', max: 1 }, thu: { value: '', max: 1 }, fri: { value: '', max: 1 }, sat: { value: '', max: 1 }, sun: { value: '', max: 1 } }, score: 0, maxScore: 7, streaks: { mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0, current: 0, longest: 0 } },
          { name: 'DAILY: Super Veggie', days: { mon: { value: '', max: 1 }, tue: { value: '', max: 1 }, wed: { value: '', max: 1 }, thu: { value: '', max: 1 }, fri: { value: '', max: 1 }, sat: { value: '', max: 1 }, sun: { value: '', max: 1 } }, score: 0, maxScore: 7, streaks: { mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0, current: 0, longest: 0 } }
        ]
      },
      {
        name: 'ISHA',
        activities: [
          { name: 'DAILY: Isha prayer', days: { mon: { value: '', max: 1 }, tue: { value: '', max: 1 }, wed: { value: '', max: 1 }, thu: { value: '', max: 1 }, fri: { value: '', max: 1 }, sat: { value: '', max: 1 }, sun: { value: '', max: 1 } }, score: 0, maxScore: 7, streaks: { mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0, current: 0, longest: 0 } },
          { name: 'DAILY: Sleep early', days: { mon: { value: '', max: 1 }, tue: { value: '', max: 1 }, wed: { value: '', max: 1 }, thu: { value: '', max: 1 }, fri: { value: '', max: 1 }, sat: { value: '', max: 1 }, sun: { value: '', max: 1 } }, score: 0, maxScore: 7, streaks: { mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0, current: 0, longest: 0 } }
        ]
      },
      {
        name: 'ALLDAY',
        activities: [
          { name: 'DAILY: No Doomscrolling; (FB, YTB, LKDN, & IG)', days: { mon: { value: '', max: 4 }, tue: { value: '', max: 4 }, wed: { value: '', max: 4 }, thu: { value: '', max: 4 }, fri: { value: '', max: 4 }, sat: { value: '', max: 4 }, sun: { value: '', max: 4 } }, score: 0, maxScore: 28, streaks: { mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0, current: 0, longest: 0 } },
          { name: 'DAILY: No Fap; (P, & M)', days: { mon: { value: '', max: 2 }, tue: { value: '', max: 2 }, wed: { value: '', max: 2 }, thu: { value: '', max: 2 }, fri: { value: '', max: 2 }, sat: { value: '', max: 2 }, sun: { value: '', max: 2 } }, score: 0, maxScore: 14, streaks: { mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0, current: 0, longest: 0 } },
          { name: 'DAILY: No Processed; (Sugar, RefinedFlour, SeedOils, Soda, FastFood)', days: { mon: { value: '', max: 5 }, tue: { value: '', max: 5 }, wed: { value: '', max: 5 }, thu: { value: '', max: 5 }, fri: { value: '', max: 5 }, sat: { value: '', max: 5 }, sun: { value: '', max: 5 } }, score: 0, maxScore: 35, streaks: { mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0, current: 0, longest: 0 } },
          { name: 'MON/THU: Fasting', days: { mon: { value: '', max: 1 }, thu: { value: '', max: 1 } }, score: 0, maxScore: 2, streaks: { mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0, current: 0, longest: 0 } },
          { name: 'DAILY: Expense Tracker <25', days: { mon: { value: '', max: 0 }, tue: { value: '', max: 0 }, wed: { value: '', max: 0 }, thu: { value: '', max: 0 }, fri: { value: '', max: 0 }, sat: { value: '', max: 0 }, sun: { value: '', max: 0 } }, score: 0, maxScore: 0, streaks: { mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0, current: 0, longest: 0 } }
        ]
      },
      {
        name: 'TOTAL',
        activities: [
          { name: 'DAILY POINTS', days: { mon: { value: '0', max: 0 }, tue: { value: '0', max: 0 }, wed: { value: '0', max: 0 }, thu: { value: '0', max: 0 }, fri: { value: '0', max: 0 }, sat: { value: '0', max: 0 }, sun: { value: '0', max: 0 } }, score: 0, maxScore: 0, streaks: { mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0, current: 0, longest: 0 } }
        ]
      }
    ],
    tasks: Array(20).fill().map(() => ({ num: '', priority: '', tag: '', description: '', date: '', completed: '' })),
    workoutPlan: [
      {
        name: 'TUESDAY',
        exercises: [
          { prefix: '• ', name: 'Incline Dumbbell Press', weight: '', sets: '', reps: '', defaultWeight: '30', defaultSets: '3', defaultReps: '12' },
          { prefix: '• ', name: 'Barbell Squats', weight: '', sets: '', reps: '', defaultWeight: '80', defaultSets: '3', defaultReps: '8' },
          { prefix: '• ', name: 'DB Chest-Supported Row', weight: '', sets: '', reps: '', defaultWeight: '25', defaultSets: '3', defaultReps: '12' },
          { prefix: '• ', name: 'Leg Curls', weight: '', sets: '', reps: '', defaultWeight: '40', defaultSets: '3', defaultReps: '15' },
          { prefix: '• SS: ', name: 'Incline DB Curls', weight: '', sets: '', reps: '', defaultWeight: '15', defaultSets: '3', defaultReps: '12' },
          { prefix: '• SS: ', name: 'Tricep Extensions', weight: '', sets: '', reps: '', defaultWeight: '20', defaultSets: '3', defaultReps: '12' }
        ]
      },
      {
        name: 'WEDNESDAY',
        exercises: [
          { prefix: '• ', name: 'Barbell Bench Press', weight: '', sets: '', reps: '', defaultWeight: '70', defaultSets: '3', defaultReps: '6' },
          { prefix: '• ', name: 'Romanian Deadlift', weight: '', sets: '', reps: '', defaultWeight: '90', defaultSets: '3', defaultReps: '8' },
          { prefix: '• ', name: 'Lat Pulldown', weight: '', sets: '', reps: '', defaultWeight: '60', defaultSets: '3', defaultReps: '12' },
          { prefix: '• ', name: 'Walking Lunges', weight: '', sets: '', reps: '', defaultWeight: '20', defaultSets: '3', defaultReps: '10' },
          { prefix: '• SS: ', name: 'Cable Lateral Raises', weight: '', sets: '', reps: '', defaultWeight: '15', defaultSets: '3', defaultReps: '15' },
          { prefix: '• SS: ', name: 'Reverse Crunches', weight: '', sets: '', reps: '', defaultWeight: '0', defaultSets: '3', defaultReps: '15' }
        ]
      },
      {
        name: 'FRIDAY',
        exercises: [
          { prefix: '• ', name: 'Seated DB Shoulder Press', weight: '', sets: '', reps: '', defaultWeight: '20', defaultSets: '3', defaultReps: '12' },
          { prefix: '• ', name: 'Dumbbell Row', weight: '', sets: '', reps: '', defaultWeight: '25', defaultSets: '3', defaultReps: '12' },
          { prefix: '• ', name: 'Barbell Hip Thrust', weight: '', sets: '', reps: '', defaultWeight: '100', defaultSets: '3', defaultReps: '15' },
          { prefix: '• ', name: 'Leg Extensions', weight: '', sets: '', reps: '', defaultWeight: '50', defaultSets: '3', defaultReps: '15' },
          { prefix: '• ', name: 'Seated Chest Flyes', weight: '', sets: '', reps: '', defaultWeight: '15', defaultSets: '3', defaultReps: '15' },
          { prefix: '• SS: ', name: 'Standing Calf Raises', weight: '', sets: '', reps: '', defaultWeight: '30', defaultSets: '3', defaultReps: '15' },
          { prefix: '• SS: ', name: 'Reverse Cable Flyes', weight: '', sets: '', reps: '', defaultWeight: '20', defaultSets: '3', defaultReps: '15' }
        ]
      }
    ],
    meals: [
      { name: 'Nutty Pudding', ingredients: 'Berries ½c, Cherries 3, Pomegranate Juice 2oz, Macadamia nuts (raw) 45g, Walnuts (raw) 5g, Cocoa 1t, Brazil Nuts ¼, Milk 50-100ml, Chia Seeds 2T, Flax (ground, refr) 1t, Lecithin 1t, Ceylon Cinnamon ½t' },
      { name: 'Super Veggie', ingredients: 'Broccoli 250g, Cauliflower 150g, Mushrooms 50g, Garlic 1 clove, Ginger 3g, Cumin 1T, Black Lentils 45g, Hemp Seeds 1T, Apple Cider Vinegar 1T' },
      { name: 'Third Meal', ingredients: 'Sweet Potato 350-400g, Protein 100-150g, Grape Tomatoes 12, Avocado ½, Radishes 4, Cilantro ¼c, Lemon 1, Jalapeño (lg) 1, Chili Powder 1t' }
    ],
    groceryBudget: '',
    groceryList: [
      { name: 'Produce', items: 'Broccoli 1.75kg, Cauliflower 1.05kg, Mushrooms 350g, Garlic 1 bulb, Ginger 1pc, Sweet Potato 2.8kg, Grape Tomatoes 84, Avocados (ripe) 4, Radishes 28, Cilantro 2-3 bunch' },
      { name: 'Fruits & Protein', items: 'Lemons 7, Jalapeños (lg) 7, Berries 3.5c, Cherries 21, Black Lentils 315g, Protein 1.05kg, Milk (fortified) 1L' }
    ],
    bodyMeasurements: [
      { name: 'Weight', value: '', placeholder: '75kg' }, { name: 'Chest', value: '', placeholder: '42in' },
      { name: 'Waist', value: '', placeholder: '34in' }, { name: 'Hips', value: '', placeholder: '40in' },
      { name: 'Arms', value: '', placeholder: '15in' }, { name: 'Thighs', value: '', placeholder: '24in' }
    ],
    financials: [
      { name: 'Rent', value: '', placeholder: '850', account: 'Cash' },
      { name: 'Allowance', value: '', placeholder: '850', account: 'Revolut' },
      { name: 'Savings', value: '', placeholder: '3,800', account: 'HSBCUK' }
    ],

    async init() {
      window.addEventListener('online', () => { this.isOnline = true; this.syncPendingData(); });
      window.addEventListener('offline', () => this.isOnline = false);
      document.addEventListener('click', e => {
        if (!e.target.closest('.dropdown') && !e.target.closest('.clickable')) {
          this.showCitySelector = this.showWeekSelector = false;
        }
      });
      this.pendingSync = JSON.parse(localStorage.getItem('planner_pending_sync') || '[]');
      this.currentWeek = this.getCurrentIsoWeek();
      this.dateRange = this.getWeekDateRange(this.parseISOWeek(this.currentWeek));
      this.schedule.forEach(s => s.activities.forEach(a => {
        if (!a.streaks) a.streaks = { mon:0, tue:0, wed:0, thu:0, fri:0, sat:0, sun:0, current:0, longest:0 };
      }));
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
      input.type = 'text';
      input.value = defaultValue;
      input.className = isTextarea ? 'inline-edit-textarea' : 'inline-edit-input';
      if (isTextarea) input.rows = 3;

      element.innerHTML = '';
      element.appendChild(input);
      input.focus();
      input.select();

      const saveEdit = () => {
        const newValue = input.value;
        
        let sIdxMapped = -1;
        if (type === 'sectionName') {
            sIdxMapped = this.schedule.length - 1 - index;
        } else if (typeof index === 'object' && index !== null && typeof index.sIdx === 'number') {
            sIdxMapped = this.schedule.length - 1 - index.sIdx;
        }

        switch (type) {
          case 'plannerTitle': this.plannerTitle = newValue; break;
          case 'timeLabel': if (this.times[index]) this.times[index].label = newValue; break;
          case 'sectionName': if (sIdxMapped !== -1 && this.schedule[sIdxMapped]) this.schedule[sIdxMapped].name = newValue; break;
          case 'activityPrefix':
            if (sIdxMapped !== -1 && this.schedule[sIdxMapped]?.activities[index.aIdx]) {
              const activity = this.schedule[sIdxMapped].activities[index.aIdx];
              const parts = activity.name.split(':');
              activity.name = newValue + (parts.length > 1 ? ':' + parts.slice(1).join(':').trimStart() : '');
            }
            break;
          case 'activityName':
            if (sIdxMapped !== -1 && this.schedule[sIdxMapped]?.activities[index.aIdx]) {
              const activity = this.schedule[sIdxMapped].activities[index.aIdx];
              const parts = activity.name.split(':');
              activity.name = (parts.length > 1 ? parts[0].trim() + ': ' : '') + newValue;
            }
            break;
          case 'maxValue':
            if (sIdxMapped !== -1 && this.schedule[sIdxMapped]?.activities[index.aIdx]?.days[index.day]) {
              this.schedule[sIdxMapped].activities[index.aIdx].days[index.day].max = parseInt(newValue) || 0;
            }
            break;
          case 'maxScore':
            if (sIdxMapped !== -1 && this.schedule[sIdxMapped]?.activities[index.aIdx]) {
              this.schedule[sIdxMapped].activities[index.aIdx].maxScore = parseInt(newValue) || 0;
            }
            break;
          case 'sectionTitle': if (this.uiConfig.sectionTitles[index]) this.uiConfig.sectionTitles[index] = newValue; break;
          case 'mainTableHeader': if (this.uiConfig.mainTableHeaders[index] !== undefined) this.uiConfig.mainTableHeaders[index] = newValue; break;
          case 'dayHeader': if (this.uiConfig.dayHeaders[index] !== undefined) this.uiConfig.dayHeaders[index] = newValue; break;
          case 'maxHeader': if (this.uiConfig.maxHeaders[index] !== undefined) this.uiConfig.maxHeaders[index] = newValue; break;
          case 'taskHeader': if (this.uiConfig.taskHeaders[index] !== undefined) this.uiConfig.taskHeaders[index] = newValue; break;
          case 'workoutDayName': if (this.workoutPlan[index]) this.workoutPlan[index].name = newValue; break;
          case 'exercisePrefix':
            if (this.workoutPlan[index.dayIdx]?.exercises[index.exIdx]) {
              this.workoutPlan[index.dayIdx].exercises[index.exIdx].prefix = newValue;
            }
            break;
          case 'exerciseName':
            if (this.workoutPlan[index.dayIdx]?.exercises[index.exIdx]) {
              this.workoutPlan[index.dayIdx].exercises[index.exIdx].name = newValue;
            }
            break;
          case 'mealName': if (this.meals[index]) this.meals[index].name = newValue; break;
          case 'mealIngredients': if (this.meals[index]) this.meals[index].ingredients = newValue; break;
          case 'groceryCategoryName': if (this.groceryList[index]) this.groceryList[index].name = newValue; break;
          case 'groceryCategoryItems': if (this.groceryList[index]) this.groceryList[index].items = newValue; break;
          case 'measurementName': if (this.bodyMeasurements[index]) this.bodyMeasurements[index].name = newValue; break;
          case 'financialName': if (this.financials[index]) this.financials[index].name = newValue; break;
          case 'financialAccount': if (this.financials[index]) this.financials[index].account = newValue; break;
        }
        
        element.removeChild(input); // removeChild might fail if input isn't child, but blur could fire twice
        // Check if the input is still a child before removing
        if (input.parentNode === element) {
            element.removeChild(input);
        }
        element.innerText = newValue || originalText; 
        this.saveData();
      };

      const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !isTextarea) {
          saveEdit();
          e.preventDefault(); 
        } else if (e.key === 'Escape') {
          if (input.parentNode === element) {
            element.removeChild(input);
          }
          element.innerText = originalText;
          // Remove event listeners manually since blur might not fire if element is removed
          input.removeEventListener('blur', saveEdit);
          input.removeEventListener('keydown', handleKeyDown);
        }
      };
      
      // Ensure event listener is removed to prevent multiple saves on rapid blurs or enter/escape.
      const uniqueSaveEdit = () => {
        input.removeEventListener('blur', uniqueSaveEdit);
        input.removeEventListener('keydown', handleKeyDown);
        saveEdit();
      };
      const uniqueHandleKeyDown = (e) => {
        if (e.key === 'Enter' && !isTextarea || e.key === 'Escape') {
            input.removeEventListener('blur', uniqueSaveEdit);
            input.removeEventListener('keydown', uniqueHandleKeyDown);
            handleKeyDown(e);
        }
      };

      input.addEventListener('blur', uniqueSaveEdit);
      input.addEventListener('keydown', uniqueHandleKeyDown);
    },

    toggleTaskCompletion(task) {
      task.completed = task.completed === '✓' ? '☐' : '✓';
      this.saveData();
    },
    showErrorMessage(message) {
      this.notificationMessage = message;
      this.showNotification = true;
      clearTimeout(this.notificationTimeout);
      this.notificationTimeout = setTimeout(() => this.showNotification = false, 5000);
    },
    validateValue(value, isNumber = false, min = null, max = null) {
      const sValue = String(value || '');
      if (sValue.trim() === '') return '';
      if (isNumber) {
        const numValue = parseFloat(sValue);
        if (isNaN(numValue)) return '';
        if (min !== null && numValue < min) return min.toString();
        if (max !== null && numValue > max) return max.toString();
        return numValue.toString();
      }
      return sValue;
    },
    getCurrentIsoWeek() {
      const now = new Date();
      const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
      d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
      const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
      const weekNum = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
      return `${d.getUTCFullYear()}-W${weekNum.toString().padStart(2, '0')}`;
    },
    parseISOWeek(isoWeekString) {
      if (!/^\d{4}-W(0[1-9]|[1-4][0-9]|5[0-3])$/.test(isoWeekString)) return new Date();
      const [year, weekPart] = isoWeekString.split('-');
      const week = parseInt(weekPart.substring(1));
      const simple = new Date(Date.UTC(parseInt(year), 0, 1 + (week - 1) * 7));
      const dayOfWeek = simple.getUTCDay() || 7;
      simple.setUTCDate(simple.getUTCDate() - dayOfWeek + 1);
      return simple;
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
    formatShortDate(index) {
      const now = new Date();
      now.setDate(now.getDate() + index);
      return `${(now.getMonth() + 1)}/${now.getDate()}`;
    },
    toggleCitySelector(event) {
      this.showWeekSelector = false;
      const rect = event.target.getBoundingClientRect();
      this.dropdownPosition = { top: rect.bottom + window.scrollY, left: rect.left + window.scrollX };
      this.showCitySelector = !this.showCitySelector;
    },
    toggleWeekSelector(event) {
      this.showCitySelector = false;
      const rect = event.target.getBoundingClientRect();
      this.dropdownPosition = { top: rect.bottom + window.scrollY, left: rect.left + window.scrollX };
      this.showWeekSelector = !this.showWeekSelector;
      if (this.showWeekSelector) this.fetchSavedWeeks();
    },
    async loadWeek(isoWeek, isInitLoad = false) {
      if (!/^\d{4}-W(0[1-9]|[1-4][0-9]|5[0-3])$/.test(isoWeek)) {
        this.showErrorMessage("Invalid week format"); return;
      }
      this.showWeekSelector = false; this.currentWeek = isoWeek;
      this.dateRange = this.getWeekDateRange(this.parseISOWeek(isoWeek));
      let record = null;
      if (this.isOnline) {
        try {
          const result = await pb.collection('planners').getFirstListItem(`week_id="${isoWeek}"`);
          if (result) record = result;
        } catch (error) { if (error.status !== 404) console.error("Pocketbase load error:", error); }
      }
      if (!record) {
        const localData = localStorage.getItem(`planner_${isoWeek}`);
        if (localData) try { record = JSON.parse(localData); } catch(e) { console.error("Error parsing local data", e); record = {};}
      }
      this.populateFields(record || {});
      this.calculateScores();
      if (isInitLoad && (!this.times[0].value || !this.times[1].value)) {
        await this.getPrayerTimes();
      }
      if (isInitLoad) isInitializing = false;
    },
    populateFields(data) {
      this.plannerTitle = data.plannerTitle || 'Weekly Planner';
      const defaultConf = getDefaultUiConfig();
      this.uiConfig = {
          mainTableHeaders: data.uiConfig?.mainTableHeaders || defaultConf.mainTableHeaders,
          dayHeaders: data.uiConfig?.dayHeaders || defaultConf.dayHeaders,
          maxHeaders: data.uiConfig?.maxHeaders || defaultConf.maxHeaders,
          taskHeaders: data.uiConfig?.taskHeaders || defaultConf.taskHeaders,
          sectionTitles: { ...defaultConf.sectionTitles, ...(data.uiConfig?.sectionTitles || {}) }
      };

      this.times.forEach((t, i) => t.value = data.times?.[i]?.value || '');
      if (data.times) {
        this.times.forEach((t, i) => {
            t.label = data.times[i]?.label || t.label; // Persist labels if saved
        });
      }
      
      const defaultSchedule = new plannerApp().schedule; // Get a fresh default for comparison
      this.schedule.forEach((section, sIdx) => {
        const savedSection = data.schedule?.[sIdx];
        section.name = savedSection?.name || defaultSchedule[sIdx]?.name || section.name;
        section.activities.forEach((activity, aIdx) => {
          const savedActivity = savedSection?.activities?.[aIdx];
          const defaultActivity = defaultSchedule[sIdx]?.activities?.[aIdx];
          activity.name = savedActivity?.name || defaultActivity?.name || activity.name;
          activity.maxScore = typeof savedActivity?.maxScore === 'number' ? savedActivity.maxScore : (defaultActivity?.maxScore || activity.maxScore);
          activity.streaks = savedActivity?.streaks ? { ...savedActivity.streaks } : (defaultActivity?.streaks ? {...defaultActivity.streaks} : { mon:0, tue:0, wed:0, thu:0, fri:0, sat:0, sun:0, current:0, longest:0 });
          
          Object.keys(activity.days).forEach(dayKey => {
            const savedDayData = savedActivity?.days?.[dayKey];
            const defaultDayData = defaultActivity?.days?.[dayKey];
            activity.days[dayKey].value = this.validateValue(savedDayData?.value, true, 0, savedDayData?.max < 10 ? 9 : 99);
            activity.days[dayKey].max = typeof savedDayData?.max === 'number' ? savedDayData.max : (defaultDayData?.max || 1);
          });
        });
      });

      this.tasks.forEach((task, i) => {
        const savedTask = data.tasks?.[i];
        task.num = this.validateValue(savedTask?.num);
        task.priority = this.validateValue(savedTask?.priority);
        task.tag = this.validateValue(savedTask?.tag);
        task.description = this.validateValue(savedTask?.description);
        task.date = this.validateValue(savedTask?.date);
        task.completed = this.validateValue(savedTask?.completed);
      });

      const defaultWorkoutPlan = new plannerApp().workoutPlan;
      this.workoutPlan.forEach((day, dayIdx) => {
        const savedDay = data.workoutPlan?.[dayIdx];
        const defaultDay = defaultWorkoutPlan[dayIdx];
        day.name = savedDay?.name || defaultDay?.name || day.name;
        day.exercises.forEach((ex, exIdx) => {
          const savedEx = savedDay?.exercises?.[exIdx];
          const defaultEx = defaultDay?.exercises?.[exIdx];
          ex.prefix = savedEx?.prefix || defaultEx?.prefix || ex.prefix;
          ex.name = savedEx?.name || defaultEx?.name || ex.name;
          ex.weight = this.validateValue(savedEx?.weight, true, 0, 999);
          ex.sets = this.validateValue(savedEx?.sets, true, 0, 99);
          ex.reps = this.validateValue(savedEx?.reps, true, 0, 99);
          ex.defaultWeight = savedEx?.defaultWeight || defaultEx?.defaultWeight || ex.defaultWeight;
          ex.defaultSets = savedEx?.defaultSets || defaultEx?.defaultSets || ex.defaultSets;
          ex.defaultReps = savedEx?.defaultReps || defaultEx?.defaultReps || ex.defaultReps;
        });
      });
      
      const defaultMeals = new plannerApp().meals;
      this.meals.forEach((meal, i) => {
        const savedMeal = data.meals?.[i];
        const defaultMeal = defaultMeals[i];
        meal.name = savedMeal?.name || defaultMeal?.name || meal.name;
        meal.ingredients = savedMeal?.ingredients || defaultMeal?.ingredients || meal.ingredients;
      });

      this.groceryBudget = this.validateValue(data.groceryBudget);
      const defaultGroceryList = new plannerApp().groceryList;
      this.groceryList.forEach((cat, i) => {
        const savedCat = data.groceryList?.[i];
        const defaultCat = defaultGroceryList[i];
        cat.name = savedCat?.name || defaultCat?.name || cat.name;
        cat.items = savedCat?.items || defaultCat?.items || cat.items;
      });

      const defaultBodyMeasurements = new plannerApp().bodyMeasurements;
      this.bodyMeasurements.forEach((m, i) => {
        const savedM = data.bodyMeasurements?.[i];
        const defaultM = defaultBodyMeasurements[i];
        m.name = savedM?.name || defaultM?.name || m.name;
        m.value = this.validateValue(savedM?.value);
        m.placeholder = savedM?.placeholder || defaultM?.placeholder || m.placeholder;
      });

      const defaultFinancials = new plannerApp().financials;
      this.financials.forEach((f, i) => {
        const savedF = data.financials?.[i];
        const defaultF = defaultFinancials[i];
        f.name = savedF?.name || defaultF?.name || f.name;
        f.value = this.validateValue(savedF?.value);
        f.account = savedF?.account || defaultF?.account || f.account;
        f.placeholder = savedF?.placeholder || defaultF?.placeholder || f.placeholder;
      });

      if (data.city) this.city = data.city;
      
      lastSavedState = JSON.stringify(this.getCurrentDataState());
    },
    getCurrentDataState() {
        return {
            plannerTitle: this.plannerTitle, uiConfig: this.uiConfig, times: this.times,
            schedule: this.schedule, tasks: this.tasks, workoutPlan: this.workoutPlan,
            meals: this.meals, groceryBudget: this.groceryBudget, groceryList: this.groceryList,
            bodyMeasurements: this.bodyMeasurements, financials: this.financials, city: this.city,
            dateRange: this.dateRange, week_id: this.currentWeek
        };
    },
    validateTextInput(event) {
      event.target.value = this.validateValue(event.target.value);
      this.saveData();
    },
    validateNumberInput(event) {
      const input = event.target;
      const min = input.hasAttribute('min') ? parseFloat(input.getAttribute('min')) : null;
      const max = input.hasAttribute('max') ? parseFloat(input.getAttribute('max')) : null;
      input.value = this.validateValue(input.value, true, min, max);
      this.calculateScores();
      this.saveData();
    },
    calculateScores() {
      const dailyTotals = { mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0 };
      const dayKeys = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
      this.schedule.forEach(section => {
        if (section.name === 'TOTAL') return;
        section.activities.forEach(activity => {
          let activityScore = 0;
          Object.entries(activity.days || {}).forEach(([day, dayData]) => {
            if (!dayData) return;
            const value = parseInt(dayData.value) || 0;
            if (value > 0 && (dayData.max || 0) > 0) {
              dailyTotals[day] = (dailyTotals[day] || 0) + value;
              activityScore += value;
            }
            dayData.value = value === 0 ? '' : value.toString();
          });
          activity.score = activityScore;

          if (!activity.streaks) activity.streaks = { mon:0, tue:0, wed:0, thu:0, fri:0, sat:0, sun:0, current:0, longest:0 };
          const todayIdx = this.currentDay === 0 ? 6 : this.currentDay - 1;
          
          let currentStreak = 0;
          for (let i = 0; i < 7; i++) {
            const dayToCheckIdx = (todayIdx - i + 7) % 7;
            const dayKey = dayKeys[dayToCheckIdx];
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
        let grandTotalScore = 0;
        let grandTotalMaxScore = 0;
        Object.entries(dailyTotals).forEach(([day, total]) => {
          if (totalActivity.days[day]) totalActivity.days[day].value = total.toString();
          grandTotalScore += total;
        });
        totalActivity.score = grandTotalScore;
        this.schedule.forEach(s => {
            if (s.name !== 'TOTAL') {
                s.activities.forEach(act => grandTotalMaxScore += (act.maxScore || 0));
            }
        });
        totalActivity.maxScore = grandTotalMaxScore;
      }
    },
    saveData() {
      if (isInitializing) return;
      if (this.saveTimeout) clearTimeout(this.saveTimeout);
      this.saveStatus = 'saving';
      this.saveTimeout = setTimeout(async () => {
        try {
          this.calculateScores();
          const plannerData = this.getCurrentDataState();
          localStorage.setItem(`planner_${this.currentWeek}`, JSON.stringify(plannerData));
          if (this.isOnline) {
            await this.saveToPocketbase(this.currentWeek, plannerData);
            this.pendingSync = this.pendingSync.filter(item => item.weekId !== this.currentWeek || item.operation === 'delete');
            localStorage.setItem('planner_pending_sync', JSON.stringify(this.pendingSync));
          } else {
            this.addToPendingSync(this.currentWeek, plannerData);
          }
          lastSavedState = JSON.stringify(plannerData);
          this.saveStatus = 'saved';
        } catch (error) {
          this.saveStatus = 'error'; this.showErrorMessage("Error saving data: " + error.message);
          setTimeout(() => { this.saveStatus = 'saved'; }, 3000);
        }
      }, 500);
    },
    hasSignificantChanges() {
        if (!lastSavedState) return true;
        const currentStateForCompare = { ...this.getCurrentDataState() };
        delete currentStateForCompare.dateRange; 
        delete currentStateForCompare.week_id;   

        const lastSavedStateForCompare = JSON.parse(lastSavedState);
        delete lastSavedStateForCompare.dateRange;
        delete lastSavedStateForCompare.week_id;

        return JSON.stringify(currentStateForCompare) !== JSON.stringify(lastSavedStateForCompare);
    },
    addToPendingSync(weekId, data, operation = 'save') {
      this.pendingSync = this.pendingSync.filter(item => !(item.weekId === weekId && item.operation === operation)); // Remove previous same op
      this.pendingSync.push({ weekId, data: data ? JSON.parse(JSON.stringify(data)) : null, operation, timestamp: new Date().toISOString() });
      localStorage.setItem('planner_pending_sync', JSON.stringify(this.pendingSync));
    },
    async syncPendingData() {
      if (!this.isOnline || this.pendingSync.length === 0) return;
      const itemsToSync = [...this.pendingSync];
      this.pendingSync = []; 
      //localStorage.setItem('planner_pending_sync', JSON.stringify(this.pendingSync)); // Clear local first, but risky if browser closes. Better to remove on success.

      for (const item of itemsToSync) {
        try {
          if (item.operation === 'delete') {
            await this.deleteFromPocketbase(item.weekId);
          } else {
            await this.saveToPocketbase(item.weekId, item.data);
          }
           // On success, remove from the locally persisted pendingSync if we didn't clear it upfront
           const currentPending = JSON.parse(localStorage.getItem('planner_pending_sync') || '[]');
           const updatedPending = currentPending.filter(i => i.timestamp !== item.timestamp); // Use timestamp for uniqueness
           localStorage.setItem('planner_pending_sync', JSON.stringify(updatedPending));

        } catch (error) { 
          // If sync fails, ensure it's still in or re-added to this.pendingSync if it was cleared
          // This part is tricky if we clear this.pendingSync upfront.
          // A robust way is to only remove from localStorage's pending_sync on successful sync of an item.
          // For now, if it failed, and we cleared `this.pendingSync`, we'll re-add it to `this.pendingSync`
          // which then gets saved to localStorage if another offline event happens or app closes.
          // This part needs careful thought for robustness.
          if (!this.pendingSync.find(i => i.timestamp === item.timestamp)) {
            this.pendingSync.push(item);
          }
          localStorage.setItem('planner_pending_sync', JSON.stringify(this.pendingSync)); // Ensure current state is saved
        }
      }
       // If this.pendingSync has items (due to errors), they are already re-added.
       // If all succeeded, this.pendingSync would be empty (if we didn't clear it upfront).
    },
    async saveToPocketbase(weekId, data) {
      try {
        const existing = await pb.collection('planners').getFirstListItem(`week_id="${weekId}"`).catch(e => { if(e.status === 404) return null; throw e;});
        if (existing) {
          await pb.collection('planners').update(existing.id, data);
        } else {
          await pb.collection('planners').create(data);
        }
      } catch (error) { throw error; }
    },
    async deleteFromPocketbase(weekId) {
      try {
        const existing = await pb.collection('planners').getFirstListItem(`week_id="${weekId}"`).catch(e => { if(e.status === 404) return null; throw e;});
        if (existing) await pb.collection('planners').delete(existing.id);
      } catch (error) { throw error; }
    },
    async fetchSavedWeeks() {
      const weeksData = new Map(); // Use Map to ensure unique iso_week entries, preferring PB > local > current
      const currentIsoWeek = this.getCurrentIsoWeek();

      const addUpdateWeek = (iso_week, dateRange, source, isCurrent) => {
          const existing = weeksData.get(iso_week);
          const newDateRange = dateRange || this.getWeekDateRange(this.parseISOWeek(iso_week));
          // Prioritize: PB > local > current. If new source is "better" or entry doesn't exist.
          if (!existing || (source === 'pocketbase' && existing.source !== 'pocketbase') || (source === 'local' && existing.source === 'current')) {
              weeksData.set(iso_week, { iso_week, dateRange: newDateRange, source, isCurrent });
          } else if (existing && !existing.dateRange && newDateRange) { // Update if existing lacks dateRange
              existing.dateRange = newDateRange;
          }
      };
      
      addUpdateWeek(currentIsoWeek, this.getWeekDateRange(this.parseISOWeek(currentIsoWeek)), 'current', true);

      if (this.isOnline) {
        try {
          const records = await pb.collection('planners').getFullList({ sort: '-week_id', fields: 'week_id,dateRange' });
          records.forEach(item => addUpdateWeek(item.week_id, item.dateRange, 'pocketbase', item.week_id === currentIsoWeek));
        } catch (e) { console.error("Error fetching saved weeks from Pocketbase:", e); }
      }
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('planner_') && !key.includes('pending_sync')) {
          const isoWeek = key.replace('planner_', '');
          try {
            const data = JSON.parse(localStorage.getItem(key));
            addUpdateWeek(isoWeek, data.dateRange, 'local', isoWeek === currentIsoWeek);
          } catch (e) { /* Skip invalid local data */ }
        }
      }
      this.savedWeeks = Array.from(weeksData.values()).sort((a, b) => {
        if (a.isCurrent && !b.isCurrent) return -1; 
        if (!a.isCurrent && b.isCurrent) return 1;
        return b.iso_week.localeCompare(a.iso_week);
      });
    },
    confirmLoadWeek(isoWeek) {
      if (this.hasSignificantChanges() && isoWeek !== this.currentWeek) {
        if (confirm("You have unsaved changes. Load a different week anyway?")) this.loadWeek(isoWeek);
      } else {
        this.loadWeek(isoWeek);
      }
    },
    confirmDeleteWeek(isoWeek) {
      if (confirm(`Are you sure you want to delete the schedule for ${isoWeek}?`)) this.deleteWeek(isoWeek);
    },
    async deleteWeek(isoWeek) {
      localStorage.removeItem(`planner_${isoWeek}`);
      if (this.isOnline) {
        try { await this.deleteFromPocketbase(isoWeek); }
        catch (e) { this.addToPendingSync(isoWeek, null, 'delete'); }
      } else {
        this.addToPendingSync(isoWeek, null, 'delete');
      }
      this.savedWeeks = this.savedWeeks.filter(week => week.iso_week !== isoWeek);
      if (this.currentWeek === isoWeek) {
        this.currentWeek = this.getCurrentIsoWeek();
        await this.loadWeek(this.currentWeek);
      }
    },
    async selectCity(cityOption) {
      this.city = cityOption.name; this.showCitySelector = false;
      try {
        if (cityOption.lat === null && cityOption.lon === null) await this.getPrayerTimes();
        else await this.fetchPrayerTimes(cityOption.lat, cityOption.lon);
        this.saveData();
      } catch (error) { this.showErrorMessage("Failed to load prayer times."); }
    },
    async getPrayerTimes() {
      try {
        const position = await new Promise((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000, maximumAge: 60000 }));
        const { latitude, longitude } = position.coords;
        try {
          const geoResponse = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&accept-language=en`);
          const geoData = await geoResponse.json();
          this.city = geoData.address?.city || geoData.address?.town || geoData.address?.village || geoData.address?.county || "Current Location";
        } catch (e) { this.city = "Current Location"; console.warn("Geocoding error", e)}
        await this.fetchPrayerTimes(latitude, longitude);
      } catch (error) {
        this.showErrorMessage("Could not get location. Using London default.");
        this.city = "London"; await this.fetchPrayerTimes(51.5074, -0.1278);
      }
    },
    async fetchPrayerTimes(latitude, longitude) {
      const today = new Date();
      const date = today.getDate(); const month = today.getMonth() + 1; const year = today.getFullYear();
      const cacheKey = `prayer_times_${year}_${month}_${date}_${latitude.toFixed(2)}_${longitude.toFixed(2)}`;
      const cachedData = localStorage.getItem(cacheKey);
      if (cachedData) { try {this.setPrayerTimes(JSON.parse(cachedData)); return; } catch(e){localStorage.removeItem(cacheKey);}}
      try {
        const response = await fetch(`https://api.aladhan.com/v1/calendar/${year}/${month}?latitude=${latitude}&longitude=${longitude}&method=2`);
        if (!response.ok) throw new Error(`API error: ${response.statusText} (${response.status})`);
        const apiData = await response.json();
        if (apiData.code === 200 && apiData.data && apiData.data.length > (date-1) && apiData.data[date-1]?.timings) {
          const timings = apiData.data[date-1].timings;
          localStorage.setItem(cacheKey, JSON.stringify(timings));
          this.setPrayerTimes(timings);
        } else throw new Error("Invalid prayer time data structure from API");
      } catch (error) {
        this.showErrorMessage("Failed to fetch prayer times: " + error.message + ". Using defaults.");
        this.setPrayerTimes({ Fajr: "05:30", Dhuhr: "12:30", Asr: "15:45", Maghrib: "18:30", Isha: "20:00" });
      }
    },
    setPrayerTimes(timings) {
      const qiyam = this.calculateQiyamTime(timings.Fajr);
      const prayerMapping = { Q: qiyam, F: timings.Fajr, D: timings.Dhuhr, A: timings.Asr, M: timings.Maghrib, I: timings.Isha };
      let changed = false;
      this.times.forEach(timeSlot => {
          const newTime = this.formatTime(prayerMapping[timeSlot.label]);
          if (timeSlot.value !== newTime) {
              timeSlot.value = newTime;
              changed = true;
          }
      });
      if (changed && !isInitializing) this.saveData();
    },
    formatTime(timeString) {
      if (!timeString || typeof timeString !== 'string') return "";
      const time = timeString.split(" ")[0]; const [hoursStr, minutesStr] = time.split(":");
      if (!hoursStr || !minutesStr) return "";
      let h = parseInt(hoursStr); let m = parseInt(minutesStr);
      if (isNaN(h) || isNaN(m)) return "";
      const ampm = h >= 12 ? "PM" : "AM"; h = h % 12; h = h ? h : 12;
      return `${h}:${m.toString().padStart(2, '0')}${ampm}`;
    },
    calculateQiyamTime(fajrTime) {
      if (!fajrTime || typeof fajrTime !== 'string') return "";
      const fajrParts = fajrTime.split(" ")[0].split(":");
      if (fajrParts.length < 2) return "";
      let fajrHour = parseInt(fajrParts[0]); let fajrMinute = parseInt(fajrParts[1]);
      if (isNaN(fajrHour) || isNaN(fajrMinute)) return "";
      let qiyamDate = new Date(); 
      qiyamDate.setHours(fajrHour, fajrMinute, 0, 0);
      qiyamDate.setHours(qiyamDate.getHours() - 1);
      return `${qiyamDate.getHours()}:${fajrMinute.toString().padStart(2, '0')}`;
    }
  };
}
