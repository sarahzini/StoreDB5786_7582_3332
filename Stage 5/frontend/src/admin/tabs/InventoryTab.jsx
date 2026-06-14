import useTab from '../shared/useTab';
import DataTable from '../shared/DataTable';
import Drawer from '../shared/Drawer';
import { Toast, Field, AddButton } from '../shared/ui';

const BASE = 'http://localhost:5000';

const COLUMNS = [
    { key: 'productname',  label: 'Product' },
    { key: 'storename',    label: 'Store' },
    { key: 'quantity',     label: 'Qty', render: r => (
        <span className={`font-bold ${r.quantity < r.minimumstock ? 'text-red-500' : 'text-gray-700'}`}>{r.quantity}</span>
    )},
    { key: 'minimumstock', label: 'Min Stock' },
];

export default function InventoryTab() {
    const t = useTab('/api/admin/inventory', null); // null = composite PK

    // Custom delete: uses query params ?productid=&storeid=
    const handleDelete = async (row) => {
        if (!window.confirm('Delete this inventory entry?')) return;
        try {
            const res    = await fetch(`${BASE}/api/admin/inventory?productid=${row.productid}&storeid=${row.storeid}`, { method: 'DELETE' });
            const result = await res.json();
            result.success ? (t.setToast({ type: 'success', text: 'Deleted.' }), t.load()) : t.setToast({ type: 'error', text: result.message });
        } catch {
            t.setToast({ type: 'error', text: 'Server error.' });
        }
    };

    // Custom submit: always PUT (upsert) since PK = productid + storeid
    const handleSubmit = async () => {
        const isEdit = !!(t.form.productid && t.form.storeid);
        try {
            const res    = await fetch(`${BASE}/api/admin/inventory`, {
                method: 'POST', // backend uses ON CONFLICT DO UPDATE
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(t.form),
            });
            const result = await res.json();
            if (result.success) {
                t.setToast({ type: 'success', text: isEdit ? 'Updated.' : 'Added.' });
                t.close();
                t.load();
            } else {
                t.setToast({ type: 'error', text: result.message || 'Error.' });
            }
        } catch {
            t.setToast({ type: 'error', text: 'Server error.' });
        }
    };

    return (
        <>
            {t.toast && <Toast message={t.toast.text} type={t.toast.type} onDone={() => t.setToast(null)} />}
            <AddButton label="Entry" onClick={t.openAdd} />
            <DataTable columns={COLUMNS} rows={t.rows} onEdit={t.openEdit} onDelete={handleDelete} emptyLabel="No inventory entries." />
            {t.drawer && (
                <Drawer title="Inventory Entry" onClose={t.close} onSubmit={handleSubmit}>
                    <Field label="Product ID"   name="productid"   value={t.form.productid}   onChange={t.handleChange} type="number" />
                    <Field label="Store ID"     name="storeid"     value={t.form.storeid}     onChange={t.handleChange} type="number" />
                    <Field label="Quantity"     name="quantity"    value={t.form.quantity}    onChange={t.handleChange} type="number" />
                    <Field label="Min Stock"    name="minimumstock" value={t.form.minimumstock} onChange={t.handleChange} type="number" />
                </Drawer>
            )}
        </>
    );
}
