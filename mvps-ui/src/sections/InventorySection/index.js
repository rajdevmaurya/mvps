import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import Breadcrumb from '../../components/Breadcrumb';
import './InventorySection.css';

const InventorySection = () => {
  const tabs = [
    { label: 'Stock Levels', path: '/inventory/stock' },
  ];

  const breadcrumbs = [
    { label: 'Home', path: '/' },
    { label: 'Inventory', path: '/inventory', isLast: true }
  ];

  return (
    <div className="section-container">
      <div className="section-breadcrumb">
        <Breadcrumb items={breadcrumbs} />
      </div>
      <div className="section-header">
        <h1 className="section-title">Inventory & Stock Management</h1>
        <p className="section-subtitle">
          Monitor stock levels and manage warehouse inventory
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

export default InventorySection;
