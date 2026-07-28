import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authService } from '../../services/api/authService';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password || password.length < 6) {
      alert('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    if (!token) {
      alert('Token is missing in the URL parameters.');
      return;
    }

    setLoading(true);
    try {
      const data = await authService.resetPassword(token, password);
      alert('Password reset successfully! Redirecting to login...');
      navigate('/login');
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to reset password');
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
          <p>Reset your password</p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label">New Password <span>*</span></label>
            <input 
              type="password" 
              className="form-control" 
              placeholder="Min 6 characters" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Confirm Password <span>*</span></label>
            <input 
              type="password" 
              className="form-control" 
              placeholder="Repeat new password" 
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
            <span>{loading ? 'Resetting password...' : 'Reset Password'}</span>
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
