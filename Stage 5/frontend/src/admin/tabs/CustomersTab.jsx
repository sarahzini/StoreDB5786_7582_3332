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
    { key: 'customername', label: 'Name' },
    { key: 'email',        label: 'Email' },
    { key: 'phone',        label: 'Phone' },
    { key: 'city',         label: 'City' },
    { key: 'street',       label: 'Street' },
    { key: 'loyaltytier',  label: 'Tier', render: r => (
        <span className="text-sm font-semibold text-amber-600">{r.loyaltytier || 'Standard'}</span>
    )},
];

export default function CustomersTab() {
    const t = useTab('/api/admin/customers', 'customerid');
    const [confirm, setConfirm] = useState(null);
    const [errors, setErrors]   = useState({});

    const validate = () => {
        const e = {};
        if (!t.form.customername?.trim()) e.customername = 'Name is required.';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t.form.email || '')) e.email = 'Please enter a valid email address.';
        if (!/^\d{10}$/.test((t.form.phone || '').replace(/[-\s]/g, ''))) e.phone = 'Phone must contain exactly 10 digits.';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const openAdd  = () => { t.openAdd(); t.setForm({ customername: '', email: '', phone: '', city: '', street: '', password: '' }); setErrors({}); };
    const openEdit = row => { t.openEdit({ ...row, password: '' }); setErrors({}); };

    const askDelete = row => setConfirm({
        message: `Delete customer "${row.customername}"?`,
        onConfirm: async () => {
            setConfirm(null);
            try {
                const res = await fetch(`${BASE}/api/admin/customers/${row.customerid}`, { method: 'DELETE' });
                const result = await res.json();
                if (result.success) { t.setToast({ type: 'success', text: `"${row.customername}" deleted.` }); t.load(); }
                else t.setToast({ type: 'error', text: result.message || 'Cannot delete this customer.' });
            } catch { t.setToast({ type: 'error', text: 'Server error.' }); }
        },
    });

    const askSave = () => {
        if (!validate()) return;
        const isEdit = !!t.form.customerid;
        setConfirm({
            message: isEdit ? `Save changes to "${t.form.customername}"?` : `Add new customer "${t.form.customername}"?`,
            onConfirm: () => { setConfirm(null); doSave(); },
        });
    };

    const doSave = async () => {
        const isEdit = !!t.form.customerid;
        const url = isEdit ? `${BASE}/api/admin/customers/${t.form.customerid}` : `${BASE}/api/admin/customers`;
        try {
            const res = await fetch(url, { method: isEdit ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(t.form) });
            const result = await res.json();
            if (result.success) { t.setToast({ type: 'success', text: isEdit ? 'Customer updated.' : 'Customer added.' }); t.close(); t.load(); }
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
            <AddButton label="Customer" onClick={openAdd} />
            <DataTable columns={COLUMNS} rows={t.rows} onEdit={openEdit} onDelete={askDelete} emptyLabel="No customers."
                loading={t.loading} search={t.search} onSearchChange={t.setSearch}
                page={t.page} totalPages={t.totalPages} onPageChange={t.setPage} totalCount={t.filteredRows.length} />
            {t.drawer && (
                <Drawer title={t.form.customerid ? 'Edit Customer' : 'Add Customer'} onClose={t.close} onSubmit={askSave}>
                    <div>
                        <label className={labelCls}>Name</label>
                        <input type="text" name="customername" value={t.form.customername || ''} onChange={t.handleChange} className={errors.customername ? fieldErrCls : fieldCls} placeholder="e.g. Yohann Cohen" autoComplete="off" />
                        {errors.customername && <p className="text-[11px] text-red-500 mt-1">{errors.customername}</p>}
                    </div>
                    <div>
                        <label className={labelCls}>Email</label>
                        <input type="text" name="email" value={t.form.email || ''} onChange={t.handleChange} className={errors.email ? fieldErrCls : fieldCls} placeholder="e.g. name@mail.com" autoComplete="off" />
                        {errors.email && <p className="text-[11px] text-red-500 mt-1">{errors.email}</p>}
                    </div>
                    <div>
                        <label className={labelCls}>Phone</label>
                        <input type="text" name="phone" value={t.form.phone || ''} onChange={t.handleChange} className={errors.phone ? fieldErrCls : fieldCls} placeholder="e.g. 0501234567" autoComplete="off" />
                        {errors.phone && <p className="text-[11px] text-red-500 mt-1">{errors.phone}</p>}
                    </div>
                    <div>
                        <label className={labelCls}>City</label>
                        <input type="text" name="city" value={t.form.city || ''} onChange={t.handleChange} className={fieldCls} placeholder="e.g. Tel Aviv" autoComplete="off" />
                    </div>
                    <div>
                        <label className={labelCls}>Street</label>
                        <input type="text" name="street" value={t.form.street || ''} onChange={t.handleChange} className={fieldCls} placeholder="e.g. Herzl St 12" autoComplete="off" />
                    </div>
                    <div>
                        <label className={labelCls}>Password</label>
                        <input type="password" name="password" value={t.form.password || ''} onChange={t.handleChange} className={fieldCls} placeholder={t.form.customerid ? 'Leave blank to keep current' : 'e.g. mypassword123'} autoComplete="new-password" />
                    </div>
                </Drawer>
            )}
        </>
    );
}
