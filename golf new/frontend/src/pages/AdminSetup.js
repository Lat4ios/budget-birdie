import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API_URL = 'http://localhost:5000/api';

const AdminSetup = () => {
  const [form, setForm] = useState({ username: '', password: '', confirmPassword: '', email: '', fullName: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/admin/setup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: form.username, password: form.password, email: form.email, fullName: form.fullName })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess('Superadmin created! Redirecting...');
        setTimeout(() => navigate('/admin/login'), 2000);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-container">
      <div className="admin-login-form">
        <h1>👑 Create Super Admin</h1>
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group"><label>Full Name</label><input type="text" value={form.fullName} onChange={(e) => setForm({...form, fullName: e.target.value})} required /></div>
          <div className="form-group"><label>Email</label><input type="email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} required /></div>
          <div className="form-group"><label>Username</label><input type="text" value={form.username} onChange={(e) => setForm({...form, username: e.target.value})} required /></div>
          <div className="form-group"><label>Password</label><input type="password" value={form.password} onChange={(e) => setForm({...form, password: e.target.value})} required /></div>
          <div className="form-group"><label>Confirm Password</label><input type="password" value={form.confirmPassword} onChange={(e) => setForm({...form, confirmPassword: e.target.value})} required /></div>
          <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Creating...' : 'Create Super Admin'}</button>
        </form>
      </div>
    </div>
  );
};

export default AdminSetup;