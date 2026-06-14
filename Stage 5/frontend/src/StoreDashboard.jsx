import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Package, ShoppingCart, LogOut, X, Plus, User, Search, ShoppingBag, Droplets, Utensils, Apple } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import SalesChart from './SalesChart';

const StoreDashboard = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const [storeData, setStoreData] = useState(location.state?.user || { storeid: null, storename: 'Store Manager', phone: 'Unknown' });
    const [activeTab, setActiveTab] = useState('Overview');
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    const [realInventory, setRealInventory] = useState([]);
    const [allProducts, setAllProducts] = useState([]);
    const [stats, setStats] = useState({ dailySales: "₪0", stockAlerts: 0, pendingRequests: 0, chartData: [] });
    const [orders, setOrders] = useState([]);

    const [statusMessage, setStatusMessage] = useState(null);
    const [orderModal, setOrderModal] = useState(null);
    const [orderQty, setOrderQty] = useState('');
    const [orderDetails, setOrderDetails] = useState(null);
    const [loadingDetails, setLoadingDetails] = useState(false);

    const [formData, setFormData] = useState({ storename: '', phone: '', rating: '', websiteurl: '', email: '', password: '' });

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
                const invRes = await fetch(`http://localhost:5000/api/store/inventory/${storeData.storeid}`);
                setRealInventory(await invRes.json());

                const prodRes = await fetch('http://localhost:5000/api/store/products');
                const prodData = await prodRes.json();
                setAllProducts(Array.isArray(prodData) ? prodData : []);

                const statsRes = await fetch(`http://localhost:5000/api/store/stats/${storeData.storeid}`);
                setStats(await statsRes.json());

                const ordersRes = await fetch(`http://localhost:5000/api/store/orders/${storeData.storeid}`);
                setOrders(await ordersRes.json());
            } catch (error) { console.error("Error:", error); }
        };
        fetchAllData();
    }, [storeData.storeid]);

    useEffect(() => {
        const refreshStoreData = async () => {
            if (!storeData.storeid) return;
            try {
                const res = await fetch(`http://localhost:5000/api/store/${storeData.storeid}`);
                const result = await res.json();
                if (result.success) setStoreData(result.user);
            } catch (err) { console.error("Erreur refresh store:", err); }
        };
        refreshStoreData();
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
                const ordersRes = await fetch(`http://localhost:5000/api/store/orders/${storeData.storeid}`);
                setOrders(await ordersRes.json());
            } else {
                setStatusMessage({ type: 'error', text: result.message || 'Order failed.' });
            }
        } catch (err) {
            setStatusMessage({ type: 'error', text: 'Error placing order.' });
        }
        setTimeout(() => setStatusMessage(null), 3000);
    };

    const getProductIcon = (name) => {
        const l = name.toLowerCase();
        if (l.includes('water')) return Droplets;
        if (l.includes('fish') || l.includes('veal')) return Utensils;
        if (l.includes('apple') || l.includes('pepper') || l.includes('tomato')) return Apple;
        return ShoppingBag;
    };

    const renderMainContent = () => {
        // ── OVERVIEW ──────────────────────────────────────────────────
        if (activeTab === 'Overview') return (
            <div className="space-y-6">
                <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                    <p className="text-[10px] font-semibold text-gray-400 tracking-widest uppercase mb-4">Monthly Supply Activity</p>
                    <div className="w-full" style={{ height: '280px' }}>
                        <SalesChart data={stats.chartData} label="Supply Expenses" prefix="₪" />
                    </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                    {[
                        { label: 'Supply Expenses', value: stats.dailySales, color: 'text-gray-900' },
                        { label: 'Stock Alerts', value: stats.stockAlerts, color: stats.stockAlerts > 0 ? 'text-red-500' : 'text-gray-900' },
                        { label: 'Pending Requests', value: stats.pendingRequests, color: 'text-gray-900' },
                    ].map(s => (
                        <div key={s.label} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                            <p className="text-[10px] font-semibold text-gray-400 tracking-widest uppercase mb-2">{s.label}</p>
                            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                        </div>
                    ))}
                </div>
            </div>
        );

        // ── INVENTORY ─────────────────────────────────────────────────
        if (activeTab === 'Inventory') return (
            <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full" style={{ borderCollapse: 'collapse' }}>
                    <thead>
                        <tr className="border-b border-gray-100 bg-gray-50">
                            {['Product Name', 'Price', 'Exp. Date', 'Stock', 'Threshold', 'Status', ''].map(h => (
                                <th key={h} className="text-left px-5 py-3 text-[10px] font-semibold text-gray-400 tracking-widest uppercase whitespace-nowrap">
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {realInventory.map((item, i) => {
                            const low = item.quantity <= item.minimumstock;
                            return (
                                <tr key={i} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/60 transition-colors">
                                    <td className="px-5 py-3.5 text-sm font-medium text-gray-800">{item.productname}</td>
                                    <td className="px-5 py-3.5 text-sm font-semibold text-gray-700">₪{item.price}</td>
                                    <td className="px-5 py-3.5 text-sm text-gray-500">{new Date(item.expirationdate).toLocaleDateString()}</td>
                                    <td className="px-5 py-3.5 text-sm font-bold text-gray-800">{item.quantity}</td>
                                    <td className="px-5 py-3.5 text-sm text-gray-400">{item.minimumstock}</td>
                                    <td className="px-5 py-3.5">
                                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold tracking-wide ${low ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>
                                            {low ? '⚠ LOW STOCK' : '✓ OK'}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3.5">
                                        <div className="flex gap-2 justify-end">
                                            <button
                                                onClick={() => sendRestock(item.productid, item.productname, item.minimumstock * 2)}
                                                disabled={!low}
                                                className={`text-[11px] font-semibold px-3 py-1.5 rounded-lg border transition-all whitespace-nowrap
                                                    ${low ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100 hover:border-red-300' : 'bg-gray-50 text-gray-300 border-gray-100 cursor-default'}`}
                                            >
                                                ↺ Restock
                                            </button>
                                            <button
                                                onClick={() => { setOrderModal(item); setOrderQty(item.minimumstock * 2); }}
                                                className="text-[11px] font-semibold px-3 py-1.5 rounded-lg border border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100 hover:border-blue-300 transition-all whitespace-nowrap"
                                            >
                                                + Order
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        );

        // ── CATALOG ───────────────────────────────────────────────────
        if (activeTab === 'Catalog') return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-6">
                {allProducts.map((p, i) => {
                    const IconComponent = getProductIcon(p.productname);
                    return (
                        <div key={i} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-gray-200 transition-all duration-200 flex flex-col group">
                            <div className="flex items-start justify-between mb-4">
                                <div className="w-10 h-10 bg-red-50 text-red-500 rounded-xl flex items-center justify-center group-hover:bg-red-100 transition-colors">
                                    <IconComponent size={20} />
                                </div>
                                <span className="text-sm font-bold text-gray-900">₪{p.price}</span>
                            </div>
                            <h3 className="text-sm font-semibold text-gray-800 mb-3 line-clamp-2 leading-snug">
                                {p.productname}
                            </h3>
                            <div className="flex flex-wrap gap-1 mb-4 mt-auto">
                                {p.kashrut_list
                                    ? p.kashrut_list.split(',').map((k, idx) => (
                                        <span key={idx} className="px-2 py-0.5 bg-blue-50 text-blue-600 border border-blue-100 text-[9px] font-semibold uppercase rounded-md whitespace-nowrap">
                                            {k.trim()}
                                        </span>
                                    ))
                                    : <span className="text-[10px] text-gray-300 italic">No kashrut</span>
                                }
                            </div>
                            <button
                                onClick={() => { setOrderModal({ productid: p.productid, productname: p.productname }); setOrderQty(50); }}
                                className="w-full py-2 bg-gray-900 text-white text-[11px] font-semibold uppercase rounded-xl hover:bg-red-600 transition-all tracking-wider"
                            >
                                Add to Store
                            </button>
                        </div>
                    );
                })}
            </div>
        );

        // ── ORDERS ────────────────────────────────────────────────────
        if (activeTab === 'Orders') return (
            <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full" style={{ borderCollapse: 'collapse' }}>
                    <thead>
                        <tr className="border-b border-gray-100 bg-gray-50">
                            {['Request ID', 'Date', 'Status', ''].map(h => (
                                <th key={h} className="text-left px-5 py-3 text-[10px] font-semibold text-gray-400 tracking-widest uppercase">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {orders.map((o, i) => (
                            <tr key={i} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/60 transition-colors">
                                <td className="px-5 py-3.5 text-sm font-semibold text-gray-800">#{o.id}</td>
                                <td className="px-5 py-3.5 text-sm text-gray-500">{new Date(o.date).toLocaleDateString()}</td>
                                <td className="px-5 py-3.5">
                                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold border tracking-wide
                                        ${o.status?.toUpperCase() === 'PENDING' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                                            o.status?.toUpperCase() === 'APPROVED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                o.status?.toUpperCase() === 'DELIVERED' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                                    'bg-gray-50 text-gray-500 border-gray-100'}`}>
                                        {o.status}
                                    </span>
                                </td>
                                <td className="px-5 py-3.5 text-right">
                                    <button
                                        onClick={async () => {
                                            setLoadingDetails(true);
                                            const res = await fetch(`http://localhost:5000/api/store/order-details/${o.id}`);
                                            setOrderDetails(await res.json());
                                            setLoadingDetails(false);
                                        }}
                                        className="text-[11px] font-semibold px-3 py-1.5 rounded-lg border border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100 hover:border-gray-300 transition-all whitespace-nowrap"
                                    >
                                        View →
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Order Details Modal */}
                {orderDetails && (
                    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
                        <div className="bg-white rounded-2xl shadow-2xl p-8 w-[520px] max-h-[80vh] overflow-y-auto">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold mb-0.5">Order Details</p>
                                    <h2 className="text-lg font-bold text-gray-900">#{orderDetails.order?.orderid}</h2>
                                </div>
                                <button onClick={() => setOrderDetails(null)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-500 transition-colors">
                                    <X size={14} />
                                </button>
                            </div>

                            <div className="grid grid-cols-3 gap-3 mb-6">
                                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                    <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1 font-semibold">Date</p>
                                    <p className="text-sm font-semibold text-gray-800">{new Date(orderDetails.order?.orderdate).toLocaleDateString()}</p>
                                </div>
                                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                    <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1 font-semibold">Status</p>
                                    <span className="px-2 py-0.5 rounded-lg bg-orange-50 text-orange-600 border border-orange-100 text-[10px] font-semibold">
                                        {orderDetails.order?.status}
                                    </span>
                                </div>
                                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                    <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1 font-semibold">Total</p>
                                    {orderDetails.order?.price && parseFloat(orderDetails.order.price) > 0
                                        ? <p className="text-sm font-bold text-emerald-600">₪{orderDetails.order.price}</p>
                                        : <p className="text-xs text-gray-400 italic">Pending</p>
                                    }
                                </div>
                            </div>

                            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-3">Products Ordered</p>
                            {orderDetails.items?.length > 0 ? (
                                <div className="space-y-2">
                                    {orderDetails.items.map((item, i) => (
                                        <div key={i} className="flex items-center justify-between p-3.5 bg-gray-50 rounded-xl border border-gray-100">
                                            <div>
                                                <p className="text-sm font-semibold text-gray-800">{item.productname}</p>
                                                <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mt-0.5">Unit: ₪{item.unitprice}</p>
                                            </div>
                                            <div className="flex items-center gap-4 text-sm">
                                                <span className="text-gray-500">Qty: <strong className="text-gray-800">{item.quantity}</strong></span>
                                                <div className="text-right">
                                                    <p className="text-[9px] text-gray-400 uppercase tracking-wider">Total</p>
                                                    <p className="font-bold text-emerald-600">₪{item.subtotal}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-400 text-center py-6">No products found.</p>
                            )}

                            <button onClick={() => setOrderDetails(null)}
                                className="w-full mt-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl text-sm font-semibold transition-all">
                                Close
                            </button>
                        </div>
                    </div>
                )}
            </div>
        );

        // ── ACCOUNT ───────────────────────────────────────────────────
        if (activeTab === 'Account') return (
            <div className="bg-white border border-gray-100 rounded-2xl p-8 max-w-2xl shadow-sm">
                <div className="flex items-center gap-4 mb-8 pb-6 border-b border-gray-100">
                    <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center font-bold text-sm text-red-600">
                        {storeData.storename?.substring(0, 2).toUpperCase() || 'SM'}
                    </div>
                    <div>
                        <p className="font-bold text-gray-900">{storeData.storename}</p>
                        <p className="text-xs text-gray-400">Store ID: {storeData.storeid}</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-5">
                    {[
                        { label: 'Store Name', key: 'storename', type: 'text', readOnly: false },
                        { label: 'Email', key: 'email', type: 'email', readOnly: false },
                        { label: 'Phone Number', key: 'phone', type: 'text', readOnly: false },
                        { label: 'Website URL', key: 'websiteurl', type: 'text', readOnly: false },
                        { label: 'Rating', key: 'rating', type: 'text', readOnly: true },
                        { label: 'New Password', key: 'password', type: 'password', readOnly: false, placeholder: '••••••••' },
                    ].map(f => (
                        <div key={f.key}>
                            <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">{f.label}</label>
                            <input
                                type={f.type}
                                placeholder={f.placeholder || ''}
                                disabled={f.readOnly}
                                value={formData[f.key] || ''}
                                onChange={e => setFormData({ ...formData, [f.key]: e.target.value })}
                                className={`w-full mt-1.5 px-3 py-2.5 text-sm rounded-xl border outline-none transition-all
                                    ${f.readOnly
                                        ? 'bg-gray-50 border-gray-100 text-gray-400 cursor-not-allowed'
                                        : 'bg-white border-gray-200 text-gray-800 focus:border-red-400 focus:ring-2 focus:ring-red-50'}`}
                            />
                        </div>
                    ))}
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
                        className="px-8 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold uppercase tracking-wider transition-all"
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
                <div className="px-4 py-4 border-b border-gray-100">
                    <div className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2.5">
                        <div className="w-8 h-8 rounded-xl bg-red-100 flex items-center justify-center font-bold text-[10px] text-red-600 flex-shrink-0">
                            {storeData.storename?.substring(0, 2).toUpperCase() || 'SM'}
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs font-semibold text-gray-800 truncate">{storeData.storename}</p>
                            <p className="text-[10px] text-gray-400 truncate">Tel: {storeData.phone}</p>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 px-3 py-4 space-y-0.5">
                    {[
                        { id: 'Overview', icon: LayoutDashboard, label: 'Overview' },
                        { id: 'Inventory', icon: Package, label: 'My Inventory' },
                        { id: 'Catalog', icon: Search, label: 'Browse Catalog' },
                        { id: 'Orders', icon: ShoppingCart, label: 'Order Requests' },
                        { id: 'Account', icon: User, label: 'Account Info' },
                    ].map(({ id, icon: Icon, label }) => (
                        <button key={id} onClick={() => setActiveTab(id)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all
                                ${activeTab === id ? 'bg-red-50 text-red-600 font-semibold border border-red-100' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'}`}>
                            <Icon size={15} /> {label}
                        </button>
                    ))}
                </nav>

                <div className="px-3 py-4 border-t border-gray-100">
                    <button onClick={() => navigate('/')}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-400 hover:bg-red-50 hover:text-red-600 transition-all">
                        <LogOut size={15} /> Sign Out
                    </button>
                </div>
            </div>

            {/* MAIN */}
            <div className="flex-1 flex flex-col h-full overflow-hidden">
                <header className="bg-white border-b border-gray-100 px-6 h-[73px] flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-semibold text-gray-400 tracking-widest uppercase">Store Manager Portal</p>
                        <h1 className="text-lg font-bold text-gray-900 mt-0.5">{activeTab}</h1>
                    </div>
                    <button onClick={() => setIsDrawerOpen(true)}
                        className="flex items-center gap-2 bg-gray-900 hover:bg-red-600 text-white px-4 py-2 rounded-xl text-[11px] font-semibold uppercase tracking-wider transition-all">
                        <Plus size={13} /> Preview
                    </button>
                </header>

                <main className="flex-1 p-8 overflow-y-auto bg-[#F8F9FB]">
                    {/* TOAST */}
                    {statusMessage && (
                        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl shadow-xl text-sm font-medium border
                            ${statusMessage.type === 'success' ? 'bg-white border-emerald-100' : 'bg-white border-red-100'}`}
                            style={{ minWidth: '280px' }}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${statusMessage.type === 'success' ? 'bg-emerald-100' : 'bg-red-100'}`}>
                                {statusMessage.type === 'success'
                                    ? <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8l3.5 3.5L13 4.5" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                    : <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 4l8 8M12 4l-8 8" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" /></svg>
                                }
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                                    {statusMessage.type === 'success' ? 'Success' : 'Error'}
                                </span>
                                <span className="text-sm text-gray-800">{statusMessage.text}</span>
                            </div>
                            <button onClick={() => setStatusMessage(null)} className="ml-auto text-gray-300 hover:text-gray-500">
                                <X size={13} />
                            </button>
                        </div>
                    )}

                    {renderMainContent()}
                </main>
            </div>

            {/* PREVIEW DRAWER */}
            {isDrawerOpen && (
                <div className="fixed inset-0 bg-black/40 z-50 flex justify-end">
                    <div className="w-96 bg-white h-full flex flex-col shadow-2xl">
                        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
                            <h2 className="text-sm font-bold text-gray-900">Preview</h2>
                            <button onClick={() => setIsDrawerOpen(false)} className="w-7 h-7 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-500">
                                <X size={13} />
                            </button>
                        </div>
                        <main className="flex-1 p-6 overflow-auto">{renderMainContent()}</main>
                    </div>
                </div>
            )}

            {/* ORDER MODAL */}
            {orderModal && (
                <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
                    <div className="bg-white rounded-2xl shadow-2xl p-8 w-96 border border-gray-100">
                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">New Order</p>
                        <h2 className="text-lg font-bold text-gray-900 mb-1">{orderModal.productname}</h2>
                        <p className="text-xs text-gray-400 mb-6">Enter the quantity you want to order</p>

                        <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Quantity</label>
                        <input
                            type="number" min="1" value={orderQty}
                            onChange={e => setOrderQty(e.target.value)}
                            className="w-full mt-1.5 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-red-400 focus:ring-2 focus:ring-red-50 text-sm font-semibold text-gray-800 mb-6"
                        />

                        <div className="flex gap-3">
                            <button onClick={() => { setOrderModal(null); setOrderQty(''); }}
                                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-500 hover:bg-gray-50 transition-all">
                                Cancel
                            </button>
                            <button
                                onClick={async () => {
                                    await sendRestock(orderModal.productid, orderModal.productname, parseInt(orderQty));
                                    setOrderModal(null);
                                    setOrderQty('');
                                }}
                                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-all">
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