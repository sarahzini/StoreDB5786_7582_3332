import { useState, useEffect } from 'react';
import useTab from '../shared/useTab';
import DataTable from '../shared/DataTable';
import Drawer from '../shared/Drawer';
import { Toast, AddButton } from '../shared/ui';

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

const fieldCls = "w-full mt-1.5 p-3 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-red-500 transition-all shadow-sm font-medium";
const labelCls = "block text-[10px] font-bold text-gray-400 tracking-[0.1em] uppercase mb-1";

const KBadge = ({ label }) => (
    <span className="inline-block px-2 py-0.5 mr-1 mb-1 text-[9px] font-bold uppercase tracking-wider rounded bg-indigo-50 text-indigo-600 border border-indigo-100 whitespace-nowrap">
        {label}
    </span>
);

// useEffect fixes the fetch — useState was wrong
function LocationPopup({ productId, onClose }) {
    const [locs, setLocs] = useState(null);
    useEffect(() => {
        fetch(`${BASE}/api/admin/products/${productId}/locations`)
            .then(r => r.json()).then(setLocs).catch(() => setLocs([]));
    }, [productId]);
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
            <div className="absolute inset-0 bg-black/30" onClick={onClose} />
            <div className="relative bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-gray-900">Warehouse Locations</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
                </div>
                {locs === null ? <p className="text-sm text-gray-400">Loading...</p>
                : locs.length === 0 ? <p className="text-sm text-gray-400 italic">Not stored in any warehouse.</p>
                : <div className="space-y-2">
                    {locs.map((l, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg text-sm">
                            <span className="font-semibold text-gray-700">{l.region}</span>
                            <span className="text-gray-400">Aisle {l.aislenb ?? '—'}</span>
                            <span className="text-gray-400">Shelf {l.shelfnb ?? '—'}</span>
                        </div>
                    ))}
                </div>}
            </div>
        </div>
    );
}

