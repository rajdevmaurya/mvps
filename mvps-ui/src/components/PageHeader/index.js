import React from 'react';
import Breadcrumb from '../Breadcrumb';
import './PageHeader.css';

const PageHeader = ({ title, subtitle, children }) => {
  return (
    <div className="page-header">
      <Breadcrumb />
      <div className="page-header-main">
        <div className="page-header-left">
          <h1 className="page-header-title">{title}</h1>
          {subtitle && <p className="page-header-subtitle">{subtitle}</p>}
        </div>
        {children && <div className="page-header-right">{children}</div>}
      </div>
    </div>
  );
};

export default PageHeader;
