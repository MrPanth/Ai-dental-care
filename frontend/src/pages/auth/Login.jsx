import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const loginStore = useAuthStore((state) => state.login);
  
  const [activeRole, setActiveRole] = useState('admin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [formErrorMsg, setFormErrorMsg] = useState('');
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  const validateForm = () => {
    let isValid = true;
    setEmailError('');
    setPasswordError('');
    setFormErrorMsg('');

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setEmailError('Email address is required');
      isValid = false;
    } else if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email address');
      isValid = false;
    }

    if (!password) {
      setPasswordError('Password is required');
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      isValid = false;
    }

    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    const result = await loginStore(email, password);
    setLoading(false);

    if (result.success) {
      if (result.role !== activeRole) {
        addToast(`Redirecting to your ${result.role} portal`, 'warning');
      } else {
        addToast('Login successful!', 'success');
      }

      setTimeout(() => {
        // Redirections matching original flow
        if (result.role === 'admin') {
          navigate('/admin-dashboard');
        } else if (result.role === 'doctor') {
          if (result.isApproved === false) {
            navigate('/doctor-pending');
          } else {
            navigate('/doctor-dashboard');
          }
        } else {
          navigate('/patient-dashboard');
        }
      }, 800);
    } else {
      if (result.pending) {
        addToast('Account pending verification', 'warning');
        setFormErrorMsg('Your account is still under verification.<br><br>Verification usually takes 24–48 hours.<br><br>Please wait until an administrator approves your account.');
      } else {
        setFormErrorMsg(result.message || 'Invalid email or password');
        addToast(result.message || 'Login failed', 'error');
      }
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <img src="/logo.png" alt="AI Dental Care Logo" className="auth-logo-img" />
          <h1>AI Dental Care</h1>
          <p>Sign in to your account</p>
        </div>

        <div className="auth-tabs">
          <button 
            type="button" 
            className={`auth-tab ${activeRole === 'admin' ? 'active' : ''}`} 
            onClick={() => { setActiveRole('admin'); setFormErrorMsg(''); }}
          >
            Admin
          </button>
          <button 
            type="button" 
            className={`auth-tab ${activeRole === 'doctor' ? 'active' : ''}`} 
            onClick={() => { setActiveRole('doctor'); setFormErrorMsg(''); }}
          >
            Doctor
          </button>
          <button 
            type="button" 
            className={`auth-tab ${activeRole === 'patient' ? 'active' : ''}`} 
            onClick={() => { setActiveRole('patient'); setFormErrorMsg(''); }}
          >
            Patient
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label">Email Address <span>*</span></label>
            <input 
              type="email" 
              className={`form-control ${emailError ? 'error' : ''}`} 
              placeholder="you@example.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {emailError && <div className="form-error show">{emailError}</div>}
          </div>
          
          <div className="form-group">
            <label className="form-label">Password <span>*</span></label>
            <div style={{ position: 'relative' }}>
              <input 
                type={showPassword ? 'text' : 'password'} 
                className={`form-control ${passwordError ? 'error' : ''}`} 
                placeholder="Your password" 
                style={{ paddingRight: '42px' }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  padding: '0',
                  margin: '0',
                  cursor: 'pointer',
                  color: '#64748b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  outline: 'none',
                  boxShadow: 'none'
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {passwordError && <div className="form-error show">{passwordError}</div>}
          </div>

          {formErrorMsg && (
            <div className="alert alert-danger" style={{ display: 'flex' }}>
              <span className="alert-icon">&#9888;</span>
              <span dangerouslySetInnerHTML={{ __html: formErrorMsg }}></span>
            </div>
          )}

          <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
            <span>{loading ? 'Signing In...' : 'Sign In'}</span>
            {loading && <span className="spinner" style={{ display: 'inline-block' }}></span>}
          </button>
        </form>

        <div className="auth-footer">
          Don't have an account? <Link to="/register">Register here</Link>
        </div>
        <div className="auth-footer" style={{ marginTop: '8px' }}>
          <Link to="/forgot-password">Forgot Password?</Link>
        </div>
        <div className="auth-footer" style={{ marginTop: '8px' }}>
          <Link to="/">Back to Home</Link>
        </div>
      </div>

      <div className="toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast ${toast.type}`}>
            <span>{toast.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
