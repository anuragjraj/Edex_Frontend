/**
 * BrainSpark AI — Frontend API Client
 *
 * Drop this file into your React project as:
 *   src/lib/api.js
 *
 * In your .env (Vite) add:
 *   VITE_API_URL=https://your-backend.railway.app
 *
 * Then replace all fetch("https://api.anthropic.com/...") calls
 * with the functions below.
 */

// ════════════════════════════════════════════════════════════════
//  Config
// ════════════════════════════════════════════════════════════════
const API_BASE = import.meta.env?.VITE_API_URL
  || process.env?.REACT_APP_API_URL
  || 'http://localhost:5000';

const TOKEN_KEY = 'brainspark_token';
const USER_KEY  = 'brainspark_user';

// ════════════════════════════════════════════════════════════════
//  Token storage
// ════════════════════════════════════════════════════════════════
export function getToken()             { return localStorage.getItem(TOKEN_KEY); }
export function setToken(token)        { localStorage.setItem(TOKEN_KEY, token); }
export function removeToken()          { localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(USER_KEY); }
export function getCachedUser()        { try { return JSON.parse(localStorage.getItem(USER_KEY)); } catch { return null; } }
export function setCachedUser(user)    { localStorage.setItem(USER_KEY, JSON.stringify(user)); }
export function isAuthenticated()      { return !!getToken(); }

// ════════════════════════════════════════════════════════════════
//  Core fetch wrapper
// ════════════════════════════════════════════════════════════════
async function apiFetch(path, options = {}) {
  const token = getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    // If token expired, clear auth
    if (res.status === 401) { removeToken(); }
    throw new Error(data.error || `Request failed (${res.status})`);
  }

  return data;
}

// ════════════════════════════════════════════════════════════════
//  Auth API
// ════════════════════════════════════════════════════════════════
export const auth = {
  // Register with email
  async register(name, email, password) {
    const data = await apiFetch('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
    setToken(data.token);
    setCachedUser(data.user);
    return data;
  },

  // Sign in with email
  async login(email, password) {
    const data = await apiFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setToken(data.token);
    setCachedUser(data.user);
    return data;
  },

  // Google Sign-In
  // Pass the credential (ID token) from Google's response
  async googleLogin(idToken) {
    const data = await apiFetch('/api/auth/google', {
      method: 'POST',
      body: JSON.stringify({ idToken }),
    });
    setToken(data.token);
    setCachedUser(data.user);
    return data;
  },

  // Microsoft Sign-In
  // Pass the accessToken from MSAL
  async microsoftLogin(accessToken) {
    const data = await apiFetch('/api/auth/microsoft', {
      method: 'POST',
      body: JSON.stringify({ accessToken }),
    });
    setToken(data.token);
    setCachedUser(data.user);
    return data;
  },

  // School login
  async schoolLogin(schoolCode, rollNumber, password, role = 'student') {
    const data = await apiFetch('/api/auth/school', {
      method: 'POST',
      body: JSON.stringify({ schoolCode, rollNumber, password, role }),
    });
    setToken(data.token);
    setCachedUser(data.user);
    return data;
  },

  // Verify stored token and refresh user data
  async verifyToken() {
    try {
      const user = await apiFetch('/api/auth/me');
      setCachedUser(user);
      return user;
    } catch {
      removeToken();
      return null;
    }
  },

  // Sign out
  logout() {
    removeToken();
  },
};

// ════════════════════════════════════════════════════════════════
//  User / Profile API
// ════════════════════════════════════════════════════════════════
export const userApi = {
  getProfile: () => apiFetch('/api/user/profile'),

  updateProfile: (data) => apiFetch('/api/user/profile', {
    method: 'PUT',
    body: JSON.stringify(data),
  }),

  changePassword: (currentPassword, newPassword) => apiFetch('/api/user/password', {
    method: 'PUT',
    body: JSON.stringify({ currentPassword, newPassword }),
  }),

  getStats: () => apiFetch('/api/user/stats'),

  // Saved notes
  getNotes:    ()               => apiFetch('/api/user/notes'),
  getNote:     (id)             => apiFetch(`/api/user/notes/${id}`),
  saveNote:    (data)           => apiFetch('/api/user/notes', { method: 'POST', body: JSON.stringify(data) }),
  deleteNote:  (id)             => apiFetch(`/api/user/notes/${id}`, { method: 'DELETE' }),

  // Saved papers
  getPapers:   ()               => apiFetch('/api/user/papers'),
  savePaper:   (data)           => apiFetch('/api/user/papers', { method: 'POST', body: JSON.stringify(data) }),
  deletePaper: (id)             => apiFetch(`/api/user/papers/${id}`, { method: 'DELETE' }),

  // Quiz history
  getQuizHistory:  ()    => apiFetch('/api/user/quiz-history'),
  saveQuizResult:  (data) => apiFetch('/api/user/quiz-history', { method: 'POST', body: JSON.stringify(data) }),
};

// ════════════════════════════════════════════════════════════════
//  AI API — replaces direct Anthropic calls
//  (API key stays on the backend — never exposed to browser)
// ════════════════════════════════════════════════════════════════
async function callAI(tool, messages, system = '', meta = {}) {
  return apiFetch(`/api/ai/${tool}`, {
    method: 'POST',
    body: JSON.stringify({ messages, system, ...meta }),
  });
}

export const aiApi = {
  /**
   * DOUBT SOLVER
   * Usage:
   *   const { content, xpEarned } = await aiApi.doubt(conversationHistory, systemPrompt, 'Mathematics');
   */
  doubt: (messages, system, subject) =>
    callAI('doubt', messages, system, { subject }),

  /**
   * QUIZ GENERATOR
   * Usage:
   *   const { content, xpEarned } = await aiApi.quiz([{role:'user',content:'Generate quiz...'}], '', 'Physics');
   *   const questions = JSON.parse(content);
   */
  quiz: (messages, system, subject) =>
    callAI('quiz', messages, system, { subject }),

  /**
   * NOTES GENERATOR
   * Usage:
   *   const { content, xpEarned } = await aiApi.notes([...], systemPrompt, 'Chemistry', 'Atoms');
   */
  notes: (messages, system, subject, chapter) =>
    callAI('notes', messages, system, { subject, chapter }),

  /**
   * QUESTION PAPER
   */
  paper: (messages, system, subject) =>
    callAI('paper', messages, system, { subject }),

  /**
   * FLASHCARDS
   */
  flashcards: (messages, system, subject, chapter) =>
    callAI('flashcards', messages, system, { subject, chapter }),
};

// ════════════════════════════════════════════════════════════════
//  HOW TO MIGRATE YOUR EXISTING askAI() CALLS
// ════════════════════════════════════════════════════════════════
/**
 * BEFORE (current artifact code — direct Anthropic call):
 *
 *   const ans = await askAI([...messages], systemPrompt);
 *
 * AFTER (using this API client):
 *
 *   // 1. Import at top of your component:
 *   import { aiApi } from '../lib/api';
 *
 *   // 2. Replace the call:
 *   const { content: ans, xpEarned } = await aiApi.doubt(messages, systemPrompt, subject);
 *   // (or .quiz, .notes, .paper, .flashcards)
 *
 *   // 3. XP is now tracked in the database automatically.
 *   //    You can use xpEarned to update the UI state.
 */
