import { useState, useEffect } from 'react';
import useTab from '../shared/useTab';
import DataTable from '../shared/DataTable';
import Drawer from '../shared/Drawer';
import { Toast, AddButton } from '../shared/ui';
import { Truck } from 'lucide-react';
import { t } from '../../translations';

const BASE = 'http://localhost:5000';
const ISRAEL_REGIONS = [
    'Tel Aviv', 'Jerusalem', 'Haifa', 'Beersheba', 'Eilat', 'Ashdod',
    'Netanya', 'Petah Tikva', 'Rishon LeZion', 'Holon', 'Bnei Brak',
    'Ramat Gan', 'Herzliya', 'Kfar Saba', "Ra'anana", 'Rehovot',
    'Ashkelon', 'Acre', 'Nazareth', 'Tiberias', 'Hadera', 'Lod',
    'Ramla', 'Kiryat Gat', 'Kiryat Shmona', 'Nahariya', 'Dimona',
    'Arad', 'Beit Shemesh', 'Afula',
];
const fieldCls    = "w-full mt-1.5 p-3 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-50 dark:focus:ring-red-900/30 text-gray-900 dark:text-white transition-all shadow-sm font-medium";
const fieldErrCls = "w-full mt-1.5 p-3 bg-white dark:bg-white/5 border border-red-400 dark:border-red-500/50 rounded-lg text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-50 dark:focus:ring-red-900/30 text-gray-900 dark:text-white transition-all shadow-sm font-medium";
const labelCls    = "block text-[10px] font-bold text-gray-400 tracking-[0.1em] uppercase mb-1";

