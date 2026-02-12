import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import './Layout.css';
import { useEffect } from 'react';

// try refreshing access token into memory on app start
import tokenManager from '../auth/tokenManager';

const Layout = () => {
  useEffect(() => {
    let mounted = true;
    tokenManager.refresh().catch(() => {
      // ignore refresh errors; user will be redirected to login when needed
      if (!mounted) return;
    });
    return () => { mounted = false; };
  }, []);
  return (
    <>
      <Header />
      <main className="app-main">
        <Outlet />
      </main>
      <Footer />
    </>
  );
};

export default Layout;
