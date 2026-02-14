import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchData, postJson, putJson, deleteJson } from '../../apiClient';
import './CategoryDetailsPage.css';

const defaultFormValues = {
  categoryName: '',
  description: '',
  isActive: true,
};

const CategoryDetailsPage = () => {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(categoryId);

  const [formValues, setFormValues] = useState(defaultFormValues);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isEdit) {
      setFormValues(defaultFormValues);
      return;
    }

    const loadCategory = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await fetchData(`/categories/${categoryId}`);
        const c = res.data || {};
        setFormValues({
          categoryName: c.categoryName ?? c.category_name ?? '',
          description: c.description || '',
          isActive:
            typeof (c.isActive ?? c.is_active) === 'boolean'
              ? c.isActive ?? c.is_active
              : true,
        });
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error(e);
        setError('Failed to load category.');
      } finally {
        setLoading(false);
      }
    };

    loadCategory();
  }, [isEdit, categoryId]);

  const handleFieldChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormValues((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    const payload = {
      categoryName: formValues.categoryName,
      description: formValues.description || undefined,
      isActive: formValues.isActive,
    };

    try {
      if (isEdit) {
        await putJson(`/categories/${categoryId}`, payload);
      } else {
        await postJson('/categories', payload);
      }
      navigate('/products');
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
      setError('Failed to save category.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!isEdit) return;
    // eslint-disable-next-line no-alert
    const confirmed = window.confirm(
      'Are you sure you want to delete this category? This may affect products using this category.',
    );
    if (!confirmed) return;

    setSaving(true);
    setError('');
    try {
      await deleteJson(`/categories/${categoryId}`);
      navigate('/products');
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
      setError('Failed to delete category.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate('/products');
  };

  const pageTitle = isEdit ? 'Edit Category' : 'Add Category';

  return (
    <div className="page category-details-page container">
      <h1 className="page-title">{pageTitle}</h1>
      <p className="page-subtitle">
        {isEdit
          ? 'Update category details and manage product classifications.'
          : 'Create a new product category for organizing inventory.'}
      </p>

      <button
        type="button"
        className="btn-secondary"
        onClick={handleCancel}
        style={{ marginBottom: '1rem' }}
      >
        Back to Products
      </button>

      {loading && <p>Loading category...</p>}
      {error && !loading && <p className="error-message">{error}</p>}

      <form className="category-form card" onSubmit={handleSubmit}>
        <h2>{pageTitle}</h2>
        <div className="form-grid">
          <div>
            <label>
              Category Name*
              <input
                name="categoryName"
                className="input"
                value={formValues.categoryName}
                onChange={handleFieldChange}
                required
                placeholder="e.g., Antibiotics, Surgical Supplies"
              />
            </label>
          </div>
          <div className="form-grid-full">
            <label>
              Description
              <textarea
                name="description"
                className="input"
                value={formValues.description}
                onChange={handleFieldChange}
                rows="3"
                placeholder="Describe this category..."
              />
            </label>
          </div>
          <div>
            <label>
              <input
                type="checkbox"
                name="isActive"
                checked={formValues.isActive}
                onChange={handleFieldChange}
              />{' '}
              Active
            </label>
          </div>
        </div>
        <div className="form-actions">
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Saving…' : isEdit ? 'Update Category' : 'Create Category'}
          </button>
          {isEdit && (
            <button
              type="button"
              className="btn-secondary"
              onClick={handleDelete}
              disabled={saving}
              style={{ backgroundColor: '#dc2626', color: 'white' }}
            >
              Delete Category
            </button>
          )}
          <button
            type="button"
            className="btn-secondary"
            onClick={handleCancel}
            disabled={saving}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default CategoryDetailsPage;
