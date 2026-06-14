export default function DataTable({ columns, rows, onEdit, onDelete, emptyLabel = 'No data.', loading = false }) {
    return (
        <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
                <table className="w-full" style={{ borderCollapse: 'collapse' }}>
                    <thead>
                        <tr className="border-b border-gray-100 bg-gray-50">
                            {columns.map(c => (
                                <th key={c.key} style={{ width: c.width || 'auto' }}
                                    className="text-left px-5 py-3 text-[10px] font-semibold text-gray-400 tracking-widest uppercase whitespace-nowrap">
                                    {c.label}
                                </th>
                            ))}
                            {(onEdit || onDelete) && <th style={{ width: '160px' }} className="px-5 py-3" />}
                        </tr>
                    </thead>
                    <tbody>
                        {loading || rows.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length + 1} className="text-center py-12 text-sm text-gray-400">
                                    {loading ? 'Loading...' : emptyLabel}
                                </td>
                            </tr>
                        ) : rows.map((row, i) => (
                            <tr key={i} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/70 transition-colors">
                                {columns.map(c => (
                                    <td key={c.key} className="px-5 py-3.5 text-sm text-gray-800 align-top">
                                        {c.render ? c.render(row) : (row[c.key] ?? <span className="text-gray-300 italic text-xs">—</span>)}
                                    </td>
                                ))}
                                {(onEdit || onDelete) && (
                                    <td className="px-5 py-3 align-top" style={{ width: '160px' }}>
                                        <div className="flex gap-2 justify-end">
                                            {onEdit && (
                                                <button onClick={() => onEdit(row)}
                                                    className="text-[11px] font-semibold px-3 py-1.5 rounded-lg border border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100 hover:border-blue-300 transition-all whitespace-nowrap">
                                                    ✎ Edit
                                                </button>
                                            )}
                                            {onDelete && (
                                                <button onClick={() => onDelete(row)}
                                                    className="text-[11px] font-semibold px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 text-red-500 hover:bg-red-100 hover:border-red-300 transition-all whitespace-nowrap">
                                                    ✕ Delete
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