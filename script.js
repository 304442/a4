function plannerApp() {
  const pb = new PocketBase('/');
  pb.autoCancellation(false);
  let isInitializing = true;
  let lastSavedState = null;

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
    newActivityName: '',
    showGridLines: false,
    contextMenu: { show: false, top: 0, left: 0, type: null, data: null },
    times: [
      { label: 'Q', value: '' },
      { label: 'F', value: '' },
      { label: 'D', value: '' },
      { label: 'A', value: '' },
      { label: 'M', value: '' },
      { label: 'I', value: '' }
    ],
    cityOptions: [
      { name: 'London', lat: 51.5074, lon: -0.1278 },
      { name: 'Cairo', lat: 30.0444, lon: 31.2357 },
      { name: 'Cape Town', lat: -33.9249, lon: 18.4241 },
      { name: 'Amsterdam', lat: 52.3676, lon: 4.9041 },
      { name: 'Current Location', lat: null, lon: null }
    ],
    savedWeeks: [],
    schedule: [
      {
        name: 'QIYAM',
        activities: [
          {
            name: 'DAILY: Wakeup early',
            days: {
              mon: { value: '', max: 1 },
              tue: { value: '', max: 1 },
              wed: { value: '', max: 1 },
              thu: { value: '', max: 1 },
              fri: { value: '', max: 1 },
              sat: { value: '', max: 1 },
              sun: { value: '', max: 1 }
            },
            score: 0,
            maxScore: 7,
            streaks: { mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0, current: 0, longest: 0 }
          },
          {
            name: 'DAILY: Qiyam/Tahajjud',
            days: {
              mon: { value: '', max: 1 },
              tue: { value: '', max: 1 },
              wed: { value: '', max: 1 },
              thu: { value: '', max: 1 },
              fri: { value: '', max: 1 },
              sat: { value: '', max: 1 },
              sun: { value: '', max: 1 }
            },
            score: 0,
            maxScore: 7,
            streaks: { mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0, current: 0, longest: 0 }
          },
          {
            name: 'DAILY: Nutty Pudding',
            days: {
              mon: { value: '', max: 1 },
              tue: { value: '', max: 1 },
              wed: { value: '', max: 1 },
              thu: { value: '', max: 1 },
              fri: { value: '', max: 1 },
              sat: { value: '', max: 1 },
              sun: { value: '', max: 1 }
            },
            score: 0,
            maxScore: 7,
            streaks: { mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0, current: 0, longest: 0 }
          }
        ]
      },
      {
        name: 'FAJR',
        activities: [
          {
            name: 'DAILY: Fajr prayer',
            days: {
              mon: { value: '', max: 1 },
              tue: { value: '', max: 1 },
              wed: { value: '', max: 1 },
              thu: { value: '', max: 1 },
              fri: { value: '', max: 1 },
              sat: { value: '', max: 1 },
              sun: { value: '', max: 1 }
            },
            score: 0,
            maxScore: 7,
            streaks: { mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0, current: 0, longest: 0 }
          },
          {
            name: 'DAILY: Quran - 1 Juz',
            days: {
              mon: { value: '', max: 1 },
              tue: { value: '', max: 1 },
              wed: { value: '', max: 1 },
              thu: { value: '', max: 1 },
              fri: { value: '', max: 1 },
              sat: { value: '', max: 1 },
              sun: { value: '', max: 1 }
            },
            score: 0,
            maxScore: 7,
            streaks: { mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0, current: 0, longest: 0 }
          },
          {
            name: 'DAILY: 5min Cold Shower',
            days: {
              mon: { value: '', max: 1 },
              tue: { value: '', max: 1 },
              wed: { value: '', max: 1 },
              thu: { value: '', max: 1 },
              fri: { value: '', max: 1 },
              sat: { value: '', max: 1 },
              sun: { value: '', max: 1 }
            },
            score: 0,
            maxScore: 7,
            streaks: { mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0, current: 0, longest: 0 }
          }
        ]
      },
      {
        name: '7AM - 9AM',
        activities: [
          {
            name: 'MON/THU: COMMUTE',
            days: {
              mon: { value: '', max: 1 },
              thu: { value: '', max: 1 }
            },
            score: 0,
            maxScore: 2,
            streaks: { mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0, current: 0, longest: 0 }
          },
          {
            name: 'TUE/WED/FRI: Reading/Study (book/course/skill)',
            days: {
              tue: { value: '', max: 1 },
              wed: { value: '', max: 1 },
              fri: { value: '', max: 1 }
            },
            score: 0,
            maxScore: 3,
            streaks: { mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0, current: 0, longest: 0 }
          },
          {
            name: 'SAT: Errands, Grocery shopping, Meal prep',
            days: {
              sat: { value: '', max: 3 }
            },
            score: 0,
            maxScore: 3,
            streaks: { mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0, current: 0, longest: 0 }
          },
          {
            name: 'SUN: House cleaning, laundry',
            days: {
              sun: { value: '', max: 2 }
            },
            score: 0,
            maxScore: 2,
            streaks: { mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0, current: 0, longest: 0 }
          }
        ]
      },
      {
        name: '9AM - 5PM',
        activities: [
          {
            name: 'MON - FRI: Work',
            days: {
              mon: { value: '', max: 1 },
              tue: { value: '', max: 1 },
              wed: { value: '', max: 1 },
              thu: { value: '', max: 1 },
              fri: { value: '', max: 1 }
            },
            score: 0,
            maxScore: 5,
            streaks: { mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0, current: 0, longest: 0 }
          },
          {
            name: 'DAILY: ZeroInbox (E1, E2, E3, E4, LI, Slack)',
            days: {
              mon: { value: '', max: 6 },
              tue: { value: '', max: 6 },
              wed: { value: '', max: 6 },
              thu: { value: '', max: 6 },
              fri: { value: '', max: 6 }
            },
            score: 0,
            maxScore: 30,
            streaks: { mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0, current: 0, longest: 0 }
          },
          {
            name: 'SAT/SUN: Nature time / Outdoor Activity / Adventure',
            days: {
              sat: { value: '', max: 1 },
              sun: { value: '', max: 1 }
            },
            score: 0,
            maxScore: 2,
            streaks: { mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0, current: 0, longest: 0 }
          }
        ]
      },
      {
        name: 'DHUHR',
        activities: [
          {
            name: 'DAILY: Dhuhr prayer',
            days: {
              mon: { value: '', max: 1 },
              tue: { value: '', max: 1 },
              wed: { value: '', max: 1 },
              thu: { value: '', max: 1 },
              fri: { value: '', max: 1 },
              sat: { value: '', max: 1 },
              sun: { value: '', max: 1 }
            },
            score: 0,
            maxScore: 7,
            streaks: { mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0, current: 0, longest: 0 }
          },
          {
            name: 'TUE/WED/FRI: Sun walk (30-45 minutes)',
            days: {
              tue: { value: '', max: 1 },
              wed: { value: '', max: 1 },
              fri: { value: '', max: 1 }
            },
            score: 0,
            maxScore: 3,
            streaks: { mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0, current: 0, longest: 0 }
          },
          {
            name: 'FRI: £10 Sadaqa',
            days: {
              fri: { value: '', max: 1 }
            },
            score: 0,
            maxScore: 1,
            streaks: { mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0, current: 0, longest: 0 }
          }
        ]
      },
      {
        name: 'ASR',
        activities: [
          {
            name: 'DAILY: Asr prayer',
            days: {
              mon: { value: '', max: 1 },
              tue: { value: '', max: 1 },
              wed: { value: '', max: 1 },
              thu: { value: '', max: 1 },
              fri: { value: '', max: 1 },
              sat: { value: '', max: 1 },
              sun: { value: '', max: 1 }
            },
            score: 0,
            maxScore: 7,
            streaks: { mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0, current: 0, longest: 0 }
          }
        ]
      },
      {
        name: '5PM - 6:30PM',
        activities: [
          {
            name: 'MON/THU: COMMUTE',
            days: {
              mon: { value: '', max: 1 },
              thu: { value: '', max: 1 }
            },
            score: 0,
            maxScore: 2,
            streaks: { mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0, current: 0, longest: 0 }
          },
          {
            name: 'TUE/WED/FRI: Workout',
            days: {
              tue: { value: '', max: 1 },
              wed: { value: '', max: 1 },
              fri: { value: '', max: 1 }
            },
            score: 0,
            maxScore: 3,
            streaks: { mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0, current: 0, longest: 0 }
          },
          {
            name: 'TUE/WED/FRI: Third Meal',
            days: {
              tue: { value: '', max: 1 },
              wed: { value: '', max: 1 },
              fri: { value: '', max: 1 }
            },
            score: 0,
            maxScore: 3,
            streaks: { mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0, current: 0, longest: 0 }
          }
        ]
      },
      {
        name: '6:30PM - ISHA',
        activities: [
          {
            name: 'MON/TUE/WED/THU: Personal',
            days: {
              mon: { value: '', max: 1 },
              tue: { value: '', max: 1 },
              wed: { value: '', max: 1 },
              thu: { value: '', max: 1 }
            },
            score: 0,
            maxScore: 4,
            streaks: { mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0, current: 0, longest: 0 }
          },
          {
            name: 'DAILY: Family/Friends/Date calls(M, WA, Phone)',
            days: {
              mon: { value: '', max: 3 },
              tue: { value: '', max: 3 },
              wed: { value: '', max: 3 },
              thu: { value: '', max: 3 }
            },
            score: 0,
            maxScore: 12,
            streaks: { mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0, current: 0, longest: 0 }
          },
          {
            name: 'FRI/SAT/SUN: Family/Friends/Date visits/outings/activities',
            days: {
              fri: { value: '', max: 3 },
              sat: { value: '', max: 3 },
              sun: { value: '', max: 3 }
            },
            score: 0,
            maxScore: 9,
            streaks: { mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0, current: 0, longest: 0 }
          }
        ]
      },
      {
        name: 'MAGHRIB',
        activities: [
          {
            name: 'DAILY: Maghrib prayer',
            days: {
              mon: { value: '', max: 1 },
              tue: { value: '', max: 1 },
              wed: { value: '', max: 1 },
              thu: { value: '', max: 1 },
              fri: { value: '', max: 1 },
              sat: { value: '', max: 1 },
              sun: { value: '', max: 1 }
            },
            score: 0,
            maxScore: 7,
            streaks: { mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0, current: 0, longest: 0 }
          },
          {
            name: 'DAILY: Super Veggie',
            days: {
              mon: { value: '', max: 1 },
              tue: { value: '', max: 1 },
              wed: { value: '', max: 1 },
              thu: { value: '', max: 1 },
              fri: { value: '', max: 1 },
              sat: { value: '', max: 1 },
              sun: { value: '', max: 1 }
            },
            score: 0,
            maxScore: 7,
            streaks: { mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0, current: 0, longest: 0 }
          }
        ]
      },
      {
        name: 'ISHA',
        activities: [
          {
            name: 'DAILY: Isha prayer',
            days: {
              mon: { value: '', max: 1 },
              tue: { value: '', max: 1 },
              wed: { value: '', max: 1 },
              thu: { value: '', max: 1 },
              fri: { value: '', max: 1 },
              sat: { value: '', max: 1 },
              sun: { value: '', max: 1 }
            },
            score: 0,
            maxScore: 7,
            streaks: { mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0, current: 0, longest: 0 }
          },
          {
            name: 'DAILY: Sleep early',
            days: {
              mon: { value: '', max: 1 },
              tue: { value: '', max: 1 },
              wed: { value: '', max: 1 },
              thu: { value: '', max: 1 },
              fri: { value: '', max: 1 },
              sat: { value: '', max: 1 },
              sun: { value: '', max: 1 }
            },
            score: 0,
            maxScore: 7,
            streaks: { mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0, current: 0, longest: 0 }
          }
        ]
      },
      {
        name: 'ALLDAY',
        activities: [
          {
            name: 'DAILY: No Doomscrolling; (FB, YTB, LKDN, & IG)',
            days: {
              mon: { value: '', max: 4 },
              tue: { value: '', max: 4 },
              wed: { value: '', max: 4 },
              thu: { value: '', max: 4 },
              fri: { value: '', max: 4 },
              sat: { value: '', max: 4 },
              sun: { value: '', max: 4 }
            },
            score: 0,
            maxScore: 28,
            streaks: { mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0, current: 0, longest: 0 }
          },
          {
            name: 'DAILY: No Fap; (P, & M)',
            days: {
              mon: { value: '', max: 2 },
              tue: { value: '', max: 2 },
              wed: { value: '', max: 2 },
              thu: { value: '', max: 2 },
              fri: { value: '', max: 2 },
              sat: { value: '', max: 2 },
              sun: { value: '', max: 2 }
            },
            score: 0,
            maxScore: 14,
            streaks: { mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0, current: 0, longest: 0 }
          },
          {
            name: 'DAILY: No Processed; (Sugar, RefinedFlour, SeedOils, Soda, FastFood)',
            days: {
              mon: { value: '', max: 5 },
              tue: { value: '', max: 5 },
              wed: { value: '', max: 5 },
              thu: { value: '', max: 5 },
              fri: { value: '', max: 5 },
              sat: { value: '', max: 5 },
              sun: { value: '', max: 5 }
            },
            score: 0,
            maxScore: 35,
            streaks: { mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0, current: 0, longest: 0 }
          },
          {
            name: 'MON/THU: Fasting',
            days: {
              mon: { value: '', max: 1 },
              thu: { value: '', max: 1 }
            },
            score: 0,
            maxScore: 2,
            streaks: { mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0, current: 0, longest: 0 }
          },
          {
            name: 'DAILY: Expense Tracker <25',
            days: {
              mon: { value: '', max: 0 },
              tue: { value: '', max: 0 },
              wed: { value: '', max: 0 },
              thu: { value: '', max: 0 },
              fri: { value: '', max: 0 },
              sat: { value: '', max: 0 },
              sun: { value: '', max: 0 }
            },
            score: 0,
            maxScore: 0,
            streaks: { mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0, current: 0, longest: 0 }
          }
        ]
      },
      {
        name: 'TOTAL',
        activities: [
          {
            name: 'DAILY POINTS',
            days: {
              mon: { value: '0', max: 0 },
              tue: { value: '0', max: 0 },
              wed: { value: '0', max: 0 },
              thu: { value: '0', max: 0 },
              fri: { value: '0', max: 0 },
              sat: { value: '0', max: 0 },
              sun: { value: '0', max: 0 }
            },
            score: 0,
            maxScore: 0,
            streaks: { mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0, current: 0, longest: 0 }
          }
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
      { name: 'Weight', value: '', placeholder: '75kg' },
      { name: 'Chest', value: '', placeholder: '42in' },
      { name: 'Waist', value: '', placeholder: '34in' },
      { name: 'Hips', value: '', placeholder: '40in' },
      { name: 'Arms', value: '', placeholder: '15in' },
      { name: 'Thighs', value: '', placeholder: '24in' }
    ],
    financials: [
      { name: 'Rent', value: '', placeholder: '850', account: 'Cash' },
      { name: 'Allowance', value: '', placeholder: '850', account: 'Revolut' },
      { name: 'Savings', value: '', placeholder: '3,800', account: 'HSBCUK' }
    ],
    async init() {
      try {
        window.addEventListener('online', () => {
          this.isOnline = true;
          this.syncPendingData();
        });
        window.addEventListener('offline', () => this.isOnline = false);
        document.addEventListener('click', e => {
          if (!e.target.closest('.dropdown') && !e.target.closest('.clickable')) {
            this.showCitySelector = this.showWeekSelector = false;
          }
          if (!e.target.closest('.context-menu') && this.contextMenu.show) {
            this.hideContextMenu();
          }
        });
        this.pendingSync = JSON.parse(localStorage.getItem('planner_pending_sync') || '[]');
        this.currentWeek = this.getCurrentIsoWeek();
        this.dateRange = this.getWeekDateRange(this.parseISOWeek(this.currentWeek));
        this.schedule.forEach(section => {
          section.activities.forEach(activity => {
            if (!activity.streaks) {
              activity.streaks = { mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0, current: 0, longest: 0 };
            }
          });
        });
        await this.loadWeek(this.currentWeek, true);
        setInterval(() => {
          if (!isInitializing && this.hasSignificantChanges()) this.saveData();
        }, 30000);
        if (this.isOnline) this.syncPendingData();
      } catch (error) {
        console.error(error);
        this.showErrorMessage("Failed to initialize. Please refresh the page.");
      } finally {
        isInitializing = false;
      }
    },
    editInline(event, type, index, defaultValue = '') {
      const element = event.currentTarget;
      if (!element || !element.parentNode) {
        console.error("Element not found or not in the DOM");
        return;
      }
      const originalText = element.innerText;
      const isTextarea = ['mealIngredients', 'groceryCategoryItems'].includes(type);
      const input = document.createElement(isTextarea ? 'textarea' : 'input');
      input.type = 'text';
      input.value = defaultValue || originalText;
      input.className = isTextarea ? 'inline-edit-textarea' : 'inline-edit-input';
      if (isTextarea) input.rows = 3;
      element.innerHTML = '';
      element.appendChild(input);
      input.focus();
      input.select();
      const saveEdit = () => {
        const newValue = input.value.trim();
        if (newValue && newValue !== originalText) {
          this.updateValue(type, index, newValue);
        }
        element.innerHTML = type === 'title' ? newValue || originalText : originalText;
        if (this.uiStrings && this.uiStrings[type] !== undefined) {
          element.innerText = this.uiStrings[type] || originalText;
        } else if (type === 'tableHeader' && this.uiStrings && this.uiStrings.mainTableHeaders) {
          element.innerText = this.uiStrings.mainTableHeaders[index] || originalText;
        } else {
          element.innerText = newValue || originalText;
        }
      };
      input.addEventListener('blur', saveEdit);
      input.addEventListener('keydown', e => {
        if (!isTextarea && e.key === 'Enter') {
          saveEdit();
        } else if (e.key === 'Escape') {
          if (this.uiStrings && this.uiStrings[type] !== undefined) {
            element.innerText = this.uiStrings[type] || originalText;
          } else if (type === 'tableHeader' && this.uiStrings && this.uiStrings.mainTableHeaders) {
            element.innerText = this.uiStrings.mainTableHeaders[index] || originalText;
          } else {
            element.innerText = originalText;
          }
        }
      });
    },
    updateValue(type, index, value) {
      switch (type) {
        case 'activityName':
          const { sIdx: sectionIdx, aIdx: activityIdx } = index;
          if (!this.schedule[sectionIdx] || !this.schedule[sectionIdx].activities || !this.schedule[sectionIdx].activities[activityIdx]) {
            console.error('Activity not found:', sectionIdx, activityIdx);
            return;
          }
          const act = this.schedule[sectionIdx].activities[activityIdx];
          const parts = act.name.split(':');
          if (parts.length > 1) {
            act.name = `${parts[0]}: ${value}`;
          } else {
            act.name = value;
          }
          break;
        case 'maxValue':
          const { sIdx: secIdx, aIdx: actIdx, day } = index;
          const activityDay = this.schedule[secIdx].activities[actIdx].days[day];
          if (activityDay) {
            activityDay.max = parseInt(value) || 0;
          }
          break;
        case 'maxScore':
          const { sIdx: sectIdx, aIdx: actvIdx } = index;
          this.schedule[sectIdx].activities[actvIdx].maxScore = parseInt(value) || 0;
          break;
      }
      this.saveData();
    },
    showContextMenu(event, type, data) {
      this.contextMenu = {
        show: true,
        top: event.pageY,
        left: event.pageX,
        type,
        data
      };
    },
    hideContextMenu() {
      this.contextMenu.show = false;
    },
    editContextItem() {
      const { type, data } = this.contextMenu;
      switch (type) {
        case 'activity':
          const { sIdx, aIdx } = data;
          if (!this.schedule[sIdx] || !this.schedule[sIdx].activities || !this.schedule[sIdx].activities[aIdx]) {
            this.showErrorMessage('Activity not found.');
            this.hideContextMenu();
            return;
          }
          const activity = this.schedule[sIdx].activities[aIdx];
          const newName = prompt('Edit activity name:', activity.name);
          if (newName && newName.trim()) {
            activity.name = newName.trim();
            this.saveData();
          }
          break;
        case 'task':
          this.showErrorMessage('Tasks can be edited directly in their fields.');
          break;
        case 'workoutDay':
          const day = this.workoutPlan[data];
          const newDayName = prompt('Edit workout day name:', day.name);
          if (newDayName && newDayName.trim()) {
            day.name = newDayName.trim();
            this.saveData();
          }
          break;
        case 'exercise':
          const { dayIdx, exIdx } = data;
          const exercise = this.workoutPlan[dayIdx].exercises[exIdx];
          const newExName = prompt('Edit exercise name:', exercise.name);
          if (newExName && newExName.trim()) {
            exercise.name = newExName.trim();
            this.saveData();
          }
          break;
        case 'meal':
          const meal = this.meals[data];
          const newMealName = prompt('Edit meal name:', meal.name);
          if (newMealName && newMealName.trim()) {
            meal.name = newMealName.trim();
            this.saveData();
          }
          break;
        case 'groceryCategory':
          const category = this.groceryList[data];
          const newCatName = prompt('Edit category name:', category.name);
          if (newCatName && newCatName.trim()) {
            category.name = newCatName.trim();
            this.saveData();
          }
          break;
        case 'measurement':
          const measurement = this.bodyMeasurements[data];
          const newMeasName = prompt('Edit measurement name:', measurement.name);
          if (newMeasName && newMeasName.trim()) {
            measurement.name = newMeasName.trim();
            this.saveData();
          }
          break;
        case 'financial':
          const financial = this.financials[data];
          const newFinName = prompt('Edit financial item name:', financial.name);
          if (newFinName && newFinName.trim()) {
            financial.name = newFinName.trim();
            this.saveData();
          }
          break;
      }
      this.hideContextMenu();
    },
    deleteContextItem() {
      const { type, data } = this.contextMenu;
      if (!confirm('Are you sure you want to delete this item?')) {
        this.hideContextMenu();
        return;
      }
      switch (type) {
        case 'activity':
          const { sIdx, aIdx } = data;
          if (!this.schedule[sIdx] || !this.schedule[sIdx].activities || !this.schedule[sIdx].activities[aIdx]) {
            this.showErrorMessage('Activity not found.');
            this.hideContextMenu();
            return;
          }
          this.schedule[sIdx].activities.splice(aIdx, 1);
          break;
        case 'task':
          this.tasks.splice(data, 1);
          this.tasks.push({ num: '', priority: '', tag: '', description: '', date: '', completed: '' });
          break;
        case 'workoutDay':
          this.workoutPlan.splice(data, 1);
          break;
        case 'exercise':
          const { dayIdx, exIdx } = data;
          this.workoutPlan[dayIdx].exercises.splice(exIdx, 1);
          break;
        case 'meal':
          this.meals.splice(data, 1);
          break;
        case 'groceryCategory':
          this.groceryList.splice(data, 1);
          break;
        case 'measurement':
          this.bodyMeasurements.splice(data, 1);
          break;
        case 'financial':
          this.financials.splice(data, 1);
          break;
      }
      this.calculateScores();
      this.saveData();
      this.hideContextMenu();
    },
    addContextItem() {
      const { type, data } = this.contextMenu;
      let itemType = type;
      let itemIndex = data;
      if (type === 'activity' && typeof data === 'object' && data !== null && data.hasOwnProperty('sIdx')) {
        itemIndex = data.sIdx;
        if (!this.schedule[itemIndex]) {
          this.showErrorMessage('Cannot add activity: Invalid section.');
          this.hideContextMenu();
          return;
        }
      } else if (type === 'exercise' && typeof data === 'object' && data !== null && data.hasOwnProperty('dayIdx')) {
        itemIndex = data.dayIdx;
      }
      this.addItem(itemType, itemIndex);
      this.hideContextMenu();
    },
    addItem(type, index = null) {
      switch (type) {
        case 'activity':
          if (index === null || this.schedule[index] === undefined) {
            this.showErrorMessage('Cannot add activity: Invalid section.');
            return;
          }
          const sectionName = this.schedule[index].name;
          const newName = prompt(`Enter new activity name for section "${sectionName}":`);
          if (newName && newName.trim()) {
            this.addActivity(index, newName.trim());
          }
          break;
        case 'task':
          this.tasks.unshift({ num: '', priority: '', tag: '', description: '', date: '', completed: '' });
          break;
        case 'workoutDay':
          const dayName = prompt('Enter new workout day name:');
          if (dayName && dayName.trim()) {
            this.workoutPlan.push({ name: dayName.trim(), exercises: [] });
          }
          break;
        case 'exercise':
          if (index === null || this.workoutPlan[index] === undefined) {
            this.showErrorMessage('Cannot add exercise: Invalid workout day.');
            return;
          }
          const exName = prompt(`Enter new exercise name for "${this.workoutPlan[index].name}":`);
          if (exName && exName.trim()) {
            this.workoutPlan[index].exercises.push({
              prefix: '• ',
              name: exName.trim(),
              weight: '',
              sets: '',
              reps: '',
              defaultWeight: '20',
              defaultSets: '3',
              defaultReps: '12'
            });
          }
          break;
        case 'meal':
          const mealName = prompt('Enter new meal name:');
          if (mealName && mealName.trim()) {
            this.meals.push({ name: mealName.trim(), ingredients: '' });
          }
          break;
        case 'groceryCategory':
          const catName = prompt('Enter new grocery category name:');
          if (catName && catName.trim()) {
            this.groceryList.push({ name: catName.trim(), items: '' });
          }
          break;
        case 'measurement':
          const measName = prompt('Enter new measurement name:');
          if (measName && measName.trim()) {
            this.bodyMeasurements.push({ name: measName.trim(), value: '', placeholder: '' });
          }
          break;
        case 'financial':
          const finName = prompt('Enter new financial item name:');
          if (finName && finName.trim()) {
            this.financials.push({ name: finName.trim(), value: '', placeholder: '', account: 'Account' });
          }
          break;
      }
      this.saveData();
    },
    toggleTaskCompletion(task) {
      task.completed = task.completed === '✓' ? '☐' : '✓';
      this.saveData();
    },
    addActivity(sIdx, activityName) {
      if (!activityName.trim()) return;
      const section = this.schedule[sIdx];
      if (!section) return;
      const newActivity = {
        name: activityName,
        days: {
          mon: { value: '', max: 1 },
          tue: { value: '', max: 1 },
          wed: { value: '', max: 1 },
          thu: { value: '', max: 1 },
          fri: { value: '', max: 1 },
          sat: { value: '', max: 1 },
          sun: { value: '', max: 1 }
        },
        score: 0,
        maxScore: 7,
        streaks: { mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0, current: 0, longest: 0 }
      };
      section.activities.push(newActivity);
      this.saveData();
    },
    showErrorMessage(message) {
      this.notificationMessage = message;
      this.showNotification = true;
      clearTimeout(this.notificationTimeout);
      this.notificationTimeout = setTimeout(() => this.showNotification = false, 5000);
    },
    validateValue(value, isNumber = false, min = null, max = null) {
      if (value === null || value === undefined || value === '') return '';
      if (isNumber) {
        const numValue = parseInt(value);
        if (isNaN(numValue)) return '';
        if (min !== null && numValue < min) return min.toString();
        if (max !== null && numValue > max) return max.toString();
        return numValue.toString();
      }
      return String(value).trim();
    },
    getCurrentIsoWeek() {
      const now = new Date();
      const d = new Date(now);
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() + 4 - (d.getDay() || 7));
      const yearStart = new Date(d.getFullYear(), 0, 1);
      const weekNum = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
      return `${d.getFullYear()}-W${weekNum.toString().padStart(2, '0')}`;
    },
    parseISOWeek(isoWeekString) {
      if (!/^\d{4}-W(0[1-9]|[1-4][0-9]|5[0-3])$/.test(isoWeekString)) return new Date();
      const [year, weekPart] = isoWeekString.split('-');
      const week = parseInt(weekPart.substring(1));
      const januaryFourth = new Date(parseInt(year), 0, 4);
      const dayOfWeek = januaryFourth.getDay() || 7;
      const firstMonday = new Date(januaryFourth);
      firstMonday.setDate(januaryFourth.getDate() - dayOfWeek + 1);
      const targetMonday = new Date(firstMonday);
      targetMonday.setDate(firstMonday.getDate() + (week - 1) * 7);
      return targetMonday;
    },
    getWeekDateRange(date) {
      const start = new Date(date);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      return `${this.formatDate(start)}-${this.formatDate(end)}`;
    },
    formatDate(date) {
      return `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}`;
    },
    formatShortDate(index) {
      const now = new Date();
      now.setDate(now.getDate() + index);
      return `${(now.getMonth() + 1)}/${now.getDate()}`;
    },
    toggleCitySelector(event) {
      if (!event || !event.target) {
        this.showCitySelector = !this.showCitySelector;
        this.showWeekSelector = false;
        return;
      }
      this.showWeekSelector = false;
      const rect = event.target.getBoundingClientRect();
      this.dropdownPosition = {
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX
      };
      this.showCitySelector = !this.showCitySelector;
    },
    toggleWeekSelector(event) {
      if (!event || !event.target) {
        this.showCitySelector = false;
        this.showWeekSelector = !this.showWeekSelector;
        if (this.showWeekSelector) this.fetchSavedWeeks();
        return;
      }
      this.showCitySelector = false;
      const rect = event.target.getBoundingClientRect();
      this.dropdownPosition = {
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX
      };
      this.showWeekSelector = !this.showWeekSelector;
      if (this.showWeekSelector) this.fetchSavedWeeks();
    },
    async loadWeek(isoWeek, isInit = false) {
      if (!/^\d{4}-W(0[1-9]|[1-4][0-9]|5[0-3])$/.test(isoWeek)) {
        console.error("Invalid ISO week format:", isoWeek);
        this.showErrorMessage("Invalid week format");
        return;
      }
      this.showWeekSelector = false;
      this.currentWeek = isoWeek;
      this.dateRange = this.getWeekDateRange(this.parseISOWeek(isoWeek));
      let data = null;
      if (this.isOnline) {
        try {
          const records = await pb.collection('planners').getList(1, 1, { filter: `week_id="${isoWeek}"` });
          if (records.items.length > 0) data = records.items[0];
        } catch (error) {
          console.error("Pocketbase load error:", error);
        }
      }
      if (!data) {
        try {
          const localData = localStorage.getItem(`planner_${isoWeek}`);
          if (localData) data = JSON.parse(localData);
        } catch (e) {
          console.error("Error loading from localStorage:", e);
        }
      }
      this.populateFields(data || {});
      this.calculateScores();
      if (isInit && (!this.times[0].value || !this.times[1].value)) {
        try {
          await this.getPrayerTimes();
        } catch (error) {
          console.error("Error loading prayer times:", error);
        }
      }
    },
    populateFields(data) {
      if (!data || typeof data !== 'object') return;
      this.times.forEach(time => time.value = '');
      (data.times || []).forEach((time, i) => {
        if (i < this.times.length) this.times[i].value = this.validateValue(time.value);
      });
      const self = this;
      this.schedule.forEach(section => {
        section.activities.forEach(activity => {
          Object.keys(activity.days).forEach(day => activity.days[day].value = '');
          activity.score = 0;
          if (!activity.streaks) {
            activity.streaks = { mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0, current: 0, longest: 0 };
          }
        });
      });
      (data.schedule || []).forEach((savedSection, sIdx) => {
        if (sIdx < self.schedule.length && savedSection.activities && Array.isArray(savedSection.activities)) {
          savedSection.activities.forEach((savedActivity, aIdx) => {
            if (aIdx < self.schedule[sIdx].activities.length && savedActivity.days && typeof savedActivity.days === 'object') {
              const activity = self.schedule[sIdx].activities[aIdx];
              Object.keys(savedActivity.days).forEach(day => {
                if (activity.days[day]) {
                  const value = savedActivity.days[day].value;
                  const max = activity.days[day].max || 99;
                  activity.days[day].value = self.validateValue(value, true, 0, max);
                }
              });
              if (savedActivity.streaks) {
                activity.streaks = { ...savedActivity.streaks };
              }
            }
          });
        }
      });
      this.tasks.forEach(task => {
        task.num = task.priority = task.tag = task.description = task.date = task.completed = '';
      });
      (data.tasks || []).forEach((savedTask, i) => {
        if (i < this.tasks.length) {
          const task = this.tasks[i];
          task.num = this.validateValue(savedTask.num);
          task.priority = this.validateValue(savedTask.priority);
          task.tag = this.validateValue(savedTask.tag);
          task.description = this.validateValue(savedTask.description);
          task.date = this.validateValue(savedTask.date);
          task.completed = this.validateValue(savedTask.completed);
        }
      });
      this.workoutPlan.forEach(day => {
        day.exercises.forEach(ex => ex.weight = ex.sets = ex.reps = '');
      });
      (data.workoutPlan || []).forEach((day, dayIdx) => {
        if (dayIdx < self.workoutPlan.length && day.exercises && Array.isArray(day.exercises)) {
          day.exercises.forEach((ex, exIdx) => {
            if (exIdx < self.workoutPlan[dayIdx].exercises.length) {
              const exercise = self.workoutPlan[dayIdx].exercises[exIdx];
              exercise.weight = self.validateValue(ex.weight, true, 0, 999);
              exercise.sets = self.validateValue(ex.sets, true, 0, 99);
              exercise.reps = self.validateValue(ex.reps, true, 0, 99);
            }
          });
        }
      });
      this.groceryBudget = this.validateValue(data.groceryBudget);
      this.bodyMeasurements.forEach(m => m.value = '');
      (data.bodyMeasurements || []).forEach((m, i) => {
        if (i < this.bodyMeasurements.length) this.bodyMeasurements[i].value = this.validateValue(m.value);
      });
      this.financials.forEach(f => f.value = '');
      (data.financials || []).forEach((f, i) => {
        if (i < this.financials.length) this.financials[i].value = this.validateValue(f.value);
      });
      if (data.city) this.city = data.city;
      lastSavedState = JSON.parse(JSON.stringify({
        times: this.times,
        schedule: this.schedule,
        tasks: this.tasks,
        workoutPlan: this.workoutPlan,
        groceryBudget: this.groceryBudget,
        bodyMeasurements: this.bodyMeasurements,
        financials: this.financials,
        city: this.city,
        dateRange: this.dateRange
      }));
    },
    validateTextInput(event) {
      event.target.value = this.validateValue(event.target.value);
      this.saveData();
    },
    validateNumberInput(event) {
      const input = event.target;
      const min = input.hasAttribute('min') ? parseFloat(input.getAttribute('min')) : 0;
      const max = input.hasAttribute('max') ? parseFloat(input.getAttribute('max')) : 99;
      input.value = this.validateValue(input.value, true, min, max);
      this.calculateScores();
      this.saveData();
    },
    calculateScores() {
      const dailyTotals = { mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0 };
      this.schedule.forEach(section => {
        if (section.name === 'TOTAL') return;
        section.activities.forEach(activity => {
          let activityScore = 0;
          Object.entries(activity.days || {}).forEach(([day, dayData]) => {
            if (!dayData) return;
            const value = parseInt(dayData.value) || 0;
            const max = dayData.max || 0;
            if (value > 0 && max > 0) {
              dailyTotals[day] += value;
              activityScore += value;
            }
            dayData.value = value === 0 ? '' : value.toString();
          });
          activity.score = activityScore;
          if (!activity.streaks) {
            activity.streaks = { mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0, current: 0, longest: 0 };
          }
          const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
          const today = this.currentDay === 0 ? 6 : this.currentDay - 1;
          const orderedDays = [ ...days.slice(today + 1), ...days.slice(0, today + 1) ];
          let currentStreak = 0;
          for (const day of orderedDays) {
            if (activity.days[day] && parseInt(activity.days[day].value) > 0) {
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
        Object.entries(dailyTotals).forEach(([day, total]) => {
          if (totalActivity.days[day]) {
            totalActivity.days[day].value = total.toString();
          }
        });
        totalActivity.score = Object.values(dailyTotals).reduce((sum, val) => sum + val, 0);
      }
    },
    saveData() {
      if (isInitializing) return;
      if (this.saveTimeout) {
        clearTimeout(this.saveTimeout);
        this.saveTimeout = null;
      }
      this.saveStatus = 'saving';
      this.saveTimeout = setTimeout(async () => {
        try {
          this.calculateScores();
          const plannerData = {
            times: this.times,
            schedule: this.schedule,
            tasks: this.tasks,
            workoutPlan: this.workoutPlan,
            groceryBudget: this.groceryBudget,
            bodyMeasurements: this.bodyMeasurements,
            financials: this.financials,
            city: this.city,
            dateRange: this.dateRange,
            week_id: this.currentWeek
          };
          localStorage.setItem(`planner_${this.currentWeek}`, JSON.stringify(plannerData));
          if (this.isOnline) {
            try {
              await this.saveToPocketbase(this.currentWeek, plannerData);
              this.pendingSync = this.pendingSync.filter(item => item.weekId !== this.currentWeek);
              localStorage.setItem('planner_pending_sync', JSON.stringify(this.pendingSync));
            } catch (error) {
              this.addToPendingSync(this.currentWeek, plannerData);
            }
          } else {
            this.addToPendingSync(this.currentWeek, plannerData);
          }
          lastSavedState = JSON.parse(JSON.stringify(plannerData));
          this.saveStatus = 'saved';
        } catch (error) {
          console.error("Error in saveData:", error);
          this.saveStatus = 'error';
          this.showErrorMessage("Error saving data");
          setTimeout(() => {
            this.saveStatus = 'saved';
          }, 3000);
        }
      }, 500);
    },
    hasSignificantChanges() {
      if (!lastSavedState) return true;
      const currentState = {
        times: this.times,
        schedule: this.schedule,
        tasks: this.tasks,
        workoutPlan: this.workoutPlan,
        groceryBudget: this.groceryBudget,
        bodyMeasurements: this.bodyMeasurements,
        financials: this.financials
      };
      const currentJson = JSON.stringify(currentState);
      const lastJson = JSON.stringify(lastSavedState);
      if (currentJson === lastJson) return false;
      let changeCount = 0;
      currentState.schedule.forEach((section, sIdx) => {
        section.activities.forEach((activity, aIdx) => {
          Object.keys(activity.days || {}).forEach(day => {
            const currentValue = activity.days[day]?.value;
            const lastValue = lastSavedState.schedule[sIdx]?.activities[aIdx]?.days[day]?.value;
            if (currentValue !== lastValue) {
              changeCount++;
            }
          });
        });
      });
      currentState.tasks.forEach((task, idx) => {
        if (JSON.stringify(task) !== JSON.stringify(lastSavedState.tasks[idx])) {
          changeCount++;
        }
      });
      return changeCount >= 3;
    },
    addToPendingSync(weekId, data) {
      this.pendingSync = this.pendingSync.filter(item => item.weekId !== weekId || item.operation === 'delete' );
      this.pendingSync.push({ weekId, data, operation: 'save', timestamp: new Date().toISOString() });
      localStorage.setItem('planner_pending_sync', JSON.stringify(this.pendingSync));
    },
    async syncPendingData() {
      if (!this.isOnline || this.pendingSync.length === 0) return;
      const itemsToSync = [...this.pendingSync];
      this.pendingSync = [];
      localStorage.setItem('planner_pending_sync', JSON.stringify(this.pendingSync));
      for (const item of itemsToSync) {
        try {
          if (item.operation === 'delete') {
            await this.deleteFromPocketbase(item.weekId);
          } else {
            await this.saveToPocketbase(item.weekId, item.data);
          }
        } catch (error) {
          this.pendingSync.push(item);
          localStorage.setItem('planner_pending_sync', JSON.stringify(this.pendingSync));
          console.error("Sync error for week:", item.weekId, error);
        }
      }
    },
    async saveToPocketbase(weekId, data) {
      try {
        const records = await pb.collection('planners').getList(1, 1, { filter: `week_id="${weekId}"` });
        if (records.items.length > 0) {
          await pb.collection('planners').update(records.items[0].id, data);
        } else {
          await pb.collection('planners').create(data);
        }
        return true;
      } catch (error) {
        console.error("Pocketbase save error:", error);
        throw error;
      }
    },
    async deleteFromPocketbase(weekId) {
      try {
        const records = await pb.collection('planners').getList(1, 1, { filter: `week_id="${weekId}"` });
        if (records.items.length > 0) {
          await pb.collection('planners').delete(records.items[0].id);
        }
        return true;
      } catch (error) {
        console.error("Pocketbase delete error:", error);
        throw error;
      }
    },
    async fetchSavedWeeks() {
      const weeks = [];
      const currentIsoWeek = this.getCurrentIsoWeek();
      weeks.push({
        iso_week: currentIsoWeek,
        dateRange: this.getWeekDateRange(this.parseISOWeek(currentIsoWeek)),
        source: 'current',
        isCurrent: true
      });
      if (this.isOnline) {
        try {
          const records = await pb.collection('planners').getList(1, 100, { sort: '-week_id' });
          records.items.forEach(item => {
            if (item.week_id === currentIsoWeek) return;
            weeks.push({
              iso_week: item.week_id,
              dateRange: item.dateRange || '',
              source: 'pocketbase',
              isCurrent: false
            });
          });
        } catch (e) {
          console.error("Error fetching saved weeks from Pocketbase:", e);
        }
      }
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('planner_') && !key.includes('pending_sync')) {
          const isoWeek = key.replace('planner_', '');
          if (weeks.some(w => w.iso_week === isoWeek)) continue;
          try {
            const data = JSON.parse(localStorage.getItem(key));
            weeks.push({
              iso_week: isoWeek,
              dateRange: data.dateRange || '',
              source: 'local',
              isCurrent: isoWeek === currentIsoWeek
            });
          } catch (e) {
            // Skip invalid data
          }
        }
      }
      this.savedWeeks = weeks.sort((a, b) => {
        if (a.isCurrent) return -1;
        if (b.isCurrent) return 1;
        return b.iso_week.localeCompare(a.iso_week);
      });
    },
    confirmLoadWeek(isoWeek) {
      if (this.hasSignificantChanges() && isoWeek !== this.currentWeek) {
        if (confirm("You have unsaved changes. Load a different week anyway?")) {
          this.loadWeek(isoWeek);
        }
      } else {
        this.loadWeek(isoWeek);
      }
    },
    confirmDeleteWeek(isoWeek) {
      if (confirm(`Are you sure you want to delete the schedule for ${isoWeek}?`)) {
        this.deleteWeek(isoWeek);
      }
    },
    async deleteWeek(isoWeek) {
      localStorage.removeItem(`planner_${isoWeek}`);
      if (this.isOnline) {
        try {
          const records = await pb.collection('planners').getList(1, 1, { filter: `week_id="${isoWeek}"` });
          if (records.items.length > 0) {
            await pb.collection('planners').delete(records.items[0].id);
          }
        } catch (e) {
          this.pendingSync.push({
            weekId: isoWeek,
            operation: 'delete',
            timestamp: new Date().toISOString()
          });
          localStorage.setItem('planner_pending_sync', JSON.stringify(this.pendingSync));
        }
      } else {
        this.pendingSync = this.pendingSync.filter(item => item.weekId !== isoWeek || item.operation === 'delete' );
        this.pendingSync.push({
          weekId: isoWeek,
          operation: 'delete',
          timestamp: new Date().toISOString()
        });
        localStorage.setItem('planner_pending_sync', JSON.stringify(this.pendingSync));
      }
      this.savedWeeks = this.savedWeeks.filter(week => week.iso_week !== isoWeek);
      if (this.currentWeek === isoWeek) {
        const currentIsoWeek = this.getCurrentIsoWeek();
        this.currentWeek = currentIsoWeek;
        this.loadWeek(currentIsoWeek);
      }
    },
    async selectCity(cityOption) {
      this.city = cityOption.name;
      this.showCitySelector = false;
      try {
        if (cityOption.lat === null && cityOption.lon === null) {
          await this.getPrayerTimes();
        } else {
          await this.fetchPrayerTimes(cityOption.lat, cityOption.lon);
        }
        this.saveData();
      } catch (error) {
        console.error("Error selecting city:", error);
        this.showErrorMessage("Failed to load prayer times. Please try again.");
      }
    },
    async getPrayerTimes() {
      try {
        const position = await Promise.race([
          new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000, maximumAge: 60000 });
          }),
          new Promise((_, reject) => setTimeout(() => reject(new Error("Geolocation timeout")), 6000))
        ]);
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        try {
          const geoResponse = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10`);
          if (!geoResponse.ok) throw new Error("Geocoding API error");
          const geoData = await geoResponse.json();
          if (geoData.address) {
            this.city = geoData.address.city || geoData.address.town || geoData.address.village || geoData.address.county || "Current Location";
          }
        } catch (error) {
          console.warn("Could not get location name:", error);
          this.city = "Current Location";
        }
        await this.fetchPrayerTimes(latitude, longitude);
      } catch (error) {
        console.warn("Geolocation error:", error);
        this.showErrorMessage("Could not get your location. Using London as default.");
        this.city = "London";
        await this.fetchPrayerTimes(51.5074, -0.1278);
      }
    },
    async fetchPrayerTimes(latitude, longitude) {
      const today = new Date();
      const date = today.getDate();
      const month = today.getMonth() + 1;
      const year = today.getFullYear();
      try {
        const cacheKey = `prayer_times_${year}_${month}_${date}_${latitude.toFixed(2)}_${longitude.toFixed(2)}`;
        const cachedData = localStorage.getItem(cacheKey);
        if (cachedData) {
          this.setPrayerTimes(JSON.parse(cachedData));
          return;
        }
        const response = await fetch(`https://api.aladhan.com/v1/calendar/${year}/${month}?latitude=${latitude}&longitude=${longitude}&method=2`);
        if (!response.ok) throw new Error(`Prayer API error: ${response.status}`);
        const data = await response.json();
        if (data.code === 200 && data.data && data.data[date-1]) {
          const timings = data.data[date-1].timings;
          localStorage.setItem(cacheKey, JSON.stringify(timings));
          this.setPrayerTimes(timings);
        } else {
          throw new Error("Invalid prayer time data");
        }
      } catch (error) {
        console.error("Error fetching prayer times:", error);
        this.setPrayerTimes({
          Fajr: "05:30",
          Dhuhr: "12:30",
          Asr: "15:45",
          Maghrib: "18:30",
          Isha: "20:00"
        });
      }
    },
    setPrayerTimes(timings) {
      if (!this.times[0].value || !this.times[1].value || isInitializing) {
        this.times[0].value = this.calculateQiyamTime(timings.Fajr);
        this.times[1].value = this.formatTime(timings.Fajr);
        this.times[2].value = this.formatTime(timings.Dhuhr);
        this.times[3].value = this.formatTime(timings.Asr);
        this.times[4].value = this.formatTime(timings.Maghrib);
        this.times[5].value = this.formatTime(timings.Isha);
        if (!isInitializing) {
          this.saveData();
        }
      }
    },
    formatTime(timeString) {
      if (!timeString) return "";
      const time = timeString.split(" ")[0];
      const [hours, minutes] = time.split(":");
      let hour = parseInt(hours);
      if (isNaN(hour)) return "";
      const ampm = hour >= 12 ? "PM" : "AM";
      hour = hour % 12;
      hour = hour ? hour : 12;
      return `${hour}:${minutes}${ampm}`;
    },
    calculateQiyamTime(fajrTime) {
      if (!fajrTime) return "";
      const fajrParts = fajrTime.split(" ")[0].split(":");
      if (fajrParts.length < 2) return "";
      const fajrHour = parseInt(fajrParts[0]);
      const fajrMinute = parseInt(fajrParts[1]);
      if (isNaN(fajrHour) || isNaN(fajrMinute)) return "";
      let qiyamHour = fajrHour - 1;
      if (qiyamHour < 0) qiyamHour += 24;
      const ampm = qiyamHour >= 12 ? "PM" : "AM";
      const hour = qiyamHour % 12 || 12;
      return `${hour}:${fajrMinute.toString().padStart(2, '0')}${ampm}`;
    }
  };
}
