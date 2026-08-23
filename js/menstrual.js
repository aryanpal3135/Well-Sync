

'use strict';

const PHASES = {
  menstruation: {
    label: 'Menstruation Phase',
    emoji: '🌷',
    days: 'Days 1–5 (approx.)',
    color: 'hsl(0, 60%, 55%)',
    bgColor: 'hsla(0, 60%, 55%, 0.08)',
    suggestions: [
      '💧 Stay well-hydrated — aim for 2.5–3 liters of water throughout the day.',
      '🌿 Warm herbal teas such as ginger or chamomile may be soothing.',
      '🧘 Gentle yoga (Child\'s Pose, Legs Up the Wall) may provide comfort.',
      '🍃 Iron-rich foods (spinach, dal, lentils, ragi) support healthy iron levels.',
      '🚶 Light walking is generally well-tolerated if you feel up to it.',
      '🛌 Rest is important — honor your body\'s energy signals.',
      '🌡️ A warm heating pad may provide comfort for lower abdominal discomfort.',
    ],
    activities: ['Gentle walking', 'Yin yoga', 'Stretching', 'Rest'],
    avoid: ['High-impact exercise if energy is very low', 'Excessive caffeine and salt'],
    note: 'Energy may be lower — focus on gentle self-care and nourishment.',
  },
  follicular: {
    label: 'Follicular Phase',
    emoji: '🌱',
    days: 'Days 6–13 (approx.)',
    color: 'hsl(152, 55%, 42%)',
    bgColor: 'hsla(152, 55%, 42%, 0.08)',
    suggestions: [
      '⚡ Energy typically increases during this phase.',
      '🏃 A good time to try more challenging workouts like HIIT or strength training.',
      '🥗 Focus on antioxidant-rich, colorful foods: berries, greens, bell peppers.',
      '💧 Maintain good hydration to support energy levels.',
      '🎯 This can be a productive phase for goal-setting and new challenges.',
      '🌿 Include omega-3 rich foods (flaxseeds, walnuts) for hormonal balance.',
    ],
    activities: ['Cardio', 'Strength training', 'HIIT (if fitness-trained)', 'Dancing'],
    avoid: ['Skipping meals'],
    note: 'Rising energy — a great time to try harder workouts and new activities.',
  },
  ovulation: {
    label: 'Ovulation Phase',
    emoji: '✨',
    days: 'Days 14–17 (approx.)',
    color: 'hsl(38, 85%, 52%)',
    bgColor: 'hsla(38, 85%, 52%, 0.08)',
    suggestions: [
      '🌟 This is often the peak energy phase of the cycle.',
      '💪 High-intensity workouts, sports, and strength training may feel easier.',
      '🥗 Complex carbohydrates support sustained energy: whole grains, sweet potato.',
      '💧 Stay well-hydrated, especially before and after exercise.',
      '🤸 Great time for activities requiring coordination and endurance.',
      '🧠 Many people experience peak mental clarity during this phase.',
    ],
    activities: ['HIIT', 'Strength training', 'Sports', 'Long runs or rides'],
    avoid: ['Ignoring rest — recovery still matters'],
    note: 'Peak energy phase — leverage it for your most challenging goals.',
  },
  luteal: {
    label: 'Luteal Phase',
    emoji: '🌙',
    days: 'Days 18–28 (approx.)',
    color: 'hsl(265, 45%, 58%)',
    bgColor: 'hsla(265, 45%, 58%, 0.08)',
    suggestions: [
      '🌙 Energy may gradually decrease toward the end of this phase.',
      '🧘 Gentle yoga, Pilates, and stretching support mood and flexibility.',
      '🥜 Magnesium-rich foods (pumpkin seeds, dark chocolate, spinach) may support mood.',
      '🧂 Reduce salt and processed foods to minimize bloating.',
      '☕ Limit caffeine, which may worsen anxiety and breast tenderness.',
      '😴 Prioritize sleep — aim for the upper end of your sleep recommendation.',
      '💆 This is a good time for reflective activities: journaling, mindfulness.',
    ],
    activities: ['Yoga', 'Pilates', 'Gentle walking', 'Stretching'],
    avoid: ['Excess salt, caffeine, and processed foods', 'Over-committing if energy is low'],
    note: 'Honor energy fluctuations. Gentle self-care and rest are most supportive.',
  },
};

const CONCERNING_SYMPTOMS = [
  'severe_cramps', 'very_heavy_bleeding', 'irregular', 'missing_periods',
  'pain_intercourse', 'unusual_discharge', 'fever',
];

let currentUser   = null;
let activeProfile = null;

