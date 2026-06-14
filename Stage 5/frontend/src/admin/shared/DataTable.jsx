// Generic table component
// columns: [{ key, label, render? }]
// rows: array of data objects
// onEdit / onDelete: callbacks (pass null to hide button)
export default function DataTable({ columns, rows, onEdit, onDelete, emptyLabel = 'No data.', loading = false }) {
    return (
        <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full">
                <thead className="bg-gray-50/50">
                    <tr className="border-b border-gray-50">
                        {columns.map(c => (
                            <th key={c.key} className="text-left px-6 py-4 text-[10px] font-medium text-gray-400 tracking-[0.1em] uppercase">{c.label}</th>
                        ))}
                        {(onEdit || onDelete) && <th className="px-6 py-4" />}
                    </tr>
                </thead>
                <tbody>
                    {loading || rows.length === 0 ? (
                        <tr>
                            <td colSpan={columns.length + 1} className="text-center py-10 text-gray-400 text-sm">
                                {loading ? 'Loading...' : emptyLabel}
                            </td>
                        </tr>
                    ) : rows.map((row, i) => (
                        <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                            {columns.map(c => (
                                <td key={c.key} className="px-6 py-4 text-sm text-gray-700">
                                    {c.render ? c.render(row) : (row[c.key] ?? <span className="text-gray-300 italic text-[11px]">—</span>)}
                                </td>
                            ))}
                            {(onEdit || onDelete) && (
                                <td className="px-6 py-4">
                                    <div className="flex items-center justify-end gap-2">
                                        {onEdit && (
                                            <button onClick={() => onEdit(row)} className="text-[11px] text-blue-600 font-bold bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors uppercase tracking-widest">
                                                Edit
                                            </button>
                                        )}
                                        {onDelete && (
                                            <button onClick={() => onDelete(row)} className="text-[11px] text-red-600 font-bold bg-red-50 px-3 py-1.5 rounded-lg hover:bg-red-100 transition-colors uppercase tracking-widest">
                                                Delete
                                            </button>
                                        )}
                                    </div>
                                </td>
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
