import React, { useState } from 'react';

const LoginPage = ({ onLogin }) => {
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Simulate API call delay
    setTimeout(() => {
      // Dummy authentication - in real app, verify credentials with backend
      if (credentials.username === 'admin' && credentials.password === 'admin123') {
        onLogin({
          id: 'admin001',
          name: 'Admin User',
          role: 'admin',
          email: 'admin@example.com'
        });
      } else {
        alert('Invalid credentials. Use admin/admin123 for demo.');
      }
      setLoading(false);
    }, 1000);
  };

  const handleChange = (e) => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1 className="login-title">Admin Login</h1>
        <p className="login-subtitle">SIH Attendance Management System</p>
        
        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="username">
              Username
            </label>
            <input
              type="text"
              id="username"
              name="username"
              className="form-input"
              value={credentials.username}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label className="form-label" htmlFor="password">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              className="form-input"
              value={credentials.password}
              onChange={handleChange}
              required
            />
          </div>
          
          <button
            type="submit"
            className="login-btn"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="demo-info">
          <h3 className="demo-title">Demo Credentials:</h3>
          <p className="demo-text">Username: admin</p>
          <p className="demo-text">Password: admin123</p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
