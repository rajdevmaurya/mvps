import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  list: [],
  filters: {
    categoryId: null,
    isActive: true,
    prescriptionRequired: null,
    search: '',
  },
  pagination: {
    page: 1,
    limit: 20,
    totalPages: 0,
    totalItems: 0,
  },
  selectedProduct: null,
  loading: false,
  error: null,
};

const productsSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    setProducts: (state, action) => {
      state.list = action.payload;
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    setPagination: (state, action) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },
    setSelectedProduct: (state, action) => {
      state.selectedProduct = action.payload;
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
  setProducts,
  setFilters,
  setPagination,
  setSelectedProduct,
  setLoading,
  setError,
} = productsSlice.actions;

export default productsSlice.reducer;
