import { useEffect } from 'react';
import { t } from '../../translations';

// Auto-dismissing notification — type: 'success' | 'error'
export function Toast({ message, type, onDone }) {
    useEffect(() => {
        const t = setTimeout(onDone, 3000);
        return () => clearTimeout(t);
    }, []);

    return (
        <div className={`fixed top-6 right-8 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl shadow-xl text-sm font-medium bg-white dark:!bg-transparent dark:bg-gradient-to-br dark:from-[#0B1120] dark:via-[#111827] dark:to-[#450a0a] text-gray-900 dark:text-white border ${type === 'success' ? 'border-emerald-100 dark:border-emerald-500/20' : 'border-red-100 dark:border-red-500/20'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${type === 'success' ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400'}`}>
                {type === 'success' ? '✓' : '✕'}
            </div>
            {message}
        </div>
    );
}

// Reusable form field
const cls = "w-full mt-1.5 p-3 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-50 dark:focus:ring-red-900/30 text-gray-900 dark:text-white transition-all shadow-sm font-medium";
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

export function SelectField({ label, name, value, onChange, options, lang = 'en' }) {
    return (
        <div>
            <label className={labelCls}>{label}</label>
            <select name={name} value={value || ''} onChange={onChange} className={cls}>
                <option value="">-- {t('Select', lang)} --</option>
                {options.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                ))}
            </select>
        </div>
    );
}

// Add button for tab headers
export function AddButton({ label, onClick, lang = 'en' }) {
    return (
        <div className="flex justify-end mb-4">
            <button onClick={onClick} className="flex items-center gap-2 bg-red-600 dark:bg-red-600 text-white px-4 py-2 rounded-lg text-[11px] font-bold tracking-[0.12em] hover:bg-red-700 dark:hover:bg-red-700 transition-all uppercase">
                + {t('Add', lang)} {t(label, lang)}
            </button>
        </div>
    );
}

// Status badge
export function Badge({ value, colorMap, originalKey }) {
    const lookup = (originalKey || value || '').toUpperCase();
    const color = colorMap?.[lookup] || 'bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-white/10';
    return (
        <span className={`text-[10px] font-bold px-2.5 py-1 rounded tracking-wide uppercase ${color}`}>
            {value || '—'}
        </span>
    );
}
