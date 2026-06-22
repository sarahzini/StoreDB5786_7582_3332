import { useState, useEffect } from 'react';
import useTab from '../shared/useTab';
import DataTable from '../shared/DataTable';
import Drawer from '../shared/Drawer';
import { Toast, Badge } from '../shared/ui';
import { ShoppingCart, User, Store } from 'lucide-react';
import { t } from '../../translations';

const BASE = 'http://localhost:5000';
const fieldCls    = "w-full mt-1.5 p-3 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-50 dark:focus:ring-red-900/30 text-gray-900 dark:text-white transition-all shadow-sm font-medium";
const fieldErrCls = "w-full mt-1.5 p-3 bg-white dark:bg-white/5 border border-red-400 dark:border-red-500/50 rounded-lg text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-50 dark:focus:ring-red-900/30 text-gray-900 dark:text-white transition-all shadow-sm font-medium";
const labelCls    = "block text-[10px] font-bold text-gray-400 tracking-[0.1em] uppercase mb-1";

const STATUS_COLORS = {
    DELIVERED:     'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    PENDING:       'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400',
    CANCELLED:     'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400',
    PROCESSING:    'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400',
    'IN PROGRESS': 'bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400',
};
const STATUS_OPTIONS  = ['PENDING', 'PROCESSING', 'IN PROGRESS', 'DELIVERED', 'CANCELLED'];
const PAYMENT_OPTIONS = ['Credit Card', 'Cash', 'Store Request'];

// ─── Confirm modal ────────────────────────────────────────────────────────────
function ConfirmModal({ message, onConfirm, onCancel, lang }) {
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
            <div className="absolute inset-0 bg-black/30 dark:bg-black/60" />
            <div className="relative bg-white dark:!bg-transparent dark:bg-gradient-to-br dark:from-[#0B1120] dark:via-[#111827] dark:to-[#450a0a] rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 border border-transparent dark:border-white/10">
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-6">{message}</p>
                <div className="flex gap-3 justify-end">
                    <button onClick={onCancel} className="px-5 py-2.5 rounded-lg text-[11px] font-bold uppercase text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors">{t('Cancel', lang)}</button>
                    <button onClick={onConfirm} className="px-5 py-2.5 rounded-lg text-[11px] font-bold uppercase text-white bg-red-600 hover:bg-red-700 transition-colors">{t('Confirm', lang)}</button>
                </div>
            </div>
        </div>
    );
}

