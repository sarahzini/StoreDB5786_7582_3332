import { useState, useEffect } from 'react';
import useTab from '../shared/useTab';
import DataTable from '../shared/DataTable';
import Drawer from '../shared/Drawer';
import { Toast, AddButton } from '../shared/ui';

const BASE = 'http://localhost:5000';
const fieldCls = "w-full mt-1.5 p-3 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-red-500 transition-all shadow-sm font-medium";
const labelCls = "block text-[10px] font-bold text-gray-400 tracking-[0.1em] uppercase mb-1";

const COLUMNS = [
    { key: 'productname',  label: 'Product' },
    { key: 'storename',    label: 'Store' },
    { key: 'quantity',     label: 'Qty', render: r => (
        <span className={`font-bold ${r.quantity < r.minimumstock ? 'text-red-500' : 'text-gray-700'}`}>{r.quantity}</span>
    )},
    { key: 'minimumstock', label: 'Min Stock' },
];

export default function InventoryTab() {
    const t = useTab('/api/admin/inventory', null);
    const [products, setProducts] = useState([]);
    const [stores, setStores]     = useState([]);
    const [confirm, setConfirm]   = useState(null);
    const [errors, setErrors]     = useState({});

    // Load product and store lists for dropdowns
    useEffect(() => {
        fetch(`${BASE}/api/admin/products`).then(r => r.json()).then(setProducts).catch(() => {});
        fetch(`${BASE}/api/admin/stores`).then(r => r.json()).then(setStores).catch(() => {});
    }, []);

    const validate = () => {
        const e = {};
        if (!t.form.productid) e.productid = 'Please select a product.';
        if (!t.form.storeid)   e.storeid   = 'Please select a store.';
        if (t.form.quantity === '' || t.form.quantity === undefined) e.quantity = 'Quantity is required.';
        if (t.form.minimumstock === '' || t.form.minimumstock === undefined) e.minimumstock = 'Min stock is required.';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const askDelete = row => setConfirm({
        message: `Delete inventory entry for "${row.productname}" at "${row.storename}"?`,
        onConfirm: async () => {
            setConfirm(null);
            try {
                const res = await fetch(`${BASE}/api/admin/inventory?productid=${row.productid}&storeid=${row.storeid}`, { method: 'DELETE' });
                const result = await res.json();
                if (result.success) { t.setToast({ type: 'success', text: 'Deleted.' }); t.load(); }
                else t.setToast({ type: 'error', text: result.message || 'Cannot delete.' });
            } catch { t.setToast({ type: 'error', text: 'Server error.' }); }
        },
    });

    const askSave = () => {
        if (!validate()) return;
        const productName = products.find(p => parseInt(p.productid) === parseInt(t.form.productid))?.productname || '';
        const storeName   = stores.find(s => parseInt(s.storeid) === parseInt(t.form.storeid))?.storename || '';
        setConfirm({
            message: `Save inventory entry for "${productName}" at "${storeName}"?`,
            onConfirm: () => { setConfirm(null); doSave(); },
        });
    };

    const doSave = async () => {
        try {
            const res = await fetch(`${BASE}/api/admin/inventory`, {
                method: 'POST', // backend uses ON CONFLICT DO UPDATE
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(t.form),
            });
            const result = await res.json();
            if (result.success) { t.setToast({ type: 'success', text: 'Saved.' }); t.close(); t.load(); }
            else t.setToast({ type: 'error', text: result.message || 'Error.' });
        } catch { t.setToast({ type: 'error', text: 'Server error.' }); }
    };

    const openAdd  = () => { t.openAdd();  setErrors({}); };
    const openEdit = row => { t.openEdit(row); setErrors({}); };

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
            <AddButton label="Entry" onClick={openAdd} />
            <DataTable columns={COLUMNS} rows={t.rows} onEdit={openEdit} onDelete={askDelete} emptyLabel="No inventory entries."
                loading={t.loading} search={t.search} onSearchChange={t.setSearch}
                page={t.page} totalPages={t.totalPages} onPageChange={t.setPage} totalCount={t.filteredRows.length} />
            {t.drawer && (
                <Drawer title="Inventory Entry" onClose={t.close} onSubmit={askSave}>
                    {/* Product dropdown */}
                    <div>
                        <label className={labelCls}>Product</label>
                        <select name="productid" value={t.form.productid || ''} onChange={t.handleChange} className={`${fieldCls} ${errors.productid ? 'border-red-400' : ''}`}>
                            <option value="">-- Select product --</option>
                            {products.map(p => <option key={p.productid} value={p.productid}>{p.productname}</option>)}
                        </select>
                        {errors.productid && <p className="text-[11px] text-red-500 mt-1">{errors.productid}</p>}
                    </div>
                    {/* Store dropdown */}
                    <div>
                        <label className={labelCls}>Store</label>
                        <select name="storeid" value={t.form.storeid || ''} onChange={t.handleChange} className={`${fieldCls} ${errors.storeid ? 'border-red-400' : ''}`}>
                            <option value="">-- Select store --</option>
                            {stores.map(s => <option key={s.storeid} value={s.storeid}>{s.storename}</option>)}
                        </select>
                        {errors.storeid && <p className="text-[11px] text-red-500 mt-1">{errors.storeid}</p>}
                    </div>
                    {/* Quantity — integer spinner */}
                    <div>
                        <label className={labelCls}>Quantity</label>
                        <input type="number" name="quantity" step="1" min="0"
                            value={t.form.quantity !== undefined ? parseInt(t.form.quantity) || 0 : ''}
                            onChange={e => t.setForm(f => ({ ...f, quantity: parseInt(e.target.value) || 0 }))}
                            className={`${fieldCls} ${errors.quantity ? 'border-red-400' : ''}`} placeholder="e.g. 100" />
                        {errors.quantity && <p className="text-[11px] text-red-500 mt-1">{errors.quantity}</p>}
                    </div>
                    {/* Min stock — integer spinner */}
                    <div>
                        <label className={labelCls}>Minimum Stock</label>
                        <input type="number" name="minimumstock" step="1" min="0"
                            value={t.form.minimumstock !== undefined ? parseInt(t.form.minimumstock) || 0 : ''}
                            onChange={e => t.setForm(f => ({ ...f, minimumstock: parseInt(e.target.value) || 0 }))}
                            className={`${fieldCls} ${errors.minimumstock ? 'border-red-400' : ''}`} placeholder="e.g. 10" />
                        {errors.minimumstock && <p className="text-[11px] text-red-500 mt-1">{errors.minimumstock}</p>}
                    </div>
                </Drawer>
            )}
        </>
    );
}
