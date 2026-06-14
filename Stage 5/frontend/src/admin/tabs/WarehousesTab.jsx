import useTab from '../shared/useTab';
import DataTable from '../shared/DataTable';
import Drawer from '../shared/Drawer';
import { Toast, Field, AddButton } from '../shared/ui';

const COLUMNS = [
    { key: 'region',   label: 'Region' },
    { key: 'address',  label: 'Address' },
    { key: 'managers', label: 'Managers' },
];

export default function WarehousesTab() {
    const t = useTab('/api/admin/warehouses', 'warehouseid');
    return (
        <>
            {t.toast && <Toast message={t.toast.text} type={t.toast.type} onDone={() => t.setToast(null)} />}
            <AddButton label="Warehouse" onClick={t.openAdd} />
            <DataTable columns={COLUMNS} rows={t.rows} onEdit={t.openEdit} onDelete={t.handleDelete} emptyLabel="No warehouses." />
            {t.drawer && (
                <Drawer title={t.form.warehouseid ? 'Edit Warehouse' : 'Add Warehouse'} onClose={t.close} onSubmit={t.handleSubmit}>
                    <Field label="Region"   name="region"   value={t.form.region}   onChange={t.handleChange} placeholder="e.g. Jerusalem" />
                    <Field label="Address"  name="address"  value={t.form.address}  onChange={t.handleChange} placeholder="e.g. Givat Shaul St 12" />
                    <Field label="Managers" name="managers" value={t.form.managers} onChange={t.handleChange} hint="Separate multiple names with commas" />
                </Drawer>
            )}
        </>
    );
}
