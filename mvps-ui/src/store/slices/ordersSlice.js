import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  list: [],
  filters: {
    customerId: null,
    status: '',
    paymentStatus: '',
    search: '',
  },
  pagination: {
    page: 1,
    limit: 20,
    totalPages: 0,
    totalItems: 0,
  },
  selectedOrder: null,
  loading: false,
  error: null,
};

const ordersSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    setOrders: (state, action) => {
      state.list = action.payload;
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    setPagination: (state, action) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },
    setSelectedOrder: (state, action) => {
      state.selectedOrder = action.payload;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
  },
});

export const {
  setOrders,
  setFilters,
  setPagination,
  setSelectedOrder,
  setLoading,
  setError,
} = ordersSlice.actions;

export default ordersSlice.reducer;
