import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '../../services/api/authService';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      alert('Email is required');
      return;
    }
    setLoading(true);
    try {
      const data = await authService.forgotPassword(email);
      alert(data.message || 'If that email exists, we sent a recovery link!');
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <img src="/logo.png" alt="AI Dental Care Logo" className="auth-logo-img" />
          <h1>AI Dental Care</h1>
          <p>Recover your password</p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label">Email Address <span>*</span></label>
            <input 
              type="email" 
              className="form-control" 
              placeholder="you@example.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
            <span>{loading ? 'Sending link...' : 'Send Recovery Link'}</span>
          </button>
        </form>

        <div className="auth-footer">
          Remember your password? <Link to="/login">Login here</Link>
        </div>
        <div className="auth-footer" style={{ marginTop: '8px' }}>
          <Link to="/">Back to Home</Link>
        </div>
      </div>
    </div>
  );
}
