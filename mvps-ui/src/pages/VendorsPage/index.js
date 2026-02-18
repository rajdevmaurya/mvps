import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  setVendors,
  setPagination,
  setLoading,
  setError,
} from '../../store/slices/vendorsSlice';
import { fetchData } from '../../apiClient';
import Pagination from '../../components/Pagination';
import PageHeader from '../../components/PageHeader';
import './VendorsPage.css';

const VendorsPage = () => {
  const dispatch = useDispatch();
  const { list: vendors, pagination, loading, error } = useSelector(
    (state) => state.vendors,
  );
  const { page, totalPages, totalItems } = pagination;

  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const PAGE_SIZE = 20;

  const loadVendors = useCallback(async () => {
    try {
      dispatch(setLoading(true));
      dispatch(setError(null));

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

      dispatch(setVendors(rows));

      let itemsCount = vendorList.length;
      let pagesCount = 1;
      const paginationRes = vendorsRes?.pagination;
      if (paginationRes) {
        const totalItemsValue =
          typeof paginationRes.total_items === 'number'
            ? paginationRes.total_items
            : paginationRes.totalItems;
        const totalPagesValue =
          typeof paginationRes.total_pages === 'number'
            ? paginationRes.total_pages
            : paginationRes.totalPages;

        if (typeof totalItemsValue === 'number') {
          itemsCount = totalItemsValue;
        }
        if (typeof totalPagesValue === 'number') {
          pagesCount = totalPagesValue;
        }
      }

      dispatch(
        setPagination({
          page,
          totalItems: itemsCount,
          totalPages: pagesCount || 1,
        }),
      );

      if (!perfRes || !vendorsRes) {
        dispatch(setError('Some vendor performance data is currently unavailable.'));
      }
    } catch (e) {
      console.error(e);
      dispatch(setError('Failed to load vendors.'));
    } finally {
      dispatch(setLoading(false));
    }
  }, [page, dispatch]);

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

  const handlePageChange = (newPage) => {
    dispatch(setPagination({ page: newPage }));
  };

  return (
    <div className="page vendors-page container">
      <PageHeader title="Vendors" subtitle="Manage active suppliers and review their performance." />

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
            onClick={() => navigate('/vendors/products')}
          >
            Map Product to Vendor
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={() => navigate('/vendors/new')}
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
        onPageChange={handlePageChange}
      />
    </div>
  );
};

export default VendorsPage;
