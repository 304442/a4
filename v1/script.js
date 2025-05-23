function plannerApp() {
  const pb = new PocketBase('/');
  pb.autoCancellation(false);
  let isInitializing = true;
  let lastSavedState = null;
  let uniqueIdCounter = 0;
  const generateId = () => `id_${Date.now()}_${uniqueIdCounter++}`;

  const ensureIds = (items = [], idField = 'id') => items.map(item => ({ ...item, [idField]: item[idField] || generateId() }));
  const ensureDeepIds = (schedule = []) => schedule.map(section => ({
    ...section,
    id: section.id || generateId(),
    activities: ensureIds(section.activities || [])
  }));

  const getMinimalFallbackTemplate = () => ({
    template_name: "fallback",
    plannerTitle_default: "Weekly Planner",
    uiConfig_structure: { mainTableHeaders: ['T', 'D', 'ACTIVITY', 'S', 'M', '🔥'], dayHeaders: ['M', 'T', 'W', 'T', 'F', 'S', 'S'], maxHeaders: Array(7).fill('MAX'), taskHeaders: ['#', 'P', 'T', 'Task', 'D', '✓'], sectionTitles: { tasks: 'TASKS', workout: 'WORKOUT', meals: 'MEALS', grocery: 'GROCERY', measurements: 'BODY', financials: 'FINANCIAL' }},
    times_structure: [{ label: 'Q', value: '' },{ label: 'F', value: '' },{ label: 'D', value: '' },{ label: 'A', value: '' },{ label: 'M', value: '' },{ label: 'I', value: '' }],
    schedule_structure: ensureDeepIds([{ name: 'TOTAL', id: generateId(), activities: ensureIds([{ name: 'DAILY POINTS', days: { mon:{value:'0',max:0}, tue:{value:'0',max:0}, wed:{value:'0',max:0}, thu:{value:'0',max:0}, fri:{value:'0',max:0}, sat:{value:'0',max:0}, sun:{value:'0',max:0}}, score:0, maxScore:0, streaks:{current:0, longest:0}}]) }]),
    tasks_structure: { count: 40, defaultFields: { num: '', priority: '', tag: '', description: '', date: '', completed: '' }},
    workoutPlan_structure: [],
    meals_structure: [],
    groceryBudget_default: '',
    groceryList_structure: [],
    bodyMeasurements_structure: [],
    financials_structure: [],
    city_default: "London"
  });

  return {
    currentWeek: '', dateRange: '', city: 'London', saveStatus: 'saved', saveTimeout: null,
    showNotification: false, notificationMessage: '', notificationTimeout: null, isOnline: navigator.onLine,
    pendingSync: [], showCitySelector: false, showWeekSelector: false, dropdownPosition: { top: 0, left: 0 },
    currentDay: (new Date()).getDay(), plannerTitle: 'Weekly Planner',
    uiConfig: {}, times: [], schedule: [], tasks: [], workoutPlan: [], meals: [],
    groceryBudget: '', groceryList: [], bodyMeasurements: [], financials: [],
    currentTemplateName: null,
    cityOptions: [ { name: 'London', lat: 51.5074, lon: -0.1278 }, { name: 'Cairo', lat: 30.0444, lon: 31.2357 }, { name: 'Cape Town', lat: -33.9249, lon: 18.4241 }, { name: 'Amsterdam', lat: 52.3676, lon: 4.9041 }, { name: 'Current Location', lat: null, lon: null } ],
    savedWeeks: [],

    async fetchTemplate(templateName = "default") {
      const cacheKey = `planner_template_${templateName}`;
      try {
        const cachedTemplate = localStorage.getItem(cacheKey);
        if (cachedTemplate) return JSON.parse(cachedTemplate);
      } catch (e) { console.error("Error reading template from cache", e); localStorage.removeItem(cacheKey); }

      if (!this.isOnline) {
        this.showErrorMessage(`Offline: Cannot fetch template '${templateName}'. Using fallback.`);
        return getMinimalFallbackTemplate();
      }
      try {
        let templateRecord;
        if (templateName === "default") {
            templateRecord = await pb.collection('planner_templates').getFirstListItem('is_default=true');
        } else {
            templateRecord = await pb.collection('planner_templates').getFirstListItem(`template_name="${templateName}"`);
        }
        localStorage.setItem(cacheKey, JSON.stringify(templateRecord));
        return templateRecord;
      } catch (error) {
        console.error(`Error fetching template '${templateName}':`, error);
        this.showErrorMessage(`Could not fetch template '${templateName}'. Using fallback.`);
        return getMinimalFallbackTemplate();
      }
    },

    applyTemplate(templateData) {
      this.currentTemplateName = templateData.template_name;
      this.plannerTitle = templateData.plannerTitle_default || 'Weekly Planner';
      this.uiConfig = JSON.parse(JSON.stringify(templateData.uiConfig_structure || { mainTableHeaders:[], dayHeaders:[], maxHeaders:[], taskHeaders:[], sectionTitles:{} } ));
      this.times = JSON.parse(JSON.stringify(templateData.times_structure || []));
      this.schedule = ensureDeepIds(JSON.parse(JSON.stringify(templateData.schedule_structure || [])));
      const taskStructure = templateData.tasks_structure || { count: 40, defaultFields: {}};
      this.tasks = Array(taskStructure.count).fill().map(() => ({ id: generateId(), ...taskStructure.defaultFields, num:'', priority:'', tag:'', description:'', date:'', completed:'' }));
      this.workoutPlan = ensureDeepIds(JSON.parse(JSON.stringify(templateData.workoutPlan_structure || []))).map(day => ({...day, exercises: ensureIds(day.exercises||[])}));
      this.meals = ensureIds(JSON.parse(JSON.stringify(templateData.meals_structure || [])));
      this.groceryBudget = templateData.groceryBudget_default || '';
      this.groceryList = ensureIds(JSON.parse(JSON.stringify(templateData.groceryList_structure || [])));
      this.bodyMeasurements = ensureIds(JSON.parse(JSON.stringify(templateData.bodyMeasurements_structure || [])));
      this.financials = ensureIds(JSON.parse(JSON.stringify(templateData.financials_structure || [])));
      this.city = templateData.city_default || 'London';
    },

    async init() {
      window.addEventListener('online', () => { this.isOnline = true; this.syncPendingData(); });
      window.addEventListener('offline', () => this.isOnline = false);
      document.addEventListener('click', e => { if (!e.target.closest('.dropdown,.clickable')) this.showCitySelector = this.showWeekSelector = false; });
      this.pendingSync = JSON.parse(localStorage.getItem('planner_pending_sync') || '[]');
      this.currentWeek = this.getCurrentIsoWeek();
      this.dateRange = this.getWeekDateRange(this.parseISOWeek(this.currentWeek));
      await this.loadWeek(this.currentWeek, true);
      setInterval(() => { if (!isInitializing && this.hasSignificantChanges()) this.saveData(); }, 30000);
      if (this.isOnline) this.syncPendingData();
    },

    editInline(event, type, index, defaultValue = '') {
      const element = event.currentTarget; const originalText = element.innerText;
      const isTextarea = ['mealIngredients', 'groceryCategoryItems'].includes(type);
      const input = document.createElement(isTextarea ? 'textarea' : 'input');
      input.type = 'text'; input.value = defaultValue; input.className = isTextarea ? 'inline-edit-textarea' : 'inline-edit-input';
      if (isTextarea) input.rows = 3;
      element.innerHTML = ''; element.appendChild(input); input.focus(); input.select();
      const save = () => {
        const newValue = input.value; let sIdxMapped = -1, activity, parts;
        if (type === 'sectionName' || (typeof index === 'object' && index !== null && typeof index.sIdx === 'number')) {
            sIdxMapped = this.schedule.length - 1 - (typeof index === 'object' ? index.sIdx : index);
        }
        const scheduleActivity = (idx) => this.schedule[sIdxMapped]?.activities[idx.aIdx];
        switch (type) {
          case 'plannerTitle': this.plannerTitle = newValue; break;
          case 'timeLabel': if (this.times[index]) this.times[index].label = newValue; break;
          case 'sectionName': if (sIdxMapped !== -1 && this.schedule[sIdxMapped]) this.schedule[sIdxMapped].name = newValue; break;
          case 'activityPrefix': activity = scheduleActivity(index); if (activity) { parts = activity.name.split(':'); activity.name = newValue + (parts.length > 1 ? ':' + parts.slice(1).join(':').trimStart() : ''); } break;
          case 'activityName': activity = scheduleActivity(index); if (activity) { parts = activity.name.split(':'); activity.name = (parts.length > 1 ? parts[0].trim() + ': ' : '') + newValue; } break;
          case 'maxValue': activity = scheduleActivity(index); if (activity?.days[index.day]) activity.days[index.day].max = parseInt(newValue) || 0; break;
          case 'maxScore': activity = scheduleActivity(index); if (activity) activity.maxScore = parseInt(newValue) || 0; break;
          case 'sectionTitle': if (this.uiConfig.sectionTitles && this.uiConfig.sectionTitles[index]) this.uiConfig.sectionTitles[index] = newValue; break;
          case 'mainTableHeader': if (this.uiConfig.mainTableHeaders && this.uiConfig.mainTableHeaders[index]!==undefined) this.uiConfig.mainTableHeaders[index] = newValue; break;
          case 'dayHeader': if (this.uiConfig.dayHeaders && this.uiConfig.dayHeaders[index]!==undefined) this.uiConfig.dayHeaders[index] = newValue; break;
          case 'maxHeader': if (this.uiConfig.maxHeaders && this.uiConfig.maxHeaders[index]!==undefined) this.uiConfig.maxHeaders[index] = newValue; break;
          case 'taskHeader': if (this.uiConfig.taskHeaders && this.uiConfig.taskHeaders[index]!==undefined) this.uiConfig.taskHeaders[index] = newValue; break;
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
        if (input.parentNode === element) element.removeChild(input); element.innerText = newValue || originalText; this.saveData();
      };
      const handleKey = (e) => { if (e.key === 'Enter' && !isTextarea) { e.preventDefault(); cleanupAndSave(); } else if (e.key === 'Escape') { cleanupAndRestore(); }};
      const cleanupAndSave = () => { input.removeEventListener('blur', cleanupAndSave); input.removeEventListener('keydown', handleKey); save(); };
      const cleanupAndRestore = () => { input.removeEventListener('blur', cleanupAndSave); input.removeEventListener('keydown', handleKey); if (input.parentNode === element) element.removeChild(input); element.innerText = originalText; };
      input.addEventListener('blur', cleanupAndSave); input.addEventListener('keydown', handleKey);
    },

    toggleTaskCompletion(task) { task.completed = task.completed === '✓' ? '☐' : '✓'; this.saveData(); },
    showErrorMessage(message) { this.notificationMessage = message; this.showNotification = true; clearTimeout(this.notificationTimeout); this.notificationTimeout = setTimeout(() => this.showNotification = false, 5000); },
    validateValue(value, isNumber = false, min = null, max = null) { const sVal = String(value || ''); if (sVal.trim()==='') return ''; if(isNumber){ const num=parseFloat(sVal); if(isNaN(num)) return ''; if(min!==null && num<min) return min.toString(); if(max!==null && num>max) return max.toString(); return num.toString(); } return sVal; },
    getCurrentIsoWeek:() => { const n=new Date(),d=new Date(Date.UTC(n.getFullYear(),n.getMonth(),n.getDate())); d.setUTCDate(d.getUTCDate()+4-(d.getUTCDay()||7)); const ys=new Date(Date.UTC(d.getUTCFullYear(),0,1)); return `${d.getUTCFullYear()}-W${Math.ceil((((d-ys)/864e5)+1)/7).toString().padStart(2,'0')}`; },
    parseISOWeek(isoStr) { if(!/^\d{4}-W(0[1-9]|[1-4]\d|5[0-3])$/.test(isoStr)) return new Date(); const [y,wP]=isoStr.split('-'),w=parseInt(wP.substring(1)); const d=new Date(Date.UTC(parseInt(y),0,1+(w-1)*7)); d.setUTCDate(d.getUTCDate()-(d.getUTCDay()||7)+1); return d; },
    getWeekDateRange(date) { const s=new Date(date),e=new Date(s); e.setUTCDate(s.getUTCDate()+6); return `${this.formatDate(s)}-${this.formatDate(e)}`; },
    formatDate: (d) => `${(d.getUTCMonth()+1).toString().padStart(2,'0')}/${d.getUTCDate().toString().padStart(2,'0')}`,
    formatShortDate(idx) { const d=new Date(); d.setDate(d.getDate()+idx); return `${d.getMonth()+1}/${d.getDate()}`; },
    toggleDropdown(type, event) { const sP=`show${type[0].toUpperCase()+type.slice(1)}Selector`,oS=(type==='city'?'showWeekSelector':'showCitySelector'); this[oS]=false; const r=event.target.getBoundingClientRect(); this.dropdownPosition={top:r.bottom+window.scrollY,left:r.left+window.scrollX}; this[sP]=!this[sP]; if(type==='week'&&this[sP])this.fetchSavedWeeks(); },
    toggleCitySelector(event) { this.toggleDropdown('city',event); },
    toggleWeekSelector(event) { this.toggleDropdown('week',event); },

    async loadWeek(isoWeek, isInitLoad = false) {
      if (!/^\d{4}-W(0[1-9]|[1-4]\d|5[0-3])$/.test(isoWeek)) { this.showErrorMessage("Invalid week format"); return; }
      this.showWeekSelector = false; this.currentWeek = isoWeek; this.dateRange = this.getWeekDateRange(this.parseISOWeek(isoWeek));
      let record = null, templateNameToUse = "default";

      if (this.isOnline) {
        try { record = await pb.collection('planners').getFirstListItem(`week_id="${isoWeek}"`); }
        catch (e) { if (e.status !== 404) console.error("PB load error:", e); }
      }
      if (!record) { const local = localStorage.getItem(`planner_${isoWeek}`); if (local) try {record = JSON.parse(local);} catch(e){console.error("Local parse error",e); record=null;} }

      if (record) {
        templateNameToUse = record.template_name_used || "default";
        const baseTemplate = await this.fetchTemplate(templateNameToUse);
        this.populateFieldsFromSaved(record, baseTemplate);
      } else {
        const templateData = await this.fetchTemplate(templateNameToUse);
        this.applyTemplate(templateData);
      }
      this.calculateScores();
      if (isInitLoad && (!this.times[0]?.value || !this.times[1]?.value)) await this.getPrayerTimes();
      lastSavedState = JSON.stringify(this.getCurrentDataState());
      if (isInitLoad) isInitializing = false;
    },

    populateFieldsFromSaved(savedData, baseTemplate) {
        this.currentTemplateName = savedData.template_name_used || baseTemplate.template_name || "default";
        this.plannerTitle = savedData.plannerTitle || baseTemplate.plannerTitle_default || 'Weekly Planner';
        
        this.uiConfig = { ...(baseTemplate.uiConfig_structure || {}), ...(savedData.uiConfig || {}) };
        this.uiConfig.sectionTitles = { ...(baseTemplate.uiConfig_structure?.sectionTitles || {}), ...(savedData.uiConfig?.sectionTitles || {}) };

        this.times = (savedData.times || baseTemplate.times_structure || []).map((t, i) => ({
            label: t.label || baseTemplate.times_structure?.[i]?.label || '',
            value: t.value || baseTemplate.times_structure?.[i]?.value || ''
        }));

        const templateSchedule = ensureDeepIds(JSON.parse(JSON.stringify(baseTemplate.schedule_structure || [])));
        const savedSchedule = ensureDeepIds(savedData.schedule || []);
        this.schedule = templateSchedule.map(tmplSec => {
            const userSec = savedSchedule.find(us => us.id === tmplSec.id || us.name === tmplSec.name);
            if (userSec) {
                return { ...tmplSec, ...userSec,
                    activities: (tmplSec.activities || []).map(tmplAct => {
                        const userAct = (userSec.activities || []).find(ua => ua.id === tmplAct.id || ua.name === tmplAct.name);
                        if (userAct) {
                            let mergedDays = {};
                            const allDayKeys = new Set([...Object.keys(tmplAct.days || {}), ...Object.keys(userAct.days || {})]);
                            allDayKeys.forEach(dayKey => {
                                const tplDay = tmplAct.days?.[dayKey] || { value: '', max: 1};
                                const usrDay = userAct.days?.[dayKey] || { value: '', max: tplDay.max};
                                mergedDays[dayKey] = { value: this.validateValue(usrDay.value || tplDay.value, true, 0, (usrDay.max ?? tplDay.max) < 10 ? 9:99), max: usrDay.max ?? tplDay.max ?? 1 };
                            });
                            return { ...tmplAct, ...userAct, days: mergedDays };
                        } return tmplAct;
                    }).concat((userSec.activities || []).filter(ua => !(tmplSec.activities || []).some(ta => ta.id === ua.id || ta.name === ua.name)))
                };
            } return tmplSec;
        }).concat(savedSchedule.filter(us => !templateSchedule.some(ts => ts.id === us.id || ts.name === us.name)));
        this.schedule = ensureDeepIds(this.schedule);

        const baseTaskStruct = baseTemplate.tasks_structure || { count: 40, defaultFields: {} };
        const savedTasks = savedData.tasks || [];
        this.tasks = Array.from({ length: Math.max(baseTaskStruct.count, savedTasks.length) }).map((_, i) => {
            const taskData = savedTasks[i] || {};
            return {
                id: taskData.id || generateId(),
                ...baseTaskStruct.defaultFields, ...taskData,
                num: this.validateValue(taskData.num), priority: this.validateValue(taskData.priority),
                tag: this.validateValue(taskData.tag), description: this.validateValue(taskData.description),
                date: this.validateValue(taskData.date), completed: this.validateValue(taskData.completed)
            };
        });

        this.workoutPlan = ensureDeepIds(JSON.parse(JSON.stringify(savedData.workoutPlan || baseTemplate.workoutPlan_structure || []))).map(d => ({...d, exercises: ensureIds(d.exercises||[])}));
        this.meals = ensureIds(JSON.parse(JSON.stringify(savedData.meals || baseTemplate.meals_structure || [])));
        this.groceryBudget = this.validateValue(savedData.groceryBudget || baseTemplate.groceryBudget_default);
        this.groceryList = ensureIds(JSON.parse(JSON.stringify(savedData.groceryList || baseTemplate.groceryList_structure || [])));
        this.bodyMeasurements = ensureIds(JSON.parse(JSON.stringify(savedData.bodyMeasurements || baseTemplate.bodyMeasurements_structure || [])));
        this.financials = ensureIds(JSON.parse(JSON.stringify(savedData.financials || baseTemplate.financials_structure || [])));
        this.city = savedData.city || baseTemplate.city_default || 'London';
    },

    getCurrentDataState() {
      return { plannerTitle: this.plannerTitle, uiConfig: this.uiConfig, times: this.times, schedule: this.schedule, tasks: this.tasks, workoutPlan: this.workoutPlan, meals: this.meals, groceryBudget: this.groceryBudget, groceryList: this.groceryList, bodyMeasurements: this.bodyMeasurements, financials: this.financials, city: this.city, dateRange: this.dateRange, week_id: this.currentWeek, template_name_used: this.currentTemplateName };
    },
    validateTextInput(event) { event.target.value = this.validateValue(event.target.value); this.saveData(); },
    validateNumberInput(event) { const i=event.target,m=parseFloat(i.min),x=parseFloat(i.max); i.value=this.validateValue(i.value,true,isNaN(m)?null:m,isNaN(x)?null:x); this.calculateScores(); this.saveData(); },
    calculateScores() {
      const dT={mon:0,tue:0,wed:0,thu:0,fri:0,sat:0,sun:0},dK=Object.keys(dT);
      (this.schedule || []).forEach(sec=>{ if(sec.name==='TOTAL')return; (sec.activities||[]).forEach(act=>{ let aS=0; Object.entries(act.days||{}).forEach(([d,dat])=>{ if(!dat)return;const v=parseInt(dat.value)||0; if(v>0&&(dat.max||0)>0){dT[d]=(dT[d]||0)+v;aS+=v;}dat.value=v===0?'':v.toString();}); act.score=aS; act.streaks=act.streaks||{current:0,longest:0};const tI=this.currentDay===0?6:this.currentDay-1;let cS=0; for(let i=0;i<7;i++){const dCI=(tI-i+7)%7,dk=dK[dCI]; if(act.days[dk]&&parseInt(act.days[dk].value)>0&&(act.days[dk].max||0)>0)cS++;else break;}act.streaks.current=cS;act.streaks.longest=Math.max(act.streaks.longest||0,cS);});});
      const tS=(this.schedule||[]).find(s=>s.name==='TOTAL'); if(tS?.activities?.[0]){ const tA=tS.activities[0];let gTS=0,gTM=0; Object.entries(dT).forEach(([d,tot])=>{if(tA.days&&tA.days[d])tA.days[d].value=tot.toString();gTS+=tot;}); tA.score=gTS; (this.schedule||[]).forEach(s=>{if(s.name!=='TOTAL')(s.activities||[]).forEach(act=>gTM+=(act.maxScore||0));}); tA.maxScore=gTM;}
    },
    saveData() {
      if(isInitializing)return; clearTimeout(this.saveTimeout); this.saveStatus='saving'; this.saveTimeout=setTimeout(async()=>{ try{ this.calculateScores();const d=this.getCurrentDataState(); localStorage.setItem(`planner_${this.currentWeek}`,JSON.stringify(d)); if(this.isOnline){ await this.saveToPocketbase(this.currentWeek,d); this.pendingSync=this.pendingSync.filter(it=>it.weekId!==this.currentWeek||it.operation==='delete'); }else this.addToPendingSync(this.currentWeek,d); localStorage.setItem('planner_pending_sync',JSON.stringify(this.pendingSync)); lastSavedState=JSON.stringify(d);this.saveStatus='saved'; }catch(e){this.saveStatus='error';this.showErrorMessage("Save error: "+e.message);setTimeout(()=>this.saveStatus='saved',3000);}},500);
    },
    hasSignificantChanges() { if(!lastSavedState)return true; const cur={...this.getCurrentDataState()};delete cur.dateRange;delete cur.week_id; const last=JSON.parse(lastSavedState);delete last.dateRange;delete last.week_id; return JSON.stringify(cur)!==JSON.stringify(last); },
    addToPendingSync(wId,dat,op='save'){this.pendingSync=this.pendingSync.filter(it=>!(it.weekId===wId&&it.operation===op));this.pendingSync.push({weekId:wId,data:dat?JSON.parse(JSON.stringify(dat)):null,operation:op,timestamp:new Date().toISOString()});localStorage.setItem('planner_pending_sync',JSON.stringify(this.pendingSync));},
    async syncPendingData() {
      if(!this.isOnline||this.pendingSync.length===0)return; const iTS=[...this.pendingSync];this.pendingSync=[]; for(const it of iTS){ try{ if(it.operation==='delete')await this.deleteFromPocketbase(it.weekId); else await this.saveToPocketbase(it.weekId,it.data); const cP=JSON.parse(localStorage.getItem('planner_pending_sync')||'[]'); localStorage.setItem('planner_pending_sync',JSON.stringify(cP.filter(i=>i.timestamp!==it.timestamp))); }catch(e){this.pendingSync.push(it);}} if(this.pendingSync.length>0)localStorage.setItem('planner_pending_sync',JSON.stringify(this.pendingSync));
    },
    async saveToPocketbase(wId,dat){ const ex=await pb.collection('planners').getFirstListItem(`week_id="${wId}"`).catch(e=>{if(e.status===404)return null;throw e;}); if(ex)await pb.collection('planners').update(ex.id,dat);else await pb.collection('planners').create(dat); },
    async deleteFromPocketbase(wId){ const ex=await pb.collection('planners').getFirstListItem(`week_id="${wId}"`).catch(e=>{if(e.status===404)return null;throw e;}); if(ex)await pb.collection('planners').delete(ex.id); },
    async fetchSavedWeeks() {
      const w=new Map(),cI=this.getCurrentIsoWeek(); const add=(iso,dr,src,isC)=>{const ex=w.get(iso),nD=dr||this.getWeekDateRange(this.parseISOWeek(iso)); if(!ex||(src==='pocketbase'&&ex.source!=='pocketbase')||(src==='local'&&ex.source==='current'))w.set(iso,{iso_week:iso,dateRange:nD,source:src,isCurrent:isC}); else if(ex&&!ex.dateRange&&nD)ex.dateRange=nD;}; add(cI,this.getWeekDateRange(this.parseISOWeek(cI)),'current',true); if(this.isOnline){try{(await pb.collection('planners').getFullList({sort:'-week_id',fields:'week_id,dateRange'})).forEach(it=>add(it.week_id,it.dateRange,'pocketbase',it.week_id===cI));}catch(e){console.error("PB fetch weeks error:",e);}} for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k.startsWith('planner_')&&!k.includes('pending_sync')&&!k.startsWith('planner_template_')){const iso=k.replace('planner_','');try{const d=JSON.parse(localStorage.getItem(k));add(iso,d.dateRange,'local',iso===cI);}catch(e){}}} this.savedWeeks=Array.from(w.values()).sort((a,b)=>(a.isCurrent&&!b.isCurrent)?-1:((!a.isCurrent&&b.isCurrent)?1:b.iso_week.localeCompare(a.iso_week)));
    },
    confirmLoadWeek(isoW){(this.hasSignificantChanges()&&isoW!==this.currentWeek&&!confirm("Unsaved changes. Load anyway?"))?null:this.loadWeek(isoW);},
    confirmDeleteWeek(isoW){if(confirm(`Delete schedule for ${isoW}?`))this.deleteWeek(isoW);},
    async deleteWeek(isoW){
      localStorage.removeItem(`planner_${isoW}`); if(this.isOnline)try{await this.deleteFromPocketbase(isoW);}catch(e){this.addToPendingSync(isoW,null,'delete');} else this.addToPendingSync(isoW,null,'delete'); this.savedWeeks=this.savedWeeks.filter(w=>w.iso_week!==isoW); if(this.currentWeek===isoW){this.currentWeek=this.getCurrentIsoWeek();await this.loadWeek(this.currentWeek);}},
    async selectCity(cOpt){
      this.city=cOpt.name;this.showCitySelector=false; try{ if(cOpt.lat===null)await this.getPrayerTimes();else await this.fetchPrayerTimes(cOpt.lat,cOpt.lon); this.saveData(); }catch(e){this.showErrorMessage("Failed to load prayer times.");}},
    async getPrayerTimes() {
      try{ const p=await new Promise((rs,rj)=>navigator.geolocation.getCurrentPosition(rs,rj,{timeout:5000,maximumAge:60000})); const{latitude,longitude}=p.coords; try{ const gR=await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&accept-language=en`); const gD=await gR.json();this.city=gD.address?.city||gD.address?.town||gD.address?.village||gD.address?.county||"Current Location";}catch(e){this.city="Current Location";console.warn("Geocoding error",e)} await this.fetchPrayerTimes(latitude,longitude); }catch(e){this.showErrorMessage("Could not get location. Using London default.");this.city="London";await this.fetchPrayerTimes(51.5074,-0.1278);}},
    async fetchPrayerTimes(lat,lon){
      const t=new Date(),dS=`${t.getFullYear()}_${t.getMonth()+1}_${t.getDate()}`,cK=`prayer_times_${dS}_${lat.toFixed(2)}_${lon.toFixed(2)}`; const cd=localStorage.getItem(cK);if(cd){try{this.setPrayerTimes(JSON.parse(cd));return;}catch(e){localStorage.removeItem(cK);}} try{ const rs=await fetch(`https://api.aladhan.com/v1/calendar/${t.getFullYear()}/${t.getMonth()+1}?latitude=${lat}&longitude=${lon}&method=2`); if(!rs.ok)throw new Error(`API error: ${rs.statusText} (${rs.status})`);const aD=await rs.json(); if(aD.code===200&&aD.data?.[t.getDate()-1]?.timings){localStorage.setItem(cK,JSON.stringify(aD.data[t.getDate()-1].timings));this.setPrayerTimes(aD.data[t.getDate()-1].timings);} else throw new Error("Invalid prayer time data from API"); }catch(e){this.showErrorMessage("Failed to fetch prayer times: "+e.message);this.setPrayerTimes({Fajr:"05:30",Dhuhr:"12:30",Asr:"15:45",Maghrib:"18:30",Isha:"20:00"});}},
    setPrayerTimes(timings){
      const qy=this.calculateQiyamTime(timings.Fajr),pM={Q:qy,F:timings.Fajr,D:timings.Dhuhr,A:timings.Asr,M:timings.Maghrib,I:timings.Isha}; let ch=false;this.times.forEach(ts=>{const nT=this.formatTime(pM[ts.label]);if(ts.value!==nT){ts.value=nT;ch=true;}}); if(ch&&!isInitializing)this.saveData();},
    formatTime(tmS){ if(!tmS||typeof tmS!=='string')return"";const t=tmS.split(" ")[0],[hS,mS]=t.split(":");if(!hS||!mS)return""; let h=parseInt(hS),m=parseInt(mS);if(isNaN(h)||isNaN(m))return"";return`${h%12||12}:${m.toString().padStart(2,'0')}${h>=12?"PM":"AM"}`;},
    calculateQiyamTime(fT){ if(!fT||typeof fT!=='string')return"";const fP=fT.split(" ")[0].split(":");if(fP.length<2)return""; let fH=parseInt(fP[0]),fM=parseInt(fP[1]);if(isNaN(fH)||isNaN(fM))return""; let qD=new Date();qD.setHours(fH,fM,0,0);qD.setHours(qD.getHours()-1);return`${qD.getHours()}:${fM.toString().padStart(2,'0')}`; }
  };
}
