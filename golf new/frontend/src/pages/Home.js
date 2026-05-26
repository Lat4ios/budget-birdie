import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div>
      <div className="hero">
        <h1>Elevate Your Golf Game</h1>
        <p>Gear up for your next round</p>
        <Link to="/products" className="btn-primary">Shop Now</Link>
      </div>
      
      <div className="container">
        <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>Why Shop With Us?</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem', textAlign: 'center' }}>
          <div><h3>Nationwide Shipping</h3><p>We offer multiple courriers to ensure reliable and accessible delivery</p></div>
          <div><h3>Easy Returns</h3><p>Defective items can be replaced upon request</p></div>
          <div><h3>Premium Quality</h3><p>We ensure that every product meets our high standards and are all fairway ready</p></div>
          <div><h3>Mode of Payments</h3><p>We accept COD and online payments</p></div>
        </div>
      </div>
    </div>
  );
};

export default Home;