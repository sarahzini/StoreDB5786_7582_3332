import { useState } from 'react';
import useTab from '../shared/useTab';
import DataTable from '../shared/DataTable';
import Drawer from '../shared/Drawer';
import { Toast, AddButton } from '../shared/ui';
import { t } from '../../translations';

const BASE = 'http://localhost:5000';
const fieldCls = "w-full mt-1.5 p-3 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-50 dark:focus:ring-red-900/30 text-gray-900 dark:text-white transition-all shadow-sm font-medium";
const labelCls = "block text-[10px] font-bold text-gray-400 tracking-[0.1em] uppercase mb-1";

const COLUMNS = [
    { key: 'region',   label: 'Region' },
    { key: 'address',  label: 'Address' },
    { key: 'managers', label: 'Managers' },
];

export default function WarehousesTab({ lang }) {
    const tab = useTab('/api/admin/warehouses', 'warehouseid');
    const [confirm, setConfirm] = useState(null);

    const askDelete = row => setConfirm({
        message: `Delete warehouse in "${row.region}"? All inventory stored here will also be removed.`,
        onConfirm: async () => {
            setConfirm(null);
            try {
                const res    = await fetch(`${BASE}/api/admin/warehouses/${row.warehouseid}`, { method: 'DELETE' });
                const result = await res.json();
                if (result.success) { tab.setToast({ type: 'success', text: `Warehouse "${row.region}" deleted.` }); tab.load(); }
                else tab.setToast({ type: 'error', text: result.message || 'Cannot delete this warehouse.' });
            } catch { tab.setToast({ type: 'error', text: 'Server error.' }); }
        },
    });

    const askSave = () => {
        const isEdit = !!tab.form.warehouseid;
        setConfirm({
            message: isEdit ? `Save changes to warehouse "${tab.form.region}"?` : `Add new warehouse in "${tab.form.region}"?`,
            onConfirm: () => { setConfirm(null); doSave(); },
        });
    };

    const doSave = async () => {
        const isEdit = !!tab.form.warehouseid;
        const url = isEdit ? `${BASE}/api/admin/warehouses/${tab.form.warehouseid}` : `${BASE}/api/admin/warehouses`;
        try {
            const res = await fetch(url, { method: isEdit ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(tab.form) });
            const result = await res.json();
            if (result.success) { tab.setToast({ type: 'success', text: isEdit ? 'Warehouse updated.' : 'Warehouse added.' }); tab.close(); tab.load(); }
            else tab.setToast({ type: 'error', text: result.message || 'Error saving.' });
        } catch { tab.setToast({ type: 'error', text: 'Server error.' }); }
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
            <AddButton label="Warehouse" onClick={tab.openAdd} lang={lang} />
            <DataTable columns={COLUMNS} rows={tab.rows} onEdit={tab.openEdit} onDelete={askDelete} emptyLabel={t('No warehouses.', lang)}
                loading={tab.loading} search={tab.search} onSearchChange={tab.setSearch}
                page={tab.page} totalPages={tab.totalPages} onPageChange={tab.setPage} totalCount={tab.filteredRows.length} lang={lang} />
            {tab.drawer && (
                <Drawer title={tab.form.warehouseid ? 'Edit Warehouse' : 'Add Warehouse'} onClose={tab.close} onSubmit={askSave} lang={lang}>
                    <div><label className={labelCls}>{t('Region', lang)}</label><input type="text" name="region" value={tab.form.region || ''} onChange={tab.handleChange} className={fieldCls} placeholder="e.g. Jerusalem" /></div>
                    <div><label className={labelCls}>{t('Address', lang)}</label><input type="text" name="address" value={tab.form.address || ''} onChange={tab.handleChange} className={fieldCls} placeholder="e.g. Givat Shaul St 12" /></div>
                    <div><label className={labelCls}>{t('Managers', lang)}</label><input type="text" name="managers" value={tab.form.managers || ''} onChange={tab.handleChange} className={fieldCls} placeholder="e.g. Avi Cohen, Sara Levi" /></div>
                </Drawer>
            )}
        </>
    );
}
