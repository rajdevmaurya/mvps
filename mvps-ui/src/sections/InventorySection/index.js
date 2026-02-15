import React from 'react';
import { Outlet } from 'react-router-dom';
import './InventorySection.css';

const InventorySection = () => {
  return (
    <div className="section-container">
      <div className="section-content">
        <Outlet />
      </div>
    </div>
  );
};

export default InventorySection;
