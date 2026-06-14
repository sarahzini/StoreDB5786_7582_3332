import { X, AlertTriangle } from 'lucide-react';

export default function ConfirmModal({ message, onConfirm, onCancel }) {
    return (
        <div className="fixed inset-0 bg-black/40 z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-[400px] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center">
                            <AlertTriangle size={18} className="text-red-500" />
                        </div>
                        <h2 className="text-sm font-bold text-gray-900">Confirm Deletion</h2>
                    </div>
                    <button
                        onClick={onCancel}
                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-500 transition-colors"
                    >
                        <X size={13} />
                    </button>
                </div>

                {/* Body */}
                <div className="px-6 py-5">
                    <p className="text-sm text-gray-600 leading-relaxed">
                        {message || 'Are you sure you want to delete this record? This action cannot be undone.'}
                    </p>
                </div>

                {/* Footer */}
                <div className="px-6 pb-6 flex gap-3">
                    <button
                        onClick={onCancel}
                        className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-all"
                    >
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
}
