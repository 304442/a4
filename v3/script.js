// --- Utility Functions ---
function deepCopy(obj) { if (obj === null || typeof obj !== 'object') return obj; if (obj instanceof Date) return new Date(obj); if (Array.isArray(obj)) return obj.map(deepCopy); const copiedObject = {}; for (const key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { copiedObject[key] = deepCopy(obj[key]); } } return copiedObject;}
function generateId(prefix = 'id_') { return prefix + Date.now().toString(36) + Math.random().toString(36).substr(2, 5); }

// --- Alpine.js Application ---
function plannerApp() {
  const PB_BASE_URL = '/'; 
  const pb = new PocketBase(PB_BASE_URL);
  pb.autoCancellation(false);

  let isInitializing = true;
  let lastSavedState = null;
  let appDefaultsFromDB = null; // Renamed for clarity that it's from DB

  const DefaultDataManager = { 
    configKey: "default_v1", data: null, error: null,
    async fetch() { 
        this.error = null; try { this.data = await pb.collection('app_config').getFirstListItem(`config_key="${this.configKey}"`); if (!this.data) { this.error = "Default config (app_config) not found in DB. Ensure record 'config_key=default_v1' exists & is populated. Use ?seed=1 to attempt seeding."; throw new Error(this.error); } console.log("App defaults fetched successfully."); } catch (error) { console.error("Fatal Error: Could not initialize app defaults from PocketBase:", error); this.error = error.message || "Failed to load app settings from PocketBase."; this.data = null; } appDefaultsFromDB = this.data; return this.data;
    },
    // Getters removed as component will use appDefaultsFromDB directly for initial population or fallback logic
  };
  
  const DateTimeUtilsInternal = { 
    getCurrentIsoWeek:()=> {const n=new Date(),d=new Date(Date.UTC(n.getFullYear(),n.getMonth(),n.getDate()));d.setUTCDate(d.getUTCDate()+4-(d.getUTCDay()||7));const y=new Date(Date.UTC(d.getUTCFullYear(),0,1));return`${d.getUTCFullYear()}-W${Math.ceil(((d-y)/864e5+1)/7).toString().padStart(2,"0")}`;},parseISOWeek:(s)=>{if(!/^\d{4}-W(0[1-9]|[1-4][0-9]|5[0-3])$/.test(s))return new Date();const[y,w]=s.split("-"),W=parseInt(w.substring(1)),d=new Date(Date.UTC(parseInt(y),0,1+(W-1)*7)),D=d.getUTCDay()||7;d.setUTCDate(d.getUTCDate()-D+1);return d;},getWeekDateRange:(d)=>{const s=new Date(d),e=new Date(s);e.setUTCDate(s.getUTCDate()+6);return`${DateTimeUtilsInternal.formatDate(s)}-${DateTimeUtilsInternal.formatDate(e)}`;},formatDate:(d)=>`${(d.getUTCMonth()+1).toString().padStart(2,"0")}/${d.getUTCDate().toString().padStart(2,"0")}`,formatShortDate:(i)=>{const n=new Date();n.setDate(n.getDate()+i);return`${n.getMonth()+1}/${n.getDate()}`;},formatPrayerTime:(s)=>{if(!s||typeof s!=="string")return"";const t=s.split(" ")[0],[h,m]=t.split(":");if(!h||!m)return"";let H=parseInt(h),M=parseInt(m);if(isNaN(H)||isNaN(M)||H<0||H>23||M<0||M>59)return"";const A=H>=12?"PM":"AM";H%=12;H=H||12;return`${H}:${M.toString().padStart(2,"0")}${A}`;},calculateQiyamTime:(f)=>{if(!f||typeof f!=="string")return"";const p=f.split(" ")[0].split(":");if(p.length<2)return"";let H=parseInt(p[0]),M=parseInt(p[1]);if(isNaN(H)||isNaN(M)||H<0||H>23||M<0||M>59)return"";let q=new Date();q.setHours(H,M,0,0);q.setHours(q.getHours()-1);return`${q.getHours().toString().padStart(2,"0")}:${q.getMinutes().toString().padStart(2,"0")}`;},
  };
  
  return {
    currentWeek: '', dateRange: '', saveStatus: 'saved', isOnline: navigator.onLine, pendingSync: [],
    showNotification: false, notificationMessage: '', showWeekSelector: false,
    dropdownPosition: { top: 0, left: 0 }, currentDay: (new Date()).getDay(),
    plannerTitle: 'Loading Planner...', 
    uiConfig: { mainTableHeaders: [], dayHeaders: [], maxHeaders: [], taskHeaders: [], sectionTitles: {} }, 
    times: [], schedule: [], tasks: [], workoutPlan: [],
    meals: [], groceryBudget: '', groceryBudgetPlaceholder: '£0', groceryList: [], 
    bodyMeasurements: [], financials: [], savedWeeks: [], 
    saveDataTimeout: null, notificationTimeout: null,
    DateTimeUtils: DateTimeUtilsInternal, 
    appDefaultsState: null, // Holds the raw fetched app_config object

    async init() {
      isInitializing = true; console.log("App init starting...");
      this.appDefaultsState = await DefaultDataManager.fetch(); 
      
      if (DefaultDataManager.error || !this.appDefaultsState) { 
        this.showErrorMessage(`CRITICAL: ${DefaultDataManager.error || "App defaults are null."}. Planner using minimal fallbacks. Ensure 'app_config' is populated. Try '?seed=1' with db_seed.js included.`); 
        this.applyMinimalFallbacks();
      } else { 
        this.plannerTitle = this.appDefaultsState.planner_title_default || "Weekly Planner";
        this.uiConfig = deepCopy(this.appDefaultsState.ui_config_default || { mainTableHeaders: [], dayHeaders: [], maxHeaders: [], taskHeaders: [], sectionTitles: {} });
        this.times = deepCopy(this.appDefaultsState.times_default || []);
        this.schedule = (deepCopy(this.appDefaultsState.schedule_default || [])).map(s=>({...s,id:s.id||generateId('sec_'),activities:(s.activities||[]).map(a=>({...a,id:a.id||generateId('act_'),streaks:a.streaks||{ mon:0,tue:0,wed:0,thu:0,fri:0,sat:0,sun:0,current:0,longest:0 }}))}));
        this.tasks = Array(this.appDefaultsState.tasks_default_count || 20).fill(null).map((_,i)=>({id:generateId('task_'),num:'',priority:'',tag:'',description:'',date:'',completed:''}));
        this.workoutPlan = (deepCopy(this.appDefaultsState.workout_plan_default || [])).map(d=>({...d,id:d.id||generateId('wpd_'),exercises:(d.exercises||[]).map(e=>({...e,id:e.id||generateId('ex_')}))}));
        this.meals = (deepCopy(this.appDefaultsState.meals_default || [])).map(m=>({...m,id:m.id||generateId('meal_')}));
        this.groceryList = (deepCopy(this.appDefaultsState.grocery_list_default || [])).map(g=>({...g,id:g.id||generateId('gcat_')}));
        this.groceryBudgetPlaceholder = this.appDefaultsState.grocery_budget_default_placeholder || '£0';
        this.bodyMeasurements = (deepCopy(this.appDefaultsState.body_measurements_default || [])).map(b=>({...b,id:b.id||generateId('bm_')}));
        this.financials = (deepCopy(this.appDefaultsState.financials_default || [])).map(f=>({...f,id:f.id||generateId('fin_')}));
      }
      
      window.addEventListener('online', () => { this.isOnline = true; this.syncPendingData(); });
      window.addEventListener('offline', () => this.isOnline = false);
      document.addEventListener('click',e=>{if(!e.target.closest('.dropdown')&&!e.target.closest('.clickable')){this.showWeekSelector=false;}});
      this.pendingSync = JSON.parse(localStorage.getItem('planner_pending_sync') || '[]');
      this.currentWeek = DateTimeUtilsInternal.getCurrentIsoWeek();
      this.dateRange = DateTimeUtilsInternal.getWeekDateRange(DateTimeUtilsInternal.parseISOWeek(this.currentWeek));
      await this.loadWeek(this.currentWeek, true); 
      if (this.appDefaultsState && !DefaultDataManager.error) { setInterval(() => { if (!isInitializing && this.hasSignificantChanges()) this.saveData(); }, 30000); }
      if (this.isOnline) this.syncPendingData();
      console.log("App init finished.");
    },

    applyMinimalFallbacks() { 
        this.plannerTitle = "Planner Config Error";
        this.uiConfig = { mainTableHeaders:['T','D','A','S','M','F'], dayHeaders:['M','T','W','T','F','S','S'], maxHeaders:Array(7).fill('M'), taskHeaders:['#','P','T','Task','D','C'], sectionTitles:{tasks:"Tasks (Error)"}};
        this.times = Array(6).fill(null).map((_,i)=>({label:String.fromCharCode(65+i), value:''}));
        this.schedule = []; this.tasks = Array(5).fill(null).map((_,i)=>({id:generateId('task_'),num:'',priority:'',tag:'',description:'Error loading default tasks',date:'',completed:''})); 
        this.workoutPlan = []; this.meals = []; this.groceryList = [];
        this.groceryBudgetPlaceholder = '£ERR'; this.bodyMeasurements = []; this.financials = [];
    },
    
    applyDefaultsFromFetchedConfig() { 
      if (!this.appDefaultsState || DefaultDataManager.error) { this.applyMinimalFallbacks(); return; }
      this.plannerTitle = this.appDefaultsState.planner_title_default || "Weekly Planner";
      this.uiConfig = deepCopy(this.appDefaultsState.ui_config_default || {});
      this.times = deepCopy(this.appDefaultsState.times_default || []);
      this.schedule = (deepCopy(this.appDefaultsState.schedule_default || [])).map(s=>({...s,id:s.id||generateId('sec_'),activities:(s.activities||[]).map(a=>({...a,id:a.id||generateId('act_'),streaks:a.streaks||{ mon:0,tue:0,wed:0,thu:0,fri:0,sat:0,sun:0,current:0,longest:0 }}))}));
      this.tasks = Array(this.appDefaultsState.tasks_default_count || 20).fill(null).map((_,i)=>({id:generateId('task_'),num:'',priority:'',tag:'',description:'',date:'',completed:''}));
      this.workoutPlan = (deepCopy(this.appDefaultsState.workout_plan_default || [])).map(d=>({...d,id:d.id||generateId('wpd_'),exercises:(d.exercises||[]).map(e=>({...e,id:e.id||generateId('ex_')}))}));
      this.meals = (deepCopy(this.appDefaultsState.meals_default || [])).map(m=>({...m,id:m.id||generateId('meal_')}));
      this.groceryList = (deepCopy(this.appDefaultsState.grocery_list_default || [])).map(g=>({...g,id:g.id||generateId('gcat_')}));
      this.groceryBudget = ''; 
      this.groceryBudgetPlaceholder = this.appDefaultsState.grocery_budget_default_placeholder || '£0';
      this.bodyMeasurements = (deepCopy(this.appDefaultsState.body_measurements_default || [])).map(b=>({...b,id:b.id||generateId('bm_')}));
      this.financials = (deepCopy(this.appDefaultsState.financials_default || [])).map(f=>({...f,id:f.id||generateId('fin_')}));
    },

    populateFieldsFromSaved(savedData) {
        const getReactiveDef = (keyInAppDefaults, emptyVal = undefined) => this.appDefaultsState?.[keyInAppDefaults] || emptyVal;

        this.plannerTitle = savedData.planner_title || getReactiveDef("planner_title_default", "Weekly Planner");
        this.uiConfig = deepCopy(savedData.ui_config || getReactiveDef("ui_config_default", {}));
        this.times = deepCopy(savedData.times_display || getReactiveDef("times_default", []));
        
        const defaultSchedule = getReactiveDef("schedule_default", []);
        this.schedule = defaultSchedule.map(defSection => {
            const savedSection = (savedData.schedule_data || []).find(ss => ss.name === defSection.name && ss.id === defSection.id) || (savedData.schedule_data || []).find(ss => ss.name === defSection.name);
            const currentSection = savedSection || defSection;
            return {...currentSection, id: currentSection.id || generateId('sec_'), activities: (defSection.activities || []).map(defActivity => {
                    const savedActivity = (currentSection.activities || []).find(sa => sa.name === defActivity.name && sa.id === defActivity.id) || (currentSection.activities || []).find(sa => sa.name === defActivity.name);
                    const currentActivity = savedActivity || defActivity;
                    return {...currentActivity, id: currentActivity.id || generateId('act_'), streaks: currentActivity.streaks || {mon:0,tue:0,wed:0,thu:0,fri:0,sat:0,sun:0,current:0,longest:0}};
                })};
        });

        const defaultTaskCount = getReactiveDef("tasks_default_count", 20);
        const taskTargetLength = Math.max(defaultTaskCount, savedData.tasks_data?.length || 0);
        this.tasks = Array(taskTargetLength).fill(null).map((_, i) => {
            const sTask = savedData.tasks_data?.[i]; // sTask is defined here
            const defaultTaskValues = (this.appDefaultsState?.tasks_default?.[i] || {}); 
            return { 
                id: sTask?.id || generateId('task_'), 
                num:this.validateValue(sTask?.num || defaultTaskValues.num), 
                priority:this.validateValue(sTask?.priority || defaultTaskValues.priority), // CORRECTED: sTask
                tag:this.validateValue(sTask?.tag || defaultTaskValues.tag),             // CORRECTED: sTask
                description:this.validateValue(sTask?.description || defaultTaskValues.description), 
                date:this.validateValue(sTask?.date || defaultTaskValues.date), 
                completed:this.validateValue(sTask?.completed || defaultTaskValues.completed)
            };
        });
        
        const defaultWP = getReactiveDef("workout_plan_default", []);
        this.workoutPlan = defaultWP.map((defDay, dIdx) => { const savedDay = (savedData.workout_plan_data || []).find(sd => sd.name === defDay.name && sd.id === defDay.id) || (savedData.workout_plan_data || []).find(sd => sd.name === defDay.name); const currentDayData = savedDay || defDay; return {...currentDayData, id: currentDayData.id || generateId('wpd_'), exercises: (defDay.exercises || []).map((defEx, eIdx) => { const savedEx = (currentDayData.exercises || []).find(se => se.name === defEx.name && se.id === defEx.id) || (currentDayData.exercises || []).find(se => se.name === defEx.name); const currentEx = savedEx || defEx; return {...currentEx, id: currentEx.id || generateId('ex_')}; })}; });
        const defaultMeals = getReactiveDef("meals_default", []);
        this.meals = defaultMeals.map((defMeal, mIdx) => { const savedMeal = (savedData.meals_data || []).find(sm => sm.name === defMeal.name && sm.id === defMeal.id) || (savedData.meals_data || []).find(sm => sm.name === defMeal.name); const currentMeal = savedMeal || defMeal; return {...currentMeal, id: currentMeal.id || generateId('meal_')}; });
        this.groceryBudget = this.validateValue(savedData.grocery_budget || '');
        this.groceryBudgetPlaceholder = getReactiveDef("grocery_budget_default_placeholder", "£0");
        const defaultGL = getReactiveDef("grocery_list_default", []);
        this.groceryList = defaultGL.map((defCat, gIdx) => { const savedCat = (savedData.grocery_list_data || []).find(sg => sg.name === defCat.name && sg.id === defCat.id) || (savedData.grocery_list_data || []).find(sg => sg.name === defCat.name); const currentCat = savedCat || defCat; return {...currentCat, id: currentCat.id || generateId('gcat_')}; });
        const defaultBM = getReactiveDef("body_measurements_default", []);
        this.bodyMeasurements = defaultBM.map((defBm,bIdx) => { const savedBm = (savedData.body_measurements_data || []).find(sbm => sbm.name === defBm.name && sbm.id === defBm.id) || (savedData.body_measurements_data || []).find(sbm => sbm.name === defBm.name); const currentBm = savedBm || defBm; return {...currentBm, id: currentBm.id || generateId('bm_'), placeholder: currentBm.placeholder }; });
        const defaultFin = getReactiveDef("financials_default", []);
        this.financials = defaultFin.map((defF, fIdx) => { const savedF = (savedData.financials_data || []).find(sf => sf.name === defF.name && sf.id === defF.id) || (savedData.financials_data || []).find(sf => sf.name === defF.name); const currentF = savedF || defF; return {...currentF, id: currentF.id || generateId('fin_'), placeholder: currentF.placeholder, account: currentF.account}; });
        lastSavedState=JSON.stringify(this.getCurrentDataStateForPersistence());
    },
    async loadWeek(isoWeek,isInitLoad=false){
        if(!this.appDefaultsState && isInitLoad){ 
            await DefaultDataManager.fetch(); this.appDefaultsState = DefaultDataManager.data; 
            if(DefaultDataManager.error){this.showErrorMessage(`CRITICAL: ${DefaultDataManager.error}. Cannot load week.`);if(isInitLoad)isInitializing=false;this.applyMinimalFallbacks();return;} 
            this.plannerTitle = this.appDefaultsState.planner_title_default || "Weekly Planner"; this.uiConfig = deepCopy(this.appDefaultsState.ui_config_default || {}); this.times = deepCopy(this.appDefaultsState.times_default || []); this.schedule = (deepCopy(this.appDefaultsState.schedule_default || [])).map(s=>({...s,id:s.id||generateId('sec_'),activities:(s.activities||[]).map(a=>({...a,id:a.id||generateId('act_'),streaks:a.streaks||{mon:0,tue:0,wed:0,thu:0,fri:0,sat:0,sun:0,current:0,longest:0}}))})); this.tasks = Array(this.appDefaultsState.tasks_default_count || 20).fill(null).map((_,i)=>({id:generateId('task_'),num:'',priority:'',tag:'',description:'',date:'',completed:''})); this.workoutPlan = (deepCopy(this.appDefaultsState.workout_plan_default || [])).map(d=>({...d,id:d.id||generateId('wpd_'),exercises:(d.exercises||[]).map(e=>({...e,id:e.id||generateId('ex_')}))})); this.meals = (deepCopy(this.appDefaultsState.meals_default || [])).map(m=>({...m,id:m.id||generateId('meal_')})); this.groceryList = (deepCopy(this.appDefaultsState.grocery_list_default || [])).map(g=>({...g,id:g.id||generateId('gcat_')})); this.groceryBudgetPlaceholder = this.appDefaultsState.grocery_budget_default_placeholder || '£0'; this.bodyMeasurements = (deepCopy(this.appDefaultsState.body_measurements_default || [])).map(b=>({...b,id:b.id||generateId('bm_')})); this.financials = (deepCopy(this.appDefaultsState.financials_default || [])).map(f=>({...f,id:f.id||generateId('fin_')}));
        }
        if(!this.appDefaultsState && !DefaultDataManager.error){this.showErrorMessage("Critical error: App defaults not available. Week load aborted.");if(isInitLoad)isInitializing=false;return;}
        if(!/^\d{4}-W(0[1-9]|[1-4][0-9]|5[0-3])$/.test(isoWeek)){this.showErrorMessage("Invalid week format");if(isInitLoad)isInitializing=false;return;}
        this.showWeekSelector=false;this.currentWeek=isoWeek;this.dateRange=this.DateTimeUtils.getWeekDateRange(this.DateTimeUtils.parseISOWeek(isoWeek));let rec=null;
        if(this.isOnline){try{rec=await pb.collection('planners').getFirstListItem(`week_id="${isoWeek}"`);}catch(e){if(e.status!==404)console.error("PB load error:",e);}}
        if(!rec){const ld=localStorage.getItem(`planner_${isoWeek}`);if(ld)try{rec=JSON.parse(ld);}catch(e){console.error(`Local parse error ${isoWeek}:`,e);rec=null;}}
        if(rec){this.populateFieldsFromSaved(rec);}else{this.applyDefaultsFromFetchedConfig();}
        this.calculateScores();if(this.times.every(t=>!t.value)){await this.fetchAndSetPrayerTimes();}
        if(isInitLoad){isInitializing=false;console.log("Initial load process finished.");}
    },
    
    getCurrentDataStateForPersistence(){return{week_id:this.currentWeek,date_range:this.dateRange,planner_title:this.plannerTitle,ui_config:this.uiConfig,times_display:this.times,schedule_data:this.schedule,tasks_data:this.tasks,workout_plan_data:this.workoutPlan,meals_data:this.meals,grocery_budget:this.groceryBudget,grocery_list_data:this.groceryList,body_measurements_data:this.bodyMeasurements,financials_data:this.financials};},
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
    async fetchAndSetPrayerTimes(){ console.log("Fetching prayer times for London (fixed)"); await this.fetchPrayerTimesForCoords(51.5074, -0.1278, "London (Default)"); },
    async fetchPrayerTimesForCoords(lat,lon,cityName="Selected Location"){const tD=new Date(),d=tD.getDate(),m=tD.getMonth()+1,y=tD.getFullYear();const cK=`prayer_times_${y}_${m}_${d}_${lat.toFixed(2)}_${lon.toFixed(2)}`;constcD=localStorage.getItem(cK);if(cD){try{this.setPrayerTimesDisplay(JSON.parse(cD));return;}catch(e){localStorage.removeItem(cK);}}try{const r=await fetch(`https://api.aladhan.com/v1/calendar/${y}/${m}?latitude=${lat}&longitude=${lon}&method=2`);if(!r.ok)throw new Error(`Aladhan API error: ${r.statusText}(${r.status})`);const aD=await r.json();if(aD.code===200&&aD.data?.[d-1]?.timings){const T=aD.data[d-1].timings;localStorage.setItem(cK,JSON.stringify(T));this.setPrayerTimesDisplay(T);}else throw new Error("Invalid Aladhan API data");}catch(e){console.error("Fetch prayer times error for "+cityName+":",e);this.showErrorMessage(`Failed to fetch prayer times for ${cityName}. Defaults used.`);this.setPrayerTimesDisplay({Fajr:"05:30",Dhuhr:"12:30",Asr:"15:45",Maghrib:"18:30",Isha:"20:00"});}},
    setPrayerTimesDisplay(T){const Q=DateTimeUtilsInternal.calculateQiyamTime(T.Fajr);const M={Q:Q,F:T.Fajr,D:T.Dhuhr,A:T.Asr,M:T.Maghrib,I:T.Isha};let C=false;this.times.forEach(ts=>{const nT=DateTimeUtilsInternal.formatPrayerTime(M[ts.label]);if(ts.value!==nT){ts.value=nT;C=true;}});if(C&&!isInitializing)this.saveData();},
    fetchSavedWeeks(){const wD=new Map();const cIW=DateTimeUtilsInternal.getCurrentIsoWeek();const aUW=(iso,dr,src,isC)=>{const ex=wD.get(iso);const nDR=dr||DateTimeUtilsInternal.getWeekDateRange(DateTimeUtilsInternal.parseISOWeek(iso));if(!ex||(src==='pocketbase'&&ex.source!=='pocketbase')||(src==='local'&&ex.source==='current')){wD.set(iso,{iso_week:iso,dateRange:nDR,source:src,isCurrent:isC});}else if(ex&&!ex.dateRange&&nDR){ex.dateRange=nDR;}};aUW(cIW,DateTimeUtilsInternal.getWeekDateRange(DateTimeUtilsInternal.parseISOWeek(cIW)),'current',true);const uD=()=>{this.savedWeeks=Array.from(wD.values()).sort((a,b)=>(a.isCurrent&&!b.isCurrent)?-1:(!a.isCurrent&&b.isCurrent)?1:b.iso_week.localeCompare(a.iso_week));};if(this.isOnline){pb.collection('planners').getFullList({sort:'-week_id',fields:'week_id,date_range'}).then(r=>{r.forEach(it=>aUW(it.week_id,it.date_range,'pocketbase',it.week_id===cIW));uD();}).catch(e=>{console.error("PB fetch saved weeks error:",e);for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k?.startsWith('planner_')&&!k.includes('pending_sync')){const iw=k.replace('planner_','');try{const d=JSON.parse(localStorage.getItem(k));aUW(iw,d.date_range,'local',iw===cIW);}catch(le){}}}uD();});}else{for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k?.startsWith('planner_')&&!k.includes('pending_sync')){const iw=k.replace('planner_','');try{const d=JSON.parse(localStorage.getItem(k));aUW(iw,d.date_range,'local',iw===cIW);}catch(e){}}}uD();}},
    confirmLoadWeek(isoWeek){if(this.hasSignificantChanges()&&isoWeek!==this.currentWeek){if(confirm("Unsaved changes. Load anyway?"))this.loadWeek(isoWeek);}else{this.loadWeek(isoWeek);}},confirmDeleteWeek(isoWeek){if(confirm(`Delete schedule for ${isoWeek}?`))this.deleteWeek(isoWeek);},async deleteWeek(isoWeek){localStorage.removeItem(`planner_${isoWeek}`);if(this.isOnline){try{await this.deleteFromPocketbase(isoWeek);}catch(e){this.addToPendingSync(isoWeek,null,'delete');}}else{this.addToPendingSync(isoWeek,null,'delete');}this.savedWeeks=this.savedWeeks.filter(w=>w.iso_week!==isoWeek);if(this.currentWeek===isoWeek){this.currentWeek=DateTimeUtilsInternal.getCurrentIsoWeek();await this.loadWeek(this.currentWeek);}}
  };
}
