import useTab from '../shared/useTab';
import DataTable from '../shared/DataTable';
import Drawer from '../shared/Drawer';
import ConfirmModal from '../shared/ConfirmModal';
import { Toast, Field, AddButton } from '../shared/ui';

const COLUMNS = [
    { key: 'warehouseid', label: 'ID',      width: '6%',  render: r => <span className="font-bold text-gray-500">#{r.warehouseid}</span> },
    { key: 'region',      label: 'Region' },
    { key: 'address',     label: 'Address' },
    { key: 'managers',    label: 'Managers' },
];

export default function WarehousesTab() {
    const t = useTab('/api/admin/warehouses', 'warehouseid');
    return (
        <>
            {t.toast && <Toast message={t.toast.text} type={t.toast.type} onDone={() => t.setToast(null)} />}
            {t.confirmRow && (
                <ConfirmModal
                    message={`Delete warehouse in region "${t.confirmRow.row.region}"? All inventory stored here will also be removed.`}
                    onConfirm={t.confirmDelete}
                    onCancel={t.cancelDelete}
                />
            )}
            <AddButton label="Warehouse" onClick={t.openAdd} />
            <DataTable
                columns={COLUMNS}
                rows={t.rows}
                onEdit={t.openEdit}
                onDelete={t.handleDelete}
                emptyLabel="No warehouses."
                loading={t.loading}
                search={t.search}
                onSearchChange={t.setSearch}
                page={t.page}
                totalPages={t.totalPages}
                onPageChange={t.setPage}
                totalCount={t.filteredRows.length}
            />
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
