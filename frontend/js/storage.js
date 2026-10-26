'use strict';

const KEYS = Object.freeze({
  USERS:          'wellsync_users',
  CURRENT_USER:   'wellsync_current_user',
  PROFILES:       'wellsync_profiles',
  ACTIVE_PROFILE: 'wellsync_active_profile',
  HEALTH_LOGS:    'wellsync_health_logs',
  CYCLE_LOGS:     'wellsync_cycle_logs',
  PREFERENCES:    'wellsync_preferences',
});

const Storage = {
  get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(key);
      return raw !== null ? JSON.parse(raw) : fallback;
    } catch (e) {
      console.error(`[WellSync Storage] Failed to read key "${key}":`, e);
      return fallback;
    }
  },

  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error(`[WellSync Storage] Failed to write key "${key}":`, e);
    }
  },

  remove(key) {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.error(`[WellSync Storage] Failed to remove key "${key}":`, e);
    }
  },

  clearAll() {
    Object.values(KEYS).forEach((key) => this.remove(key));
  },

  getUsers() {
    return this.get(KEYS.USERS, []);
  },

  getUserByEmail(email) {
    const users = this.getUsers();
    return users.find((u) => u.email && u.email.toLowerCase() === email.toLowerCase()) || null;
  },

  getUserById(id) {
    const users = this.getUsers();
    return users.find((u) => u.id === id || u._id === id) || null;
  },

  saveUser(user) {
    const users = this.getUsers();
    const existingIndex = users.findIndex(
      (u) => (u.id && u.id === user.id) || (u.email && u.email.toLowerCase() === user.email.toLowerCase())
    );
    if (existingIndex !== -1) {
      users[existingIndex] = { ...users[existingIndex], ...user };
    } else {
      users.push(user);
    }
    this.set(KEYS.USERS, users);
  },

  updateUser(id, updates) {
    const users = this.getUsers();
    const idx = users.findIndex((u) => u.id === id || u._id === id);
    if (idx !== -1) {
      users[idx] = { ...users[idx], ...updates };
      this.set(KEYS.USERS, users);
    }
  },

  getCurrentUser() {
    return this.get(KEYS.CURRENT_USER, null);
  },

  setCurrentUser(session) {
    this.set(KEYS.CURRENT_USER, session);
  },

  clearCurrentUser() {
    this.remove(KEYS.CURRENT_USER);
  },

  // ---------------- PROFILES ----------------
  getProfiles(userId) {
    const raw = this.get(KEYS.PROFILES, null);
    if (!raw) return [];

    if (Array.isArray(raw)) {
      if (!userId) return raw;
      return raw.filter((p) => !p.userId || p.userId === userId);
    }

    if (typeof raw === 'object') {
      if (userId && Array.isArray(raw[userId])) {
        return raw[userId];
      }
      const values = Object.values(raw);
      if (values.length > 0 && values.every((v) => v && typeof v === 'object' && !Array.isArray(v))) {
        if (!userId) return values;
        return values.filter((p) => !p.userId || p.userId === userId);
      }
    }
    return [];
  },

  getProfileById(userId, profileId) {
    if (!profileId) return null;
    const profiles = this.getProfiles(userId);
    const pid = String(profileId);
    return profiles.find((p) => String(p.id) === pid || String(p._id) === pid) || null;
  },

  async saveProfile(userId, profile) {
    if (!userId || !profile) return;
    if (!profile.id) profile.id = profile._id || this.generateId();

    let all = this.get(KEYS.PROFILES, null);
    if (!all || typeof all !== 'object' || Array.isArray(all)) {
      all = {};
    }
    if (!Array.isArray(all[userId])) {
      all[userId] = [];
    }

    profile.userId = userId;
    const idx = all[userId].findIndex((p) => p.id === profile.id || (profile._id && p._id === profile._id));
    if (idx !== -1) {
      all[userId][idx] = { ...all[userId][idx], ...profile };
    } else {
      all[userId].push(profile);
    }
    this.set(KEYS.PROFILES, all);

    // Synchronize with MongoDB Atlas via REST API
    if (window.API && window.API.profiles) {
      const apiPayload = {
        name: profile.name,
        relation: profile.relation || 'self',
        age: Number(profile.age),
        gender: profile.gender || 'men',
        height: Number(profile.height),
        weight: Number(profile.weight),
        activityLevel: profile.activityLevel || 'sedentary',
        goal: profile.goal || (Array.isArray(profile.goals) ? profile.goals[0] : 'general_wellness'),
        goals: profile.goals || (profile.goal ? [profile.goal] : []),
        dietaryPreference: profile.dietPreference || profile.dietaryPreference || 'vegetarian',
        allergies: profile.allergies || [],
        cycleData: profile.cycleData || null,
        isPrimary: !!profile.isPrimary,
      };

      try {
        let res;
        if (profile._id && profile._id.length === 24) {
          res = await window.API.profiles.update(profile._id, apiPayload);
        } else {
          res = await window.API.profiles.create(apiPayload);
          if (res && res.success && res.data && res.data._id) {
            profile._id = res.data._id;
            profile.id = res.data._id;
            // update in cache
            all = this.get(KEYS.PROFILES, {});
            if (all[userId]) {
              const pIdx = all[userId].findIndex((p) => p.name === profile.name);
              if (pIdx !== -1) {
                all[userId][pIdx] = { ...all[userId][pIdx], _id: res.data._id, id: res.data._id };
                this.set(KEYS.PROFILES, all);
              }
            }
          }
        }
        return res;
      } catch (err) {
        console.warn('[WellSync Storage] Error saving profile to MongoDB:', err);
      }
    }
  },

  deleteProfile(userId, profileId) {
    let targetProfileId = profileId;
    if (!targetProfileId) return;

    let allProfiles = this.get(KEYS.PROFILES, null);
    if (allProfiles && typeof allProfiles === 'object' && allProfiles[userId]) {
      allProfiles[userId] = allProfiles[userId].filter(
        (p) => p.id !== targetProfileId && p._id !== targetProfileId
      );
      this.set(KEYS.PROFILES, allProfiles);
    }

    let activeData = this.get(KEYS.ACTIVE_PROFILE, {});
    if (activeData && activeData[userId] === targetProfileId) {
      delete activeData[userId];
      this.set(KEYS.ACTIVE_PROFILE, activeData);
    }

    // Remote sync
    if (window.API && window.API.profiles && targetProfileId.length === 24) {
      window.API.profiles.delete(targetProfileId).catch(console.warn);
    }
  },

  getActiveProfileMeta(userId) {
    const all = this.get(KEYS.ACTIVE_PROFILE, {});
    return all && all[userId] ? { userId, profileId: all[userId] } : null;
  },

  getActiveProfile(userId) {
    const meta = this.getActiveProfileMeta(userId);
    const profiles = this.getProfiles(userId);
    if (profiles.length === 0) return null;

    if (!meta) {
      // Default to primary or first profile if not set
      const first = profiles.find((p) => p.isPrimary) || profiles[0];
      this.setActiveProfile(userId, first._id || first.id);
      return first;
    }

    let found = profiles.find((p) => p.id === meta.profileId || p._id === meta.profileId);
    if (!found) {
      found = profiles.find((p) => p.isPrimary) || profiles[0];
      if (found) {
        this.setActiveProfile(userId, found._id || found.id);
      }
      return found;
    }

    // Auto-heal if found has MongoDB _id but activeProfile is still pointing to legacy local id
    if (found._id && /^[0-9a-fA-F]{24}$/.test(String(found._id)) && meta.profileId !== String(found._id)) {
      this.setActiveProfile(userId, String(found._id));
    }

    return found;
  },

  setActiveProfile(userId, profileId) {
    const all = this.get(KEYS.ACTIVE_PROFILE, {});
    all[userId] = profileId;
    this.set(KEYS.ACTIVE_PROFILE, all);
  },

  clearActiveProfile(userId) {
    const all = this.get(KEYS.ACTIVE_PROFILE, {});
    if (all && typeof all === 'object') {
      delete all[userId];
      this.set(KEYS.ACTIVE_PROFILE, all);
    }
  },

  // Synchronize profiles from MongoDB Atlas into local storage
  async syncProfilesFromBackend(userId) {
    if (!window.API || !window.API.profiles) return;
    try {
      const res = await window.API.profiles.getAll();
      if (res && res.success && Array.isArray(res.data)) {
        const mapped = res.data.map((p) => ({
          id: p._id,
          _id: p._id,
          userId: userId || p.userId,
          name: p.name,
          relation: p.relation,
          age: p.age,
          gender: p.gender,
          height: p.height,
          weight: p.weight,
          bmi: p.bmi,
          activityLevel: p.activityLevel,
          goal: p.goal,
          goals: p.goals && p.goals.length ? p.goals : [p.goal],
          dietPreference: p.dietaryPreference,
          dietaryPreference: p.dietaryPreference,
          allergies: p.allergies || [],
          cycleData: p.cycleData || null,
          isPrimary: p.isPrimary,
          createdAt: p.createdAt,
        }));

        let all = this.get(KEYS.PROFILES, {});
        if (!all || typeof all !== 'object' || Array.isArray(all)) all = {};
        all[userId] = mapped;
        this.set(KEYS.PROFILES, all);

        if (mapped.length > 0 && !this.getActiveProfile(userId)) {
          const primary = mapped.find((p) => p.isPrimary) || mapped[0];
          this.setActiveProfile(userId, primary.id);
        }

        // Sync health logs and cycle logs for each profile from the backend
        await this._syncLogsFromBackend(userId, mapped);

        return mapped;
      }
    } catch (e) {
      console.warn('[WellSync Storage] Sync profiles warning:', e.message);
    }
  },

  // Internal: pull health logs + cycle logs per profile and cache locally
  async _syncLogsFromBackend(userId, profiles) {
    if (!window.API) return;
    try {
      // Sync health logs
      if (window.API.logs) {
        const logsRes = await window.API.logs.getAll({ days: 30 });
        if (logsRes && logsRes.success && Array.isArray(logsRes.data)) {
          const allHealth = this.get(KEYS.HEALTH_LOGS, {});
          // Build a profileId -> profileLocalId map
          const pidMap = {};
          profiles.forEach((p) => { pidMap[p._id] = p.id || p._id; });

          // Convert API format (waterIntake/sleepHours/...) → frontend format (type/value)
          const converted = [];
          logsRes.data.forEach((log) => {
            const profileId = log.profileId || '';
            if (log.waterIntake)    converted.push({ id: `${log._id}_w`, _id: log._id, profileId, date: log.date, type: 'water',    value: log.waterIntake,    unit: 'ml',      createdAt: log.createdAt });
            if (log.sleepHours)     converted.push({ id: `${log._id}_s`, _id: log._id, profileId, date: log.date, type: 'sleep',    value: log.sleepHours,     unit: 'hours',   createdAt: log.createdAt });
            if (log.workoutMinutes) converted.push({ id: `${log._id}_e`, _id: log._id, profileId, date: log.date, type: 'exercise', value: log.workoutMinutes, unit: 'minutes', createdAt: log.createdAt });
            if (log.caloriesBurned) converted.push({ id: `${log._id}_c`, _id: log._id, profileId, date: log.date, type: 'meal',     value: log.caloriesBurned, unit: 'count',   createdAt: log.createdAt });
          });

          allHealth[userId] = converted;
          this.set(KEYS.HEALTH_LOGS, allHealth);
        }
      }

      // Sync cycle logs
      if (window.API.cycle) {
        const cycleRes = await window.API.cycle.getAll();
        if (cycleRes && cycleRes.success && Array.isArray(cycleRes.data)) {
          const allCycle = this.get(KEYS.CYCLE_LOGS, {});
          const converted = cycleRes.data.map((log) => ({
            id: log._id,
            _id: log._id,
            profileId: log.profileId || '',
            startDate: log.startDate,
            cycleLength: log.cycleLength,
            periodLength: log.periodLength,
            flow: log.flow,
            symptoms: log.symptoms || [],
            notes: log.notes || '',
            recordedAt: log.createdAt,
          }));
          allCycle[userId] = converted;
          this.set(KEYS.CYCLE_LOGS, allCycle);
        }
      }
    } catch (e) {
      console.warn('[WellSync Storage] Sync logs warning:', e.message);
    }
  },

  // ---------------- HEALTH LOGS ----------------

  // Returns logs for a specific userId, optionally filtered by profileId
  getLogs(userId, profileId) {
    const all = this.get(KEYS.HEALTH_LOGS, {});
    const userLogs = all[userId] || [];
    if (!profileId) return userLogs;

    // Build set of all acceptable profile identifiers (local id, Mongo _id, etc.)
    const prof = this.getProfileById(userId, profileId);
    const targetIds = new Set();
    targetIds.add(String(profileId));
    if (prof) {
      if (prof._id) targetIds.add(String(prof._id));
      if (prof.id) targetIds.add(String(prof.id));
    }

    return userLogs.filter((log) => {
      if (!log.profileId) return true; // match legacy untagged logs
      return targetIds.has(String(log.profileId));
    });
  },

  getLogsForDate(userId, date, profileId) {
    return this.getLogs(userId, profileId).filter((log) => log.date === date);
  },

  getLogsForPastDays(userId, days, profileId) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return this.getLogs(userId, profileId).filter((log) => new Date(log.date) >= cutoff);
  },

  async addLog(userId, log) {
    const all = this.get(KEYS.HEALTH_LOGS, {});
    if (!all[userId]) all[userId] = [];

    let activeProf = this.getActiveProfile(userId);
    let profileId = (activeProf && (activeProf._id || activeProf.id)) || null;

    const newLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      profileId,       // ← tag each log with the active profile
      ...log,
      createdAt: new Date().toISOString(),
    };
    all[userId].push(newLog);
    this.set(KEYS.HEALTH_LOGS, all);

    // Sync to MongoDB backend — calculate cumulative daily total for this profile & date
    if (window.API && window.API.logs) {
      let mongoProfileId = null;
      if (activeProf && activeProf._id && /^[0-9a-fA-F]{24}$/.test(String(activeProf._id))) {
        mongoProfileId = String(activeProf._id);
      } else if (activeProf && activeProf.id && /^[0-9a-fA-F]{24}$/.test(String(activeProf.id))) {
        mongoProfileId = String(activeProf.id);
      }

      // If no valid 24-char ObjectId is found, attempt to sync profiles from backend
      if (!mongoProfileId && typeof this.syncProfilesFromBackend === 'function') {
        try {
          await this.syncProfilesFromBackend(userId);
          activeProf = this.getActiveProfile(userId);
          if (activeProf && activeProf._id && /^[0-9a-fA-F]{24}$/.test(String(activeProf._id))) {
            mongoProfileId = String(activeProf._id);
          } else if (activeProf && activeProf.id && /^[0-9a-fA-F]{24}$/.test(String(activeProf.id))) {
            mongoProfileId = String(activeProf.id);
          }
        } catch (e) {
          console.warn('[WellSync] Could not resolve MongoDB profile ID:', e);
        }
      }

      if (mongoProfileId) {
        const logDate = log.date || this.today();
        const todayLogs = this.getLogsForDate(userId, logDate, profileId);

        const totalWater = todayLogs
          .filter((l) => l.type === 'water')
          .reduce((sum, l) => sum + Number(l.value || 0), 0);

        const latestSleep = todayLogs
          .filter((l) => l.type === 'sleep')
          .slice(-1)[0]?.value;

        const totalWorkout = todayLogs
          .filter((l) => l.type === 'exercise' || l.type === 'yoga')
          .reduce((sum, l) => sum + Number(l.value || 0), 0);

        const apiPayload = {
          profileId: mongoProfileId,
          date: logDate,
          waterIntake:    totalWater > 0 ? totalWater : (log.type === 'water' ? Number(log.value) : undefined),
          sleepHours:     latestSleep !== undefined ? Number(latestSleep) : (log.type === 'sleep' ? Number(log.value) : undefined),
          workoutMinutes: totalWorkout > 0 ? totalWorkout : ((log.type === 'exercise' || log.type === 'yoga') ? Number(log.value) : undefined),
          mood:           log.type === 'mood' ? log.value : undefined,
          notes:          log.note || log.notes || undefined,
        };
        // Remove undefined keys before sending
        Object.keys(apiPayload).forEach((k) => apiPayload[k] === undefined && delete apiPayload[k]);
        try {
          const res = await window.API.logs.create(apiPayload);
          if (res && res.success) {
            console.log('[WellSync] Log saved to MongoDB Atlas:', res.data);
            if (window.Toast) {
              window.Toast.show('Saved to MongoDB Atlas! ☁️', 'success', 3000);
            }
          } else {
            console.warn('[WellSync Log Sync Warning]:', res?.message);
            if (res && res.message && window.Toast) {
              window.Toast.show(`MongoDB notice: ${res.message}`, 'warning', 5000);
            }
          }
        } catch (err) {
          console.warn('[WellSync Log Sync Error]:', err);
        }
      } else {
        console.warn('[WellSync] Profile not found in MongoDB. Ensure backend is running.');
        if (window.Toast) {
          window.Toast.show('Profile not linked to MongoDB. Is your server running?', 'warning', 5000);
        }
      }
    }
  },

  // Synchronize today's accumulated health metrics to MongoDB
  async syncTodayLogsToBackend(userId) {
    if (!window.API || !window.API.logs) return;
    let activeProf = this.getActiveProfile(userId);
    if (!activeProf) return;

    let mongoProfileId = null;
    if (activeProf._id && /^[0-9a-fA-F]{24}$/.test(String(activeProf._id))) {
      mongoProfileId = String(activeProf._id);
    } else if (activeProf.id && /^[0-9a-fA-F]{24}$/.test(String(activeProf.id))) {
      mongoProfileId = String(activeProf.id);
    }

    if (!mongoProfileId && typeof this.syncProfilesFromBackend === 'function') {
      try {
        await this.syncProfilesFromBackend(userId);
        activeProf = this.getActiveProfile(userId);
        if (activeProf && activeProf._id && /^[0-9a-fA-F]{24}$/.test(String(activeProf._id))) {
          mongoProfileId = String(activeProf._id);
        } else if (activeProf && activeProf.id && /^[0-9a-fA-F]{24}$/.test(String(activeProf.id))) {
          mongoProfileId = String(activeProf.id);
        }
      } catch (e) {
        console.warn('[WellSync] Could not resolve MongoDB profile ID in syncTodayLogs:', e);
      }
    }

    if (!mongoProfileId) return;

    const logDate = this.today();
    const todayLogs = this.getLogsForDate(userId, logDate, activeProf._id || activeProf.id);
    if (todayLogs.length === 0) return;

    const totalWater = todayLogs
      .filter((l) => l.type === 'water')
      .reduce((sum, l) => sum + Number(l.value || 0), 0);

    const latestSleep = todayLogs
      .filter((l) => l.type === 'sleep')
      .slice(-1)[0]?.value;

    const totalWorkout = todayLogs
      .filter((l) => l.type === 'exercise' || l.type === 'yoga')
      .reduce((sum, l) => sum + Number(l.value || 0), 0);

    const apiPayload = {
      profileId: mongoProfileId,
      date: logDate,
      waterIntake:    totalWater > 0 ? totalWater : undefined,
      sleepHours:     latestSleep !== undefined ? Number(latestSleep) : undefined,
      workoutMinutes: totalWorkout > 0 ? totalWorkout : undefined,
    };
    Object.keys(apiPayload).forEach((k) => apiPayload[k] === undefined && delete apiPayload[k]);
    return await window.API.logs.create(apiPayload);
  },

  removeLog(userId, logId) {
    const all = this.get(KEYS.HEALTH_LOGS, {});
    if (all[userId]) {
      all[userId] = all[userId].filter((l) => l.id !== logId && l._id !== logId);
      this.set(KEYS.HEALTH_LOGS, all);
    }
  },

  // ---------------- CYCLE LOGS ----------------

  // Returns cycle logs for a userId, filtered by profileId when provided
  getCycleLogs(userId, profileId) {
    const all = this.get(KEYS.CYCLE_LOGS, {});
    const userLogs = all[userId] || [];
    if (!profileId) return userLogs;

    const prof = this.getProfileById(userId, profileId);
    const targetIds = new Set();
    targetIds.add(String(profileId));
    if (prof) {
      if (prof._id) targetIds.add(String(prof._id));
      if (prof.id) targetIds.add(String(prof.id));
    }

    return userLogs.filter((log) => {
      if (!log.profileId) return true;
      return targetIds.has(String(log.profileId));
    });
  },

  async addCycleLog(userId, log) {
    const all = this.get(KEYS.CYCLE_LOGS, {});
    if (!all[userId]) all[userId] = [];

    let activeProf = this.getActiveProfile(userId);
    const profileId = (activeProf && (activeProf._id || activeProf.id)) || null;

    const newCycle = {
      id: `cycle_${Date.now()}`,
      profileId,       // ← tag each cycle log with the active profile
      ...log,
      recordedAt: new Date().toISOString(),
    };
    all[userId].push(newCycle);
    this.set(KEYS.CYCLE_LOGS, all);

    // Sync to MongoDB backend
    if (window.API && window.API.cycle) {
      let mongoProfileId = null;
      if (activeProf && activeProf._id && /^[0-9a-fA-F]{24}$/.test(String(activeProf._id))) {
        mongoProfileId = String(activeProf._id);
      } else if (activeProf && activeProf.id && /^[0-9a-fA-F]{24}$/.test(String(activeProf.id))) {
        mongoProfileId = String(activeProf.id);
      }

      if (!mongoProfileId && typeof this.syncProfilesFromBackend === 'function') {
        try {
          await this.syncProfilesFromBackend(userId);
          activeProf = this.getActiveProfile(userId);
          if (activeProf && activeProf._id && /^[0-9a-fA-F]{24}$/.test(String(activeProf._id))) {
            mongoProfileId = String(activeProf._id);
          } else if (activeProf && activeProf.id && /^[0-9a-fA-F]{24}$/.test(String(activeProf.id))) {
            mongoProfileId = String(activeProf.id);
          }
        } catch (e) {
          console.warn('[WellSync] Could not resolve MongoDB profile ID for cycle log:', e);
        }
      }

      if (mongoProfileId) {
        try {
          const res = await window.API.cycle.create({
            profileId: mongoProfileId,
            startDate: log.startDate,
            cycleLength: log.cycleLength,
            periodLength: log.periodLength,
            flow: log.flow,
            symptoms: log.symptoms,
            notes: log.notes,
          });
          if (res && res.success) {
            console.log('[WellSync] Cycle log saved to MongoDB Atlas:', res.data);
            if (window.Toast) {
              window.Toast.show('Saved cycle log to MongoDB Atlas! 🌸', 'success', 3000);
            }
          } else {
            console.warn('[WellSync Cycle Sync Warning]:', res?.message);
            if (res && res.message && window.Toast) {
              window.Toast.show(`MongoDB notice: ${res.message}`, 'warning', 5000);
            }
          }
        } catch (err) {
          console.warn('[WellSync Cycle Sync Error]:', err);
        }
      } else {
        console.warn('[WellSync] Profile not found in MongoDB. Ensure backend is running.');
        if (window.Toast) {
          window.Toast.show('Profile not linked to MongoDB. Is your server running?', 'warning', 5000);
        }
      }
    }
  },

  updateCycleLog(userId, logId, updates) {
    const all = this.get(KEYS.CYCLE_LOGS, {});
    if (!all[userId]) return;
    const idx = all[userId].findIndex((l) => l.id === logId);
    if (idx !== -1) {
      all[userId][idx] = { ...all[userId][idx], ...updates };
      this.set(KEYS.CYCLE_LOGS, all);
    }
  },

  // ---------------- PREFERENCES & UTILS ----------------
  getPreferences(userId) {
    const all = this.get(KEYS.PREFERENCES, {});
    return all[userId] || { theme: 'light', notifications: true };
  },

  savePreferences(userId, prefs) {
    const all = this.get(KEYS.PREFERENCES, {});
    all[userId] = { ...(all[userId] || {}), ...prefs };
    this.set(KEYS.PREFERENCES, all);
  },

  generateId() {
    return `${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 8)}`;
  },

  today() {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },
};

window.Storage = Storage;
window.STORAGE_KEYS = KEYS;
