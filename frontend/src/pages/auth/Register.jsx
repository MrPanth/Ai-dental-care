import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';

const CITIES = [
  'mumbai', 'delhi', 'bangalore', 'hyderabad', 'ahmedabad',
  'chennai', 'kolkata', 'pune', 'jaipur', 'lucknow',
  'kanpur', 'nagpur', 'indore', 'thane', 'bhopal',
  'visakhapatnam', 'pimpri-chinchwad', 'patna', 'vadodara',
  'ghaziabad', 'ludhiana', 'agra', 'nashik', 'faridabad',
  'meerut', 'rajkot', 'varanasi', 'srinagar', 'aurangabad',
  'dhanbad', 'amritsar', 'navi mumbai', 'allahabad',
  'ranchi', 'howrah', 'coimbatore', 'jabalpur', 'gwalior',
  'vijayawada', 'jodhpur', 'madurai', 'raipur', 'kota',
  'chandigarh', 'guwahati', 'solapur', 'hubli-dharwad',
  'mysore', 'tiruchirappalli', 'bareilly', 'aligarh',
  'tiruppur', 'moradabad', 'jalandhar', 'bhubaneswar',
  'salem', 'warangal', 'guntur', 'bhiwandi', 'saharanpur',
  'gorakhpur', 'bikaner', 'amravati', 'noida', 'jamshedpur',
  'bhilai', 'cuttack', 'firozabad', 'kochi', 'nellore',
  'bhavnagar', 'dehradun', 'durgapur', 'asansol', 'rourkela',
  'nanded', 'kolhapur', 'ajmer', 'akola', 'gulbarga',
  'jamnagar', 'ujjain', 'loni', 'siliguri', 'jhansi',
  'ulhasnagar', 'jammu', 'sangli-miraj', 'mangalore',
  'erode', 'belgaum', 'ambattur', 'tirunelveli', 'malegaon',
  'gaya', 'jalgaon', 'udaipur', 'maheshtala'
];
const SPECIALIZATIONS = [
  'General Dentistry', 'Orthodontics', 'Periodontics', 
  'Endodontics', 'Oral Surgery', 'Pediatric Dentistry', 
  'Prosthodontics', 'Cosmetic Dentistry'
];