document.addEventListener('DOMContentLoaded', () => {
  Auth.requireAuth();
  currentUser   = Auth.getCurrentUser();
  activeProfile = Storage.getActiveProfile(currentUser.id);

  if (!activeProfile) {
    Toast.show('Please create a profile first!', 'info');
    setTimeout(() => { window.location.href = 'profile.html'; }, 1200);
    return;
  }

  if (activeProfile.gender !== 'women') {
    document.getElementById('cycle-main-content').innerHTML = `
      <div class="card text-center" style="padding:var(--space-12)">
        <div style="font-size:3rem;margin-bottom:var(--space-4)">🌸</div>
        <h2 style="font-family:var(--font-heading);margin-bottom:var(--space-3)">Women's Wellness Module</h2>
        <p class="text-muted">This section is designed for women's profiles. <a href="profile.html">Create a Women's profile</a> to access cycle wellness features.</p>
      </div>
    `;
    return;
  }

  renderCycleModule();
});

function renderCycleModule() {
  const cycleData = activeProfile.cycleData;
  const container = document.getElementById('cycle-main-content');

  if (!cycleData?.lastPeriodDate) {
    container.innerHTML = `
      <div class="card">
        <div class="card__header">
          <h2 class="card__title">🌸 Set Up Cycle Tracking</h2>
        </div>
        <p class="text-muted mb-4">Add your cycle information to get phase-based wellness suggestions.</p>
        <form id="cycle-setup-form">
          <div class="grid grid-2 gap-4">
            <div class="form-group">
              <label class="form-label" for="setup-last-period">Last Period Start Date <span class="required">*</span></label>
              <input class="form-input" type="date" id="setup-last-period" required />
            </div>
            <div class="form-group">
              <label class="form-label" for="setup-cycle-length">Average Cycle Length (days)</label>
              <input class="form-input" type="number" id="setup-cycle-length" value="28" min="21" max="45" />
            </div>
          </div>
          <button type="submit" class="btn btn--primary">Save & View My Cycle</button>
        </form>
      </div>
    `;

    document.getElementById('cycle-setup-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const lastPeriodDate = document.getElementById('setup-last-period').value;
      const cycleLength    = parseInt(document.getElementById('setup-cycle-length').value) || 28;

      if (!lastPeriodDate) { Toast.show('Please enter your last period date.', 'warning'); return; }

      activeProfile.cycleData = { lastPeriodDate, cycleLength, symptoms: [], mood: '', energyLevel: '' };
      Storage.saveProfile(currentUser.id, activeProfile);

      Storage.addCycleLog(currentUser.id, {
        startDate: lastPeriodDate,
        cycleLength,
        symptoms: [],
        mood: '',
        energy: '',
      });

      Toast.show('Cycle information saved!', 'success');
      renderCycleModule();
    });

    return;
  }

  const { lastPeriodDate, cycleLength = 28, symptoms = [] } = cycleData;
  const phaseInfo = getCurrentPhase(lastPeriodDate, cycleLength);

  const hasConcerningSymptom = symptoms.some(s => CONCERNING_SYMPTOMS.includes(s));

  container.innerHTML = `
    <!-- Cycle Summary -->
    <div class="cycle-summary mb-6">
      <div class="flex items-center justify-between flex-wrap gap-4 mb-4">
        <div>
          <div style="font-size:2rem;margin-bottom:var(--space-2)">${phaseInfo.phase.emoji}</div>
          <h2 style="font-family:var(--font-heading);font-size:var(--text-xl);font-weight:var(--weight-bold)">${phaseInfo.phase.label}</h2>
          <div class="text-muted text-sm">${phaseInfo.phase.days}</div>
        </div>
        <div class="flex gap-3 flex-wrap">
          <div class="stat-card" style="min-width:120px;padding:var(--space-4)">
            <div class="stat-card__value">${phaseInfo.dayOfCycle}</div>
            <div class="stat-card__label">Day of Cycle</div>
          </div>
          <div class="stat-card" style="min-width:120px;padding:var(--space-4)">
            <div class="stat-card__value" style="font-size:var(--text-lg)">${phaseInfo.daysToNext > 0 ? phaseInfo.daysToNext + 'd' : 'Due!'}</div>
            <div class="stat-card__label">Days to Next Period*</div>
          </div>
          <div class="stat-card" style="min-width:120px;padding:var(--space-4)">
            <div class="stat-card__value">${cycleLength}</div>
            <div class="stat-card__label">Cycle Length</div>
          </div>
        </div>
      </div>
      <div class="text-xs text-muted" style="border-top:1px solid var(--color-border);padding-top:var(--space-3)">
        * All predictions are estimates based on your reported average cycle length of ${cycleLength} days. Actual cycles vary. This is NOT a medical predictor.
      </div>
    </div>

    ${hasConcerningSymptom ? `
    <div class="alert alert--danger mb-6">
      <span class="alert__icon">⚠️</span>
      <div class="alert__body">
        <div class="alert__title">Please consult a healthcare professional</div>
        Some of the symptoms you've reported may benefit from professional evaluation. WellSync cannot assess or diagnose symptoms. Please consult a qualified gynecologist or healthcare provider.
      </div>
    </div>
    ` : ''}

    <!-- Cycle Calendar -->
    <div class="card mb-6">
      <div class="card__header">
        <h3 class="card__title">📅 Cycle Calendar & Forecast</h3>
        <span class="badge badge--primary text-xs">Multi-Month Forecast</span>
      </div>
      <div id="cycle-calendar-container"></div>
      <div class="cycle-legend">
        <div class="cycle-legend__item"><div class="cycle-legend__dot" style="background:hsl(0,72%,55%);"></div>Period (est.)</div>
        <div class="cycle-legend__item"><div class="cycle-legend__dot" style="background:hsl(280,65%,60%);"></div>Predicted Next Period</div>
        <div class="cycle-legend__item"><div class="cycle-legend__dot" style="background:hsl(38,92%,50%);"></div>Ovulation Peak (est.)</div>
        <div class="cycle-legend__item"><div class="cycle-legend__dot" style="background:hsl(152,58%,40%);"></div>Fertile Window (est.)</div>
        <div class="cycle-legend__item"><div class="cycle-legend__dot" style="background:var(--color-primary);box-shadow:0 0 0 2px var(--color-primary-light);"></div>Today</div>
      </div>
    </div>

    <!-- Phase Suggestions -->
    <div class="card mb-6" style="border-color:${phaseInfo.phase.color};background:${phaseInfo.phase.bgColor}">
      <div class="card__header">
        <h3 class="card__title">💡 ${phaseInfo.phase.label} – Wellness Suggestions</h3>
        <span class="badge badge--muted">General wellness only</span>
      </div>
      <div style="display:flex;flex-direction:column;gap:var(--space-3)">
        ${phaseInfo.phase.suggestions.map(s => `
          <div class="rec-item" style="border:none;padding:var(--space-3) 0;border-bottom:1px solid var(--color-border)">
            <div class="text-sm" style="color:var(--color-text-secondary)">${s}</div>
          </div>
        `).join('')}
      </div>
      <div class="flex gap-3 flex-wrap mt-4">
        <div>
          <div class="text-xs font-semibold text-muted mb-2">✅ Recommended Activities</div>
          <div class="flex gap-2 flex-wrap">${phaseInfo.phase.activities.map(a => `<span class="badge badge--primary">${a}</span>`).join('')}</div>
        </div>
      </div>
      <div class="text-xs text-muted mt-3 italic">${phaseInfo.phase.note}</div>
    </div>

    <!-- All 4 Phases Reference -->
    <div class="section-title mt-4">🌀 The 4 Cycle Phases</div>
    <div class="phase-grid mb-6">
      ${Object.entries(PHASES).map(([key, phase]) => `
        <div class="phase-card ${phaseInfo.phaseKey === key ? 'active-phase' : ''}">
          <span class="phase-card__emoji">${phase.emoji}</span>
          <div class="phase-card__name">${phase.label}${phaseInfo.phaseKey === key ? ' ← You are here' : ''}</div>
          <div class="phase-card__days">${phase.days}</div>
          <div class="phase-card__tips">${phase.note}</div>
        </div>
      `).join('')}
    </div>

    <!-- Log New Cycle -->
    <div class="card mb-6">
      <div class="card__header">
        <h3 class="card__title">📝 Log a New Period Start</h3>
      </div>
      <form id="new-cycle-form">
        <div class="grid grid-2 gap-4">
          <div class="form-group">
            <label class="form-label" for="new-period-date">Period Start Date <span class="required">*</span></label>
            <input class="form-input" type="date" id="new-period-date" required />
          </div>
          <div class="form-group">
            <label class="form-label" for="new-cycle-length">Cycle Length (days)</label>
            <input class="form-input" type="number" id="new-cycle-length" value="${cycleLength}" min="21" max="45" />
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Symptoms (optional)</label>
          <div class="symptom-checkboxes">
            ${['Cramps', 'Bloating', 'Fatigue', 'Mood changes', 'Headache', 'Backache'].map(s => `
              <label style="display:inline-flex;align-items:center;gap:6px;padding:6px 12px;border:1px solid var(--color-border);border-radius:var(--radius-full);cursor:pointer;font-size:var(--text-sm);background:var(--color-surface)">
                <input type="checkbox" name="new-symptoms" value="${s.toLowerCase().replace(' ','_')}" />
                ${s}
              </label>
            `).join('')}
          </div>
        </div>
        <button type="submit" class="btn btn--primary">Log Period Start</button>
      </form>
    </div>

    <!-- History -->
    <div class="section-title">📋 Cycle History</div>
    <div class="card" id="cycle-history"></div>

    <!-- Disclaimer -->
    <div class="alert alert--warning mt-6">
      <span class="alert__icon">⚕️</span>
      <div class="alert__body">
        <div class="alert__title">Medical Disclaimer</div>
        WellSync's cycle tracking provides general wellness suggestions based on typical cycle patterns. It does not diagnose PCOS, endometriosis, or any medical condition. Cycle predictions are estimates only. For any medical concerns, reproductive health issues, or unusual symptoms, please consult a qualified gynecologist or healthcare professional.
      </div>
    </div>
  `;

  renderCycleCalendar(lastPeriodDate, cycleLength);
  renderCycleHistory();

  document.getElementById('new-cycle-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const date   = document.getElementById('new-period-date').value;
    const length = parseInt(document.getElementById('new-cycle-length').value) || 28;
    const syms   = Array.from(document.querySelectorAll('[name="new-symptoms"]:checked')).map(el => el.value);

    if (!date) { Toast.show('Please enter the period start date.', 'warning'); return; }

    const concerning = syms.filter(s => CONCERNING_SYMPTOMS.includes(s));
    if (concerning.length > 0) {
      Toast.show('Some symptoms you reported may warrant professional evaluation. Please consult a healthcare provider.', 'warning', 5000);
    }

    Storage.addCycleLog(currentUser.id, { startDate: date, cycleLength: length, symptoms: syms });

    activeProfile.cycleData = { ...activeProfile.cycleData, lastPeriodDate: date, cycleLength: length };
    Storage.saveProfile(currentUser.id, activeProfile);

    Toast.show('Period logged! Refreshing…', 'success');
    setTimeout(() => { renderCycleModule(); }, 800);
  });
}

