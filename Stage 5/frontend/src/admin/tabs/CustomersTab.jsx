import useTab from '../shared/useTab';
import DataTable from '../shared/DataTable';
import Drawer from '../shared/Drawer';
import ConfirmModal from '../shared/ConfirmModal';
import { Toast, Field, AddButton } from '../shared/ui';

const COLUMNS = [
    { key: 'customerid',   label: 'ID',    width: '6%',  render: r => <span className="font-bold text-gray-500">#{r.customerid}</span> },
    { key: 'customername', label: 'Name' },
    { key: 'email',        label: 'Email' },
    { key: 'phone',        label: 'Phone' },
    { key: 'city',         label: 'City' },
    { key: 'loyaltytier',  label: 'Tier', render: r => (
        <span className="text-sm font-semibold text-amber-600">{r.loyaltytier || 'Standard'}</span>
    )},
];

export default function CustomersTab() {
    const t = useTab('/api/admin/customers', 'customerid');
    return (
        <>
            {t.toast && <Toast message={t.toast.text} type={t.toast.type} onDone={() => t.setToast(null)} />}
            {t.confirmRow && (
                <ConfirmModal
                    message={`Delete customer "${t.confirmRow.row.customername}"? This action cannot be undone.`}
                    onConfirm={t.confirmDelete}
                    onCancel={t.cancelDelete}
                />
            )}
            <AddButton label="Customer" onClick={t.openAdd} />
            <DataTable
                columns={COLUMNS}
                rows={t.rows}
                onEdit={t.openEdit}
                onDelete={t.handleDelete}
                emptyLabel="No customers."
                loading={t.loading}
                search={t.search}
                onSearchChange={t.setSearch}
                page={t.page}
                totalPages={t.totalPages}
                onPageChange={t.setPage}
                totalCount={t.filteredRows.length}
            />
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
