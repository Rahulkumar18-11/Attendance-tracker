// ============================================
// Student Attendance Tracker — User Panel Logic
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    initTheme();

    const form = document.getElementById('attendanceForm');
    const nameInput = document.getElementById('studentName');
    const dateInput = document.getElementById('attendanceDate');
    const statusSelect = document.getElementById('attendanceStatus');
    const submitBtn = document.getElementById('submitBtn');

    // Default date to today
    dateInput.value = new Date().toISOString().split('T')[0];

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const studentName = nameInput.value.trim();
        const date = dateInput.value;
        const status = statusSelect.value;

        if (!studentName || !date || !status) {
            showToast('Please fill in all fields', 'error');
            return;
        }

        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner"></span> Submitting…';

        try {
            await DB.create({ studentName, date, status });
            showToast(`Attendance recorded for ${studentName}`, 'success');
            form.reset();
            dateInput.value = new Date().toISOString().split('T')[0];
            nameInput.focus();
        } catch (err) {
            showToast('Failed to save record. ' + err.message, 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '📋 Submit Attendance';
        }
    });
});

// --------- Theme ---------
function initTheme() {
    const saved = localStorage.getItem(CONFIG.LS_THEME_KEY);
    if (saved === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
    }
    updateThemeIcon();
}

function toggleTheme() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    document.documentElement.setAttribute('data-theme', isDark ? 'light' : 'dark');
    localStorage.setItem(CONFIG.LS_THEME_KEY, isDark ? 'light' : 'dark');
    updateThemeIcon();
}

function updateThemeIcon() {
    const btn = document.getElementById('themeToggle');
    if (!btn) return;
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    btn.textContent = isDark ? '☀️' : '🌙';
}

// --------- Toast ---------
function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;

    const icons = { success: '✅', error: '❌', info: 'ℹ️' };
    toast.innerHTML = `<span class="toast__icon">${icons[type] || icons.info}</span><span>${message}</span>`;

    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('removing');
        toast.addEventListener('animationend', () => toast.remove());
    }, 3500);
}
