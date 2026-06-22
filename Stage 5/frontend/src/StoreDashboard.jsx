import React, { useState, useEffect, useCallback } from 'react';
import { LayoutDashboard, Package, ShoppingCart, LogOut, X, Plus, Minus, User, Search, ShoppingBag, Droplets, Utensils, Apple, Trash2, Tag, Moon, Sun, Globe } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import SalesChart from './SalesChart';
import { t } from './translations';

const getCategory = (name) => {
    const n = name.toLowerCase();
    if (n.includes('water') || n.includes('juice') || n.includes('drink')) return 'Beverages';
    if (n.includes('milk') || n.includes('cheese') || n.includes('yogurt') || n.includes('butter') || n.includes('cream')) return 'Dairy';
    if (n.includes('chicken') || n.includes('beef') || n.includes('veal') || n.includes('lamb') || n.includes('turkey')) return 'Meat';
    if (n.includes('fish') || n.includes('salmon') || n.includes('tuna') || n.includes('shrimp')) return 'Fish';
    if (n.includes('apple') || n.includes('tomato') || n.includes('pepper') || n.includes('carrot') || n.includes('banana') || n.includes('orange')) return 'Produce';
    if (n.includes('bread') || n.includes('pita') || n.includes('roll') || n.includes('baguette')) return 'Bakery';
    if (n.includes('oil') || n.includes('sauce') || n.includes('ketchup') || n.includes('mustard') || n.includes('vinegar')) return 'Condiments';
    return 'Other';
};

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
    const [selectedProduct, setSelectedProduct] = useState(null);

    // Search & filter states
    const [inventorySearch, setInventorySearch] = useState('');
    const [showLowStockOnly, setShowLowStockOnly] = useState(false);
    const [catalogSearch, setCatalogSearch] = useState('');
    const [shopCategory, setShopCategory] = useState('All');

    const [formData, setFormData] = useState({ storename: '', phone: '', rating: '', websiteurl: '', email: '', password: '' });
    const [ordersPage, setOrdersPage] = useState(1);

    /* ── Cart ── */
    const [cart, setCart] = useState([]);
    const [cartOpen, setCartOpen] = useState(false);
    const [placingOrder, setPlacingOrder] = useState(false);

    const cartCount = cart.reduce((s, i) => s + i.quantity, 0);
    const cartTotal = cart.reduce((s, i) => s + i.quantity * parseFloat(i.product.price || 0), 0);

    const addToCart = useCallback((product, qty = 1) => {
        setCart(prev => {
            const existing = prev.find(i => i.product.productid === product.productid);
            if (existing) return prev.map(i => i.product.productid === product.productid ? { ...i, quantity: i.quantity + qty } : i);
            return [...prev, { product, quantity: qty }];
        });
    }, []);

    const updateCartQty = (productid, delta) =>
        setCart(prev => prev.map(i => i.product.productid === productid ? { ...i, quantity: i.quantity + delta } : i).filter(i => i.quantity > 0));

    const removeFromCart = (productid) => setCart(prev => prev.filter(i => i.product.productid !== productid));
    const clearCart = () => setCart([]);

    /* ── Language ── */
    const [lang, setLang] = useState(() => localStorage.getItem('lang') || 'en');
    useEffect(() => { localStorage.setItem('lang', lang); }, [lang]);

    /* ── Dark Mode ── */
    const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [isDarkMode]);

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
                const ordersRes = await fetch(`http://localhost:5000/api/store/orders/${storeData.storeid}`);
                setOrders(await ordersRes.json());
                return true;
            } else {
                setStatusMessage({ type: 'error', text: result.message || t('Order failed.', lang) });
                return false;
            }
        } catch (err) {
            setStatusMessage({ type: 'error', text: t('Error placing order.', lang) });
            return false;
        }
    };

    const handlePlaceStoreOrder = async () => {
        if (!cart.length) return;
        setPlacingOrder(true);
        try {
            let allOk = true;
            for (const { product, quantity } of cart) {
                const ok = await sendRestock(product.productid, product.productname, quantity);
                if (!ok) { allOk = false; break; }
            }
            if (allOk) {
                clearCart();
                setCartOpen(false);
                setStatusMessage({ type: 'success', text: `${t('Order placed', lang)} — ${cart.length} ${t(cart.length > 1 ? 'items' : 'item', lang)} ${t('confirmed!', lang)}` });
                const statsRes = await fetch(`http://localhost:5000/api/store/stats/${storeData.storeid}`);
                if (statsRes.ok) setStats(await statsRes.json());
                setTimeout(() => setStatusMessage(null), 3500);
            } else {
                setStatusMessage({ type: 'error', text: t('Some items could not be ordered. Please try again.', lang) });
                setTimeout(() => setStatusMessage(null), 3500);
            }
        } catch { setStatusMessage({ type: 'error', text: t('Server connection error.', lang) }); }
        finally { setPlacingOrder(false); }
    };

    const getProductIcon = (name) => {
        const l = name.toLowerCase();
        if (l.includes('water')) return Droplets;
        if (l.includes('fish') || l.includes('veal')) return Utensils;
        if (l.includes('apple') || l.includes('pepper') || l.includes('tomato')) return Apple;
        return ShoppingBag;
    };

    /* ── Product Details Modal ── */
    const ProductDetailsModal = () => {
        if (!selectedProduct) return null;
        const p = selectedProduct;
        const IconComponent = getProductIcon(p.productname);
        const cartItem = cart.find(c => c.product.productid === p.productid);
        const isSale = p.price < 10 || p.productid % 5 === 0;

        return (
            <div className="fixed inset-0 bg-black/50 dark:bg-black/20 z-[60] flex items-center justify-center p-4 backdrop-blur-md" onClick={() => setSelectedProduct(null)}>
                <div className="bg-[#F8F9FB] rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden relative" onClick={e => e.stopPropagation()}>
                    <div className="bg-gray-50 p-8 flex items-center justify-center relative border-b border-gray-100">
                        {isSale && (
                            <div className="absolute top-4 left-4 bg-red-600 text-white text-[10px] font-bold uppercase tracking-widest py-1.5 px-3 rounded-lg shadow-sm animate-pulse">
                                {t('Special Offer', lang)}
                            </div>
                        )}
                        <button onClick={() => setSelectedProduct(null)} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-white rounded-full text-gray-400 hover:text-gray-900 shadow-sm transition-all hover:scale-110">
                            <X size={16} />
                        </button>
                        <div className="w-28 h-28 bg-white border border-gray-100 text-red-500 rounded-3xl flex items-center justify-center shadow-sm">
                            <IconComponent size={56} strokeWidth={1.5} />
                        </div>
                    </div>

                    <div className="p-8">
                        <div className="mb-4">
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-red-500 mb-2">
                                <Tag size={10} /> {t(getCategory(p.productname), lang)}
                            </span>
                            <h2 className="text-2xl font-bold text-gray-900 leading-tight">{t(p.productname, lang)}</h2>
                        </div>

                        <div className="flex items-center gap-4 mb-6">
                            <span className="text-3xl font-extrabold text-gray-900">₪{p.price}</span>
                            {isSale && <span className="text-sm font-semibold text-gray-400 line-through">₪{(parseFloat(p.price) * 1.2).toFixed(2)}</span>}
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-8">
                            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{t('Expiration', lang)}</p>
                                <p className="text-sm font-semibold text-gray-800">{p.expirationdate ? new Date(p.expirationdate).toLocaleDateString() : 'N/A'}</p>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">{t('Kashrut', lang)}</p>
                                <div className="flex flex-wrap gap-1.5">
                                    {p.kashrut_list ? p.kashrut_list.split(',').map((k, i) => (
                                        <span key={i} className="px-2 py-1 bg-blue-50 text-blue-600 border border-blue-100 text-[9px] font-semibold uppercase rounded-md whitespace-nowrap">{k.trim()}</span>
                                    )) : <span className="text-sm font-semibold text-gray-800">{t('None', lang)}</span>}
                                </div>
                            </div>
                        </div>

                        {cartItem ? (
                            <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-2xl p-2">
                                <button onClick={(e) => { e.stopPropagation(); updateCartQty(p.productid, -1); }} className="w-12 h-12 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:border-red-300 hover:text-red-500 transition-all shadow-sm"><Minus size={18} /></button>
                                <div className="flex flex-col items-center">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t('In Cart', lang)}</span>
                                    <span className="text-xl font-black text-gray-900 leading-none mt-1">{cartItem.quantity}</span>
                                </div>
                                <button onClick={(e) => { e.stopPropagation(); updateCartQty(p.productid, 1); }} className="w-12 h-12 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:border-red-300 hover:text-red-500 transition-all shadow-sm"><Plus size={18} /></button>
                            </div>
                        ) : (
                            <button
                                onClick={(e) => { e.stopPropagation(); addToCart(p); setStatusMessage({ type: 'success', text: `${t(p.productname, lang)} ${t('added to cart', lang)}!` }); setTimeout(() => setStatusMessage(null), 3500); }}
                                className="w-full py-4 bg-gray-900 text-white text-sm font-bold uppercase rounded-2xl hover:bg-red-600 transition-all tracking-widest flex items-center justify-center gap-3 shadow-lg hover:shadow-red-500/20"
                            >
                                <ShoppingCart size={18} /> {t('Add to Cart', lang)}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    const renderMainContent = () => {
        // ── OVERVIEW ──────────────────────────────────────────────────
        if (activeTab === 'Overview') return (
            <div className="space-y-6">
                <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                    <p className="text-[10px] font-semibold text-gray-400 tracking-widest uppercase mb-4">{t('Monthly Supply Activity', lang)}</p>
                    <div className="w-full" style={{ height: '280px' }}>
                        <SalesChart data={stats.chartData} label={t('Supply Expenses', lang)} prefix="₪" />
                    </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                    {[
                        { label: t('Supply Expenses', lang), value: stats.dailySales, color: 'text-gray-900' },
                        { label: t('Stock Alerts', lang), value: stats.stockAlerts, color: stats.stockAlerts > 0 ? 'text-red-500' : 'text-gray-900' },
                        { label: t('Pending Requests', lang), value: stats.pendingRequests, color: 'text-gray-900' },
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
        if (activeTab === 'Inventory') {
            const filtered = realInventory.filter(item => {
                const matchesSearch = !inventorySearch || item.productname.toLowerCase().includes(inventorySearch.toLowerCase());
                const matchesLowStock = !showLowStockOnly || item.quantity <= item.minimumstock;
                return matchesSearch && matchesLowStock;
            });
            return (
                <div>
                    {/* Search & Filter Bar */}
                    <div className="flex items-center gap-3 mb-4">
                        <div className="relative flex-1 max-w-xs">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder={t('Search products...', lang)}
                                value={inventorySearch}
                                onChange={e => setInventorySearch(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-gray-200 rounded-xl outline-none focus:border-red-400 focus:ring-2 focus:ring-red-50 transition-all"
                            />
                        </div>
                        <button
                            onClick={() => setShowLowStockOnly(v => !v)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold transition-all ${showLowStockOnly
                                ? 'bg-red-600 text-white border-red-600'
                                : 'bg-white text-gray-600 border-gray-200 hover:bg-red-50 hover:border-red-200 hover:text-red-600'
                                }`}
                        >
                            {t('⚠ Low Stock Only', lang)}
                        </button>
                        <span className="text-xs text-gray-400 ml-auto">{filtered.length} {t(filtered.length !== 1 ? 'items' : 'item', lang)}</span>
                    </div>

                    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                        <table className="w-full" style={{ borderCollapse: 'collapse' }}>
                            <thead>
                                <tr className="border-b border-gray-100 bg-gray-50">
                                    {[t('Product Name', lang), t('Price', lang), t('Exp. Date', lang), t('Stock', lang), t('Threshold', lang), t('Status', lang), ''].map(h => (
                                        <th key={h} className="text-left px-5 py-3 text-[10px] font-semibold text-gray-400 tracking-widest uppercase whitespace-nowrap">
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-16 text-center">
                                            <div className="flex flex-col items-center justify-center animate-fade-in">
                                                <div className="relative w-24 h-24 mb-4">
                                                    <div className="absolute inset-0 bg-gray-100 rounded-full blur-xl opacity-60"></div>
                                                    <div className="absolute inset-0 flex items-center justify-center animate-float">
                                                        <div className="w-16 h-16 bg-white border border-gray-100 rounded-full flex items-center justify-center shadow-md">
                                                            <Package size={28} className="text-gray-400" />
                                                        </div>
                                                    </div>
                                                </div>
                                                <p className="text-base font-bold text-gray-800">
                                                    {t(showLowStockOnly ? 'No low stock alerts!' : 'No products found.', lang)}
                                                </p>
                                                <p className="text-xs text-gray-400 mt-1">
                                                    {t(showLowStockOnly ? 'Your inventory is fully stocked.' : 'Try adjusting your search filters.', lang)}
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filtered.map((item, i) => {
                                    const low = item.quantity <= item.minimumstock;
                                    return (
                                        <tr key={i} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/60 transition-colors">
                                            <td className="px-5 py-3.5 text-sm font-medium text-gray-800">{t(item.productname, lang)}</td>
                                            <td className="px-5 py-3.5 text-sm font-semibold text-gray-700">₪{item.price}</td>
                                            <td className="px-5 py-3.5 text-sm text-gray-500">{item.expirationdate ? new Date(item.expirationdate).toLocaleDateString() : 'N/A'}</td>
                                            <td className="px-5 py-3.5 text-sm font-bold text-gray-800">{item.quantity}</td>
                                            <td className="px-5 py-3.5 text-sm text-gray-400">{item.minimumstock}</td>
                                            <td className="px-5 py-3.5">
                                                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold tracking-wide ${low ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                                    }`}>
                                                    {low ? '⚠ ' + t('LOW STOCK', lang) : '✓ ' + t('OK', lang)}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <div className="flex gap-2 justify-end">
                                                    <button
                                                        onClick={async () => {
                                                            const ok = await sendRestock(item.productid, item.productname, item.minimumstock * 2);
                                                            if (ok) {
                                                                setStatusMessage({ type: 'success', text: `${t('Restock order placed for', lang)} ${t(item.productname, lang)}!` });
                                                                setTimeout(() => setStatusMessage(null), 3500);
                                                            }
                                                        }}
                                                        disabled={!low}
                                                        className={`text-[11px] font-semibold px-3 py-1.5 rounded-lg border transition-all whitespace-nowrap
                                                        ${low ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100 hover:border-red-300' : 'bg-gray-50 text-gray-300 border-gray-100 cursor-default'}`}
                                                    >
                                                        ↺ {t('Restock', lang)}
                                                    </button>
                                                    <button
                                                        onClick={() => { addToCart(item, item.minimumstock * 2); setCartOpen(true); }}
                                                        className="text-[11px] font-semibold px-3 py-1.5 rounded-lg border border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100 hover:border-blue-300 transition-all whitespace-nowrap"
                                                    >
                                                        + {t('Cart', lang)}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            );
        }

        // ── CATALOG ───────────────────────────────────────────────────
        if (activeTab === 'Catalog') {
            const categories = ['All', ...Array.from(new Set(allProducts.map(p => getCategory(p.productname)))).sort()];

            const filteredProducts = allProducts.filter(p => {
                const matchSearch = !catalogSearch || p.productname.toLowerCase().includes(catalogSearch.toLowerCase());
                const matchCat = shopCategory === 'All' || getCategory(p.productname) === shopCategory;
                return matchSearch && matchCat;
            });
            return (
                <div>
                    {/* Catalog Search & Filters */}
                    <div className="space-y-3 mb-5">
                        <div className="flex items-center gap-3">
                            <div className="relative flex-1 max-w-xs">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder={t('Search catalog...', lang)}
                                    value={catalogSearch}
                                    onChange={e => setCatalogSearch(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-gray-200 rounded-xl outline-none focus:border-red-400 focus:ring-2 focus:ring-red-50 transition-all"
                                />
                            </div>
                            <span className="text-xs text-gray-400 ml-auto">{filteredProducts.length} {t(filteredProducts.length !== 1 ? 'products' : 'product', lang)}</span>
                        </div>
                        {/* Category pills */}
                        <div className="flex flex-wrap gap-2">
                            {categories.map(cat => (
                                <button key={cat} onClick={() => setShopCategory(cat)}
                                    className={`px-3 py-1.5 rounded-xl text-[11px] font-semibold border transition-all
                                        ${shopCategory === cat
                                            ? 'bg-red-600 text-white border-red-600 shadow-sm'
                                            : 'bg-white text-gray-500 border-gray-200 hover:border-red-300 hover:text-red-500'}`}>
                                    {t(cat, lang)}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-24">
                        {filteredProducts.length === 0 ? (
                            <div className="col-span-4 text-center py-12 text-sm text-gray-400">{t('No products found for', lang)} "{catalogSearch}".</div>
                        ) : filteredProducts.map((p, i) => {
                            const IconComponent = getProductIcon(p.productname);
                            const cartItem = cart.find(c => c.product.productid === p.productid);
                            const isSale = p.price < 10 || p.productid % 5 === 0;
                            return (
                                <div
                                    key={i}
                                    onClick={() => setSelectedProduct(p)}
                                    className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-red-200 cursor-pointer transition-all duration-200 flex flex-col group relative overflow-hidden"
                                >
                                    {isSale && (
                                        <div className="absolute top-3 right-[-30px] bg-red-600 text-white text-[9px] font-bold uppercase tracking-widest py-1 px-8 rotate-45 shadow-sm z-10 animate-pulse">
                                            {t('Promo', lang)}
                                        </div>
                                    )}
                                    <div className="flex items-start justify-between mb-4 relative z-10">
                                        <div className="w-10 h-10 bg-red-50 text-red-500 rounded-xl flex items-center justify-center group-hover:bg-red-100 transition-colors flex-shrink-0">
                                            <IconComponent size={20} />
                                        </div>
                                        <div className="text-right">
                                            <span className="text-sm font-bold text-gray-900">₪{p.price}</span>
                                            {cartItem && <p className="text-[10px] text-red-500 font-semibold mt-0.5">{cartItem.quantity} {t('in cart', lang)}</p>}
                                        </div>
                                    </div>
                                    <span className="inline-flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wide text-gray-400 mb-1.5">
                                        <Tag size={9} />{t(getCategory(p.productname), lang)}
                                    </span>
                                    <h3 className="text-sm font-semibold text-gray-800 mb-3 line-clamp-2 leading-snug">{t(p.productname, lang)}</h3>
                                    <div className="flex flex-wrap gap-1 mb-4 mt-auto">
                                        {p.kashrut_list
                                            ? p.kashrut_list.split(',').map((k, idx) => (
                                                <span key={idx} className="px-2 py-0.5 bg-blue-50 text-blue-600 border border-blue-100 text-[9px] font-semibold uppercase rounded-md whitespace-nowrap">
                                                    {k.trim()}
                                                </span>
                                            ))
                                            : <span className="text-[10px] text-gray-300 italic">{t('No kashrut', lang)}</span>
                                        }
                                    </div>
                                    {cartItem ? (
                                        <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
                                            <button onClick={(e) => { e.stopPropagation(); updateCartQty(p.productid, -1); }} className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:border-red-300 hover:text-red-500 transition-all"><Minus size={12} /></button>
                                            <span className="text-sm font-bold text-gray-800">{cartItem.quantity}</span>
                                            <button onClick={(e) => { e.stopPropagation(); updateCartQty(p.productid, 1); }} className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:border-red-300 hover:text-red-500 transition-all"><Plus size={12} /></button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); addToCart(p); setStatusMessage({ type: 'success', text: `${t(p.productname, lang)} ${t('added to cart', lang)}!` }); setTimeout(() => setStatusMessage(null), 3500); }}
                                            className="w-full py-2 bg-gray-900 text-white text-[11px] font-semibold uppercase rounded-xl hover:bg-red-600 transition-all tracking-wider flex items-center justify-center gap-2"
                                        >
                                            <ShoppingCart size={13} /> {t('Add to Cart', lang)}
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            );
        }

        // ── ORDERS ────────────────────────────────────────────────────
        if (activeTab === 'Orders') {
            const ORDERS_PER_PAGE = 5;
            const totalPages = Math.max(1, Math.ceil(orders.length / ORDERS_PER_PAGE));
            const pagedOrders = orders.slice((ordersPage - 1) * ORDERS_PER_PAGE, ordersPage * ORDERS_PER_PAGE);
            return (
                <div>
                    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                        <table className="w-full" style={{ borderCollapse: 'collapse' }}>
                            <thead>
                                <tr className="border-b border-gray-100 bg-gray-50">
                                    {[t('Order ID', lang), t('Date', lang), t('Status', lang), ''].map(h => (
                                        <th key={h} className="text-left px-6 py-4 text-[10px] font-semibold text-gray-400 tracking-widest uppercase">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {pagedOrders.length > 0 ? pagedOrders.map((o, i) => (
                                    <tr key={i} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/60 transition-colors">
                                        <td className="px-6 py-3.5 text-sm font-semibold text-gray-800">#{o.id}</td>
                                        <td className="px-6 py-3.5 text-sm text-gray-500">{new Date(o.date).toLocaleDateString()}</td>
                                        <td className="px-6 py-3.5">
                                            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold border tracking-wide
                                                ${o.status?.toUpperCase() === 'PENDING' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                                                    o.status?.toUpperCase() === 'APPROVED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                        o.status?.toUpperCase() === 'DELIVERED' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                                            o.status?.toUpperCase() === 'CANCELLED' ? 'bg-red-50 text-red-500 border-red-100' :
                                                                'bg-gray-50 text-gray-500 border-gray-100'}`}>
                                                {t(o.status?.toUpperCase(), lang)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3.5 text-right">
                                            <button
                                                onClick={async () => {
                                                    setLoadingDetails(true);
                                                    const res = await fetch(`http://localhost:5000/api/store/order-details/${o.id}`);
                                                    setOrderDetails(await res.json());
                                                    setLoadingDetails(false);
                                                }}
                                                className="text-[11px] font-semibold px-3 py-1.5 rounded-lg border border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100 hover:border-gray-300 transition-all whitespace-nowrap"
                                            >{loadingDetails ? '…' : t('View →', lang)}</button>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-16 text-center">
                                            <div className="flex flex-col items-center justify-center animate-fade-in">
                                                <div className="relative w-24 h-24 mb-4">
                                                    <div className="absolute inset-0 bg-blue-50 rounded-full blur-xl opacity-60"></div>
                                                    <div className="absolute inset-0 flex items-center justify-center animate-float">
                                                        <div className="w-16 h-16 bg-white border border-gray-100 rounded-full flex items-center justify-center shadow-md">
                                                            <Package size={28} className="text-blue-400" />
                                                        </div>
                                                    </div>
                                                </div>
                                                <p className="text-base font-bold text-gray-800">{t('No supply orders yet', lang)}</p>
                                                <p className="text-xs text-gray-400 mt-1">{t('When you restock, your orders will appear here.', lang)}</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>

                        <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100 bg-gray-50/50">
                            <span className="text-xs text-gray-400">
                                {orders.length} {t(orders.length !== 1 ? 'orders' : 'order', lang)}{totalPages > 1 ? ` — ${t('Page', lang)} ${ordersPage} ${t('of', lang)} ${totalPages}` : ''}
                            </span>
                            {totalPages > 1 && (
                                <div className="flex gap-2">
                                    <button onClick={() => setOrdersPage(p => Math.max(1, p - 1))} disabled={ordersPage === 1} className="px-3 py-1.5 text-xs font-semibold border border-gray-200 rounded-lg text-gray-500 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-all">{t('← Prev', lang)}</button>
                                    <button onClick={() => setOrdersPage(p => Math.min(totalPages, p + 1))} disabled={ordersPage === totalPages} className="px-3 py-1.5 text-xs font-semibold border border-gray-200 rounded-lg text-gray-500 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-all">{t('Next →', lang)}</button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Order Details Modal */}
                    {orderDetails && (
                        <div className="fixed inset-0 bg-black/50 dark:bg-black/20 z-50 flex items-center justify-center p-4 backdrop-blur-md">
                            <div className="bg-[#F8F9FB] rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden relative p-8 max-h-[80vh] overflow-y-auto">
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold mb-0.5">{t('Order Details', lang)}</p>
                                        <h2 className="text-lg font-bold text-gray-900">#{orderDetails.order?.orderid}</h2>
                                    </div>
                                    <button onClick={() => setOrderDetails(null)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-500 transition-colors">
                                        <X size={14} />
                                    </button>
                                </div>

                                <div className="grid grid-cols-3 gap-3 mb-6">
                                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                        <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1 font-semibold">{t('Date', lang)}</p>
                                        <p className="text-sm font-semibold text-gray-800">{new Date(orderDetails.order?.orderdate).toLocaleDateString()}</p>
                                    </div>
                                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                        <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1 font-semibold">{t('Status', lang)}</p>
                                        <span className="px-2 py-0.5 rounded-lg bg-orange-50 text-orange-600 border border-orange-100 text-[10px] font-semibold">
                                            {t(orderDetails.order?.status?.toUpperCase(), lang)}
                                        </span>
                                    </div>
                                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                        <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1 font-semibold">{t('Total', lang)}</p>
                                        {orderDetails.order?.price && parseFloat(orderDetails.order.price) > 0
                                            ? <p className="text-sm font-bold text-emerald-600">₪{orderDetails.order.price}</p>
                                            : <p className="text-xs text-gray-400 italic">{t('Pending', lang)}</p>
                                        }
                                    </div>
                                </div>

                                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-3">{t('Products Ordered', lang)}</p>
                                {orderDetails.items?.length > 0 ? (
                                    <div className="space-y-2">
                                        {orderDetails.items.map((item, i) => (
                                            <div key={i} className="flex items-center justify-between p-3.5 bg-gray-50 rounded-xl border border-gray-100">
                                                <div>
                                                    <p className="text-sm font-semibold text-gray-800">{t(item.productname, lang)}</p>
                                                    <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mt-0.5">{t('Unit:', lang)} ₪{item.unitprice}</p>
                                                </div>
                                                <div className="flex items-center gap-4 text-sm">
                                                    <span className="text-gray-500">{t('Qty:', lang)} <strong className="text-gray-800">{item.quantity}</strong></span>
                                                    <div className="text-right">
                                                        <p className="text-[9px] text-gray-400 uppercase tracking-wider">{t('Total', lang)}</p>
                                                        <p className="font-bold text-emerald-600">₪{item.subtotal}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-400 text-center py-6">{t('No products found.', lang)}</p>
                                )}

                                <div className="flex gap-3 mt-6">
                                    <button
                                        onClick={() => {
                                            if (!orderDetails.items?.length) return;
                                            let addedCount = 0;
                                            orderDetails.items.forEach(item => {
                                                const product = allProducts.find(p => p.productid === item.productid);
                                                if (product) {
                                                    addToCart(product, item.quantity);
                                                    addedCount++;
                                                }
                                            });
                                            setOrderDetails(null);
                                            setCartOpen(true);
                                            if (addedCount === orderDetails.items.length && orderDetails.items.length > 0) {
                                                setStatusMessage({ type: 'success', text: `${addedCount} ${t(addedCount > 1 ? 'items' : 'item', lang)} ${t('added to cart', lang)}!` });
                                            } else if (addedCount > 0) {
                                                setStatusMessage({ type: 'success', text: `${t('Added', lang)} ${addedCount} ${t('items', lang)}. ${t('Some are no longer available.', lang)}` });
                                            } else {
                                                setStatusMessage({ type: 'error', text: t('None of these items are available anymore.', lang) });
                                            }
                                            setTimeout(() => setStatusMessage(null), 3500);
                                        }}
                                        className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-red-600 transition-all"
                                    >
                                        ↺ {t('Order Again', lang)}
                                    </button>
                                    <button onClick={() => setOrderDetails(null)}
                                        className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl text-sm font-semibold transition-all">
                                        {t('Close', lang)}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            );
        }


        // ── ACCOUNT ───────────────────────────────────────────────────
        if (activeTab === 'Account') return (
            <div className="bg-white border border-gray-100 rounded-2xl p-8 max-w-2xl shadow-sm">
                <div className="flex items-center gap-4 mb-8 pb-6 border-b border-gray-100">
                    <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center font-bold text-sm text-red-600">
                        {storeData.storename?.substring(0, 2).toUpperCase() || 'SM'}
                    </div>
                    <div>
                        <p className="font-bold text-gray-900">{storeData.storename}</p>
                        <p className="text-xs text-gray-400">{t('Store', lang)}</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-5">
                    {[
                        { label: t('Store Name', lang), key: 'storename', type: 'text', readOnly: false },
                        { label: t('Email', lang), key: 'email', type: 'email', readOnly: false },
                        { label: t('Phone Number', lang), key: 'phone', type: 'text', readOnly: false },
                        { label: t('Website URL', lang), key: 'websiteurl', type: 'text', readOnly: false },
                        { label: t('Rating', lang), key: 'rating', type: 'text', readOnly: true },
                        { label: t('New Password', lang), key: 'password', type: 'password', readOnly: false, placeholder: '••••••••' },
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
                                    setStatusMessage({ type: 'success', text: t('Information updated successfully!', lang) });
                                } else {
                                    setStatusMessage({ type: 'error', text: result.message || t('Update failed.', lang) });
                                }
                            } catch (err) {
                                setStatusMessage({ type: 'error', text: t('Error saving changes.', lang) });
                            }
                            setTimeout(() => setStatusMessage(null), 3000);
                        }}
                        className="px-8 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold uppercase tracking-wider transition-all"
                    >
                        {t('Save Changes', lang)}
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="h-screen bg-[#F8F9FB] flex font-sans overflow-hidden" dir={lang === 'he' ? 'rtl' : 'ltr'}>
            {/* SIDEBAR */}
            <div className="w-60 bg-white dark:!bg-transparent dark:bg-gradient-to-br dark:from-[#0B1120] dark:via-[#111827] dark:to-[#450a0a] bg-fixed border-r border-gray-100 dark:border-white/10 flex flex-col h-full relative z-30">
                <div className="w-full border-b border-gray-100 dark:border-white/10 h-[73px] flex items-center justify-center">
                    <div className="bg-white px-5 py-1.5 rounded-xl shadow-sm border border-gray-200 dark:border-white/10 flex items-center justify-center transition-all hover:scale-105">
                        <img src="/Rami_Levy_Hashikma_Marketing_logo.png" alt="Rami Levy" className="h-7 object-contain transition-all dark:drop-shadow-[0_0_12px_rgba(255,255,255,0.7)]" />
                    </div>
                </div>
                <div className="px-4 py-4 border-b border-gray-100 dark:border-white/5">
                    <div className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2.5">
                        <div className="w-8 h-8 rounded-xl bg-red-100 flex items-center justify-center font-bold text-[10px] text-red-600 flex-shrink-0">
                            {storeData.storename?.substring(0, 2).toUpperCase() || 'SM'}
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs font-semibold text-gray-800 truncate">{storeData.storename}</p>
                            <p className="text-[10px] text-gray-400 truncate">{t('Tel:', lang)} {storeData.phone}</p>
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
                            <Icon size={15} /> <span className="truncate">{t(label, lang)}</span>
                        </button>
                    ))}
                </nav>

                <div className="px-3 py-4 border-t border-gray-100 dark:border-white/5">
                    <button onClick={() => navigate('/')}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-400 hover:bg-red-50 hover:text-red-600 transition-all">
                        <LogOut size={15} /> <span className="truncate">{t('Log Out', lang)}</span>
                    </button>
                </div>
            </div>

            {/* MAIN */}
            <div className="flex-1 flex flex-col h-full overflow-hidden">
                <header className="bg-white dark:!bg-transparent dark:bg-gradient-to-br dark:from-[#0B1120] dark:via-[#111827] dark:to-[#450a0a] bg-fixed border-b border-gray-100 dark:border-white/10 px-8 h-[73px] flex items-center justify-between sticky top-0 z-20">
                    <div>
                        <p className="text-[10px] font-semibold text-gray-400 tracking-widest uppercase">{t('Store Manager Portal', lang)}</p>
                        <h1 className="text-lg font-bold text-gray-900 mt-0.5">{t(activeTab, lang)}</h1>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={() => setLang(l => l === 'en' ? 'he' : 'en')} className="flex items-center gap-2 px-3 h-9 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-600 transition-all text-xs font-bold tracking-wider">
                            <Globe size={14} /> {lang.toUpperCase()}
                        </button>
                        <button onClick={() => setIsDarkMode(!isDarkMode)} className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-500 transition-all">
                            {isDarkMode ? <Sun size={15} /> : <Moon size={15} />}
                        </button>
                        <button
                            onClick={() => setCartOpen(true)}
                            className="flex items-center gap-2 bg-gray-900 hover:bg-red-600 text-white px-4 py-2 rounded-xl text-[11px] font-semibold uppercase tracking-wider transition-all relative"
                        >
                            <ShoppingCart size={14} />
                            {t('Cart', lang)}
                            {cartCount > 0 && (
                                <span className="flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[9px] font-bold rounded-full">{cartCount}</span>
                            )}
                        </button>
                    </div>
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
                    <ProductDetailsModal />
                </main>
            </div>

            {/* CART DRAWER */}
            {cartOpen && (
                <>
                    <div className="fixed inset-0 bg-black/30 z-40" onClick={() => setCartOpen(false)} />
                    <div className={`fixed top-0 ${lang === 'he' ? 'left-0 border-r' : 'right-0 border-l'} h-full w-[400px] bg-white dark:!bg-transparent dark:bg-gradient-to-br dark:from-[#0B1120] dark:via-[#111827] dark:to-[#3b0909] z-50 flex flex-col shadow-[0_0_40px_rgba(0,0,0,0.1)] dark:shadow-[0_0_40px_rgba(0,0,0,0.5)] border-gray-100 dark:border-white/5`}>
                        <div className="flex items-center justify-between px-6 h-[73px] border-b border-gray-100">
                            <div>
                                <p className="text-[10px] font-semibold text-gray-400 tracking-widest uppercase mb-0.5">{t('Your Cart', lang)}</p>
                                <h2 className="text-lg font-bold text-gray-900 mt-0.5">{cartCount} {t(cartCount !== 1 ? 'items' : 'item', lang)}</h2>
                            </div>
                            <button onClick={() => setCartOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-500 transition-colors"><X size={14} /></button>
                        </div>
                        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
                            {cart.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-center pb-16 animate-fade-in">
                                    <div className="relative w-32 h-32 mb-6">
                                        <div className="absolute inset-0 bg-red-50 rounded-full blur-2xl opacity-60"></div>
                                        <div className="absolute inset-0 flex items-center justify-center animate-float">
                                            <div className="w-20 h-20 bg-white border border-gray-100 rounded-full flex items-center justify-center shadow-lg">
                                                <ShoppingCart size={32} className="text-red-400" />
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-lg font-bold text-gray-800">{t('Your restock cart is empty', lang)}</p>
                                    <p className="text-sm text-gray-400 mt-2 max-w-[200px] leading-relaxed">{t('Add supply products from the catalog to replenish your stock.', lang)}</p>
                                    <button onClick={() => { setCartOpen(false); setActiveTab('Catalog'); }} className="mt-8 px-6 py-2.5 bg-gray-900 hover:bg-red-600 text-white rounded-xl text-xs font-semibold uppercase tracking-wider transition-all shadow-md hover:shadow-lg">
                                        {t('Browse Catalog', lang)}
                                    </button>
                                </div>
                            ) : cart.map(({ product, quantity }) => {
                                const Icon = getProductIcon(product.productname);
                                return (
                                    <div key={product.productid} className="flex items-center gap-3 p-3.5 bg-gray-50 border border-gray-100 rounded-xl">
                                        <div className="w-9 h-9 bg-red-50 text-red-500 rounded-xl flex items-center justify-center flex-shrink-0"><Icon size={17} /></div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-gray-800 truncate">{t(product.productname, lang)}</p>
                                            <p className="text-xs text-gray-400">₪{product.price} {t('each', lang)}</p>
                                        </div>
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            <button onClick={() => updateCartQty(product.productid, -1)} className="w-6 h-6 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:border-red-300 hover:text-red-500 transition-all"><Minus size={11} /></button>
                                            <span className="text-sm font-bold text-gray-800 w-5 text-center">{quantity}</span>
                                            <button onClick={() => updateCartQty(product.productid, 1)} className="w-6 h-6 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:border-red-300 hover:text-red-500 transition-all"><Plus size={11} /></button>
                                        </div>
                                        <div className="text-right flex-shrink-0 w-14"><p className="text-sm font-bold text-emerald-600">₪{(quantity * parseFloat(product.price || 0)).toFixed(2)}</p></div>
                                        <button onClick={() => removeFromCart(product.productid)} className="text-gray-300 hover:text-red-400 transition-colors ml-1"><Trash2 size={13} /></button>
                                    </div>
                                );
                            })}
                        </div>
                        {cart.length > 0 && (
                            <div className="px-6 py-5 border-t border-gray-100 space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-500 font-medium">{t('Subtotal', lang)}</span>
                                    <span className="text-lg font-bold text-gray-900">₪{cartTotal.toFixed(2)}</span>
                                </div>
                                <button onClick={handlePlaceStoreOrder} disabled={placingOrder} className="w-full py-3 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white text-sm font-semibold uppercase tracking-wider rounded-xl transition-all">
                                    {placingOrder ? t('Placing Order...', lang) : `${t('Place Order', lang)} · ₪${cartTotal.toFixed(2)}`}
                                </button>
                                <button onClick={clearCart} className="w-full py-2 text-xs text-gray-400 hover:text-red-500 font-semibold uppercase tracking-wider transition-all">{t('Clear Cart', lang)}</button>
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* FLOATING CART — visible on Catalog tab when cart has items and drawer is closed */}
            {activeTab === 'Catalog' && !cartOpen && cartCount > 0 && (
                <button onClick={() => setCartOpen(true)} className="fixed bottom-8 right-8 z-30 flex items-center gap-2.5 px-5 py-3.5 bg-gray-900 hover:bg-red-600 text-white rounded-2xl shadow-xl transition-all duration-200 group">
                    <ShoppingCart size={18} />
                    <span className="text-sm font-semibold">{t('Cart', lang)}</span>
                    <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 bg-red-500 group-hover:bg-white group-hover:text-red-600 text-white text-[10px] font-bold rounded-full transition-colors">{cartCount}</span>
                </button>
            )}
        </div>
    );
};

export default StoreDashboard;