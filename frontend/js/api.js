/**
 * WellSync Centralized REST API Service
 * Handles HTTP requests, JWT token attachment, and JSON responses.
 */

'use strict';

const API = {
  // Token Management
  getToken() {
    return localStorage.getItem('wellsync_jwt_token') || null;
  },

  setToken(token) {
    if (token) {
      localStorage.setItem('wellsync_jwt_token', token);
    } else {
      localStorage.removeItem('wellsync_jwt_token');
    }
  },

  clearToken() {
    localStorage.removeItem('wellsync_jwt_token');
  },

  // Core Request Helper
  async request(endpoint, options = {}) {
    const baseUrl = window.API_CONFIG ? window.API_CONFIG.getBaseUrl() : 'http://localhost:5000/api';
    const url = `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        // If token expired/invalid, clear session
        if (response.status === 401 && !endpoint.includes('/login') && !endpoint.includes('/register')) {
          this.clearToken();
          localStorage.removeItem('wellsync_current_user');
          if (!window.location.pathname.includes('login.html') && !window.location.pathname.includes('signup.html')) {
            window.location.href = 'login.html';
          }
        }
        return {
          success: false,
          status: response.status,
          message: data.message || `Request failed (${response.status})`,
        };
      }

      return {
        success: true,
        status: response.status,
        ...data,
      };
    } catch (error) {
      console.warn(`[WellSync API Network Issue] ${url}:`, error.message);
      return {
        success: false,
        networkError: true,
        message: 'Could not connect to backend server. Make sure your server is running!',
      };
    }
  },

  // Authentication Endpoints
  auth: {
    async register(userData) {
      return API.request('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
      });
    },

    async login(credentials) {
      return API.request('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });
    },

    async getMe() {
      return API.request('/auth/me');
    },

    async updateProfile(updates) {
      return API.request('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
    },
  },

  // Family Profiles Endpoints
  profiles: {
    async getAll() {
      return API.request('/profiles');
    },

    async getById(id) {
      return API.request(`/profiles/${id}`);
    },

    async create(profileData) {
      return API.request('/profiles', {
        method: 'POST',
        body: JSON.stringify(profileData),
      });
    },

    async update(id, updates) {
      return API.request(`/profiles/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
    },

    async delete(id) {
      return API.request(`/profiles/${id}`, {
        method: 'DELETE',
      });
    },
  },

  // Daily Health Logs Endpoints
  logs: {
    async getAll(params = {}) {
      const query = new URLSearchParams(params).toString();
      return API.request(`/logs${query ? `?${query}` : ''}`);
    },

    async create(logData) {
      return API.request('/logs', {
        method: 'POST',
        body: JSON.stringify(logData),
      });
    },

    async getStats(profileId, days = 7) {
      return API.request(`/logs/stats?profileId=${profileId}&days=${days}`);
    },

    async delete(id) {
      return API.request(`/logs/${id}`, {
        method: 'DELETE',
      });
    },
  },

  // Menstrual Cycle Endpoints
  cycle: {
    async getAll(profileId) {
      const query = profileId ? `?profileId=${profileId}` : '';
      return API.request(`/cycle${query}`);
    },

    async create(cycleData) {
      return API.request('/cycle', {
        method: 'POST',
        body: JSON.stringify(cycleData),
      });
    },

    async update(id, updates) {
      return API.request(`/cycle/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
    },

    async delete(id) {
      return API.request(`/cycle/${id}`, {
        method: 'DELETE',
      });
    },
  },

  // Recommendations Endpoints
  recommendations: {
    async getFoods(goal) {
      return API.request(`/recommendations/foods${goal ? `?goal=${goal}` : ''}`);
    },

    async getExercises(goal) {
      return API.request(`/recommendations/exercises${goal ? `?goal=${goal}` : ''}`);
    },

    async getYoga() {
      return API.request('/recommendations/yoga');
    },

    async getPlan(profileMetrics) {
      return API.request('/recommendations/plan', {
        method: 'POST',
        body: JSON.stringify(profileMetrics),
      });
    },
  },
};

window.API = API;
