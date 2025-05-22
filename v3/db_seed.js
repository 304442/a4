// File: db_seed.js
// To use: 1. Ensure pocketbase.umd.js is loaded before this script in HTML.
//         2. Navigate to index.html?seed=1
//         3. After successful completion, this script will remove the query param and alert.
//            Then, remove this script tag from index.html for normal operation.

(async function () {
    const urlParams = new URLSearchParams(window.location.search);
    // Check for ?seed=1
    if (!(urlParams.has('seed') && urlParams.get('seed') === '1')) {
        return;
    }

    if (sessionStorage.getItem('db_seed_completed_successfully')) {
        console.log("DB Seeder: Already completed successfully in this session. Removing param if present and skipping.");
        const currentUrl = new URL(window.location.href);
        if (currentUrl.searchParams.has('seed')) {
            currentUrl.searchParams.delete('seed');
            window.history.replaceState({}, document.title, currentUrl.toString());
        }
        return;
    }

    if (typeof PocketBase === 'undefined') {
        alert("PocketBase library is not loaded. Cannot run DB seed. Make sure pocketbase.umd.js is included before db_seed.js in your HTML.");
        console.error("PocketBase library is not loaded. Cannot run DB seed.");
        return;
    }

    const PB_BASE_URL = '/';
    const pbSeed = new PocketBase(PB_BASE_URL);
    pbSeed.autoCancellation(false);

    function generateSeedId(prefix = 'seed_') { 
        return prefix + Date.now().toString(36).slice(-4) + Math.random().toString(36).substr(2, 3);
    }

    // --- FULL SEED DATA (From your original script.js, with IDs added for consistency if items are objects) ---
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
          { name: 'QIYAM', id: generateSeedId('sec_'), activities: [ { id: generateSeedId('act_'), name: 'DAILY: Wakeup early', days: { mon: { value: '', max: 1 }, tue: { value: '', max: 1 }, wed: { value: '', max: 1 }, thu: { value: '', max: 1 }, fri: { value: '', max: 1 }, sat: { value: '', max: 1 }, sun: { value: '', max: 1 } }, score: 0, maxScore: 7, streaks: { mon:0, tue:0, wed:0, thu:0, fri:0, sat:0, sun:0, current:0, longest:0 }}, { id: generateSeedId('act_'), name: 'DAILY: Qiyam/Tahajjud', days: { mon: { value: '', max: 1 }, tue: { value: '', max: 1 }, wed: { value: '', max: 1 }, thu: { value: '', max: 1 }, fri: { value: '', max: 1 }, sat: { value: '', max: 1 }, sun: { value: '', max: 1 } }, score: 0, maxScore: 7, streaks: { mon:0, tue:0, wed:0, thu:0, fri:0, sat:0, sun:0, current:0, longest:0 }}, { id: generateSeedId('act_'), name: 'DAILY: Nutty Pudding', days: { mon: { value: '', max: 1 }, tue: { value: '', max: 1 }, wed: { value: '', max: 1 }, thu: { value: '', max: 1 }, fri: { value: '', max: 1 }, sat: { value: '', max: 1 }, sun: { value: '', max: 1 } }, score: 0, maxScore: 7, streaks: { mon:0, tue:0, wed:0, thu:0, fri:0, sat:0, sun:0, current:0, longest:0 }} ]},
          { name: 'FAJR', id: generateSeedId('sec_'), activities: [ { id: generateSeedId('act_'), name: 'DAILY: Fajr prayer', days: { mon: { value: '', max: 1 }, tue: { value: '', max: 1 }, wed: { value: '', max: 1 }, thu: { value: '', max: 1 }, fri: { value: '', max: 1 }, sat: { value: '', max: 1 }, sun: { value: '', max: 1 } }, score: 0, maxScore: 7, streaks: { mon:0, tue:0, wed:0, thu:0, fri:0, sat:0, sun:0, current:0, longest:0 }}, { id: generateSeedId('act_'), name: 'DAILY: Quran - 1 Juz', days: { mon: { value: '', max: 1 }, tue: { value: '', max: 1 }, wed: { value: '', max: 1 }, thu: { value: '', max: 1 }, fri: { value: '', max: 1 }, sat: { value: '', max: 1 }, sun: { value: '', max: 1 } }, score: 0, maxScore: 7, streaks: { mon:0, tue:0, wed:0, thu:0, fri:0, sat:0, sun:0, current:0, longest:0 }}, { id: generateSeedId('act_'), name: 'DAILY: 5min Cold Shower', days: { mon: { value: '', max: 1 }, tue: { value: '', max: 1 }, wed: { value: '', max: 1 }, thu: { value: '', max: 1 }, fri: { value: '', max: 1 }, sat: { value: '', max: 1 }, sun: { value: '', max: 1 } }, score: 0, maxScore: 7, streaks: { mon:0, tue:0, wed:0, thu:0, fri:0, sat:0, sun:0, current:0, longest:0 }} ]},
          { name: '7AM - 9AM', id: generateSeedId('sec_'), activities: [ { id: generateSeedId('act_'), name: 'MON/THU: COMMUTE', days: { mon: { value: '', max: 1 }, thu: { value: '', max: 1 } }, score: 0, maxScore: 2, streaks: { mon:0, tue:0, wed:0, thu:0, fri:0, sat:0, sun:0, current:0, longest:0 } }, { id: generateSeedId('act_'), name: 'TUE/WED/FRI: Reading/Study (book/course/skill)', days: { tue: { value: '', max: 1 }, wed: { value: '', max: 1 }, fri: { value: '', max: 1 } }, score: 0, maxScore: 3, streaks: { mon:0, tue:0, wed:0, thu:0, fri:0, sat:0, sun:0, current:0, longest:0 } }, { id: generateSeedId('act_'), name: 'SAT: Errands, Grocery shopping, Meal prep', days: { sat: { value: '', max: 3 } }, score: 0, maxScore: 3, streaks: { mon:0, tue:0, wed:0, thu:0, fri:0, sat:0, sun:0, current:0, longest:0 } }, { id: generateSeedId('act_'), name: 'SUN: House cleaning, laundry', days: { sun: { value: '', max: 2 } }, score: 0, maxScore: 2, streaks: { mon:0, tue:0, wed:0, thu:0, fri:0, sat:0, sun:0, current:0, longest:0 } } ]},
          { name: '9AM - 5PM', id: generateSeedId('sec_'), activities: [ { id: generateSeedId('act_'), name: 'MON - FRI: Work', days: { mon: { value: '', max: 1 }, tue: { value: '', max: 1 }, wed: { value: '', max: 1 }, thu: { value: '', max: 1 }, fri: { value: '', max: 1 } }, score: 0, maxScore: 5, streaks: { mon:0, tue:0, wed:0, thu:0, fri:0, sat:0, sun:0, current:0, longest:0 } }, { id: generateSeedId('act_'), name: 'DAILY: ZeroInbox (E1, E2, E3, E4, LI, Slack)', days: { mon: { value: '', max: 6 }, tue: { value: '', max: 6 }, wed: { value: '', max: 6 }, thu: { value: '', max: 6 }, fri: { value: '', max: 6 } }, score: 0, maxScore: 30, streaks: { mon:0, tue:0, wed:0, thu:0, fri:0, sat:0, sun:0, current:0, longest:0 } }, { id: generateSeedId('act_'), name: 'SAT/SUN: Nature time / Outdoor Activity / Adventure', days: { sat: { value: '', max: 1 }, sun: { value: '', max: 1 } }, score: 0, maxScore: 2, streaks: { mon:0, tue:0, wed:0, thu:0, fri:0, sat:0, sun:0, current:0, longest:0 } } ]},
          { name: 'DHUHR', id: generateSeedId('sec_'), activities: [ { id: generateSeedId('act_'), name: 'DAILY: Dhuhr prayer', days: { mon: { value: '', max: 1 }, tue: { value: '', max: 1 }, wed: { value: '', max: 1 }, thu: { value: '', max: 1 }, fri: { value: '', max: 1 }, sat: { value: '', max: 1 }, sun: { value: '', max: 1 } }, score: 0, maxScore: 7, streaks: { mon:0, tue:0, wed:0, thu:0, fri:0, sat:0, sun:0, current:0, longest:0 } }, { id: generateSeedId('act_'), name: 'TUE/WED/FRI: Sun walk (30-45 minutes)', days: { tue: { value: '', max: 1 }, wed: { value: '', max: 1 }, fri: { value: '', max: 1 } }, score: 0, maxScore: 3, streaks: { mon:0, tue:0, wed:0, thu:0, fri:0, sat:0, sun:0, current:0, longest:0 } }, { id: generateSeedId('act_'), name: 'FRI: £10 Sadaqa', days: { fri: { value: '', max: 1 } }, score: 0, maxScore: 1, streaks: { mon:0, tue:0, wed:0, thu:0, fri:0, sat:0, sun:0, current:0, longest:0 } } ]},
          { name: 'ASR', id: generateSeedId('sec_'), activities: [ { id: generateSeedId('act_'), name: 'DAILY: Asr prayer', days: { mon: { value: '', max: 1 }, tue: { value: '', max: 1 }, wed: { value: '', max: 1 }, thu: { value: '', max: 1 }, fri: { value: '', max: 1 }, sat: { value: '', max: 1 }, sun: { value: '', max: 1 } }, score: 0, maxScore: 7, streaks: { mon:0, tue:0, wed:0, thu:0, fri:0, sat:0, sun:0, current:0, longest:0 } } ]},
          { name: '5PM - 6:30PM', id: generateSeedId('sec_'), activities: [ { id: generateSeedId('act_'), name: 'MON/THU: COMMUTE', days: { mon: { value: '', max: 1 }, thu: { value: '', max: 1 } }, score: 0, maxScore: 2, streaks: { mon:0, tue:0, wed:0, thu:0, fri:0, sat:0, sun:0, current:0, longest:0 } }, { id: generateSeedId('act_'), name: 'TUE/WED/FRI: Workout', days: { tue: { value: '', max: 1 }, wed: { value: '', max: 1 }, fri: { value: '', max: 1 } }, score: 0, maxScore: 3, streaks: { mon:0, tue:0, wed:0, thu:0, fri:0, sat:0, sun:0, current:0, longest:0 } }, { id: generateSeedId('act_'), name: 'TUE/WED/FRI: Third Meal', days: { tue: { value: '', max: 1 }, wed: { value: '', max: 1 }, fri: { value: '', max: 1 } }, score: 0, maxScore: 3, streaks: { mon:0, tue:0, wed:0, thu:0, fri:0, sat:0, sun:0, current:0, longest:0 } } ]},
          { name: '6:30PM - ISHA', id: generateSeedId('sec_'), activities: [ { id: generateSeedId('act_'), name: 'MON/TUE/WED/THU: Personal', days: { mon: { value: '', max: 1 }, tue: { value: '', max: 1 }, wed: { value: '', max: 1 }, thu: { value: '', max: 1 } }, score: 0, maxScore: 4, streaks: { mon:0, tue:0, wed:0, thu:0, fri:0, sat:0, sun:0, current:0, longest:0 } }, { id: generateSeedId('act_'), name: 'DAILY: Family/Friends/Date calls(M, WA, Phone)', days: { mon: { value: '', max: 3 }, tue: { value: '', max: 3 }, wed: { value: '', max: 3 }, thu: { value: '', max: 3 } }, score: 0, maxScore: 12, streaks: { mon:0, tue:0, wed:0, thu:0, fri:0, sat:0, sun:0, current:0, longest:0 } }, { id: generateSeedId('act_'), name: 'FRI/SAT/SUN: Family/Friends/Date visits/outings/activities', days: { fri: { value: '', max: 3 }, sat: { value: '', max: 3 }, sun: { value: '', max: 3 } }, score: 0, maxScore: 9, streaks: { mon:0, tue:0, wed:0, thu:0, fri:0, sat:0, sun:0, current:0, longest:0 } } ]},
          { name: 'MAGHRIB', id: generateSeedId('sec_'), activities: [ { id: generateSeedId('act_'), name: 'DAILY: Maghrib prayer', days: { mon: { value: '', max: 1 }, tue: { value: '', max: 1 }, wed: { value: '', max: 1 }, thu: { value: '', max: 1 }, fri: { value: '', max: 1 }, sat: { value: '', max: 1 }, sun: { value: '', max: 1 } }, score: 0, maxScore: 7, streaks: { mon:0, tue:0, wed:0, thu:0, fri:0, sat:0, sun:0, current:0, longest:0 } }, { id: generateSeedId('act_'), name: 'DAILY: Super Veggie', days: { mon: { value: '', max: 1 }, tue: { value: '', max: 1 }, wed: { value: '', max: 1 }, thu: { value: '', max: 1 }, fri: { value: '', max: 1 }, sat: { value: '', max: 1 }, sun: { value: '', max: 1 } }, score: 0, maxScore: 7, streaks: { mon:0, tue:0, wed:0, thu:0, fri:0, sat:0, sun:0, current:0, longest:0 } } ]},
          { name: 'ISHA', id: generateSeedId('sec_'), activities: [ { id: generateSeedId('act_'), name: 'DAILY: Isha prayer', days: { mon: { value: '', max: 1 }, tue: { value: '', max: 1 }, wed: { value: '', max: 1 }, thu: { value: '', max: 1 }, fri: { value: '', max: 1 }, sat: { value: '', max: 1 }, sun: { value: '', max: 1 } }, score: 0, maxScore: 7, streaks: { mon:0, tue:0, wed:0, thu:0, fri:0, sat:0, sun:0, current:0, longest:0 } }, { id: generateSeedId('act_'), name: 'DAILY: Sleep early', days: { mon: { value: '', max: 1 }, tue: { value: '', max: 1 }, wed: { value: '', max: 1 }, thu: { value: '', max: 1 }, fri: { value: '', max: 1 }, sat: { value: '', max: 1 }, sun: { value: '', max: 1 } }, score: 0, maxScore: 7, streaks: { mon:0, tue:0, wed:0, thu:0, fri:0, sat:0, sun:0, current:0, longest:0 } } ]},
          { name: 'ALLDAY', id: generateSeedId('sec_'), activities: [ { id: generateSeedId('act_'), name: 'DAILY: No Doomscrolling; (FB, YTB, LKDN, & IG)', days: { mon: { value: '', max: 4 }, tue: { value: '', max: 4 }, wed: { value: '', max: 4 }, thu: { value: '', max: 4 }, fri: { value: '', max: 4 }, sat: { value: '', max: 4 }, sun: { value: '', max: 4 } }, score: 0, maxScore: 28, streaks: { mon:0, tue:0, wed:0, thu:0, fri:0, sat:0, sun:0, current:0, longest:0 } }, { id: generateSeedId('act_'), name: 'DAILY: No Fap; (P, & M)', days: { mon: { value: '', max: 2 }, tue: { value: '', max: 2 }, wed: { value: '', max: 2 }, thu: { value: '', max: 2 }, fri: { value: '', max: 2 }, sat: { value: '', max: 2 }, sun: { value: '', max: 2 } }, score: 0, maxScore: 14, streaks: { mon:0, tue:0, wed:0, thu:0, fri:0, sat:0, sun:0, current:0, longest:0 } }, { id: generateSeedId('act_'), name: 'DAILY: No Processed; (Sugar, RefinedFlour, SeedOils, Soda, FastFood)', days: { mon: { value: '', max: 5 }, tue: { value: '', max: 5 }, wed: { value: '', max: 5 }, thu: { value: '', max: 5 }, fri: { value: '', max: 5 }, sat: { value: '', max: 5 }, sun: { value: '', max: 5 } }, score: 0, maxScore: 35, streaks: { mon:0, tue:0, wed:0, thu:0, fri:0, sat:0, sun:0, current:0, longest:0 } }, { id: generateSeedId('act_'), name: 'MON/THU: Fasting', days: { mon: { value: '', max: 1 }, thu: { value: '', max: 1 } }, score: 0, maxScore: 2, streaks: { mon:0, tue:0, wed:0, thu:0, fri:0, sat:0, sun:0, current:0, longest:0 } }, { id: generateSeedId('act_'), name: 'DAILY: Expense Tracker <25', days: { mon: { value: '', max: 0 }, tue: { value: '', max: 0 }, wed: { value: '', max: 0 }, thu: { value: '', max: 0 }, fri: { value: '', max: 0 }, sat: { value: '', max: 0 }, sun: { value: '', max: 0 } }, score: 0, maxScore: 0, streaks: { mon:0, tue:0, wed:0, thu:0, fri:0, sat:0, sun:0, current:0, longest:0 } } ]},
          { name: 'TOTAL', id: generateSeedId('sec_'), activities: [ { id: generateSeedId('act_'), name: 'DAILY POINTS', days: { mon: { value: '0', max: 0 }, tue: { value: '0', max: 0 }, wed: { value: '0', max: 0 }, thu: { value: '', max: 0 }, fri: { value: '0', max: 0 }, sat: { value: '0', max: 0 }, sun: { value: '0', max: 0 } }, score: 0, maxScore: 0, streaks: { mon:0, tue:0, wed:0, thu:0, fri:0, sat:0, sun:0, current:0, longest:0 }} ]}
        ],
        tasks_default_count: 20,
        workout_plan_default: [
          { name: 'TUESDAY', id: generateSeedId('wpd_'), exercises: [ { id: generateSeedId('ex_'), prefix: '• ', name: 'Incline Dumbbell Press', weight: '', sets: '', reps: '', defaultWeight: '30', defaultSets: '3', defaultReps: '12' }, { id: generateSeedId('ex_'), prefix: '• ', name: 'Barbell Squats', weight: '', sets: '', reps: '', defaultWeight: '80', defaultSets: '3', defaultReps: '8' }, { id: generateSeedId('ex_'), prefix: '• ', name: 'DB Chest-Supported Row', weight: '', sets: '', reps: '', defaultWeight: '25', defaultSets: '3', defaultReps: '12' }, { id: generateSeedId('ex_'), prefix: '• ', name: 'Leg Curls', weight: '', sets: '', reps: '', defaultWeight: '40', defaultSets: '3', defaultReps: '15' }, { id: generateSeedId('ex_'), prefix: '• SS: ', name: 'Incline DB Curls', weight: '', sets: '', reps: '', defaultWeight: '15', defaultSets: '3', defaultReps: '12' }, { id: generateSeedId('ex_'), prefix: '• SS: ', name: 'Tricep Extensions', weight: '', sets: '', reps: '', defaultWeight: '20', defaultSets: '3', defaultReps: '12' } ]},
          { name: 'WEDNESDAY', id: generateSeedId('wpd_'), exercises: [ { id: generateSeedId('ex_'), prefix: '• ', name: 'Barbell Bench Press', weight: '', sets: '', reps: '', defaultWeight: '70', defaultSets: '3', defaultReps: '6' }, { id: generateSeedId('ex_'), prefix: '• ', name: 'Romanian Deadlift', weight: '', sets: '', reps: '', defaultWeight: '90', defaultSets: '3', defaultReps: '8' }, { id: generateSeedId('ex_'), prefix: '• ', name: 'Lat Pulldown', weight: '', sets: '', reps: '', defaultWeight: '60', defaultSets: '3', defaultReps: '12' }, { id: generateSeedId('ex_'), prefix: '• ', name: 'Walking Lunges', weight: '', sets: '', reps: '', defaultWeight: '20', defaultSets: '3', defaultReps: '10' }, { id: generateSeedId('ex_'), prefix: '• SS: ', name: 'Cable Lateral Raises', weight: '', sets: '', reps: '', defaultWeight: '15', defaultSets: '3', defaultReps: '15' }, { id: generateSeedId('ex_'), prefix: '• SS: ', name: 'Reverse Crunches', weight: '', sets: '', reps: '', defaultWeight: '0', defaultSets: '3', defaultReps: '15' } ]},
          { name: 'FRIDAY', id: generateSeedId('wpd_'), exercises: [ { id: generateSeedId('ex_'), prefix: '• ', name: 'Seated DB Shoulder Press', weight: '', sets: '', reps: '', defaultWeight: '20', defaultSets: '3', defaultReps: '12' }, { id: generateSeedId('ex_'), prefix: '• ', name: 'Dumbbell Row', weight: '', sets: '', reps: '', defaultWeight: '25', defaultSets: '3', defaultReps: '12' }, { id: generateSeedId('ex_'), prefix: '• ', name: 'Barbell Hip Thrust', weight: '', sets: '', reps: '', defaultWeight: '100', defaultSets: '3', defaultReps: '15' }, { id: generateSeedId('ex_'), prefix: '• ', name: 'Leg Extensions', weight: '', sets: '', reps: '', defaultWeight: '50', defaultSets: '3', defaultReps: '15' }, { id: generateSeedId('ex_'), prefix: '• ', name: 'Seated Chest Flyes', weight: '', sets: '', reps: '', defaultWeight: '15', defaultSets: '3', defaultReps: '15' }, { id: generateSeedId('ex_'), prefix: '• SS: ', name: 'Standing Calf Raises', weight: '', sets: '', reps: '', defaultWeight: '30', defaultSets: '3', defaultReps: '15' }, { id: generateSeedId('ex_'), prefix: '• SS: ', name: 'Reverse Cable Flyes', weight: '', sets: '', reps: '', defaultWeight: '20', defaultSets: '3', defaultReps: '15' } ]}
        ],
        meals_default: [
          { id: generateSeedId('meal_'), name: 'Nutty Pudding', ingredients: 'Berries ½c, Cherries 3, Pomegranate Juice 2oz, Macadamia nuts (raw) 45g, Walnuts (raw) 5g, Cocoa 1t, Brazil Nuts ¼, Milk 50-100ml, Chia Seeds 2T, Flax (ground, refr) 1t, Lecithin 1t, Ceylon Cinnamon ½t' },
          { id: generateSeedId('meal_'), name: 'Super Veggie', ingredients: 'Broccoli 250g, Cauliflower 150g, Mushrooms 50g, Garlic 1 clove, Ginger 3g, Cumin 1T, Black Lentils 45g, Hemp Seeds 1T, Apple Cider Vinegar 1T' },
          { id: generateSeedId('meal_'), name: 'Third Meal', ingredients: 'Sweet Potato 350-400g, Protein 100-150g, Grape Tomatoes 12, Avocado ½, Radishes 4, Cilantro ¼c, Lemon 1, Jalapeño (lg) 1, Chili Powder 1t' }
        ],
        grocery_list_default: [
          { id: generateSeedId('gcat_'), name: 'Produce', items: 'Broccoli 1.75kg, Cauliflower 1.05kg, Mushrooms 350g, Garlic 1 bulb, Ginger 1pc, Sweet Potato 2.8kg, Grape Tomatoes 84, Avocados (ripe) 4, Radishes 28, Cilantro 2-3 bunch' },
          { id: generateSeedId('gcat_'), name: 'Fruits & Protein', items: 'Lemons 7, Jalapeños (lg) 7, Berries 3.5c, Cherries 21, Black Lentils 315g, Protein 1.05kg, Milk (fortified) 1L' }
        ],
        grocery_budget_default_placeholder: "£120",
        body_measurements_default: [
          { id: generateSeedId('bm_'), name: 'Weight', value: '', placeholder: '75kg' }, { id: generateSeedId('bm_'), name: 'Chest', value: '', placeholder: '42in' },
          { id: generateSeedId('bm_'), name: 'Waist', value: '', placeholder: '34in' }, { id: generateSeedId('bm_'), name: 'Hips', value: '', placeholder: '40in' },
          { id: generateSeedId('bm_'), name: 'Arms', value: '', placeholder: '15in' }, { id: generateSeedId('bm_'), name: 'Thighs', value: '', placeholder: '24in' }
        ],
        financials_default: [
          { id: generateSeedId('fin_'), name: 'Rent', value: '', placeholder: '850', account: 'Cash' },
          { id: generateSeedId('fin_'), name: 'Allowance', value: '', placeholder: '850', account: 'Revolut' },
          { id: generateSeedId('fin_'), name: 'Savings', value: '', placeholder: '3,800', account: 'HSBCUK' }
        ]
    };
    // --- End of Seed Data ---

    console.log("DB Seeder: Starting database seed process...");
    let success = false;
    try {
        const configKey = SEED_APP_CONFIG_DATA.config_key;
        let existingConfig = null;
        try { existingConfig = await pbSeed.collection('app_config').getFirstListItem(`config_key="${configKey}"`); }
        catch (e) { if (e.status !== 404) { if (e.data?.message?.includes("collection not found")) throw new Error(`Collection 'app_config' not found. Import schema first. Original: ${e.message}`); throw e; }}

        if (existingConfig) { await pbSeed.collection('app_config').update(existingConfig.id, SEED_APP_CONFIG_DATA); console.log(`DB Seeder: Updated app_config: ${configKey}`); }
        else { await pbSeed.collection('app_config').create(SEED_APP_CONFIG_DATA); console.log(`DB Seeder: Created app_config: ${configKey}`); }
        
        alert("Database app_config seeding process completed successfully. Please refresh the page WITHOUT the ?seed=1 parameter.");
        success = true;
    } catch (error) {
        console.error("DATABASE SEEDING FAILED:", error);
        alert(`Database seeding failed: ${error.message}. Check console. Ensure collection 'app_config' exists (import schema).`);
    } finally {
        if (success) {
            sessionStorage.setItem('db_seed_completed_successfully', 'true');
            const currentUrl = new URL(window.location.href);
            currentUrl.searchParams.delete('seed');
            window.history.replaceState({}, document.title, currentUrl.toString());
        }
    }
})();
