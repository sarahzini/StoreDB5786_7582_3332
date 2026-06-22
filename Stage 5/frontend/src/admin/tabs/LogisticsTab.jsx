import { useState, useEffect } from 'react';
import useTab from '../shared/useTab';
import DataTable from '../shared/DataTable';
import Drawer from '../shared/Drawer';
import { Toast, AddButton, Badge } from '../shared/ui';

const BASE = 'http://localhost:5000';
const MAINTENANCE_OPTIONS = ['Good', 'Fair', 'Maintenance Required', 'Not Good'];
const STATUS_COLORS = {
    'GOOD': 'bg-emerald-50 text-emerald-600',
    'FAIR': 'bg-amber-50 text-amber-600',
    'MAINTENANCE REQUIRED': 'bg-orange-50 text-orange-600',
    'NOT GOOD': 'bg-red-50 text-red-600',
};
const fieldCls = "w-full mt-1.5 p-3 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-red-500 transition-all shadow-sm font-medium";
const labelCls = "block text-[10px] font-bold text-gray-400 tracking-[0.1em] uppercase mb-1";

// useEffect fixes the fetch
function OrdersPopup({ driverId, onClose }) {
    const [orders, setOrders] = useState(null);
    useEffect(() => {
        fetch(`${BASE}/api/admin/drivers/${driverId}/orders`)
            .then(r => r.json()).then(setOrders).catch(() => setOrders([]));
    }, [driverId]);
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
            <div className="absolute inset-0 bg-black/30" onClick={onClose} />
            <div className="relative bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-gray-900">Today's Orders</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
                </div>
                {orders === null ? <p className="text-sm text-gray-400">Loading...</p>
                : orders.length === 0 ? <p className="text-sm text-gray-400 italic">No deliveries scheduled for today.</p>
                : <div className="space-y-2 max-h-64 overflow-y-auto">
                    {orders.map((o, i) => (
                        <div key={i} className="p-3 bg-gray-50 rounded-lg text-sm space-y-1">
                            <div className="flex justify-between">
                                <span className="font-semibold text-gray-700">Order #{o.orderid}</span>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${o.status === 'DELIVERED' ? 'bg-emerald-50 text-emerald-600' : o.status === 'PENDING' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>{o.status}</span>
                            </div>
                            <div className="text-gray-500">₪ {parseFloat(o.price || 0).toFixed(2)} · {o.paymentmethod}</div>
                            {o.storeid && <div className="text-gray-400 text-[11px]">Store #{o.storeid}</div>}
                        </div>
                    ))}
                </div>}
            </div>
        </div>
    );
}

