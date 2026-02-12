import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  deleteJson,
  fetchData,
  postJson,
  putJson,
} from '../../apiClient';
import '../ProductsPage/ProductsPage.css';

const defaultFormValues = {
  product_name: '',
  generic_name: '',
  category_id: '',
  description: '',
  manufacturer: '',
  hsn_code: '',
  unit_of_measure: '',
  prescription_required: false,
  is_active: true,
};

const ProductDetailsPage = () => {
  const { productId } = useParams();
  const isEdit = Boolean(productId);
  const navigate = useNavigate();

  const [formValues, setFormValues] = useState(defaultFormValues);
  const [categories, setCategories] = useState([]);
  const [productVendors, setProductVendors] = useState([]);
  const [loadingProduct, setLoadingProduct] = useState(false);
  const [loadingVendors, setLoadingVendors] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // ...existing code...
  // ...existing code...
  // ...existing code...

  const loadCategories = useCallback(async () => {
    try {
      const res = await fetchData('/categories');
      const data = res.data || [];
      const mapped = data
        .filter(Boolean)
        .map((c) => ({
          id: c.category_id ?? c.categoryId,
          name: c.category_name ?? c.categoryName,
        }))
        .filter((c) => c.id && c.name);
      setCategories(mapped);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
      setCategories([]);
    }
  }, []);

  const loadProduct = useCallback(async () => {
    if (!isEdit) return;
    try {
      setLoadingProduct(true);
      setError('');
      const res = await fetchData(`/products/${productId}`);
      const data = res.data || {};

      setFormValues((prev) => ({
        ...prev,
        product_name: data.product_name ?? data.productName ?? '',
        generic_name: data.generic_name ?? data.genericName ?? '',
        category_id: data.category_id ?? data.categoryId ?? '',
        description: data.description ?? '',
        manufacturer: data.manufacturer ?? '',
        hsn_code: data.hsn_code ?? data.hsnCode ?? '',
        unit_of_measure: data.unit_of_measure ?? data.unitOfMeasure ?? '',
        prescription_required: Boolean(
          data.prescription_required ?? data.prescriptionRequired,
        ),
        is_active:
          typeof (data.is_active ?? data.isActive) === 'boolean'
            ? data.is_active ?? data.isActive
            : true,
      }));
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
      setError('Failed to load product details.');
    } finally {
      setLoadingProduct(false);
    }
  }, [isEdit, productId]);

  const loadProductVendors = useCallback(async () => {
    if (!isEdit) return;
    try {
      setLoadingVendors(true);
      const res = await fetchData(`/products/${productId}/vendors`);
      const data = res.data || [];
      setProductVendors(data.filter(Boolean));
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
      setProductVendors([]);
    } finally {
      setLoadingVendors(false);
    }
  }, [isEdit, productId]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    loadProduct();
  }, [loadProduct]);

  useEffect(() => {
    loadProductVendors();
  }, [loadProductVendors]);

  const handleFieldChange = (event) => {
    const { name, type, value, checked } = event.target;

    setFormValues((prev) => {
      if (name === 'prescription_required' || name === 'is_active') {
        return { ...prev, [name]: checked };
      }
      if (name === 'category_id') {
        return {
          ...prev,
          [name]: value ? Number(value) : '',
        };
      }
      return {
        ...prev,
        [name]: type === 'number' ? value : value,
      };
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      setSaving(true);
      setError('');

      const payload = {
        ...formValues,
      };

      if (isEdit) {
        await putJson(`/products/${productId}`, payload);
      } else {
        await postJson('/products', payload);
      }

      navigate('/products');
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
      setError('Failed to save product.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!isEdit) return;
    // eslint-disable-next-line no-alert
    const confirmed = window.confirm(
      'Are you sure you want to delete this product?',
    );
    if (!confirmed) return;

    try {
      setSaving(true);
      setError('');
      await deleteJson(`/products/${productId}`);
      navigate('/products');
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
      setError('Failed to delete product.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate('/products');
  };

  const pageTitle = isEdit ? 'Edit product' : 'Add product';

  const sortedCategories = useMemo(
    () => [...categories].sort((a, b) => a.name.localeCompare(b.name)),
    [categories],
  );

  return (
    <div className="page products-page container">
      <h1 className="page-title">{pageTitle}</h1>
      <p className="page-subtitle">
        {isEdit
          ? 'Update product details and review vendor pricing.'
          : 'Create a new product entry in the master catalog.'}
      </p>

      <button
        type="button"
        className="btn-secondary"
        onClick={handleCancel}
        style={{ marginBottom: '1rem' }}
      >
        
        Back to products
      </button>

      {loadingProduct && <p>Loading product...</p>}
      {error && !loadingProduct && <p className="error-message">{error}</p>}

      <form className="product-form" onSubmit={handleSubmit}>
        <h2 className="product-form__title">{pageTitle}</h2>
        <div className="product-form-grid">
          <div>
            <label>
              Product name*
              <input
                name="product_name"
                className="input"
                value={formValues.product_name}
                onChange={handleFieldChange}
                required
              />
            </label>
          </div>
          <div>
            <label>
              Generic name
              <input
                name="generic_name"
                className="input"
                value={formValues.generic_name}
                onChange={handleFieldChange}
              />
            </label>
          </div>
          <div>
            <label>
              Category*
              <select
                name="category_id"
                className="input"
                value={formValues.category_id || ''}
                onChange={handleFieldChange}
                required
              >
                <option value="">Select category</option>
                {sortedCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div>
            <label>
              Unit of measure*
              <input
                name="unit_of_measure"
                className="input"
                value={formValues.unit_of_measure}
                onChange={handleFieldChange}
                required
              />
            </label>
          </div>
          <div>
            <label>
              Manufacturer
              <input
                name="manufacturer"
                className="input"
                value={formValues.manufacturer}
                onChange={handleFieldChange}
              />
            </label>
          </div>
          <div>
            <label>
              HSN code
              <input
                name="hsn_code"
                className="input"
                value={formValues.hsn_code}
                onChange={handleFieldChange}
              />
            </label>
          </div>
          <div className="product-form__full">
            <label>
              Description
              <textarea
                name="description"
                className="input"
                rows={3}
                value={formValues.description}
                onChange={handleFieldChange}
              />
            </label>
          </div>
          <div className="product-form__full product-form__checkbox-row">
            <label>
              <input
                type="checkbox"
                name="prescription_required"
                checked={formValues.prescription_required}
                onChange={handleFieldChange}
              />{' '}
              Prescription required
            </label>
            <label>
              <input
                type="checkbox"
                name="is_active"
                checked={formValues.is_active}
                onChange={handleFieldChange}
              />{' '}
              Active
            </label>
          </div>
        </div>
        <div className="product-form-actions">
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Saving…' : isEdit ? 'Update product' : 'Create product'}
          </button>
          {isEdit && (
            <button
              type="button"
              className="btn-secondary"
              onClick={handleDelete}
              disabled={saving}
            >
              Delete product
            </button>
          )}
        </div>
      </form>

      {isEdit && (
        <div className="product-vendors">
          <h2 className="product-vendors__title">Vendors for this product</h2>
          {loadingVendors && <p>Loading vendors...</p>}
          {!loadingVendors && productVendors.length === 0 && (
            <p className="product-vendors__empty">
              No vendors are currently mapped to this product.
            </p>
          )}
          {!loadingVendors && productVendors.length > 0 && (
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Vendor</th>
                    <th>SKU</th>
                    <th>Cost price (₹)</th>
                    <th>Discount %</th>
                    <th>Final price (₹)</th>
                    <th>Stock</th>
                    <th>Lowest price?</th>
                  </tr>
                </thead>
                <tbody>
                  {productVendors.map((v) => (
                    <tr
                      key={
                        v.vendor_id ?? v.vendorId ?? v.vendor_sku ?? v.vendorSku
                      }
                    >
                      <td>{v.vendor_name ?? v.vendorName ?? v.vendorId}</td>
                      <td>{v.vendor_sku ?? v.vendorSku}</td>
                      <td>
                        {v.cost_price != null
                          ? Number(v.cost_price).toFixed(2)
                          : (v.costPrice != null ? Number(v.costPrice).toFixed(2) : '-')}
                      </td>
                      <td>
                        {v.discount_percentage != null
                          ? Number(v.discount_percentage).toFixed(2)
                          : (v.discountPercentage != null ? Number(v.discountPercentage).toFixed(2) : '-')}
                      </td>
                      <td>
                        {v.final_price != null
                          ? Number(v.final_price).toFixed(2)
                          : (v.finalPrice != null ? Number(v.finalPrice).toFixed(2) : '-')}
                      </td>
                      <td>{v.stock_quantity ?? v.stockQuantity}</td>
                      <td>{v.is_lowest_price ?? v.isLowestPrice ? 'Yes' : 'No'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProductDetailsPage;
