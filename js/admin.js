// ============================================
// Student Attendance Tracker — Admin Panel Logic
// ============================================

let allRecords = [];
let chartInstance = null;

document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    checkAuth();
});

// ===================== AUTH =====================
function checkAuth() {
    const authed = sessionStorage.getItem(CONFIG.LS_AUTH_KEY);
    if (authed === 'true') {
        showDashboard();
    } else {
        showLogin();
    }
}

function showLogin() {
    document.getElementById('loginOverlay').classList.add('active');
    document.getElementById('dashboard').style.display = 'none';
}

function showDashboard() {
    document.getElementById('loginOverlay').classList.remove('active');
    document.getElementById('dashboard').style.display = 'block';
    loadRecords();
}

function handleLogin(e) {
    e.preventDefault();
    const pw = document.getElementById('adminPassword').value;
    if (pw === CONFIG.ADMIN_PASSWORD) {
        sessionStorage.setItem(CONFIG.LS_AUTH_KEY, 'true');
        showDashboard();
        showToast('Welcome, Admin!', 'success');
    } else {
        showToast('Incorrect password', 'error');
        document.getElementById('adminPassword').value = '';
    }
}

function handleLogout() {
    sessionStorage.removeItem(CONFIG.LS_AUTH_KEY);
    location.reload();
}

// ===================== RECORDS =====================
async function loadRecords() {
    try {
        allRecords = await DB.getAll();
        renderStats();
        renderTable();
        renderChart();
    } catch (err) {
        showToast('Failed to load records: ' + err.message, 'error');
    }
}

// ===================== STATS =====================
function renderStats() {
    const total = allRecords.length;
    const present = allRecords.filter(r => r.status === 'present').length;
    const absent = allRecords.filter(r => r.status === 'absent').length;
    const pct = total > 0 ? ((present / total) * 100).toFixed(1) : '0.0';

    document.getElementById('statTotal').textContent = total;
    document.getElementById('statPresent').textContent = present;
    document.getElementById('statAbsent').textContent = absent;
    document.getElementById('statPercent').textContent = pct + '%';
}

// ===================== TABLE =====================
function getFilteredRecords() {
    const search = (document.getElementById('searchInput').value || '').toLowerCase();
    const filter = document.getElementById('filterStatus').value;

    return allRecords.filter(r => {
        const matchesSearch = r.studentName.toLowerCase().includes(search);
        const matchesFilter = !filter || r.status === filter;
        return matchesSearch && matchesFilter;
    });
}

function renderTable() {
    const records = getFilteredRecords();
    const tbody = document.getElementById('recordsBody');

    if (records.length === 0) {
        tbody.innerHTML = `
      <tr>
        <td colspan="5">
          <div class="empty-state">
            <div class="empty-state__icon">📭</div>
            <div class="empty-state__text">No records found</div>
          </div>
        </td>
      </tr>`;
        return;
    }

    // Sort by date descending
    records.sort((a, b) => new Date(b.date) - new Date(a.date));

    tbody.innerHTML = records.map(r => `
    <tr data-id="${r.id}">
      <td><strong>${escapeHtml(r.studentName)}</strong></td>
      <td>${formatDate(r.date)}</td>
      <td><span class="badge badge--${r.status}">${r.status}</span></td>
      <td style="font-size:0.78rem;color:var(--text-muted)">${formatDateTime(r.createdAt)}</td>
      <td>
        <div style="display:flex;gap:6px">
          <button class="btn btn--outline btn--sm" onclick="openEditModal('${r.id}')" title="Edit">✏️</button>
          <button class="btn btn--danger btn--sm" onclick="deleteRecord('${r.id}', '${escapeHtml(r.studentName)}')" title="Delete">🗑️</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function handleSearch() { renderTable(); }
function handleFilter() { renderTable(); }

// ===================== EDIT =====================
function openEditModal(id) {
    const record = allRecords.find(r => r.id === id);
    if (!record) return;

    document.getElementById('editId').value = record.id;
    document.getElementById('editName').value = record.studentName;
    document.getElementById('editDate').value = record.date;
    document.getElementById('editStatus').value = record.status;

    document.getElementById('editOverlay').classList.add('active');
}

function closeEditModal() {
    document.getElementById('editOverlay').classList.remove('active');
}

async function handleEdit(e) {
    e.preventDefault();
    const id = document.getElementById('editId').value;
    const studentName = document.getElementById('editName').value.trim();
    const date = document.getElementById('editDate').value;
    const status = document.getElementById('editStatus').value;

    if (!studentName || !date || !status) {
        showToast('Please fill in all fields', 'error');
        return;
    }

    try {
        await DB.update(id, { studentName, date, status });
        showToast('Record updated', 'success');
        closeEditModal();
        await loadRecords();
    } catch (err) {
        showToast('Update failed: ' + err.message, 'error');
    }
}

// ===================== DELETE =====================
async function deleteRecord(id, studentName) {
    if (!confirm('Are you sure you want to delete this record?')) return;
    try {
        await DB.delete(id, studentName);
        showToast('Record deleted', 'success');
        await loadRecords();
    } catch (err) {
        showToast('Delete failed: ' + err.message, 'error');
    }
}

// ===================== CHART =====================
function renderChart() {
    const ctx = document.getElementById('attendanceChart');
    if (!ctx) return;

    // Group by student
    const grouped = {};
    allRecords.forEach(r => {
        if (!grouped[r.studentName]) grouped[r.studentName] = { present: 0, absent: 0, late: 0 };
        if (grouped[r.studentName][r.status] !== undefined) {
            grouped[r.studentName][r.status]++;
        }
    });

    const labels = Object.keys(grouped);
    const presentData = labels.map(n => grouped[n].present);
    const absentData = labels.map(n => grouped[n].absent);
    const lateData = labels.map(n => grouped[n].late);

    if (chartInstance) chartInstance.destroy();

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const gridColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
    const textColor = isDark ? '#cbd5e1' : '#475569';

    chartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels,
            datasets: [
                {
                    label: 'Present',
                    data: presentData,
                    backgroundColor: '#10b981',
                    borderRadius: 6,
                },
                {
                    label: 'Absent',
                    data: absentData,
                    backgroundColor: '#ef4444',
                    borderRadius: 6,
                },
                {
                    label: 'Late',
                    data: lateData,
                    backgroundColor: '#f59e0b',
                    borderRadius: 6,
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { labels: { color: textColor, font: { family: 'Inter' } } }
            },
            scales: {
                x: { ticks: { color: textColor }, grid: { color: gridColor } },
                y: { ticks: { color: textColor, stepSize: 1 }, grid: { color: gridColor }, beginAtZero: true }
            }
        }
    });
}

// ===================== CSV EXPORT =====================
function exportCSV() {
    if (allRecords.length === 0) {
        showToast('No records to export', 'info');
        return;
    }

    const headers = ['Student Name', 'Date', 'Status', 'Created At'];
    const rows = allRecords.map(r => [
        `"${r.studentName}"`,
        r.date,
        r.status,
        r.createdAt || ''
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    showToast('CSV exported successfully', 'success');
}

// ===================== THEME =====================
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
    // Re-render chart with new colors
    renderChart();
}

function updateThemeIcon() {
    const btn = document.getElementById('themeToggle');
    if (!btn) return;
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    btn.textContent = isDark ? '☀️' : '🌙';
}

// ===================== UTILITIES =====================
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

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatDateTime(isoStr) {
    if (!isoStr) return '';
    const d = new Date(isoStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' ' +
        d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}
