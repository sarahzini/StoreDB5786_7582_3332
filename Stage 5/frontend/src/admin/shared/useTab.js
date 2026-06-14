import { useState, useEffect, useCallback } from 'react';

const BASE = 'http://localhost:5000';

// Generic CRUD hook for a single API endpoint
// url: e.g. '/api/admin/customers'
// idKey: primary key field name, e.g. 'customerid'
export default function useTab(url, idKey) {
    const [rows, setRows]         = useState([]);
    const [toast, setToast]       = useState(null);
    const [drawer, setDrawer]     = useState(false);
    const [form, setForm]         = useState({});
    const [loading, setLoading]   = useState(true);
    const [search, setSearch]     = useState('');
    const [page, setPage]         = useState(1);
    const [confirmRow, setConfirmRow] = useState(null); // row pending delete confirmation

    const PAGE_SIZE = 10;

    const showToast = (type, text) => setToast({ type, text });

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`${BASE}${url}`);
            setRows(await res.json());
        } catch {
            showToast('error', 'Failed to load data.');
        } finally {
            setLoading(false);
        }
    }, [url]);

    useEffect(() => { load(); }, [load]);

    // Reset page when search changes
    useEffect(() => { setPage(1); }, [search]);

    const openAdd  = ()    => { setForm({}); setDrawer(true); };
    const openEdit = (row) => { setForm(row); setDrawer(true); };
    const close    = ()    => { setDrawer(false); setForm({}); };

    const handleChange = (e) => {
        const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        setForm(f => ({ ...f, [e.target.name]: val }));
    };

    // Show confirm modal instead of window.confirm
    const handleDelete = (row, customUrl) => {
        setConfirmRow({ row, customUrl });
    };

    // Called when the user confirms deletion in the modal
    const confirmDelete = async () => {
        if (!confirmRow) return;
        const { row, customUrl } = confirmRow;
        const endpoint = customUrl || `${BASE}${url}/${row[idKey]}`;
        setConfirmRow(null);
        try {
            const res    = await fetch(endpoint, { method: 'DELETE' });
            const result = await res.json();
            result.success
                ? (showToast('success', 'Deleted successfully.'), load())
                : showToast('error', result.message);
        } catch {
            showToast('error', 'Server error.');
        }
    };

    const cancelDelete = () => setConfirmRow(null);

    const handleSubmit = async (customUrl, customMethod) => {
        const isEdit = idKey && !!form[idKey];
        const method = customMethod || (isEdit ? 'PUT' : 'POST');
        const endpoint = customUrl || (isEdit ? `${BASE}${url}/${form[idKey]}` : `${BASE}${url}`);
        try {
            const res    = await fetch(endpoint, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
            const result = await res.json();
            if (result.success) {
                showToast('success', isEdit ? 'Updated successfully.' : 'Added successfully.');
                close();
                load();
            } else {
                showToast('error', result.message || 'Error saving.');
            }
        } catch {
            showToast('error', 'Server error.');
        }
    };

    // Filtered rows based on search query (searches all string values)
    const filteredRows = search.trim()
        ? rows.filter(row =>
            Object.values(row).some(val =>
                val !== null && val !== undefined &&
                String(val).toLowerCase().includes(search.toLowerCase())
            )
          )
        : rows;

    // Pagination
    const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
    const pagedRows  = filteredRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    return {
        rows: pagedRows,
        allRows: rows,
        filteredRows,
        toast, setToast,
        drawer, form, setForm,
        loading,
        search, setSearch,
        page, setPage, totalPages, PAGE_SIZE,
        confirmRow,
        openAdd, openEdit, close,
        handleChange, handleDelete,
        confirmDelete, cancelDelete,
        handleSubmit, load,
    };
}
