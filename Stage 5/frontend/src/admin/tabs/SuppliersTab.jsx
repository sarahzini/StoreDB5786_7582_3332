import { useState } from 'react';
import useTab from '../shared/useTab';
import DataTable from '../shared/DataTable';
import Drawer from '../shared/Drawer';
import { Toast, AddButton } from '../shared/ui';

const BASE = 'http://localhost:5000';

const fieldCls    = "w-full mt-1.5 p-3 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-red-500 transition-all shadow-sm font-medium";
const fieldErrCls = "w-full mt-1.5 p-3 bg-white border border-red-400 rounded-lg text-sm outline-none focus:border-red-500 transition-all shadow-sm font-medium";
const labelCls    = "block text-[10px] font-bold text-gray-400 tracking-[0.1em] uppercase mb-1";

const COLUMNS = [
    { key: 'suppliername', label: 'Name' },
    { key: 'email',        label: 'Email' },
    { key: 'phone',        label: 'Phone' },
    { key: 'city',         label: 'City' },
    { key: 'street',       label: 'Street' },
];

export default function SuppliersTab() {
    const t = useTab('/api/admin/suppliers', 'supplierid');
    const [confirm, setConfirm] = useState(null);
    const [errors, setErrors]   = useState({});

    const validate = () => {
        const e = {};
        if (!t.form.suppliername?.trim())
            e.suppliername = 'Name is required.';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t.form.email || ''))
            e.email = 'Please enter a valid email address.';
        if (!/^\d{9,10}$/.test((t.form.phone || '').replace(/[-\s]/g, '')))
            e.phone = 'Phone must contain 9 or 10 digits.';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const openAdd  = () => { t.openAdd();  setErrors({}); };
    const openEdit = row => { t.openEdit(row); setErrors({}); };

    const askDelete = row => setConfirm({
        message: `Delete supplier "${row.suppliername}"?`,
        onConfirm: async () => {
            setConfirm(null);
            try {
                const res    = await fetch(`${BASE}/api/admin/suppliers/${row.supplierid}`, { method: 'DELETE' });
                const result = await res.json();
                if (result.success) { t.setToast({ type: 'success', text: `"${row.suppliername}" deleted.` }); t.load(); }
                else t.setToast({ type: 'error', text: result.message || 'Cannot delete this supplier.' });
            } catch { t.setToast({ type: 'error', text: 'Server error.' }); }
        },
    });

    const askSave = () => {
        if (!validate()) return;
        const isEdit = !!t.form.supplierid;
        setConfirm({
            message: isEdit ? `Save changes to "${t.form.suppliername}"?` : `Add new supplier "${t.form.suppliername}"?`,
            onConfirm: () => { setConfirm(null); doSave(); },
        });
    };

    const doSave = async () => {
        const isEdit = !!t.form.supplierid;
        const url = isEdit ? `${BASE}/api/admin/suppliers/${t.form.supplierid}` : `${BASE}/api/admin/suppliers`;
        try {
            const res = await fetch(url, { method: isEdit ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(t.form) });
            const result = await res.json();
            if (result.success) { t.setToast({ type: 'success', text: isEdit ? 'Supplier updated.' : 'Supplier added.' }); t.close(); t.load(); }
            else t.setToast({ type: 'error', text: result.message || 'Error saving.' });
        } catch { t.setToast({ type: 'error', text: 'Server error.' }); }
    };

    return (
        <>
            {t.toast && <Toast message={t.toast.text} type={t.toast.type} onDone={() => t.setToast(null)} />}
            {confirm && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/30" />
                    <div className="relative bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
                        <p className="text-sm text-gray-700 mb-6">{confirm.message}</p>
                        <div className="flex gap-3 justify-end">
                            <button onClick={() => setConfirm(null)} className="px-5 py-2.5 rounded-lg text-[11px] font-bold uppercase text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors">Cancel</button>
                            <button onClick={confirm.onConfirm} className="px-5 py-2.5 rounded-lg text-[11px] font-bold uppercase text-white bg-red-600 hover:bg-red-700 transition-colors">Confirm</button>
                        </div>
                    </div>
                </div>
            )}
            <AddButton label="Supplier" onClick={openAdd} />
            <DataTable columns={COLUMNS} rows={t.rows} onEdit={openEdit} onDelete={askDelete} emptyLabel="No suppliers."
                loading={t.loading} search={t.search} onSearchChange={t.setSearch}
                page={t.page} totalPages={t.totalPages} onPageChange={t.setPage} totalCount={t.filteredRows.length} />
            {t.drawer && (
                <Drawer title={t.form.supplierid ? 'Edit Supplier' : 'Add Supplier'} onClose={t.close} onSubmit={askSave}>
                    <div>
                        <label className={labelCls}>Name</label>
                        <input type="text" name="suppliername" value={t.form.suppliername || ''} onChange={t.handleChange} className={errors.suppliername ? fieldErrCls : fieldCls} placeholder="e.g. Tnuva Ltd" />
                        {errors.suppliername && <p className="text-[11px] text-red-500 mt-1">{errors.suppliername}</p>}
                    </div>
                    <div>
                        <label className={labelCls}>Email</label>
                        <input type="text" name="email" value={t.form.email || ''} onChange={t.handleChange} className={errors.email ? fieldErrCls : fieldCls} placeholder="e.g. contact@supplier.co.il" />
                        {errors.email && <p className="text-[11px] text-red-500 mt-1">{errors.email}</p>}
                    </div>
                    <div>
                        <label className={labelCls}>Phone</label>
                        <input type="text" name="phone" value={t.form.phone || ''} onChange={t.handleChange} className={errors.phone ? fieldErrCls : fieldCls} placeholder="e.g. 0391234567" />
                        {errors.phone && <p className="text-[11px] text-red-500 mt-1">{errors.phone}</p>}
                    </div>
                    <div>
                        <label className={labelCls}>City</label>
                        <input type="text" name="city" value={t.form.city || ''} onChange={t.handleChange} className={fieldCls} placeholder="e.g. Tel Aviv" />
                    </div>
                    <div>
                        <label className={labelCls}>Street</label>
                        <input type="text" name="street" value={t.form.street || ''} onChange={t.handleChange} className={fieldCls} placeholder="e.g. Herzl St 12" />
                    </div>
                </Drawer>
            )}
        </>
    );
}
