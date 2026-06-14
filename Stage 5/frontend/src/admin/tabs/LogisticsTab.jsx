import useTab from '../shared/useTab';
import DataTable from '../shared/DataTable';
import Drawer from '../shared/Drawer';
import { Toast, Field, SelectField, AddButton, Badge } from '../shared/ui';

const STATUS_COLORS = {
    'OK':   'bg-emerald-50 text-emerald-600',
    'GOOD': 'bg-emerald-50 text-emerald-600',
};

const COLUMNS = [
    { key: 'licenseplate',     label: 'License Plate' },
    { key: 'capacity',         label: 'Capacity', render: r => `${r.capacity} T` },
    { key: 'deliverycieid',    label: 'Delivery Co. ID' },
    { key: 'maintenancestatus', label: 'Maintenance', render: r => (
        <Badge value={r.maintenancestatus} colorMap={STATUS_COLORS} />
    )},
    { key: 'active', label: 'Status', render: r => (
        <Badge value={r.active === 1 ? 'Active' : 'Offline'} colorMap={{ ACTIVE: 'bg-blue-50 text-blue-600', OFFLINE: 'bg-gray-100 text-gray-500' }} />
    )},
];

export default function LogisticsTab() {
    const t = useTab('/api/admin/drivers', 'driverid');
    return (
        <>
            {t.toast && <Toast message={t.toast.text} type={t.toast.type} onDone={() => t.setToast(null)} />}
            <AddButton label="Driver" onClick={t.openAdd} />
            <DataTable columns={COLUMNS} rows={t.rows} onEdit={t.openEdit} onDelete={t.handleDelete} emptyLabel="No drivers." />
            {t.drawer && (
                <Drawer title={t.form.driverid ? 'Edit Driver' : 'Add Driver'} onClose={t.close} onSubmit={t.handleSubmit}>
                    <Field label="License Plate"       name="licenseplate"     value={t.form.licenseplate}     onChange={t.handleChange} placeholder="e.g. 12-345-67" />
                    <Field label="Capacity (Tons)"     name="capacity"         value={t.form.capacity}         onChange={t.handleChange} type="number" />
                    <Field label="Delivery Company ID" name="deliverycieid"    value={t.form.deliverycieid}    onChange={t.handleChange} type="number" />
                    <Field label="Maintenance Status"  name="maintenancestatus" value={t.form.maintenancestatus} onChange={t.handleChange} placeholder="e.g. Good, OK, Needs Repair" />
                    <Field label="Email"               name="email"            value={t.form.email}            onChange={t.handleChange} type="email" />
                    <Field label="Password"            name="password"         onChange={t.handleChange}       type="password" placeholder="Leave blank to keep current" />
                </Drawer>
            )}
        </>
    );
}
