import useTab from '../shared/useTab';
import DataTable from '../shared/DataTable';
import Drawer from '../shared/Drawer';
import ConfirmModal from '../shared/ConfirmModal';
import { Toast, Field, AddButton } from '../shared/ui';

const KashrutBadge = ({ label }) => (
    <span style={{
        display: 'inline-block', padding: '2px 8px', marginRight: '4px', marginBottom: '4px',
        fontSize: '10px', fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase',
        borderRadius: 'var(--border-radius-md)',
        background: 'var(--color-background-info)',
        color: 'var(--color-text-info)',
        border: '0.5px solid var(--color-border-info)',
        whiteSpace: 'nowrap',
    }}>
        {label}
    </span>
);

const COLUMNS = [
    { key: 'productname', label: 'Name', width: '20%' },
    {
        key: 'price', label: 'Price', width: '8%',
        render: r => <span style={{ fontWeight: 500 }}>₪{parseFloat(r.price).toFixed(2)}</span>
    },
    {
        key: 'categoryname', label: 'Category', width: '11%',
        render: r => r.categoryname
            ? <span style={{ color: 'var(--color-text-primary)' }}>{r.categoryname}</span>
            : <span style={{ color: 'var(--color-text-tertiary)', fontStyle: 'italic', fontSize: '12px' }}>—</span>
    },
    {
        key: 'suppliername', label: 'Supplier', width: '12%',
        render: r => r.suppliername
            ? <span>{r.suppliername}</span>
            : <span style={{ color: 'var(--color-text-tertiary)', fontStyle: 'italic', fontSize: '12px' }}>—</span>
    },
    {
        key: 'dateofmanufacture', label: 'Manufacture', width: '10%',
        render: r => r.dateofmanufacture ? new Date(r.dateofmanufacture).toLocaleDateString() : '—'
    },
    {
        key: 'expirationdate', label: 'Expiry', width: '10%',
        render: r => r.expirationdate ? new Date(r.expirationdate).toLocaleDateString() : '—'
    },
    {
        key: 'kashrut_list', label: 'Kashrut', width: '20%',
        render: r => r.kashrut_list
            ? <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                {r.kashrut_list.split(',').map((k, i) => <KashrutBadge key={i} label={k.trim()} />)}
            </div>
            : <span style={{ color: 'var(--color-text-tertiary)', fontStyle: 'italic', fontSize: '12px' }}>None</span>
    },
];

export default function ProductsTab() {
    const t = useTab('/api/admin/products', 'productid');
    return (
        <>
            {t.toast && <Toast message={t.toast.text} type={t.toast.type} onDone={() => t.setToast(null)} />}
            {t.confirmRow && (
                <ConfirmModal
                    message={`Delete product "${t.confirmRow.row.productname}"? This will also remove its kashrut data and inventory entries.`}
                    onConfirm={t.confirmDelete}
                    onCancel={t.cancelDelete}
                />
            )}
            <AddButton label="Product" onClick={t.openAdd} />
            <DataTable
                columns={COLUMNS}
                rows={t.rows}
                onEdit={t.openEdit}
                onDelete={t.handleDelete}
                emptyLabel="No products."
                loading={t.loading}
                search={t.search}
                onSearchChange={t.setSearch}
                page={t.page}
                totalPages={t.totalPages}
                onPageChange={t.setPage}
                totalCount={t.filteredRows.length}
            />
            {t.drawer && (
                <Drawer title={t.form.productid ? 'Edit Product' : 'Add Product'} onClose={t.close} onSubmit={t.handleSubmit}>
                    <Field label="Product Name" name="productname" value={t.form.productname} onChange={t.handleChange} />
                    <Field label="Price (₪)" name="price" value={t.form.price} onChange={t.handleChange} type="number" />
                    <Field label="Category ID" name="categoryid" value={t.form.categoryid} onChange={t.handleChange} type="number" placeholder="e.g. 3" />
                    <Field label="Supplier ID" name="supplierid" value={t.form.supplierid} onChange={t.handleChange} type="number" placeholder="e.g. 7" />
                    <Field label="Date of Manufacture" name="dateofmanufacture" value={t.form.dateofmanufacture?.split('T')[0]} onChange={t.handleChange} type="date" />
                    <Field label="Expiration Date" name="expirationdate" value={t.form.expirationdate?.split('T')[0]} onChange={t.handleChange} type="date" />
                    <Field label="Kashrut" name="kashrut" value={t.form.kashrut} onChange={t.handleChange} hint="Separate multiple with commas" />
                </Drawer>
            )}
        </>
    );
}