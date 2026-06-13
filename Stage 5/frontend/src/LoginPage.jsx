import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Truck, Store, User, ShieldCheck, AlertCircle } from 'lucide-react'; // Ajout de AlertCircle

const LoginPage = () => {
    const [selectedRole, setSelectedRole] = useState('Customer');
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    // Nouvel état pour gérer le message d'erreur
    const [errorMessage, setErrorMessage] = useState('');

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
                // On remplace le 'alert' par notre state en Anglais
                setErrorMessage("Invalid email or password. Please try again.");
            }
        } catch (error) {
            console.error("Erreur réseau:", error);
            // Erreur de serveur en Anglais
            setErrorMessage("Connection error. Please try again later.");
        }
    };

    return (
        <div className="flex h-screen w-full font-sans">
            {/* LEFT — Branding */}
            <div className="w-[52%] bg-[#0B1120] p-14 flex flex-col justify-between text-white">
                <div>
                    <div className="flex items-center gap-3 mb-16">
                        <div className="bg-red-600 p-2 rounded-md">
                            <ShieldCheck size={16} className="text-white" />
                        </div>
                        <span className="text-[10px] font-medium tracking-[0.22em] text-white/40 uppercase">Rami Levy Group</span>
                    </div>

                    <h1 className="text-[44px] font-black tracking-tight uppercase leading-[1.05] mb-4">
                        Integrated<br />
                        <span className="text-red-500">Core</span>
                    </h1>

                    <div className="w-10 h-[2px] bg-red-600 mb-7" />

                    <p className="text-white/35 text-sm font-light leading-relaxed max-w-[270px]">
                        Logistics & retail intelligence engine. Unified supply chain, analytics, and loyalty management.
                    </p>
                </div>

                <div className="flex gap-10 border-t border-white/10 pt-8">
                    {[['320+', 'Stores'], ['4.2M', 'Members'], ['99.9%', 'Uptime']].map(([num, label]) => (
                        <div key={label}>
                            <p className="text-2xl font-semibold text-white">{num}</p>
                            <p className="text-[9px] tracking-[0.18em] text-white/30 mt-1 uppercase">{label}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Separator */}
            <div className="w-px bg-gradient-to-b from-transparent via-gray-200 to-transparent" />

            {/* RIGHT — Form */}
            <div className="flex-1 bg-[#F8F9FB] flex flex-col items-center justify-center px-12">
                <div className="w-full max-w-[300px] flex flex-col items-center">
                    <img src="/Rami_Levy_Hashikma_Marketing_logo.png" alt="Rami Levy" className="h-12 mb-10 object-contain" />
                    <div className="w-full h-px bg-gray-200 mb-8" />

                    <div className="flex items-center gap-2 mb-6 self-start">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-600" />
                        <span className="text-[9px] font-medium tracking-[0.2em] text-red-600/60 uppercase">Secure Authentication</span>
                    </div>

                    {/* Role grid */}
                    <div className="grid grid-cols-2 gap-2 mb-6 w-full">
                        {roles.map((role) => {
                            const Icon = role.icon;
                            const isSelected = selectedRole === role.id;
                            return (
                                <button
                                    key={role.id}
                                    onClick={() => setSelectedRole(role.id)}
                                    className={`flex flex-col items-center justify-center py-3 rounded-lg border transition-all ${isSelected
                                        ? 'border-red-500 border-[1.5px] bg-white text-red-600 shadow-sm shadow-red-100'
                                        : 'border-gray-200 bg-white text-gray-400 hover:border-gray-300 hover:text-gray-600'
                                        }`}
                                >
                                    <Icon size={17} className="mb-1.5" />
                                    <span className="text-[8.5px] font-medium tracking-[0.14em]">{role.label}</span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Fields */}
                    <div className="space-y-3.5 w-full">

                        {/* JOLIE FENÊTRE D'ERREUR */}
                        {errorMessage && (
                            <div className="w-full p-3 bg-red-50 border border-red-100 rounded-lg flex items-start gap-2.5 animate-in fade-in slide-in-from-top-2 duration-200">
                                <AlertCircle size={15} className="text-red-500 shrink-0 mt-0.5" />
                                <span className="text-[11px] font-medium text-red-600 leading-tight">
                                    {errorMessage}
                                </span>
                            </div>
                        )}

                        <div>
                            <label className="block text-[8.5px] font-medium text-gray-400 tracking-[0.16em] mb-1.5 uppercase">Account Email</label>
                            <input
                                type="email"
                                placeholder="name@ramilevy.co.il"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className={`w-full px-3.5 py-2.5 bg-white border rounded-lg text-sm text-gray-800 outline-none transition-all placeholder:text-gray-300
                                    ${errorMessage ? 'border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-50' : 'border-gray-200 focus:border-red-400 focus:ring-2 focus:ring-red-50'}`}
                            />
                        </div>

                        <div>
                            <label className="block text-[8.5px] font-medium text-gray-400 tracking-[0.16em] mb-1.5 uppercase">Password</label>
                            <input
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className={`w-full px-3.5 py-2.5 bg-white border rounded-lg text-sm text-gray-800 outline-none transition-all placeholder:text-gray-300
                                    ${errorMessage ? 'border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-50' : 'border-gray-200 focus:border-red-400 focus:ring-2 focus:ring-red-50'}`}
                            />
                        </div>

                        <button
                            onClick={handleSignIn}
                            className="w-full py-3 mt-1 bg-[#0B1120] text-white rounded-lg text-[10.5px] font-medium tracking-[0.18em] hover:bg-red-600 transition-all duration-200 uppercase cursor-pointer"
                        >
                            Sign In →
                        </button>

                        <p className="text-center text-[10.5px] text-gray-400 hover:text-red-500 cursor-pointer transition-colors pt-0.5">
                            Forgot password?
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;