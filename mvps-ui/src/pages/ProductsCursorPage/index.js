import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchDataWithCursor } from '../../apiClient';
import CursorPagination from '../../components/CursorPagination';
import { useCursorPagination } from '../../hooks/useCursorPagination';
import './ProductsCursorPage.css';

const ProductsCursorPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const {
    currentCursor,
    hasNext,
    hasPrevious,
    pageSize,
    goToNext,
    goToPrevious,
    updatePaginationInfo,
    reset
  } = useCursorPagination(20);

  useEffect(() => {
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentCursor]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetchDataWithCursor(
        '/products',
        currentCursor,
        pageSize,
        { is_active: true }
      );

      setProducts(response.data || []);
      updatePaginationInfo(response);

    } catch (e) {
      console.error(e);
      setError('Failed to load products.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    // Reset pagination when searching
    reset();
    loadProducts();
  };

  return (
    <div className="page products-cursor-page container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Products Catalog (Cursor Pagination)</h1>
          <p className="page-subtitle">
            Demonstrating efficient cursor-based pagination for large datasets
          </p>
        </div>
        <button
          type="button"
          className="btn-secondary"
          onClick={() => navigate('/products')}
        >
          Back to Regular Products
        </button>
      </div>

      <div className="toolbar">
        <input
          type="search"
          className="input"
          placeholder="Search by product or generic name"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              handleSearch();
            }
          }}
        />
        <button
          type="button"
          className="btn-primary"
          onClick={handleSearch}
        >
          Search
        </button>
      </div>

      <div className="table-wrapper">
        {loading && <p>Loading products...</p>}
        {error && !loading && <p className="error-message">{error}</p>}

        {!loading && products.length === 0 && (
          <p className="info-message">No products found.</p>
        )}

        {products.length > 0 && (
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Product</th>
                <th>Generic Name</th>
                <th>Category</th>
                <th>Manufacturer</th>
                <th>Prescription</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => {
                const id = product.product_id || product.productId;
                return (
                  <tr key={id}>
                    <td>{id}</td>
                    <td>{product.product_name || product.productName}</td>
                    <td>{product.generic_name || product.genericName || '-'}</td>
                    <td>{product.category_name || product.categoryName || 'N/A'}</td>
                    <td>{product.manufacturer || '-'}</td>
                    <td>
                      {product.prescription_required || product.prescriptionRequired
                        ? 'Yes'
                        : 'No'}
                    </td>
                    <td>
                      <button
                        type="button"
                        className="link-button"
                        onClick={() => navigate(`/products/${id}`)}
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <CursorPagination
        hasNext={hasNext}
        hasPrevious={hasPrevious}
        onNext={goToNext}
        onPrevious={goToPrevious}
        loading={loading}
        itemCount={products.length}
        entityLabel="products"
      />
    </div>
  );
};

export default ProductsCursorPage;
