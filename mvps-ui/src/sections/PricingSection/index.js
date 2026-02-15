import React from 'react';
import { Outlet } from 'react-router-dom';
import './PricingSection.css';

const PricingSection = () => {
  return (
    <div className="section-container">
      <div className="section-content">
        <Outlet />
      </div>
    </div>
  );
};

export default PricingSection;
