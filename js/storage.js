

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
    Object.values(KEYS).forEach(key => this.remove(key));
  },

  
  getUsers() {
    return this.get(KEYS.USERS, []);
  },

  
  getUserByEmail(email) {
    const users = this.getUsers();
    return users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
  },

  
  getUserById(id) {
    const users = this.getUsers();
    return users.find(u => u.id === id) || null;
  },

  
  saveUser(user) {
    const users = this.getUsers();
    users.push(user);
    this.set(KEYS.USERS, users);
  },

  
  updateUser(id, updates) {
    const users = this.getUsers();
    const idx = users.findIndex(u => u.id === id);
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

  
  getProfiles(userId) {
    const raw = this.get(KEYS.PROFILES, null);
    if (!raw) return [];

    if (Array.isArray(raw)) {
      if (!userId) return raw;
      return raw.filter(p => !p.userId || p.userId === userId);
    }

    if (typeof raw === 'object') {
      if (userId && Array.isArray(raw[userId])) {
        return raw[userId];
      }

      const values = Object.values(raw);
      if (values.length > 0 && values.every(v => v && typeof v === 'object' && !Array.isArray(v) && v.id)) {
        if (!userId) return values;
        return values.filter(p => !p.userId || p.userId === userId);
      }
      if (userId && raw[userId]) {
        return Array.isArray(raw[userId]) ? raw[userId] : [raw[userId]];
      }
    }
    return [];
  },

  
  saveProfile(userId, profile) {
    if (!userId || !profile || !profile.id) return;
    let all = this.get(KEYS.PROFILES, null);
    if (!all || typeof all !== 'object' || Array.isArray(all)) {
      all = {};
    }
    if (!Array.isArray(all[userId])) {
      all[userId] = [];
    }
    profile.userId = userId;
    const idx = all[userId].findIndex(p => p.id === profile.id);
    if (idx !== -1) {
      all[userId][idx] = profile;
    } else {
      all[userId].push(profile);
    }
    this.set(KEYS.PROFILES, all);
  },

  
  deleteProfile(userId, profileId) {
    let targetProfileId = profileId;
    let targetUserId = userId;

    if (!targetProfileId && targetUserId) {
      targetProfileId = targetUserId;
      targetUserId = null;
    }

    if (!targetProfileId) return;

    let allProfiles = this.get(KEYS.PROFILES, null);
    if (allProfiles) {
      if (Array.isArray(allProfiles)) {
        allProfiles = allProfiles.filter(p => p && p.id !== targetProfileId && p._id !== targetProfileId);
        this.set(KEYS.PROFILES, allProfiles);
      } else if (typeof allProfiles === 'object') {
        let modified = false;
        Object.keys(allProfiles).forEach(k => {
          if (Array.isArray(allProfiles[k])) {
            const initialLen = allProfiles[k].length;
            allProfiles[k] = allProfiles[k].filter(p => p && p.id !== targetProfileId && p._id !== targetProfileId);
            if (allProfiles[k].length !== initialLen) modified = true;
          } else if (allProfiles[k] && (allProfiles[k].id === targetProfileId || k === targetProfileId)) {
            delete allProfiles[k];
            modified = true;
          }
        });
        if (modified) {
          this.set(KEYS.PROFILES, allProfiles);
        }
      }
    }

    let activeData = this.get(KEYS.ACTIVE_PROFILE, null);
    if (activeData) {
      if (typeof activeData === 'object' && !Array.isArray(activeData)) {
        let activeChanged = false;
        Object.keys(activeData).forEach(uId => {
          if (activeData[uId] === targetProfileId) {
            delete activeData[uId];
            activeChanged = true;
          }
        });
        if (activeChanged) {
          this.set(KEYS.ACTIVE_PROFILE, activeData);
        }
      } else if (typeof activeData === 'string' && activeData === targetProfileId) {
        this.remove(KEYS.ACTIVE_PROFILE);
      }
    }
    const rawActive = localStorage.getItem(KEYS.ACTIVE_PROFILE);
    if (rawActive && (rawActive === targetProfileId || rawActive === JSON.stringify(targetProfileId))) {
      this.remove(KEYS.ACTIVE_PROFILE);
    }

    try {
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.includes(targetProfileId)) {
          keysToRemove.push(k);
        }
      }
      keysToRemove.forEach(k => localStorage.removeItem(k));
    } catch (e) {
      console.error('[WellSync Storage] Error cleaning profile LocalStorage keys:', e);
    }

    try {
      const allLogs = this.get(KEYS.HEALTH_LOGS, null);
      if (allLogs && typeof allLogs === 'object') {
        let logsModified = false;
        Object.keys(allLogs).forEach(uId => {
          if (Array.isArray(allLogs[uId])) {
            const origLen = allLogs[uId].length;
            allLogs[uId] = allLogs[uId].filter(l => !l || l.profileId !== targetProfileId);
            if (allLogs[uId].length !== origLen) logsModified = true;
          }
        });
        if (logsModified) this.set(KEYS.HEALTH_LOGS, allLogs);
      }

      const allCycleLogs = this.get(KEYS.CYCLE_LOGS, null);
      if (allCycleLogs && typeof allCycleLogs === 'object') {
        let cycleModified = false;
        Object.keys(allCycleLogs).forEach(uId => {
          if (Array.isArray(allCycleLogs[uId])) {
            const origLen = allCycleLogs[uId].length;
            allCycleLogs[uId] = allCycleLogs[uId].filter(l => !l || l.profileId !== targetProfileId);
            if (allCycleLogs[uId].length !== origLen) cycleModified = true;
          }
        });
        if (cycleModified) this.set(KEYS.CYCLE_LOGS, allCycleLogs);
      }
    } catch (e) {
      console.error('[WellSync Storage] Error cleaning profile log entries:', e);
    }
  },

  
  getActiveProfileMeta(userId) {
    const all = this.get(KEYS.ACTIVE_PROFILE, {});
    return (all && all[userId]) ? { userId, profileId: all[userId] } : null;
  },

  
  getActiveProfile(userId) {
    const meta = this.getActiveProfileMeta(userId);
    if (!meta) return null;
    const profiles = this.getProfiles(userId);
    const found = profiles.find(p => p.id === meta.profileId);
    if (!found) {
      this.clearActiveProfile(userId);
      return null;
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
    if (all && typeof all === 'object' && !Array.isArray(all)) {
      delete all[userId];
      this.set(KEYS.ACTIVE_PROFILE, all);
    }
  },

  
  getLogs(userId) {
    const all = this.get(KEYS.HEALTH_LOGS, {});
    return all[userId] || [];
  },

  
  getLogsForDate(userId, date) {
    return this.getLogs(userId).filter(log => log.date === date);
  },

  
  getLogsForPastDays(userId, days) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return this.getLogs(userId).filter(log => new Date(log.date) >= cutoff);
  },

  
  addLog(userId, log) {
    const all = this.get(KEYS.HEALTH_LOGS, {});
    if (!all[userId]) all[userId] = [];
    all[userId].push({
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      ...log,
      createdAt: new Date().toISOString(),
    });
    this.set(KEYS.HEALTH_LOGS, all);
  },

  
  removeLog(userId, logId) {
    const all = this.get(KEYS.HEALTH_LOGS, {});
    if (all[userId]) {
      all[userId] = all[userId].filter(l => l.id !== logId);
      this.set(KEYS.HEALTH_LOGS, all);
    }
  },

  
  getCycleLogs(userId) {
    const all = this.get(KEYS.CYCLE_LOGS, {});
    return all[userId] || [];
  },

  
  addCycleLog(userId, log) {
    const all = this.get(KEYS.CYCLE_LOGS, {});
    if (!all[userId]) all[userId] = [];
    all[userId].push({
      id: `cycle_${Date.now()}`,
      ...log,
      recordedAt: new Date().toISOString(),
    });
    this.set(KEYS.CYCLE_LOGS, all);
  },

  
  updateCycleLog(userId, logId, updates) {
    const all = this.get(KEYS.CYCLE_LOGS, {});
    if (!all[userId]) return;
    const idx = all[userId].findIndex(l => l.id === logId);
    if (idx !== -1) {
      all[userId][idx] = { ...all[userId][idx], ...updates };
      this.set(KEYS.CYCLE_LOGS, all);
    }
  },

  
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
    return new Date().toISOString().split('T')[0];
  },
};

window.Storage = Storage;
window.STORAGE_KEYS = KEYS;
