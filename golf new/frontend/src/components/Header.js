import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';

const Header = () => {
  const { cartCount } = useCart();

  return (
    <header className="header">
      <div className="header-container">
        <Link to="/" className="logo">⛳ Golf Store</Link>
        <ul className="nav-links">
          <li><Link to="/">Home</Link></li>
          <li><Link to="/products">Products</Link></li>
          <li><Link to="/admin/login">Admin</Link></li>
          <li><Link to="/cart">🛒 Cart ({cartCount})</Link></li>
        </ul>
      </div>
    </header>
  );
};

export default Header;