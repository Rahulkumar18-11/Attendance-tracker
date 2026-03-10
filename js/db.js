// ============================================
// Student Attendance Tracker — Data Layer
// Calls Azure Functions API at /api/records
// ============================================

const DB = (() => {

    const base = () => CONFIG.API_BASE + '/records';

    async function handleResponse(res) {
        const text = await res.text();
        let data;
        try {
            data = text ? JSON.parse(text) : {};
        } catch (e) {
            data = { error: text || `Unexpected response format` };
        }

        if (!res.ok) {
            throw new Error(data.error || `Request failed (${res.status} ${res.statusText})`);
        }
        return data;
    }

    return {
        async getAll() {
            const res = await fetch(base());
            return handleResponse(res);
        },

        async create(record) {
            const res = await fetch(base(), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(record)
            });
            return handleResponse(res);
        },

        async update(id, updates) {
            const res = await fetch(`${base()}/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates)
            });
            return handleResponse(res);
        },

        async delete(id, studentName) {
            const res = await fetch(`${base()}/${id}?studentName=${encodeURIComponent(studentName)}`, {
                method: 'DELETE'
            });
            return handleResponse(res);
        }
    };
})();
