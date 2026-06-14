import useTab from '../shared/useTab';
import DataTable from '../shared/DataTable';
import Drawer from '../shared/Drawer';
import { Toast, Field, AddButton } from '../shared/ui';

const COLUMNS = [
    { key: 'suppliername', label: 'Name' },
    { key: 'email',        label: 'Email' },
    { key: 'phone',        label: 'Phone' },
    { key: 'city',         label: 'City' },
    { key: 'street',       label: 'Street' },
];

export default function SuppliersTab() {
    const t = useTab('/api/admin/suppliers', 'supplierid');
    return (
        <>
            {t.toast && <Toast message={t.toast.text} type={t.toast.type} onDone={() => t.setToast(null)} />}
            <AddButton label="Supplier" onClick={t.openAdd} />
            <DataTable columns={COLUMNS} rows={t.rows} onEdit={t.openEdit} onDelete={t.handleDelete} emptyLabel="No suppliers." />
            {t.drawer && (
                <Drawer title={t.form.supplierid ? 'Edit Supplier' : 'Add Supplier'} onClose={t.close} onSubmit={t.handleSubmit}>
                    <Field label="Name"   name="suppliername" value={t.form.suppliername} onChange={t.handleChange} />
                    <Field label="Email"  name="email"        value={t.form.email}        onChange={t.handleChange} type="email" />
                    <Field label="Phone"  name="phone"        value={t.form.phone}        onChange={t.handleChange} />
                    <Field label="City"   name="city"         value={t.form.city}         onChange={t.handleChange} />
                    <Field label="Street" name="street"       value={t.form.street}       onChange={t.handleChange} />
                </Drawer>
            )}
        </>
    );
}
