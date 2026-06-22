import { useState, useEffect } from 'react';
import { BarChart3, Sunrise, Zap, AlertTriangle, Clock, CheckCircle2, XCircle, RotateCcw, Loader2, Truck, Package } from 'lucide-react';
import SalesChart from '../../SalesChart';
import { t } from '../../translations';

const BASE = 'http://localhost:5000';

// ─── Statistics sub-tab (original) ───────────────────────────────────────────
function StatisticsTab({ lang }) {
    const [stats, setStats] = useState({ stores: 0, drivers: 0, customers: 0 });
    const [chartData, setChart] = useState([]);

    useEffect(() => {
        Promise.all([
            fetch(`${BASE}/api/admin/drivers`).then(r => r.json()),
            fetch(`${BASE}/api/admin/customers`).then(r => r.json()),
            fetch(`${BASE}/api/admin/stores`).then(r => r.json()),
            fetch(`${BASE}/api/admin/chart`).then(r => r.json()),
        ]).then(([drivers, customers, stores, chart]) => {
            setStats({ stores: stores.length, drivers: drivers.length, customers: customers.length });
            setChart(chart);
        }).catch(() => { });
    }, []);

    const cards = [
        { label: 'Total Stores', value: stats.stores },
        { label: 'Active Drivers', value: stats.drivers },
        { label: 'Total Customers', value: stats.customers },
        { label: 'System Status', value: 'Online', green: true },
    ];

    return (
        <>
            <div className="grid grid-cols-4 gap-6 mb-8">
                {cards.map(c => (
                    <div key={c.label} className="bg-white dark:!bg-transparent dark:bg-gradient-to-br dark:from-[#0B1120] dark:via-[#111827] dark:to-[#450a0a] border border-gray-100 dark:border-white/10 rounded-xl p-6 shadow-sm">
                        <p className="text-[11px] font-medium text-gray-400 tracking-[0.12em] uppercase mb-2">{t(c.label, lang)}</p>
                        <p className={`text-3xl font-bold ${c.green ? 'text-emerald-500 dark:text-emerald-400' : 'text-gray-900 dark:text-white'}`}>{c.green ? t(c.value, lang) : c.value}</p>
                    </div>
                ))}
            </div>
            <div className="bg-white dark:!bg-transparent dark:bg-gradient-to-br dark:from-[#0B1120] dark:via-[#111827] dark:to-[#450a0a] border border-gray-100 dark:border-white/10 rounded-xl p-8 shadow-sm">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-6">{t('Global Monthly Sales Overview', lang)}</h3>
                {chartData.length > 0 ? (
                    <div style={{ width: '100%', height: 256 }}>
                        <SalesChart data={chartData} label={t('Revenue', lang)} prefix="₪" />
                    </div>
                ) : (
                    <p className="text-center text-gray-400 text-sm py-8">{t('Loading chart data...', lang)}</p>
                )}
            </div>
        </>
    );
}

// ─── Step card component ──────────────────────────────────────────────────────
function StepCard({ number, title, description, status, lang }) {
    const colors = {
        idle: 'border-gray-100 dark:border-white/10 bg-white dark:bg-white/5',
        running: 'border-blue-200 dark:border-blue-500/20 bg-blue-50 dark:bg-blue-500/10',
        success: 'border-emerald-200 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/10',
        error: 'border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/10',
    };
    const StatusIcon = {
        idle: <Clock size={16} className="text-gray-400" />,
        running: <Loader2 size={16} className="text-blue-500 animate-spin" />,
        success: <CheckCircle2 size={16} className="text-emerald-500" />,
        error: <XCircle size={16} className="text-red-500" />,
    };
    return (
        <div className={`border rounded-xl p-5 transition-all ${colors[status]}`}>
            <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-gray-900 dark:bg-white/10 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">{number}</div>
                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-gray-900 dark:text-white">{t(title, lang)}</h4>
                        {StatusIcon[status]}
                    </div>
                    <p className="text-[12px] text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">{t(description, lang)}</p>
                </div>
            </div>
        </div>
    );
}

