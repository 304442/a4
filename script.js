function plannerApp() {
  const pb = new PocketBase('/');
  pb.autoCancellation(false);
  let isInitializing = true;
  let lastSavedState = null;
  let uniqueIdCounter = 0;
  const generateId = () => `id_${Date.now()}_${uniqueIdCounter++}`;

  return {
    currentWeek: '', dateRange: '', city: '', saveStatus: 'saved', saveTimeout: null,
    showNotification: false, notificationMessage: '', notificationTimeout: null, isOnline: navigator.onLine,
    showCitySelector: false, showWeekSelector: false, dropdownPosition: { top: 0, left: 0 },
    currentDay: (new Date()).getDay(), plannerTitle: '',
    uiConfig: {}, times: [], schedule: [], tasks: [], workoutPlan: [], meals: [],
    groceryBudget: '', groceryList: [], bodyMeasurements: [], financials: [],
    currentTemplate: null, currentTemplateId: null, savedWeeks: [], cityOptions: [],
    editingField: null, editingValue: '',
    uiHints: { placeholders: {}, symbols: {} },
    
    // Enhanced offline support
    syncQueue: [],
    hasUnsavedLocalChanges: false,
    localStoragePrefix: 'planner_',
    offlineBackupInterval: null,

    async init() {
      this.setupEventListeners();
      this.currentWeek = this.getCurrentIsoWeek();
      this.dateRange = this.getWeekDateRange(this.parseISOWeek(this.currentWeek));
      await this.loadCityOptions();
      await this.loadWeek(this.currentWeek, true);

      // Enhanced auto-save with offline support
      setInterval(() => {
        if (!isInitializing && this.hasSignificantChanges()) {
          this.saveData();
        }
      }, 10000);

      // Periodic local backup every 30 seconds
      this.offlineBackupInterval = setInterval(() => {
        if (!isInitializing) {
          this.saveToLocalStorage();
        }
      }, 30000);

      // Process sync queue when coming online
      this.processSyncQueue();
    },

    clearPlannerStateOnError(errorTitlePrefix = "Error") {
        this.plannerTitle = `${errorTitlePrefix}: Data Unavailable`;
        this.uiConfig = {}; this.times = []; this.schedule = []; this.tasks = [];
        this.workoutPlan = []; this.meals = []; this.groceryBudget = ''; this.groceryList = [];
        this.bodyMeasurements = []; this.financials = [];
        this.uiHints = { placeholders: {}, symbols: {} };
        this.city = "N/A";
        lastSavedState = null;
    },

    setupEventListeners() {
      window.addEventListener('online', () => {
        this.isOnline = true;
        this.showMessage('Connection restored! Syncing data...', false);
        if (this.currentWeek) { 
          this.loadWeek(this.currentWeek, false);
        }
        this.processSyncQueue();
      });
      
      window.addEventListener('offline', () => { 
        this.isOnline = false; 
        this.showMessage('Working offline. Changes will sync when connection is restored.', false);
      });
      
      document.addEventListener('click', e => {
        if (!e.target.closest('.dropdown,.clickable')) {
          this.showCitySelector = this.showWeekSelector = false;
        }
        if (this.editingField && !e.target.closest('.inline-edit-active-wrapper')) {
            this.saveEdit();
        }
      });

      // Enhanced beforeunload warning for unsaved changes
      window.addEventListener('beforeunload', (e) => {
        if (this.hasUnsavedLocalChanges || this.syncQueue.length > 0) {
          e.preventDefault();
          e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
          return e.returnValue;
        }
      });

      // Save to local storage before page unload
      window.addEventListener('beforeunload', () => {
        this.saveToLocalStorage();
      });
    },

    // Enhanced local storage management
    saveToLocalStorage() {
      try {
        const userData = this.getCurrentUserData();
        const localData = {
          data: userData,
          timestamp: Date.now(),
          week: this.currentWeek,
          isOfflineVersion: !this.isOnline
        };
        
        localStorage.setItem(this.localStoragePrefix + this.currentWeek, JSON.stringify(localData));
        
        // Also save a manifest of all locally stored weeks
        const manifest = JSON.parse(localStorage.getItem(this.localStoragePrefix + 'manifest') || '{}');
        manifest[this.currentWeek] = {
          timestamp: Date.now(),
          hasUnsavedChanges: this.hasUnsavedLocalChanges
        };
        localStorage.setItem(this.localStoragePrefix + 'manifest', JSON.stringify(manifest));
        
        return true;
      } catch (error) {
        console.error('Failed to save to localStorage:', error);
        this.showMessage('Local storage failed. Changes may be lost!', true);
        return false;
      }
    },

    loadFromLocalStorage(weekId) {
      try {
        const localData = localStorage.getItem(this.localStoragePrefix + weekId);
        if (localData) {
          const parsed = JSON.parse(localData);
          return {
            success: true,
            data: parsed.data,
            timestamp: parsed.timestamp,
            isOfflineVersion: parsed.isOfflineVersion
          };
        }
        return { success: false };
      } catch (error) {
        console.error('Failed to load from localStorage:', error);
        return { success: false };
      }
    },

    clearLocalStorage(weekId) {
      try {
        localStorage.removeItem(this.localStoragePrefix + weekId);
        const manifest = JSON.parse(localStorage.getItem(this.localStoragePrefix + 'manifest') || '{}');
        delete manifest[weekId];
        localStorage.setItem(this.localStoragePrefix + 'manifest', JSON.stringify(manifest));
        return true;
      } catch (error) {
        console.error('Failed to clear localStorage:', error);
        return false;
      }
    },

    // Enhanced sync queue management
    addToSyncQueue(weekId, userData) {
      const existingIndex = this.syncQueue.findIndex(item => item.weekId === weekId);
      const queueItem = {
        weekId,
        userData,
        timestamp: Date.now(),
        retryCount: 0
      };
      
      if (existingIndex >= 0) {
        this.syncQueue[existingIndex] = queueItem;
      } else {
        this.syncQueue.push(queueItem);
      }
      
      // Save queue to localStorage
      try {
        localStorage.setItem(this.localStoragePrefix + 'syncQueue', JSON.stringify(this.syncQueue));
      } catch (error) {
        console.error('Failed to save sync queue:', error);
      }
    },

    async processSyncQueue() {
      if (!this.isOnline || this.syncQueue.length === 0) return;

      // Load queue from localStorage if empty
      if (this.syncQueue.length === 0) {
        try {
          const savedQueue = localStorage.getItem(this.localStoragePrefix + 'syncQueue');
          if (savedQueue) {
            this.syncQueue = JSON.parse(savedQueue);
          }
        } catch (error) {
          console.error('Failed to load sync queue:', error);
        }
      }

      this.saveStatus = 'syncing';
      let successCount = 0;
      let failCount = 0;

      // Process queue items
      for (let i = this.syncQueue.length - 1; i >= 0; i--) {
        const item = this.syncQueue[i];
        try {
          await this.saveToPocketbase(item.weekId, item.userData);
          this.syncQueue.splice(i, 1);
          successCount++;
          
          // Clear local storage for successfully synced items
          this.clearLocalStorage(item.weekId);
          if (item.weekId === this.currentWeek) {
            this.hasUnsavedLocalChanges = false;
          }
        } catch (error) {
          console.error(`Failed to sync ${item.weekId}:`, error);
          item.retryCount = (item.retryCount || 0) + 1;
          failCount++;
          
          // Remove items that have failed too many times
          if (item.retryCount > 3) {
            this.syncQueue.splice(i, 1);
            this.showMessage(`Failed to sync week ${item.weekId} after 3 attempts`, true);
          }
        }
      }

      // Update localStorage with remaining queue
      try {
        localStorage.setItem(this.localStoragePrefix + 'syncQueue', JSON.stringify(this.syncQueue));
      } catch (error) {
        console.error('Failed to save sync queue:', error);
      }

      // Update status
      if (this.syncQueue.length === 0) {
        this.saveStatus = 'saved';
        if (successCount > 0) {
          this.showMessage(`Synced ${successCount} week${successCount > 1 ? 's' : ''} successfully!`, false);
        }
      } else {
        this.saveStatus = 'error';
        this.showMessage(`Sync partially failed. ${this.syncQueue.length} items remaining in queue.`, true);
      }
    },

    async fetchTemplate(templateName = "default") {
        const filter = templateName === "default" ? 'is_default=true' : `name="${templateName}"`;
        const templateData = await pb.collection('templates').getFirstListItem(filter, { requestKey: null });
        return { data: templateData, success: true, source: 'network' };
    },

    async fetchTemplateById(templateId) {
        const templateData = await pb.collection('templates').getOne(templateId, { requestKey: null });
        return { data: templateData, success: true, source: 'network' };
    },

    applyTemplateStructure(template) {
      this.currentTemplate = template; this.currentTemplateId = template.id;
      const s = template.structure;
      const ui = s.ui; const headers = ui.headers; const tasksInfo = s.tasks; const groceryInfo = s.grocery;

      this.plannerTitle = ui.title_default;
      this.uiConfig = {
        mainTableHeaders: headers.main_table, dayHeaders: headers.days,
        maxHeaders: headers.max_cols, taskHeaders: headers.tasks, sectionTitles: ui.sections
      };
      this.uiHints.placeholders = ui.placeholders; this.uiHints.symbols = ui.symbols;
      this.times = Array.isArray(s.prayer_times) ? [...s.prayer_times] : [];
      this.schedule = this.buildScheduleFromTemplate(s.schedule);
      this.tasks = Array(tasksInfo.count || 0).fill().map(() => ({ id: generateId(),num:'',priority:'',tag:'',description:'',startDate:'',expectedDate:'',actualDate:'',completed:''}));
      this.workoutPlan = this.buildWorkoutFromTemplate(s.workout);
      this.meals = this.ensureIds(Array.isArray(s.meals) ? [...s.meals] : []);
      this.groceryBudget = groceryInfo.budget_default || '';
      this.groceryList = this.ensureIds(Array.isArray(groceryInfo.categories) ? [...groceryInfo.categories] : []);
      this.bodyMeasurements = (Array.isArray(s.measurements) ? s.measurements.map(m => ({ ...m, id: m.id || generateId(), value: '', })) : []).map(item => ({ ...item, id: item.id || generateId() }));
      this.financials = (Array.isArray(s.financials) ? s.financials.map(f => ({ ...f, id: f.id || generateId(), value: '', })) : []).map(item => ({ ...item, id: item.id || generateId() }));
      this.city = s.city_default;
    },

    buildScheduleFromTemplate(templateSchedule) {
      if (!Array.isArray(templateSchedule)) return [];
      return templateSchedule.map(section => ({
        id: generateId(), name: section.name,
        activities: (Array.isArray(section.activities) ? section.activities : []).map(activity => ({
          id: generateId(), name: activity.name,
          days: this.createDaysStructure(activity.days, activity.max_per_day || 1),
          score: 0, maxScore: Number(activity.max_score) || 0,
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
        this.showWeekSelector = false; this.currentWeek = isoWeek;
        const parsedDate = this.parseISOWeek(isoWeek);
        this.dateRange = this.getWeekDateRange(parsedDate);
        
        let plannerRecord = null;
        let useLocalData = false;
        
        // Try to load from server first, fallback to local storage
        if (this.isOnline) {
            try {
                plannerRecord = await this.fetchPlannerRecord(isoWeek);
            } catch (error) {
                console.warn('Failed to fetch from server, trying local storage:', error);
            }
        }
        
        // If no server data or offline, try local storage
        if (!plannerRecord) {
            const localResult = this.loadFromLocalStorage(isoWeek);
            if (localResult.success) {
                plannerRecord = localResult.data;
                useLocalData = true;
                this.hasUnsavedLocalChanges = true;
                this.showMessage('Loaded from local storage', false);
            }
        }
        
        // Load template
        let templateResult;
        if (plannerRecord?.template_id) {
            try { 
                templateResult = await this.fetchTemplateById(plannerRecord.template_id); 
            } catch (e) { 
                templateResult = await this.fetchTemplate("default"); 
            }
        } else { 
            templateResult = await this.fetchTemplate("default"); 
        }
        
        this.applyTemplateStructure(templateResult.data);
        if (plannerRecord) { 
            this.overlayUserData(plannerRecord); 
        }
        this.calculateScores();
        
        if (isInitLoad && this.isOnline && !this.times.some(t => t.value)) { 
            await this.getPrayerTimes(); 
        }
        
        lastSavedState = JSON.stringify(this.getCurrentUserData());
        if (isInitLoad) isInitializing = false;
        
        // Update save status based on data source
        if (useLocalData) {
            this.saveStatus = 'local';
        } else if (this.isOnline) {
            this.saveStatus = 'saved';
            this.hasUnsavedLocalChanges = false;
        }
    },

    async fetchPlannerRecord(isoWeek) {
      try { return await pb.collection('planners').getFirstListItem(`week_id="${isoWeek}"`, { requestKey: null }); }
      catch (error) { if (error.status === 404) return null; throw error; }
    },

    overlayUserData(record){
        if(record.title)this.plannerTitle=record.title; if(record.city)this.city=record.city;
        if(record.prayer_times)this.overlayArray(this.times,record.prayer_times,['label','value']);
        if(record.schedule_data)this.overlayScheduleData(record.schedule_data);
        if(record.tasks_data)this.overlayArray(this.tasks,record.tasks_data,['id','num','priority','tag','description','startDate','expectedDate','actualDate','completed']);
        if(record.workout_data)this.overlayWorkoutData(record.workout_data);
        if(record.meals_data)this.overlayArray(this.meals,record.meals_data,['id','name','ingredients']);
        if(record.grocery_data)this.overlayGroceryData(record.grocery_data);
        const overlayListWithTemplateStructure = (targetList, savedData, keyField = 'name') => {
            if (Array.isArray(savedData)) {
                const savedMap = savedData.reduce((map, item) => { map[item[keyField]] = item; return map; }, {});
                return targetList.map(templateItem => {
                    const savedItem = savedMap[templateItem[keyField]];
                    if (savedItem) return { ...templateItem, ...savedItem, value: savedItem.value || '' };
                    return { ...templateItem, value: '' };
                });
            }
            return targetList.map(item => ({...item, value: ''}));
        };
        this.bodyMeasurements = overlayListWithTemplateStructure(this.bodyMeasurements, record.measurements_data);
        this.financials = overlayListWithTemplateStructure(this.financials, record.financials_data);
    },
    
    overlayArray(target,source,fieldsToCopy=null){if(!Array.isArray(target)||!Array.isArray(source))return;source.forEach(sItem=>{if(typeof sItem!=='object'||sItem===null)return;const tItem=target.find(t=>(t.id&&sItem.id&&t.id===sItem.id)||(t.name&&sItem.name&&t.name===sItem.name));if(tItem){if(fieldsToCopy&&Array.isArray(fieldsToCopy)){fieldsToCopy.forEach(f=>{if(sItem.hasOwnProperty(f))tItem[f]=sItem[f];});}else{Object.assign(tItem,sItem);}}});},
    overlayScheduleData(schedData){if(!Array.isArray(schedData))return;schedData.forEach(sSect=>{if(typeof sSect!=='object'||sSect===null)return;const sect=this.schedule.find(s=>s.name===sSect.name);if(sect&&Array.isArray(sSect.activities)){sSect.activities.forEach(sAct=>{if(typeof sAct!=='object'||sAct===null)return;const act=sect.activities.find(a=>a.name===sAct.name);if(act){if(sAct.days&&typeof sAct.days==='object'){Object.keys(act.days).forEach(day=>{if(sAct.days[day]&&act.days[day]){act.days[day].value=sAct.days[day].value===undefined?null:Number(sAct.days[day].value);}});}act.score=Number(sAct.score)||0;act.streaks=(sAct.streaks&&typeof sAct.streaks==='object')?sAct.streaks:{current:0,longest:0};}});}});},
    overlayWorkoutData(wData){if(!Array.isArray(wData))return;wData.forEach(sDay=>{if(typeof sDay!=='object'||sDay===null)return;const day=this.workoutPlan.find(d=>d.name===sDay.name);if(day&&Array.isArray(sDay.exercises)){sDay.exercises.forEach(sEx=>{if(typeof sEx!=='object'||sEx===null)return;const ex=day.exercises.find(e=>e.name===sEx.name);if(ex){ex.weight=sEx.weight||'';ex.sets=sEx.sets||'';ex.reps=sEx.reps||'';}});}});},
    overlayGroceryData(gData){if(typeof gData!=='object'||gData===null)return;if(gData.budget)this.groceryBudget=gData.budget;if(Array.isArray(gData.categories))this.overlayArray(this.groceryList,gData.categories,['id','name','items']);},

    getCurrentUserData(){
        const cTS = this.currentTemplate?.structure || {};
        const cTMeasurements = cTS.measurements || [];
        const cTFinancials = cTS.financials || [];
        return{week_id:this.currentWeek,template_id:this.currentTemplateId,
        title:this.plannerTitle!==cTS.ui?.title_default?this.plannerTitle:undefined,
        city:this.city!==cTS.city_default?this.city:undefined,date_range:this.dateRange,
        prayer_times:this.times.some(t=>t.value)?this.times.map(t=>({label:t.label,value:t.value})):undefined,
        schedule_data:this.extractScheduleData(),tasks_data:this.extractUserTasks(),
        workout_data:this.extractWorkoutData(),
        meals_data:this.extractUserItems(this.meals,['name','ingredients'],true),
        grocery_data:this.extractGroceryData(cTS.grocery?.budget_default),
        measurements_data:this.extractUserListItems(this.bodyMeasurements, cTMeasurements, ['value'], ['placeholder', 'unit']),
        financials_data:this.extractUserListItems(this.financials, cTFinancials, ['value', 'account'], ['placeholder', 'currency_symbol'])};
    },
    
    extractScheduleData(){return this.schedule.map(s=>({id:s.id,name:s.name,activities:s.activities.map(a=>{const dVal=Object.entries(a.days||{}).filter(([_,dat])=>dat.value!==null).reduce((acc,[day,dat])=>{acc[day]={value:dat.value};return acc;},{});const tA=this.findTemplateActivity(s.name,a.name);const mScoreTmpl=tA?.max_score||0;return{id:a.id,name:a.name,days:Object.keys(dVal).length>0?dVal:undefined,score:a.score||undefined,maxScore:a.maxScore!==mScoreTmpl?a.maxScore:undefined,streaks:(a.streaks?.current||a.streaks?.longest)?a.streaks:undefined};}).filter(a=>a.days||a.score!==undefined||a.maxScore!==undefined||a.streaks)})).filter(s=>s.activities.length>0);},
    findTemplateActivity(sName,aName){const tS=this.currentTemplate?.structure?.schedule?.find(s=>s.name===sName);return tS?.activities?.find(a=>a.name===aName);},
    extractUserTasks(){return this.tasks.map(t=>({id:t.id,num:t.num||undefined,priority:t.priority||undefined,tag:t.tag||undefined,description:t.description||undefined,startDate:t.startDate||undefined,expectedDate:t.expectedDate||undefined,actualDate:t.actualDate||undefined,completed:t.completed||undefined})).filter(t=>Object.keys(t).some(k=>k!=='id'&&t[k]!==undefined));},
    extractWorkoutData(){return this.workoutPlan.map(d=>({id:d.id,name:d.name,exercises:d.exercises.map(ex=>{const tEx=this.currentTemplate?.structure?.workout?.find(wd=>wd.name===d.name)?.exercises?.find(te=>te.name===ex.name);return{id:ex.id,name:ex.name,weight:ex.weight&&ex.weight!==String(tEx?.default_weight||'')?ex.weight:undefined,sets:ex.sets&&ex.sets!==String(tEx?.default_sets||'')?ex.sets:undefined,reps:ex.reps&&ex.reps!==String(tEx?.default_reps||'')?ex.reps:undefined};}).filter(ex=>ex.weight!==undefined||ex.sets!==undefined||ex.reps!==undefined)})).filter(d=>d.exercises.length>0);},
    extractUserItems(items,fields,withId=false){return items.map(item=>{const ext={};if(withId&&item.id)ext.id=item.id;let hasVal=false;fields.forEach(f=>{if(item[f]!==undefined&&item[f]!==null&&item[f]!==''){ext[f]=item[f];hasVal=true;}});return hasVal?ext:null;}).filter(item=>item!==null);},
    extractUserListItems(currentItems, templateItems, dataFieldsToSave, hintFieldsToCompare) {
        return currentItems.map(currentItem => {
            const extractedItem = { id: currentItem.id, name: currentItem.name };
            let hasMeaningfulChange = false;
            const correspondingTemplateItem = templateItems.find(t => t.name === currentItem.name);
            dataFieldsToSave.forEach(field => {
                if (currentItem[field] !== undefined && currentItem[field] !== null && currentItem[field] !== '') {
                    extractedItem[field] = currentItem[field];
                    hasMeaningfulChange = true;
                }
            });
            if (correspondingTemplateItem) {
                hintFieldsToCompare.forEach(hintField => {
                    if (currentItem[hintField] !== undefined && currentItem[hintField] !== correspondingTemplateItem[hintField]) {
                        if (currentItem[hintField] !== null && currentItem[hintField] !== '') {
                             extractedItem[hintField] = currentItem[hintField];
                             hasMeaningfulChange = true;
                        }
                    }
                });
            }
            return hasMeaningfulChange ? extractedItem : null;
        }).filter(item => item !== null);
    },
    extractGroceryData(defaultBudget){const cats=this.extractUserItems(this.groceryList,['name','items'],true);const bud=(this.groceryBudget&&this.groceryBudget!==defaultBudget)?this.groceryBudget:undefined;if(bud===undefined&&cats.length===0)return undefined;return{budget:bud,categories:cats.length>0?cats:undefined};},

    getEditableElementId(t,...a){let id=a.map(arg=>(typeof arg==='object'&&arg!==null)?Object.values(arg).join('_'):String(arg)).join('_');return`${t}_edit_${id}`.replace(/\W/g,'_');},
    isEditing(t,...a){return this.editingField?.id===this.getEditableElementId(t,...a);},
    startEdit(e,t,v,...a){if(this.editingField&&(this.editingField.id!==this.getEditableElementId(t,...a)))this.saveEdit();const id=this.getEditableElementId(t,...a);this.editingField={type:t,id,originalValue:v,args:a};this.editingValue=v;this.$nextTick(()=>document.querySelector(`[data-edit-id="${id}"]`)?.focus()?.select());},
    saveEdit(){if(!this.editingField)return;const vChanged=(typeof this.editingValue==='string'&&typeof this.editingField.originalValue==='string')?this.editingValue.trim()!==this.editingField.originalValue.trim():this.editingValue!==this.editingField.originalValue;if(vChanged){this.updateField(this.editingField.type,this.editingValue,...this.editingField.args);this.saveData();}this.editingField=null;this.editingValue='';},
    cancelEdit(){this.editingField=null;this.editingValue='';},
    updateField(t,v,...a){const h={plannerTitle:()=>this.plannerTitle=v,timeLabel:i=>this.times[i].label=v,sectionTitle:k=>this.uiConfig.sectionTitles[k]=v,header:(ht,idx)=>this.uiConfig[{main:'mainTableHeaders',day:'dayHeaders',max:'maxHeaders',task:'taskHeaders'}[ht]][idx]=v,sectionName:sIdx=>this.schedule[this.schedule.length-1-sIdx].name=v,activityPrefix:i=>this.updateActivityName(i,v,true),activityName:i=>this.updateActivityName(i,v,false),maxValue:i=>this.getScheduleActivity(i).days[i.day].max=parseInt(v)||0,maxScore:i=>this.getScheduleActivity(i).maxScore=parseInt(v)||0,workoutDayName:i=>this.workoutPlan[i].name=v,exerciseName:i=>this.workoutPlan[i.dayIdx].exercises[i.exIdx].name=v,mealName:i=>this.meals[i].name=v,mealIngredients:i=>this.meals[i].ingredients=v,groceryCategoryName:i=>this.groceryList[i].name=v,groceryCategoryItems:i=>this.groceryList[i].items=v,measurementName:i=>this.bodyMeasurements[i].name=v,financialName:i=>this.financials[i].name=v,financialAccount:i=>this.financials[i].account=v};if(h[t])h[t](...a);},
    updateActivityName(idx,val,isPre){const act=this.getScheduleActivity(idx);if(!act)return;const pts=act.name.split(':');const cN=act.name.includes(':')?pts.slice(1).join(':').trimStart():act.name;const cP=act.name.includes(':')?pts[0].trim():"";act.name=isPre?(val.trim()+(cN?':'+cN:'')):(cP?cP+': ':'')+val.trim();},
    getScheduleActivity(idx){const actualIdx=this.schedule.length-1-idx.sIdx;return this.schedule[actualIdx]?.activities[idx.aIdx];},

    getTaskDelay(t){if(!t.expectedDate||!t.actualDate)return 0;const ed=new Date(t.expectedDate),ad=new Date(t.actualDate);if(isNaN(ed.getTime())||isNaN(ad.getTime()))return 0;return Math.ceil((ad-ed)/86400000);},
    calculateTaskDelay(t){t._delay=this.getTaskDelay(t);},
    formatDelay(d){if(d==null||d===0)return this.uiHints.symbols?.task_delay_ontime;return d>0?`+${d}d`:`${d}d`;},
    toggleTaskCompletion(t){t.completed=t.completed=== this.uiHints.symbols?.task_checkbox_checked ? '' : this.uiHints.symbols?.task_checkbox_checked;if(t.completed===this.uiHints.symbols?.task_checkbox_checked &&!t.actualDate)t.actualDate=new Date().toISOString().split('T')[0];this.calculateTaskDelay(t);this.saveData();},
    getScoreClass(a){if(!a||typeof a.score!=='number'||typeof a.maxScore!=='number'||a.maxScore<=0)return'';const r=a.score/a.maxScore;return r<0.33?'score-low':r<0.66?'score-medium':'score-high';},
    getTaskRowClass(t){let c=[];if(t.completed===this.uiHints.symbols?.task_checkbox_checked)c.push('task-completed');const d=this.getTaskDelay(t);if(d>0)c.push('task-delayed');else if(d<0)c.push('task-early');return c.join(' ');},
    getDelayClass(t){const d=this.getTaskDelay(t);return d<0?'delay-negative':d>0?'delay-positive':'delay-zero';},
    getProgressStyle(a){let p=0;if(a&&a.maxScore&&a.maxScore>0){p=Math.min(100,Math.max(0,(a.score/a.maxScore)*100));} return {'--progress-percent': `${p}%`};},
    getProgressClass(a){if(!a||typeof a.score!=='number'||typeof a.maxScore!=='number'||a.maxScore<=0)return'';const r=a.score/a.maxScore;return r<0.33?'progress-low':r<0.66?'progress-medium':'progress-high';},

    getDropdownStyle:()=>`top:${this.dropdownPosition.top}px;left:${this.dropdownPosition.left}px;`,
    toggleSelector(e,type){const p=`show${type[0].toUpperCase()+type.slice(1)}Selector`,o=type==='city'?'showWeekSelector':'showCitySelector';if(this[p]&&e.currentTarget.classList.contains('clickable')){this[p]=false;return;}this[o]=false;const r=e.currentTarget.getBoundingClientRect();this.dropdownPosition={top:r.bottom+window.scrollY,left:r.left+window.scrollX};this[p]=!this[p];if(type==='week'&&this[p])this.fetchSavedWeeks();},

    async selectCity(cOpt){this.city=cOpt.name;this.showCitySelector=false;if(this.isOnline){if(cOpt.lat===null&&cOpt.lon===null)await this.getPrayerTimes();else if(typeof cOpt.lat==='number'&&typeof cOpt.lon==='number')await this.fetchPrayerTimes(cOpt.lat,cOpt.lon);this.saveData();}},

    async loadCityOptions(){
        if (this.isOnline) {
            try {
                const cs=await pb.collection('cities').getFullList({requestKey:null});
                this.cityOptions=cs.map(c=>({name:c.name,lat:c.latitude,lon:c.longitude}));
            } catch (error) {
                console.warn('Failed to load city options:', error);
                // Fallback to basic options
                this.cityOptions = [
                    {name: "Current Location", lat: null, lon: null},
                    {name: "London", lat: 51.5074, lon: -0.1278},
                    {name: "Cairo", lat: 30.0444, lon: 31.2357},
                    {name: "New York", lat: 40.7128, lon: -74.0060}
                ];
            }
        } else {
            // Offline fallback
            this.cityOptions = [
                {name: "Current Location", lat: null, lon: null},
                {name: "London", lat: 51.5074, lon: -0.1278},
                {name: "Cairo", lat: 30.0444, lon: 31.2357},
                {name: "New York", lat: 40.7128, lon: -74.0060}
            ];
        }
    },

    async getPrayerTimes(){if(!navigator.geolocation){return;}if(!this.isOnline){return;}const p=await new Promise((rs,rj)=>navigator.geolocation.getCurrentPosition(rs,rj,{timeout:8000,maximumAge:7200000,enableHighAccuracy:false}));const{latitude,longitude}=p.coords;try{const r=await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&accept-language=en`);const d=await r.json();this.city=d.address?.city||d.address?.town||d.address?.village|| (this.currentTemplate?.structure?.city_default || "Current Location");}catch(e){this.city = (this.currentTemplate?.structure?.city_default || "Current Location (lookup failed)");}await this.fetchPrayerTimes(latitude,longitude);},

    async fetchPrayerTimes(lat,lon){
      if(!this.isOnline){return;}
      const t=new Date();
      const r=await fetch(`https://api.aladhan.com/v1/calendar/${t.getFullYear()}/${t.getMonth()+1}?latitude=${lat}&longitude=${lon}&method=2`);
      const d=await r.json();
      if(d?.data?.[t.getDate()-1]?.timings){ this.setPrayerTimes(d.data[t.getDate()-1].timings); }
    },

    setPrayerTimes(timings){if(typeof timings!=='object'||timings===null)return;const qt=this.calculateQiyamTime(timings.Fajr,timings.Maghrib);const pm={Q:qt,F:timings.Fajr,D:timings.Dhuhr,A:timings.Asr,M:timings.Maghrib,I:timings.Isha};let ch=false;this.times.forEach(t=>{if(pm.hasOwnProperty(t.label)){const nt=this.formatTime(pm[t.label]);if(t.value!==nt){t.value=nt;ch=true;}}});if(ch&&!isInitializing&&this.isOnline)this.saveData();},
    formatTime(ts){if(!ts||typeof ts!=='string')return"";const p=ts.split(" ")[0].split(":");if(p.length<2)return"";const h=parseInt(p[0]),m=parseInt(p[1]);if(isNaN(h)||isNaN(m))return"";return`${h%12||12}:${m.toString().padStart(2,'0')}${h>=12?this.uiHints.symbols?.time_pm : this.uiHints.symbols?.time_am}`;},
    calculateQiyamTime(fajr,maghrib){if(!fajr||!maghrib||typeof fajr!=='string'||typeof maghrib!=='string')return"";const parse=s=>{const p=s.split(" ")[0].split(":");if(p.length<2)return NaN;return(parseInt(p[0])*60)+parseInt(p[1]);};const fm=parse(fajr),mm=parse(maghrib);if(isNaN(fm)||isNaN(mm))return"";const nd=fm>=mm?fm-mm:(1440-mm)+fm;const lto=Math.floor((nd/3)*2);let qsm=(mm+lto)%1440;const qh=Math.floor(qsm/60),qm=qsm%60;return`${qh.toString().padStart(2,'0')}:${qm.toString().padStart(2,'0')}`;},

    validateAndSave(){this.$nextTick(()=>{this.calculateScores();this.saveData();});},

    // Enhanced save function with offline support
    saveData() {
      return new Promise(async (resolve, reject) => {
        if (isInitializing) { 
          resolve(); 
          return; 
        }
        
        clearTimeout(this.saveTimeout);
        this.saveTimeout = setTimeout(async () => {
          try {
            this.calculateScores();
            const userData = this.getCurrentUserData();
            
            // Always save to local storage first
            this.saveToLocalStorage();
            
            if (this.isOnline) {
              // Try to save to server
              this.saveStatus = 'saving';
              try {
                await this.saveToPocketbase(this.currentWeek, userData);
                lastSavedState = JSON.stringify(userData);
                this.saveStatus = 'saved';
                this.hasUnsavedLocalChanges = false;
                
                // Clear local storage since we've successfully synced
                this.clearLocalStorage(this.currentWeek);
                resolve();
              } catch (error) {
                console.error('Failed to save to server:', error);
                this.saveStatus = 'error';
                this.hasUnsavedLocalChanges = true;
                
                // Add to sync queue for later
                this.addToSyncQueue(this.currentWeek, userData);
                this.showMessage('Saved locally. Will sync when connection improves.', false);
                resolve(); // Still resolve since we saved locally
              }
            } else {
              // Offline mode
              this.saveStatus = 'local';
              this.hasUnsavedLocalChanges = true;
              this.addToSyncQueue(this.currentWeek, userData);
              resolve();
            }
          } catch (error) {
            this.saveStatus = 'error';
            this.showMessage('Failed to save data!', true);
            reject(error);
          }
        }, 250);
      });
    },

    async confirmLoadWeek(iw){
      if(!this.isOnline && iw !== this.currentWeek && !this.loadFromLocalStorage(iw).success){ 
        this.showMessage('Week not available offline', true);
        return; 
      }
      if(this.editingField)this.saveEdit();
      if((this.hasSignificantChanges() || this.hasUnsavedLocalChanges) && iw!==this.currentWeek){
        if(!confirm("Unsaved changes detected. Save before loading new week?")){ 
          this.loadWeek(iw); 
          return; 
        }
        try{ 
          await this.saveData(); 
        } catch(e){
          console.warn('Save failed before loading week:', e);
        }
      }
      this.loadWeek(iw);
    },

    hasSignificantChanges:()=>(!lastSavedState||JSON.stringify(this.getCurrentUserData())!==lastSavedState),

    async saveToPocketbase(wId,uD){
      try{ const ex=await pb.collection('planners').getFirstListItem(`week_id="${wId}"`,{requestKey:null}); await pb.collection('planners').update(ex.id,uD,{requestKey:null}); }
      catch(e){ if(e.status===404){ await pb.collection('planners').create(uD,{requestKey:null}); } else{ throw e; }}
    },

    async deleteFromPocketbase(wId){
      try{ const ex=await pb.collection('planners').getFirstListItem(`week_id="${wId}"`,{requestKey:null}); await pb.collection('planners').delete(ex.id,{requestKey:null}); }
      catch(e){ if(e.status!==404){ throw e; }}
    },

    async fetchSavedWeeks(){
      if (!this.isOnline) { 
        // Load from local storage manifest
        try {
          const manifest = JSON.parse(localStorage.getItem(this.localStoragePrefix + 'manifest') || '{}');
          const localWeeks = Object.entries(manifest).map(([weekId, data]) => ({
            iso_week: weekId,
            dateRange: this.getWeekDateRange(this.parseISOWeek(weekId)),
            source: 'local',
            isCurrent: weekId === this.getCurrentIsoWeek(),
            hasUnsavedChanges: data.hasUnsavedChanges
          }));
          this.savedWeeks = localWeeks.sort((a, b) => {
            if (a.isCurrent && !b.isCurrent) return -1;
            if (!a.isCurrent && b.isCurrent) return 1;
            return b.iso_week.localeCompare(a.iso_week);
          });
        } catch (error) {
          console.error('Failed to load local weeks:', error);
          this.savedWeeks = [];
        }
        return; 
      }
      
      const wm=new Map(),ci=this.getCurrentIsoWeek();
      const addW=(i,dr,s,isc,hasUnsaved=false)=>{ if(!i||typeof i!=='string'||!i.match(/^\d{4}-W\d{1,2}$/))return; let ndr=dr; if(!ndr){try{ndr=this.getWeekDateRange(this.parseISOWeek(i));}catch(e){ndr="Invalid Date";}} wm.set(i,{iso_week:i,dateRange:ndr,source:s,isCurrent:isc,hasUnsavedChanges:hasUnsaved}); };
      try{addW(ci,this.getWeekDateRange(this.parseISOWeek(ci)),'current',true,this.hasUnsavedLocalChanges);}catch(e){addW(ci,"Error",'current',true,this.hasUnsavedLocalChanges);}
      
      try {
        const rs=await pb.collection('planners').getFullList({sort:'-week_id',fields:'week_id,date_range',requestKey:null});
        rs.forEach(r=>addW(r.week_id,r.date_range,'pocketbase',r.week_id===ci));
      } catch (error) {
        console.warn('Failed to fetch saved weeks from server:', error);
      }
      
      // Also include local-only weeks
      try {
        const manifest = JSON.parse(localStorage.getItem(this.localStoragePrefix + 'manifest') || '{}');
        Object.entries(manifest).forEach(([weekId, data]) => {
          if (!wm.has(weekId)) {
            addW(weekId, this.getWeekDateRange(this.parseISOWeek(weekId)), 'local', weekId === ci, data.hasUnsavedChanges);
          }
        });
      } catch (error) {
        console.error('Failed to include local weeks:', error);
      }
      
      this.savedWeeks=Array.from(wm.values()).sort((a,b)=>{ if(a.isCurrent&&!b.isCurrent)return-1; if(!a.isCurrent&&b.isCurrent)return 1; return b.iso_week.localeCompare(a.iso_week); });
    },

    async deleteWeek(iw){
      if (this.isOnline) {
        try {
          await this.deleteFromPocketbase(iw);
        } catch (error) {
          console.warn('Failed to delete from server:', error);
        }
      }
      
      // Always clear local storage
      this.clearLocalStorage(iw);
      
      // Remove from sync queue if present
      this.syncQueue = this.syncQueue.filter(item => item.weekId !== iw);
      try {
        localStorage.setItem(this.localStoragePrefix + 'syncQueue', JSON.stringify(this.syncQueue));
      } catch (error) {
        console.error('Failed to update sync queue:', error);
      }
      
      this.savedWeeks=this.savedWeeks.filter(w=>w.iso_week!==iw);
      if(this.currentWeek===iw){ 
        this.loadWeek(this.getCurrentIsoWeek(),true); 
      }
    },

    async confirmDeleteWeek(iw){
      if(confirm(`Delete week ${iw}? This will remove both local and server data.`)){ 
        await this.deleteWeek(iw); 
      }
    },

    getCurrentIsoWeek:()=>{const d=new Date();d.setUTCHours(0,0,0,0);d.setUTCDate(d.getUTCDate()+4-(d.getUTCDay()||7));const y=d.getUTCFullYear();const w1=new Date(Date.UTC(y,0,1));return`${y}-W${Math.ceil((((d.getTime()-w1.getTime())/864e5)+1)/7).toString().padStart(2,'0')}`;},
    parseISOWeek(iso){const m=iso.match(/^(\d{4})-W(\d{1,2})$/);const y=parseInt(m[1]),w=parseInt(m[2]);const s=new Date(Date.UTC(y,0,1+(w-1)*7));const d=s.getUTCDay()||7;const sd=s;if(d<=4)sd.setUTCDate(s.getUTCDate()-d+1);else sd.setUTCDate(s.getUTCDate()+8-d);const thu=new Date(sd.valueOf());thu.setUTCDate(thu.getUTCDate()+3);if(thu.getUTCFullYear()!==y&&w<50){sd.setUTCFullYear(y-1);sd.setUTCDate(sd.getUTCDate()+((new Date(Date.UTC(y-1,0,4)).getUTCDay()||7)<=4?0:7));}else if(thu.getUTCFullYear()!==y&&w>2){sd.setUTCFullYear(y+1);sd.setUTCDate(sd.getUTCDate()-((new Date(Date.UTC(y+1,0,4)).getUTCDay()||7)<=4?0:7));}return sd;},
    getWeekDateRange(mon){const s=new Date(mon.getTime()),e=new Date(mon.getTime());e.setUTCDate(s.getUTCDate()+6);return`${this.formatDate(s)}-${this.formatDate(e)}`;},
    formatDate(d){return`${(d.getUTCMonth()+1).toString().padStart(2,'0')}/${d.getUTCDate().toString().padStart(2,'0')}`;},

    showMessage(msg,isErr=false){
        if (typeof Alpine !== 'undefined' && Alpine.store && Alpine.store('globals')?.suppressMessages) return;
        this.notificationMessage=msg; this.showNotification=true;
        const el=document.getElementById('notification');
        if(el){ el.classList.remove('status-error','status-success'); el.classList.add(isErr?'status-error':'status-success');}
        clearTimeout(this.notificationTimeout);
        this.notificationTimeout=setTimeout(()=>this.showNotification=false,isErr?8000:5000);
    },

    calculateScores(){const dt={mon:0,tue:0,wed:0,thu:0,fri:0,sat:0,sun:0};const dK=Object.keys(dt);if(!this.schedule || this.schedule.length === 0) return;this.schedule.forEach(s=>{if(s.name==='TOTAL')return;s.activities.forEach(a=>{let as=0;Object.entries(a.days||{}).forEach(([d,dat])=>{const v=Number(dat.value)||0;if(v>0&&(dat.max||0)>0){dt[d]=(dt[d]||0)+v;as+=v;}});a.score=as;a.streaks=a.streaks||{current:0,longest:0};const ti=this.currentDay===0?6:this.currentDay-1;let cs=0;for(let i=0;i<7;i++){const dio=(ti-i+7)%7;const dk=dK[dio];if(a.days&&a.days[dk]&&(Number(a.days[dk].value)||0)>0&&(a.days[dk].max||0)>0)cs++;else if(a.days&&a.days[dk])break;}a.streaks.current=cs;a.streaks.longest=Math.max(a.streaks.longest||0,cs);});});const ts=this.schedule.find(s=>s.name==='TOTAL');if(ts?.activities?.[0]){const ta=ts.activities[0];let gts=0,gms=0;Object.entries(dt).forEach(([d,t])=>{if(ta.days?.[d])ta.days[d].value=t;gts+=t;});this.schedule.forEach(s=>{if(s.name!=='TOTAL')s.activities.forEach(act=>gms+=(act.maxScore||0));});ta.score=gts;ta.maxScore=gms;}}
  };
}
