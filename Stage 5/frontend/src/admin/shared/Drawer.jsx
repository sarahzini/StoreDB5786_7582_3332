import { X } from 'lucide-react';
import { t } from '../../translations';

// Slide-in panel for add/edit forms
export default function Drawer({ title, onClose, onSubmit, children, lang = 'en' }) {
    return (
        <div className="fixed inset-0 bg-black/40 dark:bg-black/60 z-50 flex justify-end">
            <div className="w-[450px] bg-white dark:!bg-transparent dark:bg-gradient-to-br dark:from-[#0B1120] dark:via-[#111827] dark:to-[#450a0a] h-full flex flex-col shadow-2xl border-l border-transparent dark:border-white/10">
                <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100 dark:border-white/10 bg-gray-50/80 dark:bg-white/5">
                    <div>
                        <h2 className="text-base font-bold text-gray-900 dark:text-white">{t(title, lang)}</h2>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('Fill out the details below.', lang)}</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-red-600 dark:hover:text-red-400 p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-500/10 transition-all">
                        <X size={18} />
                    </button>
                </div>
                <div className="flex-1 p-8 overflow-y-auto bg-gray-50/30 dark:bg-transparent space-y-5">
                    {children}
                </div>
                <div className="p-6 border-t border-gray-100 dark:border-white/10 bg-white dark:bg-white/5">
                    <button onClick={onSubmit} className="w-full py-4 bg-red-600 text-white rounded-xl text-[12px] font-bold tracking-[0.15em] uppercase hover:bg-red-700 transition-all active:scale-[0.98]">
                        {t('Save', lang)}
                    </button>
                </div>
            </div>
        </div>
    );
}