// ─── Morning Dispatch sub-tab ─────────────────────────────────────────────────
function MorningDispatchTab({ lang }) {
    const [status, setStatus] = useState('idle'); // idle | running | done | error
    const [report, setReport] = useState(null);
    const [step1St, setStep1St] = useState('idle');
    const [step2St, setStep2St] = useState('idle');

    const runDispatch = async () => {
        setStatus('running');
        setStep1St('running');
        setStep2St('idle');
        setReport(null);

        try {
            const res = await fetch(`${BASE}/api/admin/morning-dispatch`, { method: 'POST' });
            const result = await res.json();

            if (result.success) {
                const r = result.report;
                setStep1St(r.step1.error ? 'error' : 'success');
                setStep2St(r.step2.error ? 'error' : 'success');
                setReport(r);
                setStatus('done');
            } else {
                setStep1St('error');
                setStep2St('error');
                setStatus('error');
                setReport({ globalError: result.message });
            }
        } catch (err) {
            setStep1St('error');
            setStep2St('error');
            setStatus('error');
            setReport({ globalError: 'Server connection failed.' });
        }
    };

    const reset = () => { setStatus('idle'); setReport(null); setStep1St('idle'); setStep2St('idle'); };

    return (
        <div className="max-w-3xl">
            {/* Header */}
            <div className="bg-white dark:!bg-transparent dark:bg-gradient-to-br dark:from-[#0B1120] dark:via-[#111827] dark:to-[#450a0a] border border-gray-100 dark:border-white/10 rounded-xl p-8 shadow-sm mb-6">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center">
                        <Sunrise size={18} className="text-amber-500" />
                    </div>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">{t('Morning Dispatch', lang)}</h2>
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-500/20 uppercase tracking-wider">{t('Daily Routine', lang)}</span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                    {t("It's 6:00 AM at Rami Levy's logistics center. Before the first delivery truck rolls out, the operations manager runs this routine to prepare the day's deliveries and resolve any overnight stock alerts.", lang)}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mt-2">
                    {t('This program executes two critical operations in sequence:', lang)}
                </p>
                <ul className="mt-3 space-y-2">
                    <li className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-3">
                        <div className="w-6 h-6 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Truck size={12} className="text-blue-500" />
                        </div>
                        <span><strong>{t('Fleet Loading', lang)}</strong> — {t('assigns all pending orders to available trucks, maximizing capacity usage for Delivery Company #1.', lang)}</span>
                    </li>
                    <li className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-3">
                        <div className="w-6 h-6 rounded-lg bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Package size={12} className="text-orange-500" />
                        </div>
                        <span><strong>{t('Emergency Restock', lang)}</strong> — {t('resolves an overnight stock shortage flagged for Store #5 by transferring 30 units of Product #1.', lang)}</span>
                    </li>
                </ul>
            </div>

            {/* Steps */}
            <div className="space-y-3 mb-6">
                <StepCard
                    number="1"
                    title="Optimize Fleet Loading — Delivery Company #1"
                    description="Calls optimize_fleet_loading(1): fetches all available trucks for Delivery Company #1, then assigns pending PENDING orders one by one until each truck reaches its capacity. Returns a manifest of all driver → order assignments."
                    status={step1St}
                    lang={lang}
                />
                <StepCard
                    number="2"
                    title="Emergency Stock Transfer — Store #5"
                    description="Calls process_store_inventory_transfer(1, 5, 30): transfers 30 units of Product #1 to Store #5 to resolve an overnight stock shortage alert. Updates inventory levels across the chain."
                    status={step2St}
                    lang={lang}
                />
            </div>

            {/* Action buttons */}
            {status === 'idle' && (
                <button onClick={runDispatch} className="w-full py-4 bg-gray-900 dark:bg-white/10 text-white rounded-xl text-[12px] font-bold tracking-[0.15em] uppercase hover:bg-red-600 dark:hover:bg-red-500 transition-all active:scale-[0.98] flex items-center justify-center gap-3">
                    <Zap size={16} /> {t('Run Morning Dispatch', lang)}
                </button>
            )}
            {status === 'running' && (
                <div className="w-full py-4 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 text-blue-600 dark:text-blue-400 rounded-xl text-[12px] font-bold tracking-[0.15em] uppercase text-center flex items-center justify-center gap-3 animate-pulse">
                    <Loader2 size={16} className="animate-spin" /> {t('Running dispatch...', lang)}
                </div>
            )}
            {(status === 'done' || status === 'error') && (
                <button onClick={reset} className="w-full py-3 bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 rounded-xl text-[11px] font-bold tracking-[0.15em] uppercase hover:bg-gray-200 dark:hover:bg-white/10 transition-all flex items-center justify-center gap-3">
                    <RotateCcw size={14} /> {t('Reset', lang)}
                </button>
            )}

            {/* Report */}
            {report && !report.globalError && (
                <div className="mt-6 space-y-4">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <BarChart3 size={16} className="text-gray-500" /> {t('Dispatch Report', lang)} — {new Date(report.timestamp).toLocaleString()}
                    </h3>

                    {/* Step 1 report */}
                    <div className="bg-white dark:!bg-transparent dark:bg-gradient-to-br dark:from-[#0B1120] dark:via-[#111827] dark:to-[#450a0a] border border-gray-100 dark:border-white/10 rounded-xl overflow-hidden shadow-sm">
                        <div className="px-6 py-4 border-b border-gray-50 dark:border-white/5 flex items-center justify-between">
                            <h4 className="text-[11px] font-bold text-gray-700 dark:text-gray-300 uppercase tracking-widest">{t('Fleet Loading Results', lang)}</h4>
                            {report.step1.error
                                ? <span className="text-[11px] font-bold text-red-500 bg-red-50 dark:bg-red-500/10 dark:text-red-400 px-2.5 py-1 rounded flex items-center gap-1.5"><XCircle size={12} /> {t('Error', lang)}</span>
                                : <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 rounded flex items-center gap-1.5"><CheckCircle2 size={12} /> {report.step1.total} {t(report.step1.total !== 1 ? 'orders assigned' : 'order assigned', lang)}</span>
                            }
                        </div>
                        {report.step1.error ? (
                            <p className="px-6 py-4 text-sm text-red-500 dark:text-red-400">{report.step1.error}</p>
                        ) : report.step1.assignments.length === 0 ? (
                            <p className="px-6 py-4 text-sm text-gray-400 italic">{t('No pending orders to assign, or no available trucks.', lang)}</p>
                        ) : (
                            <table className="w-full">
                                <thead className="bg-gray-50 dark:bg-white/5">
                                    <tr>
                                        {['Driver ID', 'Order ID', 'Truck Capacity'].map(h => (
                                            <th key={h} className="text-start px-6 py-3 text-[10px] font-semibold text-gray-400 tracking-widest uppercase">{t(h, lang)}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {report.step1.assignments.map((a, i) => (
                                        <tr key={i} className="border-t border-gray-50 dark:border-white/5 hover:bg-gray-50/50 dark:hover:bg-white/5 text-gray-700 dark:text-gray-300">
                                            <td className="px-6 py-3 text-sm font-bold">#{a.driver_id ?? a.driverid}</td>
                                            <td className="px-6 py-3 text-sm">#{a.order_id ?? a.orderid}</td>
                                            <td className="px-6 py-3 text-sm">{a.capacity ?? a.truck_capacity} {t('orders', lang)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>

                    {/* Step 2 report */}
                    <div className={`bg-white dark:!bg-transparent dark:bg-gradient-to-br dark:from-[#0B1120] dark:via-[#111827] dark:to-[#450a0a] border rounded-xl p-6 shadow-sm ${report.step2.error ? 'border-red-100 dark:border-red-500/20' : 'border-emerald-100 dark:border-emerald-500/20'}`}>
                        <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${report.step2.error ? 'bg-red-50 dark:bg-red-500/10' : 'bg-emerald-50 dark:bg-emerald-500/10'}`}>
                                {report.step2.error ? <XCircle size={16} className="text-red-500" /> : <CheckCircle2 size={16} className="text-emerald-500" />}
                            </div>
                            <div>
                                <h4 className="text-[11px] font-bold text-gray-700 dark:text-gray-300 uppercase tracking-widest">{t('Emergency Stock Transfer', lang)}</h4>
                                {report.step2.error
                                    ? <p className="text-sm text-red-500 dark:text-red-400 mt-1">{report.step2.error}</p>
                                    : <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-1">{t('30 units of Product #1 successfully transferred to Store #5.', lang)}</p>
                                }
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Global error */}
            {report?.globalError && (
                <div className="mt-6 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-xl p-6 text-sm text-red-600 dark:text-red-400 flex items-center gap-3">
                    <AlertTriangle size={18} /> {t(report.globalError, lang)}
                </div>
            )}
        </div>
    );
}

// ─── Main OverviewTab ─────────────────────────────────────────────────────────
export default function OverviewTab({ lang }) {
    const [activeTab, setActiveTab] = useState('statistics');

    return (
        <div>
            <div className="flex gap-1 mb-6 bg-gray-100 dark:bg-white/5 rounded-xl p-1 w-fit border border-transparent dark:border-white/10">
                <button
                    onClick={() => setActiveTab('statistics')}
                    className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === 'statistics' ? 'bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
                >
                    <BarChart3 size={14} /> {t('Statistics', lang)}
                </button>
                <button
                    onClick={() => setActiveTab('morning')}
                    className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === 'morning' ? 'bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
                >
                    <Sunrise size={14} /> {t('Morning Dispatch', lang)}
                </button>
            </div>

            {activeTab === 'statistics' ? <StatisticsTab lang={lang} /> : <MorningDispatchTab lang={lang} />}
        </div>
    );
}
