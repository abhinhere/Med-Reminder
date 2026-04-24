
  // ─── State ───────────────────────────────────────────────────────────────────
  let medicines = [
    { id:1, name:'Metformin 500mg',  time:'08:00', type:'tablet', dosage:'1 tablet',   notes:'With breakfast', taken:false },
    { id:2, name:'Vitamin D3',       time:'12:00', type:'pill',   dosage:'1 capsule',  notes:'With water',     taken:false },
    { id:3, name:'Cough Syrup',      time:'21:00', type:'liquid', dosage:'10ml',       notes:'Before bed',     taken:false }
  ];
  let nextId    = 4;
  let logItems  = [];
  let alertedIds = new Set();
  let notifPermission = false;

  const ICONS = { pill:'💊', tablet:'💠', liquid:'🧪' };

  // ─── Clock ───────────────────────────────────────────────────────────────────
  function pad(n){ return String(n).padStart(2,'0'); }

  function updateClock(){
    const n = new Date();
    document.getElementById('clock').textContent =
      `${pad(n.getHours())}:${pad(n.getMinutes())}:${pad(n.getSeconds())}`;
  }

  function nowHHMM(){
    const n = new Date();
    return `${pad(n.getHours())}:${pad(n.getMinutes())}`;
  }

  // ─── Time helpers ─────────────────────────────────────────────────────────────
  function toMins(hhmm){ const [h,m]=hhmm.split(':').map(Number); return h*60+m; }

  function timeLabel(time){
    const diff = toMins(time) - toMins(nowHHMM());
    if(diff < -1) return { text:'Missed',    cls:'badge-taken'    };
    if(diff <= 1) return { text:'DUE NOW',   cls:'badge-due'      };
    const h = Math.floor(diff/60), m = diff%60;
    const label = h > 0 ? `In ${h}h ${m}m` : `In ${m}m`;
    return { text:`${label} · ${time}`, cls:'badge-upcoming' };
  }

  function isDue(time){ const d = toMins(time)-toMins(nowHHMM()); return d<=1 && d>=-1; }

  // ─── Render ──────────────────────────────────────────────────────────────────
  function render(){
    const list = document.getElementById('medList');
    if(!medicines.length){
      list.innerHTML = `
        <div class="empty-state">
          <span class="empty-icon">💊</span>
          No medicines added yet.<br>
          Click <strong>+ Add Medicine</strong> above to get started.
        </div>`;
      return;
    }
    list.innerHTML = medicines.map(m => {
      const due   = isDue(m.time) && !m.taken;
      const tl    = m.taken ? {text:'Taken ✓',cls:'badge-taken'} : timeLabel(m.time);
      const state = m.taken ? 'active' : due ? 'due' : 'active';
      return `
        <div class="med-card ${state}" id="card-${m.id}">
          <div class="med-icon ${m.type}">${ICONS[m.type]}</div>
          <div class="med-info">
            <div class="med-name${m.taken?' taken':''}">${m.name}</div>
            <div class="med-meta">${m.dosage}${m.notes ? ' · '+m.notes : ''}</div>
          </div>
          <span class="med-badge ${tl.cls}">${tl.text}</span>
          <div class="med-actions">
            ${!m.taken
              ? `<button class="btn-taken" onclick="markTaken(${m.id})">✓ Taken</button>`
              : ''}
            <button class="btn-del" title="Remove" onclick="deleteMed(${m.id})">✕</button>
          </div>
        </div>`;
    }).join('');
  }

  // ─── Log ─────────────────────────────────────────────────────────────────────
  function addLog(msg, type){
    const n = new Date();
    const ts = `${pad(n.getHours())}:${pad(n.getMinutes())}`;
    logItems.unshift({msg, type, ts});
    if(logItems.length > 30) logItems.pop();
    document.getElementById('logEntries').innerHTML = logItems.map(l=>`
      <div class="log-entry">
        <span class="log-dot dot-${l.type}"></span>
        <span class="log-ts">${l.ts}</span>
        <span>${l.msg}</span>
      </div>`).join('');
  }

  // ─── Toast ───────────────────────────────────────────────────────────────────
  let toastTimer;
  function showToast(msg, type='success'){
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.className = `toast ${type} show`;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.className='toast', 3400);
  }

  // ─── Notifications ───────────────────────────────────────────────────────────
  function requestPermission(){
    if(!('Notification' in window)){ showToast('Notifications not supported','alert'); return; }
    Notification.requestPermission().then(p => {
      notifPermission = p === 'granted';
      document.getElementById('notifBanner').style.display = 'none';
      if(notifPermission){
        addLog('Browser notifications enabled','info');
        showToast('Notifications enabled!');
      } else {
        addLog('Browser notifications denied — using in-app toasts','info');
        showToast('Using in-app alerts instead','alert');
      }
    });
  }

  function fireAlert(med){
    if(alertedIds.has(med.id)) return;
    alertedIds.add(med.id);
    const msg = `Time to take ${med.name} — ${med.dosage}`;
    addLog(msg, 'alert');
    showToast(`🔔 ${med.name} — time to take!`, 'alert');

    if(notifPermission && 'Notification' in window){
      try {
        new Notification('💊 Medicine Reminder', {
          body: `${msg}${med.notes ? '. '+med.notes : ''}`,
          tag: `med-${med.id}`,
          requireInteraction: true
        });
      } catch(e){}
    }
  }

  function checkDue(){
    medicines.forEach(m => {
      if(!m.taken && isDue(m.time)) fireAlert(m);
    });
    render();
  }

  // ─── CRUD ────────────────────────────────────────────────────────────────────
  function toggleForm(){
    const wrap = document.getElementById('formWrapper');
    const btn  = document.getElementById('toggleBtn');
    const open = wrap.style.display === 'none';
    wrap.style.display = open ? 'block' : 'none';
    btn.textContent = open ? '− Close' : '+ Add Medicine';
    if(open){
      const n = new Date();
      document.getElementById('medTime').value = `${pad(n.getHours())}:${pad(n.getMinutes())}`;
      document.getElementById('medName').focus();
    }
  }

  function addMedicine(){
    const name   = document.getElementById('medName').value.trim();
    const time   = document.getElementById('medTime').value;
    const type   = document.getElementById('medType').value;
    const dosage = document.getElementById('medDosage').value.trim() || '1 dose';
    const notes  = document.getElementById('medNotes').value.trim();

    if(!name){ showToast('Please enter a medicine name','alert'); return; }
    if(!time){ showToast('Please select a reminder time','alert'); return; }

    medicines.push({ id:nextId++, name, time, type, dosage, notes, taken:false });
    addLog(`${name} added — reminder set for ${time}`, 'info');
    showToast(`${name} added`);

    ['medName','medDosage','medNotes'].forEach(id => document.getElementById(id).value='');
    toggleForm();
    render();
  }

  function markTaken(id){
    const m = medicines.find(x=>x.id===id);
    if(!m) return;
    m.taken = true;
    alertedIds.delete(id);
    addLog(`${m.name} marked as taken`, 'taken');
    showToast(`${m.name} logged ✓`);
    render();
  }

  function deleteMed(id){
    const m = medicines.find(x=>x.id===id);
    medicines = medicines.filter(x=>x.id!==id);
    if(m) addLog(`${m.name} removed`, 'taken');
    render();
  }

  // ─── Enter key on form ───────────────────────────────────────────────────────
  document.addEventListener('keydown', e => {
    if(e.key==='Enter' && document.getElementById('formWrapper').style.display!=='none'){
      addMedicine();
    }
  });

  // ─── Init ────────────────────────────────────────────────────────────────────
  if('Notification' in window && Notification.permission === 'default'){
    document.getElementById('notifBanner').style.display = 'flex';
  } else if(Notification.permission === 'granted'){
    notifPermission = true;
  }

  updateClock();
  render();
  checkDue();

  setInterval(updateClock, 1000);
  setInterval(checkDue, 30000);   // Check every 30 seconds