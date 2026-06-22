import React, { useState } from 'react';
import {
    LayoutDashboard, Package, ShoppingCart, Truck,
    Warehouse, Users, LogOut, Tag, Building2, Box, Store
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import OverviewTab    from './tabs/OverviewTab';
import ProductsTab    from './tabs/ProductsTab';
import SuppliersTab   from './tabs/SuppliersTab';
import InventoryTab   from './tabs/InventoryTab';
import WarehousesTab  from './tabs/WarehousesTab';
import LogisticsTab   from './tabs/LogisticsTab';
import DeliveryTab    from './tabs/DeliveryTab';
import StoresTab      from './tabs/StoresTab';
import OrdersTab      from './tabs/OrdersTab';
import CustomersTab   from './tabs/CustomersTab';

const NAV = [
    { id: 'Overview',    icon: LayoutDashboard, label: 'Overview' },
    { id: 'Products',    icon: Package,          label: 'Products' },
    { id: 'Suppliers',   icon: Building2,        label: 'Suppliers' },
    { id: 'Inventory',   icon: Box,              label: 'Inventory' },
    { id: 'Warehouses',  icon: Warehouse,        label: 'Warehouses' },
    { id: 'Logistics',   icon: Truck,            label: 'Trucks & Drivers' },
    { id: 'Delivery',    icon: Truck,            label: 'Delivery Companies' },
    { id: 'Stores',      icon: Store,            label: 'Stores' },
    { id: 'Orders',      icon: ShoppingCart,     label: 'Orders' },
    { id: 'Customers',   icon: Users,            label: 'Customers' },
];

const TABS = {
    Overview:   OverviewTab,
    Products:   ProductsTab,
    Suppliers:  SuppliersTab,
    Inventory:  InventoryTab,
    Warehouses: WarehousesTab,
    Logistics:  LogisticsTab,
    Delivery:   DeliveryTab,
    Stores:     StoresTab,
    Orders:     OrdersTab,
    Customers:  CustomersTab,
};

export default function AdminDashboard() {
    const navigate  = useNavigate();
    const [tab, setTab] = useState('Overview');
    const Active = TABS[tab];

    return (
        <div className="min-h-screen bg-[#F8F9FB] flex font-sans">

            {/* Sidebar */}
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

                <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                    {NAV.map(({ id, icon: Icon, label }) => (
                        <button
                            key={id}
                            onClick={() => setTab(id)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                                tab === id ? 'bg-red-50 text-red-600 font-medium' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                            }`}
                        >
                            <Icon size={16} />
                            {label}
                        </button>
                    ))}
                </nav>

                <div className="px-3 py-4 border-t border-gray-50">
                    <button
                        onClick={() => navigate('/')}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:bg-red-50 hover:text-red-600 transition-all"
                    >
                        <LogOut size={16} /> Sign Out
                    </button>
                </div>
            </div>

            {/* Main */}
            <div className="flex-1 flex flex-col h-screen overflow-hidden">
                <header className="bg-white border-b border-gray-100 px-8 h-[73px] flex items-center">
                    <div>
                        <p className="text-[10px] font-medium text-gray-400 tracking-[0.14em] uppercase">Admin Portal</p>
                        <h1 className="text-lg font-bold text-gray-900 mt-0.5">{tab}</h1>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-8">
                    <Active />
                </main>
            </div>

        </div>
    );
}
