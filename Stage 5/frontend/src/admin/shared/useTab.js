import { useState, useEffect, useCallback } from 'react';

const BASE = 'http://localhost:5000';

// Generic CRUD hook for a single API endpoint
// url: e.g. '/api/admin/customers'
// idKey: primary key field name, e.g. 'customerid'
// For composite PKs (inventory), pass null and handle submit/delete manually
export default function useTab(url, idKey) {
    const [rows, setRows]     = useState([]);
    const [toast, setToast]   = useState(null);
    const [drawer, setDrawer] = useState(false);
    const [form, setForm]     = useState({});

    const showToast = (type, text) => setToast({ type, text });

    const load = useCallback(async () => {
        try {
            const res = await fetch(`${BASE}${url}`);
            setRows(await res.json());
        } catch {
            showToast('error', 'Failed to load data.');
        }
    }, [url]);

    useEffect(() => { load(); }, [load]);

    const openAdd  = ()    => { setForm({}); setDrawer(true); };
    const openEdit = (row) => { setForm(row); setDrawer(true); };
    const close    = ()    => { setDrawer(false); setForm({}); };

    const handleChange = (e) => {
        const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        setForm(f => ({ ...f, [e.target.name]: val }));
    };

    const handleDelete = async (row, customUrl) => {
        if (!window.confirm('Delete this record?')) return;
        const endpoint = customUrl || `${BASE}${url}/${row[idKey]}`;
        try {
            const res    = await fetch(endpoint, { method: 'DELETE' });
            const result = await res.json();
            result.success ? (showToast('success', 'Deleted.'), load()) : showToast('error', result.message);
        } catch {
            showToast('error', 'Server error.');
        }
    };

    const handleSubmit = async (customUrl, customMethod) => {
        const isEdit = idKey && !!form[idKey];
        const method = customMethod || (isEdit ? 'PUT' : 'POST');
        const endpoint = customUrl || (isEdit ? `${BASE}${url}/${form[idKey]}` : `${BASE}${url}`);
        try {
            const res    = await fetch(endpoint, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
            const result = await res.json();
            if (result.success) {
                showToast('success', isEdit ? 'Updated.' : 'Added.');
                close();
                load();
            } else {
                showToast('error', result.message || 'Error saving.');
            }
        } catch {
            showToast('error', 'Server error.');
        }
    };

    return { rows, toast, setToast, drawer, form, setForm, openAdd, openEdit, close, handleChange, handleDelete, handleSubmit, load };
}
