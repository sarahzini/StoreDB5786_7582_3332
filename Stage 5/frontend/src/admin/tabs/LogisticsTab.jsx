import { useState, useEffect } from 'react';
import useTab from '../shared/useTab';
import DataTable from '../shared/DataTable';
import Drawer from '../shared/Drawer';
import { Toast, AddButton, Badge } from '../shared/ui';
import { Truck } from 'lucide-react';
import { t } from '../../translations';

const BASE = 'http://localhost:5000';
const MAINTENANCE_OPTIONS = ['Good', 'Fair', 'Maintenance Required', 'Not Good'];
const STATUS_COLORS = {
    'GOOD': 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    'FAIR': 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400',
    'MAINTENANCE REQUIRED': 'bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400',
    'NOT GOOD': 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400',
};
const fieldCls = "w-full mt-1.5 p-3 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-50 dark:focus:ring-red-900/30 text-gray-900 dark:text-white transition-all shadow-sm font-medium";
const labelCls = "block text-[10px] font-bold text-gray-400 tracking-[0.1em] uppercase mb-1";

// useEffect fixes the fetch
function OrdersPopup({ driverId, onClose, lang }) {
    const [orders, setOrders] = useState(null);
    useEffect(() => {
        fetch(`${BASE}/api/admin/drivers/${driverId}/orders`)
            .then(r => r.json()).then(setOrders).catch(() => setOrders([]));
    }, [driverId]);
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
            <div className="absolute inset-0 bg-black/30 dark:bg-black/60" onClick={onClose} />
            <div className="relative bg-white dark:!bg-transparent dark:bg-gradient-to-br dark:from-[#0B1120] dark:via-[#111827] dark:to-[#450a0a] rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4 border border-transparent dark:border-white/10">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white">{t("Today's Orders", lang)}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">✕</button>
                </div>
                {orders === null ? <p className="text-sm text-gray-400">{t('Loading...', lang)}</p>
                : orders.length === 0 ? <p className="text-sm text-gray-400 italic">{t('No deliveries scheduled for today.', lang)}</p>
                : <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {orders.map((o, i) => (
                        <div key={i} className="p-3 bg-gray-50 dark:bg-white/5 rounded-lg text-sm space-y-1 border border-transparent dark:border-white/5">
                            <div className="flex justify-between">
                                <span className="font-semibold text-gray-700 dark:text-gray-300">{t('Order', lang)} #{o.orderid}</span>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${o.status === 'DELIVERED' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : o.status === 'PENDING' ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400' : 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'}`}>{t(o.status, lang)}</span>
                            </div>
                            <div className="text-gray-500 dark:text-gray-400">₪ {parseFloat(o.price || 0).toFixed(2)} · {t(o.paymentmethod, lang)}</div>
                            {o.storeid && <div className="text-gray-400 text-[11px]">{t('Store', lang)} #{o.storeid}</div>}
                        </div>
                    ))}
                </div>}
            </div>
        </div>
    );
}

