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
    sectionTitles: { tasks: 'TASKS & REMINDERS', workout: 'WORKOUT PLAN', meals: 'MEALS', grocery: 'GROCERY LIST', measurements: 'BODY MEASUREMENTS', financials: 'FINANCIALS' },
    taskHeaders: ['#', 'P', 'T', 'DESCRIPTION', 'DATE', 'DONE']
  };
  const uid = () => Math.random().toString(36).substring(2, 9);
  const defaultSchedule = [ { id:uid(), name: 'QIYAM', activities: [ { id:uid(), name: 'DAILY: Wakeup early', days: { mon: { value: '', max: 1 }, tue: { value: '', max: 1 }, wed: { value: '', max: 1 }, thu: { value: '', max: 1 }, fri: { value: '', max: 1 }, sat: { value: '', max: 1 }, sun: { value: '', max: 1 } }, score: 0, maxScore: 7, streaks: { current: 0, longest: 0 } }, { id:uid(), name: 'DAILY: Qiyam/Tahajjud', days: { mon: { value: '', max: 1 }, tue: { value: '', max: 1 }, wed: { value: '', max: 1 }, thu: { value: '', max: 1 }, fri: { value: '', max: 1 }, sat: { value: '', max: 1 }, sun: { value: '', max: 1 } }, score: 0, maxScore: 7, streaks: { current: 0, longest: 0 } }, { id:uid(), name: 'DAILY: Nutty Pudding', days: { mon: { value: '', max: 1 }, tue: { value: '', max: 1 }, wed: { value: '', max: 1 }, thu: { value: '', max: 1 }, fri: { value: '', max: 1 }, sat: { value: '', max: 1 }, sun: { value: '', max: 1 } }, score: 0, maxScore: 7, streaks: { current: 0, longest: 0 } } ] }, { id:uid(), name: 'FAJR', activities: [ { id:uid(), name: 'DAILY: Fajr prayer', days: { mon: { value: '', max: 1 }, tue: { value: '', max: 1 }, wed: { value: '', max: 1 }, thu: { value: '', max: 1 }, fri: { value: '', max: 1 }, sat: { value: '', max: 1 }, sun: { value: '', max: 1 } }, score: 0, maxScore: 7, streaks: { current: 0, longest: 0 } }, { id:uid(), name: 'DAILY: Quran - 1 Juz', days: { mon: { value: '', max: 1 }, tue: { value: '', max: 1 }, wed: { value: '', max: 1 }, thu: { value: '', max: 1 }, fri: { value: '', max: 1 }, sat: { value: '', max: 1 }, sun: { value: '', max: 1 } }, score: 0, maxScore: 7, streaks: { current: 0, longest: 0 } }, { id:uid(), name: 'DAILY: 5min Cold Shower', days: { mon: { value: '', max: 1 }, tue: { value: '', max: 1 }, wed: { value: '', max: 1 }, thu: { value: '', max: 1 }, fri: { value: '', max: 1 }, sat: { value: '', max: 1 }, sun: { value: '', max: 1 } }, score: 0, maxScore: 7, streaks: { current: 0, longest: 0 } } ] }, { id:uid(), name: 'TOTAL', activities: [ { id:uid(), name: 'DAILY POINTS', days: { mon: { value: '0', max: 0 }, tue: { value: '0', max: 0 }, wed: { value: '0', max: 0 }, thu: { value: '0', max: 0 }, fri: { value: '0', max: 0 }, sat: { value: '0', max: 0 }, sun: { value: '0', max: 0 } }, score: 0, maxScore: 0, streaks: { current: 0, longest: 0 } } ] } ]; // Add all other default sections and activities with unique IDs
  const defaultTasks = Array(20).fill(null).map((_,i) => ({ id: `task${i}-${uid()}`, num: '', priority: '', tag: '', description: '', date: '', completed: '' }));
  const defaultWorkoutPlan = [ { id:uid(), name: 'TUESDAY', exercises: [ { id:uid(), prefix: '• ', name: 'Incline Dumbbell Press', weight: '', sets: '', reps: '', defaultWeight: '30', defaultSets: '3', defaultReps: '12' }, { id:uid(), prefix: '• ', name: 'Barbell Squats', weight: '', sets: '', reps: '', defaultWeight: '80', defaultSets: '3', defaultReps: '8' } ] }, { id:uid(), name: 'WEDNESDAY', exercises: [ { id:uid(), prefix: '• ', name: 'Barbell Bench Press', weight: '', sets: '', reps: '', defaultWeight: '70', defaultSets: '3', defaultReps: '6' } ] }, { id:uid(), name: 'FRIDAY', exercises: [ { id:uid(), prefix: '• ', name: 'Seated DB Shoulder Press', weight: '', sets: '', reps: '', defaultWeight: '20', defaultSets: '3', defaultReps: '12' } ] } ];
  const defaultMeals = [ { id:uid(), name: 'Nutty Pudding', ingredients: 'Berries ½c, Cherries 3, Pomegranate Juice 2oz, Macadamia nuts (raw) 45g, Walnuts (raw) 5g, Cocoa 1t, Brazil Nuts ¼, Milk 50-100ml, Chia Seeds 2T, Flax (ground, refr) 1t, Lecithin 1t, Ceylon Cinnamon ½t' }, { id:uid(), name: 'Super Veggie', ingredients: 'Broccoli 250g, Cauliflower 150g, Mushrooms 50g, Garlic 1 clove, Ginger 3g, Cumin 1T, Black Lentils 45g, Hemp Seeds 1T, Apple Cider Vinegar 1T' }, { id:uid(), name: 'Third Meal', ingredients: 'Sweet Potato 350-400g, Protein 100-150g, Grape Tomatoes 12, Avocado ½, Radishes 4, Cilantro ¼c, Lemon 1, Jalapeño (lg) 1, Chili Powder 1t' } ];
  const defaultGroceryList = [ { id:uid(), name: 'Produce', items: 'Broccoli 1.75kg, Cauliflower 1.05kg, Mushrooms 350g, Garlic 1 bulb, Ginger 1pc, Sweet Potato 2.8kg, Grape Tomatoes 84, Avocados (ripe) 4, Radishes 28, Cilantro 2-3 bunch' }, { id:uid(), name: 'Fruits & Protein', items: 'Lemons 7, Jalapeños (lg) 7, Berries 3.5c, Cherries 21, Black Lentils 315g, Protein 1.05kg, Milk (fortified) 1L' } ];
  const defaultBodyMeasurements = [ { id:uid(), name: 'Weight', value: '', placeholder: '75kg' }, { id:uid(), name: 'Chest', value: '', placeholder: '42in' }, { id:uid(), name: 'Waist', value: '', placeholder: '34in' }, { id:uid(), name: 'Hips', value: '', placeholder: '40in' }, { id:uid(), name: 'Arms', value: '', placeholder: '15in' }, { id:uid(), name: 'Thighs', value: '', placeholder: '24in' } ];
  const defaultFinancials = [ { id:uid(), name: 'Rent', value: '', placeholder: '850', account: 'Cash' }, { id:uid(), name: 'Allowance', value: '', placeholder: '850', account: 'Revolut' }, { id:uid(), name: 'Savings', value: '', placeholder: '3,800', account: 'HSBCUK' } ];
  const defaultTimes = [ { id:uid(), label: 'Q', value: '' }, { id:uid(), label: 'F', value: '' }, { id:uid(), label: 'D', value: '' }, { id:uid(), label: 'A', value: '' }, { id:uid(), label: 'M', value: '' }, { id:uid(), label: 'I', value: '' } ];

  return {
    plannerTitle: defaultUiConfig.plannerTitle,
    uiConfig: JSON.parse(JSON.stringify(defaultUiConfig)),
    currentWeek: '', dateRange: '', city: 'London', saveStatus: 'saved', saveTimeout: null,
    showNotification: false, notificationMessage: '', notificationTimeout: null, isOnline: navigator.onLine, pendingSync: [],
    showCitySelector: false, showWeekSelector: false, dropdownPosition: { top: 0, left: 0 }, currentDay: (new Date()).getDay(),
    newActivityName: '', contextMenu: { show: false, top: 0, left: 0, type: null, data: null }, hasUnsavedChanges: false,
    editingTarget: null, editValue: '',
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
          // Auto-commit edit if clicking outside an active edit area
          if (this.editingTarget && !e.target.closest(`[data-edit-input-id="${this.editingTarget.inputId}"]`) && !e.target.closest(`[x-on\\:dblclick^="startEdit('${this.editingTarget.type}'"]`)) {
             this.commitEdit();
          }
        });
        this.pendingSync = JSON.parse(localStorage.getItem('planner_pending_sync') || '[]');
        this.currentWeek = this.getCurrentIsoWeek();
        this.dateRange = this.getWeekDateRange(this.parseISOWeek(this.currentWeek));
        this.schedule.forEach(s => s.activities.forEach(a => { if (!a.streaks) a.streaks = { current: 0, longest: 0 }; if(!a.id) a.id = uid(); }));
        this.tasks.forEach(t => { if(!t.id) t.id = uid(); }); // Ensure IDs on load
        // ... ensure IDs for other array items similarly if loaded from old storage
        await this.loadWeek(this.currentWeek, true);
        setInterval(() => { if (!isInitializing && this.hasUnsavedChanges && this.saveStatus !== 'saving' && !this.editingTarget) this.saveData(); }, 30000);
        if (this.isOnline) this.syncPendingData();
      } catch (error) { console.error("Init Error:", error); this.showErrorMessage("Failed to initialize."); }
      finally { if(isInitializing && this.currentWeek) isInitializing = false; }
    },
    isEditing(type, ...ids) {
        if (!this.editingTarget || this.editingTarget.type !== type) return false;
        if (ids.length === 0 && !this.editingTarget.ids) return true;
        if (!this.editingTarget.ids || ids.length !== this.editingTarget.ids.length) return false;
        return ids.every((id, index) => String(id) === String(this.editingTarget.ids[index]));
    },
    startEdit(type, initialValue, inputIdToFocus, ...ids) {
        if (this.editingTarget) this.commitEdit();
        this.editingTarget = { type, ids, originalValue: initialValue, inputId: inputIdToFocus };
        this.editValue = String(initialValue);
        this.$nextTick(() => { // Focus the specific input after Alpine renders it
            const inputEl = document.getElementById(inputIdToFocus);
            if (inputEl) {
                inputEl.focus();
                inputEl.select();
            }
        });
    },
    commitEdit() {
        if (!this.editingTarget) return;
        const { type, ids, originalValue } = this.editingTarget;
        const currentEditVal = String(this.editValue); // Current value in input
        const trimmedEditValue = currentEditVal.trim();
        const originalTrimmed = String(originalValue).trim();

        if (trimmedEditValue !== originalTrimmed) {
            this.hasUnsavedChanges = true;
            let sRealIdx, aIdx, dayKey, item;
            const gASI = (rSIdx) => this.schedule.length - 1 - rSIdx;

            switch (type) {
                case 'plannerTitle': this.plannerTitle = trimmedEditValue; break;
                case 'timeLabel': item = this.times.find(t => t.id === ids[0]); if(item) item.label = trimmedEditValue; break;
                case 'mainTableHeader': if (ids[0] < this.uiConfig.mainTableHeaders.length) this.uiConfig.mainTableHeaders[ids[0]] = trimmedEditValue; break;
                case 'dayHeader': if (ids[0] < this.uiConfig.dayHeaders.length) this.uiConfig.dayHeaders[ids[0]] = trimmedEditValue; break;
                case 'maxHeader': if (ids[0] < this.uiConfig.maxHeaders.length) this.uiConfig.maxHeaders[ids[0]] = trimmedEditValue; break;
                case 'sectionTitle': if (this.uiConfig.sectionTitles[ids[0]]) this.uiConfig.sectionTitles[ids[0]] = trimmedEditValue; break;
                case 'taskHeader': if (ids[0] < this.uiConfig.taskHeaders.length) this.uiConfig.taskHeaders[ids[0]] = trimmedEditValue; break;
                case 'sectionName': sRealIdx = gASI(ids[0]); if(this.schedule[sRealIdx]) this.schedule[sRealIdx].name = trimmedEditValue; break;
                case 'activityPrefix': sRealIdx = gASI(ids[0]); item = this.schedule[sRealIdx]?.activities?.[ids[1]]; if(item) item.name = `${trimmedEditValue}:${item.name.split(':').pop().trim()}`; break;
                case 'activityName': sRealIdx = gASI(ids[0]); item = this.schedule[sRealIdx]?.activities?.[ids[1]]; if(item) { const pfx = item.name.includes(':') ? item.name.split(':')[0].trim() : ''; item.name = pfx ? `${pfx}: ${trimmedEditValue}` : trimmedEditValue; } break;
                case 'maxValue': sRealIdx = gASI(ids[0]); dayKey = ids[2]; item = this.schedule[sRealIdx]?.activities?.[ids[1]]?.days?.[dayKey]; if(item) item.max = parseInt(currentEditVal) || 0; break;
                case 'maxScore': sRealIdx = gASI(ids[0]); item = this.schedule[sRealIdx]?.activities?.[ids[1]]; if(item) item.maxScore = parseInt(currentEditVal) || 0; break;
                case 'workoutDayName': item = this.workoutPlan.find(wp => wp.id === ids[0]); if(item) item.name = trimmedEditValue; break;
                case 'exercisePrefix': item = this.workoutPlan.find(wp => wp.id === ids[0])?.exercises.find(ex => ex.id === ids[1]); if(item) item.prefix = trimmedEditValue; break;
                case 'exerciseName': item = this.workoutPlan.find(wp => wp.id === ids[0])?.exercises.find(ex => ex.id === ids[1]); if(item) item.name = trimmedEditValue; break;
                case 'mealName': item = this.meals.find(m => m.id === ids[0]); if(item) item.name = trimmedEditValue; break;
                case 'mealIngredients': item = this.meals.find(m => m.id === ids[0]); if(item) item.ingredients = currentEditVal; break;
                case 'groceryCategoryName': item = this.groceryList.find(gl => gl.id === ids[0]); if(item) item.name = trimmedEditValue; break;
                case 'groceryCategoryItems': item = this.groceryList.find(gl => gl.id === ids[0]); if(item) item.items = currentEditVal; break;
                case 'measurementName': item = this.bodyMeasurements.find(bm => bm.id === ids[0]); if(item) item.name = trimmedEditValue; break;
                case 'financialName': item = this.financials.find(f => f.id === ids[0]); if(item) item.name = trimmedEditValue; break;
                case 'financialAccount': item = this.financials.find(f => f.id === ids[0]); if(item) item.account = trimmedEditValue; break;
                default: console.warn('Unhandled type in commitEdit:', type); this.hasUnsavedChanges = false;
            }
        }
        const targetElementId = this.editingTarget?.inputId.replace('-input', ''); // Heuristic to find original span/div
        this.editingTarget = null; this.editValue = '';
        if (targetElementId) { // Try to restore focus to the display element
            this.$nextTick(() => {
                const displayEl = document.getElementById(targetElementId);
                if (displayEl) try { displayEl.focus({ preventScroll: true }); } catch(e){}
            });
        }
    },
    cancelEdit() { this.editingTarget = null; this.editValue = ''; /* Focus restoration could also go here if needed */ },
    showContextMenu(e,t,d){e.preventDefault();this.contextMenu={show:true,top:e.pageY,left:e.pageX,type:t,data:d}},
    hideContextMenu(){this.contextMenu.show=false},
    editContextItem(){const{type:t,data:d}=this.contextMenu;let i,nN,sRI;const gASI=(sIdx)=>this.schedule.length-1-sIdx;switch(t){case'activity':const{sIdx,aIdx}=d;sRI=gASI(sIdx);i=this.schedule[sRI]?.activities?.[aIdx];if(!i){this.showErrorMessage('Activity not found.');break}nN=prompt('Edit activity name:',i.name);if(nN&&nN.trim())i.name=nN.trim();break;case'task':this.showErrorMessage('Tasks can be edited directly.');break;case'workoutDay':i=this.workoutPlan.find(wp=>wp.id===d.id);nN=prompt('Edit workout day name:',i?.name);if(i&&nN&&nN.trim())i.name=nN.trim();break;case'exercise':const{dayId,exId}=d;i=this.workoutPlan.find(wp=>wp.id===dayId)?.exercises.find(ex=>ex.id===exId);if(!i)break;nN=prompt('Edit exercise name:',i.name);if(i&&nN&&nN.trim())i.name=nN.trim();break;case'meal':i=this.meals.find(m=>m.id===d.id);nN=prompt('Edit meal name:',i?.name);if(i&&nN&&nN.trim())i.name=nN.trim();break;default: /* other cases */ break;}if(nN!==undefined){this.hasUnsavedChanges=true;this.saveData()}this.hideContextMenu()},
    deleteContextItem(){const{type:t,data:d}=this.contextMenu;if(!confirm('Are you sure?')){this.hideContextMenu();return}const gASI=(sIdx)=>this.schedule.length-1-sIdx;switch(t){case'activity':const{sIdx,aIdx}=d;const sRI=gASI(sIdx);if(this.schedule[sRI]?.activities)this.schedule[sRI].activities.splice(aIdx,1);break;case'task':this.tasks=this.tasks.filter(tsk=>tsk.id!==d.id);this.tasks.push({...JSON.parse(JSON.stringify(defaultTasks[0])),id:uid()});break;case'workoutDay':this.workoutPlan=this.workoutPlan.filter(wp=>wp.id!==d.id);break;case'exercise':const{dayId,exId}=d;const wp=this.workoutPlan.find(w=>w.id===dayId);if(wp)wp.exercises=wp.exercises.filter(ex=>ex.id!==exId);break;case'meal':this.meals=this.meals.filter(m=>m.id!==d.id);break;default:/* other cases */break;}this.calculateScores();this.hasUnsavedChanges=true;this.saveData();this.hideContextMenu()},
    addContextItem(){const{type:t,data:d}=this.contextMenu;let iT=t,iI=d;const gASI=(sIdx)=>this.schedule.length-1-sIdx;if(t==='activity'&&typeof d==='object'&&d.hasOwnProperty('sIdx')){iI={sActualIdx:gASI(d.sIdx)};if(!this.schedule[iI.sActualIdx]){this.showErrorMessage('Invalid section.');this.hideContextMenu();return}}else if(t==='exercise'&&typeof d==='object'&&d.hasOwnProperty('dayId')){iI={dayId:d.dayId}}this.addItem(iT,iI);this.hideContextMenu()},
    addItem(type,data=null){let nN,s;switch(type){case'activity':s=this.schedule[data.sActualIdx];if(!s){this.showErrorMessage('Invalid section.');return}nN=prompt(`New activity for "${s.name}":`);if(nN&&nN.trim())this.addActivity(data.sActualIdx,nN.trim());break;case'task':this.tasks.unshift({...JSON.parse(JSON.stringify(defaultTasks[0])),id:uid()});break;case'workoutDay':nN=prompt('New workout day:');if(nN&&nN.trim())this.workoutPlan.push({id:uid(),name:nN.trim(),exercises:[]});break;case'exercise':s=this.workoutPlan.find(wp=>wp.id===data.dayId);if(!s){this.showErrorMessage('Invalid day.');return}nN=prompt(`New exercise for "${s.name}":`);if(nN&&nN.trim())s.exercises.push({id:uid(),prefix:'• ',name:nN.trim(),weight:'',sets:'',reps:'',defaultWeight:'20',defaultSets:'3',defaultReps:'12'});break;case'meal':nN=prompt('New meal:');if(nN&&nN.trim())this.meals.push({id:uid(),name:nN.trim(),ingredients:''});break; default: /* other cases */ break}if(type!=='activity'){this.hasUnsavedChanges=true;this.saveData()}},
    addActivity(sAI,aN){if(!aN.trim()||!this.schedule[sAI])return;const nA={id:uid(),name:aN,days:{mon:{value:'',max:1},tue:{value:'',max:1},wed:{value:'',max:1},thu:{value:'',max:1},fri:{value:'',max:1},sat:{value:'',max:1},sun:{value:'',max:1}},score:0,maxScore:7,streaks:{current:0,longest:0}};this.schedule[sAI].activities.push(nA);this.hasUnsavedChanges=true;this.saveData()},
    showErrorMessage(m){this.notificationMessage=m;this.showNotification=true;clearTimeout(this.notificationTimeout);this.notificationTimeout=setTimeout(()=>this.showNotification=false,5000)},
    validateValue(v,iN=false,min=null,max=null){if(v==null||v===undefined||String(v).trim()==='')return '';if(iN){const nV=parseFloat(v);if(isNaN(nV))return '';if(min!==null&&nV<min)return min.toString();if(max!==null&&nV>max)return max.toString();return nV.toString()}return String(v)},
    getCurrentIsoWeek(){const n=new Date(),d=new Date(n);d.setHours(0,0,0,0);d.setDate(d.getDate()+4-(d.getDay()||7));const yS=new Date(d.getFullYear(),0,1);const wN=Math.ceil((((d-yS)/864e5)+1)/7);return`${d.getFullYear()}-W${wN.toString().padStart(2,'0')}`},
    parseISOWeek(iS){if(!/^\d{4}-W(0[1-9]|[1-4][0-9]|5[0-3])$/.test(iS))return new Date();const[y,wP]=iS.split('-');const w=parseInt(wP.substring(1));const d=new Date(Date.UTC(parseInt(y),0,4));d.setUTCDate(d.getUTCDate()+(w-1)*7-(d.getUTCDay()||7)+1);return d},
    getWeekDateRange(d){const s=new Date(d),e=new Date(s);e.setDate(s.getDate()+6);return`${this.formatDate(s)}-${this.formatDate(e)}`},
    formatDate(d){return`${(d.getMonth()+1).toString().padStart(2,'0')}/${d.getDate().toString().padStart(2,'0')}`},
    formatShortDate(i){const n=new Date();n.setDate(n.getDate()+i);return`${(n.getMonth()+1)}/${n.getDate()}`},
    toggleCitySelector(e){if(!e||!e.target){this.showCitySelector=!this.showCitySelector;this.showWeekSelector=false;return}this.showWeekSelector=false;const r=e.target.getBoundingClientRect();this.dropdownPosition={top:r.bottom+window.scrollY,left:r.left+window.scrollX};this.showCitySelector=!this.showCitySelector},
    toggleWeekSelector(e){if(!e||!e.target){this.showCitySelector=false;this.showWeekSelector=!this.showWeekSelector;if(this.showWeekSelector)this.fetchSavedWeeks();return}this.showCitySelector=false;const r=e.target.getBoundingClientRect();this.dropdownPosition={top:r.bottom+window.scrollY,left:r.left+window.scrollX};this.showWeekSelector=!this.showWeekSelector;if(this.showWeekSelector)this.fetchSavedWeeks()},
    async loadWeek(iW,isInit=false){if(!/^\d{4}-W(0[1-9]|[1-4][0-9]|5[0-3])$/.test(iW)){this.showErrorMessage("Invalid week format");return}if(!isInit&&this.hasUnsavedChanges&&iW!==this.currentWeek){if(!confirm("Unsaved changes. Load anyway?"))return}this.showWeekSelector=false;this.currentWeek=iW;this.dateRange=this.getWeekDateRange(this.parseISOWeek(iW));let d=null;if(this.isOnline){try{const rs=await pb.collection('planners').getList(1,1,{filter:`week_id="${iW}"`});if(rs.items.length>0)d=rs.items[0]}catch(e){console.error("PB load err:",e)}}if(!d){try{const lD=localStorage.getItem(`planner_${iW}`);if(lD)d=JSON.parse(lD)}catch(e){console.error("LS load err:",e)}}this.populateFields(d||{});this.calculateScores();if(isInit&&(!this.times[0].value||!this.times[1].value)){try{await this.getPrayerTimes()}catch(e){console.error("Err prayer times:",e)}}this.hasUnsavedChanges=false;if(isInit)isInitializing=false},
    populateFields(data){this.plannerTitle=data.plannerTitle||defaultUiConfig.plannerTitle;this.uiConfig={...JSON.parse(JSON.stringify(defaultUiConfig)),...(data.uiConfig||{}),sectionTitles:{...defaultUiConfig.sectionTitles,...(data.uiConfig?.sectionTitles||{})},taskHeaders:data.uiConfig?.taskHeaders||[...defaultUiConfig.taskHeaders],mainTableHeaders:data.uiConfig?.mainTableHeaders||[...defaultUiConfig.mainTableHeaders],dayHeaders:data.uiConfig?.dayHeaders||[...defaultUiConfig.dayHeaders],maxHeaders:data.uiConfig?.maxHeaders||[...defaultUiConfig.maxHeaders]};const mA=(dA,lA,pfx)=>((lA?JSON.parse(JSON.stringify(lA)):JSON.parse(JSON.stringify(dA))).map((it,ix)=>({...it,id:it.id||`${pfx}-${ix}-${uid()}`})));this.times=mA(defaultTimes,data.times,'tm').map((t,i)=>({...defaultTimes[i],...t,value:this.validateValue(t.value)}));this.schedule=mA(defaultSchedule,data.schedule,'sc').map(s=>({...s,activities:mA(s.activities||[],null,`ac-${s.id}`).map(a=>({...a,streaks:a.streaks||{current:0,longest:0}}))}));this.tasks=mA(defaultTasks,data.tasks,'tk');this.workoutPlan=mA(defaultWorkoutPlan,data.workoutPlan,'wp').map(wp=>({...wp,exercises:mA(wp.exercises||[],null,`ex-${wp.id}`)}));this.meals=mA(defaultMeals,data.meals,'ml');this.groceryList=mA(defaultGroceryList,data.groceryList,'gl');this.bodyMeasurements=mA(defaultBodyMeasurements,data.bodyMeasurements,'bm');this.financials=mA(defaultFinancials,data.financials,'fn');this.groceryBudget=this.validateValue(data.groceryBudget||'');this.city=data.city||'London';this.schedule.forEach(s=>s.activities.forEach(a=>{Object.keys(a.days).forEach(dK=>{if(a.days[dK])a.days[dK].value=this.validateValue(a.days[dK].value,true,0,(a.days[dK].max!==undefined&&a.days[dK].max<10)?9:((a.days[dK].max!==undefined&&a.days[dK].max>99)?99:(a.days[dK].max||99)))})}));this.tasks.forEach(t=>Object.keys(t).forEach(k=>{if(t.hasOwnProperty(k))t[k]=this.validateValue(t[k])}));lastSavedState=JSON.stringify(this.getCurrentStateForComparison())},
    validateTextInput(e){e.target.value=this.validateValue(e.target.value);this.hasUnsavedChanges=true},
    validateNumberInput(e){const i=e.target;const m=i.hasAttribute('min')?parseFloat(i.min):0;const x=i.hasAttribute('max')?parseFloat(i.max):99;i.value=this.validateValue(i.value,true,m,x);this.calculateScores();this.hasUnsavedChanges=true},
    calculateScores(){const dT={mon:0,tue:0,wed:0,thu:0,fri:0,sat:0,sun:0};const dK=['mon','tue','wed','thu','fri','sat','sun'];this.schedule.forEach(s=>{if(s.name==='TOTAL')return;s.activities.forEach(a=>{let aS=0;dK.forEach(d=>{const dD=a.days[d];if(dD){const v=parseInt(dD.value)||0;if(v>0&&(dD.max||0)>0){dT[d]+=v;aS+=v}dD.value=v===0?'':v.toString()}});a.score=aS;if(!a.streaks)a.streaks={current:0,longest:0};const tJD=this.currentDay;const tADI=tJD===0?6:tJD-1;let cS=0;for(let i=0;i<7;i++){const dITC=(tADI-i+7)%7;const dKTC=dK[dITC];if(a.days[dKTC]&&parseInt(a.days[dKTC].value)>0&&(a.days[dKTC].max||0)>0){cS++}else{break}}a.streaks.current=cS;a.streaks.longest=Math.max(a.streaks.longest||0,cS)})});const tS=this.schedule.find(s=>s.name==='TOTAL');if(tS?.activities?.[0]){const tA=tS.activities[0];dK.forEach(d=>{if(tA.days[d])tA.days[d].value=(dT[d]||0).toString()});tA.score=Object.values(dT).reduce((sm,v)=>sm+(v||0),0)}},
    getCurrentStateForComparison(){return{plannerTitle:this.plannerTitle,uiConfig:this.uiConfig,times:this.times,schedule:this.schedule,tasks:this.tasks,workoutPlan:this.workoutPlan,groceryBudget:this.groceryBudget,groceryList:this.groceryList,bodyMeasurements:this.bodyMeasurements,financials:this.financials,city:this.city}},
    saveData(){if(isInitializing||this.saveStatus==='saving')return;clearTimeout(this.saveTimeout);this.saveStatus='saving';this.saveTimeout=setTimeout(async()=>{try{this.calculateScores();const pDTS={...this.getCurrentStateForComparison(),week_id:this.currentWeek,dateRange:this.dateRange};localStorage.setItem(`planner_${this.currentWeek}`,JSON.stringify(pDTS));if(this.isOnline){try{await this.saveToPocketbase(this.currentWeek,pDTS);this.pendingSync=this.pendingSync.filter(i=>i.weekId!==this.currentWeek||i.operation==='delete');localStorage.setItem('planner_pending_sync',JSON.stringify(this.pendingSync))}catch(e){this.addToPendingSync(this.currentWeek,pDTS)}}else{this.addToPendingSync(this.currentWeek,pDTS)}lastSavedState=JSON.stringify(this.getCurrentStateForComparison());this.saveStatus='saved';this.hasUnsavedChanges=false}catch(e){console.error("Err saveData:",e);this.saveStatus='error';this.showErrorMessage("Error saving data");setTimeout(()=>{if(this.saveStatus==='error')this.saveStatus='saved'},3000)}},500)},
    addToPendingSync(wId,data){this.pendingSync=this.pendingSync.filter(i=>i.weekId!==wId||i.operation==='delete');this.pendingSync.push({weekId:wId,data,operation:'save',timestamp:new Date().toISOString()});localStorage.setItem('planner_pending_sync',JSON.stringify(this.pendingSync))},
    async syncPendingData(){if(!this.isOnline||this.pendingSync.length===0)return;const iTS=[...this.pendingSync];this.pendingSync=[];localStorage.setItem('planner_pending_sync',JSON.stringify(this.pendingSync));for(const i of iTS){try{if(i.operation==='delete')await this.deleteFromPocketbase(i.weekId);else await this.saveToPocketbase(i.weekId,i.data)}catch(e){this.pendingSync.push(i);localStorage.setItem('planner_pending_sync',JSON.stringify(this.pendingSync));console.error("Sync err:",i.weekId,e)}}},
    async saveToPocketbase(wId,data){const r=await pb.collection('planners').getList(1,1,{filter:`week_id="${wId}"`});if(r.items.length>0)await pb.collection('planners').update(r.items[0].id,data);else await pb.collection('planners').create(data);return true},
    async deleteFromPocketbase(wId){try{const r=await pb.collection('planners').getList(1,1,{filter:`week_id="${wId}"`});if(r.items.length>0)await pb.collection('planners').delete(r.items[0].id);return true}catch(e){console.error("PB delete err:",e);throw e}},
    async fetchSavedWeeks(){const w=[];const cIW=this.getCurrentIsoWeek();w.push({iso_week:cIW,dateRange:this.getWeekDateRange(this.parseISOWeek(cIW)),isCurrent:true});if(this.isOnline){try{const r=await pb.collection('planners').getList(1,100,{sort:'-week_id'});r.items.forEach(i=>{if(i.week_id===cIW)return;w.push({iso_week:i.week_id,dateRange:i.dateRange||this.getWeekDateRange(this.parseISOWeek(i.week_id)),isCurrent:false})})}catch(e){console.error("Err fetch PB weeks:",e)}}for(let l=0;l<localStorage.length;l++){const k=localStorage.key(l);if(k.startsWith('planner_')&&!k.includes('pending_sync')){const iW=k.replace('planner_','');if(w.some(wk=>wk.iso_week===iW))continue;try{const d=JSON.parse(localStorage.getItem(k));w.push({iso_week:iW,dateRange:d.dateRange||this.getWeekDateRange(this.parseISOWeek(iW)),isCurrent:iW===cIW})}catch(e){}}}this.savedWeeks=w.sort((a,b)=>(a.isCurrent?-1:b.isCurrent?1:b.iso_week.localeCompare(a.iso_week)))},
    confirmLoadWeek(iW){this.loadWeek(iW)},
    confirmDeleteWeek(iW){if(confirm(`Delete schedule for ${iW}?`))this.deleteWeek(iW)},
    async deleteWeek(iW){localStorage.removeItem(`planner_${iW}`);if(this.isOnline){try{await this.deleteFromPocketbase(iW)}catch(e){this.pendingSync.push({weekId:iW,operation:'delete',timestamp:new Date().toISOString()});localStorage.setItem('planner_pending_sync',JSON.stringify(this.pendingSync))}}else{this.pendingSync=this.pendingSync.filter(i=>i.weekId!==iW||i.operation==='delete');this.pendingSync.push({weekId:iW,operation:'delete',timestamp:new Date().toISOString()});localStorage.setItem('planner_pending_sync',JSON.stringify(this.pendingSync))}this.savedWeeks=this.savedWeeks.filter(w=>w.iso_week!==iW);if(this.currentWeek===iW){const cIW=this.getCurrentIsoWeek();this.loadWeek(cIW)}},
    async selectCity(cO){this.city=cO.name;this.showCitySelector=false;try{if(cO.lat===null&&cO.lon===null)await this.getPrayerTimes();else await this.fetchPrayerTimes(cO.lat,cO.lon);this.hasUnsavedChanges=true;this.saveData()}catch(e){console.error("City sel err:",e);this.showErrorMessage("Failed to load prayer times.")}},
    async getPrayerTimes(){try{const p=await new Promise((rs,rj)=>navigator.geolocation.getCurrentPosition(rs,rj,{timeout:5000,maximumAge:60000}));const{latitude:lt,longitude:ln}=p.coords;try{const r=await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lt}&lon=${ln}&zoom=10`);if(r.ok){const d=await r.json();if(d.address)this.city=d.address.city||d.address.town||d.address.village||d.address.county||"Current Location"}}catch(e){this.city="Current Location"}await this.fetchPrayerTimes(lt,ln)}catch(e){console.warn("Geo err:",e);this.showErrorMessage("Could not get your location. Using London as default.");this.city="London";await this.fetchPrayerTimes(51.5074,-0.1278)}},
    async fetchPrayerTimes(lt,ln){const t=new Date(),d=t.getDate(),m=t.getMonth()+1,y=t.getFullYear();try{const k=`prayer_times_${y}_${m}_${d}_${lt.toFixed(2)}_${ln.toFixed(2)}`,cD=localStorage.getItem(k);if(cD){this.setPrayerTimes(JSON.parse(cD));return}const r=await fetch(`https://api.aladhan.com/v1/calendar/${y}/${m}?latitude=${lt}&longitude=${ln}&method=2`);if(!r.ok)throw new Error(`API ${r.status}`);const dT=await r.json();if(dT.code===200&&dT.data&&dT.data[d-1]){const tms=dT.data[d-1].timings;localStorage.setItem(k,JSON.stringify(tms));this.setPrayerTimes(tms)}else throw new Error("Invalid prayer data")}catch(e){console.error("Prayer fetch err:",e);this.setPrayerTimes({Fajr:"05:30",Dhuhr:"12:30",Asr:"15:45",Maghrib:"18:30",Isha:"20:00"})}},
    setPrayerTimes(tms){if(!this.times[0].value||!this.times[1].value||isInitializing){this.times[0].value=this.calculateQiyamTime(tms.Fajr);this.times[1].value=this.formatTime(tms.Fajr);this.times[2].value=this.formatTime(tms.Dhuhr);this.times[3].value=this.formatTime(tms.Asr);this.times[4].value=this.formatTime(tms.Maghrib);this.times[5].value=this.formatTime(tms.Isha);if(!isInitializing){this.hasUnsavedChanges=true;this.saveData()}}},
    formatTime(ts){if(!ts)return"";const t=ts.split(" ")[0],[h,min]=t.split(":");let hr=parseInt(h);if(isNaN(hr))return"";const ap=hr>=12?"PM":"AM";hr=hr%12;hr=hr?hr:12;return`${hr}:${min}${ap}`},
    calculateQiyamTime(f){if(!f)return"";const p=f.split(" ")[0].split(":");if(p.length<2)return"";const fH=parseInt(p[0]),fM=parseInt(p[1]);if(isNaN(fH)||isNaN(fM))return"";let qH=fH-1;if(qH<0)qH+=24;const ap=qH>=12?"PM":"AM",hr=qH%12||12;return`${hr}:${fM.toString().padStart(2,'0')}${ap}`},
    toggleTaskCompletion(t){t.completed=t.completed==='✓'?'':'✓';this.hasUnsavedChanges=true;this.saveData()},
  };
}
