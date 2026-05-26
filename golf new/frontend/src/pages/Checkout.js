import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';

const API_URL = 'http://localhost:5000/api';

const Checkout = () => {
  const { cart, getCartTotal, clearCart } = useCart();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cod');
  
  // Philippine provinces
  const provinces = [
    'Metro Manila', 'Abra', 'Agusan del Norte', 'Agusan del Sur', 'Aklan', 'Albay', 'Antique', 'Apayao', 
    'Aurora', 'Basilan', 'Bataan', 'Batanes', 'Batangas', 'Benguet', 'Biliran', 'Bohol', 'Bukidnon', 
    'Bulacan', 'Cagayan', 'Camarines Norte', 'Camarines Sur', 'Camiguin', 'Capiz', 'Catanduanes', 
    'Cavite', 'Cebu', 'Cotabato', 'Davao del Norte', 'Davao del Sur', 'Davao Occidental', 'Davao Oriental', 
    'Dinagat Islands', 'Eastern Samar', 'Guimaras', 'Ifugao', 'Ilocos Norte', 'Ilocos Sur', 'Iloilo', 
    'Isabela', 'Kalinga', 'La Union', 'Laguna', 'Lanao del Norte', 'Lanao del Sur', 'Leyte', 'Maguindanao', 
    'Marinduque', 'Masbate', 'Mindoro Occidental', 'Mindoro Oriental', 'Misamis Occidental', 'Misamis Oriental', 
    'Mountain Province', 'Negros Occidental', 'Negros Oriental', 'North Cotabato', 'Northern Samar', 
    'Nueva Ecija', 'Nueva Vizcaya', 'Palawan', 'Pampanga', 'Pangasinan', 'Quezon', 'Quirino', 'Rizal', 
    'Romblon', 'Samar', 'Sarangani', 'Siquijor', 'Sorsogon', 'South Cotabato', 'Southern Leyte', 
    'Sultan Kudarat', 'Sulu', 'Surigao del Norte', 'Surigao del Sur', 'Tarlac', 'Tawi-Tawi', 'Zambales', 
    'Zamboanga del Norte', 'Zamboanga del Sur', 'Zamboanga Sibugay'
  ];

  const [customerInfo, setCustomerInfo] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    province: 'Metro Manila',
    zipCode: '',
    notes: ''
  });

  const subtotal = getCartTotal();
  const total = subtotal;

  useEffect(() => {
    if (cart.length === 0 && !orderComplete) {
      navigate('/cart');
    }
  }, [cart, navigate, orderComplete]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCustomerInfo(prev => ({ ...prev, [name]: value }));
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');
    
    const orderData = {
      customer: {
        fullName: customerInfo.fullName,
        email: customerInfo.email,
        phone: customerInfo.phone,
        address: customerInfo.address,
        city: customerInfo.city,
        province: customerInfo.province,
        zipCode: customerInfo.zipCode,
        notes: customerInfo.notes
      },
      orderItems: cart.map(item => ({
        id: item._id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        imageUrl: item.imageUrl
      })),
      total: total,
      paymentMethod: paymentMethod
    };
    
    try {
      const response = await fetch(`${API_URL}/place-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });
      
      const result = await response.json();
      
      if (result.success) {
        setOrderId(result.orderId);
        
        // Save order to localStorage
        const orders = JSON.parse(localStorage.getItem('orders') || '[]');
        orders.push({ ...orderData, orderId: result.orderId, orderDate: new Date().toISOString() });
        localStorage.setItem('orders', JSON.stringify(orders));
        
        clearCart();
        setOrderComplete(true);
      } else {
        setErrorMessage(result.message || 'Error placing order');
      }
    } catch (error) {
      console.error('Order error:', error);
      setErrorMessage('There was an issue placing your order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getPaymentMethodLabel = (method) => {
    switch(method) {
      case 'cod': return 'Cash on Delivery (COD)';
      case 'bank': return 'Bank Transfer (BPI/BDO/Metrobank)';
      case 'ewallet': return 'E-Wallet (GCash/PayMaya/GrabPay)';
      default: return method;
    }
  };

  if (orderComplete) {
    return (
      <div className="order-success-page">
        <div className="order-success-card">
          <div className="success-animation">✓</div>
          <h1>Order Confirmed! 🎉</h1>
          <p className="order-number">Order #{orderId}</p>
          
          <div className="order-summary-box">
            <h3>Order Summary</h3>
            {cart.map(item => (
              <div key={item._id} className="order-summary-item">
                <span>{item.name} x {item.quantity}</span>
                <span>₱{(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
            <div className="order-summary-total">
              <span>Total:</span>
              <span>₱{total.toFixed(2)}</span>
            </div>
          </div>
          
          <div className="shipping-info-box">
            <h3>Shipping Information</h3>
            <p><strong>{customerInfo.fullName}</strong></p>
            <p>{customerInfo.email}</p>
            <p>{customerInfo.phone}</p>
            <p>{customerInfo.address}</p>
            <p>{customerInfo.city}, {customerInfo.province} {customerInfo.zipCode}</p>
            {customerInfo.notes && <p><strong>Notes:</strong> {customerInfo.notes}</p>}
          </div>
          
          <div className="payment-info-box">
            <h3>Payment Method</h3>
            <p>{getPaymentMethodLabel(paymentMethod)}</p>
          </div>
          
          <div className="contact-note">
            <p>📞 Please contact <strong>John Christian Llamas</strong> on Facebook to settle your order and payment.</p>
            <p>🔗 Facebook: <strong>John Christian Llamas</strong></p>
            <p>📱 Send this receipt/screenshot to confirm your order.</p>
            <p>⏰ Please settle within 24 hours to avoid cancellation.</p>
          </div>
          
          <button onClick={() => navigate('/')} className="continue-shopping-btn">
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="cart-empty">
        <h2>Your cart is empty</h2>
        <button onClick={() => navigate('/products')} className="btn-primary">
          Continue Shopping
        </button>
      </div>
    );
  }

  return (
    <div className="checkout-container">
      <div className="checkout-wrapper">
        <h1>Checkout</h1>
        
        {errorMessage && (
          <div className="error-message">
            {errorMessage}
          </div>
        )}
        
        <div className="checkout-content">
          <div className="checkout-form-section">
            <form onSubmit={handlePlaceOrder}>
              <h2>Shipping Information</h2>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Full Name *</label>
                  <input type="text" name="fullName" value={customerInfo.fullName} onChange={handleInputChange} required placeholder="Juan Dela Cruz" />
                </div>
                <div className="form-group">
                  <label>Email *</label>
                  <input type="email" name="email" value={customerInfo.email} onChange={handleInputChange} required placeholder="juandelacruz@email.com" />
                </div>
              </div>
              
              <div className="form-group">
                <label>Phone Number *</label>
                <input type="tel" name="phone" value={customerInfo.phone} onChange={handleInputChange} required placeholder="0912 345 6789" />
              </div>
              
              <div className="form-group">
                <label>Street Address *</label>
                <input type="text" name="address" value={customerInfo.address} onChange={handleInputChange} required placeholder="123 Rizal St, Barangay" />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>City/Municipality *</label>
                  <input type="text" name="city" value={customerInfo.city} onChange={handleInputChange} required placeholder="Makati City" />
                </div>
                <div className="form-group">
                  <label>Province *</label>
                  <select name="province" value={customerInfo.province} onChange={handleInputChange} required>
                    {provinces.map(province => (
                      <option key={province} value={province}>{province}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>ZIP Code *</label>
                  <input type="text" name="zipCode" value={customerInfo.zipCode} onChange={handleInputChange} required placeholder="1200" />
                </div>
              </div>
              
              <h2 style={{ marginTop: '1.5rem' }}>Payment Method</h2>
              
              <div className="payment-options">
                <label className="payment-option">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cod"
                    checked={paymentMethod === 'cod'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  <div>
                    <strong>💵 Cash on Delivery (COD)</strong>
                    <p>Pay when your order arrives</p>
                  </div>
                </label>
                
                <label className="payment-option">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="bank"
                    checked={paymentMethod === 'bank'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  <div>
                    <strong>🏦 Bank Transfer</strong>
                    <p>BPI / BDO / Metrobank</p>
                  </div>
                </label>
                
                <label className="payment-option">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="ewallet"
                    checked={paymentMethod === 'ewallet'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  <div>
                    <strong>📱 E-Wallet</strong>
                    <p>GCash / PayMaya / GrabPay</p>
                  </div>
                </label>
              </div>
              
              <div className="form-group">
                <label>Order Notes (Optional)</label>
                <textarea
                  name="notes"
                  value={customerInfo.notes}
                  onChange={handleInputChange}
                  rows="3"
                  placeholder="Special instructions for delivery..."
                />
              </div>
              
              <div className="delivery-info">
                <h3>📋 How to Complete Your Order</h3>
                <p>1. Fill out all required information above</p>
                <p>2. Choose your preferred payment method</p>
                <p>3. Click "Place Order" below</p>
                <p>4. Take a screenshot of your order confirmation</p>
                <p>5. Contact <strong>John Christian Llamas</strong> on Facebook to settle payment</p>
              </div>
              
              <button type="submit" disabled={loading} className="btn-place-order">
                {loading ? 'Processing...' : `Place Order • ₱${total.toFixed(2)}`}
              </button>
            </form>
          </div>
          
          <div className="order-summary-section">
            <h3>Order Summary</h3>
            
            <div className="summary-items">
              {cart.map(item => (
                <div key={item._id} className="summary-item">
                  <div>
                    <span className="item-name">{item.name}</span>
                    <span className="item-qty">x {item.quantity}</span>
                  </div>
                  <span>₱{(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
            
            <div className="summary-divider"></div>
            
            <div className="summary-row total">
              <span>Total:</span>
              <span>₱{total.toFixed(2)}</span>
            </div>
            
            <div className="contact-summary">
              <p>📞 After placing order:</p>
              <p>Contact <strong>John Christian Llamas</strong> on Facebook</p>
              <p>Send this receipt to confirm your order</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;