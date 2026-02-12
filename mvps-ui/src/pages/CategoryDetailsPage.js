import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchData, putJson, deleteJson } from '../apiClient';
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
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    async function loadCategory() {
      try {
        setLoading(true);
        setError('');
        const res = await fetchData(`/categories/${categoryId}`);
        setCategory(res.data || {});
        setFormValues({
          name: res.data?.name || '',
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
      await putJson(`/categories/${categoryId}`, formValues);
      setSuccess('Category updated successfully.');
      setEditMode(false);
      setCategory({ ...category, ...formValues });
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
  if (!category) return <p>No category found.</p>;

  return (
    <div className="page products-page container">
      <h1 className="page-title">Category Details</h1>
      {!editMode ? (
        <>
          <p><strong>Name:</strong> {category.name}</p>
          <p><strong>Description:</strong> {category.description}</p>
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