function getCurrentPhase(lastPeriodDate, cycleLength) {
  const last  = new Date(lastPeriodDate + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffTime = today.getTime() - last.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
  

  let dayOfCycle;
  if (diffDays >= 0) {
    dayOfCycle = (diffDays % cycleLength) + 1;
  } else {
    dayOfCycle = ((diffDays % cycleLength) + cycleLength) % cycleLength + 1;
  }

  let next = new Date(last);
  if (today < last) {
    next = new Date(last);
  } else {
    while (next <= today) {
      next.setDate(next.getDate() + cycleLength);
    }
  }
  const daysToNext = Math.max(0, Math.ceil((next.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));

  let phaseKey;
  if (dayOfCycle <= 5)       phaseKey = 'menstruation';
  else if (dayOfCycle <= 13) phaseKey = 'follicular';
  else if (dayOfCycle <= 17) phaseKey = 'ovulation';
  else                       phaseKey = 'luteal';

  return { phase: PHASES[phaseKey], phaseKey, dayOfCycle, daysToNext, nextPeriodDate: next };
}

let calendarViewDate = new Date();

function renderCycleCalendar(lastPeriodDate, cycleLength) {
  const container = document.getElementById('cycle-calendar-container');
  if (!container) return;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const year = calendarViewDate.getFullYear();
  const month = calendarViewDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const totalDays = lastDay.getDate();
  const startDow = firstDay.getDay();

  const monthName = calendarViewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const baseDate = new Date(lastPeriodDate + 'T00:00:00');
  const cycleLen = Number(cycleLength) || 28;
  const periodDuration = 5;

  const cycleLogs = Storage.getCycleLogs(currentUser.id);

  let html = `
    <div class="flex justify-between items-center flex-wrap gap-3 mb-4" style="padding: 0 var(--space-1);">
      <button type="button" class="btn btn--secondary btn--sm" id="cal-prev-btn">◀ Prev Month</button>
      <div style="font-family:var(--font-heading);font-weight:700;font-size:var(--text-base);color:var(--color-text);">
        ${monthName}
      </div>
      <div class="flex gap-2">
        <button type="button" class="btn btn--ghost btn--sm" id="cal-today-btn">Current Month</button>
        <button type="button" class="btn btn--secondary btn--sm" id="cal-next-btn">Next Month ▶</button>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:6px;text-align:center;margin-bottom:var(--space-2)">
  `;

  ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].forEach(d => {
    html += `<div style="font-size:11px;font-weight:700;color:var(--color-text-muted);padding:4px">${d}</div>`;
  });
  html += `</div><div class="cycle-calendar" style="margin-top:0;">`;

  for (let i = 0; i < startDow; i++) {
    html += `<div class="cycle-day cycle-day--empty"></div>`;
  }

  for (let d = 1; d <= totalDays; d++) {
    const currDate = new Date(year, month, d);
    currDate.setHours(0, 0, 0, 0);

    const diffDays = Math.round((currDate.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24));
    const cycleIndex = Math.floor(diffDays / cycleLen);
    const dayOfCycle = ((diffDays % cycleLen) + cycleLen) % cycleLen + 1;

    let isPeriod = false;
    let isPredictedPeriod = false;
    let isFertile = false;
    let isOvulation = false;
    let tooltip = '';

    const isLoggedPeriod = cycleLogs.some(log => {
      if (!log.startDate) return false;
      const lStart = new Date(log.startDate + 'T00:00:00');
      const lDiff = Math.round((currDate.getTime() - lStart.getTime()) / (1000 * 60 * 60 * 24));
      return lDiff >= 0 && lDiff < periodDuration;
    });

    if (isLoggedPeriod || (dayOfCycle >= 1 && dayOfCycle <= periodDuration && cycleIndex <= 0)) {
      isPeriod = true;
      tooltip = `Period (Day ${dayOfCycle})`;
    } else if (dayOfCycle >= 1 && dayOfCycle <= periodDuration && cycleIndex > 0) {
      isPredictedPeriod = true;
      tooltip = `Predicted Next Period (Cycle Day ${dayOfCycle})`;
    } else if (dayOfCycle === 14) {
      isOvulation = true;
      tooltip = `Estimated Ovulation Peak (Cycle Day 14)`;
    } else if (dayOfCycle >= 11 && dayOfCycle <= 16) {
      isFertile = true;
      tooltip = `Fertile Window (Cycle Day ${dayOfCycle})`;
    }

    const isToday = (currDate.getTime() === today.getTime());
    if (isToday) {
      tooltip = (tooltip ? tooltip + ' · ' : '') + 'Today';
    }

    let classes = ['cycle-day'];
    if (isPeriod) classes.push('cycle-day--period');
    else if (isPredictedPeriod) classes.push('cycle-day--predicted');
    else if (isOvulation) classes.push('cycle-day--ovulation');
    else if (isFertile) classes.push('cycle-day--fertile');
    
    if (isToday) classes.push('cycle-day--today');

    html += `<div class="${classes.join(' ')}" title="${tooltip || `${monthName.split(' ')[0]} ${d}`}">${d}</div>`;
  }

  html += `</div>`;
  container.innerHTML = html;

  document.getElementById('cal-prev-btn')?.addEventListener('click', () => {
    calendarViewDate.setMonth(calendarViewDate.getMonth() - 1);
    renderCycleCalendar(lastPeriodDate, cycleLength);
  });

  document.getElementById('cal-next-btn')?.addEventListener('click', () => {
    calendarViewDate.setMonth(calendarViewDate.getMonth() + 1);
    renderCycleCalendar(lastPeriodDate, cycleLength);
  });

  document.getElementById('cal-today-btn')?.addEventListener('click', () => {
    calendarViewDate = new Date();
    renderCycleCalendar(lastPeriodDate, cycleLength);
  });
}

function renderCycleHistory() {
  const container = document.getElementById('cycle-history');
  if (!container) return;

  const logs = Storage.getCycleLogs(currentUser.id).slice(-6).reverse();

  if (logs.length === 0) {
    container.innerHTML = `<p class="text-muted text-sm" style="padding:var(--space-4)">No cycle history logged yet.</p>`;
    return;
  }

  container.innerHTML = logs.map(log => `
    <div class="log-row">
      <span class="log-row__icon">🌸</span>
      <div style="flex:1">
        <div class="log-row__label">Period Started: ${log.startDate}</div>
        <div style="font-size:var(--text-xs);color:var(--color-text-muted)">
          Cycle length: ${log.cycleLength || 28} days
          ${log.symptoms?.length > 0 ? '· Symptoms: ' + log.symptoms.join(', ') : ''}
          ${log.mood ? '· Mood: ' + log.mood : ''}
        </div>
      </div>
      <span class="badge badge--women">${log.cycleLength || 28}d</span>
    </div>
  `).join('');
}