// ─── Products popup — fetches contains for one order ─────────────────────────
function OrderItemsPopup({ orderId, onClose, lang }) {
    const [items, setItems] = useState(null);
    useEffect(() => {
        fetch(`${BASE}/api/admin/orders/${orderId}/items`)
            .then(r => r.json()).then(setItems).catch(() => setItems([]));
    }, [orderId]);
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
            <div className="absolute inset-0 bg-black/30 dark:bg-black/60" onClick={onClose} />
            <div className="relative bg-white dark:!bg-transparent dark:bg-gradient-to-br dark:from-[#0B1120] dark:via-[#111827] dark:to-[#450a0a] rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4 border border-transparent dark:border-white/10">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white">{t('Order', lang)} #{orderId} — {t('Products', lang)}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-lg leading-none">✕</button>
                </div>
                {items === null ? (
                    <p className="text-sm text-gray-400">{t('Loading...', lang)}</p>
                ) : items.length === 0 ? (
                    <p className="text-sm text-gray-400 italic">{t('No products found for this order.', lang)}</p>
                ) : (
                    <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                        {items.map((item, i) => (
                            <div key={i} className="p-3 bg-gray-50 dark:bg-white/5 rounded-lg text-sm flex items-center justify-between border border-transparent dark:border-white/5">
                                <div>
                                    <span className="font-semibold text-gray-800 dark:text-gray-200">{t(item.productname, lang)}</span>
                                    {item.inonsale && <span className="ml-2 text-[9px] font-bold px-1.5 py-0.5 bg-red-50 dark:bg-red-500/10 text-red-500 dark:text-red-400 rounded uppercase">{t('Sale', lang)}</span>}
                                    {item.saledescription && <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">{t(item.saledescription, lang)}</p>}
                                </div>
                                <div className="text-right flex-shrink-0 ml-4">
                                    <div className="text-gray-500 dark:text-gray-400 text-[11px]">{t('Qty', lang)}: {item.quantity}</div>
                                    <div className="font-semibold text-emerald-600 dark:text-emerald-400">₪ {parseFloat(item.subtotal || 0).toFixed(2)}</div>
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
const makeViewColumn = (setPopup, lang) => ({
    key: 'items', label: 'Products', render: r => (
        <button onClick={e => { e.stopPropagation(); setPopup(r.orderid); }}
            className="flex items-center gap-2 text-[11px] font-semibold px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 transition-all whitespace-nowrap">
            <ShoppingCart size={14} className="text-blue-500" /> {t('View', lang)}
        </button>
    )
});

// ─── Customer Orders sub-tab ──────────────────────────────────────────────────
function CustomerOrdersTab({ customers, stores, lang }) {
    const tab = useTab('/api/admin/orders', 'orderid');
    const [confirm, setConfirm] = useState(null);
    const [errors, setErrors]   = useState({});
    const [itemsPopup, setItemsPopup] = useState(null);

    const COLUMNS = [
        { key: 'customer', label: 'Customer', render: r => getName(customers, 'customerid', 'customername', r.customerid) },
        { key: 'store',    label: 'Store',    render: r => getName(stores,    'storeid',    'storename',    r.storeid) },
        { key: 'price',    label: 'Total',    render: r => `₪ ${parseFloat(r.price || 0).toFixed(2)}` },
        { key: 'paymentmethod', label: 'Payment', render: r => t(r.paymentmethod, lang) },
        { key: 'status',   label: 'Status',   render: r => <Badge value={t(r.status, lang)} originalKey={r.status} colorMap={STATUS_COLORS} /> },
        { key: 'orderdate', label: 'Date',    render: r => r.orderdate ? new Date(r.orderdate).toLocaleDateString() : '—' },
        makeViewColumn(setItemsPopup, lang),
    ];

    // Only customer orders
    const rows       = tab.filteredRows.filter(r => r.customerid !== null);
    const PAGE_SIZE  = tab.PAGE_SIZE;
    const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
    const pagedRows  = rows.slice((tab.page - 1) * PAGE_SIZE, tab.page * PAGE_SIZE);

    const validate = () => {
        const e = {};
        if (!tab.form.customerid) e.customerid = 'Please select a customer.';
        if (!tab.form.storeid)    e.storeid    = 'Please select a store.';
        if (!tab.form.price || parseFloat(tab.form.price) <= 0) e.price = 'Price must be greater than 0.';
        if (!tab.form.status)     e.status     = 'Please select a status.';
        if (!tab.form.paymentmethod) e.paymentmethod = 'Please select a payment method.';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const openAdd  = () => { tab.openAdd();  setErrors({}); };
    const openEdit = row => { tab.openEdit(row); setErrors({}); };

    const askDelete = row => setConfirm({
        message: `Delete order #${row.orderid} for "${getName(customers, 'customerid', 'customername', row.customerid)}"?`,
        onConfirm: async () => {
            setConfirm(null);
            try {
                const res = await fetch(`${BASE}/api/admin/orders/${row.orderid}`, { method: 'DELETE' });
                const result = await res.json();
                if (result.success) { tab.setToast({ type: 'success', text: 'Order deleted.' }); tab.load(); }
                else tab.setToast({ type: 'error', text: result.message || 'Cannot delete.' });
            } catch { tab.setToast({ type: 'error', text: 'Server error.' }); }
        },
    });

    const askSave = () => {
        if (!validate()) return;
        const isEdit = !!tab.form.orderid;
        setConfirm({
            message: isEdit ? `Save changes to order #${tab.form.orderid}?` : 'Add new customer order?',
            onConfirm: () => { setConfirm(null); doSave(); },
        });
    };

    const doSave = async () => {
        const isEdit = !!tab.form.orderid;
        const url = isEdit ? `${BASE}/api/admin/orders/${tab.form.orderid}` : `${BASE}/api/admin/orders`;
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
            {confirm && <ConfirmModal message={t(confirm.message, lang)} onConfirm={confirm.onConfirm} onCancel={() => setConfirm(null)} lang={lang} />}
            {itemsPopup && <OrderItemsPopup orderId={itemsPopup} onClose={() => setItemsPopup(null)} lang={lang} />}

            <div className="flex justify-end mb-4">
                <button onClick={openAdd} className="flex items-center gap-2 bg-red-600 dark:bg-red-600 text-white px-4 py-2.5 rounded-lg text-[11px] font-bold tracking-[0.12em] hover:bg-red-700 dark:hover:bg-red-700 transition-all uppercase">
                    + {t('Add', lang)} {t('Customer Order', lang)}
                </button>
            </div>

            <DataTable columns={COLUMNS} rows={pagedRows} onEdit={openEdit} onDelete={askDelete} emptyLabel={t('No customer orders.', lang)}
                loading={tab.loading} search={tab.search} onSearchChange={tab.setSearch}
                page={tab.page} totalPages={totalPages} onPageChange={tab.setPage} totalCount={rows.length} lang={lang} />

            {tab.drawer && (
                <Drawer title={tab.form.orderid ? 'Edit Customer Order' : 'Add Customer Order'} onClose={tab.close} onSubmit={askSave} lang={lang}>
                    <div>
                        <label className={labelCls}>{t('Customer', lang)}</label>
                        <select name="customerid" value={tab.form.customerid || ''} onChange={tab.handleChange} className={errors.customerid ? fieldErrCls : fieldCls}>
                            <option value="">-- {t('Select customer', lang)} --</option>
                            {customers.map(c => <option key={c.customerid} value={c.customerid}>{c.customername}</option>)}
                        </select>
                        {errors.customerid && <p className="text-[11px] text-red-500 mt-1">{t(errors.customerid, lang)}</p>}
                    </div>
                    <div>
                        <label className={labelCls}>{t('Store', lang)}</label>
                        <select name="storeid" value={tab.form.storeid || ''} onChange={tab.handleChange} className={errors.storeid ? fieldErrCls : fieldCls}>
                            <option value="">-- {t('Select store', lang)} --</option>
                            {stores.map(s => <option key={s.storeid} value={s.storeid}>{s.storename}</option>)}
                        </select>
                        {errors.storeid && <p className="text-[11px] text-red-500 mt-1">{t(errors.storeid, lang)}</p>}
                    </div>
                    {/* Driver is auto-assigned — not selectable */}
                    <div className="p-3 bg-gray-50 dark:bg-white/5 rounded-lg border border-gray-100 dark:border-white/5">
                        <p className="text-[10px] font-bold text-gray-400 tracking-[0.1em] uppercase mb-1">{t('Driver', lang)}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 italic">{t('Auto-assigned by the system', lang)}</p>
                    </div>
                    <div>
                        <label className={labelCls}>{t('Total (₪)', lang)}</label>
                        <input type="number" step="0.01" name="price" value={tab.form.price || ''} onChange={tab.handleChange} className={errors.price ? fieldErrCls : fieldCls} placeholder="e.g. 149.90" />
                        {errors.price && <p className="text-[11px] text-red-500 mt-1">{t(errors.price, lang)}</p>}
                    </div>
                    <div>
                        <label className={labelCls}>{t('Status', lang)}</label>
                        <select name="status" value={tab.form.status || ''} onChange={tab.handleChange} className={errors.status ? fieldErrCls : fieldCls}>
                            <option value="">-- {t('Select status', lang)} --</option>
                            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{t(s, lang)}</option>)}
                        </select>
                        {errors.status && <p className="text-[11px] text-red-500 mt-1">{t(errors.status, lang)}</p>}
                    </div>
                    <div>
                        <label className={labelCls}>{t('Payment Method', lang)}</label>
                        <select name="paymentmethod" value={tab.form.paymentmethod || ''} onChange={tab.handleChange} className={errors.paymentmethod ? fieldErrCls : fieldCls}>
                            <option value="">-- {t('Select', lang)} --</option>
                            {PAYMENT_OPTIONS.map(p => <option key={p} value={p}>{t(p, lang)}</option>)}
                        </select>
                        {errors.paymentmethod && <p className="text-[11px] text-red-500 mt-1">{t(errors.paymentmethod, lang)}</p>}
                    </div>
                    <div>
                        <label className={labelCls}>{t('Order Date', lang)}</label>
                        <input type="date" name="orderdate" value={tab.form.orderdate?.split('T')[0] || ''} onChange={tab.handleChange} className={fieldCls} />
                    </div>
                </Drawer>
            )}
        </>
    );
}

// ─── Store Restock Orders sub-tab ─────────────────────────────────────────────
function StoreOrdersTab({ stores, lang }) {
    const tab = useTab('/api/admin/orders', 'orderid');
    const [confirm, setConfirm] = useState(null);
    const [errors, setErrors]   = useState({});
    const [itemsPopup, setItemsPopup] = useState(null);

    const COLUMNS = [
        { key: 'store',  label: 'Store',   render: r => getName(stores, 'storeid', 'storename', r.storeid) },
        { key: 'price',  label: 'Total',   render: r => `₪ ${parseFloat(r.price || 0).toFixed(2)}` },
        { key: 'paymentmethod', label: 'Payment', render: r => t(r.paymentmethod, lang) },
        { key: 'status', label: 'Status',  render: r => <Badge value={t(r.status, lang)} originalKey={r.status} colorMap={STATUS_COLORS} /> },
        { key: 'orderdate', label: 'Date', render: r => r.orderdate ? new Date(r.orderdate).toLocaleDateString() : '—' },
        makeViewColumn(setItemsPopup, lang),
    ];

    // Only store restock orders (customerid is null)
    const rows       = tab.filteredRows.filter(r => r.customerid === null);
    const PAGE_SIZE  = tab.PAGE_SIZE;
    const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
    const pagedRows  = rows.slice((tab.page - 1) * PAGE_SIZE, tab.page * PAGE_SIZE);

    const validate = () => {
        const e = {};
        if (!tab.form.storeid) e.storeid = 'Please select a store.';
        if (!tab.form.price || parseFloat(tab.form.price) <= 0) e.price = 'Price must be greater than 0.';
        if (!tab.form.status)  e.status  = 'Please select a status.';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const openAdd  = () => { tab.openAdd(); tab.setForm({ customerid: null }); setErrors({}); };
    const openEdit = row => { tab.openEdit(row); setErrors({}); };

    const askDelete = row => setConfirm({
        message: `Delete restock order #${row.orderid} for store "${getName(stores, 'storeid', 'storename', row.storeid)}"?`,
        onConfirm: async () => {
            setConfirm(null);
            try {
                const res = await fetch(`${BASE}/api/admin/orders/${row.orderid}`, { method: 'DELETE' });
                const result = await res.json();
                if (result.success) { tab.setToast({ type: 'success', text: 'Order deleted.' }); tab.load(); }
                else tab.setToast({ type: 'error', text: result.message || 'Cannot delete.' });
            } catch { tab.setToast({ type: 'error', text: 'Server error.' }); }
        },
    });

    const askSave = () => {
        if (!validate()) return;
        const isEdit = !!tab.form.orderid;
        setConfirm({
            message: isEdit ? `Save changes to order #${tab.form.orderid}?` : 'Add new store restock order?',
            onConfirm: () => { setConfirm(null); doSave(); },
        });
    };

    const doSave = async () => {
        const isEdit = !!tab.form.orderid;
        const url = isEdit ? `${BASE}/api/admin/orders/${tab.form.orderid}` : `${BASE}/api/admin/orders`;
        // customerid always null for store restocks
        const body = { ...tab.form, customerid: null };
        try {
            const res = await fetch(url, { method: isEdit ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
            const result = await res.json();
            if (result.success) { tab.setToast({ type: 'success', text: isEdit ? 'Updated.' : 'Added.' }); tab.close(); tab.load(); }
            else tab.setToast({ type: 'error', text: result.message || 'Error.' });
        } catch { tab.setToast({ type: 'error', text: 'Server error.' }); }
    };

    return (
        <>
            {tab.toast && <Toast message={t(tab.toast.text, lang)} type={tab.toast.type} onDone={() => tab.setToast(null)} />}
            {confirm && <ConfirmModal message={t(confirm.message, lang)} onConfirm={confirm.onConfirm} onCancel={() => setConfirm(null)} lang={lang} />}
            {itemsPopup && <OrderItemsPopup orderId={itemsPopup} onClose={() => setItemsPopup(null)} lang={lang} />}

            <div className="flex justify-end mb-4">
                <button onClick={openAdd} className="flex items-center gap-2 bg-red-600 dark:bg-red-600 text-white px-4 py-2.5 rounded-lg text-[11px] font-bold tracking-[0.12em] hover:bg-red-700 dark:hover:bg-red-700 transition-all uppercase">
                    + {t('Add', lang)} {t('Store Order', lang)}
                </button>
            </div>

            <DataTable columns={COLUMNS} rows={pagedRows} onEdit={openEdit} onDelete={askDelete} emptyLabel={t('No store restock orders.', lang)}
                loading={tab.loading} search={tab.search} onSearchChange={tab.setSearch}
                page={tab.page} totalPages={totalPages} onPageChange={tab.setPage} totalCount={rows.length} lang={lang} />

            {tab.drawer && (
                <Drawer title={tab.form.orderid ? 'Edit Store Order' : 'Add Store Order'} onClose={tab.close} onSubmit={askSave} lang={lang}>
                    <div>
                        <label className={labelCls}>{t('Store', lang)}</label>
                        <select name="storeid" value={tab.form.storeid || ''} onChange={tab.handleChange} className={errors.storeid ? fieldErrCls : fieldCls}>
                            <option value="">-- {t('Select store', lang)} --</option>
                            {stores.map(s => <option key={s.storeid} value={s.storeid}>{s.storename}</option>)}
                        </select>
                        {errors.storeid && <p className="text-[11px] text-red-500 mt-1">{t(errors.storeid, lang)}</p>}
                    </div>
                    {/* Driver auto-assigned */}
                    <div className="p-3 bg-gray-50 dark:bg-white/5 rounded-lg border border-gray-100 dark:border-white/5">
                        <p className="text-[10px] font-bold text-gray-400 tracking-[0.1em] uppercase mb-1">{t('Driver', lang)}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 italic">{t('Auto-assigned by the system', lang)}</p>
                    </div>
                    <div>
                        <label className={labelCls}>{t('Total (₪)', lang)}</label>
                        <input type="number" step="0.01" name="price" value={tab.form.price || ''} onChange={tab.handleChange} className={errors.price ? fieldErrCls : fieldCls} placeholder="e.g. 500.00" />
                        {errors.price && <p className="text-[11px] text-red-500 mt-1">{t(errors.price, lang)}</p>}
                    </div>
                    <div>
                        <label className={labelCls}>{t('Status', lang)}</label>
                        <select name="status" value={tab.form.status || ''} onChange={tab.handleChange} className={errors.status ? fieldErrCls : fieldCls}>
                            <option value="">-- {t('Select status', lang)} --</option>
                            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{t(s, lang)}</option>)}
                        </select>
                        {errors.status && <p className="text-[11px] text-red-500 mt-1">{t(errors.status, lang)}</p>}
                    </div>
                    <div>
                        <label className={labelCls}>{t('Payment Method', lang)}</label>
                        <select name="paymentmethod" value={tab.form.paymentmethod || ''} onChange={tab.handleChange} className={fieldCls}>
                            <option value="">-- {t('Select', lang)} --</option>
                            {PAYMENT_OPTIONS.map(p => <option key={p} value={p}>{t(p, lang)}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className={labelCls}>{t('Order Date', lang)}</label>
                        <input type="date" name="orderdate" value={tab.form.orderdate?.split('T')[0] || ''} onChange={tab.handleChange} className={fieldCls} />
                    </div>
                </Drawer>
            )}
        </>
    );
}

// ─── Main OrdersTab ───────────────────────────────────────────────────────────
export default function OrdersTab({ lang }) {
    const [activeSubTab, setActiveSubTab] = useState('customer');
    const [customers, setCustomers] = useState([]);
    const [stores, setStores]       = useState([]);

    useEffect(() => {
        fetch(`${BASE}/api/admin/customers`).then(r => r.json()).then(setCustomers).catch(() => {});
        fetch(`${BASE}/api/admin/stores`).then(r => r.json()).then(setStores).catch(() => {});
    }, []);

    return (
        <div>
            <div className="flex gap-1 mb-6 bg-gray-100 dark:bg-white/5 rounded-xl p-1 w-fit">
                <button
                    onClick={() => setActiveSubTab('customer')}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeSubTab === 'customer' ? 'bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
                >
                    <User size={16} /> {t('Customer Orders', lang)}
                </button>
                <button
                    onClick={() => setActiveSubTab('store')}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeSubTab === 'store' ? 'bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
                >
                    <Store size={16} /> {t('Store Restocks', lang)}
                </button>
            </div>

            {activeSubTab === 'customer'
                ? <CustomerOrdersTab customers={customers} stores={stores} lang={lang} />
                : <StoreOrdersTab stores={stores} lang={lang} />
            }
        </div>
    );
}
