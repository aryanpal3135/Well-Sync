

'use strict';

function simpleHash(str) {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
    hash = hash & hash;
  }
  return hash.toString(16);
}

const Validators = {
  isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
  },

  isValidPassword(password) {
    return password && password.length >= 6;
  },

  sanitize(str) {
    return String(str).trim();
  },
};

const Auth = {

  
  register(data) {
    const name     = Validators.sanitize(data.name);
    const email    = Validators.sanitize(data.email);
    const password = data.password || '';
    const confirm  = data.confirmPassword || '';

    if (!name)  return { success: false, message: 'Full name is required.' };
    if (!email) return { success: false, message: 'Email address is required.' };
    if (!Validators.isValidEmail(email)) {
      return { success: false, message: 'Please enter a valid email address.' };
    }
    if (!password) return { success: false, message: 'Password is required.' };
    if (!Validators.isValidPassword(password)) {
      return { success: false, message: 'Password must be at least 6 characters.' };
    }
    if (password !== confirm) {
      return { success: false, message: 'Passwords do not match.' };
    }

    if (Storage.getUserByEmail(email)) {
      return { success: false, message: 'An account with this email already exists.' };
    }

    const user = {
      id:        Storage.generateId(),
      name,
      email:     email.toLowerCase(),
      password:  simpleHash(password),
      createdAt: new Date().toISOString(),
    };

    Storage.saveUser(user);

    return { success: true, message: 'Account created successfully! Please log in to continue.', user };
  },

  
  login(data) {
    const email    = Validators.sanitize(data.email).toLowerCase();
    const password = data.password || '';

    if (!email)    return { success: false, message: 'Email address is required.' };
    if (!password) return { success: false, message: 'Password is required.' };

    const user = Storage.getUserByEmail(email);

    if (!user) {
      return { success: false, message: 'No account found with this email.' };
    }

    if (user.password !== simpleHash(password)) {
      return { success: false, message: 'Incorrect password. Please try again.' };
    }

    Storage.setCurrentUser({ id: user.id, email: user.email });

    return { success: true, message: `Welcome back, ${user.name}!`, user };
  },

  
  logout() {
    Storage.clearCurrentUser();
    window.location.href = 'index.html';
  },

  
  getCurrentUser() {
    const session = Storage.getCurrentUser();
    if (!session) return null;
    return Storage.getUserById(session.id);
  },

  
  isLoggedIn() {
    return !!Storage.getCurrentUser();
  },

  
  requireAuth() {
    if (!this.isLoggedIn()) {
      window.location.href = 'index.html';
    }
  },

  
  redirectIfLoggedIn() {
    if (this.isLoggedIn()) {
      window.location.href = 'dashboard.html';
    }
  },
};

const Toast = {
  show(message, type = 'info', duration = 3500) {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    const icons = { success: '✓', error: '✕', info: 'ℹ', warning: '⚠' };
    toast.className = `toast toast--${type}`;
    toast.innerHTML = `<span>${icons[type] || 'ℹ'}</span><span>${message}</span>`;

    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  },
};

const ThemeManager = {
  init() {
    document.documentElement.setAttribute('data-theme', 'light');
  },

  toggle() {},
};

const NavbarUtils = {
  init() {
    ThemeManager.init();

    document.querySelectorAll('.navbar__theme-btn').forEach(btn => {
      btn.addEventListener('click', () => ThemeManager.toggle());
    });

    const burger = document.querySelector('.navbar__burger');
    const drawer = document.querySelector('.navbar__mobile-drawer');

    if (burger && drawer) {
      burger.addEventListener('click', () => {
        const isOpen = burger.classList.toggle('open');
        drawer.classList.toggle('open', isOpen);
      });

      document.addEventListener('click', (e) => {
        if (!burger.contains(e.target) && !drawer.contains(e.target)) {
          burger.classList.remove('open');
          drawer.classList.remove('open');
        }
      });
    }

    const path = window.location.pathname.split('/').pop();
    document.querySelectorAll('.navbar__link').forEach(link => {
      const href = link.getAttribute('href');
      if (href && (href === path || href.includes(path))) {
        link.classList.add('active');
      }
    });

    document.querySelectorAll('[data-action="logout"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        Auth.logout();
      });
    });

    try {
      const session = Storage.getCurrentUser();
      if (session) {
        const profile = Storage.getActiveProfile(session.id);
        if (profile && profile.gender === 'women' && profile.cycleData?.lastPeriodDate) {
          document.getElementById('cycle-nav-link')?.style.removeProperty('display');
          document.getElementById('cycle-nav-link-mobile')?.style.removeProperty('display');
        }
      }
    } catch (_) {}
  },
};

const FormHelpers = {
  
  setError(input, message) {
    input.classList.add('form-input--error');
    const group = input.closest('.form-group');
    if (group) {
      const existing = group.querySelector('.form-error');
      if (existing) existing.remove();
      const err = document.createElement('span');
      err.className = 'form-error';
      err.innerHTML = `⚠ ${message}`;
      group.appendChild(err);
    }
  },

  
  clearError(input) {
    input.classList.remove('form-input--error');
    const group = input.closest('.form-group');
    if (group) {
      const existing = group.querySelector('.form-error');
      if (existing) existing.remove();
    }
  },

  
  clearAllErrors(form) {
    form.querySelectorAll('.form-input--error').forEach(el => {
      el.classList.remove('form-input--error');
    });
    form.querySelectorAll('.form-error').forEach(el => el.remove());
  },

  
  serialize(form) {
    const data = {};
    new FormData(form).forEach((value, key) => {
      data[key] = value;
    });
    return data;
  },
};

document.addEventListener('DOMContentLoaded', () => {
  NavbarUtils.init();
});

window.Auth = Auth;
window.Toast = Toast;
window.ThemeManager = ThemeManager;
window.NavbarUtils = NavbarUtils;
window.FormHelpers = FormHelpers;
