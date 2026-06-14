import axios from 'axios';

const BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

const api = axios.create({ baseURL: BASE, headers: { 'Content-Type': 'application/json' } });

// Attach JWT to every request
api.interceptors.request.use((config) => {
  const user = getStoredUser();
  if (user?.token) config.headers.Authorization = `Bearer ${user.token}`;
  return config;
});

// Auto-logout on 401
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('tm_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const getStoredUser = () => {
  try { return JSON.parse(localStorage.getItem('tm_user')); } catch { return null; }
};

// ── AUTH ──────────────────────────────────────────────────────────────────────
export const authAPI = {
  register: (name, email, password) => api.post('/auth/register', { name, email, password }),
  login: async (email, password) => {
    const form = new URLSearchParams({ username: email, password });
    const res = await axios.post(`${BASE}/auth/login`, form, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
    return res.data; // { access_token, token_type, user_id, name, email }
  },
  me: () => api.get('/auth/me'),
};

// ── TRADING ───────────────────────────────────────────────────────────────────
export const tradeAPI = {
  execute: (stock_symbol, action_type, execution_price, quantity) =>
    api.post('/trades/', { stock_symbol, action_type, execution_price, quantity }),
  getAll: () => api.get('/trades/'),
  getPortfolio: () => api.get('/trades/portfolio'),
  reset: () => api.delete('/trades/reset'),
};

// ── JOURNAL ───────────────────────────────────────────────────────────────────
export const journalAPI = {
  create: (entry) => api.post('/journal/', entry),
  getAll: () => api.get('/journal/'),
  delete: (id) => api.delete(`/journal/${id}`),
  stats: () => api.get('/journal/stats'),
};

// ── COURSES ───────────────────────────────────────────────────────────────────
export const courseAPI = {
  getAll: () => api.get('/courses/'),
  getQuizzes: (courseId) => api.get(`/courses/${courseId}/quizzes`),
  submitResult: (quiz_id, score) => api.post('/courses/quiz-results', { quiz_id, score }),
  myProgress: () => api.get('/courses/my-progress'),
};

// ── DASHBOARD ─────────────────────────────────────────────────────────────────
export const dashboardAPI = {
  summary: () => api.get('/dashboard/summary'),
};

// ── AI ────────────────────────────────────────────────────────────────────────
export const aiAPI = {
  chat: (message, history) => api.post('/ai/chat', { message, history }),
  analyzeTrades: (context) => api.post('/ai/analyze-trade', { context }),
  recommendations: () => api.get('/ai/recommendations'),
};

// ── GEMINI DIRECT (frontend fallback when no backend) ─────────────────────────
export const geminiDirect = async (messages, systemPrompt) => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) throw new Error('NO_KEY');
  const contents = messages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.text }]
  }));
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents,
        generationConfig: { temperature: 0.7, maxOutputTokens: 600 }
      })
    }
  );
  if (!res.ok) throw new Error(`Gemini ${res.status}`);
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response.';
};

export default api;