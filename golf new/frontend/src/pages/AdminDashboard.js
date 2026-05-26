import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const API_URL = 'http://localhost:5000/api';

const AdminDashboard = () => {
  const [products, setProducts] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [adminData, setAdminData] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showAdminsList, setShowAdminsList] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [generatedCode, setGeneratedCode] = useState(null);
  const [codeExpires, setCodeExpires] = useState(null);
  const [countdown, setCountdown] = useState(0);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const navigate = useNavigate();
  
  const [form, setForm] = useState({ name: '', description: '', price: '', imageUrl: '', category: 'balls', stockQuantity: 10, featured: false, discount: 0 });
  const [passwordForm, setPasswordForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [createAdminForm, setCreateAdminForm] = useState({ code: '', username: '', password: '', confirmPassword: '', email: '', fullName: '' });
  const [createAdminError, setCreateAdminError] = useState('');
  const [createAdminSuccess, setCreateAdminSuccess] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    const storedAdmin = localStorage.getItem('adminData');
    if (!token || !storedAdmin) {
      navigate('/admin/login');
      return;
    }
    const admin = JSON.parse(storedAdmin);
    setAdminData(admin);
    fetchProducts();
    if (admin.role === 'superadmin') fetchAdmins();
    setLoading(false);
  }, [navigate]);

  useEffect(() => {
    let interval;
    if (codeExpires) {
      interval = setInterval(() => {
        const remaining = Math.max(0, Math.floor((codeExpires - Date.now()) / 1000));
        setCountdown(remaining);
        if (remaining === 0) { setGeneratedCode(null); setCodeExpires(null); }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [codeExpires]);

  const fetchProducts = async () => {
    const res = await fetch(`${API_URL}/products`);
    setProducts(await res.json());
  };

  const fetchAdmins = async () => {
    const res = await fetch(`${API_URL}/admin/all`);
    setAdmins(await res.json());
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminData');
    navigate('/admin/login');
  };

  const handleGenerateCode = async () => {
    const res = await fetch(`${API_URL}/admin/generate-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminId: adminData?._id })
    });
    const data = await res.json();
    if (res.ok) {
      setGeneratedCode(data.code);
      setCodeExpires(Date.now() + data.expiresIn * 1000);
      setCountdown(data.expiresIn);
    } else {
      alert(data.message);
    }
  };

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    if (createAdminForm.password !== createAdminForm.confirmPassword) {
      setCreateAdminError('Passwords do not match');
      return;
    }
    const res = await fetch(`${API_URL}/admin/create-with-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: createAdminForm.code, username: createAdminForm.username,
        password: createAdminForm.password, email: createAdminForm.email, fullName: createAdminForm.fullName
      })
    });
    const data = await res.json();
    if (res.ok) {
      setCreateAdminSuccess('Admin created!');
      setTimeout(() => { setShowAddForm(false); setCreateAdminForm({ code: '', username: '', password: '', confirmPassword: '', email: '', fullName: '' }); setCreateAdminSuccess(''); if (adminData?.role === 'superadmin') fetchAdmins(); }, 2000);
    } else {
      setCreateAdminError(data.message);
    }
  };

  const handleDeleteAdmin = async (targetId) => {
    if (window.confirm('Delete this admin?')) {
      const res = await fetch(`${API_URL}/admin/${targetId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminId: adminData?._id, targetId })
      });
      const data = await res.json();
      alert(data.message);
      if (res.ok) fetchAdmins();
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert('New passwords do not match');
      return;
    }
    const res = await fetch(`${API_URL}/admin/change-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: adminData?.username, oldPassword: passwordForm.oldPassword, newPassword: passwordForm.newPassword })
    });
    const data = await res.json();
    alert(data.message);
    if (res.ok) { setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' }); setShowChangePassword(false); }
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    const productData = { ...form, price: parseFloat(form.price), stockQuantity: parseInt(form.stockQuantity) };
    if (editingProduct) {
      await fetch(`${API_URL}/products/${editingProduct._id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(productData) });
    } else {
      await fetch(`${API_URL}/products`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(productData) });
    }
    setEditingProduct(null); setForm({ name: '', description: '', price: '', imageUrl: '', category: 'balls', stockQuantity: 10, featured: false, discount: 0 }); setShowAddForm(false); fetchProducts();
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="admin-container">
      <div className="admin-header">
        <div><h1>🏌️ Admin Dashboard</h1><p>Welcome, {adminData?.fullName} ({adminData?.role === 'superadmin' ? '👑 Super Admin' : 'Admin'})</p></div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button onClick={() => setShowChangePassword(!showChangePassword)} className="btn-secondary">Change Password</button>
          <button onClick={handleLogout} className="btn-logout">Logout</button>
        </div>
      </div>

      {showChangePassword && (
        <div className="admin-form"><h2>Change Password</h2>
          <form onSubmit={handleChangePassword}>
            <div className="form-group"><label>Current Password</label><input type="password" value={passwordForm.oldPassword} onChange={(e) => setPasswordForm({...passwordForm, oldPassword: e.target.value})} required /></div>
            <div className="form-group"><label>New Password</label><input type="password" value={passwordForm.newPassword} onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})} required /></div>
            <div className="form-group"><label>Confirm Password</label><input type="password" value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})} required /></div>
            <button type="submit" className="btn-primary">Update Password</button>
            <button type="button" onClick={() => setShowChangePassword(false)} className="btn-secondary" style={{ marginLeft: '1rem' }}>Cancel</button>
          </form>
        </div>
      )}

      {adminData?.role === 'superadmin' && (
        <>
          <div className="stats-grid"><div className="stat-card"><div className="stat-icon">👥</div><div className="stat-number">{admins.length}</div><div className="stat-label">Total Admins</div></div></div>
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
            <button onClick={() => { setShowAddForm(!showAddForm); setShowAdminsList(false); }} className="btn-add-product" style={{ width: 'auto' }}>➕ Add New Admin</button>
            <button onClick={() => { setShowAdminsList(!showAdminsList); setShowAddForm(false); }} className="btn-secondary">👥 Manage Admins</button>
          </div>

          {showAddForm && (
            <div className="admin-form"><h2>Create New Admin</h2>
              {createAdminError && <div className="error-message">{createAdminError}</div>}{createAdminSuccess && <div className="success-message">{createAdminSuccess}</div>}
              <div style={{ background: '#f0f5f0', padding: '1rem', borderRadius: '12px', marginBottom: '1rem' }}>
                <p><strong>Generate a 6-digit code (expires in 5 minutes):</strong></p>
                <button onClick={handleGenerateCode} className="btn-primary">Generate New Code</button>
                {generatedCode && <div style={{ marginTop: '0.5rem' }}><p><strong>Code: <span style={{ fontSize: '1.5rem', fontFamily: 'monospace' }}>{generatedCode}</span></strong></p><p>Expires in: {Math.floor(countdown / 60)}:{String(countdown % 60).padStart(2, '0')}</p></div>}
              </div>
              <form onSubmit={handleCreateAdmin}>
                <div className="form-group"><label>6-Digit Code *</label><input type="text" value={createAdminForm.code} onChange={(e) => setCreateAdminForm({...createAdminForm, code: e.target.value})} required placeholder="Enter the code" /></div>
                <div className="form-group"><label>Full Name</label><input type="text" value={createAdminForm.fullName} onChange={(e) => setCreateAdminForm({...createAdminForm, fullName: e.target.value})} required /></div>
                <div className="form-group"><label>Email</label><input type="email" value={createAdminForm.email} onChange={(e) => setCreateAdminForm({...createAdminForm, email: e.target.value})} required /></div>
                <div className="form-group"><label>Username</label><input type="text" value={createAdminForm.username} onChange={(e) => setCreateAdminForm({...createAdminForm, username: e.target.value})} required /></div>
                <div className="form-group"><label>Password</label><input type="password" value={createAdminForm.password} onChange={(e) => setCreateAdminForm({...createAdminForm, password: e.target.value})} required /></div>
                <div className="form-group"><label>Confirm Password</label><input type="password" value={createAdminForm.confirmPassword} onChange={(e) => setCreateAdminForm({...createAdminForm, confirmPassword: e.target.value})} required /></div>
                <button type="submit" className="btn-primary">Create Admin</button>
                <button type="button" onClick={() => setShowAddForm(false)} className="btn-secondary" style={{ marginLeft: '1rem' }}>Cancel</button>
              </form>
            </div>
          )}

          {showAdminsList && (
            <div className="admin-form"><h2>Manage Administrators</h2>
              <div className="admin-product-grid">
                {admins.map(admin => (
                  <div key={admin._id} className="admin-product-card">
                    <div><strong>{admin.fullName}</strong><br />@{admin.username}<br />{admin.email}<br />Role: {admin.role === 'superadmin' ? '👑 Super Admin' : 'Admin'}</div>
                    {admin.role !== 'superadmin' && <button onClick={() => handleDeleteAdmin(admin._id)} className="btn-delete">Delete</button>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <div style={{ marginTop: '2rem' }}>
        <h2>Products</h2>
        <button onClick={() => { setEditingProduct(null); setForm({ name: '', description: '', price: '', imageUrl: '', category: 'balls', stockQuantity: 10, featured: false, discount: 0 }); setShowAddForm(true); }} className="btn-add-product" style={{ width: 'auto', marginBottom: '1rem' }}>+ Add Product</button>
        <div className="filters-bar">
          <div className="search-box"><input type="text" placeholder="🔍 Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}><option value="all">All</option><option value="balls">Golf Balls</option><option value="apparel">Apparel</option><option value="accessories">Accessories</option></select>
        </div>
        <div className="admin-product-grid">
          {products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) && (categoryFilter === 'all' || p.category === categoryFilter)).map(product => (
            <div key={product._id} className="admin-product-card">
              <img src={product.imageUrl} alt={product.name} style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px' }} />
              <div><strong>{product.name}</strong><br />₱{product.price}<br />Stock: {product.stockQuantity}</div>
              <div><button onClick={() => { setEditingProduct(product); setForm(product); setShowAddForm(true); }} className="btn-edit">Edit</button>
              <button onClick={async () => { if (window.confirm('Delete?')) { await fetch(`${API_URL}/products/${product._id}`, { method: 'DELETE' }); fetchProducts(); } }} className="btn-delete">Delete</button></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;