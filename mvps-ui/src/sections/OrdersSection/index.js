import React from 'react';
import { Outlet } from 'react-router-dom';
import './OrdersSection.css';

const OrdersSection = () => {
  return (
    <div className="section-container">
      <div className="section-content">
        <Outlet />
      </div>
    </div>
  );
};

export default OrdersSection;
