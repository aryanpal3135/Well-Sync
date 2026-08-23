

'use strict';

let currentUser   = null;
let activeProfile = null;

document.addEventListener('DOMContentLoaded', async () => {
  Auth.requireAuth();
  currentUser   = Auth.getCurrentUser();
  activeProfile = Storage.getActiveProfile(currentUser.id);

  if (!activeProfile) {
    const modal = document.getElementById('no-profile-modal');
    if (modal) modal.classList.add('show');
    return;
  }

  renderLogForm();
  renderRecentLogs();
  await renderCharts();
});

function getLast7Days() {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().split('T')[0]);
  }
  return days;
}

function formatDay(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' });
}

function renderLogForm() {
  const form = document.getElementById('log-form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const today   = Storage.today();
    const type    = document.getElementById('log-type').value;
    const value   = parseFloat(document.getElementById('log-value').value);
    const note    = document.getElementById('log-note').value.trim();

    if (!type) { Toast.show('Please select an activity type.', 'warning'); return; }
    if (isNaN(value) || value <= 0) { Toast.show('Please enter a valid positive value.', 'warning'); return; }

    const limits = {
      water:    { max: 10000, label: 'Water intake',     unit: 'ml',      hint: 'Maximum 10,000 ml (10 litres) per day.' },
      sleep:    { max: 16,   label: 'Sleep duration',    unit: 'hours',   hint: 'Maximum 16 hours — please enter a realistic sleep duration.' },
      exercise: { max: 300,  label: 'Exercise session',  unit: 'minutes', hint: 'Maximum 300 minutes (5 hours) per session.' },
      meal:     { max: 10,   label: 'Meal count',        unit: 'meals',   hint: 'Maximum 10 meals — please enter a realistic value.' },
      yoga:     { max: 180,  label: 'Yoga session',      unit: 'minutes', hint: 'Maximum 180 minutes (3 hours) per session.' },
    };

    const limit = limits[type];
    if (limit && value > limit.max) {
      Toast.show(`⚠ ${limit.label} value seems unrealistic. ${limit.hint}`, 'warning', 5000);
      return;
    }

    const unitMap = { water: 'ml', sleep: 'hours', exercise: 'minutes', meal: 'count', yoga: 'minutes' };

    Storage.addLog(currentUser.id, {
      type,
      value,
      unit: unitMap[type] || 'unit',
      date: today,
      note,
    });

Toast.show('Activity logged! 🎉', 'success');
form.reset();
document.getElementById('log-unit').textContent = 'unit';
renderRecentLogs();
renderCharts();
if (window.renderWeekSummary) window.renderWeekSummary();
  });
}

function renderRecentLogs() {
  const container = document.getElementById('recent-logs');
  if (!container) return;

  const logs = Storage.getLogs(currentUser.id)
    .slice(-15)
    .reverse();

  if (logs.length === 0) {
    container.innerHTML = `<p class="text-muted text-sm text-center" style="padding:var(--space-6)">No activities logged yet. Start logging above!</p>`;
    return;
  }

  const icons = { water: '💧', sleep: '😴', exercise: '🏋️', meal: '🍎', yoga: '🧘' };

  container.innerHTML = `
    <div class="log-table">
      ${logs.map(log => `
        <div class="log-row">
          <span class="log-row__icon">${icons[log.type] || '📋'}</span>
          <div style="flex:1">
            <div class="log-row__label">${capitalize(log.type)}</div>
            <div style="font-size:var(--text-xs);color:var(--color-text-muted)">${log.date} ${log.note ? '· ' + log.note : ''}</div>
          </div>
          <div class="font-mono text-sm">${log.value} ${log.unit}</div>
          <button class="btn btn--ghost btn--sm" onclick="deleteLog('${log.id}')" aria-label="Delete log">✕</button>
        </div>
      `).join('')}
    </div>
  `;
}

function deleteLog(logId) {
  Storage.removeLog(currentUser.id, logId);
  Toast.show('Log entry removed.', 'info');
  renderRecentLogs();
  renderCharts();
  if (window.renderWeekSummary) window.renderWeekSummary();
}

