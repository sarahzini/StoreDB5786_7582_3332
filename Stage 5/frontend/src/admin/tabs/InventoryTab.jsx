import { useState, useEffect } from 'react';
import useTab from '../shared/useTab';
import DataTable from '../shared/DataTable';
import Drawer from '../shared/Drawer';
import { Toast, AddButton } from '../shared/ui';
import { t } from '../../translations';

const BASE = 'http://localhost:5000';
const fieldCls = "w-full mt-1.5 p-3 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-50 dark:focus:ring-red-900/30 text-gray-900 dark:text-white transition-all shadow-sm font-medium";
const labelCls = "block text-[10px] font-bold text-gray-400 tracking-[0.1em] uppercase mb-1";

const COLUMNS = [
    { key: 'productname',  label: 'Product' },
    { key: 'storename',    label: 'Store' },
    { key: 'quantity',     label: 'Qty', render: r => (
        <span className={`font-bold ${r.quantity < r.minimumstock ? 'text-red-500' : 'text-gray-700 dark:text-gray-300'}`}>{r.quantity}</span>
    )},
    { key: 'minimumstock', label: 'Min Stock' },
];

export default function InventoryTab({ lang }) {
    const tab = useTab('/api/admin/inventory', null);
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
        if (!tab.form.productid) e.productid = 'Please select a product.';
        if (!tab.form.storeid)   e.storeid   = 'Please select a store.';
        if (tab.form.quantity === '' || tab.form.quantity === undefined) e.quantity = 'Quantity is required.';
        if (tab.form.minimumstock === '' || tab.form.minimumstock === undefined) e.minimumstock = 'Min stock is required.';
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
                if (result.success) { tab.setToast({ type: 'success', text: 'Deleted.' }); tab.load(); }
                else tab.setToast({ type: 'error', text: result.message || 'Cannot delete.' });
            } catch { tab.setToast({ type: 'error', text: 'Server error.' }); }
        },
    });

    const askSave = () => {
        if (!validate()) return;
        const productName = products.find(p => parseInt(p.productid) === parseInt(tab.form.productid))?.productname || '';
        const storeName   = stores.find(s => parseInt(s.storeid) === parseInt(tab.form.storeid))?.storename || '';
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
                body: JSON.stringify(tab.form),
            });
            const result = await res.json();
            if (result.success) { tab.setToast({ type: 'success', text: 'Saved.' }); tab.close(); tab.load(); }
            else tab.setToast({ type: 'error', text: result.message || 'Error.' });
        } catch { tab.setToast({ type: 'error', text: 'Server error.' }); }
    };

    const openAdd  = () => { tab.openAdd();  setErrors({}); };
    const openEdit = row => { tab.openEdit(row); setErrors({}); };

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
            <AddButton label="Entry" onClick={openAdd} lang={lang} />
            <DataTable columns={COLUMNS} rows={tab.rows} onEdit={openEdit} onDelete={askDelete} emptyLabel={t('No inventory entries.', lang)}
                loading={tab.loading} search={tab.search} onSearchChange={tab.setSearch}
                page={tab.page} totalPages={tab.totalPages} onPageChange={tab.setPage} totalCount={tab.filteredRows.length} lang={lang} />
            {tab.drawer && (
                <Drawer title={t('Inventory Entry', lang)} onClose={tab.close} onSubmit={askSave} lang={lang}>
                    {/* Product dropdown */}
                    <div>
                        <label className={labelCls}>{t('Product', lang)}</label>
                        <select name="productid" value={tab.form.productid || ''} onChange={tab.handleChange} className={`${fieldCls} ${errors.productid ? 'border-red-400 dark:border-red-500/50' : ''}`}>
                            <option value="">-- {t('Select product', lang)} --</option>
                            {products.map(p => <option key={p.productid} value={p.productid}>{p.productname}</option>)}
                        </select>
                        {errors.productid && <p className="text-[11px] text-red-500 mt-1">{t(errors.productid, lang)}</p>}
                    </div>
                    {/* Store dropdown */}
                    <div>
                        <label className={labelCls}>{t('Store', lang)}</label>
                        <select name="storeid" value={tab.form.storeid || ''} onChange={tab.handleChange} className={`${fieldCls} ${errors.storeid ? 'border-red-400 dark:border-red-500/50' : ''}`}>
                            <option value="">-- {t('Select store', lang)} --</option>
                            {stores.map(s => <option key={s.storeid} value={s.storeid}>{s.storename}</option>)}
                        </select>
                        {errors.storeid && <p className="text-[11px] text-red-500 mt-1">{t(errors.storeid, lang)}</p>}
                    </div>
                    {/* Quantity — integer spinner */}
                    <div>
                        <label className={labelCls}>{t('Quantity', lang)}</label>
                        <input type="number" name="quantity" step="1" min="0"
                            value={tab.form.quantity !== undefined ? parseInt(tab.form.quantity) || 0 : ''}
                            onChange={e => tab.setForm(f => ({ ...f, quantity: parseInt(e.target.value) || 0 }))}
                            className={`${fieldCls} ${errors.quantity ? 'border-red-400 dark:border-red-500/50' : ''}`} placeholder="e.g. 100" />
                        {errors.quantity && <p className="text-[11px] text-red-500 mt-1">{t(errors.quantity, lang)}</p>}
                    </div>
                    {/* Min stock — integer spinner */}
                    <div>
                        <label className={labelCls}>{t('Minimum Stock', lang)}</label>
                        <input type="number" name="minimumstock" step="1" min="0"
                            value={tab.form.minimumstock !== undefined ? parseInt(tab.form.minimumstock) || 0 : ''}
                            onChange={e => tab.setForm(f => ({ ...f, minimumstock: parseInt(e.target.value) || 0 }))}
                            className={`${fieldCls} ${errors.minimumstock ? 'border-red-400 dark:border-red-500/50' : ''}`} placeholder="e.g. 10" />
                        {errors.minimumstock && <p className="text-[11px] text-red-500 mt-1">{t(errors.minimumstock, lang)}</p>}
                    </div>
                </Drawer>
            )}
        </>
    );
}