export default function LogisticsTab({ lang }) {
    const tab = useTab('/api/admin/drivers', 'driverid');
    const [confirm, setConfirm]                     = useState(null);
    const [deliveryCompanies, setDeliveryCompanies] = useState([]);
    const [ordersPopup, setOrdersPopup]             = useState(null);

    useEffect(() => {
        fetch(`${BASE}/api/admin/delivery`).then(r => r.json()).then(setDeliveryCompanies).catch(() => {});
    }, []);

    // parseInt to avoid type mismatch between string and number
    const enrichedRows = tab.filteredRows.map(r => ({
        ...r,
        deliveryciename: deliveryCompanies.find(d => parseInt(d.deliverycieid) === parseInt(r.deliverycieid))?.deliveryciename || '—',
    }));

    const COLUMNS = [
        { key: 'licenseplate', label: 'License Plate' },
        { key: 'capacity', label: 'Capacity', render: r => `${parseInt(r.capacity)} ${t('orders', lang)}` },
        { key: 'deliveryciename', label: 'Delivery Company' },
        { key: 'maintenancestatus', label: 'Maintenance', render: r => <Badge value={t(r.maintenancestatus, lang)} originalKey={r.maintenancestatus} colorMap={STATUS_COLORS} /> },
        { key: 'active', label: 'Status', render: r => (
            <Badge value={r.active === 1 || r.active === true ? t('Active', lang) : t('Offline', lang)} originalKey={r.active === 1 || r.active === true ? 'Active' : 'Offline'} colorMap={{ 'ACTIVE': 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400', 'OFFLINE': 'bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400' }} />
        )},
        { key: 'currentorder', label: "Today's Orders", render: r => (
            <button onClick={e => { e.stopPropagation(); setOrdersPopup(r.driverid); }}
                className="flex items-center gap-2 text-[11px] font-semibold px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 transition-all whitespace-nowrap">
                <Truck size={14} className="text-blue-500" /> {t('View', lang)}
            </button>
        )},
    ];

    const PAGE_SIZE  = tab.PAGE_SIZE;
    const totalPages = Math.max(1, Math.ceil(enrichedRows.length / PAGE_SIZE));
    const pagedRows  = enrichedRows.slice((tab.page - 1) * PAGE_SIZE, tab.page * PAGE_SIZE);

    // Empty email and password on add
    const openAdd  = () => { tab.openAdd(); tab.setForm({ licenseplate: '', capacity: '', deliverycieid: '', maintenancestatus: '', email: '', password: '' }); };
    const openEdit = row => tab.openEdit({ ...row, password: '' });

    const askDelete = row => setConfirm({
        message: `Delete truck "${row.licenseplate}"?`,
        onConfirm: async () => {
            setConfirm(null);
            try {
                const res = await fetch(`${BASE}/api/admin/drivers/${row.driverid}`, { method: 'DELETE' });
                const result = await res.json();
                if (result.success) { tab.setToast({ type: 'success', text: `"${row.licenseplate}" deleted.` }); tab.load(); }
                else tab.setToast({ type: 'error', text: result.message || 'Cannot delete this truck.' });
            } catch { tab.setToast({ type: 'error', text: 'Server error.' }); }
        },
    });

    const askSave = () => {
        const isEdit = !!tab.form.driverid;
        setConfirm({
            message: isEdit ? `Save changes to truck "${tab.form.licenseplate}"?` : `Add new truck "${tab.form.licenseplate}"?`,
            onConfirm: () => { setConfirm(null); doSave(); },
        });
    };

    const doSave = async () => {
        const isEdit = !!tab.form.driverid;
        const url = isEdit ? `${BASE}/api/admin/drivers/${tab.form.driverid}` : `${BASE}/api/admin/drivers`;
        try {
            const res = await fetch(url, { method: isEdit ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(tab.form) });
            const result = await res.json();
            if (result.success) { tab.setToast({ type: 'success', text: isEdit ? 'Updated.' : 'Added.' }); tab.close(); tab.load(); }
            else tab.setToast({ type: 'error', text: result.message || 'Error.' });
        } catch { tab.setToast({ type: 'error', text: 'Server error.' }); }
    };

    return (
        <>
            {tab.toast && <Toast message={t(tab.toast.text, lang)} type={tab.toast.type} onDone={() => tab.setToast(null)} />}
            {ordersPopup && <OrdersPopup driverId={ordersPopup} onClose={() => setOrdersPopup(null)} lang={lang} />}
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
            <AddButton label="Truck" onClick={openAdd} lang={lang} />
            <DataTable columns={COLUMNS} rows={pagedRows} onEdit={openEdit} onDelete={askDelete} emptyLabel={t('No trucks.', lang)}
                loading={tab.loading} search={tab.search} onSearchChange={tab.setSearch}
                page={tab.page} totalPages={totalPages} onPageChange={tab.setPage} totalCount={enrichedRows.length} lang={lang} />
            {tab.drawer && (
                <Drawer title={tab.form.driverid ? 'Edit Truck' : 'Add Truck'} onClose={tab.close} onSubmit={askSave} lang={lang}>
                    <div><label className={labelCls}>{t('License Plate', lang)}</label><input type="text" name="licenseplate" value={tab.form.licenseplate || ''} onChange={tab.handleChange} className={fieldCls} placeholder="e.g. 12-345-67" /></div>
                    <div><label className={labelCls}>{t('Capacity (orders)', lang)}</label>
                        <input type="number" name="capacity" step="1" min="1"
                            value={tab.form.capacity ? parseInt(tab.form.capacity) : ''}
                            onChange={e => tab.setForm(f => ({ ...f, capacity: parseInt(e.target.value) || '' }))}
                            className={fieldCls} placeholder="e.g. 50" />
                    </div>
                    <div><label className={labelCls}>{t('Delivery Company', lang)}</label>
                        <select name="deliverycieid" value={tab.form.deliverycieid || ''} onChange={tab.handleChange} className={fieldCls}>
                            <option value="">-- {t('Select company', lang)} --</option>
                            {deliveryCompanies.map(d => <option key={d.deliverycieid} value={d.deliverycieid}>{d.deliveryciename}</option>)}
                        </select>
                    </div>
                    <div><label className={labelCls}>{t('Maintenance Status', lang)}</label>
                        <select name="maintenancestatus" value={tab.form.maintenancestatus || ''} onChange={tab.handleChange} className={fieldCls}>
                            <option value="">-- {t('Select status', lang)} --</option>
                            {MAINTENANCE_OPTIONS.map(o => <option key={o} value={o}>{t(o, lang)}</option>)}
                        </select>
                    </div>
                    <div><label className={labelCls}>{t('Email', lang)}</label><input type="email" name="email" value={tab.form.email || ''} onChange={tab.handleChange} className={fieldCls} placeholder="e.g. driver@company.co.il" autoComplete="off" /></div>
                    <div><label className={labelCls}>{t('Password', lang)}</label><input type="password" name="password" value={tab.form.password || ''} onChange={tab.handleChange} className={fieldCls} placeholder={tab.form.driverid ? t('Leave blank to keep current', lang) : 'e.g. mypassword123'} autoComplete="new-password" /></div>
                </Drawer>
            )}
        </>
    );
}
