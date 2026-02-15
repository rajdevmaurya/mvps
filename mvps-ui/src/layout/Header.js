import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { toggleSidebar } from '../store/slices/uiSlice';
import logo from '../assets/echo_logo.png';
import tokenManager from '../auth/tokenManager';
import './Header.css';

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
        tokenManager.clear();
      } catch (e) {
        // ignore
      }
      window.location.href = '/logout';
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
              title={isAuthenticated ? 'Logout' : 'Login'}
            >
              <svg className="auth-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {isAuthenticated ? (
                  <>
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </>
                ) : (
                  <>
                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                    <polyline points="10 17 15 12 10 7" />
                    <line x1="15" y1="12" x2="3" y2="12" />
                  </>
                )}
              </svg>
              {isAuthenticated ? 'Logout' : 'Login'}
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
