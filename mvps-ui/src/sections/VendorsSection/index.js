import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import Breadcrumb from '../../components/Breadcrumb';
import './VendorsSection.css';

const VendorsSection = () => {
  const tabs = [
    { label: 'Vendor List', path: '/vendors/list' },
    { label: 'Vendor Products', path: '/vendors/products' },
    { label: 'Purchase Orders', path: '/vendors/orders' },
  ];

  const breadcrumbs = [
    { label: 'Home', path: '/' },
    { label: 'Vendors', path: '/vendors', isLast: true }
  ];

  return (
    <div className="section-container">
      <div className="section-breadcrumb">
        <Breadcrumb items={breadcrumbs} />
      </div>
      <div className="section-header">
        <h1 className="section-title">Vendors Management</h1>
        <p className="section-subtitle">
          Manage vendors, their products, and purchase orders
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

export default VendorsSection;
