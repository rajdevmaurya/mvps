import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchData, postJson, putJson, deleteJson } from '../../apiClient';
import '../VendorsPage/VendorsPage.css';

const defaultFormValues = {
  vendor_name: '',
  contact_person: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  state: '',
  pincode: '',
  gst_number: '',
  is_active: true,
  rating: 0,
};

const VendorDetailsPage = () => {
  const { vendorId } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(vendorId);

  const [formValues, setFormValues] = useState(defaultFormValues);
  const [saving, setSaving] = useState(false);
  const [loadingVendor, setLoadingVendor] = useState(false);
  const [error, setError] = useState('');
  const [vendorProducts, setVendorProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [vendorProductModalOpen, setVendorProductModalOpen] = useState(false);
  const [selectedVendorProductId, setSelectedVendorProductId] = useState(null);
  const [vendorProductDetail, setVendorProductDetail] = useState(null);
  const [vendorProductForm, setVendorProductForm] = useState({
    vendor_sku: '',
    cost_price: '',
    mrp: '',
    discount_percentage: '',
    minimum_order_quantity: '',
    stock_quantity: '',
    expiry_date: '',
    is_available: true,
    delivery_time_days: '',
  });
  const [vendorProductLoading, setVendorProductLoading] = useState(false);
  const [vendorProductSaving, setVendorProductSaving] = useState(false);
  const [vendorProductError, setVendorProductError] = useState('');

  useEffect(() => {
    if (!isEdit) {
      setFormValues(defaultFormValues);
      setVendorProducts([]);
      return;
    }

    const loadVendor = async () => {
      try {
        setLoadingVendor(true);
        setError('');
        const res = await fetchData(`/vendors/${vendorId}`);
        const v = res.data || {};
        setFormValues({
          vendor_name: v.vendor_name || v.vendorName || v.name || '',
          contact_person: v.contact_person || v.contactPerson || '',
          email: v.email || '',
          phone: v.phone || '',
          address: v.address || '',
          city: v.city || '',
          state: v.state || '',
          pincode: v.pincode || '',
          gst_number: v.gst_number || '',
          is_active: typeof v.is_active === 'boolean' ? v.is_active : true,
          rating: typeof v.rating === 'number' ? v.rating : 0,
        });
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error(e);
        setError('Failed to load vendor.');
      } finally {
        setLoadingVendor(false);
      }
    };

    loadVendor();
  }, [isEdit, vendorId]);

  const loadVendorProducts = async (id) => {
    if (!id) return;

    try {
      setLoadingProducts(true);
      const res = await fetchData(`/vendors/${id}/products`, {
        is_available: true,
      });
      setVendorProducts(res.data || []);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
      setVendorProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    if (!isEdit) {
      setVendorProducts([]);
      return;
    }

    loadVendorProducts(vendorId);
  }, [isEdit, vendorId]);

  const handleFieldChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormValues((prev) => ({
      ...prev,
      [name]:
        name === 'rating'
          ? Number(value) || 0
          : type === 'checkbox'
          ? checked
          : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (isEdit) {
        await putJson(`/vendors/${vendorId}`, formValues);
      } else {
        await postJson('/vendors', formValues);
      }
      navigate('/vendors');
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
      setError('Failed to save vendor.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!isEdit) return;
    // eslint-disable-next-line no-alert
    const confirmed = window.confirm('Are you sure you want to delete this vendor?');
    if (!confirmed) return;

    setSaving(true);
    setError('');
    try {
      await deleteJson(`/vendors/${vendorId}`);
      navigate('/vendors');
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
      setError('Failed to delete vendor.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate('/vendors');
  };

  const handleViewVendorOrders = () => {
    if (!vendorId) return;
    navigate(`/vendor-orders?vendorId=${vendorId}`);
  };

  const openVendorProductModal = async (row) => {
    const vpId =
      row.vendor_product_id ?? row.vendorProductId ?? row.product_vendor_id;
    if (!vpId) return;

    setSelectedVendorProductId(vpId);
    setVendorProductModalOpen(true);
    setVendorProductLoading(true);
    setVendorProductError('');

    try {
      const res = await fetchData(`/vendor-products/${vpId}`);
      const vp = res.data || {};
      setVendorProductDetail(vp);
      setVendorProductForm({
        vendor_sku: vp.vendor_sku || vp.vendorSku || '',
        cost_price:
          vp.cost_price != null && vp.cost_price !== ''
            ? String(vp.cost_price)
            : (vp.costPrice != null && vp.costPrice !== '' ? String(vp.costPrice) : ''),
        mrp:
          vp.mrp != null && vp.mrp !== '' ? String(vp.mrp) : (vp.mrp != null && vp.mrp !== '' ? String(vp.mrp) : ''),
        discount_percentage:
          vp.discount_percentage != null && vp.discount_percentage !== ''
            ? String(vp.discount_percentage)
            : (vp.discountPercentage != null && vp.discountPercentage !== '' ? String(vp.discountPercentage) : ''),
        minimum_order_quantity:
          vp.minimum_order_quantity != null && vp.minimum_order_quantity !== ''
            ? String(vp.minimum_order_quantity)
            : (vp.minimumOrderQuantity != null && vp.minimumOrderQuantity !== '' ? String(vp.minimumOrderQuantity) : ''),
        stock_quantity:
          vp.stock_quantity != null && vp.stock_quantity !== ''
            ? String(vp.stock_quantity)
            : (vp.stockQuantity != null && vp.stockQuantity !== '' ? String(vp.stockQuantity) : ''),
        expiry_date: toDateInputValue(vp.expiry_date || vp.expiryDate || ''),
        is_available:
          typeof vp.is_available === 'boolean' ? vp.is_available : (typeof vp.isAvailable === 'boolean' ? vp.isAvailable : true),
        delivery_time_days:
          vp.delivery_time_days != null && vp.delivery_time_days !== ''
            ? String(vp.delivery_time_days)
            : (vp.deliveryTimeDays != null && vp.deliveryTimeDays !== '' ? String(vp.deliveryTimeDays) : ''),
      });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
      setVendorProductError('Failed to load vendor product.');
    } finally {
      setVendorProductLoading(false);
    }
  };

  const handleVendorProductFieldChange = (e) => {
    const { name, type, value, checked } = e.target;
    setVendorProductForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const toDateInputValue = (value) => {
    if (!value) return '';
    const raw = Array.isArray(value) ? value[0] : value;
    if (typeof raw !== 'string' && typeof raw !== 'number') return '';
    try {
      const d = new Date(raw);
      if (Number.isNaN(d.getTime())) return '';
      return d.toISOString().slice(0, 10);
    } catch {
      return '';
    }
  };

  const handleVendorProductModalClose = () => {
    if (vendorProductSaving) return;
    setVendorProductModalOpen(false);
    setSelectedVendorProductId(null);
    setVendorProductDetail(null);
    setVendorProductForm({
      vendor_sku: '',
      cost_price: '',
      mrp: '',
      discount_percentage: '',
      minimum_order_quantity: '',
      stock_quantity: '',
      expiry_date: '',
      is_available: true,
      delivery_time_days: '',
    });
    setVendorProductError('');
  };

  const handleVendorProductSave = async (e) => {
    e.preventDefault();
    if (!selectedVendorProductId) return;

    const toNumber = (val) => {
      if (val === '' || val == null) return null;
      const n = Number(val);
      // eslint-disable-next-line no-restricted-globals
      return Number.isNaN(n) ? null : n;
    };

    const costPriceNum = toNumber(vendorProductForm.cost_price);
    const mrpNum = toNumber(vendorProductForm.mrp);
    const discountNum = toNumber(vendorProductForm.discount_percentage);
    const moqNum = toNumber(vendorProductForm.minimum_order_quantity);
    const stockNum = toNumber(vendorProductForm.stock_quantity);
    const deliveryDaysNum = toNumber(vendorProductForm.delivery_time_days);

    if (costPriceNum != null && costPriceNum < 0) {
      setVendorProductError('Cost price cannot be negative.');
      return;
    }
    if (mrpNum != null && mrpNum < 0) {
      setVendorProductError('MRP cannot be negative.');
      return;
    }
    if (discountNum != null && (discountNum < 0 || discountNum > 100)) {
      setVendorProductError('Discount must be between 0 and 100.');
      return;
    }
    if (moqNum != null && moqNum < 0) {
      setVendorProductError('Minimum order quantity cannot be negative.');
      return;
    }
    if (stockNum != null && stockNum < 0) {
      setVendorProductError('Stock quantity cannot be negative.');
      return;
    }
    if (deliveryDaysNum != null && deliveryDaysNum < 0) {
      setVendorProductError('Delivery time cannot be negative.');
      return;
    }

    const payload = {
      vendor_sku: vendorProductForm.vendor_sku || null,
      cost_price: costPriceNum,
      mrp: mrpNum,
      discount_percentage: discountNum,
      minimum_order_quantity: moqNum,
      stock_quantity: stockNum,
      expiry_date: vendorProductForm.expiry_date || null,
      is_available: !!vendorProductForm.is_available,
      delivery_time_days: deliveryDaysNum,
    };

    try {
      setVendorProductSaving(true);
      setVendorProductError('');
      await putJson(`/vendor-products/${selectedVendorProductId}`, payload);
      await loadVendorProducts(vendorId);
      handleVendorProductModalClose();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
      setVendorProductError('Failed to update vendor product.');
    } finally {
      setVendorProductSaving(false);
    }
  };

  const handleVendorProductDelete = async () => {
    if (!selectedVendorProductId) return;
    // eslint-disable-next-line no-alert
    const confirmed = window.confirm(
      'Are you sure you want to delete this vendor product?',
    );
    if (!confirmed) return;

    try {
      setVendorProductSaving(true);
      setVendorProductError('');
      await deleteJson(`/vendor-products/${selectedVendorProductId}`);
      await loadVendorProducts(vendorId);
      handleVendorProductModalClose();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
      setVendorProductError('Failed to delete vendor product.');
    } finally {
      setVendorProductSaving(false);
    }
  };

  const pageTitle = isEdit ? 'Edit vendor' : 'Add vendor';

  return (
    <div className="page vendors-page container">
      <h1 className="page-title">{pageTitle}</h1>
      <p className="page-subtitle">
        {isEdit
          ? 'Update vendor details and review their products.'
          : 'Create a new vendor to start listing their products.'}
      </p>

      <button
        type="button"
        className="btn-secondary"
        onClick={handleCancel}
        style={{ marginBottom: '1rem' }}
      >
        Back to vendors
      </button>

      {isEdit && (
        <button
          type="button"
          className="btn-secondary"
          onClick={handleViewVendorOrders}
          style={{ marginBottom: '1rem', marginLeft: '0.75rem' }}
        >
          View vendor orders
        </button>
      )}

      {loadingVendor && <p>Loading vendor...</p>}
      {error && !loadingVendor && <p className="error-message">{error}</p>}

      <form className="vendor-form" onSubmit={handleSubmit}>
        <h2 className="vendor-form__title">{pageTitle}</h2>
        <div className="vendor-form-grid">
          <div>
            <label>
              Vendor name*
              <input
                name="vendor_name"
                className="input"
                value={formValues.vendor_name}
                onChange={handleFieldChange}
                required
              />
            </label>
          </div>
          <div>
            <label>
              Contact person
              <input
                name="contact_person"
                className="input"
                value={formValues.contact_person}
                onChange={handleFieldChange}
              />
            </label>
          </div>
          <div>
            <label>
              Email
              <input
                name="email"
                type="email"
                className="input"
                value={formValues.email}
                onChange={handleFieldChange}
              />
            </label>
          </div>
          <div>
            <label>
              Phone*
              <input
                name="phone"
                className="input"
                value={formValues.phone}
                onChange={handleFieldChange}
                required
              />
            </label>
          </div>
          <div className="vendor-form__full">
            <label>
              Address
              <input
                name="address"
                className="input"
                value={formValues.address}
                onChange={handleFieldChange}
              />
            </label>
          </div>
          <div>
            <label>
              City
              <input
                name="city"
                className="input"
                value={formValues.city}
                onChange={handleFieldChange}
              />
            </label>
          </div>
          <div>
            <label>
              State
              <input
                name="state"
                className="input"
                value={formValues.state}
                onChange={handleFieldChange}
              />
            </label>
          </div>
          <div>
            <label>
              Pincode
              <input
                name="pincode"
                className="input"
                value={formValues.pincode}
                onChange={handleFieldChange}
              />
            </label>
          </div>
          <div>
            <label>
              GST number
              <input
                name="gst_number"
                className="input"
                value={formValues.gst_number}
                onChange={handleFieldChange}
              />
            </label>
          </div>
          <div>
            <label>
              Rating
              <input
                name="rating"
                type="number"
                step="0.1"
                min="0"
                max="5"
                className="input"
                value={formValues.rating}
                onChange={handleFieldChange}
              />
            </label>
          </div>
          <div className="vendor-form__checkbox">
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
        <div className="vendor-form-actions">
          <button
            type="submit"
            className="btn-primary"
            disabled={saving}
          >
            {saving ? 'Saving…' : isEdit ? 'Update vendor' : 'Create vendor'}
          </button>
          {isEdit && (
            <button
              type="button"
              className="btn-secondary"
              onClick={handleDelete}
              disabled={saving}
            >
              Delete vendor
            </button>
          )}
        </div>
      </form>

      {isEdit && (
        <div className="vendor-products">
          <h2 className="vendor-products__title">
            Products from this vendor
          </h2>
          {loadingProducts && <p>Loading vendor products...</p>}
          {!loadingProducts && vendorProducts.length === 0 && (
            <p className="vendor-products__empty">No products found for this vendor.</p>
          )}
          {!loadingProducts && vendorProducts.length > 0 && (
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>SKU</th>
                    <th>Available</th>
                    <th>MRP (₹)</th>
                    <th>Offer price (₹)</th>
                    <th>Stock</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {vendorProducts.map((p) => (
                    <tr
                      key={
                        p.vendor_product_id ??
                        p.vendorProductId ??
                        p.product_id ??
                        p.productId
                      }
                    >
                      <td>{p.product_name ?? p.productName ?? p.productId}</td>
                      <td>{p.vendor_sku ?? p.vendorSku}</td>
                      <td>{(p.is_available ?? p.isAvailable) ? 'Yes' : 'No'}</td>
                      <td>{p.mrp != null ? Number(p.mrp).toFixed(2) : '-'}</td>
                      <td>
                        {p.final_price != null
                          ? Number(p.final_price).toFixed(2)
                          : (p.offer_price != null
                              ? Number(p.offer_price).toFixed(2)
                              : (p.finalPrice != null
                                  ? Number(p.finalPrice).toFixed(2)
                                  : '-'))}
                      </td>
                      <td>{p.stock_quantity ?? p.stockQuantity}</td>
                      <td>
                        <button
                          type="button"
                          className="link-button"
                          onClick={() => openVendorProductModal(p)}
                        >
                          Manage
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {vendorProductModalOpen && (
        <div className="vendor-product-modal-backdrop">
          <div className="vendor-product-modal">
            <h2 className="vendor-product-modal__title">Manage vendor product</h2>
            {vendorProductLoading && <p>Loading vendor product...</p>}
            {vendorProductError && !vendorProductLoading && (
              <p className="error-message">{vendorProductError}</p>
            )}
            {!vendorProductLoading && vendorProductDetail && (
              <form
                className="vendor-product-form"
                onSubmit={handleVendorProductSave}
              >
                <div className="vendor-product-form-grid">
                  <div>
                    <label>
                      Vendor SKU
                      <input
                        name="vendor_sku"
                        className="input"
                        value={vendorProductForm.vendor_sku}
                        onChange={handleVendorProductFieldChange}
                      />
                    </label>
                  </div>
                  <div>
                    <label>
                      Cost price (₹)
                      <input
                        name="cost_price"
                        type="number"
                        step="0.01"
                        min="0"
                        className="input"
                        value={vendorProductForm.cost_price}
                        onChange={handleVendorProductFieldChange}
                      />
                    </label>
                  </div>
                  <div>
                    <label>
                      MRP (₹)
                      <input
                        name="mrp"
                        type="number"
                        step="0.01"
                        min="0"
                        className="input"
                        value={vendorProductForm.mrp}
                        onChange={handleVendorProductFieldChange}
                      />
                    </label>
                  </div>
                  <div>
                    <label>
                      Discount (%)
                      <input
                        name="discount_percentage"
                        type="number"
                        step="0.01"
                        min="0"
                        className="input"
                        value={vendorProductForm.discount_percentage}
                        onChange={handleVendorProductFieldChange}
                      />
                    </label>
                  </div>
                  <div>
                    <label>
                      Minimum order quantity
                      <input
                        name="minimum_order_quantity"
                        type="number"
                        min="0"
                        className="input"
                        value={vendorProductForm.minimum_order_quantity}
                        onChange={handleVendorProductFieldChange}
                      />
                    </label>
                  </div>
                  <div>
                    <label>
                      Stock quantity
                      <input
                        name="stock_quantity"
                        type="number"
                        min="0"
                        className="input"
                        value={vendorProductForm.stock_quantity}
                        onChange={handleVendorProductFieldChange}
                      />
                    </label>
                  </div>
                  <div>
                    <label>
                      Expiry date
                      <input
                        name="expiry_date"
                        type="date"
                        className="input"
                        value={vendorProductForm.expiry_date}
                        onChange={handleVendorProductFieldChange}
                      />
                    </label>
                  </div>
                  <div className="vendor-product-form__checkbox">
                    <label>
                      <input
                        type="checkbox"
                        name="is_available"
                        checked={vendorProductForm.is_available}
                        onChange={handleVendorProductFieldChange}
                      />{' '}
                      Available
                    </label>
                  </div>
                  <div>
                    <label>
                      Delivery time (days)
                      <input
                        name="delivery_time_days"
                        type="number"
                        min="0"
                        className="input"
                        value={vendorProductForm.delivery_time_days}
                        onChange={handleVendorProductFieldChange}
                      />
                    </label>
                  </div>
                </div>
                <div className="vendor-product-form-actions">
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={vendorProductSaving}
                  >
                    {vendorProductSaving ? 'Saving…' : 'Save changes'}
                  </button>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={handleVendorProductModalClose}
                    disabled={vendorProductSaving}
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={handleVendorProductDelete}
                    disabled={vendorProductSaving}
                  >
                    Delete vendor product
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorDetailsPage;
