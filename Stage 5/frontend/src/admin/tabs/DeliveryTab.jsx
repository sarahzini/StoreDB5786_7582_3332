import { useState, useEffect } from 'react';
import useTab from '../shared/useTab';
import DataTable from '../shared/DataTable';
import Drawer from '../shared/Drawer';
import { Toast, AddButton } from '../shared/ui';

const BASE = 'http://localhost:5000';
const ISRAEL_REGIONS = [
    'Tel Aviv', 'Jerusalem', 'Haifa', 'Beersheba', 'Eilat', 'Ashdod',
    'Netanya', 'Petah Tikva', 'Rishon LeZion', 'Holon', 'Bnei Brak',
    'Ramat Gan', 'Herzliya', 'Kfar Saba', "Ra'anana", 'Rehovot',
    'Ashkelon', 'Acre', 'Nazareth', 'Tiberias', 'Hadera', 'Lod',
    'Ramla', 'Kiryat Gat', 'Kiryat Shmona', 'Nahariya', 'Dimona',
    'Arad', 'Beit Shemesh', 'Afula',
];
const fieldCls    = "w-full mt-1.5 p-3 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-red-500 transition-all shadow-sm font-medium";
const fieldErrCls = "w-full mt-1.5 p-3 bg-white border border-red-400 rounded-lg text-sm outline-none focus:border-red-500 transition-all shadow-sm font-medium";
const labelCls    = "block text-[10px] font-bold text-gray-400 tracking-[0.1em] uppercase mb-1";

// useEffect fixes the fetch
function DriversPopup({ deliveryId, onClose }) {
    const [drivers, setDrivers] = useState(null);
    useEffect(() => {
        fetch(`${BASE}/api/admin/delivery/${deliveryId}/drivers`)
            .then(r => r.json()).then(setDrivers).catch(() => setDrivers([]));
    }, [deliveryId]);
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
            <div className="absolute inset-0 bg-black/30" onClick={onClose} />
            <div className="relative bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-gray-900">Linked Trucks</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
                </div>
                {drivers === null ? <p className="text-sm text-gray-400">Loading...</p>
                : drivers.length === 0 ? <p className="text-sm text-gray-400 italic">No trucks linked to this company.</p>
                : <div className="space-y-2 max-h-64 overflow-y-auto">
                    {drivers.map((d, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg text-sm">
                            <span className="font-semibold text-gray-700">{d.licenseplate}</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${d.active === 1 ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                                {d.active === 1 ? 'Active' : 'Offline'}
                            </span>
                            <span className="text-gray-400 text-[11px] ml-auto">{d.maintenancestatus}</span>
                        </div>
                    ))}
                </div>}
            </div>
        </div>
    );
}

const COLUMNS = [
    { key: 'deliveryciename',    label: 'Company Name' },
    { key: 'deliveryciephonenb', label: 'Phone' },
    { key: 'email',              label: 'Email' },
    { key: 'regions',            label: 'Regions Served' },
];

