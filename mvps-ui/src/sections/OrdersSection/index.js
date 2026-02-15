import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import Breadcrumb from '../../components/Breadcrumb';
import './OrdersSection.css';

const OrdersSection = () => {
  const tabs = [
    { label: 'Order List', path: '/orders/list' },
  ];

  const breadcrumbs = [
    { label: 'Home', path: '/' },
    { label: 'Orders', path: '/orders', isLast: true }
  ];

  return (
    <div className="section-container">
      <div className="section-breadcrumb">
        <Breadcrumb items={breadcrumbs} />
      </div>
      <div className="section-header">
        <h1 className="section-title">Orders Management</h1>
        <p className="section-subtitle">
          View and manage customer orders and fulfillment
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

export default OrdersSection;
