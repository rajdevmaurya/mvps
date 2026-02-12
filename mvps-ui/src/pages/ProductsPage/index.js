import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchData } from '../../apiClient';
import Pagination from '../../components/Pagination';
import './ProductsPage.css';
// No extra styling import

const ProductsPage = () => {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [products, setProducts] = useState([]);
  const [lowestPriceProducts, setLowestPriceProducts] = useState([]);
  const [categories, setCategories] = useState(['all']);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const navigate = useNavigate();

  const PAGE_SIZE = 20;

  useEffect(() => {
    async function loadProducts() {
      try {
        setLoading(true);
        setError('');

        const [productsResult, lowestResult, categoriesResult] =
          await Promise.allSettled([
            fetchData('/products', {
              is_active: true,
              page,
              limit: PAGE_SIZE,
            }),
            fetchData('/vendor-products/lowest-prices'),
            fetchData('/categories'),
          ]);

        const productsRes =
          productsResult.status === 'fulfilled' ? productsResult.value : null;
        const lowestRes =
          lowestResult.status === 'fulfilled' ? lowestResult.value : null;
        const categoriesRes =
          categoriesResult.status === 'fulfilled' ? categoriesResult.value : null;

        const productsData = productsRes?.data || [];
        const lowestData = lowestRes?.data || [];
        const categoriesData = categoriesRes?.data || [];

        const categoryMap = new Map();
        categoriesData.forEach((c) => {
          if (!c) return;
          const id = c.category_id ?? c.categoryId;
          const name = c.category_name ?? c.categoryName;
          if (id && name) {
            categoryMap.set(id, name);
          }
        });

        const mappedProducts = productsData.map((p) => {
          const id = p.product_id ?? p.productId;
          const categoryId = p.category_id ?? p.categoryId;
          return {
            id,
            productName: p.product_name ?? p.productName,
            genericName: p.generic_name ?? p.genericName ?? '',
            category:
              (categoryId && categoryMap.get(categoryId)) || 'Uncategorized',
            manufacturer: p.manufacturer || '',
            prescriptionRequired: Boolean(
              p.prescription_required ?? p.prescriptionRequired,
            ),
          };
        });

        const mappedLowest = lowestData.map((item) => ({
          productId: item.product_id ?? item.productId,
          productName: item.product_name ?? item.productName,
          vendorId: item.vendor_id ?? item.vendorId,
          vendorName: item.vendor_name ?? item.vendorName,
          finalPrice: item.final_price ?? item.finalPrice,
          stockQuantity: item.stock_quantity ?? item.stockQuantity,
        }));

        const uniqueCategories = Array.from(
          new Set(mappedProducts.map((p) => p.category)),
        ).sort();

        setProducts(mappedProducts);
        setLowestPriceProducts(mappedLowest);
        setCategories(['all', ...uniqueCategories]);

        // Update pagination info for UI controls
        let itemsCount = productsData.length;
        let pagesCount = 1;
        const pagination = productsRes?.pagination;
        if (pagination) {
          const totalItemsValue =
            typeof pagination.total_items === 'number'
              ? pagination.total_items
              : pagination.totalItems;
          const totalPagesValue =
            typeof pagination.total_pages === 'number'
              ? pagination.total_pages
              : pagination.totalPages;

          if (typeof totalItemsValue === 'number') {
            itemsCount = totalItemsValue;
          }
          if (typeof totalPagesValue === 'number') {
            pagesCount = totalPagesValue;
          }
        }

        setTotalItems(itemsCount);
        setTotalPages(pagesCount || 1);

        if (!productsRes) {
          setError('Failed to load products list.');
        } else if (!lowestRes || !categoriesRes) {
          setError('Some product helper data is currently unavailable.');
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error(e);
        setError('Failed to load products.');
      } finally {
        setLoading(false);
      }
    }

    loadProducts();
  }, [page]);

  const rows = useMemo(() => {
    return products.map((p) => ({
      ...p,
      lowest: lowestPriceProducts.find((l) => l.productId === p.id) || null,
    }));
  }, [products, lowestPriceProducts]);

  const filteredRows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return rows.filter((row) => {
      const matchesCategory =
        categoryFilter === 'all' || row.category === categoryFilter;
      const matchesSearch =
        !term ||
        row.productName.toLowerCase().includes(term) ||
        row.genericName.toLowerCase().includes(term);
      return matchesCategory && matchesSearch;
    });
  }, [rows, search, categoryFilter]);

  const goToNewProduct = () => {
    navigate('/products/new');
  };

  // ...existing code...

  return (
    <div className="page products-page container">
      <h1 className="page-title">Products Catalog</h1>
      <p className="page-subtitle">
        Master list of products with lowest price vendor.
      </p>
      <div className="toolbar toolbar--two-column products-toolbar">
        <div className="products-toolbar__filters">
          <input
            type="search"
            className="input"
            placeholder="Search by product or generic name"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="input"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat === 'all' ? 'All categories' : cat}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          className="btn-primary"
          onClick={goToNewProduct}
        >
          + Add product
        </button>
      </div>
      <div className="table-wrapper">
        {loading && <p>Loading products...</p>}
        {error && !loading && <p className="error-message">{error}</p>}
        <table className="table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Generic</th>
              <th>Category</th>
              <th>Manufacturer</th>
              <th>Prescription</th>
              <th>Lowest Price (₹)</th>
              <th>Best Vendor</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((row) => (
              <tr key={row.id}>
                <td>{row.productName}</td>
                <td>{row.genericName}</td>
                <td>{row.category}</td>
                <td>{row.manufacturer}</td>
                <td>{row.prescriptionRequired ? 'Yes' : 'No'}</td>
                <td>{row.lowest ? row.lowest.finalPrice.toFixed(2) : '-'}</td>
                <td>{row.lowest ? row.lowest.vendorName : '-'}</td>
                <td>
                  <button
                    type="button"
                    className="link-button"
                    onClick={() => navigate(`/products/${row.id}`)}
                  >
                    Manage
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination
        page={page}
        totalPages={totalPages}
        totalItems={totalItems}
        pageSize={PAGE_SIZE}
        entityLabel="products"
        onPageChange={setPage}
      />
    </div>
  );
};

export default ProductsPage;
