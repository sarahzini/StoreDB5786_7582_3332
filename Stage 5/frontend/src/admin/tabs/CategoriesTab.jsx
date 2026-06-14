import useTab from '../shared/useTab';
import DataTable from '../shared/DataTable';
import Drawer from '../shared/Drawer';
import { Toast, Field, AddButton } from '../shared/ui';

const COLUMNS = [
    { key: 'categoryname', label: 'Category Name' },
];

export default function CategoriesTab() {
    const t = useTab('/api/admin/categories', 'categoryid');
    return (
        <>
            {t.toast && <Toast message={t.toast.text} type={t.toast.type} onDone={() => t.setToast(null)} />}
            <AddButton label="Category" onClick={t.openAdd} />
            <DataTable columns={COLUMNS} rows={t.rows} onEdit={t.openEdit} onDelete={t.handleDelete} emptyLabel="No categories." />
            {t.drawer && (
                <Drawer title={t.form.categoryid ? 'Edit Category' : 'Add Category'} onClose={t.close} onSubmit={t.handleSubmit}>
                    <Field label="Category Name" name="categoryname" value={t.form.categoryname} onChange={t.handleChange} />
                </Drawer>
            )}
        </>
    );
}
