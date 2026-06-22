import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { t } from '../../translations';

export default function DataTable({
    columns, rows, onEdit, onDelete,
    emptyLabel = 'No data.', loading = false,
    search = '', onSearchChange = null,
    page = 1, totalPages = 1, onPageChange = null,
    totalCount = 0, lang = 'en'
}) {
    const renderCell = (val) => {
        if (typeof val !== 'string') return val;
        if (lang === 'en') return val;
        const translated = t(val, lang);
        if (translated !== val) return translated;
        if (val.includes(',')) {
            return val.split(',').map(s => t(s.trim(), lang)).join(', ');
        }
        return translated;
    };

    return (
        <div>
            {onSearchChange && (
                <div className="mb-4 flex items-center gap-3">
                    <div className="relative flex-1 max-w-xs">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder={t('Search...', lang)}
                            value={search}
                            onChange={e => onSearchChange(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 text-sm bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl outline-none focus:border-red-400 focus:ring-2 focus:ring-red-50 dark:focus:ring-red-900/30 text-gray-900 dark:text-white transition-all shadow-sm"
                        />
                    </div>
                    {search && (
                        <button onClick={() => onSearchChange('')} className="text-xs font-semibold text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                            {t('Clear', lang)}
                        </button>
                    )}
                    <span className="text-xs font-semibold text-gray-400 ml-auto dark:text-gray-500">{totalCount} {t(totalCount !== 1 ? 'results' : 'result', lang)}</span>
                </div>
            )}

            <div className="bg-white dark:!bg-transparent dark:bg-gradient-to-br dark:from-[#0B1120] dark:via-[#111827] dark:to-[#450a0a] border border-gray-100 dark:border-white/10 rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full" style={{ borderCollapse: 'collapse' }}>
                        <thead>
                            <tr className="border-b border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-white/5">
                                {columns.map(c => (
                                    <th key={c.key} style={{ width: c.width || 'auto' }}
                                        className="text-start px-5 py-3 text-[10px] font-semibold text-gray-400 tracking-widest uppercase whitespace-nowrap">
                                        {t(c.label, lang)}
                                    </th>
                                ))}
                                {(onEdit || onDelete) && <th style={{ width: '160px' }} className="px-5 py-3" />}
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                [...Array(5)].map((_, i) => (
                                    <tr key={i} className="border-b border-gray-50 dark:border-white/5">
                                        {columns.map(c => (
                                            <td key={c.key} className="px-5 py-3.5">
                                                <div className="h-3 bg-gray-100 dark:bg-white/10 rounded animate-pulse" style={{ width: `${60 + Math.random() * 30}%` }} />
                                            </td>
                                        ))}
                                        {(onEdit || onDelete) && (
                                            <td className="px-5 py-3.5">
                                                <div className="flex gap-2 justify-end">
                                                    <div className="h-6 w-14 bg-gray-100 dark:bg-white/10 rounded-lg animate-pulse" />
                                                    <div className="h-6 w-14 bg-gray-100 dark:bg-white/10 rounded-lg animate-pulse" />
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))
                            ) : rows.length === 0 ? (
                                <tr>
                                    <td colSpan={columns.length + 1} className="text-center py-14 text-sm text-gray-400">
                                        {search ? `${t('No results for', lang)} "${search}"` : t(emptyLabel, lang)}
                                    </td>
                                </tr>
                            ) : rows.map((row, i) => (
                                <tr key={i} className="border-b border-gray-50 dark:border-white/5 last:border-0 hover:bg-gray-50/70 dark:hover:bg-white/5 transition-colors">
                                    {columns.map(c => (
                                        <td key={c.key} className="px-5 py-3.5 text-sm text-gray-800 dark:text-gray-300 align-top">
                                            {c.render ? c.render(row) : (row[c.key] != null ? renderCell(row[c.key]) : <span className="text-gray-300 dark:text-gray-600 italic text-xs">—</span>)}
                                        </td>
                                    ))}
                                    {(onEdit || onDelete) && (
                                        <td className="px-5 py-3 align-top" style={{ width: '160px' }}>
                                            <div className="flex gap-2 justify-end">
                                                {onEdit && (
                                                    <button onClick={() => onEdit(row)}
                                                        className="text-[11px] font-semibold px-3 py-1.5 rounded-lg border border-blue-200 dark:border-blue-500/20 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-all whitespace-nowrap">
                                                        ✎ {t('Edit', lang)}
                                                    </button>
                                                )}
                                                {onDelete && (
                                                    <button onClick={() => onDelete(row)}
                                                        className="text-[11px] font-semibold px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/10 text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 transition-all whitespace-nowrap">
                                                        ✕ {t('Delete', lang)}
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

                {/* Pagination — scrollable with cursor */}
                {onPageChange && totalPages > 1 && (
                    <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 dark:border-white/10 bg-gray-50/50 dark:!bg-transparent dark:bg-gradient-to-br dark:from-[#0B1120] dark:via-[#111827] dark:to-[#450a0a]">
                        <span className="text-xs font-semibold text-gray-400 flex-shrink-0">{t('Page', lang)} {page} {t('of', lang)} {totalPages}</span>
                        <div className="flex items-center gap-1 overflow-x-auto max-w-[75%] py-1 cursor-grab active:cursor-grabbing"
                            ref={el => {
                                if (!el) return;
                                // drag-to-scroll
                                let isDown = false, startX, scrollLeft;
                                el.onmousedown = e => { isDown = true; startX = e.pageX - el.offsetLeft; scrollLeft = el.scrollLeft; };
                                el.onmouseleave = () => { isDown = false; };
                                el.onmouseup = () => { isDown = false; };
                                el.onmousemove = e => { if (!isDown) return; e.preventDefault(); el.scrollLeft = scrollLeft - (e.pageX - el.offsetLeft - startX); };
                            }}
                        >
                            <button
                                onClick={() => onPageChange(page - 1)}
                                disabled={page === 1}
                                className="flex-shrink-0 p-1.5 rounded-lg border border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:bg-white dark:hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                            >
                                {lang === 'he' ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
                            </button>

                            {[...Array(totalPages)].map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => onPageChange(i + 1)}
                                    className={`flex-shrink-0 w-7 h-7 rounded-lg text-xs font-semibold transition-all ${
                                        page === i + 1
                                            ? 'bg-red-600 text-white border border-red-600'
                                            : 'border border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:bg-white dark:hover:bg-white/5'
                                    }`}
                                >
                                    {i + 1}
                                </button>
                            ))}

                            <button
                                onClick={() => onPageChange(page + 1)}
                                disabled={page === totalPages}
                                className="flex-shrink-0 p-1.5 rounded-lg border border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:bg-white dark:hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                            >
                                {lang === 'he' ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
