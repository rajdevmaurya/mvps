import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchData } from '../../apiClient';
import Pagination from '../../components/Pagination';
import './CustomersPage.css';

const CustomersPage = () => {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [customerType, setCustomerType] = useState('');
  const [status, setStatus] = useState('');
  const [city, setCity] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const navigate = useNavigate();

  const PAGE_SIZE = 20;

  const loadCustomers = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

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

      setCustomers(mapped);

      let itemsCount = list.length;
      let pagesCount = 1;
      const pagination = res?.pagination;
      if (pagination) {
        const totalItemsValue =
          typeof pagination.totalItems === 'number'
            ? pagination.totalItems
            : pagination.total_items;
        const totalPagesValue =
          typeof pagination.totalPages === 'number'
            ? pagination.totalPages
            : pagination.total_pages;

        if (typeof totalItemsValue === 'number') {
          itemsCount = totalItemsValue;
        }
        if (typeof totalPagesValue === 'number') {
          pagesCount = totalPagesValue;
        }
      }

      setTotalItems(itemsCount);
      setTotalPages(pagesCount || 1);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
      setError('Failed to load customers.');
    } finally {
      setLoading(false);
    }
  }, [page, customerType, status, city, search]);

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

  const goToNewCustomer = () => {
    navigate('/customers/new');
  };

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
      <h1 className="page-title">Customers</h1>
      <p className="page-subtitle">
        Manage patients and institutions and review their contact details.
      </p>

      <div className="toolbar customers-toolbar">
        <input
          type="search"
          className="input"
          placeholder="Search by name, email or phone"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="input"
          value={customerType}
          onChange={(e) => {
            setCustomerType(e.target.value);
            setPage(1);
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
            setPage(1);
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
            setCity(e.target.value);
            setPage(1);
          }}
        />
        <button
          type="button"
          className="btn-primary"
          onClick={goToNewCustomer}
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
        onPageChange={setPage}
      />
    </div>
  );
};

export default CustomersPage;
