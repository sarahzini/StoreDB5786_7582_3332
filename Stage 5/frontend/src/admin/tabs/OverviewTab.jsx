import { useState, useEffect } from 'react';
import SalesChart from '../../SalesChart';

const BASE = 'http://localhost:5000';

// ─── Statistics sub-tab (original) ───────────────────────────────────────────
function StatisticsTab() {
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
        }).catch(() => {});
    }, []);

    const cards = [
        { label: 'Total Stores',    value: stats.stores },
        { label: 'Active Drivers',  value: stats.drivers },
        { label: 'Total Customers', value: stats.customers },
        { label: 'System Status',   value: 'Online', green: true },
    ];

    return (
        <>
            <div className="grid grid-cols-4 gap-6 mb-8">
                {cards.map(c => (
                    <div key={c.label} className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
                        <p className="text-[11px] font-medium text-gray-400 tracking-[0.12em] uppercase mb-2">{c.label}</p>
                        <p className={`text-3xl font-bold ${c.green ? 'text-emerald-500' : 'text-gray-900'}`}>{c.value}</p>
                    </div>
                ))}
            </div>
            <div className="bg-white border border-gray-100 rounded-xl p-8 shadow-sm">
                <h3 className="text-sm font-bold text-gray-900 mb-6">Global Monthly Sales Overview</h3>
                {chartData.length > 0 ? (
                    <div style={{ width: '100%', height: 256 }}>
                        <SalesChart data={chartData} label="Revenue" prefix="₪" />
                    </div>
                ) : (
                    <p className="text-center text-gray-400 text-sm py-8">Loading chart data...</p>
                )}
            </div>
        </>
    );
}

// ─── Step card component ──────────────────────────────────────────────────────
function StepCard({ number, title, description, status }) {
    const colors = {
        idle:    'border-gray-100 bg-white',
        running: 'border-blue-200 bg-blue-50',
        success: 'border-emerald-200 bg-emerald-50',
        error:   'border-red-200 bg-red-50',
    };
    const icons = { idle: '⏳', running: '⚙️', success: '✅', error: '❌' };
    return (
        <div className={`border rounded-xl p-5 transition-all ${colors[status]}`}>
            <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">{number}</div>
                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-gray-900">{title}</h4>
                        <span className="text-base">{icons[status]}</span>
                    </div>
                    <p className="text-[12px] text-gray-500 mt-1 leading-relaxed">{description}</p>
                </div>
            </div>
        </div>
    );
}

