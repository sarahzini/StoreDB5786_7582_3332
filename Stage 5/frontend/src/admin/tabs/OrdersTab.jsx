import { useState, useEffect } from 'react';
import useTab from '../shared/useTab';
import DataTable from '../shared/DataTable';
import Drawer from '../shared/Drawer';
import { Toast, Badge } from '../shared/ui';

const BASE = 'http://localhost:5000';
const fieldCls    = "w-full mt-1.5 p-3 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-red-500 transition-all shadow-sm font-medium";
const fieldErrCls = "w-full mt-1.5 p-3 bg-white border border-red-400 rounded-lg text-sm outline-none focus:border-red-500 transition-all shadow-sm font-medium";
const labelCls    = "block text-[10px] font-bold text-gray-400 tracking-[0.1em] uppercase mb-1";

const STATUS_COLORS = {
    DELIVERED:     'bg-emerald-50 text-emerald-600',
    PENDING:       'bg-amber-50 text-amber-600',
    CANCELLED:     'bg-red-50 text-red-600',
    PROCESSING:    'bg-blue-50 text-blue-600',
    'IN PROGRESS': 'bg-purple-50 text-purple-600',
};
const STATUS_OPTIONS  = ['PENDING', 'PROCESSING', 'IN PROGRESS', 'DELIVERED', 'CANCELLED'];
const PAYMENT_OPTIONS = ['Credit Card', 'Cash', 'Store Request'];

// ─── Confirm modal ────────────────────────────────────────────────────────────
function ConfirmModal({ message, onConfirm, onCancel }) {
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
            <div className="absolute inset-0 bg-black/30" />
            <div className="relative bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
                <p className="text-sm text-gray-700 mb-6">{message}</p>
                <div className="flex gap-3 justify-end">
                    <button onClick={onCancel} className="px-5 py-2.5 rounded-lg text-[11px] font-bold uppercase text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors">Cancel</button>
                    <button onClick={onConfirm} className="px-5 py-2.5 rounded-lg text-[11px] font-bold uppercase text-white bg-red-600 hover:bg-red-700 transition-colors">Confirm</button>
                </div>
            </div>
        </div>
    );
}

