import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Package, ShoppingCart, Truck, Warehouse, Users, LogOut, X, Plus } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import SalesChart from './SalesChart';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const [activeTab, setActiveTab] = useState('Overview');
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [statusMessage, setStatusMessage] = useState(null);

    const [drivers, setDrivers] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [products, setProducts] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const [stores, setStores] = useState([]);

    const [formData, setFormData] = useState({});
    const [chartData, setChartData] = useState([]);

    const fetchData = async () => {
        try {
            if (activeTab === 'Overview') {
                const [resDrivers, resCustomers, resStores, resChart] = await Promise.all([
                    fetch('http://localhost:5000/api/admin/drivers'),
                    fetch('http://localhost:5000/api/admin/customers'),
                    fetch('http://localhost:5000/api/admin/stores'),
                    fetch('http://localhost:5000/api/admin/chart')
                ]);
                const driversData = await resDrivers.json();
                const customersData = await resCustomers.json();
                const storesData = await resStores.json();
                const chartDataRes = await resChart.json();

                setDrivers(driversData);
                setCustomers(customersData);
                setStores(storesData);
                setChartData(chartDataRes);
            } else if (activeTab === 'Logistics') {
                const res = await fetch('http://localhost:5000/api/admin/drivers');
                setDrivers(await res.json());
            } else if (activeTab === 'Customers') {
                const res = await fetch('http://localhost:5000/api/admin/customers');
                setCustomers(await res.json());
            } else if (activeTab === 'Products') {
                const res = await fetch('http://localhost:5000/api/admin/products');
                setProducts(await res.json());
            } else if (activeTab === 'Warehouses') {
                const res = await fetch('http://localhost:5000/api/admin/warehouses');
                setWarehouses(await res.json());
            } else if (activeTab === 'Stores') {
                const res = await fetch('http://localhost:5000/api/admin/stores');
                setStores(await res.json());
            }
        } catch (err) {
            console.error("Erreur fetch Admin:", err);
        }
    };

    useEffect(() => {
        fetchData();
        setFormData({});
    }, [activeTab]);

    const showToast = (type, text) => {
        setStatusMessage({ type, text });
        setTimeout(() => setStatusMessage(null), 3000);
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // ✅ NOUVELLE FONCTION AJOUTÉE
    const handleEdit = (item) => {
        setFormData(item);
        setIsDrawerOpen(true);
    };

    const handleDelete = async (entity, id) => {
        if (!window.confirm(`Are you sure you want to delete this ${entity}?`)) return;

        const endpoints = {
            driver: `/api/admin/drivers/${id}`,
            customer: `/api/admin/customers/${id}`,
            product: `/api/admin/products/${id}`,
            warehouse: `/api/admin/warehouses/${id}`,
            store: `/api/admin/stores/${id}`,
        };

        try {
            const res = await fetch(`http://localhost:5000${endpoints[entity]}`, { method: 'DELETE' });
            const result = await res.json();
            if (result.success) {
                showToast('success', `${entity} deleted successfully!`);
                fetchData();
            } else {
                showToast('error', result.message || 'Error deleting.');
            }
        } catch (err) {
            showToast('error', 'Server connection error.');
        }
    };

    const handleSubmit = async () => {
        let endpoint = '';
        let isEdit = false;
        let id = null;

        // Déterminer l'endpoint et si on est en mode édition
        if (activeTab === 'Products') { endpoint = '/api/admin/products'; if (formData.productid) { isEdit = true; id = formData.productid; } }
        if (activeTab === 'Stores') { endpoint = '/api/admin/stores'; if (formData.storeid) { isEdit = true; id = formData.storeid; } }
        if (activeTab === 'Warehouses') { endpoint = '/api/admin/warehouses'; if (formData.warehouseid) { isEdit = true; id = formData.warehouseid; } }
        if (activeTab === 'Logistics') { endpoint = '/api/admin/drivers'; if (formData.driverid) { isEdit = true; id = formData.driverid; } }
        if (activeTab === 'Customers') { endpoint = '/api/admin/customers'; if (formData.customerid) { isEdit = true; id = formData.customerid; } }

        try {
            // Si c'est une édition, on utilise PUT et on ajoute l'ID à l'URL
            const method = isEdit ? 'PUT' : 'POST';
            const url = isEdit ? `http://localhost:5000${endpoint}/${id}` : `http://localhost:5000${endpoint}`;

            const res = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const result = await res.json();

            if (result.success) {
                showToast('success', `Record ${isEdit ? 'updated' : 'added'} successfully!`);
                setIsDrawerOpen(false);
                setFormData({});
                fetchData();
            } else {
                showToast('error', result.message || 'Error saving record.');
            }
        } catch (err) {
            showToast('error', 'Server connection error.');
        }
    };

    const navItems = [
        { id: 'Overview', icon: LayoutDashboard, label: 'Overview' },
        { id: 'Products', icon: Package, label: 'Products' },
        { id: 'Warehouses', icon: Warehouse, label: 'Warehouses' },
        { id: 'Logistics', icon: Truck, label: 'Trucks & Drivers' },
        { id: 'Stores', icon: () => <div className="font-extrabold border-[1.5px] border-current rounded px-1 text-[9px] tracking-widest flex items-center justify-center">RL</div>, label: 'Stores' },
        { id: 'Customers', icon: Users, label: 'Customers' },
    ];

    const renderTableContent = () => {
        switch (activeTab) {
            case 'Logistics':
                return (
                    <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                        <table className="w-full">
                            <thead className="bg-gray-50/50">
                                <tr className="border-b border-gray-50">
                                    {['Driver ID', 'License Plate', 'Capacity', 'Maintenance', 'Status', ''].map(h => (
                                        <th key={h} className="text-left px-6 py-4 text-[10px] font-medium text-gray-400 tracking-[0.1em] uppercase">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {drivers.map((driver, i) => (
                                    <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4 text-sm font-bold text-gray-900">#{driver.driverid}</td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{driver.licenseplate}</td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{driver.capacity} Tons</td>
                                        <td className="px-6 py-4">
                                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded tracking-wide uppercase ${driver.maintenancestatus === 'OK' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                                                {driver.maintenancestatus}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded tracking-wide uppercase ${driver.active === 1 ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                                                {driver.active === 1 ? 'Active' : 'Offline'}
                                            </span>
                                        </td>
                                        {/* ✅ CORRECTION ICI : driver */}
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleEdit(driver)}
                                                    className="text-[11px] text-blue-600 font-bold hover:text-blue-800 uppercase tracking-widest bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDelete('driver', driver.driverid)}
                                                    className="text-[11px] text-red-600 font-bold hover:text-red-800 uppercase tracking-widest bg-red-50 px-3 py-1.5 rounded-lg hover:bg-red-100 transition-colors"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {drivers.length === 0 && <tr><td colSpan="6" className="text-center py-8 text-gray-500 text-sm">Loading drivers...</td></tr>}
                            </tbody>
                        </table>
                    </div>
                );

            case 'Customers':
                return (
                    <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                        <table className="w-full">
                            <thead className="bg-gray-50/50">
                                <tr className="border-b border-gray-50">
                                    {['ID', 'Name', 'Email', 'City', 'Tier', ''].map(h => (
                                        <th key={h} className="text-left px-6 py-4 text-[10px] font-medium text-gray-400 tracking-[0.1em] uppercase">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {customers.map((cust, i) => (
                                    <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4 text-sm font-bold text-gray-900">#{cust.customerid}</td>
                                        <td className="px-6 py-4 text-sm text-gray-800 font-medium">{cust.customername}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500">{cust.email}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500">{cust.city}</td>
                                        <td className="px-6 py-4 text-sm font-semibold text-amber-600">{cust.loyaltytier || 'Standard'}</td>
                                        {/* ✅ CORRECTION ICI : cust */}
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleEdit(cust)}
                                                    className="text-[11px] text-blue-600 font-bold hover:text-blue-800 uppercase tracking-widest bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDelete('customer', cust.customerid)}
                                                    className="text-[11px] text-red-600 font-bold hover:text-red-800 uppercase tracking-widest bg-red-50 px-3 py-1.5 rounded-lg hover:bg-red-100 transition-colors"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {customers.length === 0 && <tr><td colSpan="6" className="text-center py-8 text-gray-500 text-sm">Loading customers...</td></tr>}
                            </tbody>
                        </table>
                    </div>
                );

            case 'Products':
                return (
                    <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                        <table className="w-full">
                            <thead className="bg-gray-50/50">
                                <tr className="border-b border-gray-50">
                                    {['ID', 'Product Name', 'Category', 'Price', 'Kashrut', ''].map(h => (
                                        <th key={h} className="text-left px-6 py-4 text-[10px] font-medium text-gray-400 tracking-[0.1em] uppercase">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {products.map((item, i) => (
                                    <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4 text-sm font-bold text-gray-900">#{item.productid}</td>
                                        <td className="px-6 py-4 text-sm font-medium text-gray-800">{item.productname}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            <span className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-md text-[11px] font-medium">
                                                {item.categoryname || 'Uncategorized'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-bold text-emerald-600">₪ {parseFloat(item.price).toFixed(2)}</td>
                                        <td className="px-6 py-4">
                                            {item.kashrut_list ? (
                                                <div className="flex flex-wrap gap-1">
                                                    {item.kashrut_list.split(',').map((k, idx) => (
                                                        <span key={idx} className="px-2 py-0.5 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded text-[9px] font-bold uppercase tracking-wider">
                                                            {k.trim()}
                                                        </span>
                                                    ))}
                                                </div>
                                            ) : (
                                                <span className="text-gray-400 italic text-[11px]">None</span>
                                            )}
                                        </td>
                                        {/* ✅ CORRECTION ICI : item */}
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleEdit(item)}
                                                    className="text-[11px] text-blue-600 font-bold hover:text-blue-800 uppercase tracking-widest bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDelete('product', item.productid)}
                                                    className="text-[11px] text-red-600 font-bold hover:text-red-800 uppercase tracking-widest bg-red-50 px-3 py-1.5 rounded-lg hover:bg-red-100 transition-colors"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {products.length === 0 && <tr><td colSpan="6" className="text-center py-8 text-gray-500 text-sm">Loading products...</td></tr>}
                            </tbody>
                        </table>
                    </div>
                );

            case 'Warehouses':
                return (
                    <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                        <table className="w-full">
                            <thead className="bg-gray-50/50">
                                <tr className="border-b border-gray-50">
                                    {['Warehouse ID', 'Region', 'Address', 'Status', ''].map(h => (
                                        <th key={h} className="text-left px-6 py-4 text-[10px] font-medium text-gray-400 tracking-[0.1em] uppercase">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {warehouses.map((wh, i) => (
                                    <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4 text-sm font-bold text-gray-900">#{wh.warehouseid}</td>
                                        <td className="px-6 py-4 text-sm font-medium text-gray-800">{wh.region || 'N/A'}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500">{wh.address || 'N/A'}</td>
                                        <td className="px-6 py-4">
                                            <span className="text-[10px] font-bold px-2.5 py-1 rounded tracking-wide uppercase bg-emerald-50 text-emerald-600 border border-emerald-100">OPERATIONAL</span>
                                        </td>
                                        {/* ✅ CORRECTION ICI : wh */}
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleEdit(wh)}
                                                    className="text-[11px] text-blue-600 font-bold hover:text-blue-800 uppercase tracking-widest bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDelete('warehouse', wh.warehouseid)}
                                                    className="text-[11px] text-red-600 font-bold hover:text-red-800 uppercase tracking-widest bg-red-50 px-3 py-1.5 rounded-lg hover:bg-red-100 transition-colors"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {warehouses.length === 0 && <tr><td colSpan="5" className="text-center py-8 text-gray-500 text-sm">Loading warehouses...</td></tr>}
                            </tbody>
                        </table>
                    </div>
                );

            case 'Stores':
                return (
                    <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                        <table className="w-full">
                            <thead className="bg-gray-50/50">
                                <tr className="border-b border-gray-50">
                                    {['Store ID', 'Store Name', 'Email', 'Phone', 'Rating', ''].map(h => (
                                        <th key={h} className="text-left px-6 py-4 text-[10px] font-medium text-gray-400 tracking-[0.1em] uppercase">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {stores.map((st, i) => (
                                    <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4 text-sm font-bold text-gray-900">#{st.storeid}</td>
                                        <td className="px-6 py-4 text-sm font-medium text-gray-800">{st.storename}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500">{st.email || 'N/A'}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500">{st.phone || 'N/A'}</td>
                                        <td className="px-6 py-4 text-sm font-semibold text-amber-500 flex items-center gap-1">★ {st.rating || 'N/A'}</td>
                                        {/* ✅ CORRECTION ICI : st */}
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleEdit(st)}
                                                    className="text-[11px] text-blue-600 font-bold hover:text-blue-800 uppercase tracking-widest bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDelete('store', st.storeid)}
                                                    className="text-[11px] text-red-600 font-bold hover:text-red-800 uppercase tracking-widest bg-red-50 px-3 py-1.5 rounded-lg hover:bg-red-100 transition-colors"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {stores.length === 0 && <tr><td colSpan="6" className="text-center py-8 text-gray-500 text-sm">Loading stores...</td></tr>}
                            </tbody>
                        </table>
                    </div>
                );

            default:
                return null;
        }
    };

    const renderFormFields = () => {
        const inputClass = "w-full mt-1.5 p-3 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-red-500 transition-all shadow-sm font-medium";
        const labelClass = "block text-[10px] font-bold text-gray-400 tracking-[0.1em] uppercase mb-4";

        switch (activeTab) {
            case 'Products':
                return (
                    <div className="space-y-5">
                        <div>
                            <label className={labelClass}>Product Name</label>
                            <input type="text" name="productname" value={formData.productname || ''} onChange={handleChange} className={inputClass} placeholder="Ex: Bamba 80g" />
                        </div>
                        <div>
                            <label className={labelClass}>Price (₪)</label>
                            <input type="number" step="0.01" name="price" value={formData.price || ''} onChange={handleChange} className={inputClass} placeholder="Ex: 4.90" />
                        </div>
                        <div>
                            <label className={labelClass}>Date of Manufacture</label>
                            <input type="date" name="dateofmanufacture" value={formData.dateofmanufacture || ''} onChange={handleChange} className={inputClass} />
                        </div>
                        <div>
                            <label className={labelClass}>Expiration Date</label>
                            <input type="date" name="expirationdate" value={formData.expirationdate || ''} onChange={handleChange} className={inputClass} />
                        </div>
                        <div>
                            <label className={labelClass}>Category ID</label>
                            <input type="number" name="categoryid" value={formData.categoryid || ''} onChange={handleChange} className={inputClass} placeholder="Ex: 3" />
                        </div>
                        <div>
                            <label className={labelClass}>Supplier ID</label>
                            <input type="number" name="supplierid" value={formData.supplierid || ''} onChange={handleChange} className={inputClass} placeholder="Ex: 7" />
                        </div>
                        <div>
                            <label className={labelClass}>Kashrut</label>
                            <input type="text" name="kashrut" value={formData.kashrut || ''} onChange={handleChange} className={inputClass} placeholder="Ex: Lameadrin, Jerusalem Rabbinate" />
                            <p className="text-[10px] text-gray-400 mt-1">Separate multiple items with a comma (,)</p>
                        </div>
                    </div>
                );
            case 'Stores':
                return (
                    <div className="space-y-5">
                        <div><label className={labelClass}>Store Name</label><input type="text" name="storename" value={formData.storename || ''} onChange={handleChange} className={inputClass} /></div>
                        <div><label className={labelClass}>Email</label><input type="email" name="email" value={formData.email || ''} onChange={handleChange} className={inputClass} /></div>
                        <div><label className={labelClass}>Phone</label><input type="text" name="phone" value={formData.phone || ''} onChange={handleChange} className={inputClass} /></div>
                        <div><label className={labelClass}>Password</label><input type="password" name="password" onChange={handleChange} className={inputClass} placeholder="Leave blank to keep current" /></div>
                    </div>
                );
            case 'Warehouses':
                return (
                    <div className="space-y-5">
                        <div>
                            <label className={labelClass}>Region</label>
                            <input type="text" name="region" value={formData.region || ''} onChange={handleChange} className={inputClass} placeholder="Ex: Jerusalem" />
                        </div>
                        <div>
                            <label className={labelClass}>Address</label>
                            <input type="text" name="address" value={formData.address || ''} onChange={handleChange} className={inputClass} placeholder="Ex: Givat Shaul St 12" />
                        </div>
                    </div>
                );
            case 'Logistics':
                return (
                    <div className="space-y-5">
                        <div><label className={labelClass}>License Plate</label><input type="text" name="licenseplate" value={formData.licenseplate || ''} onChange={handleChange} className={inputClass} placeholder="Ex: 12-345-67" /></div>
                        <div><label className={labelClass}>Capacity (Tons)</label><input type="number" step="0.1" name="capacity" value={formData.capacity || ''} onChange={handleChange} className={inputClass} placeholder="Ex: 5.5" /></div>
                        <div><label className={labelClass}>Driver Email</label><input type="email" name="email" value={formData.email || ''} onChange={handleChange} className={inputClass} /></div>
                        <div><label className={labelClass}>Password</label><input type="password" name="password" onChange={handleChange} className={inputClass} placeholder="Leave blank to keep current" /></div>
                    </div>
                );
            case 'Customers':
                return (
                    <div className="space-y-5">
                        <div><label className={labelClass}>Customer Name</label><input type="text" name="customername" value={formData.customername || ''} onChange={handleChange} className={inputClass} /></div>
                        <div><label className={labelClass}>Email</label><input type="email" name="email" value={formData.email || ''} onChange={handleChange} className={inputClass} /></div>
                        <div><label className={labelClass}>Phone</label><input type="text" name="phone" value={formData.phone || ''} onChange={handleChange} className={inputClass} /></div>
                        <div><label className={labelClass}>City</label><input type="text" name="city" value={formData.city || ''} onChange={handleChange} className={inputClass} /></div>
                        <div><label className={labelClass}>Password</label><input type="password" name="password" onChange={handleChange} className={inputClass} placeholder="Leave blank to keep current" /></div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-[#F8F9FB] flex font-sans">
            <div className="w-60 bg-white border-r border-gray-100 flex flex-col">
                <div className="px-6 py-5 border-b border-gray-100 h-[73px] flex items-center">
                    <img src="/Rami_Levy_Hashikma_Marketing_logo.png" alt="Rami Levy" className="h-10 object-contain" />
                </div>
                <div className="px-4 py-4 border-b border-gray-50">
                    <div className="flex items-center gap-3 bg-gray-50 rounded-lg px-3 py-2.5">
                        <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center font-bold text-[10px] text-red-600">AD</div>
                        <div>
                            <p className="text-xs font-bold text-gray-900">Admin Staff</p>
                            <p className="text-[10px] text-gray-400">HQ Access</p>
                        </div>
                    </div>
                </div>
                <nav className="flex-1 px-3 py-4 space-y-1">
                    {navItems.map(({ id, icon: Icon, label }) => (
                        <button key={id} onClick={() => setActiveTab(id)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${activeTab === id ? 'bg-red-50 text-red-600 font-medium' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}>
                            {typeof Icon === 'function' ? <Icon /> : <Icon size={16} />}
                            {label}
                        </button>
                    ))}
                </nav>
                <div className="px-3 py-4 border-t border-gray-50">
                    <button onClick={() => navigate('/')} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:bg-red-50 hover:text-red-600 transition-all">
                        <LogOut size={16} /> Sign Out
                    </button>
                </div>
            </div>

            <div className="flex-1 flex flex-col h-screen overflow-hidden">
                <header className="bg-white border-b border-gray-100 px-8 h-[73px] flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-medium text-gray-400 tracking-[0.14em] uppercase">Admin Portal</p>
                        <h1 className="text-lg font-bold text-gray-900 mt-0.5">{activeTab}</h1>
                    </div>
                    {activeTab !== 'Overview' && (
                        <button onClick={() => { setFormData({}); setIsDrawerOpen(true); }} className="flex items-center gap-2 bg-[#0B1120] text-white px-4 py-2 rounded-lg text-[11px] font-bold tracking-[0.12em] hover:bg-red-600 transition-all uppercase shadow-sm">
                            <Plus size={14} /> Add {activeTab === 'Logistics' ? 'Driver' : activeTab.slice(0, -1)}
                        </button>
                    )}
                </header>

                <main className="flex-1 p-8 overflow-y-auto relative">
                    {statusMessage && (
                        <div className={`absolute top-6 right-8 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl shadow-xl text-sm font-medium animate-[slideIn_0.3s_ease-out] ${statusMessage.type === 'success' ? 'bg-white border border-emerald-100 text-gray-800' : 'bg-white border border-red-100 text-gray-800'}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${statusMessage.type === 'success' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                                {statusMessage.type === 'success' ? '✓' : '✕'}
                            </div>
                            <span>{statusMessage.text}</span>
                        </div>
                    )}

                    {activeTab === 'Overview' && (
                        <>
                            <div className="grid grid-cols-4 gap-6 mb-8">
                                {[
                                    { label: 'Total Stores', value: stores.length },
                                    { label: 'Active Drivers', value: drivers.length },
                                    { label: 'Total Customers', value: customers.length },
                                    { label: 'System Status', value: 'Online' }
                                ].map((stat) => (
                                    <div key={stat.label} className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
                                        <p className="text-[11px] font-medium text-gray-400 tracking-[0.12em] uppercase mb-2">{stat.label}</p>
                                        <p className={`text-3xl font-bold ${stat.label === 'System Status' ? 'text-emerald-500' : 'text-gray-900'}`}>{stat.value}</p>
                                    </div>
                                ))}
                            </div>

                            {chartData && chartData.length > 0 ? (
                                <div className="bg-white border border-gray-100 rounded-xl p-8 shadow-sm">
                                    <h3 className="text-sm font-bold text-gray-900 mb-6">Global Monthly Sales Overview</h3>
                                    <div style={{ width: '100%', height: 256 }}>
                                        <SalesChart key={chartData.length} data={chartData} />
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-white border border-gray-100 rounded-xl p-8 shadow-sm text-center text-gray-400 text-sm">
                                    Loading chart data...
                                </div>
                            )}
                        </>
                    )}
                    {renderTableContent()}
                </main>
            </div>

            {isDrawerOpen && (
                <div className="fixed inset-0 bg-black/40 z-50 flex justify-end">
                    <div className="w-[450px] bg-white h-full flex flex-col shadow-2xl animate-[slideLeft_0.3s_ease-out]">
                        <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100 bg-gray-50/80">
                            <div>
                                <h2 className="text-base font-bold text-gray-900">
                                    {formData.productid || formData.storeid || formData.customerid || formData.warehouseid || formData.driverid ? 'Edit' : 'Add New'} {activeTab === 'Logistics' ? 'Driver' : activeTab.slice(0, -1)}
                                </h2>
                                <p className="text-xs text-gray-500 mt-1">Fill out the details below.</p>
                            </div>
                            <button onClick={() => setIsDrawerOpen(false)} className="text-gray-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-full transition-all"><X size={18} /></button>
                        </div>
                        <div className="flex-1 p-8 overflow-y-auto bg-gray-50/30">
                            {renderFormFields()}
                        </div>
                        <div className="p-6 border-t border-gray-100 bg-white">
                            <button onClick={handleSubmit} className="w-full py-4 bg-red-600 text-white rounded-xl text-[12px] font-bold tracking-[0.15em] uppercase hover:bg-red-700 hover:shadow-lg transition-all active:scale-[0.98]">
                                Save {activeTab === 'Logistics' ? 'Driver' : activeTab.slice(0, -1)}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;