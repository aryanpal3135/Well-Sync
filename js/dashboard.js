

'use strict';

let currentUser    = null;
let activeProfile  = null;
let currentPlan    = null;
let wellnessScore  = null;

document.addEventListener('DOMContentLoaded', async () => {
  Auth.requireAuth();
  currentUser   = Auth.getCurrentUser();
  activeProfile = Storage.getActiveProfile(currentUser.id);

  if (!activeProfile) {
    const modal = document.getElementById('no-profile-modal');
    if (modal) modal.classList.add('show');
    return;
  }

  renderGreeting();
  renderProfileBadge();

  const cachedPlan = localStorage.getItem(`wellsync_plan_${currentUser.id}_${activeProfile.id}`);
  if (cachedPlan) {
    currentPlan = JSON.parse(cachedPlan);
  } else {
    try {
      currentPlan = await RecommendationEngine.generatePersonalizedPlan(activeProfile);
      localStorage.setItem(
        `wellsync_plan_${currentUser.id}_${activeProfile.id}`,
        JSON.stringify(currentPlan)
      );
    } catch (err) {
      console.error('Plan generation failed:', err);
    }
  }

  const logs    = Storage.getLogs(currentUser.id);
  wellnessScore = RecommendationEngine.calculateWellnessScore(activeProfile, logs);

  renderWellnessScore();
  renderStatCards();
  renderTodayPlan();
  renderQuickLog();
  renderCycleInfo();
  renderTips();

  document.getElementById('quick-log-form')?.addEventListener('submit', handleQuickLog);
});

function renderGreeting() {
  const hour = new Date().getHours();
  let greeting;
  if (hour < 12) greeting = 'Good Morning';
  else if (hour < 17) greeting = 'Good Afternoon';
  else greeting = 'Good Evening';

  const el = document.getElementById('greeting-text');
  if (el) el.textContent = `${greeting}, ${activeProfile.name.split(' ')[0]} 👋`;
}

function renderProfileBadge() {
  const el = document.getElementById('profile-badge');
  if (!el) return;

  const genderLabel = { men: '👨 Men', women: '👩 Women', child: '👶 Child' };
  const goalLabel   = RecommendationEngine.formatGoal(activeProfile.goal);

  el.innerHTML = `
    <div class="flex items-center gap-3 flex-wrap">
      <span class="badge badge--primary">${genderLabel[activeProfile.gender] || activeProfile.gender}</span>
      <span class="badge badge--muted">🎯 ${goalLabel}</span>
      <span class="badge badge--muted">🏃 ${formatActivity(activeProfile.activityLevel)}</span>
      ${activeProfile.dietPreference ? `<span class="badge badge--muted">🥗 ${capitalize(activeProfile.dietPreference)}</span>` : ''}
    </div>
  `;
}

function renderWellnessScore() {
  if (!wellnessScore) return;

  const { total, grade, breakdown } = wellnessScore;

  const ring = document.querySelector('.score-ring__fill');
  if (ring) {
    const circumference = 2 * Math.PI * 55;
    ring.style.strokeDasharray  = circumference;

    if (total === 0) {

      ring.style.strokeDashoffset = circumference;
      ring.style.stroke = 'var(--color-border)';
    } else {
      const dashOffset = circumference - (total / 100) * circumference;
      ring.style.strokeDashoffset = dashOffset;

      const colors = {
        Excellent:        'hsl(152,58%,40%)',
        Good:             'hsl(196,62%,46%)',
        Fair:             'hsl(38,88%,52%)',
        'Getting Started':'hsl(38,88%,52%)',
      };
      ring.style.stroke = colors[grade] || 'hsl(152,58%,40%)';
    }
  }

  const numberEl = document.getElementById('score-number');
  const gradeEl  = document.getElementById('score-grade');
  if (numberEl) numberEl.textContent = total;
  if (gradeEl)  gradeEl.textContent  = total === 0 ? 'Start Logging!' : grade;

  const breakdownEl = document.getElementById('score-breakdown');
  if (breakdownEl) {
    const items = [
      { label: 'Nutrition',    value: breakdown.nutrition,    icon: '🍎', weight: '25%' },
      { label: 'Exercise',     value: breakdown.exercise,     icon: '🏋️', weight: '25%' },
      { label: 'Hydration',    value: breakdown.hydration,    icon: '💧', weight: '20%' },
      { label: 'Sleep',        value: breakdown.sleep,        icon: '😴', weight: '20%' },
      { label: 'Mindfulness',  value: breakdown.mindfulness,  icon: '🧘', weight: '10%' },
    ];

    breakdownEl.innerHTML = items.map(item => `
      <div class="score-breakdown-item">
        <div class="flex justify-between items-center mb-1">
          <span class="text-sm">${item.icon} ${item.label}</span>
          <span class="font-mono text-sm">${Math.round(item.value)}%</span>
        </div>
        <div class="progress-bar progress-bar--sm">
          <div class="progress-bar__fill" style="width:${item.value}%;background:${item.value >= 70 ? 'var(--color-primary)' : item.value >= 40 ? 'var(--color-warning)' : item.value > 0 ? 'var(--color-danger)' : 'var(--color-border)'}"></div>
        </div>
      </div>
    `).join('');
  }
}

