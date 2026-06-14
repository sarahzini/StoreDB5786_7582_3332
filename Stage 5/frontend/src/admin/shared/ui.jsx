import { useEffect } from 'react';

// Auto-dismissing notification — type: 'success' | 'error'
export function Toast({ message, type, onDone }) {
    useEffect(() => {
        const t = setTimeout(onDone, 3000);
        return () => clearTimeout(t);
    }, []);

    return (
        <div className={`fixed top-6 right-8 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl shadow-xl text-sm font-medium bg-white border ${type === 'success' ? 'border-emerald-100' : 'border-red-100'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${type === 'success' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                {type === 'success' ? '✓' : '✕'}
            </div>
            {message}
        </div>
    );
}

// Reusable form field
const cls = "w-full mt-1.5 p-3 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-red-500 transition-all shadow-sm font-medium";
const labelCls = "block text-[10px] font-bold text-gray-400 tracking-[0.1em] uppercase mb-1";

export function Field({ label, name, value, onChange, type = 'text', placeholder, hint }) {
    return (
        <div>
            <label className={labelCls}>{label}</label>
            <input type={type} name={name} value={value || ''} onChange={onChange} className={cls} placeholder={placeholder || ''} />
            {hint && <p className="text-[10px] text-gray-400 mt-1">{hint}</p>}
        </div>
    );
}

export function SelectField({ label, name, value, onChange, options }) {
    return (
        <div>
            <label className={labelCls}>{label}</label>
            <select name={name} value={value || ''} onChange={onChange} className={cls}>
                <option value="">-- Select --</option>
                {options.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                ))}
            </select>
        </div>
    );
}

// Add button for tab headers
export function AddButton({ label, onClick }) {
    return (
        <div className="flex justify-end mb-4">
            <button onClick={onClick} className="flex items-center gap-2 bg-[#0B1120] text-white px-4 py-2 rounded-lg text-[11px] font-bold tracking-[0.12em] hover:bg-red-600 transition-all uppercase">
                + Add {label}
            </button>
        </div>
    );
}

// Status badge
export function Badge({ value, colorMap }) {
    const upper = (value || '').toUpperCase();
    const color = colorMap?.[upper] || 'bg-gray-100 text-gray-500';
    return (
        <span className={`text-[10px] font-bold px-2.5 py-1 rounded tracking-wide uppercase ${color}`}>
            {value || '—'}
        </span>
    );
}
