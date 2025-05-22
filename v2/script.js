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

  const SEED_APP_CONFIG_DATA = {
    config_key: "default_v1",
    planner_title_default: "Weekly Planner (Seeded)",
    ui_config_default: {
        mainTableHeaders: ['TIME', 'DAY', 'ACTIVITY', 'SCR', 'MAX', '🔥'],
        dayHeaders: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'],
        maxHeaders: Array(7).fill('MAX'),
        taskHeaders: ['№', '🔥', '🏷️', '✏️ Task/Event/Note', '📅', '✓'],
        sectionTitles: { tasks: 'TASKS & NOTES', workout: 'WORKOUT PLAN', meals: 'MEAL PREP', grocery: 'GROCERY LIST', measurements: 'BODY MEASUREMENTS', financials: 'MONTH/1ST: FINANCIAL'}
    },
    times_default: [ { label: 'Q', value: '' }, { label: 'F', value: '' }, { label: 'D', value: '' }, { label: 'A', value: '' }, { label: 'M', value: '' }, { label: 'I', value: '' } ],
    schedule_default: [
      { name: 'QIYAM', id: generateId('sec_'), activities: [
          { id: generateId('act_'), name: 'DAILY: Wakeup early', days: { mon: { value: '', max: 1 }, tue: { value: '', max: 1 }, wed: { value: '', max: 1 }, thu: { value: '', max: 1 }, fri: { value: '', max: 1 }, sat: { value: '', max: 1 }, sun: { value: '', max: 1 } }, score: 0, maxScore: 7, streaks: { mon:0, tue:0, wed:0, thu:0, fri:0, sat:0, sun:0, current:0, longest:0 }},
          { id: generateId('act_'), name: 'DAILY: Qiyam/Tahajjud', days: { mon: { value: '', max: 1 }, tue: { value: '', max: 1 }, wed: { value: '', max: 1 }, thu: { value: '', max: 1 }, fri: { value: '', max: 1 }, sat: { value: '', max: 1 }, sun: { value: '', max: 1 } }, score: 0, maxScore: 7, streaks: { mon:0, tue:0, wed:0, thu:0, fri:0, sat:0, sun:0, current:0, longest:0 }},
          { id: generateId('act_'), name: 'DAILY: Nutty Pudding', days: { mon: { value: '', max: 1 }, tue: { value: '', max: 1 }, wed: { value: '', max: 1 }, thu: { value: '', max: 1 }, fri: { value: '', max: 1 }, sat: { value: '', max: 1 }, sun: { value: '', max: 1 } }, score: 0, maxScore: 7, streaks: { mon:0, tue:0, wed:0, thu:0, fri:0, sat:0, sun:0, current:0, longest:0 }}
      ]},
      { name: 'FAJR', id: generateId('sec_'), activities: [
          { id: generateId('act_'), name: 'DAILY: Fajr prayer', days: { mon: { value: '', max: 1 }, tue: { value: '', max: 1 }, wed: { value: '', max: 1 }, thu: { value: '', max: 1 }, fri: { value: '', max: 1 }, sat: { value: '', max: 1 }, sun: { value: '', max: 1 } }, score: 0, maxScore: 7, streaks: { mon:0, tue:0, wed:0, thu:0, fri:0, sat:0, sun:0, current:0, longest:0 }},
          { id: generateId('act_'), name: 'DAILY: Quran - 1 Juz', days: { mon: { value: '', max: 1 }, tue: { value: '', max: 1 }, wed: { value: '', max: 1 }, thu: { value: '', max: 1 }, fri: { value: '', max: 1 }, sat: { value: '', max: 1 }, sun: { value: '', max: 1 } }, score: 0, maxScore: 7, streaks: { mon:0, tue:0, wed:0, thu:0, fri:0, sat:0, sun:0, current:0, longest:0 }},
          { id: generateId('act_'), name: 'DAILY: 5min Cold Shower', days: { mon: { value: '', max: 1 }, tue: { value: '', max: 1 }, wed: { value: '', max: 1 }, thu: { value: '', max: 1 }, fri: { value: '', max: 1 }, sat: { value: '', max: 1 }, sun: { value: '', max: 1 } }, score: 0, maxScore: 7, streaks: { mon:0, tue:0, wed:0, thu:0, fri:0, sat:0, sun:0, current:0, longest:0 }}
      ]},
      { name: '7AM - 9AM', id: generateId('sec_'), activities: [
          { id: generateId('act_'), name: 'MON/THU: COMMUTE', days: { mon: { value: '', max: 1 }, thu: { value: '', max: 1 } }, score: 0, maxScore: 2, streaks: { mon:0, tue:0, wed:0, thu:0, fri:0, sat:0, sun:0, current:0, longest:0 } },
          { id: generateId('act_'), name: 'TUE/WED/FRI: Reading/Study (book/course/skill)', days: { tue: { value: '', max: 1 }, wed: { value: '', max: 1 }, fri: { value: '', max: 1 } }, score: 0, maxScore: 3, streaks: { mon:0, tue:0, wed:0, thu:0, fri:0, sat:0, sun:0, current:0, longest:0 } },
          { id: generateId('act_'), name: 'SAT: Errands, Grocery shopping, Meal prep', days: { sat: { value: '', max: 3 } }, score: 0, maxScore: 3, streaks: { mon:0, tue:0, wed:0, thu:0, fri:0, sat:0, sun:0, current:0, longest:0 } },
          { id: generateId('act_'), name: 'SUN: House cleaning, laundry', days: { sun: { value: '', max: 2 } }, score: 0, maxScore: 2, streaks: { mon:0, tue:0, wed:0, thu:0, fri:0, sat:0, sun:0, current:0, longest:0 } }
      ]},
      { name: '9AM - 5PM', id: generateId('sec_'), activities: [
          { id: generateId('act_'), name: 'MON - FRI: Work', days: { mon: { value: '', max: 1 }, tue: { value: '', max: 1 }, wed: { value: '', max: 1 }, thu: { value: '', max: 1 }, fri: { value: '', max: 1 } }, score: 0, maxScore: 5, streaks: { mon:0, tue:0, wed:0, thu:0, fri:0, sat:0, sun:0, current:0, longest:0 } },
          { id: generateId('act_'), name: 'DAILY: ZeroInbox (E1, E2, E3, E4, LI, Slack)', days: { mon: { value: '', max: 6 }, tue: { value: '', max: 6 }, wed: { value: '', max: 6 }, thu: { value: '', max: 6 }, fri: { value: '', max: 6 } }, score: 0, maxScore: 30, streaks: { mon:0, tue:0, wed:0, thu:0, fri:0, sat:0, sun:0, current:0, longest:0 } },
          { id: generateId('act_'), name: 'SAT/SUN: Nature time / Outdoor Activity / Adventure', days: { sat: { value: '', max: 1 }, sun: { value: '', max: 1 } }, score: 0, maxScore: 2, streaks: { mon:0, tue:0, wed:0, thu:0, fri:0, sat:0, sun:0, current:0, longest:0 } }
      ]},
      { name: 'DHUHR', id: generateId('sec_'), activities: [
          { id: generateId('act_'), name: 'DAILY: Dhuhr prayer', days: { mon: { value: '', max: 1 }, tue: { value: '', max: 1 }, wed: { value: '', max: 1 }, thu: { value: '', max: 1 }, fri: { value: '', max: 1 }, sat: { value: '', max: 1 }, sun: { value: '', max: 1 } }, score: 0, maxScore: 7, streaks: { mon:0, tue:0, wed:0, thu:0, fri:0, sat:0, sun:0, current:0, longest:0 } },
          { id: generateId('act_'), name: 'TUE/WED/FRI: Sun walk (30-45 minutes)', days: { tue: { value: '', max: 1 }, wed: { value: '', max: 1 }, fri: { value: '', max: 1 } }, score: 0, maxScore: 3, streaks: { mon:0, tue:0, wed:0, thu:0, fri:0, sat:0, sun:0, current:0, longest:0 } },
          { id: generateId('act_'), name: 'FRI: £10 Sadaqa', days: { fri: { value: '', max: 1 } }, score: 0, maxScore: 1, streaks: { mon:0, tue:0, wed:0, thu:0, fri:0, sat:0, sun:0, current:0, longest:0 } }
      ]},
      { name: 'ASR', id: generateId('sec_'), activities: [
          { id: generateId('act_'), name: 'DAILY: Asr prayer', days: { mon: { value: '', max: 1 }, tue: { value: '', max: 1 }, wed: { value: '', max: 1 }, thu: { value: '', max: 1 }, fri: { value: '', max: 1 }, sat: { value: '', max: 1 }, sun: { value: '', max: 1 } }, score: 0, maxScore: 7, streaks: { mon:0, tue:0, wed:0, thu:0, fri:0, sat:0, sun:0, current:0, longest:0 } }
      ]},
      { name: '5PM - 6:30PM', id: generateId('sec_'), activities: [
          { id: generateId('act_'), name: 'MON/THU: COMMUTE', days: { mon: { value: '', max: 1 }, thu: { value: '', max: 1 } }, score: 0, maxScore: 2, streaks: { mon:0, tue:0, wed:0, thu:0, fri:0, sat:0, sun:0, current:0, longest:0 } },
          { id: generateId('act_'), name: 'TUE/WED/FRI: Workout', days: { tue: { value: '', max: 1 }, wed: { value: '', max: 1 }, fri: { value: '', max: 1 } }, score: 0, maxScore: 3, streaks: { mon:0, tue:0, wed:0, thu:0, fri:0, sat:0, sun:0, current:0, longest:0 } },
          { id: generateId('act_'), name: 'TUE/WED/FRI: Third Meal', days: { tue: { value: '', max: 1 }, wed: { value: '', max: 1 }, fri: { value: '', max: 1 } }, score: 0, maxScore: 3, streaks: { mon:0, tue:0, wed:0, thu:0, fri:0, sat:0, sun:0, current:0, longest:0 } }
      ]},
      { name: '6:30PM - ISHA', id: generateId('sec_'), activities: [
          { id: generateId('act_'), name: 'MON/TUE/WED/THU: Personal', days: { mon: { value: '', max: 1 }, tue: { value: '', max: 1 }, wed: { value: '', max: 1 }, thu: { value: '', max: 1 } }, score: 0, maxScore: 4, streaks: { mon:0, tue:0, wed:0, thu:0, fri:0, sat:0, sun:0, current:0, longest:0 } },
          { id: generateId('act_'), name: 'DAILY: Family/Friends/Date calls(M, WA, Phone)', days: { mon: { value: '', max: 3 }, tue: { value: '', max: 3 }, wed: { value: '', max: 3 }, thu: { value: '', max: 3 } }, score: 0, maxScore: 12, streaks: { mon:0, tue:0, wed:0, thu:0, fri:0, sat:0, sun:0, current:0, longest:0 } },
          { id: generateId('act_'), name: 'FRI/SAT/SUN: Family/Friends/Date visits/outings/activities', days: { fri: { value: '', max: 3 }, sat: { value: '', max: 3 }, sun: { value: '', max: 3 } }, score: 0, maxScore: 9, streaks: { mon:0, tue:0, wed:0, thu:0, fri:0, sat:0, sun:0, current:0, longest:0 } }
      ]},
      { name: 'MAGHRIB', id: generateId('sec_'), activities: [
          { id: generateId('act_'), name: 'DAILY: Maghrib prayer', days: { mon: { value: '', max: 1 }, tue: { value: '', max: 1 }, wed: { value: '', max: 1 }, thu: { value: '', max: 1 }, fri: { value: '', max: 1 }, sat: { value: '', max: 1 }, sun: { value: '', max: 1 } }, score: 0, maxScore: 7, streaks: { mon:0, tue:0, wed:0, thu:0, fri:0, sat:0, sun:0, current:0, longest:0 } },
          { id: generateId('act_'), name: 'DAILY: Super Veggie', days: { mon: { value: '', max: 1 }, tue: { value: '', max: 1 }, wed: { value: '', max: 1 }, thu: { value: '', max: 1 }, fri: { value: '', max: 1 }, sat: { value: '', max: 1 }, sun: { value: '', max: 1 } }, score: 0, maxScore: 7, streaks: { mon:0, tue:0, wed:0, thu:0, fri:0, sat:0, sun:0, current:0, longest:0 } }
      ]},
      { name: 'ISHA', id: generateId('sec_'), activities: [
          { id: generateId('act_'), name: 'DAILY: Isha prayer', days: { mon: { value: '', max: 1 }, tue: { value: '', max: 1 }, wed: { value: '', max: 1 }, thu: { value: '', max: 1 }, fri: { value: '', max: 1 }, sat: { value: '', max: 1 }, sun: { value: '', max: 1 } }, score: 0, maxScore: 7, streaks: { mon:0, tue:0, wed:0, thu:0, fri:0, sat:0, sun:0, current:0, longest:0 } },
          { id: generateId('act_'), name: 'DAILY: Sleep early', days: { mon: { value: '', max: 1 }, tue: { value: '', max: 1 }, wed: { value: '', max: 1 }, thu: { value: '', max: 1 }, fri: { value: '', max: 1 }, sat: { value: '', max: 1 }, sun: { value: '', max: 1 } }, score: 0, maxScore: 7, streaks: { mon:0, tue:0, wed:0, thu:0, fri:0, sat:0, sun:0, current:0, longest:0 } }
      ]},
      { name: 'ALLDAY', id: generateId('sec_'), activities: [
          { id: generateId('act_'), name: 'DAILY: No Doomscrolling; (FB, YTB, LKDN, & IG)', days: { mon: { value: '', max: 4 }, tue: { value: '', max: 4 }, wed: { value: '', max: 4 }, thu: { value: '', max: 4 }, fri: { value: '', max: 4 }, sat: { value: '', max: 4 }, sun: { value: '', max: 4 } }, score: 0, maxScore: 28, streaks: { mon:0, tue:0, wed:0, thu:0, fri:0, sat:0, sun:0, current:0, longest:0 } },
          { id: generateId('act_'), name: 'DAILY: No Fap; (P, & M)', days: { mon: { value: '', max: 2 }, tue: { value: '', max: 2 }, wed: { value: '', max: 2 }, thu: { value: '', max: 2 }, fri: { value: '', max: 2 }, sat: { value: '', max: 2 }, sun: { value: '', max: 2 } }, score: 0, maxScore: 14, streaks: { mon:0, tue:0, wed:0, thu:0, fri:0, sat:0, sun:0, current:0, longest:0 } },
          { id: generateId('act_'), name: 'DAILY: No Processed; (Sugar, RefinedFlour, SeedOils, Soda, FastFood)', days: { mon: { value: '', max: 5 }, tue: { value: '', max: 5 }, wed: { value: '', max: 5 }, thu: { value: '', max: 5 }, fri: { value: '', max: 5 }, sat: { value: '', max: 5 }, sun: { value: '', max: 5 } }, score: 0, maxScore: 35, streaks: { mon:0, tue:0, wed:0, thu:0, fri:0, sat:0, sun:0, current:0, longest:0 } },
          { id: generateId('act_'), name: 'MON/THU: Fasting', days: { mon: { value: '', max: 1 }, thu: { value: '', max: 1 } }, score: 0, maxScore: 2, streaks: { mon:0, tue:0, wed:0, thu:0, fri:0, sat:0, sun:0, current:0, longest:0 } },
          { id: generateId('act_'), name: 'DAILY: Expense Tracker <25', days: { mon: { value: '', max: 0 }, tue: { value: '', max: 0 }, wed: { value: '', max: 0 }, thu: { value: '', max: 0 }, fri: { value: '', max: 0 }, sat: { value: '', max: 0 }, sun: { value: '', max: 0 } }, score: 0, maxScore: 0, streaks: { mon:0, tue:0, wed:0, thu:0, fri:0, sat:0, sun:0, current:0, longest:0 } }
      ]},
      { name: 'TOTAL', id: generateId('sec_'), activities: [
          { id: generateId('act_'), name: 'DAILY POINTS', days: { mon: { value: '0', max: 0 }, tue: { value: '0', max: 0 }, wed: { value: '0', max: 0 }, thu: { value: '0', max: 0 }, fri: { value: '0', max: 0 }, sat: { value: '0', max: 0 }, sun: { value: '0', max: 0 } }, score: 0, maxScore: 0, streaks: { mon:0, tue:0, wed:0, thu:0, fri:0, sat:0, sun:0, current:0, longest:0 }}
      ]}
    ],
    tasks_default_count: 20, // This will generate 20 empty tasks
    workout_plan_default: [
      { name: 'TUESDAY', id: generateId('wpd_'), exercises: [
          { id: generateId('ex_'), prefix: '• ', name: 'Incline Dumbbell Press', weight: '', sets: '', reps: '', defaultWeight: '30', defaultSets: '3', defaultReps: '12' },
          { id: generateId('ex_'), prefix: '• ', name: 'Barbell Squats', weight: '', sets: '', reps: '', defaultWeight: '80', defaultSets: '3', defaultReps: '8' },
          { id: generateId('ex_'), prefix: '• ', name: 'DB Chest-Supported Row', weight: '', sets: '', reps: '', defaultWeight: '25', defaultSets: '3', defaultReps: '12' },
          { id: generateId('ex_'), prefix: '• ', name: 'Leg Curls', weight: '', sets: '', reps: '', defaultWeight: '40', defaultSets: '3', defaultReps: '15' },
          { id: generateId('ex_'), prefix: '• SS: ', name: 'Incline DB Curls', weight: '', sets: '', reps: '', defaultWeight: '15', defaultSets: '3', defaultReps: '12' },
          { id: generateId('ex_'), prefix: '• SS: ', name: 'Tricep Extensions', weight: '', sets: '', reps: '', defaultWeight: '20', defaultSets: '3', defaultReps: '12' }
      ]},
      { name: 'WEDNESDAY', id: generateId('wpd_'), exercises: [
          { id: generateId('ex_'), prefix: '• ', name: 'Barbell Bench Press', weight: '', sets: '', reps: '', defaultWeight: '70', defaultSets: '3', defaultReps: '6' },
          { id: generateId('ex_'), prefix: '• ', name: 'Romanian Deadlift', weight: '', sets: '', reps: '', defaultWeight: '90', defaultSets: '3', defaultReps: '8' },
          { id: generateId('ex_'), prefix: '• ', name: 'Lat Pulldown', weight: '', sets: '', reps: '', defaultWeight: '60', defaultSets: '3', defaultReps: '12' },
          { id: generateId('ex_'), prefix: '• ', name: 'Walking Lunges', weight: '', sets: '', reps: '', defaultWeight: '20', defaultSets: '3', defaultReps: '10' },
          { id: generateId('ex_'), prefix: '• SS: ', name: 'Cable Lateral Raises', weight: '', sets: '', reps: '', defaultWeight: '15', defaultSets: '3', defaultReps: '15' },
          { id: generateId('ex_'), prefix: '• SS: ', name: 'Reverse Crunches', weight: '', sets: '', reps: '', defaultWeight: '0', defaultSets: '3', defaultReps: '15' }
      ]},
      { name: 'FRIDAY', id: generateId('wpd_'), exercises: [
          { id: generateId('ex_'), prefix: '• ', name: 'Seated DB Shoulder Press', weight: '', sets: '', reps: '', defaultWeight: '20', defaultSets: '3', defaultReps: '12' },
          { id: generateId('ex_'), prefix: '• ', name: 'Dumbbell Row', weight: '', sets: '', reps: '', defaultWeight: '25', defaultSets: '3', defaultReps: '12' },
          { id: generateId('ex_'), prefix: '• ', name: 'Barbell Hip Thrust', weight: '', sets: '', reps: '', defaultWeight: '100', defaultSets: '3', defaultReps: '15' },
          { id: generateId('ex_'), prefix: '• ', name: 'Leg Extensions', weight: '', sets: '', reps: '', defaultWeight: '50', defaultSets: '3', defaultReps: '15' },
          { id: generateId('ex_'), prefix: '• ', name: 'Seated Chest Flyes', weight: '', sets: '', reps: '', defaultWeight: '15', defaultSets: '3', defaultReps: '15' },
          { id: generateId('ex_'), prefix: '• SS: ', name: 'Standing Calf Raises', weight: '', sets: '', reps: '', defaultWeight: '30', defaultSets: '3', defaultReps: '15' },
          { id: generateId('ex_'), prefix: '• SS: ', name: 'Reverse Cable Flyes', weight: '', sets: '', reps: '', defaultWeight: '20', defaultSets: '3', defaultReps: '15' }
      ]}
    ],
    meals_default: [
      { id: generateId('meal_'), name: 'Nutty Pudding', ingredients: 'Berries ½c, Cherries 3, Pomegranate Juice 2oz, Macadamia nuts (raw) 45g, Walnuts (raw) 5g, Cocoa 1t, Brazil Nuts ¼, Milk 50-100ml, Chia Seeds 2T, Flax (ground, refr) 1t, Lecithin 1t, Ceylon Cinnamon ½t' },
      { id: generateId('meal_'), name: 'Super Veggie', ingredients: 'Broccoli 250g, Cauliflower 150g, Mushrooms 50g, Garlic 1 clove, Ginger 3g, Cumin 1T, Black Lentils 45g, Hemp Seeds 1T, Apple Cider Vinegar 1T' },
      { id: generateId('meal_'), name: 'Third Meal', ingredients: 'Sweet Potato 350-400g, Protein 100-150g, Grape Tomatoes 12, Avocado ½, Radishes 4, Cilantro ¼c, Lemon 1, Jalapeño (lg) 1, Chili Powder 1t' }
    ],
    grocery_list_default: [
      { id: generateId('gcat_'), name: 'Produce', items: 'Broccoli 1.75kg, Cauliflower 1.05kg, Mushrooms 350g, Garlic 1 bulb, Ginger 1pc, Sweet Potato 2.8kg, Grape Tomatoes 84, Avocados (ripe) 4, Radishes 28, Cilantro 2-3 bunch' },
      { id: generateId('gcat_'), name: 'Fruits & Protein', items: 'Lemons 7, Jalapeños (lg) 7, Berries 3.5c, Cherries 21, Black Lentils 315g, Protein 1.05kg, Milk (fortified) 1L' }
    ],
    grocery_budget_default_placeholder: "£120",
    body_measurements_default: [
      { id: generateId('bm_'), name: 'Weight', value: '', placeholder: '75kg' }, { id: generateId('bm_'), name: 'Chest', value: '', placeholder: '42in' },
      { id: generateId('bm_'), name: 'Waist', value: '', placeholder: '34in' }, { id: generateId('bm_'), name: 'Hips', value: '', placeholder: '40in' },
      { id: generateId('bm_'), name: 'Arms', value: '', placeholder: '15in' }, { id: generateId('bm_'), name: 'Thighs', value: '', placeholder: '24in' }
    ],
    financials_default: [
      { id: generateId('fin_'), name: 'Rent', value: '', placeholder: '850', account: 'Cash' },
      { id: generateId('fin_'), name: 'Allowance', value: '', placeholder: '850', account: 'Revolut' },
      { id: generateId('fin_'), name: 'Savings', value: '', placeholder: '3,800', account: 'HSBCUK' }
    ]
  };

  const SEED_CITY_OPTIONS_DATA = [
    { name: 'Current Location', latitude: null, longitude: null, is_current_location_trigger: true, order: 0 },
    { name: 'London', latitude: 51.5074, longitude: -0.1278, is_current_location_trigger: false, order: 1 },
    { name: 'Cairo', latitude: 30.0444, longitude: 31.2357, is_current_location_trigger: false, order: 2 },
    { name: 'Cape Town', latitude: -33.9249, longitude: 18.4241, is_current_location_trigger: false, order: 3 },
    { name: 'Amsterdam', latitude: 52.3676, longitude: 4.9041, is_current_location_trigger: false, order: 4 }
  ];
  // --- End of Hardcoded Seed Data ---

  // ... (The rest of DefaultDataManager, CityOptionsManager, DateTimeUtils remains the same as the previous "i want ?run_db_seed=true" response)
  const DefaultDataManager = { 
    configKey: "default_v1", data: null, error: null,
    async fetch() { this.error = null; try { this.data = await pb.collection('app_config').getFirstListItem(`config_key="${this.configKey}"`); if (!this.data) { this.error = "Default application configuration (app_config) not found in PocketBase."; throw new Error(this.error); } console.log("App defaults fetched successfully."); } catch (error) { console.error("Fatal Error: Could not initialize app defaults from PocketBase:", error); this.error = error.message || "Failed to load app settings from PocketBase."; this.data = null; } appDefaults = this.data; return this.data; },
    getPlannerTitle: function() { return this.data?.planner_title_default; },
    getUiConfig: function() { return deepCopy(this.data?.ui_config_default); },
    getTimes: function() { return deepCopy(this.data?.times_default); },
    getSchedule: function() { const s = deepCopy(this.data?.schedule_default); (s||[]).forEach(i=>(i.activities||[]).forEach(a=>{if(!a.id)a.id=generateId('act_');if(!a.streaks)a.streaks={ mon:0, tue:0, wed:0, thu:0, fri:0, sat:0, sun:0, current:0, longest:0 };})); return s;},
    getTasksCount: function() { return this.data?.tasks_default_count || 0; },
    getWorkoutPlan: function() { const p = deepCopy(this.data?.workout_plan_default); (p||[]).forEach(d=>(d.exercises||[]).forEach(e=>{if(!e.id)e.id=generateId('ex_');})); return p;},
    getMeals: function() { const m = deepCopy(this.data?.meals_default); (m||[]).forEach(i=>{if(!i.id)i.id=generateId('meal_');}); return m;},
    getGroceryList: function() { const l = deepCopy(this.data?.grocery_list_default); (l||[]).forEach(c=>{if(!c.id)c.id=generateId('gcat_');}); return l;},
    getGroceryBudgetPlaceholder: function() { return this.data?.grocery_budget_default_placeholder; },
    getBodyMeasurements: function() { const b = deepCopy(this.data?.body_measurements_default); (b||[]).forEach(i=>{if(!i.id)i.id=generateId('bm_');}); return b;},
    getFinancials: function() { const f = deepCopy(this.data?.financials_default); (f||[]).forEach(i=>{if(!i.id)i.id=generateId('fin_');}); return f;}
  };
  const CityOptionsManager = { 
    options: [],
    async fetch() { try { const cities = await pb.collection('city_options').getFullList({ sort: 'order' }); this.options = cities.map(c => ({ id: c.id, name: c.name, lat: c.latitude, lon: c.longitude, isCurrentLocationTrigger: c.is_current_location_trigger })); } catch (error) { console.error("Error fetching city options:", error); this.options = [{ name: 'London (Fallback)', lat: 51.5074, lon: -0.1278, isCurrentLocationTrigger: false }]; } return this.options; },
    get: function() { return this.options; }
  };
  const DateTimeUtils = { 
    getCurrentIsoWeek:()=> {const n=new Date(),d=new Date(Date.UTC(n.getFullYear(),n.getMonth(),n.getDate()));d.setUTCDate(d.getUTCDate()+4-(d.getUTCDay()||7));const y=new Date(Date.UTC(d.getUTCFullYear(),0,1));return`${d.getUTCFullYear()}-W${Math.ceil(((d-y)/864e5+1)/7).toString().padStart(2,"0")}`;},parseISOWeek:(s)=>{if(!/^\d{4}-W(0[1-9]|[1-4][0-9]|5[0-3])$/.test(s))return new Date();const[y,w]=s.split("-"),W=parseInt(w.substring(1)),d=new Date(Date.UTC(parseInt(y),0,1+(W-1)*7)),D=d.getUTCDay()||7;d.setUTCDate(d.getUTCDate()-D+1);return d;},getWeekDateRange:(d)=>{const s=new Date(d),e=new Date(s);e.setUTCDate(s.getUTCDate()+6);return`${DateTimeUtils.formatDate(s)}-${DateTimeUtils.formatDate(e)}`;},formatDate:(d)=>`${(d.getUTCMonth()+1).toString().padStart(2,"0")}/${d.getUTCDate().toString().padStart(2,"0")}`,formatShortDate:(i)=>{const n=new Date();n.setDate(n.getDate()+i);return`${n.getMonth()+1}/${n.getDate()}`;},formatPrayerTime:(s)=>{if(!s||typeof s!=="string")return"";const t=s.split(" ")[0],[h,m]=t.split(":");if(!h||!m)return"";let H=parseInt(h),M=parseInt(m);if(isNaN(H)||isNaN(M)||H<0||H>23||M<0||M>59)return"";const A=H>=12?"PM":"AM";H%=12;H=H||12;return`${H}:${M.toString().padStart(2,"0")}${A}`;},calculateQiyamTime:(f)=>{if(!f||typeof f!=="string")return"";const p=f.split(" ")[0].split(":");if(p.length<2)return"";let H=parseInt(p[0]),M=parseInt(p[1]);if(isNaN(H)||isNaN(M)||H<0||H>23||M<0||M>59)return"";let q=new Date();q.setHours(H,M,0,0);q.setHours(q.getHours()-1);return`${q.getHours().toString().padStart(2,"0")}:${q.getMinutes().toString().padStart(2,"0")}`;},
  };
  async function runDatabaseSeed(_this) { 
    console.log("Attempting to seed database..."); let seededSomething = false;
    try {
      const configKey = SEED_APP_CONFIG_DATA.config_key; let existingConfig = null;
      try { existingConfig = await pb.collection('app_config').getFirstListItem(`config_key="${configKey}"`); } catch (e) { if (e.status !== 404) throw e; }
      if (existingConfig) { await pb.collection('app_config').update(existingConfig.id, SEED_APP_CONFIG_DATA); console.log(`Updated app_config: ${configKey}`); }
      else { await pb.collection('app_config').create(SEED_APP_CONFIG_DATA); console.log(`Created app_config: ${configKey}`); }
      seededSomething = true; console.log("Seeding city_options. Deleting existing if any...");
      const existingCities = await pb.collection('city_options').getFullList();
      for (const city of existingCities) { await pb.collection('city_options').delete(city.id); }
      for (const cityData of SEED_CITY_OPTIONS_DATA) { await pb.collection('city_options').create(cityData); }
      console.log(`Seeded ${SEED_CITY_OPTIONS_DATA.length} city_options.`); seededSomething = true;
      _this.showErrorMessage("DB seed OK. Refresh without ?run_db_seed=true parameter.");
      const url = new URL(window.location.href); url.searchParams.delete('run_db_seed');
      window.history.replaceState({}, document.title, url.toString());
    } catch (error) { console.error("DATABASE SEEDING FAILED:", error); _this.showErrorMessage(`DB seed FAIL: ${error.message}. Check console.`); }
    return seededSomething;
  }

  // --- Main Alpine Data Object (continues) ---
  return {
    currentWeek: '', dateRange: '', city: 'London', saveStatus: 'saved', isOnline: navigator.onLine, pendingSync: [],
    showNotification: false, notificationMessage: '', showCitySelector: false, showWeekSelector: false,
    dropdownPosition: { top: 0, left: 0 }, currentDay: (new Date()).getDay(),
    plannerTitle: 'Loading Planner...', uiConfig: {}, times: [], schedule: [], tasks: [], workoutPlan: [],
    meals: [], groceryBudget: '', groceryList: [], bodyMeasurements: [], financials: [],
    cityOptions: [], savedWeeks: [], saveDataTimeout: null, notificationTimeout: null,

    async init() {
      isInitializing = true; console.log("App init starting...");
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.has('run_db_seed') && urlParams.get('run_db_seed') === 'true') { await runDatabaseSeed(this); return; }
      
      await DefaultDataManager.fetch(); 
      if (DefaultDataManager.error) { this.showErrorMessage(`CRITICAL: ${DefaultDataManager.error}. Ensure collections 'app_config', 'city_options' exist & 'app_config' is populated. Try '?run_db_seed=true'.`); this.plannerTitle = "Planner Config Error"; }
      else { this.plannerTitle = DefaultDataManager.getPlannerTitle() || "Weekly Planner"; }
      
      this.cityOptions = await CityOptionsManager.fetch();
      if (this.cityOptions.length > 0 && this.cityOptions.find(co => co.name === this.city) === undefined && this.cityOptions[0]) { this.city = this.cityOptions[0].name; }
      else if (this.cityOptions.length === 0) { this.city = "Error City"; }

      window.addEventListener('online', () => { this.isOnline = true; this.syncPendingData(); });
      window.addEventListener('offline', () => this.isOnline = false);
      document.addEventListener('click',e=>{if(!e.target.closest('.dropdown')&&!e.target.closest('.clickable')){this.showCitySelector=this.showWeekSelector=false;}});
      this.pendingSync = JSON.parse(localStorage.getItem('planner_pending_sync') || '[]');
      this.currentWeek = DateTimeUtils.getCurrentIsoWeek();
      this.dateRange = DateTimeUtils.getWeekDateRange(DateTimeUtils.parseISOWeek(this.currentWeek));
      await this.loadWeek(this.currentWeek, true); 
      if (appDefaults && !DefaultDataManager.error) { setInterval(() => { if (!isInitializing && this.hasSignificantChanges()) this.saveData(); }, 30000); }
      if (this.isOnline) this.syncPendingData();
      console.log("App init finished.");
    },

    applyDefaults() {
      if (!appDefaults || DefaultDataManager.error) { console.warn("applyDefaults: Defaults error. Minimal structures."); this.plannerTitle=appDefaults?.planner_title_default||"Planner (No Config)";this.uiConfig=appDefaults?.ui_config_default||{};this.times=appDefaults?.times_default||[];this.schedule=(appDefaults?.schedule_default||[]).map(s=>({...s,id:s.id||generateId('sec_'),activities:(s.activities||[]).map(a=>({...a,id:a.id||generateId('act_')}))}));this.tasks=Array(appDefaults?.tasks_default_count||0).fill(null).map((_,i)=>({id:generateId('task_'),num:'',priority:'',tag:'',description:'',date:'',completed:''}));this.workoutPlan=(appDefaults?.workout_plan_default||[]).map(d=>({...d,id:d.id||generateId('wpd_'),exercises:(d.exercises||[]).map(e=>({...e,id:e.id||generateId('ex_')}))}));this.meals=(appDefaults?.meals_default||[]).map(m=>({...m,id:m.id||generateId('meal_')}));this.groceryList=(appDefaults?.grocery_list_default||[]).map(g=>({...g,id:g.id||generateId('gcat_')}));this.groceryBudget=appDefaults?.grocery_budget_default_placeholder||'';this.bodyMeasurements=(appDefaults?.body_measurements_default||[]).map(b=>({...b,id:b.id||generateId('bm_')}));this.financials=(appDefaults?.financials_default||[]).map(f=>({...f,id:f.id||generateId('fin_')})); return; }
      this.plannerTitle=DefaultDataManager.getPlannerTitle()||"Weekly Planner";this.uiConfig=DefaultDataManager.getUiConfig()||{};this.times=DefaultDataManager.getTimes()||[];this.schedule=DefaultDataManager.getSchedule()||[];this.tasks=Array(DefaultDataManager.getTasksCount()).fill(null).map((_,i)=>({id:generateId('task_'),num:'',priority:'',tag:'',description:'',date:'',completed:''}));this.workoutPlan=DefaultDataManager.getWorkoutPlan()||[];this.meals=DefaultDataManager.getMeals()||[];this.groceryList=DefaultDataManager.getGroceryList()||[];this.groceryBudget=appDefaults?.grocery_budget_default_placeholder || '';this.bodyMeasurements=DefaultDataManager.getBodyMeasurements()||[];this.financials=DefaultDataManager.getFinancials()||[];
    },
    populateFieldsFromSaved(savedData) {
        const getDef=(fn,eV=undefined)=>appDefaults?fn.call(DefaultDataManager):eV;
        this.plannerTitle=savedData.planner_title||getDef(DefaultDataManager.getPlannerTitle,"Weekly Planner (Saved)");this.uiConfig=deepCopy(savedData.ui_config||getDef(DefaultDataManager.getUiConfig,{}));this.times=deepCopy(savedData.times_display||getDef(DefaultDataManager.getTimes,[]));
        const defSched=getDef(DefaultDataManager.getSchedule,[]);const savedSched=deepCopy(savedData.schedule_data||defSched);(savedSched||[]).forEach(s=>{s.id=s.id||generateId('sec_');(s.activities||[]).forEach(a=>{a.id=a.id||generateId('act_');if(!a.streaks)a.streaks={mon:0,tue:0,wed:0,thu:0,fri:0,sat:0,sun:0,current:0,longest:0};});});this.schedule=savedSched;
        const defTaskCnt=getDef(DefaultDataManager.getTasksCount,0);const taskCnt=(savedData.tasks_data?.length)?savedData.tasks_data.length:defTaskCnt;this.tasks=Array(taskCnt).fill(null).map((_,i)=>{const sT=savedData.tasks_data?.[i];return{id:sT?.id||generateId('task_'),num:this.validateValue(sT?.num),priority:this.validateValue(sT?.priority),tag:this.validateValue(sT?.tag),description:this.validateValue(sT?.description),date:this.validateValue(sT?.date),completed:this.validateValue(sT?.completed)};});
        const defWP=getDef(DefaultDataManager.getWorkoutPlan,[]);const savedWP=deepCopy(savedData.workout_plan_data||defWP);(savedWP||[]).forEach(d=>{d.id=d.id||generateId('wpd_');(d.exercises||[]).forEach(ex=>{ex.id=ex.id||generateId('ex_');});});this.workoutPlan=savedWP;
        const defM=getDef(DefaultDataManager.getMeals,[]);const savedM=deepCopy(savedData.meals_data||defM);(savedM||[]).forEach(m=>{m.id=m.id||generateId('meal_');});this.meals=savedM;
        this.groceryBudget=this.validateValue(savedData.grocery_budget||getDef(DefaultDataManager.getGroceryBudgetPlaceholder,''));
        const defGL=getDef(DefaultDataManager.getGroceryList,[]);const savedGL=deepCopy(savedData.grocery_list_data||defGL);(savedGL||[]).forEach(cat=>{cat.id=cat.id||generateId('gcat_');});this.groceryList=savedGL;
        const defBM=getDef(DefaultDataManager.getBodyMeasurements,[]);const savedBM=deepCopy(savedData.body_measurements_data||defBM);(savedBM||[]).forEach(bm=>{bm.id=bm.id||generateId('bm_');});this.bodyMeasurements=savedBM;
        const defFin=getDef(DefaultDataManager.getFinancials,[]);const savedFin=deepCopy(savedData.financials_data||defFin);(savedFin||[]).forEach(f=>{f.id=f.id||generateId('fin_');});this.financials=savedFin;
        this.city=savedData.city_name||this.city;lastSavedState=JSON.stringify(this.getCurrentDataStateForPersistence());
    },
    async loadWeek(isoWeek,isInitLoad=false){if(!appDefaults&&isInitLoad){await DefaultDataManager.fetch();if(DefaultDataManager.error){this.showErrorMessage(`CRITICAL: ${DefaultDataManager.error}. Cannot load week.`);if(isInitLoad)isInitializing=false;return;}this.cityOptions=await CityOptionsManager.fetch();if(this.cityOptions.length>0&&this.cityOptions.find(c=>c.name===this.city)===undefined&&this.cityOptions[0]){this.city=this.cityOptions[0].name;}else if(this.cityOptions.length===0){this.city="Error City";}}
    if(!appDefaults){this.showErrorMessage("Critical error: App defaults not loaded. Week load aborted.");if(isInitLoad)isInitializing=false;return;}
    if(!/^\d{4}-W(0[1-9]|[1-4][0-9]|5[0-3])$/.test(isoWeek)){this.showErrorMessage("Invalid week format");if(isInitLoad)isInitializing=false;return;}
    this.showWeekSelector=false;this.currentWeek=isoWeek;this.dateRange=DateTimeUtils.getWeekDateRange(DateTimeUtils.parseISOWeek(isoWeek));let rec=null;
    if(this.isOnline){try{rec=await pb.collection('planners').getFirstListItem(`week_id="${isoWeek}"`);}catch(e){if(e.status!==404)console.error("PB load error:",e);}}
    if(!rec){const ld=localStorage.getItem(`planner_${isoWeek}`);if(ld)try{rec=JSON.parse(ld);}catch(e){console.error(`Local parse error ${isoWeek}:`,e);rec=null;}}
    if(rec){this.populateFieldsFromSaved(rec);}else{this.applyDefaults();}
    this.calculateScores();if(this.times.every(t=>!t.value)){await this.fetchAndSetPrayerTimes();}
    if(isInitLoad){isInitializing=false;console.log("Initial load process finished.");}},
    getCurrentDataStateForPersistence(){return{week_id:this.currentWeek,date_range:this.dateRange,city_name:this.city,planner_title:this.plannerTitle,ui_config:this.uiConfig,times_display:this.times,schedule_data:this.schedule,tasks_data:this.tasks,workout_plan_data:this.workoutPlan,meals_data:this.meals,grocery_budget:this.groceryBudget,grocery_list_data:this.groceryList,body_measurements_data:this.bodyMeasurements,financials_data:this.financials};},
    saveData(){if(isInitializing)return;if(this.saveDataTimeout)clearTimeout(this.saveDataTimeout);this.saveStatus='saving';this.saveDataTimeout=setTimeout(async()=>{try{this.calculateScores();const data=this.getCurrentDataStateForPersistence();localStorage.setItem(`planner_${this.currentWeek}`,JSON.stringify(data));if(this.isOnline){await this.saveToPocketbase(this.currentWeek,data);this.pendingSync=this.pendingSync.filter(it=>!(it.weekId===this.currentWeek&&it.operation==='save'));localStorage.setItem('planner_pending_sync',JSON.stringify(this.pendingSync));}else{this.addToPendingSync(this.currentWeek,data,'save');}lastSavedState=JSON.stringify(data);this.saveStatus='saved';}catch(e){console.error("SaveData error:",e);this.saveStatus='error';this.showErrorMessage("Error saving: "+e.message);setTimeout(()=>this.saveStatus='saved',3000);}},750);},
    hasSignificantChanges(){if(isInitializing)return false;if(!lastSavedState)return true;return JSON.stringify(this.getCurrentDataStateForPersistence())!==lastSavedState;},
    addToPendingSync(wId,data,op='save'){this.pendingSync=this.pendingSync.filter(it=>!(it.weekId===wId&&it.operation===op));this.pendingSync.push({weekId:wId,data:data?deepCopy(data):null,operation:op,timestamp:new Date().toISOString()});localStorage.setItem('planner_pending_sync',JSON.stringify(this.pendingSync));},
    async syncPendingData(){if(!this.isOnline||this.pendingSync.length===0)return;const items=[...this.pendingSync];let curPend=[...this.pendingSync];for(const item of items){try{if(item.operation==='delete'){await this.deleteFromPocketbase(item.weekId);}else{await this.saveToPocketbase(item.weekId,item.data);}curPend=curPend.filter(i=>i.timestamp!==item.timestamp);}catch(e){console.error("Sync error:",item,e);}}this.pendingSync=curPend;localStorage.setItem('planner_pending_sync',JSON.stringify(this.pendingSync));},
    async saveToPocketbase(wId,data){try{const ex=await pb.collection('planners').getFirstListItem(`week_id="${wId}"`).catch(e=>{if(e.status===404)return null;throw e;});if(ex){await pb.collection('planners').update(ex.id,data);}else{await pb.collection('planners').create(data);}}catch(e){console.error(`PB save error ${wId}:`,e,"Data:",data);throw e;}},
    async deleteFromPocketbase(wId){try{const ex=await pb.collection('planners').getFirstListItem(`week_id="${wId}"`).catch(e=>{if(e.status===404)return null;throw e;});if(ex)await pb.collection('planners').delete(ex.id);}catch(e){console.error(`PB delete error ${wId}:`,e);throw e;}},
    editInline(event,type,index,defaultValue=''){const el=event.currentTarget;const origTxt=el.innerText;const isTA=['mealIngredients','groceryCategoryItems'].includes(type);const inp=document.createElement(isTA?'textarea':'input');inp.type='text';inp.value=defaultValue;inp.className=isTA?'inline-edit-textarea':'inline-edit-input';if(isTA)inp.rows=3;el.innerHTML='';el.appendChild(inp);inp.focus();inp.select();const saveIt=()=>{const newVal=inp.value;let sIdxMap=-1;if(type==='sectionName'||(typeof index==='object'&&index!==null&&typeof index.sIdx==='number')){sIdxMap=this.schedule.length-1-(typeof index==='object'?index.sIdx:index);}
    switch(type){case'plannerTitle':this.plannerTitle=newVal;break;case'timeLabel':if(this.times[index])this.times[index].label=newVal;break;case'sectionName':if(sIdxMap!==-1&&this.schedule[sIdxMap])this.schedule[sIdxMap].name=newVal;break;case'activityPrefix':if(sIdxMap!==-1&&this.schedule[sIdxMap]?.activities[index.aIdx]){const a=this.schedule[sIdxMap].activities[index.aIdx];const p=a.name.split(':');a.name=newVal.trim()+(p.length>1?':'+p.slice(1).join(':').trimStart():'');}break;case'activityName':if(sIdxMap!==-1&&this.schedule[sIdxMap]?.activities[index.aIdx]){const a=this.schedule[sIdxMap].activities[index.aIdx];const p=a.name.split(':');a.name=(p.length>1&&p[0].trim()?p[0].trim()+': ':'')+newVal;}break;case'maxValue':if(sIdxMap!==-1&&this.schedule[sIdxMap]?.activities[index.aIdx]?.days[index.day]){this.schedule[sIdxMap].activities[index.aIdx].days[index.day].max=parseInt(newVal)||0;}break;case'maxScore':if(sIdxMap!==-1&&this.schedule[sIdxMap]?.activities[index.aIdx]){this.schedule[sIdxMap].activities[index.aIdx].maxScore=parseInt(newVal)||0;}break;case'sectionTitle':if(this.uiConfig.sectionTitles&&this.uiConfig.sectionTitles[index]!==undefined)this.uiConfig.sectionTitles[index]=newVal;break;case'mainTableHeader':if(this.uiConfig.mainTableHeaders&&this.uiConfig.mainTableHeaders[index]!==undefined)this.uiConfig.mainTableHeaders[index]=newVal;break;case'dayHeader':if(this.uiConfig.dayHeaders&&this.uiConfig.dayHeaders[index]!==undefined)this.uiConfig.dayHeaders[index]=newVal;break;case'maxHeader':if(this.uiConfig.maxHeaders&&this.uiConfig.maxHeaders[index]!==undefined)this.uiConfig.maxHeaders[index]=newVal;break;case'taskHeader':if(this.uiConfig.taskHeaders&&this.uiConfig.taskHeaders[index]!==undefined)this.uiConfig.taskHeaders[index]=newVal;break;case'workoutDayName':if(this.workoutPlan[index])this.workoutPlan[index].name=newVal;break;case'exercisePrefix':if(this.workoutPlan[index.dayIdx]?.exercises[index.exIdx]){this.workoutPlan[index.dayIdx].exercises[index.exIdx].prefix=newVal;}break;case'exerciseName':if(this.workoutPlan[index.dayIdx]?.exercises[index.exIdx]){this.workoutPlan[index.dayIdx].exercises[index.exIdx].name=newVal;}break;case'mealName':if(this.meals[index])this.meals[index].name=newVal;break;case'mealIngredients':if(this.meals[index])this.meals[index].ingredients=newVal;break;case'groceryCategoryName':if(this.groceryList[index])this.groceryList[index].name=newVal;break;case'groceryCategoryItems':if(this.groceryList[index])this.groceryList[index].items=newVal;break;case'measurementName':if(this.bodyMeasurements[index])this.bodyMeasurements[index].name=newVal;break;case'financialName':if(this.financials[index])this.financials[index].name=newVal;break;case'financialAccount':if(this.financials[index])this.financials[index].account=newVal;break;}
    if(inp.parentNode===el)el.removeChild(inp);el.innerText=newVal||origTxt;this.saveData();};const onKD=(e)=>{if(e.key==='Enter'&&!isTA){cleanSave();e.preventDefault();}else if(e.key==='Escape'){cleanRestore();}};const cleanSave=()=>{inp.removeEventListener('blur',cleanSave);inp.removeEventListener('keydown',onKD);saveIt();};const cleanRestore=()=>{inp.removeEventListener('blur',cleanSave);inp.removeEventListener('keydown',onKD);if(inp.parentNode===el)el.removeChild(inp);el.innerText=origTxt;};inp.addEventListener('blur',cleanSave);inp.addEventListener('keydown',onKD);},
    toggleTaskCompletion(task){task.completed=task.completed==='✓'?'☐':'✓';this.saveData();},showErrorMessage(msg){this.notificationMessage=msg;this.showNotification=true;if(this.notificationTimeout)clearTimeout(this.notificationTimeout);this.notificationTimeout=setTimeout(()=>this.showNotification=false,7000);},validateValue(val,isNum=false,min=null,max=null){const sVal=String(val||'');if(sVal.trim()==='')return'';if(isNum){constn=parseFloat(sVal);if(isNaN(n))return'';if(min!==null&&n<min)return min.toString();if(max!==null&&n>max)return max.toString();return n.toString();}return sVal;},validateTextInput(e){this.saveData();},validateNumberInput(e){this.calculateScores();this.saveData();},
    calculateScores(){if(!this.schedule||this.schedule.length===0)return;const dT={mon:0,tue:0,wed:0,thu:0,fri:0,sat:0,sun:0};const dK=['mon','tue','wed','thu','fri','sat','sun'];this.schedule.forEach(s=>{if(s.name==='TOTAL')return;(s.activities||[]).forEach(a=>{let aS=0;Object.entries(a.days||{}).forEach(([d,dD])=>{if(!dD)return;const v=parseInt(dD.value)||0;const mV=parseInt(dD.max)||0;if(v>0&&mV>0){dT[d]=(dT[d]||0)+Math.min(v,mV);aS+=Math.min(v,mV);}dD.value=v===0?'':v.toString();});a.score=aS;if(!a.streaks)a.streaks={mon:0,tue:0,wed:0,thu:0,fri:0,sat:0,sun:0,current:0,longest:0};const tI=this.currentDay===0?6:this.currentDay-1;let cS=0;for(let i=0;i<7;i++){const dTI=(tI-i+7)%7;const dk=dK[dTI];if(a.days[dk]&&(parseInt(a.days[dk].value)||0)>0&&(parseInt(a.days[dk].max)||0)>0){cS++;}else if(a.days[dk]&&(parseInt(a.days[dk].max)||0)>0){break;}}a.streaks.current=cS;a.streaks.longest=Math.max(a.streaks.longest||0,cS);});});const tS=this.schedule.find(s=>s.name==='TOTAL');if(tS?.activities?.[0]){const tA=tS.activities[0];let gTS=0;let gTMS=0;dK.forEach(d=>{let dM=0;this.schedule.forEach(s=>{if(s.name!=='TOTAL'){(s.activities||[]).forEach(act=>{if(act.days[d]&&act.days[d].max){dM+=parseInt(act.days[d].max)||0;}});}});if(tA.days[d])tA.days[d].max=dM;});Object.entries(dT).forEach(([d,tot])=>{if(tA.days[d])tA.days[d].value=tot.toString();gTS+=tot;});tA.score=gTS;this.schedule.forEach(s=>{if(s.name!=='TOTAL'){(s.activities||[]).forEach(act=>gTMS+=(parseInt(act.maxScore)||0));}});tA.maxScore=gTMS;}},
    async fetchAndSetPrayerTimes(){const cD=this.cityOptions.find(c=>c.name===this.city);if(cD){if(cD.isCurrentLocationTrigger)await this.getDevicePrayerTimes();else await this.fetchPrayerTimesForCoords(cD.lat,cD.lon);}else{await this.getDevicePrayerTimes();}},async getDevicePrayerTimes(){try{const p=await new Promise((rs,rj)=>navigator.geolocation.getCurrentPosition(rs,rj,{timeout:7000,maximumAge:60000,enableHighAccuracy:false}));const{latitude:lat,longitude:lon}=p.coords;try{const gR=await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10&accept-language=en`);if(!gR.ok)throw new Error(`Geocoding API error: ${gR.status}`);const gD=await gR.json();this.city=gD.address?.city||gD.address?.town||gD.address?.village||"Current Location";}catch(e){this.city="Current Location";console.warn("Geocoding error:",e)}await this.fetchPrayerTimesForCoords(lat,lon);}catch(e){console.warn("Geolocation error:",e);this.showErrorMessage("Could not get location. Using London.");const lO=this.cityOptions.find(c=>c.name==='London');if(lO){this.city=lO.name;await this.fetchPrayerTimesForCoords(lO.lat,lO.lon);}else{this.city="London";await this.fetchPrayerTimesForCoords(51.5074,-0.1278);}}},
    async fetchPrayerTimesForCoords(lat,lon){const tD=new Date(),d=tD.getDate(),m=tD.getMonth()+1,y=tD.getFullYear();const cK=`prayer_times_${y}_${m}_${d}_${lat.toFixed(2)}_${lon.toFixed(2)}`;constcD=localStorage.getItem(cK);if(cD){try{this.setPrayerTimesDisplay(JSON.parse(cD));return;}catch(e){localStorage.removeItem(cK);}}try{const r=await fetch(`https://api.aladhan.com/v1/calendar/${y}/${m}?latitude=${lat}&longitude=${lon}&method=2`);if(!r.ok)throw new Error(`Aladhan API error: ${r.statusText}(${r.status})`);const aD=await r.json();if(aD.code===200&&aD.data?.[d-1]?.timings){const T=aD.data[d-1].timings;localStorage.setItem(cK,JSON.stringify(T));this.setPrayerTimesDisplay(T);}else throw new Error("Invalid Aladhan API data");}catch(e){console.error("Fetch prayer times error:",e);this.showErrorMessage("Failed to fetch prayer times. Defaults used.");this.setPrayerTimesDisplay({Fajr:"05:30",Dhuhr:"12:30",Asr:"15:45",Maghrib:"18:30",Isha:"20:00"});}},
    setPrayerTimesDisplay(T){const Q=DateTimeUtils.calculateQiyamTime(T.Fajr);const M={Q:Q,F:T.Fajr,D:T.Dhuhr,A:T.Asr,M:T.Maghrib,I:T.Isha};let C=false;this.times.forEach(ts=>{const nT=DateTimeUtils.formatPrayerTime(M[ts.label]);if(ts.value!==nT){ts.value=nT;C=true;}});if(C&&!isInitializing)this.saveData();},
    fetchSavedWeeks(){const wD=new Map();const cIW=DateTimeUtils.getCurrentIsoWeek();const aUW=(iso,dr,src,isC)=>{const ex=wD.get(iso);const nDR=dr||DateTimeUtils.getWeekDateRange(DateTimeUtils.parseISOWeek(iso));if(!ex||(src==='pocketbase'&&ex.source!=='pocketbase')||(src==='local'&&ex.source==='current')){wD.set(iso,{iso_week:iso,dateRange:nDR,source:src,isCurrent:isC});}else if(ex&&!ex.dateRange&&nDR){ex.dateRange=nDR;}};aUW(cIW,DateTimeUtils.getWeekDateRange(DateTimeUtils.parseISOWeek(cIW)),'current',true);const uD=()=>{this.savedWeeks=Array.from(wD.values()).sort((a,b)=>(a.isCurrent&&!b.isCurrent)?-1:(!a.isCurrent&&b.isCurrent)?1:b.iso_week.localeCompare(a.iso_week));};if(this.isOnline){pb.collection('planners').getFullList({sort:'-week_id',fields:'week_id,date_range'}).then(r=>{r.forEach(it=>aUW(it.week_id,it.date_range,'pocketbase',it.week_id===cIW));uD();}).catch(e=>{console.error("PB fetch saved weeks error:",e);for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k?.startsWith('planner_')&&!k.includes('pending_sync')){const iw=k.replace('planner_','');try{const d=JSON.parse(localStorage.getItem(k));aUW(iw,d.date_range,'local',iw===cIW);}catch(le){}}}uD();});}else{for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k?.startsWith('planner_')&&!k.includes('pending_sync')){const iw=k.replace('planner_','');try{const d=JSON.parse(localStorage.getItem(k));aUW(iw,d.date_range,'local',iw===cIW);}catch(e){}}}uD();}},
    confirmLoadWeek(isoWeek){if(this.hasSignificantChanges()&&isoWeek!==this.currentWeek){if(confirm("Unsaved changes. Load anyway?"))this.loadWeek(isoWeek);}else{this.loadWeek(isoWeek);}},confirmDeleteWeek(isoWeek){if(confirm(`Delete schedule for ${isoWeek}?`))this.deleteWeek(isoWeek);},async deleteWeek(isoWeek){localStorage.removeItem(`planner_${isoWeek}`);if(this.isOnline){try{await this.deleteFromPocketbase(isoWeek);}catch(e){this.addToPendingSync(isoWeek,null,'delete');}}else{this.addToPendingSync(isoWeek,null,'delete');}this.savedWeeks=this.savedWeeks.filter(w=>w.iso_week!==isoWeek);if(this.currentWeek===isoWeek){this.currentWeek=DateTimeUtils.getCurrentIsoWeek();await this.loadWeek(this.currentWeek);}},selectCity(cO){this.city=cO.name;this.showCitySelector=false;this.fetchAndSetPrayerTimes().then(()=>this.saveData());},
    addNewTask(){const dD=(appDefaults?.tasks_default?.[0]?.description||'');this.tasks.push({id:generateId('task_'),num:'',priority:'',tag:'',description:dD,date:'',completed:''});this.saveData();},deleteTask(idx){if(idx>=0&&idx<this.tasks.length){this.tasks.splice(idx,1);this.saveData();}},
    addNewMeal(){const n=prompt("New meal name:");if(n?.trim()){const dI=(appDefaults?.meals_default?.[0]?.ingredients||'');this.meals.push({id:generateId('meal_'),name:n.trim(),ingredients:dI});this.saveData();}},deleteMeal(idx){if(idx>=0&&idx<this.meals.length){this.meals.splice(idx,1);this.saveData();}},
    addNewActivityToSection(sIdxMap){const sN=this.schedule[sIdxMap]?.name||'section';const n=prompt(`New activity for ${sN}:`);if(n?.trim()&&this.schedule[sIdxMap]){let dD={};const dAD=(appDefaults?.schedule_default?.find(s=>s.name===this.schedule[sIdxMap].name)||appDefaults?.schedule_default?.[0])?.activities?.[0]?.days;if(dAD){dD=deepCopy(dAD);for(const day in dD)dD[day].value='';}else{['mon','tue','wed','thu','fri','sat','sun'].forEach(d=>dD[d]={value:'',max:1});}this.schedule[sIdxMap].activities.push({id:generateId('act_'),name:n.trim(),days:dD,score:0,maxScore:(appDefaults?.schedule_default?.[0]?.activities?.[0]?.maxScore||7),streaks:{mon:0,tue:0,wed:0,thu:0,fri:0,sat:0,sun:0,current:0,longest:0}});this.saveData();}},
    deleteActivity(sIdxMap,actId){if(this.schedule[sIdxMap]?.activities){const idx=this.schedule[sIdxMap].activities.findIndex(a=>a.id===actId);if(idx>-1){this.schedule[sIdxMap].activities.splice(idx,1);this.saveData();}}},
    addNewExerciseToWorkoutDay(dIdx){const dN=this.workoutPlan[dIdx]?.name||'day';const n=prompt(`New exercise for ${dN}:`);if(n?.trim()&&this.workoutPlan[dIdx]){const dE=appDefaults?.workout_plan_default?.[0]?.exercises?.[0];this.workoutPlan[dIdx].exercises.push({id:generateId('ex_'),prefix:dE?.prefix||'• ',name:n.trim(),weight:'',sets:'',reps:'',defaultWeight:dE?.defaultWeight||'10',defaultSets:dE?.defaultSets||'3',defaultReps:dE?.defaultReps||'10'});this.saveData();}},
    deleteExerciseFromWorkoutDay(dIdx,exId){if(this.workoutPlan[dIdx]?.exercises){const idx=this.workoutPlan[dIdx].exercises.findIndex(ex=>ex.id===exId);if(idx>-1){this.workoutPlan[dIdx].exercises.splice(idx,1);this.saveData();}}},
    addNewGroceryCategory(){const n=prompt("New grocery category:");if(n?.trim()){this.groceryList.push({id:generateId('gcat_'),name:n.trim(),items:(appDefaults?.grocery_list_default?.[0]?.items||'')});this.saveData();}},deleteGroceryCategory(idx){if(idx>=0&&idx<this.groceryList.length){this.groceryList.splice(idx,1);this.saveData();}},
    addNewBodyMeasurement(){const n=prompt("New measurement name:");if(n?.trim()){this.bodyMeasurements.push({id:generateId('bm_'),name:n.trim(),value:'',placeholder:(appDefaults?.body_measurements_default?.[0]?.placeholder||'0')});this.saveData();}},deleteBodyMeasurement(idx){if(idx>=0&&idx<this.bodyMeasurements.length){this.bodyMeasurements.splice(idx,1);this.saveData();}},
    addNewFinancialItem(){const n=prompt("New financial item:");if(n?.trim()){this.financials.push({id:generateId('fin_'),name:n.trim(),value:'',placeholder:(appDefaults?.financials_default?.[0]?.placeholder||'0'),account:''});this.saveData();}},deleteFinancialItem(idx){if(idx>=0&&idx<this.financials.length){this.financials.splice(idx,1);this.saveData();}}
  };
}
