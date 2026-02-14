import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchData, postJson, putJson, deleteJson } from '../apiClient';
import './ProductsPage/ProductsPage.css';

const CategoryDetailsPage = () => {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const [category, setCategory] = useState(null);
  const [formValues, setFormValues] = useState({ name: '', description: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const isNew = !categoryId;
  const [editMode, setEditMode] = useState(isNew);

  useEffect(() => {
    async function loadCategory() {
      if (!categoryId) {
        // creating a new category — no load required
        setCategory(null);
        setFormValues({ name: '', description: '' });
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError('');
        const res = await fetchData(`/categories/${categoryId}`);
        setCategory(res.data || {});
        setFormValues({
          name: res.data?.categoryName ?? res.data?.category_name ?? res.data?.name ?? '',
          description: res.data?.description || '',
        });
      } catch (e) {
        setError('Failed to load category.');
      } finally {
        setLoading(false);
      }
    }
    loadCategory();
  }, [categoryId]);

  const handleFieldChange = (e) => {
    const { name, value } = e.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError('');
      setSuccess('');
      const payload = {
        categoryName: formValues.name,
        description: formValues.description || undefined,
      };
      if (categoryId) {
        await putJson(`/categories/${categoryId}`, payload);
      } else {
        await postJson('/categories', payload);
      }
      setSuccess('Category updated successfully.');
      setEditMode(false);
      setCategory((prev) => ({ ...(prev || {}), categoryName: formValues.name, description: formValues.description }));
    } catch (e) {
      setError('Failed to update category.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;
    try {
      setSaving(true);
      setError('');
      await deleteJson(`/categories/${categoryId}`);
      navigate('/products');
    } catch (e) {
      setError('Failed to delete category.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p className="error-message">{error}</p>;
  if (!category && !isNew) return <p>No category found.</p>;

  return (
    <div className="page products-page container">
      <h1 className="page-title">Category Details</h1>
      {!editMode ? (
        <>
              <p><strong>Name:</strong> {category?.name}</p>
              <p><strong>Description:</strong> {category?.description}</p>
          <button className="btn-primary" onClick={() => setEditMode(true)}>Edit</button>
          <button className="btn-danger" onClick={handleDelete} disabled={saving} style={{marginLeft: '1rem'}}>Delete</button>
        </>
      ) : (
        <form onSubmit={handleSave} className="category-form-inner">
          <div className="category-form-grid">
            <label>Name
              <input name="name" className="input" value={formValues.name} onChange={handleFieldChange} required />
            </label>
            <label>Description
              <input name="description" className="input" value={formValues.description} onChange={handleFieldChange} />
            </label>
          </div>
          <div className="category-form-actions">
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
            <button type="button" className="btn-secondary" onClick={() => setEditMode(false)} disabled={saving}>Cancel</button>
          </div>
        </form>
      )}
      {success && <p className="success-message">{success}</p>}
    </div>
  );
};

export default CategoryDetailsPage;
