import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';

const API_URL = 'http://localhost:5000/api';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();

  useEffect(() => {
    fetchProducts();
  }, [filter]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const url = filter === 'all' ? `${API_URL}/products` : `${API_URL}/products?category=${filter}`;
      const res = await fetch(url);
      const data = await res.json();
      setProducts(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (product) => {
    addToCart(product, 1);
    // Visual feedback
    const btn = document.getElementById(`btn-${product._id}`);
    if (btn) {
      btn.textContent = '✓ Added!';
      btn.style.background = '#28a745';
      setTimeout(() => {
        btn.textContent = 'Add to Cart';
        btn.style.background = '#1a472a';
      }, 1500);
    }
  };

  if (loading) return <div className="loading">Loading products...</div>;

  return (
    <div className="container">
      <h1>Our Products</h1>
      <div className="filter-bar">
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">All Products</option>
          <option value="balls">Golf Balls</option>
          <option value="apparel">Apparel</option>
          <option value="accessories">Accessories</option>
        </select>
      </div>
      <div className="product-grid">
        {products.map(product => (
          <div key={product._id} className="product-card">
            <img src={product.imageUrl} alt={product.name} />
            <div className="product-info">
              <h3 className="product-title">{product.name}</h3>
              <p className="product-description">{product.description}</p>
              <div className="product-price">${product.price}</div>
              <button 
                id={`btn-${product._id}`}
                className="btn-add" 
                onClick={() => handleAddToCart(product)}
              >
                Add to Cart
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Products;