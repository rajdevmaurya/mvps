import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';

const SidebarSection = ({ title, icon, items }) => {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="sidebar-section">
      <button
        className="sidebar-section-header"
        onClick={() => setExpanded(!expanded)}
      >
        <span className="sidebar-section-icon">{icon}</span>
        <span className="sidebar-section-title">{title}</span>
        <span className="sidebar-section-arrow">{expanded ? '▼' : '▶'}</span>
      </button>
      {expanded && (
        <div className="sidebar-section-items">
          {items.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `sidebar-item ${isActive ? 'active' : ''}`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
};

export default SidebarSection;
