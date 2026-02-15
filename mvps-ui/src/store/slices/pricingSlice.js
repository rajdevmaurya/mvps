import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  lists: [],
  filters: {
    productId: null,
    customerType: '',
    search: '',
  },
  loading: false,
  error: null,
};

const pricingSlice = createSlice({
  name: 'pricing',
  initialState,
  reducers: {
    setLists: (state, action) => {
      state.lists = action.payload;
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
  setLists,
  setFilters,
  setLoading,
  setError,
} = pricingSlice.actions;

export default pricingSlice.reducer;
