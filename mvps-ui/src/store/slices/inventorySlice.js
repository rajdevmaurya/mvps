import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  items: [],
  filters: {
    productId: null,
    warehouseId: null,
    lowStock: false,
    search: '',
  },
  loading: false,
  error: null,
};

const inventorySlice = createSlice({
  name: 'inventory',
  initialState,
  reducers: {
    setItems: (state, action) => {
      state.items = action.payload;
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
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
  setItems,
  setFilters,
  setLoading,
  setError,
} = inventorySlice.actions;

export default inventorySlice.reducer;
