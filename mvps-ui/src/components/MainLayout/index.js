import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import Sidebar from '../Sidebar';
import Header from '../../layout/Header';
import Footer from '../../layout/Footer';
import { toggleSidebar } from '../../store/slices/uiSlice';
import tokenManager from '../../auth/tokenManager';
import './MainLayout.css';

const MainLayout = () => {
  const dispatch = useDispatch();
  const { sidebarOpen, isMobile } = useSelector((state) => state.ui);

  // Try refreshing access token on mount (from original Layout)
  useEffect(() => {
    let mounted = true;
    tokenManager.refresh().catch(() => {
      if (!mounted) return;
    });
    return () => { mounted = false; };
  }, []);

  return (
    <>
      <Header />
      <div className="main-layout">
        <Sidebar />
        <div className={`main-content ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
          {isMobile && (
            <div className="mobile-header">
              <button
                className="mobile-menu-toggle"
                onClick={() => dispatch(toggleSidebar())}
              >
                ☰
              </button>
              <h1 className="mobile-logo">MVPS</h1>
            </div>
          )}
          <main className="app-main">
            <div className="content-wrapper">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default MainLayout;
