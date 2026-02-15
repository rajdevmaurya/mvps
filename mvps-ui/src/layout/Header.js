import React, { useEffect, useState, useCallback } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { toggleSidebar } from '../store/slices/uiSlice';
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
  { path: '/analytics', label: 'Analytics', end: false },
];

const Header = () => {
  const dispatch = useDispatch();
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
                      // anonymous - redirect to login
                      try {
                        if (!window.location.pathname.startsWith('/oauth2')) {
                          window.location.href = '/oauth2/authorization/gateway';
                        }
                      } catch (e) {
                        // ignore in SSR or test env
                      }
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
        // clear in-memory token and server refresh cookie
        import('../auth/tokenManager').then(mod => {
          try { mod.default.clear(); } catch (e) { /* ignore */ }
          // continue logout via OIDC
          window.location.href = '/logout';
        }).catch(() => {
          window.location.href = '/logout';
        });
      } catch (e) {
        window.location.href = '/logout';
      }
    } else {
      window.location.href = '/oauth2/authorization/gateway';
    }
  }, [isAuthenticated]);

  return (
    <header className="header">
      <div className="header-container">
        <button
          className="menu-toggle-btn"
          onClick={() => dispatch(toggleSidebar())}
          aria-label="Toggle sidebar menu"
          type="button"
        >
          ☰
        </button>
        <Link to="/" className="brand-logo">
          <img src={logo} alt="MVPS - Echo Healthcare" />
          <span className="sr-only">MVPS - Echo Healthcare</span>
        </Link>
        <div className="header-actions">
          {isAuthenticated && userName && (
            <span className="user-greeting">Hi, {userName}</span>
          )}
          {!checkingAuth && (
            <button
              type="button"
              className="auth-button"
              onClick={handleAuthClick}
            >
              {isAuthenticated ? 'Logout' : 'Login'}
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
