

'use strict';

const PROFILE_TYPES = {
  men: {
    label: 'Men',
    emoji: '👨',
    color: 'var(--color-secondary)',
    goalOptions: [
      { value: 'general_wellness',  label: '🌿 General Wellness' },
      { value: 'weight_management', label: '⚖️ Weight Management' },
      { value: 'fitness',           label: '🏃 Fitness & Cardio' },
      { value: 'strength',          label: '💪 Strength & Muscle' },
    ],
    showWomensWellness: false,
  },
  women: {
    label: 'Women',
    emoji: '👩',
    color: 'var(--color-accent-women)',
    goalOptions: [
      { value: 'general_wellness',  label: '🌿 General Wellness' },
      { value: 'weight_management', label: '⚖️ Weight Management' },
      { value: 'fitness',           label: '🏃 Fitness & Cardio' },
      { value: 'strength',          label: '💪 Strength & Toning' },
      { value: 'flexibility',       label: '🧘 Flexibility & Yoga' },
    ],
    showWomensWellness: true,
  },
  child: {
    label: 'Child',
    emoji: '👶',
    color: 'var(--color-accent-child)',
    goalOptions: [
      { value: 'general_wellness', label: '🌱 Healthy Growth & Wellness' },
      { value: 'fitness',          label: '🏃 Active & Energetic' },
    ],
    showWomensWellness: false,
  },
};

let selectedType  = null;
let currentUser   = null;

document.addEventListener('DOMContentLoaded', () => {
  Auth.requireAuth();
  currentUser = Auth.getCurrentUser();

  if (!currentUser) return;

  initTypeSelector();
  populateExistingProfiles();
  updateWelcomeMessage();
});

function updateWelcomeMessage() {
  const el = document.getElementById('profile-welcome-name');
  if (el && currentUser) el.textContent = currentUser.name.split(' ')[0];
}

