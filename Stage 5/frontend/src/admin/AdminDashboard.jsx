import React, { useState, useEffect } from 'react';
import {
    LayoutDashboard, Package, ShoppingCart, Truck,
    Warehouse, Users, LogOut, Tag, Building2, Box, Store, Moon, Sun, Globe
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { t } from '../translations';

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

    return (
        <div className="h-screen bg-[#F8F9FB] dark:bg-[#0B1120] flex font-sans overflow-hidden" dir={lang === 'he' ? 'rtl' : 'ltr'}>

            {/* Sidebar */}
            <div className="w-60 bg-white dark:!bg-transparent dark:bg-gradient-to-br dark:from-[#0B1120] dark:via-[#111827] dark:to-[#450a0a] bg-fixed border-r border-gray-100 dark:border-white/10 flex flex-col h-full relative z-30">
                <div className="w-full border-b border-gray-100 dark:border-white/10 h-[73px] flex items-center justify-center">
                    <div className="bg-white px-5 py-1.5 rounded-xl shadow-sm border border-gray-200 dark:border-white/10 flex items-center justify-center transition-all hover:scale-105">
                        <img src="/Rami_Levy_Hashikma_Marketing_logo.png" alt="Rami Levy" className="h-7 object-contain transition-all dark:drop-shadow-[0_0_12px_rgba(255,255,255,0.7)]" />
                    </div>
                </div>

                <div className="px-4 py-4 border-b border-gray-100 dark:border-white/5">
                    <div className="flex items-center gap-3 bg-gray-50 border border-gray-100 dark:bg-white/5 dark:border-white/5 rounded-xl px-3 py-2.5">
                        <div className="w-8 h-8 rounded-xl bg-red-100 flex items-center justify-center font-bold text-[10px] text-red-600 flex-shrink-0">AD</div>
                        <div className="min-w-0">
                            <p className="text-xs font-bold text-gray-900 dark:text-white truncate">{t('Admin Staff', lang)}</p>
                            <p className="text-[10px] text-gray-400 truncate">{t('HQ Access', lang)}</p>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
                    {NAV.map(({ id, icon: Icon, label }) => (
                        <button
                            key={id}
                            onClick={() => setTab(id)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                                tab === id ? 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 font-semibold border border-red-100 dark:border-red-500/20' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-gray-800 dark:hover:text-white'
                            }`}
                        >
                            <Icon size={15} />
                            <span className="truncate">{t(label, lang)}</span>
                        </button>
                    ))}
                </nav>

                <div className="px-3 py-4 border-t border-gray-100 dark:border-white/5">
                    <button
                        onClick={() => navigate('/')}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 transition-all"
                    >
                        <LogOut size={15} /> <span className="truncate">{t('Sign Out', lang)}</span>
                    </button>
                </div>
            </div>

            {/* Main */}
            <div className="flex-1 flex flex-col h-full overflow-hidden">
                <header className="bg-white dark:!bg-transparent dark:bg-gradient-to-br dark:from-[#0B1120] dark:via-[#111827] dark:to-[#450a0a] bg-fixed border-b border-gray-100 dark:border-white/10 px-8 h-[73px] flex items-center justify-between sticky top-0 z-20">
                    <div>
                        <p className="text-[10px] font-semibold text-gray-400 tracking-widest uppercase">{t('Admin Portal', lang)}</p>
                        <h1 className="text-lg font-bold text-gray-900 dark:text-white mt-0.5">{t(tab, lang)}</h1>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={() => setLang(l => l === 'en' ? 'he' : 'en')} className="flex items-center gap-2 px-3 h-9 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300 transition-all text-xs font-bold tracking-wider">
                            <Globe size={14} /> {lang.toUpperCase()}
                        </button>
                        <button onClick={() => setIsDarkMode(!isDarkMode)} className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 text-gray-500 dark:text-gray-300 transition-all">
                            {isDarkMode ? <Sun size={15} /> : <Moon size={15} />}
                        </button>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-8 bg-[#F8F9FB] dark:bg-[#0B1120]">
                    <Active lang={lang} />
                </main>
            </div>

        </div>
    );
}