export default function DeliveryTab() {
    const t = useTab('/api/admin/delivery', 'deliverycieid');
    const [hiddenIds, setHiddenIds]             = useState([]);
    const [confirm, setConfirm]                 = useState(null);
    const [selectedRegions, setSelectedRegions] = useState([]);
    const [errors, setErrors]                   = useState({});
    const [driversPopup, setDriversPopup]       = useState(null);

    const COLS_WITH_DRIVERS = [
        ...COLUMNS,
        { key: 'trucks', label: 'Trucks', render: r => (
            <button onClick={e => { e.stopPropagation(); setDriversPopup(r.deliverycieid); }}
                className="text-[11px] font-semibold px-3 py-1.5 rounded-lg border border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100 transition-all whitespace-nowrap">
                🚛 View
            </button>
        )},
    ];

    const toggleRegion = r => setSelectedRegions(prev => prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r]);
    const openAdd  = () => { t.openAdd(); setSelectedRegions([]); setErrors({}); };
    const openEdit = row => { t.openEdit(row); setSelectedRegions(row.regions ? row.regions.split(',').map(r => r.trim()) : []); setErrors({}); };

    const askDelete = row => setConfirm({
        message: `Hide "${row.deliveryciename}" from the list?`,
        onConfirm: () => { setHiddenIds(prev => [...prev, row.deliverycieid]); t.setToast({ type: 'success', text: `"${row.deliveryciename}" hidden.` }); setConfirm(null); },
    });

    const validate = () => {
        const e = {};
        if (!/^\d{10}$/.test((t.form.deliveryciephonenb || '').replace(/[-\s]/g, ''))) e.phone = 'Phone must contain exactly 10 digits.';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t.form.email || '')) e.email = 'Please enter a valid email address.';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const askSave = () => {
        if (!validate()) return;
        const isEdit = !!t.form.deliverycieid;
        setConfirm({
            message: isEdit ? `Save changes to "${t.form.deliveryciename}"?` : `Add new company "${t.form.deliveryciename}"?`,
            onConfirm: () => { setConfirm(null); doSave(); },
        });
    };

    const doSave = async () => {
        const isEdit = !!t.form.deliverycieid;
        const url = isEdit ? `${BASE}/api/admin/delivery/${t.form.deliverycieid}` : `${BASE}/api/admin/delivery`;
        try {
            const res = await fetch(url, { method: isEdit ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...t.form, regions: selectedRegions.join(',') }) });
            const result = await res.json();
            if (result.success) { t.setToast({ type: 'success', text: isEdit ? 'Updated.' : 'Added.' }); t.close(); t.load(); }
            else t.setToast({ type: 'error', text: result.message || 'Error.' });
        } catch { t.setToast({ type: 'error', text: 'Server error.' }); }
    };

    const visibleRows = t.filteredRows.filter(r => !hiddenIds.includes(r.deliverycieid));
    const PAGE_SIZE   = t.PAGE_SIZE;
    const totalPages  = Math.max(1, Math.ceil(visibleRows.length / PAGE_SIZE));
    const pagedRows   = visibleRows.slice((t.page - 1) * PAGE_SIZE, t.page * PAGE_SIZE);

    return (
        <>
            {t.toast && <Toast message={t.toast.text} type={t.toast.type} onDone={() => t.setToast(null)} />}
            {driversPopup && <DriversPopup deliveryId={driversPopup} onClose={() => setDriversPopup(null)} />}
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
            <AddButton label="Delivery Company" onClick={openAdd} />
            <DataTable columns={COLS_WITH_DRIVERS} rows={pagedRows} onEdit={openEdit} onDelete={askDelete} emptyLabel="No delivery companies."
                loading={t.loading} search={t.search} onSearchChange={t.setSearch}
                page={t.page} totalPages={totalPages} onPageChange={t.setPage} totalCount={visibleRows.length} />
            {t.drawer && (
                <Drawer title={t.form.deliverycieid ? 'Edit Delivery Company' : 'Add Delivery Company'} onClose={t.close} onSubmit={askSave}>
                    <div><label className={labelCls}>Company Name</label><input type="text" name="deliveryciename" value={t.form.deliveryciename || ''} onChange={t.handleChange} className={fieldCls} placeholder="e.g. Logistics Corp" /></div>
                    <div>
                        <label className={labelCls}>Phone</label>
                        <input type="text" name="deliveryciephonenb" value={t.form.deliveryciephonenb || ''} onChange={t.handleChange} className={errors.phone ? fieldErrCls : fieldCls} placeholder="e.g. 0501234567" />
                        {errors.phone && <p className="text-[11px] text-red-500 mt-1">{errors.phone}</p>}
                    </div>
                    <div>
                        <label className={labelCls}>Email</label>
                        <input type="text" name="email" value={t.form.email || ''} onChange={t.handleChange} className={errors.email ? fieldErrCls : fieldCls} placeholder="e.g. contact@company.co.il" />
                        {errors.email && <p className="text-[11px] text-red-500 mt-1">{errors.email}</p>}
                    </div>
                    <div>
                        <label className={labelCls}>Regions Served</label>
                        <div className="mt-2 grid grid-cols-2 gap-1.5 max-h-56 overflow-y-auto pr-1">
                            {ISRAEL_REGIONS.map(region => (
                                <label key={region} className="flex items-center gap-2 cursor-pointer group">
                                    <input type="checkbox" checked={selectedRegions.includes(region)} onChange={() => toggleRegion(region)} className="w-4 h-4 accent-red-600 flex-shrink-0" />
                                    <span className="text-sm text-gray-700 group-hover:text-gray-900">{region}</span>
                                </label>
                            ))}
                        </div>
                        {selectedRegions.length > 0 && <p className="text-[11px] text-gray-400 mt-2">{selectedRegions.length} region(s) selected</p>}
                    </div>
                </Drawer>
            )}
        </>
    );
}
