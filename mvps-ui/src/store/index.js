import { configureStore } from '@reduxjs/toolkit';
import productsReducer from './slices/productsSlice';
import vendorsReducer from './slices/vendorsSlice';
import customersReducer from './slices/customersSlice';
import ordersReducer from './slices/ordersSlice';
import inventoryReducer from './slices/inventorySlice';
import pricingReducer from './slices/pricingSlice';
import uiReducer from './slices/uiSlice';

export const store = configureStore({
  reducer: {
    products: productsReducer,
    vendors: vendorsReducer,
    customers: customersReducer,
    orders: ordersReducer,
    inventory: inventoryReducer,
    pricing: pricingReducer,
    ui: uiReducer,
  },
  devTools: process.env.NODE_ENV !== 'production',
});
