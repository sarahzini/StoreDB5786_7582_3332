import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Truck, X, LogOut, Wrench, User, Moon, Sun, Globe, Package } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import SalesChart from './SalesChart';
import { t } from './translations';

const DriverDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [truckData, setTruckData] = useState(location.state?.user || {
    driverid: 'N/A', licenseplate: 'N/A', capacity: '0', maintenancestatus: 'Unknown', active: 0, email: '', password: ''
  });

  const [activeTab, setActiveTab] = useState('Overview');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const [deliveries, setDeliveries] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [formData, setFormData] = useState({
    email: truckData.email || '',
    password: ''
  });

  // Delivery filter & detail modal
  const [deliveryFilter, setDeliveryFilter] = useState('All');
  const [deliveryDetail, setDeliveryDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

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

  const navItems = [
    { id: 'Overview', icon: LayoutDashboard, label: 'Overview' },
    { id: 'Deliveries', icon: Truck, label: 'My Deliveries' },
    { id: 'Truck Info', icon: Wrench, label: 'Truck Info' },
    { id: 'Account', icon: User, label: 'Account' },
  ];

  useEffect(() => {
    const fetchDriverData = async () => {
      if (!truckData.driverid || truckData.driverid === 'N/A') return;
      try {
        const ordersRes = await fetch(`http://localhost:5000/api/driver/orders/${truckData.driverid}`);
        const ordersData = await ordersRes.json();
        setDeliveries(ordersData);

        const chartRes = await fetch(`http://localhost:5000/api/driver/chart/${truckData.driverid}`);
        const chartJson = await chartRes.json();
        setChartData(chartJson.map(d => ({ name: d.name, sales: d.deliveries })));
      } catch (err) {
        console.error("Erreur chargement driver:", err);
      }
    };
    fetchDriverData();
  }, [truckData.driverid]);

  const showToast = (type, text) => {
    setStatusMessage({ type, text });
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const openUpdateDrawer = (order) => {
    setSelectedOrder(order);
    setNewStatus(order.status);
    setIsDrawerOpen(true);
  };

  const handleUpdateStatus = async (overrideStatus) => {
    if (!selectedOrder) return;
    const statusToUse = typeof overrideStatus === 'string' ? overrideStatus : newStatus;
    try {
      const res = await fetch('http://localhost:5000/api/orders/update-status', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderid: selectedOrder.id, status: statusToUse })
      });
      const result = await res.json();
      if (result.success) {
        setDeliveries(deliveries.map(d => d.id === selectedOrder.id ? { ...d, status: statusToUse } : d));
        showToast('success', `${t('Order #', lang)}${selectedOrder.id} ${t('updated to', lang)} ${t(statusToUse, lang)}`);
        setIsDrawerOpen(false);
      } else {
        showToast('error', t('Failed to update status.', lang));
      }
    } catch (err) {
      showToast('error', t('Server error.', lang));
    }
  };

  const handleAccountSave = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/driver/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ driverid: truckData.driverid, ...formData })
      });
      const result = await res.json();
      if (result.success) {
        setTruckData(prev => ({ ...prev, ...formData }));
        showToast('success', t('Account updated successfully!', lang));
      } else {
        showToast('error', result.message || t('Update failed.', lang));
      }
    } catch (err) {
      showToast('error', t('Server error.', lang));
    }
  };

  const renderContent = () => {
    switch (activeTab) {

      case 'Overview':
        return (
          <div className="space-y-6">
            <div className="bg-white border border-gray-100 rounded-xl p-8 shadow-sm flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{t('Good morning,', lang)} {t('Driver', lang)} #{truckData.driverid}</h2>
                <p className="text-sm text-gray-500 mt-1">{t('Drive safely! Here is your summary.', lang)}</p>
              </div>
              <div className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider ${truckData.maintenancestatus === 'OK' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                {t('Truck:', lang)} {t(truckData.maintenancestatus, lang)}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-6">
              <div className="bg-white border border-gray-100 p-6 rounded-xl shadow-sm">
                <p className="text-[11px] font-medium text-gray-400 tracking-[0.12em] uppercase mb-2">{t('Total Routes', lang)}</p>
                <p className="text-3xl font-bold text-gray-900">{deliveries.length}</p>
              </div>
              <div className="bg-white border border-gray-100 p-6 rounded-xl shadow-sm">
                <p className="text-[11px] font-medium text-gray-400 tracking-[0.12em] uppercase mb-2">{t('Pending', lang)}</p>
                <p className="text-3xl font-bold text-blue-600">
                  {deliveries.filter(d => d.status !== 'COMPLETED' && d.status !== 'DELIVERED').length}
                </p>
              </div>
              <div className="bg-white border border-gray-100 p-6 rounded-xl shadow-sm">
                <p className="text-[11px] font-medium text-gray-400 tracking-[0.12em] uppercase mb-2">{t('Completed', lang)}</p>
                <p className="text-3xl font-bold text-emerald-600">
                  {deliveries.filter(d => d.status === 'COMPLETED' || d.status === 'DELIVERED').length}
                </p>
              </div>
            </div>

            <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
              <p className="text-[11px] font-medium text-gray-400 tracking-[0.12em] uppercase mb-4">{t('Daily Deliveries This Month', lang)}</p>
              <div className="w-full">
                <SalesChart data={chartData} label={t('Deliveries', lang)} prefix="" />
              </div>
            </div>
          </div>
        );

      case 'Deliveries': {
        const STATUS_FILTERS = ['All', 'PENDING', 'IN PROGRESS', 'DELIVERED', 'COMPLETED'];
        const filteredDeliveries = deliveryFilter === 'All'
          ? deliveries
          : deliveries.filter(d => d.status?.toUpperCase() === deliveryFilter);

        return (
          <div>
            {/* Status filter tabs */}
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              {STATUS_FILTERS.map(f => (
                <button
                  key={f}
                  onClick={() => setDeliveryFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${deliveryFilter === f
                    ? 'bg-red-600 text-white border-red-600'
                    : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                    }`}
                >
                  {t(f, lang)}{f !== 'All' && ` (${deliveries.filter(d => d.status?.toUpperCase() === f).length})`}
                </button>
              ))}
              <span className="text-xs text-gray-400 ml-auto">
                {filteredDeliveries.length} {t(filteredDeliveries.length !== 1 ? 'orders' : 'order', lang)}
              </span>
            </div>

            <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full">
                <thead className="bg-gray-50/50">
                  <tr className="border-b border-gray-50 dark:border-white/5">
                    {[t('Order ID', lang), t('Date', lang), t('Status', lang), ''].map(h => (
                      <th key={h} className="text-left px-6 py-4 text-[10px] font-medium text-gray-400 tracking-[0.1em] uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredDeliveries.length > 0 ? filteredDeliveries.map((route, i) => (
                    <tr key={i} className="border-b border-gray-50 dark:border-white/5 hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 text-sm font-bold text-gray-800">#{route.id}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{new Date(route.orderdate).toLocaleDateString()}</td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded tracking-wide uppercase
                            ${route.status === 'COMPLETED' || route.status === 'DELIVERED' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                            route.status === 'IN PROGRESS' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                              'bg-orange-50 text-orange-600 border border-orange-100'}`}>
                          {t(route.status?.toUpperCase(), lang)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center gap-2 justify-end">
                          <button
                            onClick={async () => {
                              setLoadingDetail(true);
                              try {
                                const res = await fetch(`http://localhost:5000/api/store/order-details/${route.id}`);
                                const data = await res.json();
                                setDeliveryDetail(data);
                              } catch { showToast('error', t('Could not load details.', lang)); }
                              finally { setLoadingDetail(false); }
                            }}
                            className="text-[11px] text-gray-600 font-bold bg-gray-50 hover:bg-gray-100 border border-gray-200 px-3 py-1.5 rounded-lg transition-colors"
                          >
                            {loadingDetail ? '...' : t('View →', lang)}
                          </button>
                          <button onClick={() => openUpdateDrawer(route)} className="text-[11px] text-red-600 font-bold hover:text-red-800 uppercase tracking-widest bg-red-50 px-3 py-1.5 rounded-lg hover:bg-red-100 transition-colors">
                            {t('Update', lang)}
                          </button>
                        </div>
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
                          <p className="text-base font-bold text-gray-800">
                            {deliveryFilter === 'All' ? t('No deliveries found', lang) : t(`No ${deliveryFilter?.toUpperCase()} deliveries`, lang)}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">{t('There are no deliveries assigned at this time.', lang)}</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Delivery Detail Modal */}
            {deliveryDetail && (
              <div className="fixed inset-0 bg-black/40 dark:bg-black/20 z-50 flex items-center justify-center backdrop-blur-md">
                <div className="bg-[#F8F9FB] rounded-2xl shadow-2xl p-8 w-[520px] max-h-[80vh] overflow-y-auto">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold mb-0.5">{t('Delivery Details', lang)}</p>
                      <h2 className="text-lg font-bold text-gray-900">{t('Order #', lang)}{deliveryDetail.order?.orderid}</h2>
                    </div>
                    <button onClick={() => setDeliveryDetail(null)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-500">
                      <X size={14} />
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-3 mb-6">
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1 font-semibold">{t('Date', lang)}</p>
                      <p className="text-sm font-semibold text-gray-800">{new Date(deliveryDetail.order?.orderdate).toLocaleDateString()}</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1 font-semibold">{t('Status', lang)}</p>
                      <span className="px-2 py-0.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-100 text-[10px] font-semibold">{t(deliveryDetail.order?.status?.toUpperCase(), lang)}</span>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1 font-semibold">{t('Total', lang)}</p>
                      {deliveryDetail.order?.price && parseFloat(deliveryDetail.order.price) > 0
                        ? <p className="text-sm font-bold text-emerald-600">₪{deliveryDetail.order.price}</p>
                        : <p className="text-xs text-gray-400 italic">{t('Pending', lang)}</p>}
                    </div>
                  </div>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-3">{t('Products in This Delivery', lang)}</p>
                  {deliveryDetail.items?.length > 0 ? (
                    <div className="space-y-2">
                      {deliveryDetail.items.map((item, i) => (
                        <div key={i} className="flex items-center justify-between p-3.5 bg-gray-50 rounded-xl border border-gray-100">
                          <div>
                            <p className="text-sm font-semibold text-gray-800">{t(item.productname, lang)}</p>
                            <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mt-0.5">{t('Unit:', lang)} ₪{item.unitprice}</p>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-sm text-gray-500">{t('Qty:', lang)} <strong className="text-gray-800">{item.quantity}</strong></span>
                            <p className="font-bold text-emerald-600">₪{item.subtotal}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : <p className="text-sm text-gray-400 text-center py-6">{t('No product details available.', lang)}</p>}
                  <button onClick={() => setDeliveryDetail(null)}
                    className="w-full mt-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl text-sm font-semibold transition-all">{t('Close', lang)}</button>
                </div>
              </div>
            )}
          </div>
        );
      }

      case 'Truck Info':
        return (
          <div className="bg-white border border-gray-100 rounded-xl p-8 max-w-2xl shadow-sm">
            <h2 className="text-lg font-bold mb-6 text-gray-900">{t('Truck Information', lang)}</h2>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="text-[10px] text-gray-400 uppercase tracking-wide">{t('Driver ID (Read Only)', lang)}</label>
                <input className="w-full mt-1 p-2.5 bg-gray-100 border border-gray-200 rounded-lg text-gray-400 cursor-not-allowed text-sm" value={truckData.driverid} disabled />
              </div>
              <div>
                <label className="text-[10px] text-gray-400 uppercase tracking-wide">{t('License Plate', lang)}</label>
                <input className="w-full mt-1 p-2.5 bg-gray-100 border border-gray-200 rounded-lg text-gray-500 font-medium cursor-not-allowed text-sm" value={truckData.licenseplate} disabled />
              </div>
              <div>
                <label className="text-[10px] text-gray-400 uppercase tracking-wide">{t('Capacity', lang)}</label>
                <input className="w-full mt-1 p-2.5 bg-gray-100 border border-gray-200 rounded-lg text-gray-500 font-medium cursor-not-allowed text-sm" value={`${truckData.capacity} ${t('Tons', lang)}`} disabled />
              </div>
              <div>
                <label className="text-[10px] text-gray-400 uppercase tracking-wide">{t('Active Status', lang)}</label>
                <input className="w-full mt-1 p-2.5 bg-gray-100 border border-gray-200 rounded-lg text-gray-500 font-medium cursor-not-allowed text-sm" value={truckData.active === 1 ? t('Active', lang) : t('Inactive', lang)} disabled />
              </div>
              <div className="col-span-2">
                <label className="text-[10px] text-gray-400 uppercase tracking-wide">{t('Maintenance Status', lang)}</label>
                <input className={`w-full mt-1 p-2.5 border rounded-lg font-bold cursor-not-allowed text-sm
                  ${truckData.maintenancestatus === 'OK' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-red-50 text-red-600 border-red-200'}`}
                  value={t(truckData.maintenancestatus, lang)} disabled />
              </div>
            </div>
          </div>
        );

      case 'Account':
        return (
          <div className="bg-white border border-gray-100 rounded-xl p-8 max-w-2xl shadow-sm">
            <h2 className="text-lg font-bold mb-6 text-gray-900">{t('Account Information', lang)}</h2>
            <div className="grid grid-cols-2 gap-6">
              <div className="col-span-2">
                <label className="text-[10px] text-gray-400 uppercase">{t('Driver ID (Read Only)', lang)}</label>
                <input className="w-full mt-1 p-2.5 bg-gray-100 border border-gray-200 rounded-lg text-gray-400 cursor-not-allowed text-sm" value={truckData.driverid} disabled />
              </div>
              <div>
                <label className="text-[10px] text-gray-400 uppercase">{t('Email', lang)}</label>
                <input className="w-full mt-1 p-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-red-500 text-sm"
                  value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
              </div>
              <div>
                <label className="text-[10px] text-gray-400 uppercase">{t('New Password', lang)}</label>
                <input type="password" placeholder="••••••••" className="w-full mt-1 p-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-red-500 text-sm"
                  value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
              </div>
            </div>
            <div className="flex justify-center mt-8">
              <button onClick={handleAccountSave} className="px-10 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all uppercase text-sm font-medium">
                {t('Save Changes', lang)}
              </button>
            </div>
          </div>
        );

      default: return null;
    }
  };

  return (
    <div className="h-screen bg-[#F8F9FB] flex font-sans overflow-hidden" dir={lang === 'he' ? 'rtl' : 'ltr'}>
      <div className="w-60 bg-white dark:!bg-transparent dark:bg-gradient-to-br dark:from-[#0B1120] dark:via-[#111827] dark:to-[#450a0a] bg-fixed border-r border-gray-100 dark:border-white/10 flex flex-col h-full relative z-30">
        <div className="w-full border-b border-gray-100 dark:border-white/10 h-[73px] flex items-center justify-center">
          <div className="bg-white px-5 py-1.5 rounded-xl shadow-sm border border-gray-200 dark:border-white/10 flex items-center justify-center transition-all hover:scale-105">
            <img src="/Rami_Levy_Hashikma_Marketing_logo.png" alt="Rami Levy" className="h-7 object-contain transition-all dark:drop-shadow-[0_0_12px_rgba(255,255,255,0.7)]" />
          </div>
        </div>
        <div className="px-4 py-4 border-b border-gray-50 dark:border-white/5">
          <div className="flex items-center gap-3 bg-gray-50 rounded-lg px-3 py-2.5">
            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center font-bold text-[10px] text-red-600">DR</div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-gray-900 truncate">{t('Driver', lang)} #{truckData.driverid}</p>
              <p className="text-[10px] text-gray-400">{t('License Plate', lang)}: {truckData.licenseplate}</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(({ id, icon: Icon, label }) => (
            <button key={id} onClick={() => setActiveTab(id)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${activeTab === id ? 'bg-red-50 text-red-600 font-medium' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}>
              <Icon size={16} /> <span className="truncate">{t(label, lang)}</span>
            </button>
          ))}
        </nav>
        <div className="px-3 py-4 border-t border-gray-50 dark:border-white/5">
          <button onClick={() => navigate('/')} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:bg-red-50 hover:text-red-600 transition-all">
            <LogOut size={16} /> <span className="truncate">{t('Log Out', lang)}</span>
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="bg-white dark:!bg-transparent dark:bg-gradient-to-br dark:from-[#0B1120] dark:via-[#111827] dark:to-[#450a0a] bg-fixed border-b border-gray-100 dark:border-white/10 px-6 h-[73px] flex items-center justify-between sticky top-0 z-20">
          <div>
            <p className="text-[10px] font-semibold text-gray-400 tracking-widest uppercase">{t('Driver Portal', lang)}</p>
            <h1 className="text-lg font-bold text-gray-900 mt-0.5">{t(activeTab, lang)}</h1>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setLang(l => l === 'en' ? 'he' : 'en')} className="flex items-center gap-2 px-3 h-9 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-600 transition-all text-xs font-bold tracking-wider">
              <Globe size={14} /> {lang.toUpperCase()}
            </button>
            <button onClick={() => setIsDarkMode(!isDarkMode)} className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-500 transition-all">
              {isDarkMode ? <Sun size={15} /> : <Moon size={15} />}
            </button>
          </div>
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

      {isDrawerOpen && selectedOrder && (
        <div className="fixed inset-0 bg-black/40 dark:bg-black/20 z-50 flex justify-end backdrop-blur-md">
          <div className="w-96 bg-white dark:!bg-transparent dark:bg-gradient-to-br dark:from-[#0B1120] dark:via-[#111827] dark:to-[#3b0909] border-l border-gray-100 dark:border-white/5 h-full flex flex-col shadow-[0_0_40px_rgba(0,0,0,0.1)] dark:shadow-[0_0_40px_rgba(0,0,0,0.5)]">
            <div className="flex items-center justify-between px-6 h-[73px] border-b border-gray-100 bg-gray-50">
              <h2 className="text-sm font-bold text-gray-900">{t('Update Order', lang)} #{selectedOrder.id}</h2>
              <button onClick={() => setIsDrawerOpen(false)} className="text-gray-400 hover:text-red-600 transition-colors"><X size={18} /></button>
            </div>
            <div className="flex-1 p-6 space-y-6">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <p className="text-[10px] text-blue-400 uppercase font-bold tracking-widest mb-1">{t('Order Date', lang)}</p>
                <p className="text-sm text-blue-900 font-medium">
                  {new Date(selectedOrder.orderdate).toLocaleDateString()}
                </p>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 tracking-[0.14em] uppercase mb-2">{t('Quick Actions', lang)}</label>
                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => handleUpdateStatus('IN PROGRESS')}
                    className="w-full py-3.5 bg-blue-50 text-blue-600 border border-blue-200 rounded-xl text-sm font-bold hover:bg-blue-100 transition-all flex items-center justify-center gap-2"
                  >
                    <span>🚀</span> {t('Mark as IN PROGRESS', lang)}
                  </button>
                  <button
                    onClick={() => handleUpdateStatus('DELIVERED')}
                    className="w-full py-3.5 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-xl text-sm font-bold hover:bg-emerald-100 transition-all flex items-center justify-center gap-2"
                  >
                    <span>✅</span> {t('Mark as DELIVERED', lang)}
                  </button>
                  <button
                    onClick={() => handleUpdateStatus('COMPLETED')}
                    className="w-full py-3.5 bg-gray-50 text-gray-600 border border-gray-200 rounded-xl text-sm font-bold hover:bg-gray-100 transition-all flex items-center justify-center gap-2"
                  >
                    <span>📦</span> {t('Mark as COMPLETED', lang)}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DriverDashboard;