// ─── Morning Dispatch sub-tab ─────────────────────────────────────────────────
function MorningDispatchTab() {
    const [status, setStatus]   = useState('idle'); // idle | running | done | error
    const [report, setReport]   = useState(null);
    const [step1St, setStep1St] = useState('idle');
    const [step2St, setStep2St] = useState('idle');

    const runDispatch = async () => {
        setStatus('running');
        setStep1St('running');
        setStep2St('idle');
        setReport(null);

        try {
            const res    = await fetch(`${BASE}/api/admin/morning-dispatch`, { method: 'POST' });
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
            <div className="bg-white border border-gray-100 rounded-xl p-8 shadow-sm mb-6">
                <div className="flex items-center gap-3 mb-3">
                    <span className="text-2xl">🌅</span>
                    <h2 className="text-lg font-bold text-gray-900">Morning Dispatch</h2>
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-600 border border-amber-100 uppercase tracking-wider">Daily Routine</span>
                </div>
                <p className="text-sm text-gray-500 leading-relaxed">
                    It's 6:00 AM at Rami Levy's logistics center. Before the first delivery truck rolls out, 
                    the operations manager runs this routine to prepare the day's deliveries and resolve 
                    any overnight stock alerts.
                </p>
                <p className="text-sm text-gray-500 leading-relaxed mt-2">
                    This program executes two critical operations in sequence:
                </p>
                <ul className="mt-3 space-y-1">
                    <li className="text-sm text-gray-600 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-400 flex-shrink-0" />
                        <strong>Fleet Loading</strong> — assigns all pending orders to available trucks, maximizing capacity usage for Delivery Company #1.
                    </li>
                    <li className="text-sm text-gray-600 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-400 flex-shrink-0" />
                        <strong>Emergency Restock</strong> — resolves an overnight stock shortage flagged for Store #5 by transferring 30 units of Product #1.
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
                />
                <StepCard
                    number="2"
                    title="Emergency Stock Transfer — Store #5"
                    description="Calls process_store_inventory_transfer(1, 5, 30): transfers 30 units of Product #1 to Store #5 to resolve an overnight stock shortage alert. Updates inventory levels across the chain."
                    status={step2St}
                />
            </div>

            {/* Action buttons */}
            {status === 'idle' && (
                <button onClick={runDispatch} className="w-full py-4 bg-gray-900 text-white rounded-xl text-[12px] font-bold tracking-[0.15em] uppercase hover:bg-red-600 transition-all active:scale-[0.98]">
                    🚀 Run Morning Dispatch
                </button>
            )}
            {status === 'running' && (
                <div className="w-full py-4 bg-blue-50 border border-blue-200 text-blue-600 rounded-xl text-[12px] font-bold tracking-[0.15em] uppercase text-center animate-pulse">
                    ⚙️ Running dispatch...
                </div>
            )}
            {(status === 'done' || status === 'error') && (
                <button onClick={reset} className="w-full py-3 bg-gray-100 text-gray-600 rounded-xl text-[11px] font-bold tracking-[0.15em] uppercase hover:bg-gray-200 transition-all">
                    ↺ Reset
                </button>
            )}

            {/* Report */}
            {report && !report.globalError && (
                <div className="mt-6 space-y-4">
                    <h3 className="text-sm font-bold text-gray-900">
                        📋 Dispatch Report — {new Date(report.timestamp).toLocaleString()}
                    </h3>

                    {/* Step 1 report */}
                    <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                        <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
                            <h4 className="text-[11px] font-bold text-gray-700 uppercase tracking-widest">Fleet Loading Results</h4>
                            {report.step1.error
                                ? <span className="text-[11px] font-bold text-red-500 bg-red-50 px-2.5 py-1 rounded">Error</span>
                                : <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded">{report.step1.total} order{report.step1.total !== 1 ? 's' : ''} assigned</span>
                            }
                        </div>
                        {report.step1.error ? (
                            <p className="px-6 py-4 text-sm text-red-500">{report.step1.error}</p>
                        ) : report.step1.assignments.length === 0 ? (
                            <p className="px-6 py-4 text-sm text-gray-400 italic">No pending orders to assign, or no available trucks.</p>
                        ) : (
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        {['Driver ID', 'Order ID', 'Truck Capacity'].map(h => (
                                            <th key={h} className="text-left px-6 py-3 text-[10px] font-semibold text-gray-400 tracking-widest uppercase">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {report.step1.assignments.map((a, i) => (
                                        <tr key={i} className="border-t border-gray-50 hover:bg-gray-50/50">
                                            <td className="px-6 py-3 text-sm font-bold text-gray-700">#{a.driver_id ?? a.driverid}</td>
                                            <td className="px-6 py-3 text-sm text-gray-600">#{a.order_id ?? a.orderid}</td>
                                            <td className="px-6 py-3 text-sm text-gray-600">{a.capacity ?? a.truck_capacity} orders</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>

                    {/* Step 2 report */}
                    <div className={`bg-white border rounded-xl p-6 shadow-sm ${report.step2.error ? 'border-red-100' : 'border-emerald-100'}`}>
                        <div className="flex items-center gap-3">
                            <span className="text-xl">{report.step2.error ? '❌' : '✅'}</span>
                            <div>
                                <h4 className="text-[11px] font-bold text-gray-700 uppercase tracking-widest">Emergency Stock Transfer</h4>
                                {report.step2.error
                                    ? <p className="text-sm text-red-500 mt-1">{report.step2.error}</p>
                                    : <p className="text-sm text-emerald-600 mt-1">30 units of Product #1 successfully transferred to Store #5.</p>
                                }
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Global error */}
            {report?.globalError && (
                <div className="mt-6 bg-red-50 border border-red-100 rounded-xl p-6 text-sm text-red-600">
                    ❌ {report.globalError}
                </div>
            )}
        </div>
    );
}

// ─── Main OverviewTab ─────────────────────────────────────────────────────────
export default function OverviewTab() {
    const [activeTab, setActiveTab] = useState('statistics');

    return (
        <div>
            <div className="flex gap-1 mb-6 bg-gray-100 rounded-xl p-1 w-fit">
                <button
                    onClick={() => setActiveTab('statistics')}
                    className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'statistics' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    📊 Statistics
                </button>
                <button
                    onClick={() => setActiveTab('morning')}
                    className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'morning' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    🌅 Morning Dispatch
                </button>
            </div>

            {activeTab === 'statistics' ? <StatisticsTab /> : <MorningDispatchTab />}
        </div>
    );
}