export default function LogisticsTab() {
    const t = useTab('/api/admin/drivers', 'driverid');
    const [confirm, setConfirm]                     = useState(null);
    const [deliveryCompanies, setDeliveryCompanies] = useState([]);
    const [ordersPopup, setOrdersPopup]             = useState(null);

    useEffect(() => {
        fetch(`${BASE}/api/admin/delivery`).then(r => r.json()).then(setDeliveryCompanies).catch(() => {});
    }, []);

    // parseInt to avoid type mismatch between string and number
    const enrichedRows = t.filteredRows.map(r => ({
        ...r,
        deliveryciename: deliveryCompanies.find(d => parseInt(d.deliverycieid) === parseInt(r.deliverycieid))?.deliveryciename || '—',
    }));

    const COLUMNS = [
        { key: 'licenseplate', label: 'License Plate' },
        { key: 'capacity', label: 'Capacity', render: r => `${parseInt(r.capacity)} orders` },
        { key: 'deliveryciename', label: 'Delivery Company' },
        { key: 'maintenancestatus', label: 'Maintenance', render: r => <Badge value={r.maintenancestatus} colorMap={STATUS_COLORS} /> },
        { key: 'active', label: 'Status', render: r => (
            <Badge value={r.active === 1 || r.active === true ? 'Active' : 'Offline'} colorMap={{ ACTIVE: 'bg-blue-50 text-blue-600', OFFLINE: 'bg-gray-100 text-gray-500' }} />
        )},
        { key: 'currentorder', label: "Today's Orders", render: r => (
            <button onClick={e => { e.stopPropagation(); setOrdersPopup(r.driverid); }}
                className="text-[11px] font-semibold px-3 py-1.5 rounded-lg border border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100 transition-all whitespace-nowrap">
                🚚 View
            </button>
        )},
    ];

    const PAGE_SIZE  = t.PAGE_SIZE;
    const totalPages = Math.max(1, Math.ceil(enrichedRows.length / PAGE_SIZE));
    const pagedRows  = enrichedRows.slice((t.page - 1) * PAGE_SIZE, t.page * PAGE_SIZE);

    // Empty email and password on add
    const openAdd  = () => { t.openAdd(); t.setForm({ licenseplate: '', capacity: '', deliverycieid: '', maintenancestatus: '', email: '', password: '' }); };
    const openEdit = row => t.openEdit({ ...row, password: '' });

    const askDelete = row => setConfirm({
        message: `Delete truck "${row.licenseplate}"?`,
        onConfirm: async () => {
            setConfirm(null);
            try {
                const res = await fetch(`${BASE}/api/admin/drivers/${row.driverid}`, { method: 'DELETE' });
                const result = await res.json();
                if (result.success) { t.setToast({ type: 'success', text: `"${row.licenseplate}" deleted.` }); t.load(); }
                else t.setToast({ type: 'error', text: result.message || 'Cannot delete this truck.' });
            } catch { t.setToast({ type: 'error', text: 'Server error.' }); }
        },
    });

    const askSave = () => {
        const isEdit = !!t.form.driverid;
        setConfirm({
            message: isEdit ? `Save changes to truck "${t.form.licenseplate}"?` : `Add new truck "${t.form.licenseplate}"?`,
            onConfirm: () => { setConfirm(null); doSave(); },
        });
    };

    const doSave = async () => {
        const isEdit = !!t.form.driverid;
        const url = isEdit ? `${BASE}/api/admin/drivers/${t.form.driverid}` : `${BASE}/api/admin/drivers`;
        try {
            const res = await fetch(url, { method: isEdit ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(t.form) });
            const result = await res.json();
            if (result.success) { t.setToast({ type: 'success', text: isEdit ? 'Updated.' : 'Added.' }); t.close(); t.load(); }
            else t.setToast({ type: 'error', text: result.message || 'Error.' });
        } catch { t.setToast({ type: 'error', text: 'Server error.' }); }
    };

    return (
        <>
            {t.toast && <Toast message={t.toast.text} type={t.toast.type} onDone={() => t.setToast(null)} />}
            {ordersPopup && <OrdersPopup driverId={ordersPopup} onClose={() => setOrdersPopup(null)} />}
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
            <AddButton label="Truck" onClick={openAdd} />
            <DataTable columns={COLUMNS} rows={pagedRows} onEdit={openEdit} onDelete={askDelete} emptyLabel="No trucks."
                loading={t.loading} search={t.search} onSearchChange={t.setSearch}
                page={t.page} totalPages={totalPages} onPageChange={t.setPage} totalCount={enrichedRows.length} />
            {t.drawer && (
                <Drawer title={t.form.driverid ? 'Edit Truck' : 'Add Truck'} onClose={t.close} onSubmit={askSave}>
                    <div><label className={labelCls}>License Plate</label><input type="text" name="licenseplate" value={t.form.licenseplate || ''} onChange={t.handleChange} className={fieldCls} placeholder="e.g. 12-345-67" /></div>
                    <div><label className={labelCls}>Capacity (orders)</label>
                        <input type="number" name="capacity" step="1" min="1"
                            value={t.form.capacity ? parseInt(t.form.capacity) : ''}
                            onChange={e => t.setForm(f => ({ ...f, capacity: parseInt(e.target.value) || '' }))}
                            className={fieldCls} placeholder="e.g. 50" />
                    </div>
                    <div><label className={labelCls}>Delivery Company</label>
                        <select name="deliverycieid" value={t.form.deliverycieid || ''} onChange={t.handleChange} className={fieldCls}>
                            <option value="">-- Select company --</option>
                            {deliveryCompanies.map(d => <option key={d.deliverycieid} value={d.deliverycieid}>{d.deliveryciename}</option>)}
                        </select>
                    </div>
                    <div><label className={labelCls}>Maintenance Status</label>
                        <select name="maintenancestatus" value={t.form.maintenancestatus || ''} onChange={t.handleChange} className={fieldCls}>
                            <option value="">-- Select status --</option>
                            {MAINTENANCE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                    </div>
                    <div><label className={labelCls}>Email</label><input type="email" name="email" value={t.form.email || ''} onChange={t.handleChange} className={fieldCls} placeholder="e.g. driver@company.co.il" autoComplete="off" /></div>
                    <div><label className={labelCls}>Password</label><input type="password" name="password" value={t.form.password || ''} onChange={t.handleChange} className={fieldCls} placeholder={t.form.driverid ? 'Leave blank to keep current' : 'e.g. mypassword123'} autoComplete="new-password" /></div>
                </Drawer>
            )}
        </>
    );
}
