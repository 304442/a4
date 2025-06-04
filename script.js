function plannerApp() {
  const pb = new PocketBase('/');
  pb.autoCancellation(false);
  let isInitializing = true;
  let lastSavedState = null;
  let uniqueIdCounter = 0;
  const generateId = () => `id_${Date.now()}_${uniqueIdCounter++}`;

  return {
    currentWeek: '', dateRange: '', city: 'London', saveStatus: 'saved', saveTimeout: null,
    showNotification: false, notificationMessage: '', notificationTimeout: null, isOnline: navigator.onLine,
    showCitySelector: false, showWeekSelector: false, dropdownPosition: { top: 0, left: 0 },
    currentDay: (new Date()).getDay(), plannerTitle: 'Weekly Planner',
    uiConfig: {}, times: [], schedule: [], tasks: [], workoutPlan: [], meals: [],
    groceryBudget: '', groceryList: [], bodyMeasurements: [], financials: [],
    currentTemplate: null, currentTemplateId: null, savedWeeks: [], cityOptions: [],
    editingField: null, editingValue: '',

    async init() {
      this.setupEventListeners();
      this.currentWeek = this.getCurrentIsoWeek();
      
      // Online-first: Always try server first
      if (!this.isOnline) {
        this.showMessage("You're offline. Limited functionality available.", true);
        await this.loadOfflineFallback();
        return;
      }

      try {
        this.dateRange = this.getWeekDateRange(this.parseISOWeek(this.currentWeek));
      } catch (e) {
        console.error("Error parsing current week:", e);
        this.dateRange = "Error";
        this.showMessage("Error setting date range: " + e.message, true);
      }

      await this.loadCityOptions();
      await this.loadWeek(this.currentWeek, true);
      
      // Online-first: Immediate saves, no batching
      setInterval(() => { 
        if (!isInitializing && this.hasSignificantChanges()) {
          this.saveData().catch(err => {
            console.error("Auto-save failed:", err);
            this.showMessage("Auto-save failed: " + err.message, true);
          });
        }
      }, 10000); // More frequent saves for online-first
    },

    setupEventListeners() {
      window.addEventListener('online', () => { 
        this.isOnline = true; 
        this.showMessage("Back online! Refreshing data...");
        this.loadWeek(this.currentWeek, false); // Refresh from server
      });
      window.addEventListener('offline', () => { 
        this.isOnline = false; 
        this.showMessage("You're offline. Changes will be lost if you refresh.", true);
      });
      document.addEventListener('click', e => {
        if (!e.target.closest('.dropdown,.clickable')) {
          this.showCitySelector = this.showWeekSelector = false; 
        }
        if (this.editingField && !e.target.closest('.inline-edit-active-wrapper')) {
            this.saveEdit();
        }
      });
    },

    async loadOfflineFallback() {
      // Minimal offline functionality - load from localStorage if available
      const localData = localStorage.getItem(`planner_${this.currentWeek}`);
      if (localData) {
        try {
          const parsed = JSON.parse(localData);
          this.showMessage("Loaded from local cache (offline mode)");
          // Apply minimal template
          this.applyMinimalTemplate();
          if (parsed) this.overlayUserData(parsed);
        } catch (e) {
          console.error("Error loading offline data:", e);
        }
      } else {
        this.applyMinimalTemplate();
        this.showMessage("No offline data available. Minimal planner loaded.", true);
      }
      isInitializing = false;
    },

    applyMinimalTemplate() {
      // Minimal fallback template for offline use
      this.plannerTitle = 'Weekly Planner (Offline)';
      this.uiConfig = {
        mainTableHeaders: ['TIME', 'DAY', 'ACTIVITY', 'SCR', 'MAX', '🔥'],
        dayHeaders: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'],
        maxHeaders: Array(7).fill('MAX'),
        taskHeaders: ['№', '🔥', '🏷️', 'TASK', '📅', '🎯', '✅', '⏰', '✓'],
        sectionTitles: {
          tasks: 'TASKS',
          workout: 'WORKOUT',
          meals: 'MEALS',
          grocery: 'GROCERY',
          measurements: 'MEASUREMENTS',
          financials: 'FINANCIALS'
        }
      };
      this.times = [{label:'Q',value:''},{label:'F',value:''},{label:'D',value:''},{label:'A',value:''},{label:'M',value:''},{label:'I',value:''}];
      this.schedule = [];
      this.tasks = Array(10).fill().map(() => ({ id: generateId(),num:'',priority:'',tag:'',description:'',startDate:'',expectedDate:'',actualDate:'',completed:''}));
      this.workoutPlan = [];
      this.meals = [];
      this.groceryList = [];
      this.bodyMeasurements = [];
      this.financials = [];
    },

    async fetchTemplate(templateName = "default") {
        // Online-first: No caching, always fetch fresh
        if (!this.isOnline) {
            return { 
                data: { id: 'offline_fallback', structure: { ui: {title_default: "Planner (Offline)"}, schedule: [], tasks: { count: 10}}}, 
                success: true, 
                source: 'offline_fallback' 
            };
        }

        const filter = templateName === "default" ? 'is_default=true' : `name="${templateName}"`;
        try {
            const templateData = await pb.collection('templates').getFirstListItem(filter, { requestKey: null });
            return { data: templateData, success: true, source: 'network' };
        } catch (e) {
            console.error(`Error fetching template '${templateName}':`, e.status, e.data?.message || e.message);
            if (templateName === "default") {
                return { 
                    data: { id: 'fallback_internal', structure: { ui: {title_default: "Planner (Template Error)"}, schedule: [], tasks: { count: 10}}}, 
                    success: true, 
                    source: 'internal_fallback' 
                };
            }
            return { success: false, error: e, source: 'network_error' };
        }
    },

    async fetchTemplateById(templateId) {
        if (!this.isOnline) {
            return { success: false, error: new Error("Offline"), source: 'offline' };
        }
        try {
            const templateData = await pb.collection('templates').getOne(templateId, { requestKey: null });
            return { data: templateData, success: true, source: 'network' };
        } catch (e) {
            console.error("Failed to fetch template by ID:", templateId, e.status, e.data?.message || e.message);
            return { success: false, error: e, source: 'network_error' };
        }
    },
    
    applyTemplateStructure(template) {
      this.currentTemplate = template; 
      this.currentTemplateId = template.id;
      const s = template.structure || {};
      const ui = s.ui || {}; const headers = ui.headers || {}; const tasksInfo = s.tasks || {}; const groceryInfo = s.grocery || {};

      this.plannerTitle = ui.title_default || 'Weekly Planner';
      this.uiConfig = {
        mainTableHeaders: headers.main_table || Array(6).fill('H'),
        dayHeaders: headers.days || Array(7).fill('D'),
        maxHeaders: headers.max_cols || Array(7).fill('M'),
        taskHeaders: headers.tasks || Array(9).fill('TH'),
        sectionTitles: ui.sections || {}
      };
      this.times = Array.isArray(s.prayer_times) ? [...s.prayer_times] : [];
      this.schedule = this.buildScheduleFromTemplate(s.schedule);
      this.tasks = Array(tasksInfo.count || 20).fill().map(() => ({ id: generateId(),num:'',priority:'',tag:'',description:'',startDate:'',expectedDate:'',actualDate:'',completed:''}));
      this.workoutPlan = this.buildWorkoutFromTemplate(s.workout);
      this.meals = this.ensureIds(Array.isArray(s.meals) ? [...s.meals] : []);
      this.groceryBudget = groceryInfo.budget_default || '';
      this.groceryList = this.ensureIds(Array.isArray(groceryInfo.categories) ? [...groceryInfo.categories] : []);
      this.bodyMeasurements = this.ensureIds(Array.isArray(s.measurements) ? [...s.measurements] : []);
      this.financials = this.ensureIds(Array.isArray(s.financials) ? [...s.financials] : []);
      this.city = s.city_default || 'London';
    },

    buildScheduleFromTemplate(templateSchedule) {
      if (!Array.isArray(templateSchedule)) return [];
      return templateSchedule.map(section => ({
        id: generateId(), 
        name: section.name,
        activities: (Array.isArray(section.activities) ? section.activities : []).map(activity => ({
          id: generateId(), 
          name: activity.name,
          days: this.createDaysStructure(activity.days, activity.max_per_day || 1),
          score: 0, 
          maxScore: Number(activity.max_score) || 0,
          streaks: { current: 0, longest: 0 }
        }))
      }));
    },

    createDaysStructure(specificDays,maxPerDay){
      const allD=['mon','tue','wed','thu','fri','sat','sun'],d={};
      const tD=(specificDays&&Array.isArray(specificDays)&&specificDays.length>0)?specificDays.filter(day=>typeof day==='string'&&allD.includes(day.toLowerCase())):allD;
      tD.forEach(day=>{d[day.toLowerCase()]={value:null,max:Math.max(0,parseInt(maxPerDay)||1)};});return d;
    },

    buildWorkoutFromTemplate(templateWorkout) {
        if (!Array.isArray(templateWorkout)) return [];
        return templateWorkout.map(day => ({ id:generateId(),name:day.name,
            exercises:this.ensureIds((Array.isArray(day.exercises)?day.exercises:[]).map(ex=>({name:ex.name,weight:'',sets:'',reps:'',defaultWeight:String(ex.default_weight||''),defaultSets:String(ex.default_sets||''),defaultReps:String(ex.default_reps||'') })))
        }));
    },

    ensureIds(items){if(!Array.isArray(items))return[];return items.map(item=>({...item,id:item.id||generateId()}));},

    async loadWeek(isoWeek, isInitLoad = false) {
        if (!this.isOnline) {
            this.showMessage("Cannot load week data while offline", true);
            return;
        }

        let currentOperation = "Initializing week load";
        try {
            this.showWeekSelector = false; 
            this.currentWeek = isoWeek; 
            currentOperation = "Parsing ISO week";
            const parsedDate = this.parseISOWeek(isoWeek);
            this.dateRange = this.getWeekDateRange(parsedDate);

            currentOperation = "Fetching planner record";
            let plannerRecord = await this.fetchPlannerRecord(isoWeek);
            
            let templateResult; 
            currentOperation = "Fetching template";
            if (plannerRecord?.template_id) {
                templateResult = await this.fetchTemplateById(plannerRecord.template_id);
                if (!templateResult.success) {
                    console.warn(`Failed to fetch template ID ${plannerRecord.template_id}, falling back to default.`);
                    templateResult = await this.fetchTemplate("default");
                }
            } else { 
                templateResult = await this.fetchTemplate("default"); 
            }

            if (!templateResult.success && templateResult.source !== 'internal_fallback') {
                let errorMsg = "Critical: Could not load any planner template from server.";
                if(templateResult.error) errorMsg += ` Details: ${templateResult.error.message || String(templateResult.error)}`;
                throw new Error(errorMsg);
            }
            
            currentOperation = "Applying template structure"; 
            this.applyTemplateStructure(templateResult.data); 
            if (plannerRecord) { 
                currentOperation = "Overlaying user data"; 
                this.overlayUserData(plannerRecord); 
            }
            currentOperation = "Calculating scores"; 
            this.calculateScores();
            
            if (isInitLoad && !this.times.some(t => t.value)) { 
                currentOperation = "Fetching prayer times"; 
                await this.getPrayerTimes(); 
            }
            
            // Online-first: Always save current state to local as backup only
            try {
                localStorage.setItem(`planner_${this.currentWeek}`, JSON.stringify(this.getCurrentUserData()));
            } catch (e) {
                console.warn("Failed to save local backup:", e);
            }
            
            lastSavedState = JSON.stringify(this.getCurrentUserData());
        } catch (error) {
            console.error(`CRITICAL ERROR in loadWeek (during ${currentOperation}):`, error);
            this.showMessage(`Failed to load week data: ${error.message}`, true);
            
            // Try local fallback only if online fails
            if (this.isOnline) {
                const localData = localStorage.getItem(`planner_${isoWeek}`);
                if (localData) {
                    try {
                        this.showMessage("Loading from local backup due to server error");
                        this.applyTemplateStructure({ id: 'LOCAL_BACKUP', structure: { ui: {title_default: "Planner (Local Backup)"}, schedule: [], tasks: { count: 10 }} });
                        this.overlayUserData(JSON.parse(localData));
                    } catch (e) {
                        console.error("Local backup also failed:", e);
                        this.applyMinimalTemplate();
                    }
                } else {
                    this.applyMinimalTemplate();
                }
            }
            
            lastSavedState = JSON.stringify(this.getCurrentUserData());
        } finally { 
            if (isInitLoad) isInitializing = false; 
        }
    },

    async fetchPlannerRecord(isoWeek) {
      if (!this.isOnline) {
        this.showMessage("Cannot fetch planner record while offline", true);
        return null;
      }
      try { 
        return await pb.collection('planners').getFirstListItem(`week_id="${isoWeek}"`, { requestKey: null });
      } catch (error) { 
        if (error.status === 404) return null; 
        console.error("Error fetching planner record:", error); 
        throw error; 
      }
    },

    overlayUserData(record){if(record.title)this.plannerTitle=record.title;if(record.city)this.city=record.city;if(record.prayer_times)this.overlayArray(this.times,record.prayer_times,['label','value']);if(record.schedule_data)this.overlayScheduleData(record.schedule_data);if(record.tasks_data)this.overlayArray(this.tasks,record.tasks_data,['id','num','priority','tag','description','startDate','expectedDate','actualDate','completed']);if(record.workout_data)this.overlayWorkoutData(record.workout_data);if(record.meals_data)this.overlayArray(this.meals,record.meals_data,['id','name','ingredients']);if(record.grocery_data)this.overlayGroceryData(record.grocery_data);if(record.measurements_data)this.overlayArray(this.bodyMeasurements,record.measurements_data,['id','name','value','placeholder']);if(record.financials_data)this.overlayArray(this.financials,record.financials_data,['id','name','value','account','placeholder']);},
    overlayArray(target,source,fieldsToCopy=null){if(!Array.isArray(target)||!Array.isArray(source))return;source.forEach(sItem=>{if(typeof sItem!=='object'||sItem===null)return;const tItem=target.find(t=>t.id===sItem.id||(t.name&&t.name===sItem.name));if(tItem){if(fieldsToCopy&&Array.isArray(fieldsToCopy)){fieldsToCopy.forEach(f=>{if(sItem.hasOwnProperty(f))tItem[f]=sItem[f];});}else{Object.assign(tItem,sItem);}}});},
    overlayScheduleData(schedData){if(!Array.isArray(schedData))return;schedData.forEach(sSect=>{if(typeof sSect!=='object'||sSect===null)return;const sect=this.schedule.find(s=>s.name===sSect.name);if(sect&&Array.isArray(sSect.activities)){sSect.activities.forEach(sAct=>{if(typeof sAct!=='object'||sAct===null)return;const act=sect.activities.find(a=>a.name===sAct.name);if(act){if(sAct.days&&typeof sAct.days==='object'){Object.keys(act.days).forEach(day=>{if(sAct.days[day]&&act.days[day]){act.days[day].value=sAct.days[day].value===undefined?null:Number(sAct.days[day].value);}});}act.score=Number(sAct.score)||0;act.streaks=(sAct.streaks&&typeof sAct.streaks==='object')?sAct.streaks:{current:0,longest:0};}});}});},
    overlayWorkoutData(wData){if(!Array.isArray(wData))return;wData.forEach(sDay=>{if(typeof sDay!=='object'||sDay===null)return;const day=this.workoutPlan.find(d=>d.name===sDay.name);if(day&&Array.isArray(sDay.exercises)){sDay.exercises.forEach(sEx=>{if(typeof sEx!=='object'||sEx===null)return;const ex=day.exercises.find(e=>e.name===sEx.name);if(ex){ex.weight=sEx.weight||'';ex.sets=sEx.sets||'';ex.reps=sEx.reps||'';}});}});},
    overlayGroceryData(gData){if(typeof gData!=='object'||gData===null)return;if(gData.budget)this.groceryBudget=gData.budget;if(Array.isArray(gData.categories))this.overlayArray(this.groceryList,gData.categories,['id','name','items']);},

    getCurrentUserData(){return{week_id:this.currentWeek,template_id:this.currentTemplateId,title:this.plannerTitle!==(this.currentTemplate?.structure?.ui?.title_default||'Weekly Planner')?this.plannerTitle:undefined,city:this.city!==(this.currentTemplate?.structure?.city_default||'London')?this.city:undefined,date_range:this.dateRange,prayer_times:this.times.some(t=>t.value)?this.times.map(t=>({label:t.label,value:t.value})):undefined,schedule_data:this.extractScheduleData(),tasks_data:this.extractUserTasks(),workout_data:this.extractWorkoutData(),meals_data:this.extractUserItems(this.meals,['name','ingredients'],true),grocery_data:this.extractGroceryData(),measurements_data:this.extractUserItems(this.bodyMeasurements,['name','value'],true),financials_data:this.extractUserItems(this.financials,['name','value','account'],true)};},
    extractScheduleData(){return this.schedule.map(s=>({id:s.id,name:s.name,activities:s.activities.map(a=>{const dVal=Object.entries(a.days||{}).filter(([_,dat])=>dat.value!==null).reduce((acc,[day,dat])=>{acc[day]={value:dat.value};return acc;},{});const tA=this.findTemplateActivity(s.name,a.name);const mScoreTmpl=tA?.max_score||0;return{id:a.id,name:a.name,days:Object.keys(dVal).length>0?dVal:undefined,score:a.score||undefined,maxScore:a.maxScore!==mScoreTmpl?a.maxScore:undefined,streaks:(a.streaks?.current||a.streaks?.longest)?a.streaks:undefined};}).filter(a=>a.days||a.score!==undefined||a.maxScore!==undefined||a.streaks)})).filter(s=>s.activities.length>0);},
    findTemplateActivity(sName,aName){const tS=this.currentTemplate?.structure?.schedule?.find(s=>s.name===sName);return tS?.activities?.find(a=>a.name===aName);},
    extractUserTasks(){return this.tasks.map(t=>({id:t.id,num:t.num||undefined,priority:t.priority||undefined,tag:t.tag||undefined,description:t.description||undefined,startDate:t.startDate||undefined,expectedDate:t.expectedDate||undefined,actualDate:t.actualDate||undefined,completed:t.completed||undefined})).filter(t=>Object.keys(t).some(k=>k!=='id'&&t[k]!==undefined));},
    extractWorkoutData(){return this.workoutPlan.map(d=>({id:d.id,name:d.name,exercises:d.exercises.map(ex=>({id:ex.id,name:ex.name,weight:ex.weight||undefined,sets:ex.sets||undefined,reps:ex.reps||undefined})).filter(ex=>ex.weight!==undefined||ex.sets!==undefined||ex.reps!==undefined)})).filter(d=>d.exercises.length>0);},
    extractUserItems(items,fields,withId=false){return items.map(item=>{const ext={};if(withId&&item.id)ext.id=item.id;let hasVal=false;fields.forEach(f=>{if(item[f]!==undefined&&item[f]!==null&&item[f]!==''){ext[f]=item[f];hasVal=true;}});return hasVal?ext:null;}).filter(item=>item!==null);},
    extractGroceryData(){const cats=this.extractUserItems(this.groceryList,['name','items'],true);const bud=(this.groceryBudget&&this.groceryBudget!==(this.currentTemplate?.structure?.grocery?.budget_default||''))?this.groceryBudget:undefined;if(bud===undefined&&cats.length===0)return undefined;return{budget:bud,categories:cats.length>0?cats:undefined};},

    getEditableElementId(t,...a){let id=a.map(arg=>(typeof arg==='object'&&arg!==null)?Object.values(arg).join('_'):String(arg)).join('_');return`${t}_edit_${id}`.replace(/\W/g,'_');},
    isEditing(t,...a){return this.editingField?.id===this.getEditableElementId(t,...a);},
    startEdit(e,t,v,...a){if(this.editingField&&(this.editingField.id!==this.getEditableElementId(t,...a)))this.saveEdit();const id=this.getEditableElementId(t,...a);this.editingField={type:t,id,originalValue:v,args:a};this.editingValue=v;this.$nextTick(()=>document.querySelector(`[data-edit-id="${id}"]`)?.focus()?.select());},
    saveEdit(){if(!this.editingField)return;const vChanged=(typeof this.editingValue==='string'&&typeof this.editingField.originalValue==='string')?this.editingValue.trim()!==this.editingField.originalValue.trim():this.editingValue!==this.editingField.originalValue;if(vChanged){this.updateField(this.editingField.type,this.editingValue,...this.editingField.args);this.saveData().catch(e=>this.showMessage('Save failed after edit: '+e.message,true));}this.editingField=null;this.editingValue='';},
    cancelEdit(){this.editingField=null;this.editingValue='';},
    updateField(t,v,...a){const h={plannerTitle:()=>this.plannerTitle=v,timeLabel:i=>this.times[i].label=v,sectionTitle:k=>this.uiConfig.sectionTitles[k]=v,header:(ht,idx)=>this.uiConfig[{main:'mainTableHeaders',day:'dayHeaders',max:'maxHeaders',task:'taskHeaders'}[ht]][idx]=v,sectionName:sIdx=>this.schedule[this.schedule.length-1-sIdx].name=v,activityPrefix:i=>this.updateActivityName(i,v,true),activityName:i=>this.updateActivityName(i,v,false),maxValue:i=>this.getScheduleActivity(i).days[i.day].max=parseInt(v)||0,maxScore:i=>this.getScheduleActivity(i).maxScore=parseInt(v)||0,workoutDayName:i=>this.workoutPlan[i].name=v,exerciseName:i=>this.workoutPlan[i.dayIdx].exercises[i.exIdx].name=v,mealName:i=>this.meals[i].name=v,mealIngredients:i=>this.meals[i].ingredients=v,groceryCategoryName:i=>this.groceryList[i].name=v,groceryCategoryItems:i=>this.groceryList[i].items=v,measurementName:i=>this.bodyMeasurements[i].name=v,financialName:i=>this.financials[i].name=v,financialAccount:i=>this.financials[i].account=v};if(h[t])h[t](...a);else console.warn("Unknown field type for update:",t);},
    updateActivityName(idx,val,isPre){const act=this.getScheduleActivity(idx);if(!act)return;const pts=act.name.split(':');const cN=act.name.includes(':')?pts.slice(1).join(':').trimStart():act.name;const cP=act.name.includes(':')?pts[0].trim():"";act.name=isPre?(val.trim()+(cN?':'+cN:'')):(cP?cP+': ':'')+val.trim();},
    getScheduleActivity(idx){const actualIdx=this.schedule.length-1-idx.sIdx;return this.schedule[actualIdx]?.activities[idx.aIdx];},

    getTaskDelay(t){if(!t.expectedDate||!t.actualDate)return 0;const ed=new Date(t.expectedDate),ad=new Date(t.actualDate);if(isNaN(ed.getTime())||isNaN(ad.getTime()))return 0;return Math.ceil((ad-ed)/86400000);},
    calculateTaskDelay(t){t._delay=this.getTaskDelay(t);},
    formatDelay(d){if(d==null||d===0)return'⏰';return d>0?`+${d}d`:`${d}d`;},
    toggleTaskCompletion(t){t.completed=t.completed==='✓'?'':'✓';if(t.completed==='✓'&&!t.actualDate)t.actualDate=new Date().toISOString().split('T')[0];this.calculateTaskDelay(t);this.saveData().catch(e=>this.showMessage('Save failed: '+e.message,true));},
    getScoreClass(a){if(!a||typeof a.score!=='number'||typeof a.maxScore!=='number'||a.maxScore<=0)return'';const r=a.score/a.maxScore;return r<0.33?'score-low':r<0.66?'score-medium':'score-high';},
    getTaskRowClass(t){let c=[];if(t.completed==='✓')c.push('task-completed');const d=this.getTaskDelay(t);if(d>0)c.push('task-delayed');else if(d<0)c.push('task-early');return c.join(' ');},
    getDelayClass(t){const d=this.getTaskDelay(t);return d<0?'delay-negative':d>0?'delay-positive':'delay-zero';},
    updateProgressBar(a){if(!a||typeof a.id==='undefined')return;const e=document.querySelector(`[id="progress-bar-${a.id}"]`);if(e){let p=0;if(a.maxScore&&a.maxScore>0){p=Math.min(100,Math.max(0,(a.score/a.maxScore)*100));}e.style.setProperty('--progress-percent',`${p}%`);}},
    getProgressClass(a){if(!a||typeof a.score!=='number'||typeof a.maxScore!=='number'||a.maxScore<=0)return'';const r=a.score/a.maxScore;return r<0.33?'progress-low':r<0.66?'progress-medium':'score-high';},

    getDropdownStyle:()=>`top:${this.dropdownPosition.top}px;left:${this.dropdownPosition.left}px;`,
    toggleSelector(e,type){const p=`show${type[0].toUpperCase()+type.slice(1)}Selector`,o=type==='city'?'showWeekSelector':'showCitySelector';if(this[p]&&e.currentTarget.classList.contains('clickable')){this[p]=false;return;}this[o]=false;const r=e.currentTarget.getBoundingClientRect();this.dropdownPosition={top:r.bottom+window.scrollY,left:r.left+window.scrollX};this[p]=!this[p];if(type==='week'&&this[p])this.fetchSavedWeeks();},

    async selectCity(cOpt){this.city=cOpt.name;this.showCitySelector=false;if(cOpt.lat===null&&cOpt.lon===null)await this.getPrayerTimes();else if(typeof cOpt.lat==='number'&&typeof cOpt.lon==='number')await this.fetchPrayerTimes(cOpt.lat,cOpt.lon);this.saveData().catch(e=>this.showMessage('Save failed: '+e.message,true));},

    async loadCityOptions(){
      if (!this.isOnline) {
        this.cityOptions = [{name:'London',lat:51.5074,lon:-0.1278},{name:'Current Location',lat:null,lon:null}];
        return;
      }
      try{
        const cs=await pb.collection('cities').getFullList({requestKey:null});
        this.cityOptions=cs.map(c=>({name:c.name,lat:c.latitude,lon:c.longitude}));
      }catch(e){
        console.warn('Failed to load city options:',e.message);
        this.cityOptions=[{name:'London',lat:51.5074,lon:-0.1278},{name:'Current Location',lat:null,lon:null}];
      }
    },

    async getPrayerTimes(){if(!navigator.geolocation){console.warn("Geolocation not supported.");return;}try{const p=await new Promise((rs,rj)=>navigator.geolocation.getCurrentPosition(rs,rj,{timeout:8000,maximumAge:7200000,enableHighAccuracy:false}));const{latitude,longitude}=p.coords;try{const r=await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&accept-language=en`);if(!r.ok)throw new Error(`Nominatim ${r.status}`);const d=await r.json();this.city=d.address?.city||d.address?.town||d.address?.village||"Current";}catch(e){console.warn("City lookup failed:",e.message);}await this.fetchPrayerTimes(latitude,longitude);}catch(e){console.warn('Geolocation/prayer times setup failed:',e.message);}},

    async fetchPrayerTimes(lat,lon){
      if (!this.isOnline) {
        this.showMessage("Cannot fetch prayer times while offline", true);
        return;
      }
      try{
        const t=new Date(),dk=`${t.getFullYear()}_${t.getMonth()+1}_${t.getDate()}`,ck=`pt_${dk}_${lat.toFixed(2)}_${lon.toFixed(2)}`;
        
        // Online-first: Still cache prayer times as they don't change often
        const ca=localStorage.getItem(ck);
        if(ca){
          try{
            this.setPrayerTimes(JSON.parse(ca));
            return;
          }catch(e){
            localStorage.removeItem(ck);
          }
        }
        
        const r=await fetch(`https://api.aladhan.com/v1/calendar/${t.getFullYear()}/${t.getMonth()+1}?latitude=${lat}&longitude=${lon}&method=2`);
        if(!r.ok)throw new Error(`Aladhan API ${r.status}`);
        const d=await r.json();
        if(d?.data?.[t.getDate()-1]?.timings){
          localStorage.setItem(ck,JSON.stringify(d.data[t.getDate()-1].timings));
          this.setPrayerTimes(d.data[t.getDate()-1].timings);
        }else{
          console.error("Invalid prayer times data from Aladhan:",d);
        }
      }catch(e){
        console.warn('Prayer times fetch failed:',e.message);
      }
    },

    setPrayerTimes(timings){if(typeof timings!=='object'||timings===null)return;const qt=this.calculateQiyamTime(timings.Fajr,timings.Maghrib);const pm={Q:qt,F:timings.Fajr,D:timings.Dhuhr,A:timings.Asr,M:timings.Maghrib,I:timings.Isha};let ch=false;this.times.forEach(t=>{if(pm.hasOwnProperty(t.label)){const nt=this.formatTime(pm[t.label]);if(t.value!==nt){t.value=nt;ch=true;}}});if(ch&&!isInitializing)this.saveData().catch(e=>this.showMessage('Save failed: '+e.message,true));},
    formatTime(ts){if(!ts||typeof ts!=='string')return"";const p=ts.split(" ")[0].split(":");if(p.length<2)return"";const h=parseInt(p[0]),m=parseInt(p[1]);if(isNaN(h)||isNaN(m))return"";return`${h%12||12}:${m.toString().padStart(2,'0')}${h>=12?"PM":"AM"}`;},
    calculateQiyamTime(fajr,maghrib){if(!fajr||!maghrib||typeof fajr!=='string'||typeof maghrib!=='string')return"";const parse=s=>{const p=s.split(" ")[0].split(":");if(p.length<2)return NaN;return(parseInt(p[0])*60)+parseInt(p[1]);};const fm=parse(fajr),mm=parse(maghrib);if(isNaN(fm)||isNaN(mm))return"";const nd=fm>=mm?fm-mm:(1440-mm)+fm;const lto=Math.floor((nd/3)*2);let qsm=(mm+lto)%1440;const qh=Math.floor(qsm/60),qm=qsm%60;return`${qh.toString().padStart(2,'0')}:${qm.toString().padStart(2,'0')}`;},

    updateDayValue(dm,rv){if(rv===''||rv===null||typeof rv==='undefined'){dm.value=null;}else{let n=parseFloat(rv);if(isNaN(n)){dm.value=null;}else{const mc=(typeof dm.max==='number')?dm.max:Infinity;dm.value=Math.max(0,Math.min(n,mc));}}},
    validateAndSave(){this.$nextTick(()=>{this.calculateScores();this.saveData().catch(e=>{console.error("Save failed:",e);this.showMessage("Error saving: " + e.message,true);});});},
    getDayValueForInput:v=>(v===null||typeof v==='undefined')?'':String(v),

    saveData(){
      if (!this.isOnline) {
        this.showMessage("Cannot save while offline. Changes will be lost!", true);
        return Promise.reject(new Error("Offline"));
      }

      return new Promise((resolve,reject)=>{
        if(isInitializing){
          resolve();
          return;
        }
        
        clearTimeout(this.saveTimeout);
        this.saveStatus='saving';
        
        // Online-first: Immediate save, no debouncing
        this.saveTimeout=setTimeout(async()=>{
          try{
            this.calculateScores();
            const uD=this.getCurrentUserData();
            const uDS=JSON.stringify(uD);
            
            // Save to server immediately
            await this.saveToPocketbase(this.currentWeek,uD);
            
            // Local storage is backup only
            try {
              localStorage.setItem(`planner_${this.currentWeek}`,uDS);
            } catch (e) {
              console.warn("Failed to save local backup:", e);
            }
            
            lastSavedState=uDS;
            this.saveStatus='saved';
            resolve();
            
          }catch(e){
            console.error('Save failed:',e);
            this.saveStatus='error';
            this.showMessage('Save failed: ' + e.message, true);
            reject(e);
          }
        }, 250); // Much shorter delay for online-first
      });
    },

    async confirmLoadWeek(iw){
      if (!this.isOnline) {
        this.showMessage("Cannot load different week while offline", true);
        return;
      }
      
      if(this.editingField)this.saveEdit();
      if(this.hasSignificantChanges()&&iw!==this.currentWeek){
        if(!confirm("Unsaved changes. Save before loading?")){
          this.loadWeek(iw);
          return;
        }
        try{
          await this.saveData();
          this.showMessage("Changes saved.");
        }catch(e){
          this.showMessage("Failed to save. Loading new week anyway.",true);
        }
      }
      this.loadWeek(iw);
    },

    hasSignificantChanges:()=>(!lastSavedState||JSON.stringify(this.getCurrentUserData())!==lastSavedState),

    async saveToPocketbase(wId,uD){
      try{
        const ex=await pb.collection('planners').getFirstListItem(`week_id="${wId}"`,{requestKey:null});
        await pb.collection('planners').update(ex.id,uD,{requestKey:null});
      }catch(e){
        if(e.status===404){
          await pb.collection('planners').create(uD,{requestKey:null});
        }else{
          console.error(`Error saving to PB (week:${wId}):`,e.originalError||e.response||e.message);
          throw e;
        }
      }
    },

    async deleteFromPocketbase(wId){
      try{
        const ex=await pb.collection('planners').getFirstListItem(`week_id="${wId}"`,{requestKey:null});
        await pb.collection('planners').delete(ex.id,{requestKey:null});
      }catch(e){
        if(e.status!==404){
          console.error(`Error deleting from PB (week:${wId}):`,e.originalError||e.response||e.message);
          throw e;
        }
      }
    },

    async fetchSavedWeeks(){
      if (!this.isOnline) {
        this.showMessage("Cannot fetch saved weeks while offline", true);
        this.savedWeeks = [];
        return;
      }
      
      const wm=new Map(),ci=this.getCurrentIsoWeek();
      const addW=(i,dr,s,isc)=>{
        if(!i||typeof i!=='string'||!i.match(/^\d{4}-W\d{1,2}$/))return;
        const ex=wm.get(i);
        let ndr=dr;
        if(!ndr){
          try{
            ndr=this.getWeekDateRange(this.parseISOWeek(i));
          }catch(e){
            ndr="Invalid Date";
          }
        }
        wm.set(i,{iso_week:i,dateRange:ndr,source:s,isCurrent:isc});
      };
      
      try{
        addW(ci,this.getWeekDateRange(this.parseISOWeek(ci)),'current',true);
      }catch(e){
        console.error("Error adding current week to map:", e); 
        addW(ci,"Error",'current',true);
      }

      try{
        const rs=await pb.collection('planners').getFullList({sort:'-week_id',fields:'week_id,date_range',requestKey:null});
        rs.forEach(r=>addW(r.week_id,r.date_range,'pocketbase',r.week_id===ci));
      }catch(e){
        console.error('Fetch saved weeks from PB failed:',e.message);
        this.showMessage('Failed to fetch saved weeks: ' + e.message, true);
      }
      
      this.savedWeeks=Array.from(wm.values()).sort((a,b)=>{
        if(a.isCurrent&&!b.isCurrent)return-1;
        if(!a.isCurrent&&b.isCurrent)return 1;
        return b.iso_week.localeCompare(a.iso_week);
      });
    },

    async deleteWeek(iw){
      if (!this.isOnline) {
        this.showMessage("Cannot delete week while offline", true);
        return;
      }
      
      try{
        await this.deleteFromPocketbase(iw);
        this.showMessage(`Week ${iw} deleted from server.`);
        
        // Also remove local backup
        localStorage.removeItem(`planner_${iw}`);
      }catch(e){
        console.error('PB delete failed:',e.message);
        this.showMessage(`Failed to delete ${iw}: ` + e.message, true);
        return;
      }
      
      this.savedWeeks=this.savedWeeks.filter(w=>w.iso_week!==iw);
      if(this.currentWeek===iw){
        await this.loadWeek(this.getCurrentIsoWeek(),true);
      }
    },

    async confirmDeleteWeek(iw){
      if (!this.isOnline) {
        this.showMessage("Cannot delete week while offline", true);
        return;
      }
      if(confirm(`Delete week ${iw}? This cannot be undone.`)){
        await this.deleteWeek(iw);
      }
    },

    getCurrentIsoWeek:()=>{const d=new Date();d.setUTCHours(0,0,0,0);d.setUTCDate(d.getUTCDate()+4-(d.getUTCDay()||7));const y=d.getUTCFullYear();const w1=new Date(Date.UTC(y,0,1));return`${y}-W${Math.ceil((((d.getTime()-w1.getTime())/864e5)+1)/7).toString().padStart(2,'0')}`;},
    parseISOWeek(iso){const m=iso.match(/^(\d{4})-W(\d{1,2})$/);if(!m)throw new Error(`Invalid ISO: ${iso}`);const y=parseInt(m[1]),w=parseInt(m[2]);if(w<1||w>53)throw new Error(`Invalid week: ${w}`);const s=new Date(Date.UTC(y,0,1+(w-1)*7));const d=s.getUTCDay()||7;const sd=s;if(d<=4)sd.setUTCDate(s.getUTCDate()-d+1);else sd.setUTCDate(s.getUTCDate()+8-d);const thu=new Date(sd.valueOf());thu.setUTCDate(thu.getUTCDate()+3);if(thu.getUTCFullYear()!==y&&w<50){sd.setUTCFullYear(y-1);sd.setUTCDate(sd.getUTCDate()+((new Date(Date.UTC(y-1,0,4)).getUTCDay()||7)<=4?0:7));}else if(thu.getUTCFullYear()!==y&&w>2){sd.setUTCFullYear(y+1);sd.setUTCDate(sd.getUTCDate()-((new Date(Date.UTC(y+1,0,4)).getUTCDay()||7)<=4?0:7));}return sd;},
    getWeekDateRange(mon){if(!(mon instanceof Date)||isNaN(mon.getTime()))return"Invalid Date";const s=new Date(mon.getTime()),e=new Date(mon.getTime());e.setUTCDate(s.getUTCDate()+6);return`${this.formatDate(s)}-${this.formatDate(e)}`;},
    formatDate(d){if(!(d instanceof Date)||isNaN(d.getTime()))return"??/??";return`${(d.getUTCMonth()+1).toString().padStart(2,'0')}/${d.getUTCDate().toString().padStart(2,'0')}`;},

    showMessage(msg,isErr=false){this.notificationMessage=msg;this.showNotification=true;const el=document.getElementById('notification');if(el){el.classList.remove('status-error','status-success');el.classList.add(isErr?'status-error':'status-success');}clearTimeout(this.notificationTimeout);this.notificationTimeout=setTimeout(()=>this.showNotification=false,isErr?5000:3000);},

    calculateScores(){const dt={mon:0,tue:0,wed:0,thu:0,fri:0,sat:0,sun:0};const dK=Object.keys(dt);this.schedule.forEach(s=>{if(s.name==='TOTAL')return;s.activities.forEach(a=>{let as=0;Object.entries(a.days||{}).forEach(([d,dat])=>{const v=Number(dat.value)||0;if(v>0&&(dat.max||0)>0){dt[d]=(dt[d]||0)+v;as+=v;}});a.score=as;a.streaks=a.streaks||{current:0,longest:0};const ti=this.currentDay===0?6:this.currentDay-1;let cs=0;for(let i=0;i<7;i++){const dio=(ti-i+7)%7;const dk=dK[dio];if(a.days&&a.days[dk]&&(Number(a.days[dk].value)||0)>0&&(a.days[dk].max||0)>0)cs++;else if(a.days&&a.days[dk])break;}a.streaks.current=cs;a.streaks.longest=Math.max(a.streaks.longest||0,cs);});});const ts=this.schedule.find(s=>s.name==='TOTAL');if(ts?.activities?.[0]){const ta=ts.activities[0];let gts=0,gms=0;Object.entries(dt).forEach(([d,t])=>{if(ta.days?.[d])ta.days[d].value=t;gts+=t;});this.schedule.forEach(s=>{if(s.name!=='TOTAL')s.activities.forEach(act=>gms+=(act.maxScore||0));});ta.score=gts;ta.maxScore=gms;this.updateProgressBar(ta);}}
  };
}