function renderStatCards() {
  if (!currentPlan) return;

  const { hydration, sleep, calorie } = currentPlan;
  const logs     = Storage.getLogs(currentUser.id);
  const today    = Storage.today();
  const todayWater = logs.filter(l => l.date === today && l.type === 'water').reduce((s, l) => s + l.value, 0);
  const todaySleep  = logs.filter(l => l.date === today && l.type === 'sleep').slice(-1)[0]?.value || 0;

  const statsEl = document.getElementById('stat-cards');
  if (!statsEl) return;

  statsEl.innerHTML = `
    <div class="stat-card animate-fadeIn">
      <div class="stat-card__icon" style="background:var(--color-primary-light)">💧</div>
      <div class="stat-card__value">${todayWater} <span style="font-size:var(--text-sm);font-weight:400">/ ${hydration.ml} ml</span></div>
      <div class="stat-card__label">Hydration Today</div>
      <div class="progress-bar progress-bar--sm mt-2">
        <div class="progress-bar__fill" style="width:${Math.min(100, (todayWater/hydration.ml)*100)}%"></div>
      </div>
    </div>
    <div class="stat-card animate-fadeIn">
      <div class="stat-card__icon" style="background:var(--color-secondary-light)">😴</div>
      <div class="stat-card__value">${todaySleep || '—'} <span style="font-size:var(--text-sm);font-weight:400">/ ${sleep.min} hrs</span></div>
      <div class="stat-card__label">Sleep Last Night</div>
      <div class="progress-bar progress-bar--sm mt-2">
        <div class="progress-bar__fill" style="width:${Math.min(100,(todaySleep/sleep.min)*100)}%;background:var(--color-secondary)"></div>
      </div>
    </div>
    <div class="stat-card animate-fadeIn">
      <div class="stat-card__icon" style="background:var(--color-accent-child-light)">🔥</div>
      <div class="stat-card__value">${calorie.adjustedTdee}</div>
      <div class="stat-card__label">Daily Calorie Target</div>
      <div style="font-size:var(--text-xs);color:var(--color-text-muted);margin-top:var(--space-1)">BMR: ${calorie.bmr} kcal</div>
    </div>
    <div class="stat-card animate-fadeIn">
      <div class="stat-card__icon" style="background:${activeProfile.metrics ? 'var(--color-success-light)' : 'var(--color-primary-light)'}">📊</div>
      <div class="stat-card__value">${currentPlan.metrics.bmi || '—'}</div>
      <div class="stat-card__label">BMI</div>
      <div style="margin-top:var(--space-1)">
        <span class="badge badge--${currentPlan.metrics.bmiClass.color === 'success' ? 'primary' : currentPlan.metrics.bmiClass.color === 'warning' ? 'warning' : 'danger'}" style="font-size:10px">
          ${currentPlan.metrics.bmiClass.label}
        </span>
      </div>
    </div>
  `;
}

