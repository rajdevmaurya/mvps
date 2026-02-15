import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  list: [],
  filters: {
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
  selectedVendor: null,
  loading: false,
  error: null,
};

const vendorsSlice = createSlice({
  name: 'vendors',
  initialState,
  reducers: {
    setVendors: (state, action) => {
      state.list = action.payload;
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    setPagination: (state, action) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },
    setSelectedVendor: (state, action) => {
      state.selectedVendor = action.payload;
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
  setVendors,
  setFilters,
  setPagination,
  setSelectedVendor,
  setLoading,
  setError,
} = vendorsSlice.actions;

export default vendorsSlice.reducer;