function initTypeSelector() {
  const cards = document.querySelectorAll('.type-card');

  cards.forEach(card => {
    card.addEventListener('click', () => {
      const type = card.dataset.type;
      if (!PROFILE_TYPES[type]) return;

      cards.forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');

      selectedType = type;
      renderProfileForm(type);

      setTimeout(() => {
        document.getElementById('profile-form-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    });
  });
}

function renderProfileForm(type) {
  const config = PROFILE_TYPES[type];
  const container = document.getElementById('profile-form-section');
  if (!container) return;

  container.innerHTML = `
    <div class="card animate-slideDown">
      <div class="card__header">
        <div>
          <h2 class="card__title">${config.emoji} ${config.label}'s Wellness Profile</h2>
          <p class="card__subtitle">Fill in your details to generate a personalized plan</p>
        </div>
        <span class="badge badge--primary">${config.label}</span>
      </div>

      <form id="profile-form" novalidate>

        <!-- Section: Basic Info -->
        <div class="form-section-title">📋 Basic Information</div>

        <div class="grid grid-2 gap-4">
          <div class="form-group">
            <label class="form-label" for="pf-name">
              ${type === 'child' ? "Child's Name" : 'Your Name'} <span class="required">*</span>
            </label>
            <input class="form-input" type="text" id="pf-name" name="name"
              placeholder="Enter name" required />
          </div>
          <div class="form-group">
            <label class="form-label" for="pf-age">Age <span class="required">*</span></label>
            <input class="form-input" type="number" id="pf-age" name="age"
              placeholder="${type === 'child' ? '3–17' : '18–80'}"
              min="${type === 'child' ? '3' : '18'}"
              max="${type === 'child' ? '17' : '90'}"
              required />
          </div>
        </div>

        <div class="grid grid-2 gap-4">
          <div class="form-group">
            <label class="form-label" for="pf-height">Height (cm) <span class="required">*</span></label>
            <input class="form-input" type="number" id="pf-height" name="height"
              placeholder="e.g., 165" min="80" max="220" required />
          </div>
          <div class="form-group">
            <label class="form-label" for="pf-weight">Weight (kg) <span class="required">*</span></label>
            <input class="form-input" type="number" id="pf-weight" name="weight"
              placeholder="e.g., 65" min="15" max="200" required />
          </div>
        </div>

        <!-- BMI Preview -->
        <div id="bmi-preview" class="alert alert--info" style="display:none;margin-bottom:var(--space-5)">
          <span class="alert__icon">📊</span>
          <div class="alert__body">
            <span id="bmi-text"></span>
            <span style="font-size:var(--text-xs);color:var(--color-text-muted);display:block;margin-top:2px;">BMI is an informational estimate only, not a medical diagnosis.</span>
          </div>
        </div>

        <!-- Section: Lifestyle -->
        <div class="form-section-title">🏃 Lifestyle</div>

        <div class="form-group">
          <label class="form-label" for="pf-activity">Activity Level <span class="required">*</span></label>
          <select class="form-select" id="pf-activity" name="activityLevel" required>
            <option value="">Select your typical activity level</option>
            <option value="sedentary">Sedentary – mostly sitting, desk job</option>
            <option value="lightly_active">Lightly Active – light exercise 1–3 days/week</option>
            <option value="moderately_active">Moderately Active – exercise 3–5 days/week</option>
            <option value="very_active">Very Active – intense exercise 6–7 days/week</option>
          </select>
        </div>

        <!-- Section: Goal -->
        <div class="form-section-title">🎯 Health Goal</div>

        <div class="form-group">
          <label class="form-label">What are your health goals? <span style="font-weight:400;font-size:var(--text-xs);color:var(--color-text-muted)">(Select all that apply)</span> <span class="required">*</span></label>
          <div class="goal-options" id="goal-options">
            ${config.goalOptions.map(g => `
              <label class="goal-option-label" for="goal-${g.value}">
                <input type="checkbox" name="goal" id="goal-${g.value}" value="${g.value}" class="goal-checkbox" />
                <span class="goal-option-btn">${g.label}</span>
              </label>
            `).join('')}
          </div>
        </div>

        <!-- Section: Diet (hide for child) -->
        ${type !== 'child' ? `
        <div class="form-section-title">🥗 Diet Preference</div>

        <div class="form-group">
          <label class="form-label" for="pf-diet">Diet Type <span class="required">*</span></label>
          <select class="form-select" id="pf-diet" name="dietPreference" required>
            <option value="">Select your diet preference</option>
            <option value="vegetarian">🥦 Vegetarian (no meat/fish, dairy & eggs OK)</option>
            <option value="vegan">🌱 Vegan (no animal products)</option>
            <option value="non-vegetarian">🍗 Non-Vegetarian (all foods)</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label" for="pf-allergies">Food Allergies / Preferences <span style="font-weight:400;color:var(--color-text-muted)">(Optional)</span></label>
          <input class="form-input" type="text" id="pf-allergies" name="allergiesRaw"
            placeholder="e.g., nuts, gluten, dairy, soy" />
          <span class="form-hint">Comma-separated. We'll exclude these from recommendations.</span>
        </div>
        ` : `
        <div class="form-section-title">🥗 Food Preferences</div>
        <div class="form-group">
          <label class="form-label" for="pf-diet">Dietary Style</label>
          <select class="form-select" id="pf-diet" name="dietPreference">
            <option value="vegetarian">🥦 Vegetarian</option>
            <option value="vegan">🌱 Vegan</option>
            <option value="non-vegetarian">🍗 Non-Vegetarian</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label" for="pf-allergies">Food Allergies</label>
          <input class="form-input" type="text" id="pf-allergies" name="allergiesRaw"
            placeholder="e.g., nuts, dairy" />
        </div>
        `}

        <!-- Women's Wellness (only for women) -->
        ${config.showWomensWellness ? `
        <div class="form-section-title">🌸 Menstrual Wellness <span style="font-weight:400;font-size:var(--text-sm);color:var(--color-text-muted)">(Optional)</span></div>

        <div class="alert alert--info" style="margin-bottom:var(--space-4)">
          <span class="alert__icon">ℹ️</span>
          <div class="alert__body">This information helps provide general wellness suggestions for each cycle phase. We do not diagnose any medical conditions. If you experience unusual symptoms, please consult a qualified healthcare professional.</div>
        </div>

        <label class="form-check" style="margin-bottom:var(--space-4)">
          <input type="checkbox" class="form-check__input" id="include-cycle" name="includeCycle" />
          <span class="form-check__label">Include menstrual cycle wellness tracking</span>
        </label>

        <div id="cycle-fields" style="display:none;">
          <div class="grid grid-2 gap-4">
            <div class="form-group">
              <label class="form-label" for="pf-last-period">Last Period Date</label>
              <input class="form-input" type="date" id="pf-last-period" name="lastPeriodDate" />
            </div>
            <div class="form-group">
              <label class="form-label" for="pf-cycle-length">Average Cycle Length (days)</label>
              <input class="form-input" type="number" id="pf-cycle-length" name="cycleLength"
                placeholder="28" min="21" max="45" value="28" />
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Current Symptoms (optional)</label>
            <div class="symptom-checkboxes" id="symptom-checkboxes">
              ${['Cramps', 'Bloating', 'Fatigue', 'Mood changes', 'Headache', 'Backache'].map(s => `
                <label class="symptom-check">
                  <input type="checkbox" name="symptoms" value="${s.toLowerCase().replace(' ','_')}" />
                  <span>${s}</span>
                </label>
              `).join('')}
            </div>
          </div>
          <div class="grid grid-2 gap-4">
            <div class="form-group">
              <label class="form-label" for="pf-mood">Current Mood</label>
              <select class="form-select" id="pf-mood" name="mood">
                <option value="">Select mood</option>
                <option value="great">😊 Great</option>
                <option value="good">🙂 Good</option>
                <option value="neutral">😐 Neutral</option>
                <option value="low">😔 Low</option>
                <option value="anxious">😟 Anxious</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label" for="pf-energy">Energy Level</label>
              <select class="form-select" id="pf-energy" name="energyLevel">
                <option value="">Select energy</option>
                <option value="high">⚡ High</option>
                <option value="moderate">🔋 Moderate</option>
                <option value="low">🪫 Low</option>
                <option value="exhausted">😴 Exhausted</option>
              </select>
            </div>
          </div>
        </div>
        ` : ''}

        <!-- Submit -->
        <div style="margin-top:var(--space-6);display:flex;gap:var(--space-4);flex-wrap:wrap;">
          <button type="submit" class="btn btn--primary btn--lg" id="save-profile-btn" style="flex:1;min-width:200px;">
            💾 Save Profile & Get Recommendations
          </button>
          <button type="button" class="btn btn--secondary btn--lg" onclick="document.getElementById('profile-form-section').innerHTML=''">
            Cancel
          </button>
        </div>

      </form>
    </div>
  `;

  wireBMIPreview();

  const includeCycle = document.getElementById('include-cycle');
  const cycleFields  = document.getElementById('cycle-fields');
  if (includeCycle && cycleFields) {
    includeCycle.addEventListener('change', () => {
      cycleFields.style.display = includeCycle.checked ? 'block' : 'none';
    });
  }

  document.querySelectorAll('.goal-checkbox').forEach(checkbox => {
    checkbox.addEventListener('change', () => {
      checkbox.nextElementSibling?.classList.toggle('selected', checkbox.checked);
    });
  });

  const profileForm = document.getElementById('profile-form');
  if (profileForm) {
    profileForm.addEventListener('submit', handleProfileSubmit);
  }

  const existingProfile = getExistingProfileOfType(type);
  if (existingProfile) {
    prepopulateForm(existingProfile);
  }
}

function wireBMIPreview() {
  const heightInput = document.getElementById('pf-height');
  const weightInput = document.getElementById('pf-weight');
  const preview     = document.getElementById('bmi-preview');
  const bmiText     = document.getElementById('bmi-text');

  function update() {
    const h = parseFloat(heightInput?.value);
    const w = parseFloat(weightInput?.value);
    if (!h || !w || h <= 0) { preview.style.display = 'none'; return; }

    const bmi = Math.round((w / Math.pow(h / 100, 2)) * 10) / 10;
    const cls = bmi < 18.5 ? 'Underweight' : bmi < 25 ? 'Healthy Weight' : bmi < 30 ? 'Overweight' : 'High BMI';

    preview.style.display = 'flex';
    bmiText.textContent = `Your estimated BMI is ${bmi} (${cls})`;

    preview.className = 'alert animate-fadeIn';
    if (bmi < 18.5 || bmi >= 25) preview.classList.add('alert--warning');
    else preview.classList.add('alert--success');
  }

  heightInput?.addEventListener('input', update);
  weightInput?.addEventListener('input', update);
}

function handleProfileSubmit(e) {
  e.preventDefault();

  const form = e.target;
  const btn  = document.getElementById('save-profile-btn');

  const name     = form.querySelector('[name="name"]')?.value.trim();
  const age      = parseInt(form.querySelector('[name="age"]')?.value);
  const height   = parseFloat(form.querySelector('[name="height"]')?.value);
  const weight   = parseFloat(form.querySelector('[name="weight"]')?.value);
  const activity = form.querySelector('[name="activityLevel"]')?.value;
  const goals    = Array.from(form.querySelectorAll('[name="goal"]:checked')).map(el => el.value);
  const diet     = form.querySelector('[name="dietPreference"]')?.value || 'vegetarian';

  if (!name)     { Toast.show('Please enter a name.', 'error'); return; }
  if (!age || isNaN(age)) { Toast.show('Please enter a valid age.', 'error'); return; }
  if (!height || height < 50) { Toast.show('Please enter a valid height.', 'error'); return; }
  if (!weight || weight < 10) { Toast.show('Please enter a valid weight.', 'error'); return; }
  if (!activity) { Toast.show('Please select an activity level.', 'error'); return; }
  if (goals.length === 0) { Toast.show('Please select at least one health goal.', 'error'); return; }
  if (selectedType !== 'child' && !diet) { Toast.show('Please select a diet preference.', 'error'); return; }

  const allergiesRaw = form.querySelector('[name="allergiesRaw"]')?.value || '';
  const allergies    = allergiesRaw.split(',').map(a => a.trim().toLowerCase()).filter(Boolean);

  let cycleData = null;
  const includeCycle = form.querySelector('[name="includeCycle"]');
  if (includeCycle?.checked) {
    const symptoms = Array.from(form.querySelectorAll('[name="symptoms"]:checked')).map(el => el.value);
    cycleData = {
      lastPeriodDate: form.querySelector('[name="lastPeriodDate"]')?.value || '',
      cycleLength:    parseInt(form.querySelector('[name="cycleLength"]')?.value) || 28,
      symptoms,
      mood:           form.querySelector('[name="mood"]')?.value || '',
      energyLevel:    form.querySelector('[name="energyLevel"]')?.value || '',
    };
  }

  const profile = {
    id:          Storage.generateId(),
    gender:      selectedType,
    name,
    age,
    height,
    weight,
    activityLevel: activity,
    goals,
    goal: goals[0],
    dietPreference: diet,
    allergies,
    cycleData,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  Storage.saveProfile(currentUser.id, profile);
  Storage.setActiveProfile(currentUser.id, profile.id);

  if (cycleData?.lastPeriodDate) {
    Storage.addCycleLog(currentUser.id, {
      startDate:   cycleData.lastPeriodDate,
      cycleLength: cycleData.cycleLength,
      symptoms:    cycleData.symptoms,
      mood:        cycleData.mood,
      energy:      cycleData.energyLevel,
    });
  }

  btn.classList.add('btn--loading');
  btn.disabled = true;

  Toast.show('Profile saved! Generating your personalized plan...', 'success');
  setTimeout(() => {
    window.location.href = 'recommendations.html';
  }, 1000);
}

function populateExistingProfiles() {
  const profiles = Storage.getProfiles(currentUser.id);
  const container = document.getElementById('existing-profiles');
  if (!container) return;

  if (profiles.length === 0) {
    container.innerHTML = `
      <div class="alert alert--info mt-4" id="no-profiles-banner">
        <span class="alert__icon">👤</span>
        <div class="alert__body">
          <div class="alert__title">No profiles yet</div>
          Select a profile type above and fill in the form to create your first wellness profile.
        </div>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="card mt-6">
      <div class="card__header">
        <h3 class="card__title">Your Profiles</h3>
        <span class="badge badge--muted">${profiles.length} profile${profiles.length > 1 ? 's' : ''}</span>
      </div>
      <div class="flex flex-col gap-3">
        ${profiles.map(p => `
          <div class="log-row" id="profile-row-${p.id}">
            <span class="log-row__icon">${p.gender === 'men' ? '👨' : p.gender === 'women' ? '👩' : '👶'}</span>
            <div style="flex:1;">
              <div class="log-row__label">${p.name}</div>
              <div style="font-size:var(--text-xs);color:var(--color-text-muted);">
                ${p.gender.charAt(0).toUpperCase() + p.gender.slice(1)} · ${p.age} yrs · ${(p.goals || [p.goal]).map(g => g.replace(/_/g, ' ')).join(', ')}
              </div>
            </div>
            <div class="flex gap-2" style="flex-shrink:0;">
              <button class="btn btn--primary btn--sm" onclick="switchToProfile('${p.id}')">Use This</button>
              <button class="btn btn--secondary btn--sm" onclick="editProfile('${p.id}')">✏️ Edit</button>
              <button class="btn btn--danger btn--sm" onclick="deleteProfile('${p.id}')">🗑 Delete</button>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function switchToProfile(profileId) {
  Storage.setActiveProfile(currentUser.id, profileId);
  Toast.show('Profile selected! Redirecting to recommendations...', 'success');
  setTimeout(() => { window.location.href = 'recommendations.html'; }, 800);
}

function editProfile(profileId) {
  const profiles = Storage.getProfiles(currentUser.id);
  const profile = profiles.find(p => p.id === profileId);
  if (!profile) return;

  const type = profile.gender;

  document.querySelectorAll('.type-card').forEach(c => c.classList.remove('selected'));
  const targetCard = document.querySelector(`.type-card[data-type="${type}"]`);
  if (targetCard) targetCard.classList.add('selected');

  selectedType = type;
  renderProfileForm(type);
  prepopulateForm(profile);

  const profileForm = document.getElementById('profile-form');
  if (profileForm) {
    profileForm.removeEventListener('submit', handleProfileSubmit);
    profileForm.addEventListener('submit', function handleUpdate(e) {
      e.preventDefault();
      profileForm.removeEventListener('submit', handleUpdate);

      const form = e.target;
      const btn = document.getElementById('save-profile-btn');

      const name     = form.querySelector('[name="name"]')?.value.trim();
      const age      = parseInt(form.querySelector('[name="age"]')?.value);
      const height   = parseFloat(form.querySelector('[name="height"]')?.value);
      const weight   = parseFloat(form.querySelector('[name="weight"]')?.value);
      const activity = form.querySelector('[name="activityLevel"]')?.value;
      const goals    = Array.from(form.querySelectorAll('[name="goal"]:checked')).map(el => el.value);
      const diet     = form.querySelector('[name="dietPreference"]')?.value || 'vegetarian';

      if (!name)     { Toast.show('Please enter a name.', 'error'); return; }
      if (!age || isNaN(age)) { Toast.show('Please enter a valid age.', 'error'); return; }
      if (!height || height < 50) { Toast.show('Please enter a valid height.', 'error'); return; }
      if (!weight || weight < 10) { Toast.show('Please enter a valid weight.', 'error'); return; }
      if (!activity) { Toast.show('Please select an activity level.', 'error'); return; }
      if (goals.length === 0) { Toast.show('Please select at least one health goal.', 'error'); return; }

      const allergiesRaw = form.querySelector('[name="allergiesRaw"]')?.value || '';
      const allergies    = allergiesRaw.split(',').map(a => a.trim().toLowerCase()).filter(Boolean);

      let cycleData = null;
      const includeCycle = form.querySelector('[name="includeCycle"]');
      if (includeCycle?.checked) {
        const symptoms = Array.from(form.querySelectorAll('[name="symptoms"]:checked')).map(el => el.value);
        cycleData = {
          lastPeriodDate: form.querySelector('[name="lastPeriodDate"]')?.value || '',
          cycleLength:    parseInt(form.querySelector('[name="cycleLength"]')?.value) || 28,
          symptoms,
          mood:           form.querySelector('[name="mood"]')?.value || '',
          energyLevel:    form.querySelector('[name="energyLevel"]')?.value || '',
        };
      }

      const updatedProfile = {
        ...profile,
        name,
        age,
        height,
        weight,
        activityLevel: activity,
        goals,
        goal: goals[0],
        dietPreference: diet,
        allergies,
        cycleData,
        updatedAt: new Date().toISOString(),
      };

      Storage.saveProfile(currentUser.id, updatedProfile);
      Storage.setActiveProfile(currentUser.id, updatedProfile.id);

      if (cycleData?.lastPeriodDate) {

        const allCycle = Storage.get('wellsync_cycle_logs', {});
        allCycle[currentUser.id] = [];
        Storage.set('wellsync_cycle_logs', allCycle);

        Storage.addCycleLog(currentUser.id, {
          startDate:   cycleData.lastPeriodDate,
          cycleLength: cycleData.cycleLength,
          symptoms:    cycleData.symptoms,
          mood:        cycleData.mood,
          energy:      cycleData.energyLevel,
        });
      } else {

        const allCycle = Storage.get('wellsync_cycle_logs', {});
        delete allCycle[currentUser.id];
        Storage.set('wellsync_cycle_logs', allCycle);
      }

      btn.classList.add('btn--loading');
      btn.disabled = true;

      Toast.show('Profile updated! Redirecting to recommendations...', 'success');
      setTimeout(() => {
        window.location.href = 'recommendations.html';
      }, 1000);
    });
  }

  const saveBtn = document.getElementById('save-profile-btn');
  if (saveBtn) saveBtn.textContent = '💾 Update Profile';

  setTimeout(() => {
    document.getElementById('profile-form-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 100);

  Toast.show('Editing profile — make your changes and click Update Profile.', 'info', 4000);
}

function deleteProfile(profileId) {
  if (!currentUser) currentUser = Auth.getCurrentUser();
  if (!currentUser) return;

  const profiles = Storage.getProfiles(currentUser.id);
  const profile  = profiles.find(p => p.id === profileId);

  Storage.deleteProfile(currentUser.id, profileId);

  if (profile && profile.gender === 'women') {
    const allCycle = Storage.get('wellsync_cycle_logs', {});
    delete allCycle[currentUser.id];
    Storage.set('wellsync_cycle_logs', allCycle);
  }

  const formSec = document.getElementById('profile-form-section');
  if (formSec) formSec.innerHTML = '';
  document.querySelectorAll('.type-card').forEach(c => c.classList.remove('selected'));
  selectedType = null;

  const remaining = Storage.getProfiles(currentUser.id);
  populateExistingProfiles();

  if (remaining.length === 0) {
    Toast.show('Profile deleted. Please create a new profile to continue.', 'info', 5000);
  } else {
    Toast.show('Profile deleted.', 'info');
  }
}

function getExistingProfileOfType(type) {
  const profiles = Storage.getProfiles(currentUser.id);
  return profiles.find(p => p.gender === type) || null;
}

function prepopulateForm(profile) {
  const set = (name, value) => {
    const el = document.querySelector(`[name="${name}"]`);
    if (el) el.value = value;
  };

  set('name', profile.name);
  set('age', profile.age);
  set('height', profile.height);
  set('weight', profile.weight);
  set('activityLevel', profile.activityLevel);
  set('dietPreference', profile.dietPreference);
  set('allergiesRaw', (profile.allergies || []).join(', '));

  const savedGoals = profile.goals || (profile.goal ? [profile.goal] : []);
  savedGoals.forEach(goalVal => {
    const checkbox = document.querySelector(`[name="goal"][value="${goalVal}"]`);
    if (checkbox) {
      checkbox.checked = true;
      checkbox.nextElementSibling?.classList.add('selected');
    }
  });

  if (profile.gender === 'women') {
    const cycleData = profile.cycleData || (() => {
      const logs = Storage.getCycleLogs(currentUser.id);
      if (logs && logs.length > 0) {
        const latest = logs[logs.length - 1];
        return {
          lastPeriodDate: latest.startDate,
          cycleLength: latest.cycleLength || 28,
          symptoms: latest.symptoms || [],
          mood: latest.mood || '',
          energyLevel: latest.energy || ''
        };
      }
      return null;
    })();

    if (cycleData && (cycleData.lastPeriodDate || cycleData.cycleLength || cycleData.mood || cycleData.energyLevel || (cycleData.symptoms && cycleData.symptoms.length > 0))) {
      const includeCycle = document.getElementById('include-cycle') || document.querySelector('[name="includeCycle"]');
      const cycleFields  = document.getElementById('cycle-fields');

      if (includeCycle) {
        includeCycle.checked = true;
      }
      if (cycleFields) {
        cycleFields.style.display = 'block';
      }

      if (cycleData.lastPeriodDate) {
        set('lastPeriodDate', cycleData.lastPeriodDate);
      }
      if (cycleData.cycleLength) {
        set('cycleLength', cycleData.cycleLength);
      }
      if (cycleData.mood) {
        set('mood', cycleData.mood);
      }
      if (cycleData.energyLevel) {
        set('energyLevel', cycleData.energyLevel);
      }

      if (Array.isArray(cycleData.symptoms)) {
        cycleData.symptoms.forEach(sym => {
          const symCheckbox = document.querySelector(`[name="symptoms"][value="${sym}"]`);
          if (symCheckbox) {
            symCheckbox.checked = true;
          }
        });
      }
    }
  }
}