export default function Register() {
  const navigate = useNavigate();
  const registerStore = useAuthStore((state) => state.register);

  const [role, setRole] = useState('patient');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [citySearch, setCitySearch] = useState('');
  const [city, setCity] = useState('');
  const [filteredCities, setFilteredCities] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  // Patient Fields
  const [patientPhone, setPatientPhone] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [medicalHistory, setMedicalHistory] = useState('');

  // Doctor Fields
  const [specialization, setSpecialization] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [experience, setExperience] = useState('');
  const [phone, setPhone] = useState('');
  const [clinicName, setClinicName] = useState('');
  const [clinicAddress, setClinicAddress] = useState('');

  // UI state
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [formErrorMsg, setFormErrorMsg] = useState('');
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    if (citySearch.trim()) {
      const match = CITIES.filter(c => c.includes(citySearch.toLowerCase()));
      setFilteredCities(match);
    } else {
      setFilteredCities([]);
    }
  }, [citySearch]);

  const addToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  const validateForm = () => {
    let tempErrors = {};
    let isValid = true;
    setFormErrorMsg('');

    if (!name) { tempErrors.name = 'Full name is required'; isValid = false; }
    if (!email) { tempErrors.email = 'Email address is required'; isValid = false; }
    if (!password) { tempErrors.password = 'Password is required'; isValid = false; }
    else if (password.length < 6) { tempErrors.password = 'Password must be at least 6 characters'; isValid = false; }
    if (password !== confirmPassword) { tempErrors.confirmPassword = 'Passwords do not match'; isValid = false; }
    if (!city) { tempErrors.city = 'City location is required'; isValid = false; }

    if (role === 'doctor') {
      if (!specialization) { tempErrors.specialization = 'Specialization is required'; isValid = false; }
      if (!licenseNumber) { tempErrors.licenseNumber = 'License number is required'; isValid = false; }
      if (!experience) { tempErrors.experience = 'Experience is required'; isValid = false; }
      if (!phone) { tempErrors.phone = 'Phone is required'; isValid = false; }
      if (!clinicName) { tempErrors.clinicName = 'Clinic name is required'; isValid = false; }
      if (!clinicAddress) { tempErrors.clinicAddress = 'Clinic address is required'; isValid = false; }
    }

    setErrors(tempErrors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    const payload = { role, name, email, password, confirmPassword, city };

    if (role === 'patient') {
      payload.phone = patientPhone;
      payload.age = age ? parseInt(age) : undefined;
      payload.gender = gender;
      payload.medicalHistory = medicalHistory;
    } else {
      payload.phone = phone;
      payload.specialization = specialization;
      payload.licenseNumber = licenseNumber;
      payload.experience = parseInt(experience);
      payload.clinicName = clinicName;
      payload.clinicAddress = clinicAddress;
    }

    const result = await registerStore(payload);
    setLoading(false);

    if (result.success) {
      addToast('Registration successful!', 'success');
      setTimeout(() => {
        if (result.role === 'admin') navigate('/admin-dashboard');
        else if (result.role === 'doctor') navigate('/doctor-pending');
        else navigate('/patient-dashboard');
      }, 1000);
    } else {
      setFormErrorMsg(result.message || 'Registration failed');
      addToast(result.message || 'Registration failed', 'error');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: '480px' }}>
        <div className="auth-logo">
          <img src="/logo.png" alt="AI Dental Care Logo" className="auth-logo-img" />
          <h1>AI Dental Care</h1>
          <p>Create a new account</p>
        </div>

        <div className="auth-tabs">
          <button 
            type="button"
            className={`auth-tab ${role === 'patient' ? 'active' : ''}`}
            onClick={() => { setRole('patient'); setErrors({}); setFormErrorMsg(''); }}
          >
            Patient
          </button>
          <button 
            type="button"
            className={`auth-tab ${role === 'doctor' ? 'active' : ''}`}
            onClick={() => { setRole('doctor'); setErrors({}); setFormErrorMsg(''); }}
          >
            Doctor
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate autoComplete="off">
          {/* General Fields */}
          <div className="form-group">
            <label className="form-label">Full Name <span>*</span></label>
            <input 
              type="text" 
              autoComplete="off"
              className={`form-control ${errors.name ? 'error' : ''}`} 
              placeholder="John Doe" 
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            {errors.name && <div className="form-error show">{errors.name}</div>}
          </div>

          <div className="form-group">
            <label className="form-label">Email Address <span>*</span></label>
            <input 
              type="email" 
              autoComplete="off"
              className={`form-control ${errors.email ? 'error' : ''}`} 
              placeholder="john@example.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {errors.email && <div className="form-error show">{errors.email}</div>}
          </div>

          <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Password <span>*</span></label>
              <input 
                type="password" 
                autoComplete="new-password"
                className={`form-control ${errors.password ? 'error' : ''}`} 
                placeholder="Min 6 chars" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              {errors.password && <div className="form-error show">{errors.password}</div>}
            </div>
            <div className="form-group">
              <label className="form-label">Confirm Password <span>*</span></label>
              <input 
                type="password" 
                autoComplete="new-password"
                className={`form-control ${errors.confirmPassword ? 'error' : ''}`} 
                placeholder="Repeat password" 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              {errors.confirmPassword && <div className="form-error show">{errors.confirmPassword}</div>}
            </div>
          </div>

          <div className="form-group" style={{ position: 'relative' }}>
            <label className="form-label">City <span>*</span></label>
            <input 
              type="text" 
              className={`form-control ${errors.city ? 'error' : ''}`} 
              placeholder="Search city (e.g. Mumbai)" 
              value={citySearch}
              onChange={(e) => {
                const val = e.target.value;
                setCitySearch(val);
                // Allow direct typing: set city if it matches a valid city
                const normalized = val.toLowerCase().trim();
                if (CITIES.includes(normalized)) {
                  setCity(normalized);
                } else {
                  setCity('');
                }
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
            />
            {showDropdown && filteredCities.length > 0 && (
              <div className="city-dropdown-list" style={{ display: 'block', position: 'absolute', width: '100%', zIndex: 10 }}>
                {filteredCities.map((item) => (
                  <div 
                    key={item} 
                    className="city-dropdown-item"
                    onClick={() => {
                      setCitySearch(item.charAt(0).toUpperCase() + item.slice(1));
                      setCity(item);
                      setShowDropdown(false);
                    }}
                  >
                    {item.charAt(0).toUpperCase() + item.slice(1)}
                  </div>
                ))}
              </div>
            )}
            {errors.city && <div className="form-error show">{errors.city}</div>}
          </div>

          {/* Patient Specific Fields */}
          {role === 'patient' && (
            <div>
              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input 
                  type="tel" 
                  className="form-control" 
                  placeholder="Contact number" 
                  value={patientPhone}
                  onChange={(e) => setPatientPhone(e.target.value)}
                />
              </div>

              <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Age</label>
                  <input 
                    type="number" 
                    className="form-control" 
                    placeholder="Age" 
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Gender</label>
                  <select className="form-control" value={gender} onChange={(e) => setGender(e.target.value)}>
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Medical History</label>
                <textarea 
                  className="form-control" 
                  placeholder="Existing conditions, allergies, dental history..." 
                  value={medicalHistory}
                  onChange={(e) => setMedicalHistory(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Doctor Specific Fields */}
          {role === 'doctor' && (
            <div>
              <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Specialization <span>*</span></label>
                  <select 
                    className={`form-control ${errors.specialization ? 'error' : ''}`} 
                    value={specialization} 
                    onChange={(e) => setSpecialization(e.target.value)}
                  >
                    <option value="">Select specialization</option>
                    {SPECIALIZATIONS.map((spec) => (
                      <option key={spec} value={spec}>{spec}</option>
                    ))}
                  </select>
                  {errors.specialization && <div className="form-error show">{errors.specialization}</div>}
                </div>
                <div className="form-group">
                  <label className="form-label">License Number <span>*</span></label>
                  <input 
                    type="text" 
                    className={`form-control ${errors.licenseNumber ? 'error' : ''}`} 
                    placeholder="License or Registration No." 
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                  />
                  {errors.licenseNumber && <div className="form-error show">{errors.licenseNumber}</div>}
                </div>
              </div>

              <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Experience (Years) <span>*</span></label>
                  <input 
                    type="number" 
                    className={`form-control ${errors.experience ? 'error' : ''}`} 
                    placeholder="Years" 
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                  />
                  {errors.experience && <div className="form-error show">{errors.experience}</div>}
                </div>
                <div className="form-group">
                  <label className="form-label">Contact Number <span>*</span></label>
                  <input 
                    type="tel" 
                    className={`form-control ${errors.phone ? 'error' : ''}`} 
                    placeholder="Phone number" 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                  {errors.phone && <div className="form-error show">{errors.phone}</div>}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Clinic Name <span>*</span></label>
                <input 
                  type="text" 
                  className={`form-control ${errors.clinicName ? 'error' : ''}`} 
                  placeholder="Apollo Dental Clinic" 
                  value={clinicName}
                  onChange={(e) => setClinicName(e.target.value)}
                />
                {errors.clinicName && <div className="form-error show">{errors.clinicName}</div>}
              </div>

              <div className="form-group">
                <label className="form-label">Clinic Address <span>*</span></label>
                <input 
                  type="text" 
                  className={`form-control ${errors.clinicAddress ? 'error' : ''}`} 
                  placeholder="Street, Area, Building..." 
                  value={clinicAddress}
                  onChange={(e) => setClinicAddress(e.target.value)}
                />
                {errors.clinicAddress && <div className="form-error show">{errors.clinicAddress}</div>}
              </div>
            </div>
          )}

          {formErrorMsg && (
            <div className="alert alert-danger" style={{ display: 'flex' }}>
              <span className="alert-icon">&#9888;</span>
              <span>{formErrorMsg}</span>
            </div>
          )}

          <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading} style={{ marginTop: '12px' }}>
            {loading ? (
              <>
                <span className="spinner-sm"></span>
                <span>Creating Account...</span>
              </>
            ) : (
              <span>Create Account</span>
            )}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account? <Link to="/login">Login here</Link>
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
