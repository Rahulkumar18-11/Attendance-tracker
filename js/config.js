// ============================================
// Student Attendance Tracker — Configuration
// ============================================

const CONFIG = {
  // API base URL — dynamically uses localhost:7071 for Live Server or file://, or relative /api for production/SWA CLI
  API_BASE: window.location.port !== '4280' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:')
    ? 'http://localhost:7071/api'
    : '/api',

  // Admin authentication
  ADMIN_PASSWORD: 'admin123',

  // Local storage keys (for theme & auth only — data is in Cosmos DB)
  LS_THEME_KEY: 'attendance_theme',
  LS_AUTH_KEY: 'attendance_admin_auth',
};
