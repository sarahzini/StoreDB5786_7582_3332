import useTab from '../shared/useTab';
import DataTable from '../shared/DataTable';
import Drawer from '../shared/Drawer';
import { Toast, Field, AddButton } from '../shared/ui';

const COLUMNS = [
    { key: 'productname',    label: 'Name' },
    { key: 'price',          label: 'Price', render: r => `₪ ${parseFloat(r.price).toFixed(2)}` },
    { key: 'categoryname',   label: 'Category' },
    { key: 'suppliername',   label: 'Supplier' },
    { key: 'dateofmanufacture', label: 'Manufacture', render: r => r.dateofmanufacture ? new Date(r.dateofmanufacture).toLocaleDateString() : '—' },
    { key: 'expirationdate', label: 'Expiry', render: r => r.expirationdate ? new Date(r.expirationdate).toLocaleDateString() : '—' },
    { key: 'kashrut_list',   label: 'Kashrut', render: r => r.kashrut_list
        ? <div className="flex flex-wrap gap-1">{r.kashrut_list.split(',').map((k, i) => <span key={i} className="px-2 py-0.5 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded text-[9px] font-bold uppercase">{k.trim()}</span>)}</div>
        : <span className="text-gray-300 italic text-[11px]">None</span>
    },
];

export default function ProductsTab() {
    const t = useTab('/api/admin/products', 'productid');
    return (
        <>
            {t.toast && <Toast message={t.toast.text} type={t.toast.type} onDone={() => t.setToast(null)} />}
            <AddButton label="Product" onClick={t.openAdd} />
            <DataTable columns={COLUMNS} rows={t.rows} onEdit={t.openEdit} onDelete={t.handleDelete} emptyLabel="No products." />
            {t.drawer && (
                <Drawer title={t.form.productid ? 'Edit Product' : 'Add Product'} onClose={t.close} onSubmit={t.handleSubmit}>
                    <Field label="Product Name"       name="productname"       value={t.form.productname}       onChange={t.handleChange} />
                    <Field label="Price (₪)"          name="price"             value={t.form.price}             onChange={t.handleChange} type="number" />
                    <Field label="Category ID"        name="categoryid"        value={t.form.categoryid}        onChange={t.handleChange} type="number" placeholder="e.g. 3" />
                    <Field label="Supplier ID"        name="supplierid"        value={t.form.supplierid}        onChange={t.handleChange} type="number" placeholder="e.g. 7" />
                    <Field label="Date of Manufacture" name="dateofmanufacture" value={t.form.dateofmanufacture?.split('T')[0]} onChange={t.handleChange} type="date" />
                    <Field label="Expiration Date"    name="expirationdate"    value={t.form.expirationdate?.split('T')[0]}    onChange={t.handleChange} type="date" />
                    <Field label="Kashrut" name="kashrut" value={t.form.kashrut} onChange={t.handleChange} hint="Separate multiple with commas" />
                </Drawer>
            )}
        </>
    );
}
