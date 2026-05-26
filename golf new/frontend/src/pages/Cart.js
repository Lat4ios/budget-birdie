import React from 'react';
import { useCart } from '../context/CartContext';
import { Link, useNavigate } from 'react-router-dom';

const Cart = () => {
  const { cart, removeFromCart, updateQuantity, cartTotal } = useCart();
  const navigate = useNavigate();

  if (cart.length === 0) {
    return (
      <div className="cart-empty">
        <h2>Your cart is empty</h2>
        <Link to="/products" className="btn-primary">Continue Shopping</Link>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <h1>Shopping Cart</h1>
      {cart.map(item => (
        <div key={item._id} className="cart-item">
          <img src={item.imageUrl} alt={item.name} />
          <div className="cart-item-details">
            <h3>{item.name}</h3>
            <p>{item.description}</p>
            <div className="cart-item-price">${item.price}</div>
          </div>
          <div>
            <input
              type="number"
              min="1"
              value={item.quantity}
              onChange={(e) => updateQuantity(item._id, parseInt(e.target.value))}
              style={{ width: '60px', padding: '0.5rem' }}
            />
          </div>
          <div>
            <button className="btn-delete" onClick={() => removeFromCart(item._id)}>Remove</button>
          </div>
          <div className="cart-item-total">
            <strong>${(item.price * item.quantity).toFixed(2)}</strong>
          </div>
        </div>
      ))}
      <div className="cart-summary">
        <div className="cart-total">Total: ${cartTotal.toFixed(2)}</div>
        <button className="btn-primary" onClick={() => navigate('/checkout')}>
          Proceed to Checkout
        </button>
      </div>
    </div>
  );
};

export default Cart;