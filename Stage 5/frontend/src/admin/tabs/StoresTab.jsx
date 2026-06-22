import { useState } from 'react';
import useTab from '../shared/useTab';
import DataTable from '../shared/DataTable';
import Drawer from '../shared/Drawer';
import { Toast, AddButton } from '../shared/ui';
import { t } from '../../translations';

const BASE = 'http://localhost:5000';

const COLUMNS = [
    { key: 'storename',  label: 'Name' },
    { key: 'email',      label: 'Email' },
    { key: 'phone',      label: 'Phone' },
    { key: 'websiteurl', label: 'Website' },
    { key: 'rating',     label: 'Rating', render: r => r.rating ? `★ ${r.rating}` : '—' },
];

const fieldCls    = "w-full mt-1.5 p-3 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-50 dark:focus:ring-red-900/30 text-gray-900 dark:text-white transition-all shadow-sm font-medium";
const fieldErrCls = "w-full mt-1.5 p-3 bg-white dark:bg-white/5 border border-red-400 dark:border-red-500/50 rounded-lg text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-50 dark:focus:ring-red-900/30 text-gray-900 dark:text-white transition-all shadow-sm font-medium";
const labelCls    = "block text-[10px] font-bold text-gray-400 tracking-[0.1em] uppercase mb-1";

export default function StoresTab({ lang }) {
    const tab = useTab('/api/admin/stores', 'storeid');
    const [confirm, setConfirm] = useState(null);
    const [errors, setErrors]   = useState({});

    const validate = () => {
        const e = {};
        if (!tab.form.storename?.trim())
            e.storename = 'Store name is required.';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(tab.form.email || ''))
            e.email = 'Please enter a valid email address.';
        if (!/^\d{10}$/.test((tab.form.phone || '').replace(/[-\s]/g, '')))
            e.phone = 'Phone must contain exactly 10 digits.';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const openAdd = () => {
        tab.openAdd();
        tab.setForm({ storename: '', email: '', phone: '', websiteurl: '', rating: '', password: '' });
        setErrors({});
    };

    const openEdit = (row) => {
        tab.openEdit({ ...row, password: '' });
        setErrors({});
    };

    const askDelete = (row) => {
        setConfirm({
            message: `Delete store "${row.storename}"?`,
            onConfirm: async () => {
                setConfirm(null);
                try {
                    const res    = await fetch(`${BASE}/api/admin/stores/${row.storeid}`, { method: 'DELETE' });
                    const result = await res.json();
                    if (result.success) {
                        tab.setToast({ type: 'success', text: `"${row.storename}" deleted.` });
                        tab.load();
                    } else {
                        tab.setToast({ type: 'error', text: result.message || 'Cannot delete this store.' });
                    }
                } catch {
                    tab.setToast({ type: 'error', text: 'Server error.' });
                }
            },
        });
    };

    const askSave = () => {
        if (!validate()) return;
        const isEdit = !!tab.form.storeid;
        setConfirm({
            message: isEdit
                ? `Save changes to "${tab.form.storename}"?`
                : `Add new store "${tab.form.storename}"?`,
            onConfirm: () => { setConfirm(null); doSave(); },
        });
    };

    const doSave = async () => {
        const isEdit = !!tab.form.storeid;
        const url = isEdit
            ? `${BASE}/api/admin/stores/${tab.form.storeid}`
            : `${BASE}/api/admin/stores`;
        try {
            const res = await fetch(url, {
                method: isEdit ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(tab.form),
            });
            const result = await res.json();
            if (result.success) {
                tab.setToast({ type: 'success', text: isEdit ? 'Store updated.' : 'Store added.' });
                tab.close();
                tab.load();
            } else {
                tab.setToast({ type: 'error', text: result.message || 'Error saving.' });
            }
        } catch {
            tab.setToast({ type: 'error', text: 'Server error.' });
        }
    };

    return (
        <>
            {tab.toast && <Toast message={t(tab.toast.text, lang)} type={tab.toast.type} onDone={() => tab.setToast(null)} />}

            {confirm && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/30 dark:bg-black/60" />
                    <div className="relative bg-white dark:!bg-transparent dark:bg-gradient-to-br dark:from-[#0B1120] dark:via-[#111827] dark:to-[#450a0a] rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 border border-transparent dark:border-white/10">
                        <p className="text-sm text-gray-700 dark:text-gray-300 mb-6">{confirm.message}</p>
                        <div className="flex gap-3 justify-end">
                            <button onClick={() => setConfirm(null)} className="px-5 py-2.5 rounded-lg text-[11px] font-bold uppercase text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors">{t('Cancel', lang)}</button>
                            <button onClick={confirm.onConfirm} className="px-5 py-2.5 rounded-lg text-[11px] font-bold uppercase text-white bg-red-600 hover:bg-red-700 transition-colors">{t('Confirm', lang)}</button>
                        </div>
                    </div>
                </div>
            )}

            <AddButton label="Store" onClick={openAdd} lang={lang} />

            <DataTable
                columns={COLUMNS}
                rows={tab.rows}
                onEdit={openEdit}
                onDelete={askDelete}
                emptyLabel={t('No stores.', lang)}
                loading={tab.loading}
                search={tab.search}
                onSearchChange={tab.setSearch}
                page={tab.page}
                totalPages={tab.totalPages}
                onPageChange={tab.setPage}
                totalCount={tab.filteredRows.length}
                lang={lang}
            />

            {tab.drawer && (
                <Drawer title={tab.form.storeid ? 'Edit Store' : 'Add Store'} onClose={tab.close} onSubmit={askSave} lang={lang}>

                    <div>
                        <label className={labelCls}>{t('Store Name', lang)}</label>
                        <input type="text" name="storename" value={tab.form.storename || ''} onChange={tab.handleChange} className={errors.storename ? fieldErrCls : fieldCls} />
                        {errors.storename && <p className="text-[11px] text-red-500 mt-1">{t(errors.storename, lang)}</p>}
                    </div>

                    <div>
                        <label className={labelCls}>{t('Email', lang)}</label>
                        <input type="text" name="email" value={tab.form.email || ''} onChange={tab.handleChange} className={errors.email ? fieldErrCls : fieldCls} placeholder="e.g. store@mail.com" />
                        {errors.email && <p className="text-[11px] text-red-500 mt-1">{t(errors.email, lang)}</p>}
                    </div>

                    <div>
                        <label className={labelCls}>{t('Phone Number', lang)}</label>
                        <input type="text" name="phone" value={tab.form.phone || ''} onChange={tab.handleChange} className={errors.phone ? fieldErrCls : fieldCls} placeholder="e.g. 0501234567" />
                        {errors.phone && <p className="text-[11px] text-red-500 mt-1">{t(errors.phone, lang)}</p>}
                    </div>

                    <div>
                        <label className={labelCls}>{t('Website URL', lang)}</label>
                        <input type="text" name="websiteurl" value={tab.form.websiteurl || ''} onChange={tab.handleChange} className={fieldCls} placeholder="https://..." />
                    </div>

                    <div>
                        <label className={labelCls}>{t('Rating', lang)} (1–5)</label>
                        <input type="number" name="rating" min="1" max="5" step="0.1" value={tab.form.rating || ''} onChange={tab.handleChange} className={fieldCls} />
                    </div>

                    <div>
                        <label className={labelCls}>Password</label>
                        <input type="password" name="password" value={tab.form.password || ''} onChange={tab.handleChange} className={fieldCls} placeholder={tab.form.storeid ? t('Leave blank to keep current', lang) : ''} />
                    </div>

                </Drawer>
            )}
        </>
    );
}
