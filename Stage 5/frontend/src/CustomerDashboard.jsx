import React, { useState, useEffect } from 'react';
import { Package, User, LayoutDashboard, LogOut, Clock, Star, Award, Shield, ShoppingBag, Droplets, Utensils, Apple, X } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const CustomerDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const getProductIcon = (name) => {
    if (!name) return ShoppingBag;
    const lowerName = name.toLowerCase();
    if (lowerName.includes('water')) return Droplets;
    if (lowerName.includes('fish') || lowerName.includes('veal')) return Utensils;
    if (lowerName.includes('apple') || lowerName.includes('pepper') || lowerName.includes('tomato')) return Apple;
    return ShoppingBag;
  };

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

  const [formData, setFormData] = useState({
    customername: customerData.customername || '',
    email: customerData.email || '',
    phone: customerData.phone || '',
    city: customerData.city || '',
    street: customerData.street || '',
    password: ''
  });

  const refreshCustomerData = async (id) => {
    try {
      const res = await fetch(`http://localhost:5000/api/customer/${id}`);
      const data = await res.json();
      if (data.success) {
        setCustomerData(data.user);
        setFormData({
          customername: data.user.customername || '',
          email: data.user.email || '',
          phone: data.user.phone || '',
          city: data.user.city || '',
          street: data.user.street || '',
          password: ''
        });
      }
    } catch (err) {
      console.error("Error refreshing customer data:", err);
    }
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!customerData.customerid) return;
      await refreshCustomerData(customerData.customerid);
      try {
        const prodRes = await fetch('http://localhost:5000/api/admin/products');
        const prodData = await prodRes.json();
        setAllProducts(Array.isArray(prodData) ? prodData : []);

        const statsRes = await fetch(`http://localhost:5000/api/customer/stats/${customerData.customerid}`);
        setStats(await statsRes.json());

        const ordersRes = await fetch(`http://localhost:5000/api/customer/orders/${customerData.customerid}`);
        setOrders(await ordersRes.json());
      } catch (err) {
        console.error("Erreur:", err);
      }
    };
    fetchDashboardData();
  }, [customerData.customerid]);

  const showToast = (type, text) => {
    setStatusMessage({ type, text });
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleSave = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/customer/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerid: customerData.customerid, ...formData })
      });
      const result = await response.json();
      if (result.success) {
        await refreshCustomerData(customerData.customerid);
        showToast('success', 'Profile updated successfully!');
      } else {
        showToast('error', result.message || 'Error updating profile.');
      }
    } catch (err) {
      showToast('error', 'Cannot connect to server.');
    }
  };

  const LoyaltyBadge = ({ tier }) => {
    const cleanTierName = tier ? tier.replace(/🏆|⭐/g, '').trim() : 'Standard';

    if (cleanTierName.includes('Gold')) {
      return (
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-amber-50 border border-amber-100 shadow-sm">
            <Star size={18} className="fill-amber-500 text-amber-500" />
          </div>
          <span className="text-2xl font-bold bg-gradient-to-br from-amber-500 to-orange-500 bg-clip-text text-transparent">
            {cleanTierName}
          </span>
        </div>
      );
    } else if (cleanTierName.includes('Silver') || cleanTierName.includes('Premium')) {
      return (
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-slate-50 border border-slate-200 shadow-sm">
            <Award size={18} className="text-slate-500" />
          </div>
          <span className="text-2xl font-bold bg-gradient-to-br from-slate-500 to-slate-700 bg-clip-text text-transparent">
            {cleanTierName}
          </span>
        </div>
      );
    } else {
      return (
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-gray-50 border border-gray-200 shadow-sm">
            <Shield size={18} className="text-gray-400" />
          </div>
          <span className="text-2xl font-bold text-gray-700">
            {cleanTierName}
          </span>
        </div>
      );
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'Overview':
        return (
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
                                'bg-gray-50 text-gray-500 border-gray-100'}`}>
                          {o.status}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">No recent activity found.</p>
                )}
              </div>
            </div>
          </div>
        );

      case 'Profile':
        return (
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
                { label: 'Customer Name', key: 'customername', type: 'text', readOnly: false },
                { label: 'Email', key: 'email', type: 'email', readOnly: false },
                { label: 'Phone Number', key: 'phone', type: 'text', readOnly: false },
                { label: 'City', key: 'city', type: 'text', readOnly: false },
                { label: 'Street Address', key: 'street', type: 'text', readOnly: false, span: 2 },
                { label: 'Loyalty Tier', key: 'loyaltytier', type: 'text', readOnly: true },
                { label: 'New Password', key: 'password', type: 'password', readOnly: false, placeholder: '••••••••' },
              ].map(f => (
                <div key={f.key} className={f.span ? `col-span-${f.span}` : ''}>
                  <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">{f.label}</label>
                  <input
                    type={f.type}
                    placeholder={f.placeholder || ''}
                    disabled={f.readOnly}
                    value={formData[f.key] || (f.readOnly ? customerData[f.key] : '')}
                    onChange={e => setFormData({ ...formData, [f.key]: e.target.value })}
                    className={`w-full mt-1.5 px-3 py-2.5 text-sm rounded-xl border outline-none transition-all
                                            ${f.readOnly
                        ? 'bg-gray-50 border-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white border-gray-200 text-gray-800 focus:border-red-400 focus:ring-2 focus:ring-red-50'}`}
                  />
                </div>
              ))}
            </div>

            {/* BOUTON CENTRÉ */}
            <div className="flex justify-center mt-8">
              <button onClick={handleSave} className="px-8 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold uppercase tracking-wider transition-all">
                Save Changes
              </button>
            </div>
          </div>
        );

      case 'Orders':
        return (
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
                {orders.length > 0 ? orders.map((o, i) => (
                  <tr key={i} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/60 transition-colors">
                    <td className="px-6 py-3.5 text-sm font-semibold text-gray-800">#{o.orderid}</td>
                    <td className="px-6 py-3.5 text-sm text-gray-500">{new Date(o.orderdate).toLocaleDateString()}</td>
                    <td className="px-6 py-3.5">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold tracking-wide border
                                                ${o.status?.toUpperCase() === 'PENDING' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                          o.status?.toUpperCase() === 'APPROVED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                            o.status?.toUpperCase() === 'DELIVERED' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                              'bg-gray-50 text-gray-500 border-gray-100'}`}>
                        {o.status}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <button
                        onClick={async () => {
                          setLoadingDetails(true);
                          try {
                            const res = await fetch(`http://localhost:5000/api/store/order-details/${o.orderid}`);
                            const data = await res.json();
                            setOrderDetails(data);
                          } catch (error) {
                            showToast('error', 'Impossible de charger les détails.');
                          } finally {
                            setLoadingDetails(false);
                          }
                        }}
                        className="text-[11px] font-semibold px-3 py-1.5 rounded-lg border border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100 hover:border-gray-300 transition-all whitespace-nowrap"
                      >
                        {loadingDetails ? '...' : 'View →'}
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan="4" className="px-6 py-8 text-center text-sm text-gray-500">You have no previous orders.</td></tr>
                )}
              </tbody>
            </table>

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

      case 'Shop':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-6">
            {allProducts.map((p, i) => {
              const IconComponent = getProductIcon(p.productname);
              return (
                <div key={i} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-gray-200 transition-all duration-200 flex flex-col group relative z-10">
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
                    onClick={async (e) => {
                      e.stopPropagation();
                      try {
                        const res = await fetch('http://localhost:5000/api/customer/order', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            customerid: customerData.customerid,
                            productid: p.productid,
                            quantity: 1
                          })
                        });
                        const result = await res.json();
                        if (result.success) {
                          showToast('success', 'Order placed successfully!');
                        } else {
                          showToast('error', 'Failed to place order.');
                        }
                      } catch (error) {
                        showToast('error', 'Server connection error.');
                      }
                    }}
                    className="w-full py-2 bg-gray-900 text-white text-[11px] font-semibold uppercase rounded-xl hover:bg-red-600 transition-all tracking-wider relative z-20"
                  >
                    Buy Now
                  </button>
                </div>
              );
            })}
          </div>
        );

      default: return null;
    }
  };

  return (
    <div className="h-screen bg-[#F8F9FB] flex font-sans overflow-hidden">
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
          {[
            { id: 'Overview', icon: LayoutDashboard, label: 'Overview' },
            { id: 'Shop', icon: ShoppingBag, label: 'Shop' },
            { id: 'Orders', icon: Package, label: 'My Orders' },
            { id: 'Profile', icon: User, label: 'Profile' }
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

      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="bg-white border-b border-gray-100 px-6 h-[73px] flex items-center">
          <div>
            <p className="text-[10px] font-semibold text-gray-400 tracking-widest uppercase">Customer Portal</p>
            <h1 className="text-lg font-bold text-gray-900 mt-0.5">{activeTab}</h1>
          </div>
        </header>
        <main className="flex-1 p-8 overflow-y-auto bg-[#F8F9FB]">
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
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default CustomerDashboard;