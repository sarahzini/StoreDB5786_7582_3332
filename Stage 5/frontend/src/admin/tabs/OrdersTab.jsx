import useTab from '../shared/useTab';
import DataTable from '../shared/DataTable';
import Drawer from '../shared/Drawer';
import { Toast, Field, SelectField, AddButton, Badge } from '../shared/ui';

const STATUS_COLORS = {
    DELIVERED:  'bg-emerald-50 text-emerald-600',
    PENDING:    'bg-amber-50 text-amber-600',
    CANCELLED:  'bg-red-50 text-red-600',
    PROCESSING: 'bg-blue-50 text-blue-600',
};

const COLUMNS = [
    { key: 'customerid',    label: 'Customer', render: r => r.customerid ? `#${r.customerid}` : '—' },
    { key: 'storeid',       label: 'Store',    render: r => r.storeid    ? `#${r.storeid}`    : '—' },
    { key: 'driverid',      label: 'Driver',   render: r => r.driverid   ? `#${r.driverid}`   : '—' },
    { key: 'price',         label: 'Total',    render: r => `₪ ${parseFloat(r.price || 0).toFixed(2)}` },
    { key: 'paymentmethod', label: 'Payment' },
    { key: 'status',        label: 'Status',   render: r => <Badge value={r.status} colorMap={STATUS_COLORS} /> },
    { key: 'orderdate',     label: 'Date',     render: r => r.orderdate ? new Date(r.orderdate).toLocaleDateString() : '—' },
];

const STATUS_OPTIONS = [
    { value: 'PENDING',    label: 'Pending' },
    { value: 'PROCESSING', label: 'Processing' },
    { value: 'DELIVERED',  label: 'Delivered' },
    { value: 'CANCELLED',  label: 'Cancelled' },
];

const PAYMENT_OPTIONS = [
    { value: 'Credit Card',    label: 'Credit Card' },
    { value: 'Cash',           label: 'Cash' },
    { value: 'Store Request',  label: 'Store Request' },
];

export default function OrdersTab() {
    const t = useTab('/api/admin/orders', 'orderid');
    return (
        <>
            {t.toast && <Toast message={t.toast.text} type={t.toast.type} onDone={() => t.setToast(null)} />}
            <AddButton label="Order" onClick={t.openAdd} />
            <DataTable columns={COLUMNS} rows={t.rows} onEdit={t.openEdit} onDelete={t.handleDelete} emptyLabel="No orders." />
            {t.drawer && (
                <Drawer title={t.form.orderid ? 'Edit Order' : 'Add Order'} onClose={t.close} onSubmit={t.handleSubmit}>
                    <Field label="Customer ID" name="customerid" value={t.form.customerid} onChange={t.handleChange} type="number" placeholder="Leave blank for store restock" />
                    <Field label="Store ID"    name="storeid"    value={t.form.storeid}    onChange={t.handleChange} type="number" />
                    <Field label="Driver ID"   name="driverid"   value={t.form.driverid}   onChange={t.handleChange} type="number" placeholder="Optional" />
                    <Field label="Total (₪)"   name="price"      value={t.form.price}      onChange={t.handleChange} type="number" />
                    <SelectField label="Status"         name="status"         value={t.form.status}         onChange={t.handleChange} options={STATUS_OPTIONS} />
                    <SelectField label="Payment Method" name="paymentmethod"  value={t.form.paymentmethod}  onChange={t.handleChange} options={PAYMENT_OPTIONS} />
                    <Field label="Order Date" name="orderdate" value={t.form.orderdate?.split('T')[0]} onChange={t.handleChange} type="date" />
                </Drawer>
            )}
        </>
    );
}
