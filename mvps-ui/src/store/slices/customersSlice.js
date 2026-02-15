import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  list: [],
  filters: {
    customerType: '',
    isActive: true,
    city: '',
    search: '',
  },
  pagination: {
    page: 1,
    limit: 20,
    totalPages: 0,
    totalItems: 0,
  },
  selectedCustomer: null,
  loading: false,
  error: null,
};

const customersSlice = createSlice({
  name: 'customers',
  initialState,
  reducers: {
    setCustomers: (state, action) => {
      state.list = action.payload;
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    setPagination: (state, action) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },
    setSelectedCustomer: (state, action) => {
      state.selectedCustomer = action.payload;
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
  setCustomers,
  setFilters,
  setPagination,
  setSelectedCustomer,
  setLoading,
  setError,
} = customersSlice.actions;

export default customersSlice.reducer;
