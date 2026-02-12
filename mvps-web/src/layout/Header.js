import React, { useEffect, useState, useCallback } from 'react';
import { Link, NavLink } from 'react-router-dom';
import logo from '../assets/echo_logo.png';
import './Header.css';

const navLinks = [
  { path: '/', label: 'Dashboard', end: true },
  { path: '/vendors', label: 'Vendors', end: false },
  { path: '/products', label: 'Products', end: false },
  // ...existing code...
  { path: '/customers', label: 'Customers', end: false },
  { path: '/pricing', label: 'Pricing', end: false },
  { path: '/inventory', label: 'Inventory', end: false },
  { path: '/stock-history', label: 'Stock History', end: false },
  { path: '/vendor-orders', label: 'Vendor Orders', end: false },
  { path: '/orders', label: 'Orders', end: false },
  { path: '/search', label: 'Search', end: false },
  { path: '/reports', label: 'Reports', end: false },
];

const Header = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    let isMounted = true;

    const checkAuth = async () => {
      try {
        const response = await fetch('/me', {
          method: 'GET',
          credentials: 'include',
        });

        if (!isMounted) return;

        if (response.ok) {
          try {
            const data = await response.json();
            let name = '';

            if (typeof data === 'string') {
              name = data;
            } else if (data) {
              name = data.name || data.username || data.user_name || '';
            }

            const normalizedName = (name || '').trim().toUpperCase();

            if (!normalizedName || normalizedName === 'ANONYMOUS') {
              setIsAuthenticated(false);
              setUserName('');
            } else {
              setIsAuthenticated(true);
              setUserName(name);
            }
          } catch (e) {
            setIsAuthenticated(false);
            setUserName('');
          }
        } else {
          setIsAuthenticated(false);
          setUserName('');
        }
      } catch (e) {
        if (!isMounted) return;
        setIsAuthenticated(false);
        setUserName('');
      } finally {
        if (isMounted) {
          setCheckingAuth(false);
        }
      }
    };

    checkAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleAuthClick = useCallback(() => {
    if (isAuthenticated) {
      try {
        // Clear any locally stored auth tokens/state
        localStorage.removeItem('access_token');
        localStorage.removeItem('id_token');
        localStorage.removeItem('refresh_token');
        sessionStorage.clear();
      } catch (e) {
        // ignore storage errors during logout
      }

      window.location.href = '/logout';
    } else {
      window.location.href = '/oauth2/authorization/gateway';
    }
  }, [isAuthenticated]);

  return (
    <header className="header">
      <nav className="nav-extended transparent">
        <div className="top-nav">
          <div className="container nav-container">
            <Link to="/" className="brand-logo">
              <img src={logo} alt="MVPS - Echo Healthcare" />
              <span className="sr-only">MVPS - Echo Healthcare</span>
            </Link>
            <div className="nav-right">
              {isAuthenticated && userName && (
                <span className="user-greeting">Hi {userName}</span>
              )}
              {!checkingAuth && (
                <button
                  type="button"
                  className="auth-link"
                  onClick={handleAuthClick}
                >
                  {isAuthenticated ? 'Logout' : 'Login'}
                </button>
              )}
            </div>
          </div>
        </div>
        <div className="bottom-nav">
          <div className="container nav-container">
            <ul className="primary-menu">
              {navLinks.map(({ path, label, end }) => (
                <li key={path}>
                  <NavLink to={path} end={end}>
                    {label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header;
