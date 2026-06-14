import { X } from 'lucide-react';

// Slide-in panel for add/edit forms
// title, onClose, onSubmit, children = form fields
export default function Drawer({ title, onClose, onSubmit, children }) {
    return (
        <div className="fixed inset-0 bg-black/40 z-50 flex justify-end">
            <div className="w-[450px] bg-white h-full flex flex-col shadow-2xl">
                <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100 bg-gray-50/80">
                    <div>
                        <h2 className="text-base font-bold text-gray-900">{title}</h2>
                        <p className="text-xs text-gray-500 mt-1">Fill out the details below.</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-red-600 p-2 rounded-full hover:bg-red-50 transition-all">
                        <X size={18} />
                    </button>
                </div>
                <div className="flex-1 p-8 overflow-y-auto bg-gray-50/30 space-y-5">
                    {children}
                </div>
                <div className="p-6 border-t border-gray-100 bg-white">
                    <button onClick={onSubmit} className="w-full py-4 bg-red-600 text-white rounded-xl text-[12px] font-bold tracking-[0.15em] uppercase hover:bg-red-700 transition-all active:scale-[0.98]">
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
}
