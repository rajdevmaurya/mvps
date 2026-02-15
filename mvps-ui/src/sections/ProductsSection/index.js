import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import Breadcrumb from '../../components/Breadcrumb';
import './ProductsSection.css';

const ProductsSection = () => {
  const tabs = [
    { label: 'Catalog', path: '/products/catalog' },
    { label: 'Cursor View', path: '/products/cursor' },
  ];

  const breadcrumbs = [
    { label: 'Home', path: '/' },
    { label: 'Products', path: '/products', isLast: true }
  ];

  return (
    <div className="section-container">
      <div className="section-breadcrumb">
        <Breadcrumb items={breadcrumbs} />
      </div>
      <div className="section-header">
        <h1 className="section-title">Products Management</h1>
        <p className="section-subtitle">
          Manage your product catalog with regular or cursor pagination
        </p>
      </div>

      <div className="section-tabs">
        {tabs.map((tab) => (
          <NavLink
            key={tab.path}
            to={tab.path}
            className={({ isActive }) =>
              `section-tab ${isActive ? 'active' : ''}`
            }
          >
            {tab.label}
          </NavLink>
        ))}
      </div>

      <div className="section-content">
        <Outlet />
      </div>
    </div>
  );
};

export default ProductsSection;
