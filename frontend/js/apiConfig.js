/**
 * WellSync API Configuration
 * 
 * Guideline #5: "Replace the local backend URL with the deployed API URL"
 * When deploying your backend to Render/Railway:
 *   1. Paste your deployed backend URL in DEPLOYED_BACKEND_URL below.
 *   2. The application will automatically use it!
 */

const API_CONFIG = {
  // Option A: Localhost development URL
  LOCAL_URL: 'http://localhost:5000/api',

  // Option B: Your deployed backend URL on Render / Railway
  // Example: 'https://wellsync-backend.onrender.com/api'
  DEPLOYED_URL: 'https://well-sync-ra8x.onrender.com/api',

  // Automatically selects appropriate URL:
  // - If DEPLOYED_URL is specified, it prioritizes it
  // - If running on localhost or 127.0.0.1, it defaults to LOCAL_URL
  // - If served directly from the deployed backend, it uses relative '/api'
  getBaseUrl() {
    if (this.DEPLOYED_URL && this.DEPLOYED_URL.trim() !== '') {
      return this.DEPLOYED_URL.trim();
    }

    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1' || host === '') {
      return this.LOCAL_URL;
    }

    return '/api';
  },
};

window.API_CONFIG = API_CONFIG;
