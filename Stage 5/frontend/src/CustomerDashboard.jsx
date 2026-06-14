import React, { useState, useEffect, useCallback } from 'react';
import {
  Package, User, LayoutDashboard, LogOut, Clock, Star, Award, Shield,
  ShoppingBag, Droplets, Utensils, Apple, X, Plus, Minus, ShoppingCart,
  Trash2, Heart, RefreshCw, XCircle, ChevronRight, Tag
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

/* ─────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────── */
const API = 'http://localhost:5000/api';
const ORDERS_PER_PAGE = 5;

const STATUS_FLOW = ['PENDING', 'APPROVED', 'SHIPPED', 'DELIVERED'];

/* ─────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────── */
const getProductIcon = (name) => {
  if (!name) return ShoppingBag;
  const n = name.toLowerCase();
  if (n.includes('water')) return Droplets;
  if (n.includes('fish') || n.includes('veal')) return Utensils;
  if (n.includes('apple') || n.includes('pepper') || n.includes('tomato')) return Apple;
  return ShoppingBag;
};

const getCategory = (name = '') => {
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



const OrderProgressBar = ({ status }) => {
  const steps = STATUS_FLOW;
  const currentIdx = steps.indexOf(status?.toUpperCase());
  const isCancelled = status?.toUpperCase() === 'CANCELLED';

  if (isCancelled) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-100 rounded-xl">
        <XCircle size={14} className="text-red-400" />
        <span className="text-xs font-semibold text-red-500 uppercase tracking-wider">Order Cancelled</span>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1.5">
        {steps.map((step, idx) => (
          <React.Fragment key={step}>
            <div className="flex flex-col items-center gap-1">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold transition-all
                ${idx <= currentIdx ? 'bg-emerald-500 text-white shadow-sm' : 'bg-gray-100 text-gray-400'}`}>
                {idx < currentIdx ? '✓' : idx + 1}
              </div>
              <span className={`text-[9px] font-semibold uppercase tracking-wide whitespace-nowrap
                ${idx === currentIdx ? 'text-emerald-600' : idx < currentIdx ? 'text-gray-400' : 'text-gray-300'}`}>
                {step}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div className={`flex-1 h-0.5 mx-1 rounded-full transition-all ${idx < currentIdx ? 'bg-emerald-400' : 'bg-gray-100'}`} />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────── */
const CustomerDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();

  /* ── Core data ── */
  const [customerData, setCustomerData] = useState(location.state?.user || {
    customerid: null, customername: 'Guest', email: '', phone: '',
    city: '', street: '', loyaltytier: 'Standard'
  });
  const [activeTab, setActiveTab] = useState('Overview');
  const [statusMessage, setStatusMessage] = useState(null);
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({ totalOrders: 0, totalSpent: 0, loyaltyTier: 'Loading...' });
  const [allProducts, setAllProducts] = useState([]);
  const [orderDetails, setOrderDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  /* ── Cart ── */
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);

  /* ── Wishlist ── */
  const [wishlist, setWishlist] = useState(new Set());



  /* ── Shop filters ── */
  const [shopSearch, setShopSearch] = useState('');
  const [shopCategory, setShopCategory] = useState('All');

  /* ── Orders pagination ── */
  const [ordersPage, setOrdersPage] = useState(1);

  /* ── Profile form ── */
  const [formData, setFormData] = useState({
    customername: customerData.customername || '',
    email: customerData.email || '',
    phone: customerData.phone || '',
    city: customerData.city || '',
    street: customerData.street || '',
    password: ''
  });

  /* ─────── Cart helpers ─────── */
  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);
  const cartTotal = cart.reduce((s, i) => s + i.quantity * parseFloat(i.product.price || 0), 0);

  const addToCart = useCallback((product, qty = 1) => {
    setCart(prev => {
      const existing = prev.find(i => i.product.productid === product.productid);
      if (existing) return prev.map(i => i.product.productid === product.productid ? { ...i, quantity: i.quantity + qty } : i);
      return [...prev, { product, quantity: qty }];
    });
  }, []);

  const updateQty = (productid, delta) =>
    setCart(prev => prev.map(i => i.product.productid === productid ? { ...i, quantity: i.quantity + delta } : i).filter(i => i.quantity > 0));

  const removeFromCart = (productid) => setCart(prev => prev.filter(i => i.product.productid !== productid));
  const clearCart = () => setCart([]);

  /* ─────── Toast ─────── */
  const showToast = (type, text) => {
    setStatusMessage({ type, text });
    setTimeout(() => setStatusMessage(null), 3500);
  };

  /* ─────── API calls ─────── */
  const refreshCustomerData = async (id) => {
    try {
      const res = await fetch(`${API}/customer/${id}`);
      const data = await res.json();
      if (data.success) {
        setCustomerData(data.user);
        setFormData({ customername: data.user.customername || '', email: data.user.email || '', phone: data.user.phone || '', city: data.user.city || '', street: data.user.street || '', password: '' });
      }
    } catch (err) { console.error(err); }
  };

  // Load wishlist from local storage
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('myWishlist') || '[]');
    setWishlist(new Set(saved));
  }, []);

  const toggleWishlist = (productid) => {
    setWishlist(prev => {
      const next = new Set(prev);
      if (next.has(productid)) next.delete(productid);
      else next.add(productid);
      localStorage.setItem('myWishlist', JSON.stringify([...next]));
      return next;
    });
  };



  const refreshOrdersAndStats = async (id) => {
    const [sRes, oRes] = await Promise.all([
      fetch(`${API}/customer/stats/${id}`),
      fetch(`${API}/customer/orders/${id}`)
    ]);
    setStats(await sRes.json());
    setOrders(await oRes.json());
  };

  useEffect(() => {
    if (!customerData.customerid) return;
    (async () => {
      await refreshCustomerData(customerData.customerid);

      try {
        const prodRes = await fetch(`${API}/admin/products`);
        const prodData = await prodRes.json();
        setAllProducts(Array.isArray(prodData) ? prodData : []);
        await refreshOrdersAndStats(customerData.customerid);
      } catch (err) { console.error(err); }
    })();
  }, [customerData.customerid]);

  /* ─────── Handlers ─────── */
  const handleSave = async () => {
    try {
      const res = await fetch(`${API}/customer/update`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ customerid: customerData.customerid, ...formData }) });
      const result = await res.json();
      if (result.success) { await refreshCustomerData(customerData.customerid); showToast('success', 'Profile updated successfully!'); }
      else showToast('error', result.message || 'Error updating profile.');
    } catch { showToast('error', 'Cannot connect to server.'); }
  };

  const handlePlaceOrder = async () => {
    if (!cart.length) return;
    setPlacingOrder(true);
    try {
      const results = await Promise.all(cart.map(({ product, quantity }) =>
        fetch(`${API}/customer/order`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ customerid: customerData.customerid, productid: product.productid, quantity }) }).then(r => r.json())
      ));
      if (results.every(r => r.success)) {
        clearCart(); setCartOpen(false);
        showToast('success', `Order placed — ${results.length} item${results.length > 1 ? 's' : ''} confirmed!`);
        await refreshOrdersAndStats(customerData.customerid);
      } else showToast('error', 'Some items could not be ordered. Please try again.');
    } catch { showToast('error', 'Server connection error.'); }
    finally { setPlacingOrder(false); }
  };



  const handleCancelOrder = async (orderid) => {
    try {
      const res = await fetch(`${API}/customer/order/${orderid}/cancel`, { method: 'PUT', headers: { 'Content-Type': 'application/json' } });
      const data = await res.json();
      if (data.success) {
        showToast('success', `Order #${orderid} cancelled.`);
        setOrderDetails(null);
        await refreshOrdersAndStats(customerData.customerid);
      } else showToast('error', data.message || 'Cannot cancel this order.');
    } catch { showToast('error', 'Server connection error.'); }
  };

  const handleReorder = (items) => {
    items.forEach(item => {
      const product = allProducts.find(p => p.productid === item.productid);
      if (product) addToCart(product, item.quantity);
    });
    setOrderDetails(null);
    setCartOpen(true);
    showToast('success', `${items.length} item${items.length > 1 ? 's' : ''} added to cart!`);
  };



  /* ─────── Derived ─────── */
  const categories = ['All', ...Array.from(new Set(allProducts.map(p => getCategory(p.productname)))).sort()];
  const wishlistProducts = allProducts.filter(p => wishlist.has(p.productid));

  const filteredProducts = allProducts.filter(p => {
    const matchSearch = !shopSearch || p.productname.toLowerCase().includes(shopSearch.toLowerCase());
    const matchCat = shopCategory === 'All' || getCategory(p.productname) === shopCategory;
    return matchSearch && matchCat;
  });

  /* ─────── Sub-components ─────── */
  const LoyaltyBadge = ({ tier }) => {
    const t = tier ? tier.replace(/🏆|⭐/g, '').trim() : 'Standard';
    if (t.includes('Gold')) return (
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-amber-50 border border-amber-100 shadow-sm"><Star size={18} className="fill-amber-500 text-amber-500" /></div>
        <span className="text-2xl font-bold bg-gradient-to-br from-amber-500 to-orange-500 bg-clip-text text-transparent">{t}</span>
      </div>
    );
    if (t.includes('Silver') || t.includes('Premium')) return (
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-slate-50 border border-slate-200 shadow-sm"><Award size={18} className="text-slate-500" /></div>
        <span className="text-2xl font-bold bg-gradient-to-br from-slate-500 to-slate-700 bg-clip-text text-transparent">{t}</span>
      </div>
    );
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-gray-50 border border-gray-200 shadow-sm"><Shield size={18} className="text-gray-400" /></div>
        <span className="text-2xl font-bold text-gray-700">{t}</span>
      </div>
    );
  };

  /* ── Product Card ── */
  const ProductCard = ({ p }) => {
    const IconComponent = getProductIcon(p.productname);
    const cartItem = cart.find(c => c.product.productid === p.productid);
    const inWishlist = wishlist.has(p.productid);

    return (
      <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-gray-200 transition-all duration-200 flex flex-col group relative">
        {/* Top row */}
        <div className="flex items-start justify-between mb-3">
          <div className="w-10 h-10 bg-red-50 text-red-500 rounded-xl flex items-center justify-center group-hover:bg-red-100 transition-colors flex-shrink-0">
            <IconComponent size={20} />
          </div>
          <div className="flex items-start gap-2">
            <div className="text-right">
              <span className="text-sm font-bold text-gray-900">₪{p.price}</span>
              {cartItem && <p className="text-[10px] text-red-500 font-semibold mt-0.5">{cartItem.quantity} in cart</p>}
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); toggleWishlist(p.productid); }}
              className="mt-0.5 transition-transform hover:scale-110"
            >
              <Heart size={16} className={inWishlist ? 'fill-red-500 text-red-500' : 'text-gray-300 hover:text-red-400'} />
            </button>
          </div>
        </div>

        {/* Category pill */}
        <span className="inline-flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wide text-gray-400 mb-1.5">
          <Tag size={9} />{getCategory(p.productname)}
        </span>

        <h3 className="text-sm font-semibold text-gray-800 mb-2 line-clamp-2 leading-snug">{p.productname}</h3>

        {/* Kashrut */}
        <div className="flex flex-wrap gap-1 mb-4 mt-auto">
          {p.kashrut_list
            ? p.kashrut_list.split(',').map((k, idx) => (
              <span key={idx} className="px-2 py-0.5 bg-blue-50 text-blue-600 border border-blue-100 text-[9px] font-semibold uppercase rounded-md whitespace-nowrap">{k.trim()}</span>
            ))
            : <span className="text-[10px] text-gray-300 italic">No kashrut</span>}
        </div>

        {/* Cart controls */}
        {cartItem ? (
          <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
            <button onClick={(e) => { e.stopPropagation(); updateQty(p.productid, -1); }} className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:border-red-300 hover:text-red-500 transition-all"><Minus size={12} /></button>
            <span className="text-sm font-bold text-gray-800">{cartItem.quantity}</span>
            <button onClick={(e) => { e.stopPropagation(); updateQty(p.productid, 1); }} className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:border-red-300 hover:text-red-500 transition-all"><Plus size={12} /></button>
          </div>
        ) : (
          <button
            onClick={(e) => { e.stopPropagation(); addToCart(p); showToast('success', `${p.productname} added to cart`); }}
            className="w-full py-2 bg-gray-900 text-white text-[11px] font-semibold uppercase rounded-xl hover:bg-red-600 transition-all tracking-wider flex items-center justify-center gap-2"
          >
            <ShoppingCart size={13} /> Add to Cart
          </button>
        )}
      </div>
    );
  };

  /* ── Order Details Modal ── */
  const OrderDetailsModal = () => {
    const order = orderDetails?.order;
    const items = orderDetails?.items || [];
    const isPending = order?.status?.toUpperCase() === 'PENDING';
    const isDelivered = order?.status?.toUpperCase() === 'DELIVERED';

    return (
      <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-[560px] max-h-[85vh] overflow-y-auto">
          <div className="flex items-center justify-between px-8 pt-8 pb-6 border-b border-gray-100">
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold mb-0.5">Order Details</p>
              <h2 className="text-lg font-bold text-gray-900">#{order?.orderid}</h2>
            </div>
            <button onClick={() => setOrderDetails(null)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-500 transition-colors"><X size={14} /></button>
          </div>

          <div className="px-8 py-5 space-y-5">
            {/* Progress */}
            <OrderProgressBar status={order?.status} />

            {/* Meta */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Date', value: new Date(order?.orderdate).toLocaleDateString() },
                { label: 'Status', value: order?.status, badge: true },
                { label: 'Total', value: order?.price && parseFloat(order.price) > 0 ? `₪${order.price}` : 'Pending', green: true }
              ].map(({ label, value, badge, green }) => (
                <div key={label} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1 font-semibold">{label}</p>
                  {badge
                    ? <span className="px-2 py-0.5 rounded-lg bg-orange-50 text-orange-600 border border-orange-100 text-[10px] font-semibold">{value}</span>
                    : <p className={`text-sm font-semibold ${green ? 'text-emerald-600' : 'text-gray-800'}`}>{value}</p>
                  }
                </div>
              ))}
            </div>

            {/* Items */}
            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-3">Products Ordered</p>
              <div className="space-y-2">
                {items.length > 0 ? items.map((item, i) => (
                  <div key={i} className="p-3.5 bg-gray-50 rounded-xl border border-gray-100 space-y-3">
                    <div className="flex items-center justify-between">
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
                  </div>
                )) : <p className="text-sm text-gray-400 text-center py-6">No products found.</p>}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              {/* Re-order */}
              <button
                onClick={() => handleReorder(items)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-red-600 transition-all"
              >
                <RefreshCw size={14} /> Buy Again
              </button>

              {/* Cancel — only PENDING */}
              {isPending && (
                <button
                  onClick={() => handleCancelOrder(order.orderid)}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 border border-red-200 text-red-500 rounded-xl text-sm font-semibold hover:bg-red-50 transition-all"
                >
                  <XCircle size={14} /> Cancel
                </button>
              )}

              <button onClick={() => setOrderDetails(null)} className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl text-sm font-semibold transition-all">Close</button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  /* ── Cart Drawer ── */
  const CartDrawer = () => (
    <>
      <div className="fixed inset-0 bg-black/30 z-40" onClick={() => setCartOpen(false)} />
      <div className="fixed top-0 right-0 h-full w-[380px] bg-white z-50 flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div>
            <p className="text-[10px] font-semibold text-gray-400 tracking-widest uppercase">Your Cart</p>
            <h2 className="text-lg font-bold text-gray-900 mt-0.5">{cartCount} item{cartCount !== 1 ? 's' : ''}</h2>
          </div>
          <button onClick={() => setCartOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-500 transition-colors"><X size={14} /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center pb-16">
              <div className="w-14 h-14 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center mb-4"><ShoppingCart size={22} className="text-gray-300" /></div>
              <p className="text-sm font-semibold text-gray-400">Your cart is empty</p>
              <p className="text-xs text-gray-300 mt-1">Add products from the Shop</p>
            </div>
          ) : cart.map(({ product, quantity }) => {
            const IconComponent = getProductIcon(product.productname);
            return (
              <div key={product.productid} className="flex items-center gap-3 p-3.5 bg-gray-50 border border-gray-100 rounded-xl">
                <div className="w-9 h-9 bg-red-50 text-red-500 rounded-xl flex items-center justify-center flex-shrink-0"><IconComponent size={17} /></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{product.productname}</p>
                  <p className="text-xs text-gray-400">₪{product.price} each</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => updateQty(product.productid, -1)} className="w-6 h-6 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:border-red-300 hover:text-red-500 transition-all"><Minus size={11} /></button>
                  <span className="text-sm font-bold text-gray-800 w-5 text-center">{quantity}</span>
                  <button onClick={() => updateQty(product.productid, 1)} className="w-6 h-6 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:border-red-300 hover:text-red-500 transition-all"><Plus size={11} /></button>
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
              <span className="text-sm text-gray-500 font-medium">Subtotal</span>
              <span className="text-lg font-bold text-gray-900">₪{cartTotal.toFixed(2)}</span>
            </div>
            <button onClick={handlePlaceOrder} disabled={placingOrder} className="w-full py-3 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white text-sm font-semibold uppercase tracking-wider rounded-xl transition-all">
              {placingOrder ? 'Placing Order…' : `Place Order · ₪${cartTotal.toFixed(2)}`}
            </button>
            <button onClick={clearCart} className="w-full py-2 text-xs text-gray-400 hover:text-red-500 font-semibold uppercase tracking-wider transition-colors">Clear Cart</button>
          </div>
        )}
      </div>
    </>
  );

  /* ── Floating Cart ── */
  const FloatingCartButton = () => (
    <button onClick={() => setCartOpen(true)} className="fixed bottom-8 right-8 z-30 flex items-center gap-2.5 px-5 py-3.5 bg-gray-900 hover:bg-red-600 text-white rounded-2xl shadow-xl transition-all duration-200 group">
      <ShoppingCart size={18} />
      <span className="text-sm font-semibold">Cart</span>
      {cartCount > 0 && (
        <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 bg-red-500 group-hover:bg-white group-hover:text-red-600 text-white text-[10px] font-bold rounded-full transition-colors">{cartCount}</span>
      )}
    </button>
  );

  /* ─────────────────────────────────────────────
     TAB CONTENT
  ───────────────────────────────────────────── */
  const renderContent = () => {
    switch (activeTab) {

      /* ── OVERVIEW ── */
      case 'Overview': return (
        <div className="space-y-6">
          <div className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900">Welcome back, {customerData.customername}</h2>
            <p className="text-sm text-gray-500 mt-1">Here is a summary of your real activity from our database.</p>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm">
              <p className="text-[10px] font-semibold text-gray-400 tracking-widest uppercase mb-3">Loyalty Tier</p>
              <LoyaltyBadge tier={stats.loyaltyTier} />
            </div>
            <div className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm">
              <p className="text-[10px] font-semibold text-gray-400 tracking-widest uppercase mb-2">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalOrders}</p>
            </div>
            <div className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm">
              <p className="text-[10px] font-semibold text-gray-400 tracking-widest uppercase mb-2">Total Spent</p>
              <p className="text-2xl font-bold text-emerald-600">₪{stats.totalSpent}</p>
            </div>
          </div>
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-50 flex items-center gap-2">
              <Clock size={16} className="text-gray-400" />
              <h3 className="text-[10px] font-semibold text-gray-400 tracking-widest uppercase">Recent Orders</h3>
            </div>
            <div className="p-6">
              {orders.length > 0 ? (
                <div className="space-y-3">
                  {orders.slice(0, 3).map((o, i) => (
                    <div key={i} className="flex justify-between items-center p-3.5 bg-gray-50 rounded-xl border border-gray-100">
                      <span className="text-sm font-semibold text-gray-800">Order #{o.orderid}</span>
                      <span className="text-xs text-gray-500 font-medium">{new Date(o.orderdate).toLocaleDateString()}</span>
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold tracking-wide border
                        ${o.status?.toUpperCase() === 'PENDING' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                          o.status?.toUpperCase() === 'APPROVED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                            o.status?.toUpperCase() === 'DELIVERED' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                              o.status?.toUpperCase() === 'CANCELLED' ? 'bg-red-50 text-red-500 border-red-100' :
                                'bg-gray-50 text-gray-500 border-gray-100'}`}>{o.status}</span>
                    </div>
                  ))}
                </div>
              ) : <p className="text-sm text-gray-500 text-center py-4">No recent activity found.</p>}
            </div>
          </div>
        </div>
      );

      /* ── SHOP ── */
      case 'Shop': return (
        <div>
          {/* Search + category filters */}
          <div className="space-y-3 mb-5">
            <div className="flex items-center gap-3">
              <div className="relative flex-1 max-w-xs">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
                <input type="text" placeholder="Search products..." value={shopSearch} onChange={e => setShopSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-gray-200 rounded-xl outline-none focus:border-red-400 focus:ring-2 focus:ring-red-50 transition-all" />
              </div>
              <span className="text-xs text-gray-400 ml-auto">{filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''}</span>
            </div>
            {/* Category pills */}
            <div className="flex flex-wrap gap-2">
              {categories.map(cat => (
                <button key={cat} onClick={() => setShopCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-semibold border transition-all
                    ${shopCategory === cat
                      ? 'bg-red-600 text-white border-red-600 shadow-sm'
                      : 'bg-white text-gray-500 border-gray-200 hover:border-red-300 hover:text-red-500'}`}>
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-24">
            {filteredProducts.length === 0
              ? <div className="col-span-4 text-center py-12 text-sm text-gray-400">No products found.</div>
              : filteredProducts.map((p, i) => <ProductCard key={i} p={p} />)
            }
          </div>
        </div>
      );

      /* ── ORDERS ── */
      case 'Orders': {
        const totalOrderPages = Math.max(1, Math.ceil(orders.length / ORDERS_PER_PAGE));
        const pagedOrders = orders.slice((ordersPage - 1) * ORDERS_PER_PAGE, ordersPage * ORDERS_PER_PAGE);
        return (
          <div>
            <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
              <table className="w-full" style={{ borderCollapse: 'collapse' }}>
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    {['Order ID', 'Date', 'Status', ''].map(h => (
                      <th key={h} className="text-left px-6 py-4 text-[10px] font-semibold text-gray-400 tracking-widest uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pagedOrders.length > 0 ? pagedOrders.map((o, i) => (
                    <tr key={i} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/60 transition-colors">
                      <td className="px-6 py-3.5 text-sm font-semibold text-gray-800">#{o.orderid}</td>
                      <td className="px-6 py-3.5 text-sm text-gray-500">{new Date(o.orderdate).toLocaleDateString()}</td>
                      <td className="px-6 py-3.5">
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold tracking-wide border
                          ${o.status?.toUpperCase() === 'PENDING' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                            o.status?.toUpperCase() === 'APPROVED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                              o.status?.toUpperCase() === 'DELIVERED' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                o.status?.toUpperCase() === 'CANCELLED' ? 'bg-red-50 text-red-500 border-red-100' :
                                  'bg-gray-50 text-gray-500 border-gray-100'}`}>{o.status}</span>
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <button
                          onClick={async () => {
                            setLoadingDetails(true);
                            try {
                              const res = await fetch(`${API}/store/order-details/${o.orderid}`);
                              setOrderDetails(await res.json());
                            } catch { showToast('error', 'Could not load details.'); }
                            finally { setLoadingDetails(false); }
                          }}
                          className="text-[11px] font-semibold px-3 py-1.5 rounded-lg border border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100 hover:border-gray-300 transition-all whitespace-nowrap"
                        >{loadingDetails ? '…' : 'View →'}</button>
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan="4" className="px-6 py-8 text-center text-sm text-gray-500">You have no previous orders.</td></tr>
                  )}
                </tbody>
              </table>
              {totalOrderPages > 1 && (
                <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100 bg-gray-50/50">
                  <span className="text-xs text-gray-400">Page {ordersPage} of {totalOrderPages} ({orders.length} orders)</span>
                  <div className="flex gap-2">
                    <button onClick={() => setOrdersPage(p => Math.max(1, p - 1))} disabled={ordersPage === 1} className="px-3 py-1.5 text-xs font-semibold border border-gray-200 rounded-lg text-gray-500 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-all">← Prev</button>
                    <button onClick={() => setOrdersPage(p => Math.min(totalOrderPages, p + 1))} disabled={ordersPage === totalOrderPages} className="px-3 py-1.5 text-xs font-semibold border border-gray-200 rounded-lg text-gray-500 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-all">Next →</button>
                  </div>
                </div>
              )}
            </div>
            {orderDetails && <OrderDetailsModal />}
          </div>
        );
      }

      /* ── WISHLIST ── */
      case 'Wishlist': return (
        <div>
          {wishlistProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center mb-4">
                <Heart size={24} className="text-red-300" />
              </div>
              <p className="text-sm font-semibold text-gray-400">No favourites yet</p>
              <p className="text-xs text-gray-300 mt-1">Tap the ♥ on any product to save it here</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-24">
              {wishlistProducts.map((p, i) => <ProductCard key={i} p={p} />)}
            </div>
          )}
        </div>
      );

      /* ── PROFILE ── */
      case 'Profile': return (
        <div className="bg-white border border-gray-100 rounded-2xl p-8 max-w-2xl shadow-sm">
          <div className="flex items-center gap-4 mb-8 pb-6 border-b border-gray-100">
            <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center font-bold text-sm text-red-600">
              {customerData.customername?.substring(0, 2).toUpperCase() || 'CU'}
            </div>
            <div>
              <p className="font-bold text-gray-900">{customerData.customername}</p>
              <p className="text-xs text-gray-400">Customer ID: {customerData.customerid}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-5">
            {[
              { label: 'Customer Name', key: 'customername', type: 'text' },
              { label: 'Email', key: 'email', type: 'email' },
              { label: 'Phone Number', key: 'phone', type: 'text' },
              { label: 'City', key: 'city', type: 'text' },
              { label: 'Street Address', key: 'street', type: 'text', span: 2 },
              { label: 'Loyalty Tier', key: 'loyaltytier', type: 'text', readOnly: true },
              { label: 'New Password', key: 'password', type: 'password', placeholder: '••••••••' },
            ].map(f => (
              <div key={f.key} className={f.span ? `col-span-${f.span}` : ''}>
                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">{f.label}</label>
                <input type={f.type} placeholder={f.placeholder || ''} disabled={f.readOnly}
                  value={formData[f.key] || (f.readOnly ? customerData[f.key] : '')}
                  onChange={e => setFormData({ ...formData, [f.key]: e.target.value })}
                  className={`w-full mt-1.5 px-3 py-2.5 text-sm rounded-xl border outline-none transition-all
                    ${f.readOnly ? 'bg-gray-50 border-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white border-gray-200 text-gray-800 focus:border-red-400 focus:ring-2 focus:ring-red-50'}`} />
              </div>
            ))}
          </div>
          <div className="flex justify-center mt-8">
            <button onClick={handleSave} className="px-8 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold uppercase tracking-wider transition-all">Save Changes</button>
          </div>
        </div>
      );

      default: return null;
    }
  };

  /* ─────────────────────────────────────────────
     SHELL
  ───────────────────────────────────────────── */
  const NAV_ITEMS = [
    { id: 'Overview', icon: LayoutDashboard, label: 'Overview' },
    { id: 'Shop', icon: ShoppingBag, label: 'Shop' },
    { id: 'Wishlist', icon: Heart, label: 'Wishlist', badge: wishlist.size || null },
    { id: 'Orders', icon: Package, label: 'My Orders' },
    { id: 'Profile', icon: User, label: 'Profile' },
  ];

  return (
    <div className="h-screen bg-[#F8F9FB] flex font-sans overflow-hidden">
      {/* Sidebar */}
      <div className="w-60 bg-white border-r border-gray-100 flex flex-col h-full">
        <div className="px-6 py-4 border-b border-gray-100 h-[73px] flex items-center">
          <img src="/Rami_Levy_Hashikma_Marketing_logo.png" alt="Rami Levy" className="h-10 object-contain" />
        </div>
        <div className="px-4 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2.5">
            <div className="w-8 h-8 rounded-xl bg-red-100 flex items-center justify-center font-bold text-[10px] text-red-600 flex-shrink-0">
              {customerData.customername?.substring(0, 2).toUpperCase() || 'CU'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-gray-800 truncate">{customerData.customername}</p>
              <p className="text-[10px] text-gray-400 truncate">Customer</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {NAV_ITEMS.map(({ id, icon: Icon, label, badge }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all
                ${activeTab === id ? 'bg-red-50 text-red-600 font-semibold border border-red-100' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'}`}>
              <Icon size={15} />
              <span className="flex-1 text-left">{label}</span>
              {badge > 0 && (
                <span className="flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-red-100 text-red-600 text-[9px] font-bold rounded-full">{badge}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="px-3 py-4 border-t border-gray-100">
          <button onClick={() => navigate('/')} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-400 hover:bg-red-50 hover:text-red-600 transition-all">
            <LogOut size={15} /> Sign Out
          </button>
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="bg-white border-b border-gray-100 px-6 h-[73px] flex items-center justify-between">
          <div>
            <p className="text-[10px] font-semibold text-gray-400 tracking-widest uppercase">Customer Portal</p>
            <h1 className="text-lg font-bold text-gray-900 mt-0.5">{activeTab}</h1>
          </div>
          <button onClick={() => setCartOpen(true)} className="relative flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-600 text-sm font-semibold transition-all">
            <ShoppingCart size={15} />
            <span>Cart</span>
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[9px] font-bold rounded-full">{cartCount}</span>
            )}
          </button>
        </header>

        <main className="flex-1 p-8 overflow-y-auto bg-[#F8F9FB] relative">
          {/* Toast */}
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
                <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">{statusMessage.type === 'success' ? 'Success' : 'Error'}</span>
                <span className="text-sm text-gray-800">{statusMessage.text}</span>
              </div>
              <button onClick={() => setStatusMessage(null)} className="ml-auto text-gray-300 hover:text-gray-500"><X size={13} /></button>
            </div>
          )}
          {renderContent()}
        </main>
      </div>

      {cartOpen && <CartDrawer />}
      {activeTab === 'Shop' && !cartOpen && cartCount > 0 && <FloatingCartButton />}
    </div>
  );
};

export default CustomerDashboard;