window.deleteLog = deleteLog;

async function renderCharts() {
  const days     = getLast7Days();
  const labels   = days.map(formatDay);
  const logs     = Storage.getLogs(currentUser.id);
  const hydration = RecommendationEngine.calculateHydration(activeProfile);
  const sleep    = RecommendationEngine.getSleepRecommendation(activeProfile.age);

  const waterData = days.map(day =>
    logs.filter(l => l.date === day && l.type === 'water')
       .reduce((s, l) => s + l.value, 0)
  );

  buildOrUpdateChart('chart-water', {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Water (ml)',
        data: waterData,
        backgroundColor: 'hsla(196, 62%, 46%, 0.6)',
        borderColor:     'hsl(196, 62%, 46%)',
        borderWidth: 2,
        borderRadius: 6,
      }, {
        label: `Target (${hydration.ml}ml)`,
        data: days.map(() => hydration.ml),
        type: 'line',
        borderColor: 'hsl(152, 58%, 40%)',
        borderDash: [5, 5],
        borderWidth: 2,
        pointRadius: 0,
        fill: false,
      }],
    },
    options: chartOptions('Daily Water Intake (ml)'),
  });

  const sleepData = days.map(day => {
    const entry = logs.filter(l => l.date === day && l.type === 'sleep').slice(-1)[0];
    return entry ? entry.value : 0;
  });

  buildOrUpdateChart('chart-sleep', {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Sleep (hours)',
        data: sleepData,
        backgroundColor: 'hsla(265, 45%, 60%, 0.15)',
        borderColor:     'hsl(265, 45%, 60%)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: 'hsl(265, 45%, 60%)',
        pointRadius: 5,
      }, {
        label: `Target (${sleep.min}h)`,
        data: days.map(() => sleep.min),
        borderColor: 'hsl(152, 58%, 40%)',
        borderDash: [5, 5],
        borderWidth: 2,
        pointRadius: 0,
        fill: false,
      }],
    },
    options: chartOptions('Daily Sleep Duration (hours)'),
  });

  const exerciseData = days.map(day =>
    logs.filter(l => l.date === day && l.type === 'exercise').length
  );

  buildOrUpdateChart('chart-exercise', {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Exercise Sessions',
        data: exerciseData,
        backgroundColor: 'hsla(152, 58%, 40%, 0.6)',
        borderColor:     'hsl(152, 58%, 40%)',
        borderWidth: 2,
        borderRadius: 6,
      }],
    },
    options: chartOptions('Exercise Sessions per Day'),
  });

  const scoreData = days.map(day => {
    const dayLogs = logs.filter(l => new Date(l.date) <= new Date(day));
    const score   = RecommendationEngine.calculateWellnessScore(activeProfile, dayLogs);
    return score.total;
  });

  buildOrUpdateChart('chart-score', {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Wellness Score',
        data: scoreData,
        backgroundColor: 'hsla(38, 88%, 52%, 0.1)',
        borderColor:     'hsl(38, 88%, 52%)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: 'hsl(38, 88%, 52%)',
        pointRadius: 5,
      }],
    },
    options: {
      ...chartOptions('Wellness Score Trend (0–100)'),
      scales: {
        y: { min: 0, max: 100, grid: { color: 'var(--color-border)' } },
        x: { grid: { display: false } },
      },
    },
  });
}

const chartRegistry = {};

function buildOrUpdateChart(canvasId, config) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  if (chartRegistry[canvasId]) {
    chartRegistry[canvasId].destroy();
  }

  const ctx = canvas.getContext('2d');
  chartRegistry[canvasId] = new Chart(ctx, config);
}

function chartOptions(title) {
  return {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { color: 'var(--color-text-secondary)', font: { family: 'Inter', size: 11 } },
      },
      title: { display: false },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: 'var(--color-border)' },
        ticks: { color: 'var(--color-text-muted)', font: { size: 11 } },
      },
      x: {
        grid: { display: false },
        ticks: { color: 'var(--color-text-muted)', font: { size: 11 } },
      },
    },
  };
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
