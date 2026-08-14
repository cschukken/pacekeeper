const SETTINGS_KEY = 'pk_settings';
const SESSION_KEY = 'pk_session';
const INACTIVITY_THRESHOLD = 18 * 60 * 60 * 1000; // 18 hours in ms

const DEFAULT_SETTINGS = { bacLimit: 0.08 };
const DEFAULT_SESSION = { drinks: [], waterCount: 0, mealTime: null };

export function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : { ...DEFAULT_SETTINGS };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function loadSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return { ...DEFAULT_SESSION, drinks: [] };

    const session = JSON.parse(raw);

    // Auto-clear if last drink was more than 18 hours ago
    if (session.drinks && session.drinks.length > 0) {
      const lastDrink = Math.max(...session.drinks.map(d => d.timestamp));
      if (Date.now() - lastDrink > INACTIVITY_THRESHOLD) {
        clearSession();
        return { ...DEFAULT_SESSION, drinks: [] };
      }
    }

    return { ...DEFAULT_SESSION, ...session };
  } catch {
    return { ...DEFAULT_SESSION, drinks: [] };
  }
}

export function saveSession(session) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}