export default function ProductsTab() {
    const t = useTab('/api/admin/products', 'productid');
    const [selectedKashrut, setSelectedKashrut] = useState([]);
    const [confirm, setConfirm]     = useState(null);
    const [hiddenIds, setHiddenIds] = useState([]);
    const [locPopup, setLocPopup]   = useState(null);

    const COLUMNS = [
        { key: 'productname', label: 'Name' },
        { key: 'price', label: 'Price', render: r => `₪ ${parseFloat(r.price).toFixed(2)}` },
        { key: 'categoryname', label: 'Category', render: r =>
            parseInt(r.categoryid) !== 0 && r.categoryname ? r.categoryname
            : <span className="text-gray-300 italic text-[11px]">—</span>
        },
        { key: 'suppliername', label: 'Supplier', render: r =>
            r.suppliername || <span className="text-gray-300 italic text-[11px]">—</span>
        },
        { key: 'dateofmanufacture', label: 'Manufacture', render: r =>
            r.dateofmanufacture ? new Date(r.dateofmanufacture).toLocaleDateString() : '—'
        },
        { key: 'expirationdate', label: 'Expiry', render: r =>
            r.expirationdate ? new Date(r.expirationdate).toLocaleDateString() : '—'
        },
        { key: 'kashrut_list', label: 'Kashrut', render: r =>
            r.kashrut_list
                ? <div className="flex flex-wrap">{r.kashrut_list.split(',').map((k, i) => <KBadge key={i} label={k.trim()} />)}</div>
                : <span className="text-gray-300 italic text-[11px]">None</span>
        },
        { key: 'warehouses', label: 'Warehouses', render: r => (
            <button onClick={e => { e.stopPropagation(); setLocPopup(r.productid); }}
                className="text-[11px] font-semibold px-3 py-1.5 rounded-lg border border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100 transition-all whitespace-nowrap">
                📦 View
            </button>
        )},
    ];

    const toggleKashrut = opt => setSelectedKashrut(prev => prev.includes(opt) ? prev.filter(k => k !== opt) : [...prev, opt]);
    const openEdit = row => { t.openEdit(row); setSelectedKashrut(row.kashrut_list ? row.kashrut_list.split(',').map(k => k.trim()) : []); };
    const openAdd  = ()  => { t.openAdd(); setSelectedKashrut([]); };

    const askDelete = row => setConfirm({
        message: `Hide "${row.productname}" from the list?`,
        onConfirm: () => { setHiddenIds(prev => [...prev, row.productid]); t.setToast({ type: 'success', text: `"${row.productname}" hidden.` }); setConfirm(null); },
    });

    const askSave = () => {
        const isEdit = !!t.form.productid;
        setConfirm({
            message: isEdit ? `Save changes to "${t.form.productname}"?` : `Add new product "${t.form.productname}"?`,
            onConfirm: () => { setConfirm(null); doSave(); },
        });
    };

    const doSave = async () => {
        const isEdit = !!t.form.productid;
        const url = isEdit ? `${BASE}/api/admin/products/${t.form.productid}` : `${BASE}/api/admin/products`;
        try {
            const res = await fetch(url, { method: isEdit ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...t.form, kashrut: selectedKashrut.join(',') }) });
            const result = await res.json();
            if (result.success) { t.setToast({ type: 'success', text: isEdit ? 'Product updated.' : 'Product added.' }); t.close(); t.load(); }
            else t.setToast({ type: 'error', text: result.message || 'Error saving.' });
        } catch { t.setToast({ type: 'error', text: 'Server error.' }); }
    };

    const PAGE_SIZE = t.PAGE_SIZE;
    const sorted = [...t.filteredRows].filter(r => !hiddenIds.includes(r.productid))
        .sort((a, b) => { const aL = parseInt(a.categoryid) === 0, bL = parseInt(b.categoryid) === 0; return aL && !bL ? 1 : !aL && bL ? -1 : 0; });
    const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
    const pagedRows  = sorted.slice((t.page - 1) * PAGE_SIZE, t.page * PAGE_SIZE);

    return (
        <>
            {t.toast && <Toast message={t.toast.text} type={t.toast.type} onDone={() => t.setToast(null)} />}
            {locPopup && <LocationPopup productId={locPopup} onClose={() => setLocPopup(null)} />}
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
            <AddButton label="Product" onClick={openAdd} />
            <DataTable columns={COLUMNS} rows={pagedRows} onEdit={openEdit} onDelete={askDelete} emptyLabel="No products found."
                loading={t.loading} search={t.search} onSearchChange={t.setSearch}
                page={t.page} totalPages={totalPages} onPageChange={t.setPage} totalCount={sorted.length} />
            {t.drawer && (
                <Drawer title={t.form.productid ? 'Edit Product' : 'Add Product'} onClose={t.close} onSubmit={askSave}>
                    <div><label className={labelCls}>Product Name</label><input type="text" name="productname" value={t.form.productname || ''} onChange={t.handleChange} className={fieldCls} /></div>
                    <div><label className={labelCls}>Price (₪)</label><input type="number" step="0.01" name="price" value={t.form.price || ''} onChange={t.handleChange} className={fieldCls} /></div>
                    <div><label className={labelCls}>Category</label>
                        <select name="categoryid" value={t.form.categoryid || ''} onChange={t.handleChange} className={fieldCls}>
                            <option value="">-- Select category --</option>
                            {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    <div><label className={labelCls}>Supplier</label>
                        <select name="supplierid" value={t.form.supplierid || ''} onChange={t.handleChange} className={fieldCls}>
                            <option value="">-- Select supplier --</option>
                            {SUPPLIERS.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                    <div><label className={labelCls}>Date of Manufacture</label><input type="date" name="dateofmanufacture" value={t.form.dateofmanufacture?.split('T')[0] || ''} onChange={t.handleChange} className={fieldCls} /></div>
                    <div><label className={labelCls}>Expiration Date</label><input type="date" name="expirationdate" value={t.form.expirationdate?.split('T')[0] || ''} onChange={t.handleChange} className={fieldCls} /></div>
                    <div><label className={labelCls}>Kashrut</label>
                        <div className="mt-2 space-y-2">
                            {KASHRUT_OPTIONS.map(opt => (
                                <label key={opt} className="flex items-center gap-3 cursor-pointer group">
                                    <input type="checkbox" checked={selectedKashrut.includes(opt)} onChange={() => toggleKashrut(opt)} className="w-4 h-4 accent-red-600" />
                                    <span className="text-sm text-gray-700 group-hover:text-gray-900">{opt}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                </Drawer>
            )}
        </>
    );
}
