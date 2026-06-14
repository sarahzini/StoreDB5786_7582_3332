import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Truck, X, LogOut, Wrench, User } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import SalesChart from './SalesChart';

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

  const handleUpdateStatus = async () => {
    if (!selectedOrder) return;
    try {
      const res = await fetch('http://localhost:5000/api/orders/update-status', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderid: selectedOrder.id, status: newStatus })
      });
      const result = await res.json();
      if (result.success) {
        setDeliveries(deliveries.map(d => d.id === selectedOrder.id ? { ...d, status: newStatus } : d));
        showToast('success', `Order #${selectedOrder.id} updated to ${newStatus}`);
        setIsDrawerOpen(false);
      } else {
        showToast('error', 'Failed to update status.');
      }
    } catch (err) {
      showToast('error', 'Server error.');
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
        showToast('success', 'Account updated successfully!');
      } else {
        showToast('error', result.message || 'Update failed.');
      }
    } catch (err) {
      showToast('error', 'Server error.');
    }
  };

  const renderContent = () => {
    switch (activeTab) {

      case 'Overview':
        return (
          <div className="space-y-6">
            <div className="bg-white border border-gray-100 rounded-xl p-8 shadow-sm flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Good morning, Driver #{truckData.driverid}</h2>
                <p className="text-sm text-gray-500 mt-1">Drive safely! Here is your summary.</p>
              </div>
              <div className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider ${truckData.maintenancestatus === 'OK' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                Truck: {truckData.maintenancestatus}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-6">
              <div className="bg-white border border-gray-100 p-6 rounded-xl shadow-sm">
                <p className="text-[11px] font-medium text-gray-400 tracking-[0.12em] uppercase mb-2">Total Routes</p>
                <p className="text-3xl font-bold text-gray-900">{deliveries.length}</p>
              </div>
              <div className="bg-white border border-gray-100 p-6 rounded-xl shadow-sm">
                <p className="text-[11px] font-medium text-gray-400 tracking-[0.12em] uppercase mb-2">Pending</p>
                <p className="text-3xl font-bold text-blue-600">
                  {deliveries.filter(d => d.status !== 'COMPLETED' && d.status !== 'DELIVERED').length}
                </p>
              </div>
              <div className="bg-white border border-gray-100 p-6 rounded-xl shadow-sm">
                <p className="text-[11px] font-medium text-gray-400 tracking-[0.12em] uppercase mb-2">Completed</p>
                <p className="text-3xl font-bold text-emerald-600">
                  {deliveries.filter(d => d.status === 'COMPLETED' || d.status === 'DELIVERED').length}
                </p>
              </div>
            </div>

            <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
              <p className="text-[11px] font-medium text-gray-400 tracking-[0.12em] uppercase mb-4">Daily Deliveries This Month</p>
              <div className="w-full">
                <SalesChart data={chartData} label="Deliveries" prefix="" />
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
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    deliveryFilter === f
                      ? 'bg-red-600 text-white border-red-600'
                      : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {f}{f !== 'All' && ` (${deliveries.filter(d => d.status?.toUpperCase() === f).length})`}
                </button>
              ))}
              <span className="text-xs text-gray-400 ml-auto">{filteredDeliveries.length} order{filteredDeliveries.length !== 1 ? 's' : ''}</span>
            </div>

            <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full">
                <thead className="bg-gray-50/50">
                  <tr className="border-b border-gray-50">
                    {['Order ID', 'Date', 'Status', ''].map(h => (
                      <th key={h} className="text-left px-6 py-4 text-[10px] font-medium text-gray-400 tracking-[0.1em] uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredDeliveries.length > 0 ? filteredDeliveries.map((route, i) => (
                    <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 text-sm font-bold text-gray-800">#{route.id}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{new Date(route.orderdate).toLocaleDateString()}</td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded tracking-wide uppercase
                          ${route.status === 'COMPLETED' || route.status === 'DELIVERED' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                            route.status === 'IN PROGRESS' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                            'bg-orange-50 text-orange-600 border border-orange-100'}`}>
                          {route.status}
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
                              } catch { showToast('error', 'Could not load details.'); }
                              finally { setLoadingDetail(false); }
                            }}
                            className="text-[11px] text-gray-600 font-bold bg-gray-50 hover:bg-gray-100 border border-gray-200 px-3 py-1.5 rounded-lg transition-colors"
                          >
                            {loadingDetail ? '...' : 'View →'}
                          </button>
                          <button onClick={() => openUpdateDrawer(route)} className="text-[11px] text-red-600 font-bold hover:text-red-800 uppercase tracking-widest bg-red-50 px-3 py-1.5 rounded-lg hover:bg-red-100 transition-colors">
                            Update
                          </button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan="4" className="text-center py-8 text-gray-500 text-sm">
                      {deliveryFilter === 'All' ? 'No deliveries found.' : `No ${deliveryFilter} deliveries.`}
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Delivery Detail Modal */}
            {deliveryDetail && (
              <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
                <div className="bg-white rounded-2xl shadow-2xl p-8 w-[520px] max-h-[80vh] overflow-y-auto">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold mb-0.5">Delivery Details</p>
                      <h2 className="text-lg font-bold text-gray-900">Order #{deliveryDetail.order?.orderid}</h2>
                    </div>
                    <button onClick={() => setDeliveryDetail(null)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-500">
                      <X size={14} />
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-3 mb-6">
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1 font-semibold">Date</p>
                      <p className="text-sm font-semibold text-gray-800">{new Date(deliveryDetail.order?.orderdate).toLocaleDateString()}</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1 font-semibold">Status</p>
                      <span className="px-2 py-0.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-100 text-[10px] font-semibold">{deliveryDetail.order?.status}</span>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1 font-semibold">Total</p>
                      {deliveryDetail.order?.price && parseFloat(deliveryDetail.order.price) > 0
                        ? <p className="text-sm font-bold text-emerald-600">₪{deliveryDetail.order.price}</p>
                        : <p className="text-xs text-gray-400 italic">Pending</p>}
                    </div>
                  </div>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-3">Products in This Delivery</p>
                  {deliveryDetail.items?.length > 0 ? (
                    <div className="space-y-2">
                      {deliveryDetail.items.map((item, i) => (
                        <div key={i} className="flex items-center justify-between p-3.5 bg-gray-50 rounded-xl border border-gray-100">
                          <div>
                            <p className="text-sm font-semibold text-gray-800">{item.productname}</p>
                            <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mt-0.5">Unit: ₪{item.unitprice}</p>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-sm text-gray-500">Qty: <strong className="text-gray-800">{item.quantity}</strong></span>
                            <p className="font-bold text-emerald-600">₪{item.subtotal}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : <p className="text-sm text-gray-400 text-center py-6">No product details available.</p>}
                  <button onClick={() => setDeliveryDetail(null)}
                    className="w-full mt-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl text-sm font-semibold transition-all">Close</button>
                </div>
              </div>
            )}
          </div>
        );
      }

      case 'Truck Info':
        return (
          <div className="bg-white border border-gray-100 rounded-xl p-8 max-w-2xl shadow-sm">
            <h2 className="text-lg font-bold mb-6 text-gray-900">Truck Information</h2>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="text-[10px] text-gray-400 uppercase tracking-wide">Driver ID (Read Only)</label>
                <input className="w-full mt-1 p-2.5 bg-gray-100 border border-gray-200 rounded-lg text-gray-400 cursor-not-allowed text-sm" value={truckData.driverid} disabled />
              </div>
              <div>
                <label className="text-[10px] text-gray-400 uppercase tracking-wide">License Plate</label>
                <input className="w-full mt-1 p-2.5 bg-gray-100 border border-gray-200 rounded-lg text-gray-500 font-medium cursor-not-allowed text-sm" value={truckData.licenseplate} disabled />
              </div>
              <div>
                <label className="text-[10px] text-gray-400 uppercase tracking-wide">Capacity</label>
                <input className="w-full mt-1 p-2.5 bg-gray-100 border border-gray-200 rounded-lg text-gray-500 font-medium cursor-not-allowed text-sm" value={`${truckData.capacity} Tons`} disabled />
              </div>
              <div>
                <label className="text-[10px] text-gray-400 uppercase tracking-wide">Active Status</label>
                <input className="w-full mt-1 p-2.5 bg-gray-100 border border-gray-200 rounded-lg text-gray-500 font-medium cursor-not-allowed text-sm" value={truckData.active === 1 ? 'Active' : 'Inactive'} disabled />
              </div>
              <div className="col-span-2">
                <label className="text-[10px] text-gray-400 uppercase tracking-wide">Maintenance Status</label>
                <input className={`w-full mt-1 p-2.5 border rounded-lg font-bold cursor-not-allowed text-sm
                  ${truckData.maintenancestatus === 'OK' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-red-50 text-red-600 border-red-200'}`}
                  value={truckData.maintenancestatus} disabled />
              </div>
            </div>
          </div>
        );

      case 'Account':
        return (
          <div className="bg-white border border-gray-100 rounded-xl p-8 max-w-2xl shadow-sm">
            <h2 className="text-lg font-bold mb-6 text-gray-900">Account Information</h2>
            <div className="grid grid-cols-2 gap-6">
              <div className="col-span-2">
                <label className="text-[10px] text-gray-400 uppercase">Driver ID (Read Only)</label>
                <input className="w-full mt-1 p-2.5 bg-gray-100 border border-gray-200 rounded-lg text-gray-400 cursor-not-allowed text-sm" value={truckData.driverid} disabled />
              </div>
              <div>
                <label className="text-[10px] text-gray-400 uppercase">Email</label>
                <input className="w-full mt-1 p-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-red-500 text-sm"
                  value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
              </div>
              <div>
                <label className="text-[10px] text-gray-400 uppercase">New Password</label>
                <input type="password" placeholder="••••••••" className="w-full mt-1 p-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-red-500 text-sm"
                  value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
              </div>
            </div>
            <div className="flex justify-center mt-8">
              <button onClick={handleAccountSave} className="px-10 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all uppercase text-sm font-medium">
                Save Changes
              </button>
            </div>
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
            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center font-bold text-[10px] text-red-600">DR</div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-gray-900 truncate">Driver #{truckData.driverid}</p>
              <p className="text-[10px] text-gray-400">Plate: {truckData.licenseplate}</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(({ id, icon: Icon, label }) => (
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

      {isDrawerOpen && selectedOrder && (
        <div className="fixed inset-0 bg-black/40 z-50 flex justify-end">
          <div className="w-96 bg-white h-full flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-gray-50">
              <h2 className="text-sm font-bold text-gray-900">Update Order #{selectedOrder.id}</h2>
              <button onClick={() => setIsDrawerOpen(false)} className="text-gray-400 hover:text-red-600 transition-colors"><X size={18} /></button>
            </div>
            <div className="flex-1 p-6 space-y-6">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <p className="text-[10px] text-blue-400 uppercase font-bold tracking-widest mb-1">Order Date</p>
                <p className="text-sm text-blue-900 font-medium">
                  {new Date(selectedOrder.orderdate).toLocaleDateString()}
                </p>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 tracking-[0.14em] uppercase mb-2">Set New Status</label>
                <select
                  className="w-full p-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 outline-none focus:border-red-500 transition-all font-medium"
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                >
                  <option value="PENDING">Pending</option>
                  <option value="IN PROGRESS">In Progress</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="DELIVERED">Delivered</option>
                </select>
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 bg-gray-50">
              <button onClick={handleUpdateStatus} className="w-full py-3.5 bg-red-600 text-white rounded-lg text-[11px] font-bold tracking-[0.15em] uppercase hover:bg-red-700 transition-all">
                Confirm Update
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DriverDashboard;