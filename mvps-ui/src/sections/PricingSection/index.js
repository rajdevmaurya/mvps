import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import Breadcrumb from '../../components/Breadcrumb';
import './PricingSection.css';

const PricingSection = () => {
  const tabs = [
    { label: 'Price Lists', path: '/pricing/lists' },
  ];

  const breadcrumbs = [
    { label: 'Home', path: '/' },
    { label: 'Pricing', path: '/pricing', isLast: true }
  ];

  return (
    <div className="section-container">
      <div className="section-breadcrumb">
        <Breadcrumb items={breadcrumbs} />
      </div>
      <div className="section-header">
        <h1 className="section-title">Pricing Management</h1>
        <p className="section-subtitle">
          Manage product prices and customer-specific pricing tiers
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

export default PricingSection;
