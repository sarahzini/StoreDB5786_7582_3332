import { useState, useEffect } from 'react';
import SalesChart from '../../SalesChart';

const BASE = 'http://localhost:5000';

export default function OverviewTab() {
    const [stats, setStats]     = useState({ stores: 0, drivers: 0, customers: 0 });
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
