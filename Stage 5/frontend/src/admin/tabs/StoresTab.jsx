import useTab from '../shared/useTab';
import DataTable from '../shared/DataTable';
import Drawer from '../shared/Drawer';
import { Toast, Field, AddButton } from '../shared/ui';

const COLUMNS = [
    { key: 'storename',  label: 'Name' },
    { key: 'email',      label: 'Email' },
    { key: 'phone',      label: 'Phone' },
    { key: 'websiteurl', label: 'Website' },
    { key: 'rating',     label: 'Rating', render: r => r.rating ? `★ ${r.rating}` : '—' },
];

export default function StoresTab() {
    const t = useTab('/api/admin/stores', 'storeid');
    return (
        <>
            {t.toast && <Toast message={t.toast.text} type={t.toast.type} onDone={() => t.setToast(null)} />}
            <AddButton label="Store" onClick={t.openAdd} />
            <DataTable columns={COLUMNS} rows={t.rows} onEdit={t.openEdit} onDelete={t.handleDelete} emptyLabel="No stores." />
            {t.drawer && (
                <Drawer title={t.form.storeid ? 'Edit Store' : 'Add Store'} onClose={t.close} onSubmit={t.handleSubmit}>
                    <Field label="Store Name" name="storename"  value={t.form.storename}  onChange={t.handleChange} />
                    <Field label="Email"      name="email"      value={t.form.email}      onChange={t.handleChange} type="email" />
                    <Field label="Phone"      name="phone"      value={t.form.phone}      onChange={t.handleChange} />
                    <Field label="Website"    name="websiteurl" value={t.form.websiteurl} onChange={t.handleChange} placeholder="https://..." />
                    <Field label="Rating (1–5)" name="rating"  value={t.form.rating}     onChange={t.handleChange} type="number" />
                    <Field label="Password"   name="password"   onChange={t.handleChange} type="password" placeholder="Leave blank to keep current" />
                </Drawer>
            )}
        </>
    );
}
