import React from 'react';
import { Outlet } from 'react-router-dom';
import './CustomersSection.css';

const CustomersSection = () => {
  return (
    <div className="section-container">
      <div className="section-content">
        <Outlet />
      </div>
    </div>
  );
};

export default CustomersSection;
