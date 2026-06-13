import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Package, ShoppingCart, LogOut, X, Plus, User } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import SalesChart from './SalesChart';

const StoreDashboard = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const [storeData, setStoreData] = useState(location.state?.user || { storeid: null, storename: 'Store Manager', phone: 'Unknown' });
    const [activeTab, setActiveTab] = useState('Overview');
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [realInventory, setRealInventory] = useState([]);
    const [stats, setStats] = useState({ dailySales: "₪0", stockAlerts: 0, pendingRequests: 0, chartData: [] });
    const [orders, setOrders] = useState([]);
    const [statusMessage, setStatusMessage] = useState(null);
    const [orderModal, setOrderModal] = useState(null);
    const [orderQty, setOrderQty] = useState('');

    const [formData, setFormData] = useState({
        storename: '', phone: '', rating: '', websiteurl: '', email: '', password: ''
    });

    useEffect(() => {
        if (storeData.storeid) {
            setFormData({
                storename: storeData.storename || '',
                phone: storeData.phone || '',
                rating: storeData.rating || '',
                websiteurl: storeData.websiteurl || '',
                email: storeData.email || '',
                password: ''
            });
        }
    }, [storeData]);

    useEffect(() => {
        const fetchAllData = async () => {
            if (!storeData.storeid) return;
            try {
                const invRes = await fetch(`http://localhost:5000/api/inventory/${storeData.storeid}`);
                setRealInventory(await invRes.json());
                const statsRes = await fetch(`http://localhost:5000/api/store/stats/${storeData.storeid}`);
                setStats(await statsRes.json());
                const ordersRes = await fetch(`http://localhost:5000/api/store/orders/${storeData.storeid}`);
                setOrders(await ordersRes.json());
            } catch (error) { console.error("Error:", error); }
        };
        fetchAllData();
    }, [storeData.storeid]);

    const sendRestock = async (productid, productname, quantity) => {
        try {
            const res = await fetch('http://localhost:5000/api/store/restock', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ storeid: storeData.storeid, productid, quantity })
            });
            const result = await res.json();
            if (result.success) {
                setStatusMessage({ type: 'success', text: `Order placed for ${productname}!` });
            } else {
                setStatusMessage({ type: 'error', text: result.message || 'Order failed.' });
            }
        } catch (err) {
            setStatusMessage({ type: 'error', text: 'Error placing order.' });
        }
        setTimeout(() => setStatusMessage(null), 3000);
    };

    const renderMainContent = () => {
        if (activeTab === 'Overview') return (
            <div className="space-y-6">
                <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
                    <p className="text-[11px] font-medium text-gray-400 tracking-[0.12em] uppercase mb-4">Monthly Supply Activity</p>
                    <div className="w-full"><SalesChart data={stats.chartData} /></div>
                </div>
                <div className="grid grid-cols-3 gap-6">
                    {[{ label: 'Supply Expenses', value: stats.dailySales }, { label: 'Stock Alerts', value: stats.stockAlerts }, { label: 'Pending Requests', value: stats.pendingRequests }].map((stat) => (
                        <div key={stat.label} className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
                            <p className="text-[11px] font-medium text-gray-400 uppercase mb-2">{stat.label}</p>
                            <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                        </div>
                    ))}
                </div>
            </div>
        );

        if (activeTab === 'Inventory') return (
            <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50/50">
                        <tr className="border-b border-gray-50">
                            {['Product Name', 'Price', 'Exp. Date', 'Stock', 'Threshold', 'Status', ''].map(h => (
                                <th key={h} className="text-left px-5 py-3 text-[10px] font-medium text-gray-400 uppercase">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {realInventory.map((item, i) => (
                            <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50">
                                <td className="px-5 py-4 text-sm font-medium">{item.productname}</td>
                                <td className="px-5 py-4 text-sm text-gray-600">₪{item.price}</td>
                                <td className="px-5 py-4 text-sm text-gray-500">{new Date(item.expirationdate).toLocaleDateString()}</td>
                                <td className="px-5 py-4 text-sm">{item.quantity}</td>
                                <td className="px-5 py-4 text-sm text-gray-400">{item.minimumstock}</td>
                                <td className="px-5 py-4">
                                    <span className={`px-2 py-1 rounded text-[10px] ${item.quantity <= item.minimumstock ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                        {item.quantity <= item.minimumstock ? 'LOW STOCK' : 'OK'}
                                    </span>
                                </td>
                                <td className="px-5 py-4 text-right">
                                    <div className="flex gap-2 justify-end">
                                        <button
                                            onClick={() => sendRestock(item.productid, item.productname, item.minimumstock * 2)}
                                            disabled={item.quantity > item.minimumstock}
                                            className={`text-xs font-medium px-3 py-1 rounded-lg transition-all
                                                ${item.quantity <= item.minimumstock
                                                    ? 'bg-red-50 text-red-600 hover:bg-red-100'
                                                    : 'text-gray-300 cursor-default'}`}
                                        >
                                            Restock →
                                        </button>
                                        <button
                                            onClick={() => { setOrderModal(item); setOrderQty(item.minimumstock * 2); }}
                                            className="text-xs font-medium px-3 py-1 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all"
                                        >
                                            Order +
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );

        if (activeTab === 'Orders') return (
            <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
                <table className="w-full">
                    <thead><tr className="border-b border-gray-50">{['Request ID', 'Date', 'Status'].map(h => <th key={h} className="text-left px-5 py-3 text-[10px] font-medium text-gray-400 uppercase">{h}</th>)}</tr></thead>
                    <tbody>
                        {orders.map((o, i) => (
                            <tr key={i} className="border-b border-gray-50">
                                <td className="px-5 py-4 text-sm font-medium">#{o.id}</td>
                                <td className="px-5 py-4 text-sm">{new Date(o.date).toLocaleDateString()}</td>
                                <td className="px-5 py-4 text-sm"><span className="px-2 py-1 rounded bg-orange-50 text-orange-600 text-[10px]">{o.status}</span></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );

        if (activeTab === 'Account') return (
            <div className="bg-white border border-gray-100 rounded-xl p-8 max-w-2xl shadow-sm">
                <h2 className="text-lg font-bold mb-6 text-gray-900">Account Information</h2>
                <div className="grid grid-cols-2 gap-6">
                    <div className="col-span-2">
                        <label className="text-[10px] text-gray-400 uppercase">Store ID (Read Only)</label>
                        <input className="w-full mt-1 p-2.5 bg-gray-100 border border-gray-200 rounded-lg text-gray-400 cursor-not-allowed" value={storeData.storeid || ''} disabled />
                    </div>
                    <div>
                        <label className="text-[10px] text-gray-400 uppercase">Store Name</label>
                        <input className="w-full mt-1 p-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-red-500" value={formData.storename} onChange={(e) => setFormData({ ...formData, storename: e.target.value })} />
                    </div>
                    <div>
                        <label className="text-[10px] text-gray-400 uppercase">Email</label>
                        <input className="w-full mt-1 p-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-red-500" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                    </div>
                    <div>
                        <label className="text-[10px] text-gray-400 uppercase">Phone Number</label>
                        <input className="w-full mt-1 p-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-red-500" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                    </div>
                    <div>
                        <label className="text-[10px] text-gray-400 uppercase">Website URL</label>
                        <input className="w-full mt-1 p-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-red-500" value={formData.websiteurl} onChange={(e) => setFormData({ ...formData, websiteurl: e.target.value })} />
                    </div>
                    <div>
                        <label className="text-[10px] text-gray-400 uppercase">Rating (Read Only)</label>
                        <input className="w-full mt-1 p-2.5 bg-gray-100 border border-gray-200 rounded-lg text-gray-400 cursor-not-allowed" value={formData.rating || ''} disabled />
                    </div>
                    <div>
                        <label className="text-[10px] text-gray-400 uppercase">New Password</label>
                        <input type="password" placeholder="••••••••" className="w-full mt-1 p-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-red-500" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
                    </div>
                </div>
                <div className="flex justify-center mt-8">
                    <button
                        onClick={async () => {
                            try {
                                const res = await fetch('http://localhost:5000/api/store/update', {
                                    method: 'PUT',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ storeid: storeData.storeid, ...formData })
                                });
                                const result = await res.json();
                                if (result.success) {
                                    setStoreData(prev => ({ ...prev, ...formData }));
                                    setStatusMessage({ type: 'success', text: 'Information updated successfully!' });
                                } else {
                                    setStatusMessage({ type: 'error', text: result.message || 'Update failed.' });
                                }
                            } catch (err) {
                                setStatusMessage({ type: 'error', text: 'Error saving changes.' });
                            }
                            setTimeout(() => setStatusMessage(null), 3000);
                        }}
                        className="px-10 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all uppercase text-sm font-medium"
                    >
                        Save Changes
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="h-screen bg-[#F8F9FB] flex font-sans overflow-hidden">
            {/* SIDEBAR */}
            <div className="w-60 bg-white border-r border-gray-100 flex flex-col h-full">
                <div className="px-6 py-4 h-[73px] flex items-center border-b border-gray-100">
                    <img src="/Rami_Levy_Hashikma_Marketing_logo.png" alt="Rami Levy" className="h-10 object-contain" />
                </div>
                <div className="px-4 py-4 border-b border-gray-50">
                    <div className="flex items-center gap-3 bg-gray-50 rounded-lg px-3 py-2.5">
                        <div className="w-7 h-7 rounded-full bg-red-100 flex items-center justify-center font-bold text-[10px] text-red-600">
                            {storeData.storename ? storeData.storename.substring(0, 2).toUpperCase() : 'SM'}
                        </div>
                        <div>
                            <p className="text-xs font-medium text-gray-800 truncate w-32">{storeData.storename}</p>
                            <p className="text-[10px] text-gray-400">Tel: {storeData.phone}</p>
                        </div>
                    </div>
                </div>
                <nav className="flex-1 px-3 py-4 space-y-0.5">
                    {[
                        { id: 'Overview', icon: LayoutDashboard, label: 'Overview' },
                        { id: 'Inventory', icon: Package, label: 'My Inventory' },
                        { id: 'Orders', icon: ShoppingCart, label: 'Order Requests' },
                        { id: 'Account', icon: User, label: 'Account Info' }
                    ].map(({ id, icon: Icon, label }) => (
                        <button key={id} onClick={() => setActiveTab(id)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${activeTab === id ? 'bg-red-50 text-red-600 font-medium' : 'text-gray-500 hover:bg-gray-50'}`}>
                            <Icon size={15} /> {label}
                        </button>
                    ))}
                </nav>
                <div className="px-3 py-4 border-t border-gray-50">
                    <button onClick={() => navigate('/')} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:bg-red-50 hover:text-red-600 transition-all">
                        <LogOut size={15} /> Sign Out
                    </button>
                </div>
            </div>

            {/* MAIN CONTENT */}
            <div className="flex-1 flex flex-col h-full overflow-hidden">
                <header className="bg-white border-b border-gray-100 px-6 h-[73px] flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-medium text-gray-400 tracking-[0.14em] uppercase">Store Manager Portal</p>
                        <h1 className="text-lg font-semibold text-gray-900">{activeTab}</h1>
                    </div>
                    <button onClick={() => setIsDrawerOpen(true)} className="flex items-center gap-2 bg-[#0B1120] text-white px-4 py-2 rounded-lg text-[11px] font-medium uppercase hover:bg-red-600">
                        <Plus size={14} /> Preview
                    </button>
                </header>

                <main className="flex-1 p-8 overflow-y-auto bg-[#F8F9FB]">
                    {statusMessage && (
                        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl text-sm font-medium
                            animate-[slideIn_0.3s_ease-out]
                            ${statusMessage.type === 'success' ? 'bg-white border border-emerald-100 text-gray-800' : 'bg-white border border-red-100 text-gray-800'}`}
                            style={{ minWidth: '280px' }}
                        >
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${statusMessage.type === 'success' ? 'bg-emerald-100' : 'bg-red-100'}`}>
                                {statusMessage.type === 'success'
                                    ? <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8l3.5 3.5L13 4.5" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                    : <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 4l8 8M12 4l-8 8" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" /></svg>
                                }
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                                    {statusMessage.type === 'success' ? 'Success' : 'Error'}
                                </span>
                                <span className="text-sm text-gray-800">{statusMessage.text}</span>
                            </div>
                            <button onClick={() => setStatusMessage(null)} className="ml-auto text-gray-300 hover:text-gray-500 transition-colors">
                                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
                            </button>
                        </div>
                    )}
                    {renderMainContent()}
                </main>
            </div>

            {/* DRAWER */}
            {isDrawerOpen && (
                <div className="fixed inset-0 bg-black/40 z-50 flex justify-end">
                    <div className="w-96 bg-white h-full flex flex-col shadow-xl">
                        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
                            <h2 className="text-sm font-semibold text-gray-900">Preview</h2>
                            <button onClick={() => setIsDrawerOpen(false)} className="text-gray-400"><X size={16} /></button>
                        </div>
                        <main className="flex-1 p-8 overflow-auto">
                            {renderMainContent()}
                        </main>
                    </div>
                </div>
            )}

            {/* ORDER MODAL */}
            {orderModal && (
                <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
                    <div className="bg-white rounded-2xl shadow-2xl p-8 w-96">
                        <h2 className="text-lg font-bold text-gray-900 mb-1">Order Items</h2>
                        <p className="text-sm text-gray-400 mb-6">{orderModal.productname}</p>
                        <label className="text-[10px] text-gray-400 uppercase">Quantity</label>
                        <input
                            type="number"
                            min="1"
                            value={orderQty}
                            onChange={(e) => setOrderQty(e.target.value)}
                            className="w-full mt-1 p-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-red-500 text-sm mb-6"
                        />
                        <div className="flex gap-3">
                            <button
                                onClick={() => { setOrderModal(null); setOrderQty(''); }}
                                className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-500 hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={async () => {
                                    await sendRestock(orderModal.productid, orderModal.productname, parseInt(orderQty));
                                    setOrderModal(null);
                                    setOrderQty('');
                                }}
                                className="flex-1 py-2.5 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700"
                            >
                                Confirm Order
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StoreDashboard;