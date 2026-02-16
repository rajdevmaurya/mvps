import React from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import './Breadcrumb.css';

// Route config: maps path patterns to breadcrumb labels and parent paths
const ROUTE_CONFIG = {
  '/dashboard': { label: 'Dashboard' },

  // Search
  '/search/products': { label: 'Product Search', parent: '/dashboard' },
  '/search/vendors': { label: 'Vendor Search', parent: '/dashboard' },

  // Products
  '/products': { label: 'Products', parent: '/dashboard' },
  '/products/catalog': { label: 'Product Catalog', parent: '/products' },
  '/products/new': { label: 'New Product', parent: '/products/catalog' },
  '/products/:productId': { label: 'Product Details', parent: '/products/catalog' },
  '/products/:productId/lowest-price': { label: 'Lowest Price', parent: '/products/:productId' },

  // Vendors
  '/vendors': { label: 'Vendors', parent: '/dashboard' },
  '/vendors/list': { label: 'Vendor List', parent: '/vendors' },
  '/vendors/products': { label: 'Vendor Product Mapping', parent: '/vendors' },
  '/vendors/orders': { label: 'Purchase Orders', parent: '/vendors' },
  '/vendors/new': { label: 'New Vendor', parent: '/vendors/list' },
  '/vendors/:vendorId': { label: 'Vendor Details', parent: '/vendors/list' },

  // Customers
  '/customers': { label: 'Customers', parent: '/dashboard' },
  '/customers/list': { label: 'Customer List', parent: '/customers' },
  '/customers/new': { label: 'New Customer', parent: '/customers/list' },
  '/customers/:customerId': { label: 'Customer Details', parent: '/customers/list' },

  // Orders
  '/orders': { label: 'Orders', parent: '/dashboard' },
  '/orders/list': { label: 'Order List', parent: '/orders' },
  '/orders/new': { label: 'New Order', parent: '/orders/list' },
  '/orders/:orderId': { label: 'Order Details', parent: '/orders/list' },
  '/orders/:orderId/status': { label: 'Order Status', parent: '/orders/:orderId' },
  '/orders/:orderId/payment-status': { label: 'Payment Status', parent: '/orders/:orderId' },

  // Order Items
  '/order-items/:orderItemId': { label: 'Order Item Details', parent: '/orders/list' },

  // Inventory
  '/inventory': { label: 'Inventory', parent: '/dashboard' },
  '/inventory/stock': { label: 'Stock Levels', parent: '/inventory' },
  '/stock-history': { label: 'Stock History', parent: '/inventory/stock' },

  // Pricing
  '/pricing': { label: 'Pricing', parent: '/dashboard' },
  '/pricing/lists': { label: 'Price Lists', parent: '/pricing' },

  // Categories
  '/categories/new': { label: 'New Category', parent: '/products/catalog' },
  '/categories/:categoryId': { label: 'Category Details', parent: '/products/catalog' },

  // Analytics
  '/analytics': { label: 'Analytics & Reports', parent: '/dashboard' },
};

// Match a real path to a route pattern, e.g. /products/42 -> /products/:productId
const matchRoute = (pathname, params) => {
  // Try exact match first
  if (ROUTE_CONFIG[pathname]) return pathname;

  // Try replacing known param values with their param names
  for (const pattern of Object.keys(ROUTE_CONFIG)) {
    const patternParts = pattern.split('/');
    const pathParts = pathname.split('/');

    if (patternParts.length !== pathParts.length) continue;

    let match = true;
    for (let i = 0; i < patternParts.length; i++) {
      if (patternParts[i].startsWith(':')) continue;
      if (patternParts[i] !== pathParts[i]) {
        match = false;
        break;
      }
    }
    if (match) return pattern;
  }

  return null;
};

// Replace :param placeholders in a path pattern with real values
const resolvePattern = (pattern, params) => {
  return pattern.replace(/:(\w+)/g, (_, key) => params[key] || key);
};

const Breadcrumb = () => {
  const location = useLocation();
  const params = useParams();
  const pathname = location.pathname;

  // Don't show breadcrumb on dashboard
  if (pathname === '/dashboard' || pathname === '/') return null;

  const matchedPattern = matchRoute(pathname, params);
  if (!matchedPattern) return null;

  // Build breadcrumb chain by walking up the parent tree
  const crumbs = [];
  let currentPattern = matchedPattern;

  while (currentPattern && ROUTE_CONFIG[currentPattern]) {
    const config = ROUTE_CONFIG[currentPattern];
    crumbs.unshift({
      label: config.label,
      path: resolvePattern(currentPattern, params),
      pattern: currentPattern,
    });
    currentPattern = config.parent || null;
  }

  // Always prepend Home
  crumbs.unshift({ label: 'Home', path: '/dashboard', pattern: '/' });

  if (crumbs.length <= 1) return null;

  return (
    <nav className="breadcrumb" aria-label="Breadcrumb">
      <ul>
        {crumbs.map((crumb, index) => (
          <li key={crumb.path + index}>
            {index === crumbs.length - 1 ? (
              <span aria-current="page">{crumb.label}</span>
            ) : (
              <Link to={crumb.path}>{crumb.label}</Link>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default Breadcrumb;