// ─── Products popup — fetches contains for one order ─────────────────────────
function OrderItemsPopup({ orderId, onClose }) {
    const [items, setItems] = useState(null);
    useEffect(() => {
        fetch(`${BASE}/api/admin/orders/${orderId}/items`)
            .then(r => r.json()).then(setItems).catch(() => setItems([]));
    }, [orderId]);
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
            <div className="absolute inset-0 bg-black/30" onClick={onClose} />
            <div className="relative bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-gray-900">Order #{orderId} — Products</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg leading-none">✕</button>
                </div>
                {items === null ? (
                    <p className="text-sm text-gray-400">Loading...</p>
                ) : items.length === 0 ? (
                    <p className="text-sm text-gray-400 italic">No products found for this order.</p>
                ) : (
                    <div className="space-y-2 max-h-72 overflow-y-auto">
                        {items.map((item, i) => (
                            <div key={i} className="p-3 bg-gray-50 rounded-lg text-sm flex items-center justify-between">
                                <div>
                                    <span className="font-semibold text-gray-800">{item.productname}</span>
                                    {item.inonsale && <span className="ml-2 text-[9px] font-bold px-1.5 py-0.5 bg-red-50 text-red-500 rounded uppercase">Sale</span>}
                                    {item.saledescription && <p className="text-[11px] text-gray-400 mt-0.5">{item.saledescription}</p>}
                                </div>
                                <div className="text-right flex-shrink-0 ml-4">
                                    <div className="text-gray-500 text-[11px]">Qty: {item.quantity}</div>
                                    <div className="font-semibold text-emerald-600">₪ {parseFloat(item.subtotal || 0).toFixed(2)}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Shared helpers ───────────────────────────────────────────────────────────
const getName = (list, idKey, nameKey, id) =>
    list.find(x => parseInt(x[idKey]) === parseInt(id))?.[nameKey] || '—';

// View button column — used in both sub-tabs
const makeViewColumn = (setPopup) => ({
    key: 'items', label: 'Products', render: r => (
        <button onClick={e => { e.stopPropagation(); setPopup(r.orderid); }}
            className="text-[11px] font-semibold px-3 py-1.5 rounded-lg border border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100 transition-all whitespace-nowrap">
            🛒 View
        </button>
    )
});

// ─── Customer Orders sub-tab ──────────────────────────────────────────────────
function CustomerOrdersTab({ customers, stores }) {
    const t = useTab('/api/admin/orders', 'orderid');
    const [confirm, setConfirm] = useState(null);
    const [errors, setErrors]   = useState({});
    const [itemsPopup, setItemsPopup] = useState(null);

    const COLUMNS = [
        { key: 'customer', label: 'Customer', render: r => getName(customers, 'customerid', 'customername', r.customerid) },
        { key: 'store',    label: 'Store',    render: r => getName(stores,    'storeid',    'storename',    r.storeid) },
        { key: 'price',    label: 'Total',    render: r => `₪ ${parseFloat(r.price || 0).toFixed(2)}` },
        { key: 'paymentmethod', label: 'Payment' },
        { key: 'status',   label: 'Status',   render: r => <Badge value={r.status} colorMap={STATUS_COLORS} /> },
        { key: 'orderdate', label: 'Date',    render: r => r.orderdate ? new Date(r.orderdate).toLocaleDateString() : '—' },
        makeViewColumn(setItemsPopup),
    ];

    // Only customer orders
    const rows       = t.filteredRows.filter(r => r.customerid !== null);
    const PAGE_SIZE  = t.PAGE_SIZE;
    const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
    const pagedRows  = rows.slice((t.page - 1) * PAGE_SIZE, t.page * PAGE_SIZE);

    const validate = () => {
        const e = {};
        if (!t.form.customerid) e.customerid = 'Please select a customer.';
        if (!t.form.storeid)    e.storeid    = 'Please select a store.';
        if (!t.form.price || parseFloat(t.form.price) <= 0) e.price = 'Price must be greater than 0.';
        if (!t.form.status)     e.status     = 'Please select a status.';
        if (!t.form.paymentmethod) e.paymentmethod = 'Please select a payment method.';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const openAdd  = () => { t.openAdd();  setErrors({}); };
    const openEdit = row => { t.openEdit(row); setErrors({}); };

    const askDelete = row => setConfirm({
        message: `Delete order #${row.orderid} for "${getName(customers, 'customerid', 'customername', row.customerid)}"?`,
        onConfirm: async () => {
            setConfirm(null);
            try {
                const res = await fetch(`${BASE}/api/admin/orders/${row.orderid}`, { method: 'DELETE' });
                const result = await res.json();
                if (result.success) { t.setToast({ type: 'success', text: 'Order deleted.' }); t.load(); }
                else t.setToast({ type: 'error', text: result.message || 'Cannot delete.' });
            } catch { t.setToast({ type: 'error', text: 'Server error.' }); }
        },
    });

    const askSave = () => {
        if (!validate()) return;
        const isEdit = !!t.form.orderid;
        setConfirm({
            message: isEdit ? `Save changes to order #${t.form.orderid}?` : 'Add new customer order?',
            onConfirm: () => { setConfirm(null); doSave(); },
        });
    };

    const doSave = async () => {
        const isEdit = !!t.form.orderid;
        const url = isEdit ? `${BASE}/api/admin/orders/${t.form.orderid}` : `${BASE}/api/admin/orders`;
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
            {confirm && <ConfirmModal message={confirm.message} onConfirm={confirm.onConfirm} onCancel={() => setConfirm(null)} />}
            {itemsPopup && <OrderItemsPopup orderId={itemsPopup} onClose={() => setItemsPopup(null)} />}

            <div className="flex justify-end mb-4">
                <button onClick={openAdd} className="flex items-center gap-2 bg-[#0B1120] text-white px-4 py-2.5 rounded-lg text-[11px] font-bold tracking-[0.12em] hover:bg-red-600 transition-all uppercase">
                    + Add Customer Order
                </button>
            </div>

            <DataTable columns={COLUMNS} rows={pagedRows} onEdit={openEdit} onDelete={askDelete} emptyLabel="No customer orders."
                loading={t.loading} search={t.search} onSearchChange={t.setSearch}
                page={t.page} totalPages={totalPages} onPageChange={t.setPage} totalCount={rows.length} />

            {t.drawer && (
                <Drawer title={t.form.orderid ? 'Edit Customer Order' : 'Add Customer Order'} onClose={t.close} onSubmit={askSave}>
                    <div>
                        <label className={labelCls}>Customer</label>
                        <select name="customerid" value={t.form.customerid || ''} onChange={t.handleChange} className={errors.customerid ? fieldErrCls : fieldCls}>
                            <option value="">-- Select customer --</option>
                            {customers.map(c => <option key={c.customerid} value={c.customerid}>{c.customername}</option>)}
                        </select>
                        {errors.customerid && <p className="text-[11px] text-red-500 mt-1">{errors.customerid}</p>}
                    </div>
                    <div>
                        <label className={labelCls}>Store</label>
                        <select name="storeid" value={t.form.storeid || ''} onChange={t.handleChange} className={errors.storeid ? fieldErrCls : fieldCls}>
                            <option value="">-- Select store --</option>
                            {stores.map(s => <option key={s.storeid} value={s.storeid}>{s.storename}</option>)}
                        </select>
                        {errors.storeid && <p className="text-[11px] text-red-500 mt-1">{errors.storeid}</p>}
                    </div>
                    {/* Driver is auto-assigned — not selectable */}
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                        <p className="text-[10px] font-bold text-gray-400 tracking-[0.1em] uppercase mb-1">Driver</p>
                        <p className="text-sm text-gray-500 italic">Auto-assigned by the system</p>
                    </div>
                    <div>
                        <label className={labelCls}>Total (₪)</label>
                        <input type="number" step="0.01" name="price" value={t.form.price || ''} onChange={t.handleChange} className={errors.price ? fieldErrCls : fieldCls} placeholder="e.g. 149.90" />
                        {errors.price && <p className="text-[11px] text-red-500 mt-1">{errors.price}</p>}
                    </div>
                    <div>
                        <label className={labelCls}>Status</label>
                        <select name="status" value={t.form.status || ''} onChange={t.handleChange} className={errors.status ? fieldErrCls : fieldCls}>
                            <option value="">-- Select status --</option>
                            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        {errors.status && <p className="text-[11px] text-red-500 mt-1">{errors.status}</p>}
                    </div>
                    <div>
                        <label className={labelCls}>Payment Method</label>
                        <select name="paymentmethod" value={t.form.paymentmethod || ''} onChange={t.handleChange} className={errors.paymentmethod ? fieldErrCls : fieldCls}>
                            <option value="">-- Select --</option>
                            {PAYMENT_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                        {errors.paymentmethod && <p className="text-[11px] text-red-500 mt-1">{errors.paymentmethod}</p>}
                    </div>
                    <div>
                        <label className={labelCls}>Order Date</label>
                        <input type="date" name="orderdate" value={t.form.orderdate?.split('T')[0] || ''} onChange={t.handleChange} className={fieldCls} />
                    </div>
                </Drawer>
            )}
        </>
    );
}

// ─── Store Restock Orders sub-tab ─────────────────────────────────────────────
function StoreOrdersTab({ stores }) {
    const t = useTab('/api/admin/orders', 'orderid');
    const [confirm, setConfirm] = useState(null);
    const [errors, setErrors]   = useState({});
    const [itemsPopup, setItemsPopup] = useState(null);

    const COLUMNS = [
        { key: 'store',  label: 'Store',   render: r => getName(stores, 'storeid', 'storename', r.storeid) },
        { key: 'price',  label: 'Total',   render: r => `₪ ${parseFloat(r.price || 0).toFixed(2)}` },
        { key: 'paymentmethod', label: 'Payment' },
        { key: 'status', label: 'Status',  render: r => <Badge value={r.status} colorMap={STATUS_COLORS} /> },
        { key: 'orderdate', label: 'Date', render: r => r.orderdate ? new Date(r.orderdate).toLocaleDateString() : '—' },
        makeViewColumn(setItemsPopup),
    ];

    // Only store restock orders (customerid is null)
    const rows       = t.filteredRows.filter(r => r.customerid === null);
    const PAGE_SIZE  = t.PAGE_SIZE;
    const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
    const pagedRows  = rows.slice((t.page - 1) * PAGE_SIZE, t.page * PAGE_SIZE);

    const validate = () => {
        const e = {};
        if (!t.form.storeid) e.storeid = 'Please select a store.';
        if (!t.form.price || parseFloat(t.form.price) <= 0) e.price = 'Price must be greater than 0.';
        if (!t.form.status)  e.status  = 'Please select a status.';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const openAdd  = () => { t.openAdd(); t.setForm({ customerid: null }); setErrors({}); };
    const openEdit = row => { t.openEdit(row); setErrors({}); };

    const askDelete = row => setConfirm({
        message: `Delete restock order #${row.orderid} for store "${getName(stores, 'storeid', 'storename', row.storeid)}"?`,
        onConfirm: async () => {
            setConfirm(null);
            try {
                const res = await fetch(`${BASE}/api/admin/orders/${row.orderid}`, { method: 'DELETE' });
                const result = await res.json();
                if (result.success) { t.setToast({ type: 'success', text: 'Order deleted.' }); t.load(); }
                else t.setToast({ type: 'error', text: result.message || 'Cannot delete.' });
            } catch { t.setToast({ type: 'error', text: 'Server error.' }); }
        },
    });

    const askSave = () => {
        if (!validate()) return;
        const isEdit = !!t.form.orderid;
        setConfirm({
            message: isEdit ? `Save changes to order #${t.form.orderid}?` : 'Add new store restock order?',
            onConfirm: () => { setConfirm(null); doSave(); },
        });
    };

    const doSave = async () => {
        const isEdit = !!t.form.orderid;
        const url = isEdit ? `${BASE}/api/admin/orders/${t.form.orderid}` : `${BASE}/api/admin/orders`;
        // customerid always null for store restocks
        const body = { ...t.form, customerid: null };
        try {
            const res = await fetch(url, { method: isEdit ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
            const result = await res.json();
            if (result.success) { t.setToast({ type: 'success', text: isEdit ? 'Updated.' : 'Added.' }); t.close(); t.load(); }
            else t.setToast({ type: 'error', text: result.message || 'Error.' });
        } catch { t.setToast({ type: 'error', text: 'Server error.' }); }
    };

    return (
        <>
            {t.toast && <Toast message={t.toast.text} type={t.toast.type} onDone={() => t.setToast(null)} />}
            {confirm && <ConfirmModal message={confirm.message} onConfirm={confirm.onConfirm} onCancel={() => setConfirm(null)} />}
            {itemsPopup && <OrderItemsPopup orderId={itemsPopup} onClose={() => setItemsPopup(null)} />}

            <div className="flex justify-end mb-4">
                <button onClick={openAdd} className="flex items-center gap-2 bg-[#0B1120] text-white px-4 py-2.5 rounded-lg text-[11px] font-bold tracking-[0.12em] hover:bg-red-600 transition-all uppercase">
                    + Add Store Order
                </button>
            </div>

            <DataTable columns={COLUMNS} rows={pagedRows} onEdit={openEdit} onDelete={askDelete} emptyLabel="No store restock orders."
                loading={t.loading} search={t.search} onSearchChange={t.setSearch}
                page={t.page} totalPages={totalPages} onPageChange={t.setPage} totalCount={rows.length} />

            {t.drawer && (
                <Drawer title={t.form.orderid ? 'Edit Store Order' : 'Add Store Order'} onClose={t.close} onSubmit={askSave}>
                    <div>
                        <label className={labelCls}>Store</label>
                        <select name="storeid" value={t.form.storeid || ''} onChange={t.handleChange} className={errors.storeid ? fieldErrCls : fieldCls}>
                            <option value="">-- Select store --</option>
                            {stores.map(s => <option key={s.storeid} value={s.storeid}>{s.storename}</option>)}
                        </select>
                        {errors.storeid && <p className="text-[11px] text-red-500 mt-1">{errors.storeid}</p>}
                    </div>
                    {/* Driver auto-assigned */}
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                        <p className="text-[10px] font-bold text-gray-400 tracking-[0.1em] uppercase mb-1">Driver</p>
                        <p className="text-sm text-gray-500 italic">Auto-assigned by the system</p>
                    </div>
                    <div>
                        <label className={labelCls}>Total (₪)</label>
                        <input type="number" step="0.01" name="price" value={t.form.price || ''} onChange={t.handleChange} className={errors.price ? fieldErrCls : fieldCls} placeholder="e.g. 500.00" />
                        {errors.price && <p className="text-[11px] text-red-500 mt-1">{errors.price}</p>}
                    </div>
                    <div>
                        <label className={labelCls}>Status</label>
                        <select name="status" value={t.form.status || ''} onChange={t.handleChange} className={errors.status ? fieldErrCls : fieldCls}>
                            <option value="">-- Select status --</option>
                            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        {errors.status && <p className="text-[11px] text-red-500 mt-1">{errors.status}</p>}
                    </div>
                    <div>
                        <label className={labelCls}>Payment Method</label>
                        <select name="paymentmethod" value={t.form.paymentmethod || ''} onChange={t.handleChange} className={fieldCls}>
                            <option value="">-- Select --</option>
                            {PAYMENT_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className={labelCls}>Order Date</label>
                        <input type="date" name="orderdate" value={t.form.orderdate?.split('T')[0] || ''} onChange={t.handleChange} className={fieldCls} />
                    </div>
                </Drawer>
            )}
        </>
    );
}

// ─── Main OrdersTab ───────────────────────────────────────────────────────────
export default function OrdersTab() {
    const [activeSubTab, setActiveSubTab] = useState('customer');
    const [customers, setCustomers] = useState([]);
    const [stores, setStores]       = useState([]);

    useEffect(() => {
        fetch(`${BASE}/api/admin/customers`).then(r => r.json()).then(setCustomers).catch(() => {});
        fetch(`${BASE}/api/admin/stores`).then(r => r.json()).then(setStores).catch(() => {});
    }, []);

    return (
        <div>
            <div className="flex gap-1 mb-6 bg-gray-100 rounded-xl p-1 w-fit">
                <button
                    onClick={() => setActiveSubTab('customer')}
                    className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${activeSubTab === 'customer' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    👤 Customer Orders
                </button>
                <button
                    onClick={() => setActiveSubTab('store')}
                    className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${activeSubTab === 'store' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    🏪 Store Restocks
                </button>
            </div>

            {activeSubTab === 'customer'
                ? <CustomerOrdersTab customers={customers} stores={stores} />
                : <StoreOrdersTab stores={stores} />
            }
        </div>
    );
}
