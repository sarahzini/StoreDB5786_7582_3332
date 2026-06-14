import React, { useState, useEffect } from 'react';
import { Package, User, LayoutDashboard, LogOut, Clock, Star, Award, Shield, ShoppingBag, Droplets, Utensils, Apple } from 'lucide-react'; import { useNavigate, useLocation } from 'react-router-dom';

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

  // Fetch fresh customer data from the backend
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
      // Re-fetch fresh customer info from the DB
      await refreshCustomerData(customerData.customerid);
      // Dans fetchDashboardData
      const prodRes = await fetch('http://localhost:5000/api/admin/products');
      setAllProducts(await prodRes.json());
      try {
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
        // Re-fetch fresh data from the DB after saving
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
    // Nettoie le nom (enlève les émojis du backend)
    const cleanTierName = tier ? tier.replace(/🏆|⭐/g, '').trim() : 'Standard';

    if (cleanTierName.includes('Gold')) {
      return (
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-amber-50 border border-amber-100 shadow-sm">
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
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-50 border border-slate-200 shadow-sm">
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
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-50 border border-gray-200 shadow-sm">
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
            <div className="bg-white border border-gray-100 rounded-xl p-8 shadow-sm">
              <h2 className="text-2xl font-bold text-gray-900">Welcome back, {customerData.customername}</h2>
              <p className="text-sm text-gray-500 mt-1">Here is a summary of your real activity from our database.</p>
            </div>

            <div className="grid grid-cols-3 gap-6">
              <div className="bg-white border border-gray-100 p-6 rounded-xl shadow-sm">
                <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-3">Loyalty Tier</p>
                <LoyaltyBadge tier={stats.loyaltyTier} />
              </div>
              <div className="bg-white border border-gray-100 p-6 rounded-xl shadow-sm">
                <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-2">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalOrders}</p>
              </div>
              <div className="bg-white border border-gray-100 p-6 rounded-xl shadow-sm">
                <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-2">Total Spent</p>
                <p className="text-2xl font-bold text-emerald-600">₪{stats.totalSpent}</p>
              </div>
            </div>

            <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-50 flex items-center gap-2">
                <Clock size={16} className="text-gray-400" />
                <h3 className="text-sm font-semibold text-gray-800">Recent Orders</h3>
              </div>
              <div className="p-6">
                {orders.length > 0 ? (
                  <div className="space-y-4">
                    {orders.slice(0, 3).map((o, i) => (
                      <div key={i} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm font-medium text-gray-700">Order #{o.orderid}</span>
                        <span className="text-xs text-gray-500">{new Date(o.orderdate).toLocaleDateString()}</span>
                        <span className="px-2 py-1 rounded bg-orange-100 text-orange-700 text-[10px] font-medium uppercase">{o.status}</span>
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
          <div className="bg-white border border-gray-100 rounded-xl p-8 max-w-2xl shadow-sm">
            <h2 className="text-lg font-bold mb-6 text-gray-900">Account Information</h2>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="text-[10px] text-gray-400 uppercase">Customer ID (Read Only)</label>
                <input className="w-full mt-1 p-2.5 bg-gray-100 border border-gray-200 rounded-lg text-gray-400 cursor-not-allowed text-sm" value={customerData.customerid || ''} disabled />
              </div>
              <div>
                <label className="text-[10px] text-gray-400 uppercase">Loyalty Tier (Read Only)</label>
                <input className="w-full mt-1 p-2.5 bg-gray-100 border border-gray-200 rounded-lg text-gray-400 cursor-not-allowed text-sm" value={customerData.loyaltytier || ''} disabled />
              </div>
              <div>
                <label className="text-[10px] text-gray-400 uppercase">Customer Name</label>
                <input className="w-full mt-1 p-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-red-500 text-sm"
                  value={formData.customername} onChange={(e) => setFormData({ ...formData, customername: e.target.value })} />
              </div>
              <div>
                <label className="text-[10px] text-gray-400 uppercase">Email</label>
                <input className="w-full mt-1 p-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-red-500 text-sm"
                  value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
              </div>
              <div>
                <label className="text-[10px] text-gray-400 uppercase">Phone</label>
                <input className="w-full mt-1 p-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-red-500 text-sm"
                  value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
              </div>
              <div>
                <label className="text-[10px] text-gray-400 uppercase">City</label>
                <input className="w-full mt-1 p-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-red-500 text-sm"
                  value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} />
              </div>
              <div className="col-span-2">
                <label className="text-[10px] text-gray-400 uppercase">Street Address</label>
                <input className="w-full mt-1 p-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-red-500 text-sm"
                  value={formData.street} onChange={(e) => setFormData({ ...formData, street: e.target.value })} />
              </div>
              <div className="col-span-2">
                <label className="text-[10px] text-gray-400 uppercase">New Password</label>
                <input type="password" placeholder="••••••••" className="w-full mt-1 p-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-red-500 text-sm"
                  value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
              </div>
            </div>
            <div className="flex justify-center mt-8">
              <button onClick={handleSave} className="px-10 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all uppercase text-sm font-medium">
                Save Changes
              </button>
            </div>
          </div>
        );

      case 'Orders':
        return (
          <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm">
            <div className="p-6 border-b border-gray-50">
              <p className="text-[11px] font-medium text-gray-400 uppercase tracking-widest">Order History</p>
            </div>
            <table className="w-full">
              <thead className="bg-gray-50/50">
                <tr className="border-b border-gray-50">
                  {['Order ID', 'Date', 'Status', ''].map(h => (
                    <th key={h} className="text-left px-6 py-4 text-[10px] font-medium text-gray-400 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.length > 0 ? orders.map((o, i) => (
                  <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">#{o.orderid}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{new Date(o.orderdate).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className="px-2.5 py-1 rounded text-[10px] font-medium uppercase bg-orange-50 text-orange-600 border border-orange-100">{o.status}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {/* --- NOUVEAU BOUTON VIEW --- */}
                      <button
                        onClick={async () => {
                          setLoadingDetails(true);
                          try {
                            // On utilise la même route que le store pour récupérer les détails de la commande
                            const res = await fetch(`http://localhost:5000/api/store/order-details/${o.orderid}`);
                            const data = await res.json();
                            setOrderDetails(data);
                          } catch (error) {
                            console.error("Erreur lors de la récupération des détails :", error);
                            showToast('error', 'Impossible de charger les détails.');
                          } finally {
                            setLoadingDetails(false);
                          }
                        }}
                        className="text-xs font-medium text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-all"
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

            {/* --- NOUVELLE MODALE POUR LES DÉTAILS --- */}
            {orderDetails && (
              <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
                <div className="bg-white rounded-2xl shadow-2xl p-8 w-[500px] max-h-[80vh] overflow-y-auto">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-bold text-gray-900">Order #{orderDetails.order?.orderid}</h2>
                    <button onClick={() => setOrderDetails(null)} className="text-gray-400 hover:text-gray-600">
                      <svg width="18" height="18" viewBox="0 0 14 14" fill="none"><path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-gray-50 rounded-xl p-4">
                      <p className="text-[10px] text-gray-400 uppercase mb-1">Date</p>
                      <p className="text-sm font-semibold text-gray-800">
                        {new Date(orderDetails.order?.orderdate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4">
                      <p className="text-[10px] text-gray-400 uppercase mb-1">Status</p>
                      <span className="px-2 py-1 rounded bg-orange-50 text-orange-600 text-[10px] font-medium">
                        {orderDetails.order?.status}
                      </span>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4">
                      <p className="text-[10px] text-gray-400 uppercase mb-1">Total Price</p>
                      {orderDetails.order?.price && parseFloat(orderDetails.order.price) > 0 ? (
                        <p className="text-sm font-bold text-emerald-600">₪{orderDetails.order.price}</p>
                      ) : (
                        <p className="text-xs text-gray-400 italic">Pending</p>
                      )}
                    </div>
                  </div>

                  <p className="text-[10px] font-semibold text-gray-400 uppercase mb-3">Products Ordered</p>
                  {orderDetails.items?.length > 0 ? (
                    <div className="space-y-2">
                      {orderDetails.items.map((item, i) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <span className="text-sm font-medium text-gray-800 block">{item.productname}</span>
                            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                              Unit Price: ₪{item.unitprice}
                            </span>
                          </div>
                          <div className="flex items-center gap-5 text-sm text-gray-500">
                            <span>Qty: <strong className="text-gray-900">{item.quantity}</strong></span>
                            <div className="text-right">
                              <span className="text-[10px] text-gray-400 block leading-none mb-1">Total</span>
                              <span className="font-bold text-emerald-600">₪{item.subtotal}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 text-center py-4">No products found for this order.</p>
                  )}

                  <button
                    onClick={() => setOrderDetails(null)}
                    className="w-full mt-6 py-2.5 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-200 transition-all"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      case 'Shop':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 pb-6">
            {allProducts.map((p, i) => {
              const IconComponent = getProductIcon(p.productname);
              return (
                <div key={i} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col group relative z-10">

                  {/* Icône du produit */}
                  <div className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                    <IconComponent size={24} />
                  </div>

                  {/* Prix */}
                  <div className="flex justify-end mb-3">
                    <span className="text-sm font-black text-gray-900">₪{p.price}</span>
                  </div>

                  {/* Nom du produit */}
                  <h3 className="text-sm font-bold text-gray-800 mb-6 line-clamp-2 leading-snug group-hover:text-red-600 transition-colors">
                    {p.productname}
                  </h3>

                  {/* Badges Kashrut */}
                  <div className="flex flex-wrap gap-1.5 mb-6 mt-auto">
                    {p.kashrut_list ? p.kashrut_list.split(',').map((k, idx) => (
                      <span key={idx} className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[9px] font-semibold rounded">
                        {k.trim()}
                      </span>
                    )) : (
                      <span className="px-2 py-0.5 bg-gray-50 text-gray-400 text-[9px] font-semibold rounded">
                        No Kashrut
                      </span>
                    )}
                  </div>

                  {/* Bouton d'achat */}
                  <button
                    onClick={async (e) => {
                      e.stopPropagation(); // <-- CRUCIAL : Empêche le clic d'être "mangé" par un autre élément
                      console.log("Clic sur Buy Now pour :", p.productname);

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
                        console.log("Réponse serveur :", result);

                        if (result.success) {
                          showToast('success', 'Order placed successfully!');
                        } else {
                          showToast('error', 'Failed to place order: ' + result.message);
                        }
                      } catch (error) {
                        console.error("Erreur Fetch:", error);
                        showToast('error', 'Server connection error.');
                      }
                    }}
                    className="w-full py-2.5 bg-gray-900 text-white text-[11px] font-bold uppercase rounded-xl hover:bg-red-600 transition-all cursor-pointer relative z-20"
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
        <div className="px-6 py-5 border-b border-gray-100 h-[73px] flex items-center">
          <img src="/Rami_Levy_Hashikma_Marketing_logo.png" alt="Rami Levy" className="h-10 object-contain" />
        </div>
        <div className="px-4 py-4 border-b border-gray-50">
          <div className="flex items-center gap-3 bg-gray-50 rounded-lg px-3 py-2.5">
            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
              <User size={14} className="text-red-600" />
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-gray-900 truncate">{customerData.customername}</p>
              <p className="text-[10px] text-gray-400">Customer</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {[
            { id: 'Overview', icon: LayoutDashboard, label: 'Overview' },
            { id: 'Shop', icon: ShoppingBag, label: 'Shop' }, // <--- AJOUTE CETTE LIGNE
            { id: 'Orders', icon: Package, label: 'My Orders' },
            { id: 'Profile', icon: User, label: 'Profile' }
          ].map(({ id, icon: Icon, label }) => (
            <button key={id} onClick={() => setActiveTab(id)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${activeTab === id ? 'bg-red-50 text-red-600 font-medium' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}>
              <Icon size={16} /> {label}
            </button>
          ))}
        </nav>
        <div className="px-3 py-4 border-t border-gray-50">
          <button onClick={() => navigate('/')} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:bg-red-50 hover:text-red-600 transition-all">
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="bg-white border-b border-gray-100 px-8 h-[73px] flex items-center">
          <h1 className="text-lg font-bold text-gray-900">{activeTab}</h1>
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
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default CustomerDashboard;