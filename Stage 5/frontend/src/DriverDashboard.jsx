import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Truck, X, LogOut, Wrench, User } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

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
        setChartData(await chartRes.json());
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
              <p className="text-[11px] font-medium text-gray-400 tracking-[0.12em] uppercase mb-6">Daily Deliveries This Month</p>
              <div className="flex items-end gap-1 h-40">
                {chartData.map((d, i) => {
                  const max = Math.max(...chartData.map(x => x.deliveries), 1);
                  const height = (d.deliveries / max) * 100;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                      {d.deliveries > 0 && (
                        <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[9px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                          {d.deliveries}
                        </div>
                      )}
                      <div
                        className={`w-full rounded-t-sm transition-all ${d.deliveries > 0 ? 'bg-red-500 group-hover:bg-red-600' : 'bg-gray-100'}`}
                        style={{ height: `${Math.max(height, d.deliveries > 0 ? 4 : 2)}%` }}
                      />
                      {parseInt(d.name) % 5 === 0 && (
                        <span className="text-[8px] text-gray-400">{d.name}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );

      case 'Deliveries':
        return (
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
                {deliveries.length > 0 ? deliveries.map((route, i) => (
                  <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-bold text-gray-800">#{route.id}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(route.orderdate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded tracking-wide uppercase 
                        ${route.status === 'COMPLETED' || route.status === 'DELIVERED' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                          route.status === 'IN PROGRESS' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                            'bg-orange-50 text-orange-600 border border-orange-100'}`}>
                        {route.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => openUpdateDrawer(route)} className="text-[11px] text-red-600 font-bold hover:text-red-800 uppercase tracking-widest bg-red-50 px-3 py-1.5 rounded-lg hover:bg-red-100 transition-colors">
                        Update
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan="4" className="text-center py-8 text-gray-500 text-sm">No deliveries found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        );

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