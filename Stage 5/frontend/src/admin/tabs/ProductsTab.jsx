import { useState, useEffect } from 'react';
import useTab from '../shared/useTab';
import DataTable from '../shared/DataTable';
import Drawer from '../shared/Drawer';
import { Toast, AddButton } from '../shared/ui';
import { Package } from 'lucide-react';
import { t } from '../../translations';

const BASE = 'http://localhost:5000';

const CATEGORIES = [
    { id: 501, name: 'Dairy & Eggs' }, { id: 502, name: 'Meat & Poultry' },
    { id: 503, name: 'Fish & Seafood' }, { id: 504, name: 'Bakery & Bread' },
    { id: 505, name: 'Fruits & Vegetables' }, { id: 506, name: 'Beverages' },
    { id: 507, name: 'Snacks & Chips' }, { id: 508, name: 'Frozen Foods' },
    { id: 509, name: 'Pantry & Dry Goods' }, { id: 510, name: 'Cleaning & Household' },
];
const SUPPLIERS = [
    { id: 501, name: 'Tnuva' }, { id: 502, name: 'Osem' }, { id: 503, name: 'Strauss' },
    { id: 504, name: 'Elite' }, { id: 505, name: 'Tara' }, { id: 506, name: 'Unilever Israel' },
    { id: 507, name: 'Diplomat' }, { id: 508, name: 'Maadanot' },
    { id: 509, name: 'Shekem Electric' }, { id: 510, name: 'Angel Bakeries' },
];
const KASHRUT_OPTIONS = [
    'Lameadrin', 'Jerusalem Rabbinate', 'Badatz Edah Hachareidit',
    'Badatz Rav Mhpoud', 'Rabbanut Mehadrin', 'Kosher Lemhadrin',
];

const fieldCls = "w-full mt-1.5 p-3 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-50 dark:focus:ring-red-900/30 text-gray-900 dark:text-white transition-all shadow-sm font-medium";
const labelCls = "block text-[10px] font-bold text-gray-400 tracking-[0.1em] uppercase mb-1";

const KBadge = ({ label, lang }) => (
    <span className="inline-block px-2 py-0.5 mr-1 mb-1 text-[9px] font-bold uppercase tracking-wider rounded bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20 whitespace-nowrap">
        {t(label, lang)}
    </span>
);

// useEffect fixes the fetch — useState was wrong
function LocationPopup({ productId, onClose, lang }) {
    const [locs, setLocs] = useState(null);
    useEffect(() => {
        fetch(`${BASE}/api/admin/products/${productId}/locations`)
            .then(r => r.json()).then(setLocs).catch(() => setLocs([]));
    }, [productId]);
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
            <div className="absolute inset-0 bg-black/30 dark:bg-black/60" onClick={onClose} />
            <div className="relative bg-white dark:!bg-transparent dark:bg-gradient-to-br dark:from-[#0B1120] dark:via-[#111827] dark:to-[#450a0a] rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4 border border-transparent dark:border-white/10">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white">{t('Warehouse Locations', lang)}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">✕</button>
                </div>
                {locs === null ? <p className="text-sm text-gray-400">{t('Loading...', lang)}</p>
                : locs.length === 0 ? <p className="text-sm text-gray-400 italic">{t('Not stored in any warehouse.', lang)}</p>
                : <div className="space-y-2">
                    {locs.map((l, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-white/5 rounded-lg text-sm border border-transparent dark:border-white/5">
                            <span className="font-semibold text-gray-700 dark:text-gray-300">{l.region}</span>
                            <span className="text-gray-400">Aisle {l.aislenb ?? '—'}</span>
                            <span className="text-gray-400">Shelf {l.shelfnb ?? '—'}</span>
                        </div>
                    ))}
                </div>}
            </div>
        </div>
    );
}

