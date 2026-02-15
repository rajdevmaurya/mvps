import React, { useEffect, useCallback } from 'react';
import { NavLink } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { toggleSidebar, setSidebarOpen, setIsMobile } from '../../store/slices/uiSlice';
import SidebarSection from './SidebarSection';
import './Sidebar.css';

const Sidebar = () => {
  const dispatch = useDispatch();
  const { sidebarOpen, isMobile } = useSelector((state) => state.ui);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      dispatch(setIsMobile(mobile));
      if (mobile) {
        dispatch(setSidebarOpen(false));
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [dispatch]);

  // Collapsible sections with sub-items
  const sections = [
    {
      title: 'Search',
      icon: '🔍',
      items: [
        { label: 'Product Search', path: '/search/products' },
        { label: 'Vendor Search', path: '/search/vendors' },
      ],
    },
    {
      title: 'Products',
      icon: '📦',
      items: [
        { label: 'Catalog', path: '/products/catalog' },
        { label: 'Cursor View', path: '/products/cursor' },
      ],
    },
    {
      title: 'Vendors',
      icon: '🏢',
      items: [
        { label: 'Vendor List', path: '/vendors/list' },
        { label: 'Vendor Products', path: '/vendors/products' },
        { label: 'Purchase Orders', path: '/vendors/orders' },
      ],
    },
    {
      title: 'Customers',
      icon: '👥',
      items: [{ label: 'Customer List', path: '/customers/list' }],
    },
    {
      title: 'Orders',
      icon: '🛒',
      items: [{ label: 'Order List', path: '/orders/list' }],
    },
    {
      title: 'Inventory',
      icon: '📊',
      items: [{ label: 'Stock Levels', path: '/inventory/stock' }],
    },
    {
      title: 'Pricing',
      icon: '💰',
      items: [{ label: 'Price Lists', path: '/pricing/lists' }],
    },
  ];

  // Single menu items (no sub-sections)
  const singleItems = [
    { label: 'Dashboard', icon: '🏠', path: '/dashboard' },
    { label: 'Analytics', icon: '📈', path: '/analytics' },
  ];

  const handleLogout = useCallback(() => {
    try {
      import('../../auth/tokenManager').then(mod => {
        try { mod.default.clear(); } catch (e) { /* ignore */ }
        window.location.href = '/logout';
      }).catch(() => {
        window.location.href = '/logout';
      });
    } catch (e) {
      window.location.href = '/logout';
    }
  }, []);

  return (
    <>
      {isMobile && sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => dispatch(toggleSidebar())}
        />
      )}
      <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <h2 className="sidebar-logo">MVPS</h2>
        </div>
        <nav className="sidebar-nav">
          <ul className="sidebar-menu">
            {singleItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `sidebar-menu-item ${isActive ? 'active' : ''}`
                  }
                  end
                >
                  <span className="sidebar-menu-icon">{item.icon}</span>
                  <span className="sidebar-menu-label">{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
          {sections.map((section) => (
            <SidebarSection key={section.title} {...section} />
          ))}
        </nav>
        <div className="sidebar-footer">
          <button
            type="button"
            className="sidebar-logout-btn"
            onClick={handleLogout}
            title="Logout"
          >
            <svg className="logout-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Logout
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
