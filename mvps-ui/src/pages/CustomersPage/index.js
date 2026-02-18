import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  setCustomers,
  setFilters,
  setPagination,
  setLoading,
  setError,
} from '../../store/slices/customersSlice';
import { fetchData } from '../../apiClient';
import Pagination from '../../components/Pagination';
import PageHeader from '../../components/PageHeader';
import './CustomersPage.css';

const CustomersPage = () => {
  const dispatch = useDispatch();
  const { list: customers, filters, pagination, loading, error } = useSelector(
    (state) => state.customers,
  );
  const { page, totalPages, totalItems } = pagination;
  const { customerType, city, search } = filters;

  const [status, setStatus] = useState('');

  const navigate = useNavigate();

  const PAGE_SIZE = 20;

  const loadCustomers = useCallback(async () => {
    try {
      dispatch(setLoading(true));
      dispatch(setError(null));

      const isActiveParam =
        status === 'active' ? true : status === 'inactive' ? false : undefined;

      const res = await fetchData('/customers', {
        customer_type: customerType || undefined,
        is_active: isActiveParam,
        city: city || undefined,
        search: search || undefined,
        page,
        limit: PAGE_SIZE,
      });

      const list = res?.data || [];
      const mapped = list.map((c) => ({
        id: c.customerId ?? c.customer_id,
        name: c.customerName ?? c.customer_name,
        email: c.email || '',
        phone: c.phone || '',
        city: c.city || '',
        state: c.state || '',
        type: c.customerType ?? c.customer_type ?? '',
        isActive:
          typeof (c.isActive ?? c.is_active) === 'boolean'
            ? c.isActive ?? c.is_active
            : true,
        registrationDate: c.registrationDate ?? c.registration_date,
      }));

      dispatch(setCustomers(mapped));

      let itemsCount = list.length;
      let pagesCount = 1;
      const paginationRes = res?.pagination;
      if (paginationRes) {
        const totalItemsValue =
          typeof paginationRes.totalItems === 'number'
            ? paginationRes.totalItems
            : paginationRes.total_items;
        const totalPagesValue =
          typeof paginationRes.totalPages === 'number'
            ? paginationRes.totalPages
            : paginationRes.total_pages;

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
    } catch (e) {
      console.error(e);
      dispatch(setError('Failed to load customers.'));
    } finally {
      dispatch(setLoading(false));
    }
  }, [page, customerType, status, city, search, dispatch]);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  const filteredCustomers = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return customers;
    return customers.filter((c) =>
      [c.name, c.email, c.phone, c.city, c.state]
        .filter(Boolean)
        .some((field) => field.toLowerCase().includes(term)),
    );
  }, [customers, search]);

  const formatDate = (value) => {
    if (!value) return '';
    try {
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return '';
      return date.toLocaleDateString();
    } catch (e) {
      return '';
    }
  };

  return (
    <div className="page customers-page container">
      <PageHeader title="Customers" subtitle="Manage patients and institutions and review their contact details." />

      <div className="toolbar customers-toolbar">
        <input
          type="search"
          className="input"
          placeholder="Search by name, email or phone"
          value={search}
          onChange={(e) => dispatch(setFilters({ search: e.target.value }))}
        />
        <select
          className="input"
          value={customerType}
          onChange={(e) => {
            dispatch(setFilters({ customerType: e.target.value }));
            dispatch(setPagination({ page: 1 }));
          }}
        >
          <option value="">All types</option>
          <option value="retail">Retail</option>
          <option value="wholesale">Wholesale</option>
          <option value="institution">Institution</option>
        </select>
        <select
          className="input"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            dispatch(setPagination({ page: 1 }));
          }}
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <input
          type="search"
          className="input"
          placeholder="Filter by city"
          value={city}
          onChange={(e) => {
            dispatch(setFilters({ city: e.target.value }));
            dispatch(setPagination({ page: 1 }));
          }}
        />
        <button
          type="button"
          className="btn-primary"
          onClick={() => navigate('/customers/new')}
        >
          + Add customer
        </button>
      </div>

      <div className="table-wrapper">
        {loading && <p>Loading customers...</p>}
        {error && !loading && <p className="error-message">{error}</p>}
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Email</th>
              <th>Phone</th>
              <th>City</th>
              <th>State</th>
              <th>Registered</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCustomers.map((c, index) => (
              <tr key={c.id ?? `customer-${index}`}>
                <td>{c.name}</td>
                <td>{c.type || '-'}</td>
                <td>{c.email || '-'}</td>
                <td>{c.phone || '-'}</td>
                <td>{c.city || '-'}</td>
                <td>{c.state || '-'}</td>
                <td>{formatDate(c.registrationDate) || '-'}</td>
                <td>{c.isActive ? 'Active' : 'Inactive'}</td>
                <td>
                  <button
                    type="button"
                    className="link-button"
                    onClick={() => navigate(`/customers/${c.id}`)}
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
        entityLabel="customers"
        onPageChange={(newPage) => dispatch(setPagination({ page: newPage }))}
      />
    </div>
  );
};

export default CustomersPage;
