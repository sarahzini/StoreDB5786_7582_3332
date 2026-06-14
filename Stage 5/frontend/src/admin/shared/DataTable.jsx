// Generic table component
// columns: [{ key, label, render?, width? }]
// rows: array of data objects
// onEdit / onDelete: callbacks (pass null to hide button)
export default function DataTable({ columns, rows, onEdit, onDelete, emptyLabel = 'No data.', loading = false }) {
    return (
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50/50">
                        <tr className="border-b border-gray-50">
                            {columns.map(c => (
                                <th
                                    key={c.key}
                                    style={c.width ? { width: c.width } : {}}
                                    className="text-left px-5 py-3.5 text-[10px] font-semibold text-gray-400 tracking-[0.1em] uppercase whitespace-nowrap"
                                >
                                    {c.label}
                                </th>
                            ))}
                            {(onEdit || onDelete) && <th className="px-5 py-3.5 w-24" />}
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
                            <tr key={i} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/60 transition-colors">
                                {columns.map(c => (
                                    <td key={c.key} className="px-5 py-3.5 text-sm text-gray-700 align-top">
                                        {c.render ? c.render(row) : (row[c.key] ?? <span className="text-gray-300 italic text-[11px]">—</span>)}
                                    </td>
                                ))}
                                {(onEdit || onDelete) && (
                                    <td className="px-5 py-3.5 w-24 align-top">
                                        <div className="flex items-center justify-end gap-2">
                                            {onEdit && (
                                                <button
                                                    onClick={() => onEdit(row)}
                                                    className="text-[11px] text-blue-600 font-bold bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors uppercase tracking-widest whitespace-nowrap"
                                                >
                                                    Edit
                                                </button>
                                            )}
                                            {onDelete && (
                                                <button
                                                    onClick={() => onDelete(row)}
                                                    className="text-[11px] text-red-500 font-bold bg-red-50 px-3 py-1.5 rounded-lg hover:bg-red-100 transition-colors uppercase tracking-widest whitespace-nowrap"
                                                >
                                                    Del
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
        </div>
    );
}