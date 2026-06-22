import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Truck, Store, User, ShieldCheck, AlertCircle, X, CheckCircle, Globe, Moon, Sun } from 'lucide-react';
import { t } from './translations';

const LoginPage = () => {
    const [lang, setLang] = useState(() => localStorage.getItem('lang') || 'en');
    useEffect(() => { localStorage.setItem('lang', lang); }, [lang]);

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

    const [selectedRole, setSelectedRole] = useState('Customer');
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    // Nouvel état pour gérer le message d'erreur
    const [errorMessage, setErrorMessage] = useState('');
    const [showForgotModal, setShowForgotModal] = useState(false);
    const [forgotEmail, setForgotEmail] = useState('');
    const [forgotMessage, setForgotMessage] = useState(null);
    const [forgotLoading, setForgotLoading] = useState(false);

    const roles = [
        { id: 'Customer', icon: User, label: 'CUSTOMER' },
        { id: 'Store', icon: Store, label: 'STORE' },
        { id: 'Driver', icon: Truck, label: 'DRIVER' },
        { id: 'Admin', icon: ShieldCheck, label: 'ADMIN' },
    ];

    const handleSignIn = async () => {
        // On réinitialise l'erreur à chaque nouvelle tentative
        setErrorMessage('');

        try {
            const response = await fetch('http://localhost:5000/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, role: selectedRole })
            });

            const data = await response.json();
            console.log("Données reçues du backend :", data);

            if (data.success) {
                const routes = {
                    'Customer': '/customer',
                    'Store': '/store',
                    'Driver': '/driver',
                    'Admin': '/admin'
                };
                navigate(routes[selectedRole], { state: { user: data.user } });
            } else {
                setErrorMessage(t('Invalid email or password. Please try again.', lang));
            }
        } catch (error) {
            console.error("Erreur réseau:", error);
            setErrorMessage(t('Connection error. Please try again later.', lang));
        }
    };

    const handleForgotPassword = async () => {
        if (!forgotEmail.trim()) {
            setForgotMessage({ type: 'error', text: t('Please enter your email address.', lang) });
            return;
        }
        setForgotLoading(true);
        setForgotMessage(null);
        try {
            const response = await fetch('http://localhost:5000/api/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: forgotEmail, role: selectedRole })
            });
            const data = await response.json();
            if (data.success) {
                setForgotMessage({ type: 'success', text: t(data.message, lang) });
            } else {
                setForgotMessage({ type: 'error', text: t(data.message, lang) });
            }
        } catch (err) {
            setForgotMessage({ type: 'error', text: t('Connection error. Please try again.', lang) });
        }
        setForgotLoading(false);
    };

    return (
        <div className="flex h-screen w-full font-sans overflow-hidden bg-gradient-to-br from-[#0B1120] via-[#111827] to-[#450a0a] relative items-center justify-center p-6" dir={lang === 'he' ? 'rtl' : 'ltr'}>

            {/* Ambient Glows for the whole screen */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] bg-red-600/20 blur-[120px] rounded-full mix-blend-screen" />
                <div className="absolute bottom-[10%] right-[10%] w-[50%] h-[50%] bg-red-800/20 blur-[120px] rounded-full mix-blend-screen" />
            </div>

            {/* Central Glass Card */}
            <div className="relative z-10 w-full max-w-[1000px] h-[90%] max-h-[680px] flex rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] bg-[#000000]/40 backdrop-blur-2xl border border-white/10 animate-fade-in" style={{ animationDuration: '0.8s' }}>

                {/* LEFT (or Right in RTL) — Branding */}
                <div className="hidden md:flex w-1/2 p-12 flex-col justify-between text-white relative">
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-14">
                            <div className="bg-red-600 p-2 rounded-md">
                                <ShieldCheck size={18} className="text-white" />
                            </div>
                            <span className="text-xs font-semibold tracking-[0.2em] text-white/60 uppercase">{t('Rami Levy Group', lang)}</span>
                        </div>

                        <h1 className="text-4xl font-black tracking-tight uppercase leading-[1.1] mb-6">
                            {t('Integrated', lang)}<br />
                            <span className="text-red-500">{t('Core', lang)}</span>
                        </h1>

                        <div className="w-12 h-1 bg-red-600 mb-8 rounded-full shadow-[0_0_15px_rgba(220,38,38,0.5)]" />

                        <p className="text-white/50 text-sm font-medium leading-relaxed max-w-[280px]">
                            {t('Logistics & retail intelligence engine. Unified supply chain, analytics, and loyalty management.', lang)}
                        </p>
                    </div>

                    <div className="flex gap-8 border-t border-white/10 pt-8 relative z-10">
                        {[['320+', 'Stores'], ['4.2M', 'Members'], ['99.9%', 'Uptime']].map(([num, label]) => (
                            <div key={label}>
                                <p className="text-2xl font-bold text-white">{num}</p>
                                <p className="text-[10px] font-semibold tracking-[0.15em] text-white/40 mt-1 uppercase">{t(label, lang)}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* RIGHT (or Left in RTL) — Form */}
                <div className={`flex-1 flex flex-col items-center justify-center px-8 sm:px-12 relative overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] ${isDarkMode ? 'bg-transparent' : 'bg-white'}`}>

                    {/* Toggles (Lang & Dark Mode) */}
                    <div className="absolute top-6 right-6 z-20 flex gap-3">
                        <button onClick={() => setIsDarkMode(!isDarkMode)} className="flex items-center justify-center w-9 h-9 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-all shadow-sm">
                            {isDarkMode ? <Sun size={15} /> : <Moon size={15} />}
                        </button>
                        <button onClick={() => setLang(l => l === 'en' ? 'he' : 'en')} className="flex items-center gap-2 px-3 h-9 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-all text-xs font-bold tracking-wider shadow-sm">
                            <Globe size={14} /> {lang.toUpperCase()}
                        </button>
                    </div>

                    <div className="w-full max-w-[320px] flex flex-col items-center animate-fade-in py-4" style={{ animationDuration: '0.8s' }}>

                        <div className="bg-white px-5 py-2.5 rounded-2xl shadow-sm border border-gray-100 dark:border-white/10 mb-4 flex items-center justify-center">
                            <img src="/Rami_Levy_Hashikma_Marketing_logo.png" alt="Rami Levy" className="h-10 object-contain transition-all dark:drop-shadow-[0_0_12px_rgba(255,255,255,0.7)]" />
                        </div>

                        <div className="w-full h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-800 to-transparent mb-4" />

                        <div className="flex items-center gap-2 mb-3 self-start">
                            <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
                            <span className="text-[11px] font-bold tracking-[0.15em] text-gray-500 uppercase">{t('Secure Authentication', lang)}</span>
                        </div>

                        {/* Role grid */}
                        <div className="grid grid-cols-2 gap-2 mb-5 w-full">
                            {roles.map((role) => {
                                const Icon = role.icon;
                                const isSelected = selectedRole === role.id;
                                return (
                                    <button
                                        key={role.id}
                                        onClick={() => setSelectedRole(role.id)}
                                        className={`flex flex-col items-center justify-center py-3 rounded-xl border transition-all duration-200 ${isSelected
                                            ? 'border-red-500 bg-white text-red-600 shadow-md shadow-red-500/10 scale-105 z-10'
                                            : 'border-gray-200 bg-white text-gray-400 hover:border-gray-300 hover:text-gray-600 hover:bg-gray-50'
                                            }`}
                                    >
                                        <Icon size={18} className="mb-1.5" />
                                        <span className="text-[10px] font-bold tracking-[0.1em]">{t(role.id, lang).toUpperCase()}</span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Fields */}
                        <div className="space-y-3 w-full">

                            {/* JOLIE FENÊTRE D'ERREUR */}
                            {errorMessage && (
                                <div className="w-full p-3.5 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 shadow-sm animate-fade-in">
                                    <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
                                    <span className="text-xs font-semibold text-red-700 leading-snug">
                                        {errorMessage}
                                    </span>
                                </div>
                            )}

                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 tracking-[0.1em] mb-1.5 uppercase">{t('Account Email', lang)}</label>
                                <input
                                    type="email"
                                    placeholder="name@ramilevy.co.il"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className={`w-full px-4 py-2.5 bg-white border rounded-xl text-sm text-gray-800 outline-none transition-all placeholder:text-gray-300 shadow-sm
                                    ${errorMessage ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-500/10' : 'border-gray-200 focus:border-red-400 focus:ring-4 focus:ring-red-500/10'}`}
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 tracking-[0.1em] mb-1.5 uppercase">{t('Password', lang)}</label>
                                <input
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className={`w-full px-4 py-2.5 bg-white border rounded-xl text-sm text-gray-800 outline-none transition-all placeholder:text-gray-300 shadow-sm
                                    ${errorMessage ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-500/10' : 'border-gray-200 focus:border-red-400 focus:ring-4 focus:ring-red-500/10'}`}
                                />
                            </div>

                            <button
                                onClick={handleSignIn}
                                className="w-full py-3 mt-1 bg-[#0B1120] text-white rounded-xl text-xs font-bold tracking-[0.15em] hover:bg-red-600 transition-all duration-300 uppercase shadow-lg shadow-gray-900/20 active:scale-[0.98]"
                            >
                                {t('Sign In', lang)} {lang === 'he' ? '←' : '→'}
                            </button>

                            <p
                                onClick={() => { setShowForgotModal(true); setForgotEmail(email); setForgotMessage(null); }}
                                className="text-center text-xs font-semibold text-gray-400 hover:text-red-500 cursor-pointer transition-colors pt-1"
                            >
                                {t('Forgot password?', lang)}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* FORGOT PASSWORD MODAL */}
            {showForgotModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in">
                    <div className="bg-white dark:bg-[#1A1A1A] rounded-3xl shadow-2xl p-8 w-[400px] relative" dir={lang === 'he' ? 'rtl' : 'ltr'}>
                        <button
                            onClick={() => setShowForgotModal(false)}
                            className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center rounded-full bg-gray-50 dark:bg-[#262626] hover:bg-gray-100 dark:hover:bg-[#3F3F46] text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-all"
                        >
                            <X size={16} />
                        </button>

                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-2 h-2 rounded-full bg-red-600" />
                            <span className="text-[10px] font-bold tracking-[0.15em] text-gray-400 uppercase">{t('Password Recovery', lang)}</span>
                        </div>
                        <h2 className="text-xl font-extrabold text-gray-900 mb-2">{t('Reset your password', lang)}</h2>
                        <p className="text-xs font-medium text-gray-500 mb-6 leading-relaxed">
                            {t('Enter your email and we\'ll reset your password for the selected role', lang)} (<span className="font-bold text-gray-800">{t(selectedRole.toUpperCase(), lang)}</span>).
                        </p>

                        {forgotMessage && (
                            <div className={`w-full p-3.5 rounded-xl flex items-start gap-3 mb-5 shadow-sm ${forgotMessage.type === 'success'
                                ? 'bg-emerald-50 border border-emerald-100'
                                : 'bg-red-50 border border-red-100'
                                }`}>
                                {forgotMessage.type === 'success'
                                    ? <CheckCircle size={18} className="text-emerald-500 shrink-0 mt-0.5" />
                                    : <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
                                }
                                <span className={`text-xs font-bold leading-snug ${forgotMessage.type === 'success' ? 'text-emerald-700' : 'text-red-700'
                                    }`}>
                                    {forgotMessage.text}
                                </span>
                            </div>
                        )}

                        <div className="mb-6">
                            <label className="block text-[11px] font-bold text-gray-500 tracking-[0.1em] mb-2 uppercase">{t('Account Email', lang)}</label>
                            <input
                                type="email"
                                placeholder="name@ramilevy.co.il"
                                value={forgotEmail}
                                onChange={(e) => setForgotEmail(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 outline-none transition-all placeholder:text-gray-300 focus:bg-white focus:border-red-400 focus:ring-4 focus:ring-red-500/10"
                            />
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowForgotModal(false)}
                                className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-bold text-gray-500 hover:bg-gray-50 transition-all"
                            >
                                {t('Cancel', lang)}
                            </button>
                            <button
                                onClick={handleForgotPassword}
                                disabled={forgotLoading}
                                className="flex-1 py-3 rounded-xl bg-[#0B1120] text-white text-sm font-bold hover:bg-red-600 transition-all disabled:opacity-50 shadow-md"
                            >
                                {forgotLoading ? t('Resetting...', lang) : t('Reset Password', lang)}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LoginPage;