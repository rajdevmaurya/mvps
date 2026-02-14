import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchData } from '../../apiClient';
import Pagination from '../../components/Pagination';
import './VendorsPage.css';

const VendorsPage = () => {
  const [search, setSearch] = useState('');
  const [vendors, setVendors] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const PAGE_SIZE = 20;

  const loadVendors = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const [perfResult, vendorsResult] = await Promise.allSettled([
        fetchData('/vendors/performance'),
        fetchData('/vendors', { is_active: true, page, limit: PAGE_SIZE }),
      ]);

      const perfRes = perfResult.status === 'fulfilled' ? perfResult.value : null;
      const vendorsRes = vendorsResult.status === 'fulfilled' ? vendorsResult.value : null;

      const perfList = perfRes?.data || [];
      const vendorList = vendorsRes?.data || [];

      const perfByVendorId = new Map();
      perfList.forEach((p) => {
        if (!p) return;
        const id = p.vendor_id ?? p.vendorId;
        if (typeof id === 'number') {
          perfByVendorId.set(id, p);
        }
      });

      const rows = vendorList
        .map((v) => {
          if (!v) return null;
          const vendorId = v.vendor_id ?? v.vendorId;
          if (typeof vendorId !== 'number') return null;

          const perf = perfByVendorId.get(vendorId) || {};

          return {
            id: vendorId,
            vendorName:
              perf.vendor_name ??
              perf.vendorName ??
              v.vendor_name ??
              v.vendorName,
            city: v.city || '',
            state: v.state || '',
            totalProducts:
              perf.total_products ?? perf.totalProducts ?? null,
            totalStock: perf.total_stock ?? perf.totalStock ?? null,
            averagePrice: perf.avg_price ?? perf.avgPrice ?? null,
            timesCheapest:
              perf.products_with_lowest_price ??
              perf.productsWithLowestPrice ?? null,
            isActive:
              typeof (v.is_active ?? v.isActive) === 'boolean'
                ? v.is_active ?? v.isActive
                : true,
          };
        })
        .filter(Boolean);

      setVendors(rows);

      // Update pagination info from vendors response
      let itemsCount = vendorList.length;
      let pagesCount = 1;
      const pagination = vendorsRes?.pagination;
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

      if (!perfRes || !vendorsRes) {
        setError('Some vendor performance data is currently unavailable.');
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
      setError('Failed to load vendors.');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    loadVendors();
  }, [loadVendors]);

  const filteredVendors = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return vendors;
    return vendors.filter((v) =>
      [v.vendorName, v.city, v.state]
        .filter(Boolean)
        .some((field) => field.toLowerCase().includes(term)),
    );
  }, [search, vendors]);

  const goToNewVendor = () => {
    navigate('/vendors/new');
  };

  const goToMapProductVendor = () => {
    navigate('/map-product-vendor');
  };

  return (
    <div className="page vendors-page container">
      <h1 className="page-title">Vendors</h1>
      <p className="page-subtitle">
        Manage active suppliers and review their performance.
      </p>

      <div className="toolbar">
        <input
          type="search"
          className="input"
          placeholder="Search by vendor, city or state"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div style={{ display: 'flex', gap: 'var(--spacing-3)', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={goToMapProductVendor}
          >
            Map Product to Vendor
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={goToNewVendor}
          >
            + Add vendor
          </button>
        </div>
      </div>

      <div className="table-wrapper">
        {loading && <p>Loading vendors...</p>}
        {error && !loading && <p className="error-message">{error}</p>}
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>City</th>
              <th>State</th>
              <th>Total Products</th>
              <th>Total Stock</th>
              <th>Avg. Price (₹)</th>
              <th>Times Cheapest</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredVendors.map((v, index) => (
              <tr key={v.id ?? `vendor-${index}`}>
                <td>{v.vendorName}</td>
                <td>{v.city}</td>
                <td>{v.state}</td>
                <td>{v.totalProducts}</td>
                <td>{v.totalStock}</td>
                <td>
                  {v.averagePrice != null ? v.averagePrice.toFixed(2) : '-'}
                </td>
                <td>{v.timesCheapest}</td>
                <td>{v.isActive ? 'Active' : 'Inactive'}</td>
                <td>
                  <button
                    type="button"
                    className="link-button"
                    onClick={() => navigate(`/vendors/${v.id}`)}
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
        entityLabel="vendors"
        onPageChange={setPage}
      />
    </div>
  );
};

export default VendorsPage;
