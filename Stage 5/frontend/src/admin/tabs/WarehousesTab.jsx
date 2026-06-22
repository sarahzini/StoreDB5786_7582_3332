import { useState } from 'react';
import useTab from '../shared/useTab';
import DataTable from '../shared/DataTable';
import Drawer from '../shared/Drawer';
import { Toast, AddButton } from '../shared/ui';

const BASE = 'http://localhost:5000';
const fieldCls = "w-full mt-1.5 p-3 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-red-500 transition-all shadow-sm font-medium";
const labelCls = "block text-[10px] font-bold text-gray-400 tracking-[0.1em] uppercase mb-1";

const COLUMNS = [
    { key: 'region',   label: 'Region' },
    { key: 'address',  label: 'Address' },
    { key: 'managers', label: 'Managers' },
];

export default function WarehousesTab() {
    const t = useTab('/api/admin/warehouses', 'warehouseid');
    const [confirm, setConfirm] = useState(null);

    const askDelete = row => setConfirm({
        message: `Delete warehouse in "${row.region}"? All inventory stored here will also be removed.`,
        onConfirm: async () => {
            setConfirm(null);
            try {
                const res    = await fetch(`${BASE}/api/admin/warehouses/${row.warehouseid}`, { method: 'DELETE' });
                const result = await res.json();
                if (result.success) { t.setToast({ type: 'success', text: `Warehouse "${row.region}" deleted.` }); t.load(); }
                else t.setToast({ type: 'error', text: result.message || 'Cannot delete this warehouse.' });
            } catch { t.setToast({ type: 'error', text: 'Server error.' }); }
        },
    });

    const askSave = () => {
        const isEdit = !!t.form.warehouseid;
        setConfirm({
            message: isEdit ? `Save changes to warehouse "${t.form.region}"?` : `Add new warehouse in "${t.form.region}"?`,
            onConfirm: () => { setConfirm(null); doSave(); },
        });
    };

    const doSave = async () => {
        const isEdit = !!t.form.warehouseid;
        const url = isEdit ? `${BASE}/api/admin/warehouses/${t.form.warehouseid}` : `${BASE}/api/admin/warehouses`;
        try {
            const res = await fetch(url, { method: isEdit ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(t.form) });
            const result = await res.json();
            if (result.success) { t.setToast({ type: 'success', text: isEdit ? 'Warehouse updated.' : 'Warehouse added.' }); t.close(); t.load(); }
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
            <AddButton label="Warehouse" onClick={t.openAdd} />
            <DataTable columns={COLUMNS} rows={t.rows} onEdit={t.openEdit} onDelete={askDelete} emptyLabel="No warehouses."
                loading={t.loading} search={t.search} onSearchChange={t.setSearch}
                page={t.page} totalPages={t.totalPages} onPageChange={t.setPage} totalCount={t.filteredRows.length} />
            {t.drawer && (
                <Drawer title={t.form.warehouseid ? 'Edit Warehouse' : 'Add Warehouse'} onClose={t.close} onSubmit={askSave}>
                    <div><label className={labelCls}>Region</label><input type="text" name="region" value={t.form.region || ''} onChange={t.handleChange} className={fieldCls} placeholder="e.g. Jerusalem" /></div>
                    <div><label className={labelCls}>Address</label><input type="text" name="address" value={t.form.address || ''} onChange={t.handleChange} className={fieldCls} placeholder="e.g. Givat Shaul St 12" /></div>
                    <div><label className={labelCls}>Managers</label><input type="text" name="managers" value={t.form.managers || ''} onChange={t.handleChange} className={fieldCls} placeholder="e.g. Avi Cohen, Sara Levi" /></div>
                </Drawer>
            )}
        </>
    );
}