function renderTodayPlan() {
  if (!currentPlan) return;

  const dietEl = document.getElementById('today-diet');
  if (dietEl && currentPlan.diet) {
    const breakfast = currentPlan.diet.breakfast?.[0];
    const lunch     = currentPlan.diet.lunch?.[0];
    dietEl.innerHTML = `
      ${breakfast ? `<div class="rec-mini">🌅 <strong>Breakfast:</strong> ${breakfast.name}</div>` : ''}
      ${lunch     ? `<div class="rec-mini">☀️ <strong>Lunch:</strong> ${lunch.name}</div>` : ''}
      <a href="recommendations.html#diet" class="btn btn--outline-primary btn--sm mt-2">Full Diet Plan →</a>
    `;
  }

  const exEl = document.getElementById('today-exercise');
  if (exEl && currentPlan.exercise?.[0]) {
    const ex = currentPlan.exercise[0];
    exEl.innerHTML = `
      <div class="rec-mini">🏋️ <strong>${ex.name}</strong></div>
      <div class="text-sm text-muted">${ex.duration} min · ${ex.intensity} intensity · ${ex.frequency}</div>
      <a href="recommendations.html#exercise" class="btn btn--outline-primary btn--sm mt-2">Full Exercise Plan →</a>
    `;
  }

  const yogaEl = document.getElementById('today-yoga');
  if (yogaEl && currentPlan.yoga?.[0]) {
    const pose = currentPlan.yoga[0];
    yogaEl.innerHTML = `
      <div class="rec-mini">🧘 <strong>${pose.name}</strong></div>
      <div class="text-sm text-muted">${pose.difficulty} · ${Math.ceil(pose.duration/60)} min</div>
      <a href="recommendations.html#yoga" class="btn btn--outline-primary btn--sm mt-2">Full Yoga Plan →</a>
    `;
  }
}

function renderCycleInfo() {
  const el = document.getElementById('cycle-card');
  if (!el) return;

  if (activeProfile.gender !== 'women' || !activeProfile.cycleData?.lastPeriodDate) {
    el.closest('.dashboard-section')?.remove();
    return;
  }

  const { lastPeriodDate, cycleLength = 28 } = activeProfile.cycleData;
  const last    = new Date(lastPeriodDate);
  const next    = new Date(last);
  next.setDate(next.getDate() + cycleLength);

  const today   = new Date();
  const daysSinceLast = Math.floor((today - last) / 86400000);
  const daysToNext    = Math.ceil((next - today) / 86400000);

  let phaseLabel, phaseEmoji, phaseNote;
  if (daysSinceLast <= 5) {
    phaseLabel = 'Menstruation Phase'; phaseEmoji = '🌷';
    phaseNote  = 'Focus on gentle movement, hydration, and iron-rich foods.';
  } else if (daysSinceLast <= 13) {
    phaseLabel = 'Follicular Phase'; phaseEmoji = '🌱';
    phaseNote  = 'Energy is building — great time to try higher-intensity workouts.';
  } else if (daysSinceLast <= 17) {
    phaseLabel = 'Ovulation Phase'; phaseEmoji = '✨';
    phaseNote  = 'Peak energy phase — you may feel most motivated and energetic.';
  } else {
    phaseLabel = 'Luteal Phase'; phaseEmoji = '🌙';
    phaseNote  = 'Energy may decrease. Gentle yoga and rest are supportive.';
  }

  el.innerHTML = `
    <div class="flex items-center gap-4">
      <div style="font-size:2.5rem">${phaseEmoji}</div>
      <div>
        <div style="font-weight:600;color:var(--color-accent-women)">${phaseLabel}</div>
        <div class="text-sm">${phaseNote}</div>
        <div class="flex gap-3 mt-2">
          <span class="badge badge--women">Day ${daysSinceLast} of cycle</span>
          ${daysToNext > 0 ? `<span class="badge badge--muted">Next period ~${daysToNext} days</span>` : ''}
        </div>
      </div>
    </div>
    <div class="text-xs text-muted mt-3" style="border-top:1px solid var(--color-border);padding-top:var(--space-3)">
      ⚕️ This is an estimate based on your cycle length. Consult a healthcare professional for medical advice.
    </div>
    <a href="menstrual.html" class="btn btn--outline-primary btn--sm mt-3" style="border-color:var(--color-accent-women);color:var(--color-accent-women)">
      🌸 View Cycle Details →
    </a>
  `;
}

