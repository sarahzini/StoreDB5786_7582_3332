import useTab from '../shared/useTab';
import DataTable from '../shared/DataTable';
import Drawer from '../shared/Drawer';
import { Toast, Field, AddButton } from '../shared/ui';

const COLUMNS = [
    { key: 'customername', label: 'Name' },
    { key: 'email',        label: 'Email' },
    { key: 'phone',        label: 'Phone' },
    { key: 'city',         label: 'City' },
    { key: 'street',       label: 'Street' },
    { key: 'loyaltytier',  label: 'Tier', render: r => (
        <span className="text-sm font-semibold text-amber-600">{r.loyaltytier || 'Standard'}</span>
    )},
];

export default function CustomersTab() {
    const t = useTab('/api/admin/customers', 'customerid');
    return (
        <>
            {t.toast && <Toast message={t.toast.text} type={t.toast.type} onDone={() => t.setToast(null)} />}
            <AddButton label="Customer" onClick={t.openAdd} />
            <DataTable columns={COLUMNS} rows={t.rows} onEdit={t.openEdit} onDelete={t.handleDelete} emptyLabel="No customers." />
            {t.drawer && (
                <Drawer title={t.form.customerid ? 'Edit Customer' : 'Add Customer'} onClose={t.close} onSubmit={t.handleSubmit}>
                    <Field label="Name"     name="customername" value={t.form.customername} onChange={t.handleChange} />
                    <Field label="Email"    name="email"        value={t.form.email}        onChange={t.handleChange} type="email" />
                    <Field label="Phone"    name="phone"        value={t.form.phone}        onChange={t.handleChange} />
                    <Field label="City"     name="city"         value={t.form.city}         onChange={t.handleChange} />
                    <Field label="Street"   name="street"       value={t.form.street}       onChange={t.handleChange} />
                    <Field label="Password" name="password"     onChange={t.handleChange}   type="password" placeholder="Leave blank to keep current" />
                </Drawer>
            )}
        </>
    );
}
