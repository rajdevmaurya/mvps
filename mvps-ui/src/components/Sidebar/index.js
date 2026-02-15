import React, { useEffect } from 'react';
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
    { label: 'Dashboard', icon: '🏠', path: '/' },
    { label: 'Analytics', icon: '📈', path: '/analytics' },
  ];

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
                  end={item.path === '/'}
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
      </aside>
    </>
  );
};

export default Sidebar;
