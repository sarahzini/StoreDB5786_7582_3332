import useTab from '../shared/useTab';
import DataTable from '../shared/DataTable';
import Drawer from '../shared/Drawer';
import { Toast, Field, AddButton } from '../shared/ui';

const COLUMNS = [
    { key: 'deliveryciename',    label: 'Company Name' },
    { key: 'deliveryciephonenb', label: 'Phone' },
    { key: 'email',              label: 'Email' },
    { key: 'regions',            label: 'Regions Served' },
];

export default function DeliveryTab() {
    const t = useTab('/api/admin/delivery', 'deliverycieid');
    return (
        <>
            {t.toast && <Toast message={t.toast.text} type={t.toast.type} onDone={() => t.setToast(null)} />}
            <AddButton label="Delivery Company" onClick={t.openAdd} />
            <DataTable columns={COLUMNS} rows={t.rows} onEdit={t.openEdit} onDelete={t.handleDelete} emptyLabel="No delivery companies." />
            {t.drawer && (
                <Drawer title={t.form.deliverycieid ? 'Edit Delivery Company' : 'Add Delivery Company'} onClose={t.close} onSubmit={t.handleSubmit}>
                    <Field label="Company Name" name="deliveryciename"    value={t.form.deliveryciename}    onChange={t.handleChange} />
                    <Field label="Phone"        name="deliveryciephonenb" value={t.form.deliveryciephonenb} onChange={t.handleChange} />
                    <Field label="Email"        name="email"              value={t.form.email}              onChange={t.handleChange} type="email" />
                    <Field label="Regions"      name="regions"            value={t.form.regions}            onChange={t.handleChange} hint="Separate multiple with commas" />
                </Drawer>
            )}
        </>
    );
}
