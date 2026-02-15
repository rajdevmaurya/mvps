import React from 'react';
import { Outlet } from 'react-router-dom';
import './ProductsSection.css';

const ProductsSection = () => {
  return (
    <div className="section-container">
      <div className="section-content">
        <Outlet />
      </div>
    </div>
  );
};

export default ProductsSection;