function renderTips() {
  const el = document.getElementById('lifestyle-tips');
  if (!el || !currentPlan?.lifestyle) return;

  const tip = currentPlan.lifestyle[new Date().getDay() % currentPlan.lifestyle.length];
  el.innerHTML = `
    <div class="alert alert--success">
      <span class="alert__icon">💡</span>
      <div class="alert__body">
        <div class="alert__title">Today's Wellness Tip</div>
        ${tip}
      </div>
    </div>
  `;
}

function renderQuickLog() {
  const today = Storage.today();
  const logs  = Storage.getLogsForDate(currentUser.id, today);

  const waterLogged = logs.filter(l => l.type === 'water').reduce((s,l) => s+l.value, 0);
  const sleepLogged = logs.filter(l => l.type === 'sleep').slice(-1)[0]?.value || '';
  const exerciseDone = logs.some(l => l.type === 'exercise');
  const mealCount   = logs.filter(l => l.type === 'meal').length;

  const el = document.getElementById('quick-log-status');
  if (el) {
    el.innerHTML = `
      <div class="flex gap-3 flex-wrap">
        <span class="badge ${waterLogged >= (currentPlan?.hydration?.ml || 2000) ? 'badge--primary' : 'badge--muted'}">💧 ${waterLogged > 0 ? waterLogged+'ml logged' : 'No water logged'}</span>
        <span class="badge ${sleepLogged ? 'badge--primary' : 'badge--muted'}">😴 ${sleepLogged ? sleepLogged+'h sleep' : 'Sleep not logged'}</span>
        <span class="badge ${exerciseDone ? 'badge--primary' : 'badge--muted'}">🏋️ ${exerciseDone ? 'Exercise done!' : 'No exercise logged'}</span>
        <span class="badge ${mealCount >= 3 ? 'badge--primary' : 'badge--muted'}">🍎 ${mealCount} meal${mealCount !== 1 ? 's' : ''} logged</span>
      </div>
    `;
  }
}

function handleQuickLog(e) {
  e.preventDefault();
  const today  = Storage.today();
  const water  = parseFloat(document.getElementById('log-water')?.value);
  const sleep  = parseFloat(document.getElementById('log-sleep')?.value);
  const exDone = document.getElementById('log-exercise')?.checked;
  const mealDone = document.getElementById('log-meal')?.checked;
  const yogaDone = document.getElementById('log-yoga')?.checked;

  let logged = false;

  if (water > 0) {
    Storage.addLog(currentUser.id, { type: 'water', value: water, unit: 'ml', date: today });
    logged = true;
  }
  if (sleep > 0) {
    Storage.addLog(currentUser.id, { type: 'sleep', value: sleep, unit: 'hours', date: today });
    logged = true;
  }
  if (exDone) {
    Storage.addLog(currentUser.id, { type: 'exercise', value: 1, unit: 'session', date: today });
    logged = true;
  }
  if (mealDone) {
    Storage.addLog(currentUser.id, { type: 'meal', value: 1, unit: 'meal', date: today });
    logged = true;
  }
  if (yogaDone) {
    Storage.addLog(currentUser.id, { type: 'yoga', value: 1, unit: 'session', date: today });
    logged = true;
  }

  if (logged) {
    Toast.show('Activity logged successfully! 🎉', 'success');

    const logs    = Storage.getLogs(currentUser.id);
    wellnessScore = RecommendationEngine.calculateWellnessScore(activeProfile, logs);
    renderWellnessScore();
    renderStatCards();
    renderQuickLog();

    e.target.reset();
  } else {
    Toast.show('Please enter at least one activity to log.', 'warning');
  }
}

function formatActivity(level) {
  const map = { sedentary: 'Sedentary', lightly_active: 'Lightly Active', moderately_active: 'Moderately Active', very_active: 'Very Active' };
  return map[level] || level;
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1).replace('_', '-');
}
