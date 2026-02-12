import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fetchData } from '../apiClient';
import './ProductsPage/ProductsPage.css';

const ProductLowestPricePage = () => {
  const { productId } = useParams();
  const [lowest, setLowest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadLowest() {
      try {
        setLoading(true);
        setError('');
        const res = await fetchData(`/products/${productId}/lowest-price`);
        setLowest(res.data || null);
      } catch (e) {
        setError('Failed to load lowest price.');
      } finally {
        setLoading(false);
      }
    }
    loadLowest();
  }, [productId]);

  if (loading) return <p>Loading...</p>;
  if (error) return <p className="error-message">{error}</p>;
  if (!lowest) return <p>No lowest price found for this product.</p>;

  return (
    <div className="page products-page container">
      <h1 className="page-title">Lowest Price Vendor</h1>
      <div className="lowest-price-details">
        <p><strong>Vendor:</strong> {lowest.vendor_name || lowest.vendorName}</p>
        <p><strong>Final Price (₹):</strong> {lowest.final_price || lowest.finalPrice}</p>
        <p><strong>Stock:</strong> {lowest.stock}</p>
      </div>
    </div>
  );
};

export default ProductLowestPricePage;