export default function ProductsTab({ lang }) {
    const tab = useTab('/api/admin/products', 'productid');
    const [selectedKashrut, setSelectedKashrut] = useState([]);
    const [confirm, setConfirm]     = useState(null);
    const [hiddenIds, setHiddenIds] = useState([]);
    const [locPopup, setLocPopup]   = useState(null);

    const COLUMNS = [
        { key: 'productname', label: 'Name' },
        { key: 'price', label: 'Price', render: r => `₪ ${parseFloat(r.price).toFixed(2)}` },
        { key: 'categoryname', label: 'Category', render: r =>
            parseInt(r.categoryid) !== 0 && r.categoryname ? t(r.categoryname, lang)
            : <span className="text-gray-300 dark:text-gray-600 italic text-[11px]">—</span>
        },
        { key: 'suppliername', label: 'Supplier', render: r =>
            r.suppliername || <span className="text-gray-300 dark:text-gray-600 italic text-[11px]">—</span>
        },
        { key: 'dateofmanufacture', label: 'Manufacture', render: r =>
            r.dateofmanufacture ? new Date(r.dateofmanufacture).toLocaleDateString() : '—'
        },
        { key: 'expirationdate', label: 'Expiry', render: r =>
            r.expirationdate ? new Date(r.expirationdate).toLocaleDateString() : '—'
        },
        { key: 'kashrut_list', label: 'Kashrut', render: r =>
            r.kashrut_list
                ? <div className="flex flex-wrap">{r.kashrut_list.split(',').map((k, i) => <KBadge key={i} label={k.trim()} lang={lang} />)}</div>
                : <span className="text-gray-300 dark:text-gray-600 italic text-[11px]">None</span>
        },
        { key: 'warehouses', label: 'Warehouses', render: r => (
            <button onClick={e => { e.stopPropagation(); setLocPopup(r.productid); }}
                className="flex items-center gap-2 text-[11px] font-semibold px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 transition-all whitespace-nowrap">
                <Package size={14} className="text-orange-500" /> {t('View', lang)}
            </button>
        )},
    ];

    const toggleKashrut = opt => setSelectedKashrut(prev => prev.includes(opt) ? prev.filter(k => k !== opt) : [...prev, opt]);
    const openEdit = row => { tab.openEdit(row); setSelectedKashrut(row.kashrut_list ? row.kashrut_list.split(',').map(k => k.trim()) : []); };
    const openAdd  = ()  => { tab.openAdd(); setSelectedKashrut([]); };

    const askDelete = row => setConfirm({
        message: `Hide "${row.productname}" from the list?`,
        onConfirm: () => { setHiddenIds(prev => [...prev, row.productid]); tab.setToast({ type: 'success', text: `"${row.productname}" hidden.` }); setConfirm(null); },
    });

    const askSave = () => {
        const isEdit = !!tab.form.productid;
        setConfirm({
            message: isEdit ? `Save changes to "${tab.form.productname}"?` : `Add new product "${tab.form.productname}"?`,
            onConfirm: () => { setConfirm(null); doSave(); },
        });
    };

    const doSave = async () => {
        const isEdit = !!tab.form.productid;
        const url = isEdit ? `${BASE}/api/admin/products/${tab.form.productid}` : `${BASE}/api/admin/products`;
        try {
            const res = await fetch(url, { method: isEdit ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...tab.form, kashrut: selectedKashrut.join(',') }) });
            const result = await res.json();
            if (result.success) { tab.setToast({ type: 'success', text: isEdit ? 'Product updated.' : 'Product added.' }); tab.close(); tab.load(); }
            else tab.setToast({ type: 'error', text: result.message || 'Error saving.' });
        } catch { tab.setToast({ type: 'error', text: 'Server error.' }); }
    };

    const PAGE_SIZE = tab.PAGE_SIZE;
    const sorted = [...tab.filteredRows].filter(r => !hiddenIds.includes(r.productid))
        .sort((a, b) => { const aL = parseInt(a.categoryid) === 0, bL = parseInt(b.categoryid) === 0; return aL && !bL ? 1 : !aL && bL ? -1 : 0; });
    const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
    const pagedRows  = sorted.slice((tab.page - 1) * PAGE_SIZE, tab.page * PAGE_SIZE);

    return (
        <>
            {tab.toast && <Toast message={t(tab.toast.text, lang)} type={tab.toast.type} onDone={() => tab.setToast(null)} />}
            {locPopup && <LocationPopup productId={locPopup} onClose={() => setLocPopup(null)} lang={lang} />}
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
            <AddButton label="Product" onClick={openAdd} lang={lang} />
            <DataTable columns={COLUMNS} rows={pagedRows} onEdit={openEdit} onDelete={askDelete} emptyLabel={t('No products found.', lang)}
                loading={tab.loading} search={tab.search} onSearchChange={tab.setSearch}
                page={tab.page} totalPages={totalPages} onPageChange={tab.setPage} totalCount={sorted.length} lang={lang} />
            {tab.drawer && (
                <Drawer title={tab.form.productid ? 'Edit Product' : 'Add Product'} onClose={tab.close} onSubmit={askSave} lang={lang}>
                    <div><label className={labelCls}>{t('Product Name', lang)}</label><input type="text" name="productname" value={tab.form.productname || ''} onChange={tab.handleChange} className={fieldCls} /></div>
                    <div><label className={labelCls}>{t('Price', lang)} (₪)</label><input type="number" step="0.01" name="price" value={tab.form.price || ''} onChange={tab.handleChange} className={fieldCls} /></div>
                    <div><label className={labelCls}>{t('Category', lang)}</label>
                        <select name="categoryid" value={tab.form.categoryid || ''} onChange={tab.handleChange} className={fieldCls}>
                            <option value="">-- {t('Select', lang)} --</option>
                            {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    <div><label className={labelCls}>{t('Supplier', lang)}</label>
                        <select name="supplierid" value={tab.form.supplierid || ''} onChange={tab.handleChange} className={fieldCls}>
                            <option value="">-- {t('Select', lang)} --</option>
                            {SUPPLIERS.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                    <div><label className={labelCls}>{t('Date of Manufacture', lang)}</label><input type="date" name="dateofmanufacture" value={tab.form.dateofmanufacture?.split('T')[0] || ''} onChange={tab.handleChange} className={fieldCls} /></div>
                    <div><label className={labelCls}>{t('Expiration Date', lang)}</label><input type="date" name="expirationdate" value={tab.form.expirationdate?.split('T')[0] || ''} onChange={tab.handleChange} className={fieldCls} /></div>
                    <div><label className={labelCls}>{t('Kashrut', lang)}</label>
                        <div className="mt-2 space-y-2">
                            {KASHRUT_OPTIONS.map(opt => (
                                <label key={opt} className="flex items-center gap-3 cursor-pointer group">
                                    <input type="checkbox" checked={selectedKashrut.includes(opt)} onChange={() => toggleKashrut(opt)} className="w-4 h-4 accent-red-600" />
                                    <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white">{opt}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                </Drawer>
            )}
        </>
    );
}