// useEffect fixes the fetch
function DriversPopup({ deliveryId, onClose, lang }) {
    const [drivers, setDrivers] = useState(null);
    useEffect(() => {
        fetch(`${BASE}/api/admin/delivery/${deliveryId}/drivers`)
            .then(r => r.json()).then(setDrivers).catch(() => setDrivers([]));
    }, [deliveryId]);
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
            <div className="absolute inset-0 bg-black/30 dark:bg-black/60" onClick={onClose} />
            <div className="relative bg-white dark:!bg-transparent dark:bg-gradient-to-br dark:from-[#0B1120] dark:via-[#111827] dark:to-[#450a0a] rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4 border border-transparent dark:border-white/10">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white">{t('Linked Trucks', lang)}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">✕</button>
                </div>
                {drivers === null ? <p className="text-sm text-gray-400">{t('Loading...', lang)}</p>
                : drivers.length === 0 ? <p className="text-sm text-gray-400 italic">{t('No trucks linked to this company.', lang)}</p>
                : <div className="space-y-2 max-h-64 overflow-y-auto">
                    {drivers.map((d, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-white/5 rounded-lg text-sm border border-transparent dark:border-white/5">
                            <span className="font-semibold text-gray-700 dark:text-gray-300">{d.licenseplate}</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${d.active === 1 ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400' : 'bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400'}`}>
                                {d.active === 1 ? t('Active', lang) : t('Offline', lang)}
                            </span>
                            <span className="text-gray-400 text-[11px] ml-auto">{t(d.maintenancestatus, lang)}</span>
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

export default function DeliveryTab({ lang }) {
    const tab = useTab('/api/admin/delivery', 'deliverycieid');
    const [hiddenIds, setHiddenIds]             = useState([]);
    const [confirm, setConfirm]                 = useState(null);
    const [selectedRegions, setSelectedRegions] = useState([]);
    const [errors, setErrors]                   = useState({});
    const [driversPopup, setDriversPopup]       = useState(null);

    const COLS_WITH_DRIVERS = [
        ...COLUMNS,
        { key: 'trucks', label: 'Trucks', render: r => (
            <button onClick={e => { e.stopPropagation(); setDriversPopup(r.deliverycieid); }}
                className="flex items-center gap-2 text-[11px] font-semibold px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 transition-all whitespace-nowrap">
                <Truck size={14} className="text-blue-500" /> {t('View', lang)}
            </button>
        )},
    ];

    const toggleRegion = r => setSelectedRegions(prev => prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r]);
    const openAdd  = () => { tab.openAdd(); setSelectedRegions([]); setErrors({}); };
    const openEdit = row => { tab.openEdit(row); setSelectedRegions(row.regions ? row.regions.split(',').map(r => r.trim()) : []); setErrors({}); };

    const askDelete = row => setConfirm({
        message: `Hide "${row.deliveryciename}" from the list?`,
        onConfirm: () => { setHiddenIds(prev => [...prev, row.deliverycieid]); tab.setToast({ type: 'success', text: `"${row.deliveryciename}" hidden.` }); setConfirm(null); },
    });

    const validate = () => {
        const e = {};
        if (!/^\d{10}$/.test((tab.form.deliveryciephonenb || '').replace(/[-\s]/g, ''))) e.phone = 'Phone must contain exactly 10 digits.';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(tab.form.email || '')) e.email = 'Please enter a valid email address.';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const askSave = () => {
        if (!validate()) return;
        const isEdit = !!tab.form.deliverycieid;
        setConfirm({
            message: isEdit ? `Save changes to "${tab.form.deliveryciename}"?` : `Add new company "${tab.form.deliveryciename}"?`,
            onConfirm: () => { setConfirm(null); doSave(); },
        });
    };

    const doSave = async () => {
        const isEdit = !!tab.form.deliverycieid;
        const url = isEdit ? `${BASE}/api/admin/delivery/${tab.form.deliverycieid}` : `${BASE}/api/admin/delivery`;
        try {
            const res = await fetch(url, { method: isEdit ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...tab.form, regions: selectedRegions.join(',') }) });
            const result = await res.json();
            if (result.success) { tab.setToast({ type: 'success', text: isEdit ? 'Updated.' : 'Added.' }); tab.close(); tab.load(); }
            else tab.setToast({ type: 'error', text: result.message || 'Error.' });
        } catch { tab.setToast({ type: 'error', text: 'Server error.' }); }
    };

    const visibleRows = tab.filteredRows.filter(r => !hiddenIds.includes(r.deliverycieid));
    const PAGE_SIZE   = tab.PAGE_SIZE;
    const totalPages  = Math.max(1, Math.ceil(visibleRows.length / PAGE_SIZE));
    const pagedRows   = visibleRows.slice((tab.page - 1) * PAGE_SIZE, tab.page * PAGE_SIZE);

    return (
        <>
            {tab.toast && <Toast message={t(tab.toast.text, lang)} type={tab.toast.type} onDone={() => tab.setToast(null)} />}
            {driversPopup && <DriversPopup deliveryId={driversPopup} onClose={() => setDriversPopup(null)} lang={lang} />}
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
            <AddButton label="Delivery Company" onClick={openAdd} lang={lang} />
            <DataTable columns={COLS_WITH_DRIVERS} rows={pagedRows} onEdit={openEdit} onDelete={askDelete} emptyLabel={t('No delivery companies.', lang)}
                loading={tab.loading} search={tab.search} onSearchChange={tab.setSearch}
                page={tab.page} totalPages={totalPages} onPageChange={tab.setPage} totalCount={visibleRows.length} lang={lang} />
            {tab.drawer && (
                <Drawer title={tab.form.deliverycieid ? 'Edit Delivery Company' : 'Add Delivery Company'} onClose={tab.close} onSubmit={askSave} lang={lang}>
                    <div><label className={labelCls}>{t('Company Name', lang)}</label><input type="text" name="deliveryciename" value={tab.form.deliveryciename || ''} onChange={tab.handleChange} className={fieldCls} placeholder="e.g. Logistics Corp" /></div>
                    <div>
                        <label className={labelCls}>{t('Phone', lang)}</label>
                        <input type="text" name="deliveryciephonenb" value={tab.form.deliveryciephonenb || ''} onChange={tab.handleChange} className={errors.phone ? fieldErrCls : fieldCls} placeholder="e.g. 0501234567" />
                        {errors.phone && <p className="text-[11px] text-red-500 mt-1">{t(errors.phone, lang)}</p>}
                    </div>
                    <div>
                        <label className={labelCls}>{t('Email', lang)}</label>
                        <input type="text" name="email" value={tab.form.email || ''} onChange={tab.handleChange} className={errors.email ? fieldErrCls : fieldCls} placeholder="e.g. contact@company.co.il" />
                        {errors.email && <p className="text-[11px] text-red-500 mt-1">{t(errors.email, lang)}</p>}
                    </div>
                    <div>
                        <label className={labelCls}>{t('Regions Served', lang)}</label>
                        <div className="mt-2 grid grid-cols-2 gap-1.5 max-h-56 overflow-y-auto pr-1">
                            {ISRAEL_REGIONS.map(region => (
                                <label key={region} className="flex items-center gap-2 cursor-pointer group">
                                    <input type="checkbox" checked={selectedRegions.includes(region)} onChange={() => toggleRegion(region)} className="w-4 h-4 accent-red-600 flex-shrink-0" />
                                    <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white">{t(region, lang)}</span>
                                </label>
                            ))}
                        </div>
                        {selectedRegions.length > 0 && <p className="text-[11px] text-gray-400 mt-2">{selectedRegions.length} {t('region(s) selected', lang)}</p>}
                    </div>
                </Drawer>
            )}
        </>
    );
}
