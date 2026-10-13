import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { doctorService } from '../../services/api/doctorService';
import { appointmentService } from '../../services/api/appointmentService';
import { 
  Clock, 
  FileText, 
  LogOut, 
  Menu, 
  Search, 
  X, 
  Check, 
  Users, 
  Stethoscope,
  MapPin,
  Calendar,
  AlertCircle,
  User,
  Activity,
  CheckCircle,
  Phone,
  Camera
} from 'lucide-react';

const DENTAL_FALLBACK_SCAN = 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&q=80&w=400';

const getImageUrl = (path) => {
  if (!path) return '';
  if (typeof path !== 'string') return '';
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
    return path;
  }
  const cleanPath = path.replace(/\\/g, '/');
  const normalizedPath = cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`;
  const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const baseUrl = backendUrl.replace(/\/api\/?$/, '');
  return `${baseUrl}${normalizedPath}`;
};

const CITIES = ['mumbai', 'delhi', 'bangalore', 'hyderabad', 'ahmedabad', 'chennai', 'kolkata', 'surat', 'pune', 'jaipur'];
const RECOMMENDATIONS = [
  'Immediate treatment needed',
  'Schedule appointment within a week',
  'Schedule appointment within a month',
  'Monitor condition',
  'No action needed',
  'Refer to specialist'
];
const SPECIALIZATIONS = [
  'General Dentistry', 'Orthodontics', 'Periodontics', 
  'Endodontics', 'Oral Surgery', 'Pediatric Dentistry', 
  'Prosthodontics', 'Cosmetic Dentistry'
];

export default function DoctorDashboard() {
  const { user, logout } = useAuthStore();
  const [activeSection, setActiveSection] = useState('overview');
  
  // Responsive sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Stats and Data states
  const [stats, setStats] = useState(null);
  const [reports, setReports] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);

  // Profile photo (real value from DB, replaces dead localStorage-based avatar)
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  // Review Modal state
  const [selectedReport, setSelectedReport] = useState(null);
  const [notes, setNotes] = useState('');
  const [recommendation, setRecommendation] = useState('');

  // Appointment Details Modal state
  const [viewingAppointment, setViewingAppointment] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Profile Form state
  const [profileSpecialization, setProfileSpecialization] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileClinicName, setProfileClinicName] = useState('');
  const [profileExperience, setProfileExperience] = useState('');
  const [profileClinicAddress, setProfileClinicAddress] = useState('');
  const [profileCitySearch, setProfileCitySearch] = useState('');
  const [profileCity, setProfileCity] = useState('');
  const [filteredCities, setFilteredCities] = useState([]);
  const [showCityDropdown, setShowCityDropdown] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const statsData = await doctorService.getStats();
      setStats(statsData);

      const reportsData = await doctorService.getReports();
      setReports(reportsData.reports || []);

      const apptsData = await appointmentService.getMyAppointments();
      setAppointments(apptsData.appointments || []);

      const profileData = await doctorService.getProfile();
      if (profileData.doctor) {
        const d = profileData.doctor;
        setProfileSpecialization(d.specialization || 'General Dentistry');
        setProfilePhone(d.phone || '');
        setProfileClinicName(d.clinicName || '');
        setProfileExperience(d.experience || '0');
        setProfileClinicAddress(d.clinicAddress || '');
        setProfileCity(d.city || '');
        setProfileCitySearch(d.city ? d.city.charAt(0).toUpperCase() + d.city.slice(1) : '');
        setProfilePhoto(d.profilePhoto || null);
      }
    } catch (err) {
      console.error('Error loading doctor data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (profileCitySearch.trim()) {
      const match = CITIES.filter(c => c.includes(profileCitySearch.toLowerCase()));
      setFilteredCities(match);
    } else {
      setFilteredCities([]);
    }
  }, [profileCitySearch]);

  const handleConfirmAppointment = async (id) => {
    setActionLoading(true);
    try {
      await appointmentService.confirmAppointment(id);
      alert('Appointment confirmed successfully!');
      const apptsData = await appointmentService.getMyAppointments();
      const updated = apptsData.appointments || [];
      setAppointments(updated);
      if (viewingAppointment && viewingAppointment._id === id) {
        setViewingAppointment(updated.find(a => a._id === id) || null);
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to confirm appointment');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectAppointment = async (id) => {
    if (!window.confirm('Decline this appointment request?')) return;
    setActionLoading(true);
    try {
      await appointmentService.rejectAppointment(id);
      alert('Appointment request declined');
      const apptsData = await appointmentService.getMyAppointments();
      const updated = apptsData.appointments || [];
      setAppointments(updated);
      if (viewingAppointment && viewingAppointment._id === id) {
        setViewingAppointment(updated.find(a => a._id === id) || null);
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to decline appointment');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteAppointment = async (id) => {
    if (!window.confirm('Mark this clinical check-up as completed?')) return;
    setActionLoading(true);
    try {
      await appointmentService.completeAppointment(id);
      alert('Check-up marked as completed!');
      const apptsData = await appointmentService.getMyAppointments();
      const updated = apptsData.appointments || [];
      setAppointments(updated);
      if (viewingAppointment && viewingAppointment._id === id) {
        setViewingAppointment(updated.find(a => a._id === id) || null);
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to complete appointment');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelAppointment = async (id) => {
    if (!window.confirm('Cancel appointment?')) return;
    setActionLoading(true);
    try {
      await appointmentService.cancelAppointment(id);
      alert('Appointment cancelled');
      const apptsData = await appointmentService.getMyAppointments();
      const updated = apptsData.appointments || [];
      setAppointments(updated);
      if (viewingAppointment && viewingAppointment._id === id) {
        setViewingAppointment(updated.find(a => a._id === id) || null);
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to cancel appointment');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenReview = (report) => {
    setSelectedReport(report);
    setNotes(report.doctorFeedback?.notes || '');
    setRecommendation(report.doctorFeedback?.recommendation || '');
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!notes.trim()) {
      alert('Feedback notes are required');
      return;
    }
    try {
      await doctorService.submitReview(selectedReport._id, { notes, recommendation });
      alert('Review submitted successfully!');
      setSelectedReport(null);
      loadData();
    } catch (err) {
      console.error(err);
      alert('Failed to submit review');
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!profileCity) {
      alert('City is required');
      return;
    }
    try {
      let payload;
      if (photoFile) {
        // Send as FormData so multer can process the file
        payload = new FormData();
        payload.append('phone', profilePhone);
        payload.append('clinicName', profileClinicName);
        payload.append('clinicAddress', profileClinicAddress);
        payload.append('city', profileCity);
        payload.append('specialization', profileSpecialization);
        payload.append('experience', profileExperience);
        payload.append('profilePhoto', photoFile);
      } else {
        payload = {
          phone: profilePhone,
          clinicName: profileClinicName,
          clinicAddress: profileClinicAddress,
          city: profileCity,
          specialization: profileSpecialization,
          experience: profileExperience
        };
      }
      await doctorService.updateProfile(payload);
      setPhotoFile(null);
      setPhotoPreview(null);
      alert('Profile updated successfully!');
      loadData();
    } catch (err) {
      console.error(err);
      alert('Failed to update profile');
    }
  };

  return (
    <div className={`dashboard-layout theme-teal ${sidebarOpen ? 'sidebar-open' : ''}`}>
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <img src="/logo.png" alt="AI Dental Care Logo" className="sidebar-logo-img" />
          <div>
            <div className="sidebar-logo-text">AI Dental Care</div>
            <div className="sidebar-logo-sub">Doctor Portal</div>
          </div>
        </div>
        <nav className="sidebar-nav">
          <button 
            type="button"
            className={`nav-item ${activeSection === 'overview' ? 'active' : ''}`}
            onClick={() => { setActiveSection('overview'); setSidebarOpen(false); }}
          >
            <span>Overview</span>
          </button>
          <button 
            type="button"
            className={`nav-item ${activeSection === 'reports' ? 'active' : ''}`}
            onClick={() => { setActiveSection('reports'); setSidebarOpen(false); }}
          >
            <span>Patient Reports</span>
            {reports.filter(r => r.status === 'assigned').length > 0 && (
              <span className="nav-badge">
                {reports.filter(r => r.status === 'assigned').length}
              </span>
            )}
          </button>
          <button 
            type="button"
            className={`nav-item ${activeSection === 'appointments' ? 'active' : ''}`}
            onClick={() => { setActiveSection('appointments'); setSidebarOpen(false); }}
          >
            <span>Appointments</span>
          </button>
          <button 
            type="button"
            className={`nav-item ${activeSection === 'profile' ? 'active' : ''}`}
            onClick={() => { setActiveSection('profile'); setSidebarOpen(false); }}
          >
            <span>My Profile</span>
          </button>
        </nav>
        <div className="sidebar-footer">
          <button type="button" className="btn-signout-new" onClick={logout}>
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Sidebar Overlay */}
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)}></div>}

      {/* Main Content */}
      <main className="main-content">
        <div className="topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button className="hamburger" onClick={() => setSidebarOpen(true)}>
              <Menu size={20} />
            </button>
            <span className="topbar-title">
              {activeSection === 'overview' && 'Dashboard Overview'}
              {activeSection === 'reports' && 'Patient Reports'}
              {activeSection === 'appointments' && 'Scheduled Appointments'}
              {activeSection === 'profile' && 'My Profile'}
            </span>
          </div>
          <div className="topbar-right">
            <div className="admin-header-profile" onClick={() => setActiveSection('profile')} title="View profile settings">
              <div className="admin-user-avatar">
                {(photoPreview || profilePhoto) ? (
                  <img src={photoPreview || getImageUrl(profilePhoto)} alt={user?.name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  (user?.name ? user.name.slice(0, 2).toUpperCase() : 'DR')
                )}
              </div>
              <div className="admin-user-info">
                <span className="admin-user-name" style={{ textTransform: 'capitalize' }}>Dr. {user?.name || 'Doctor'}</span>
                <span className="admin-user-city" style={{ textTransform: 'capitalize' }}>{user?.city || 'Mumbai'}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="page-content">
          {loading && (
            <div className="loading-indicator-new">
              <div className="spinner-sm"></div>
              <span>Syncing database credentials...</span>
            </div>
          )}

          {/* SECTION: Overview */}
          {activeSection === 'overview' && stats && (
            <section className="section active">
              <div className="page-header">
                <h2>Welcome back, Dr. {user?.name}</h2>
                <p>Dental diagnostics activity overview</p>
              </div>

              {user?.isApproved && (
                <div className="alert alert-success" style={{ display: 'flex', marginBottom: '20px', alignItems: 'center', gap: '8px' }}>
                  <Check size={16} />
                  <span>Verified Dental Partner &mdash; Receiving active scans in <strong style={{ textTransform: 'capitalize' }}>{user?.city}</strong></span>
                </div>
              )}

              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon-wrapper-new blue">
                    <FileText size={20} />
                  </div>
                  <div>
                    <div className="stat-value">{stats.totalReports || 0}</div>
                    <div className="stat-label">Total Reports</div>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon-wrapper-new amber">
                    <Clock size={20} />
                  </div>
                  <div>
                    <div className="stat-value">{stats.pendingReports || 0}</div>
                    <div className="stat-label">Pending Reviews</div>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon-wrapper-new green">
                    <CheckCircle size={20} />
                  </div>
                  <div>
                    <div className="stat-value">{stats.reviewedReports || 0}</div>
                    <div className="stat-label">Completed Reviews</div>
                  </div>
                </div>
              </div>

              <div className="card" style={{ marginTop: '24px' }}>
                <div className="card-header">
                  <span className="card-title">Recent Assignees</span>
                </div>
                <div className="card-body">
                  {stats.recentReports && stats.recentReports.length > 0 ? (
                    <div className="table-wrapper">
                      <table>
                        <thead>
                          <tr>
                            <th>Patient Name</th>
                            <th>Upload Date</th>
                            <th>AI Scan Findings</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {stats.recentReports.map(rep => (
                            <tr key={rep._id}>
                              <td style={{ fontWeight: '600' }}>{rep.patientName}</td>
                              <td>{new Date(rep.createdAt).toLocaleDateString()}</td>
                              <td>
                                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                                  {rep.aiFindings?.conditions?.join(', ') || 'No issues detected'}
                                </span>
                              </td>
                              <td>
                                <span className={`badge badge-${rep.status === 'reviewed' ? 'green' : 'amber'}`}>
                                  {rep.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="empty-state-card-new">
                      <FileText size={24} className="text-muted" style={{ marginBottom: '8px' }} />
                      <p>No recent patient reports assigned</p>
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* SECTION: Patient Reports */}
          {activeSection === 'reports' && (
            <section className="section active">
              <div className="page-header">
                <h2>Patient Reports</h2>
                <p>Scans submitted by patients located in <span style={{ textTransform: 'capitalize' }}>{user?.city}</span></p>
              </div>

              {reports.length === 0 ? (
                <div className="empty-state-new">
                  <div className="empty-icon-wrapper-new warning">
                    <FileText size={32} />
                  </div>
                  <h3>No patient reports</h3>
                  <p>When patients in your city submit scans showing oral conditions, they will appear here.</p>
                </div>
              ) : (
                <div className="card">
                  <div className="table-wrapper">
                    <table>
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Patient Name</th>
                          <th>AI Findings</th>
                          <th>AI Severity</th>
                          <th>Review Status</th>
                          <th style={{ textAlign: 'right' }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reports.map((rep) => (
                          <tr key={rep._id}>
                            <td>{new Date(rep.createdAt).toLocaleDateString()}</td>
                            <td style={{ fontWeight: '600' }}>{rep.patientName}</td>
                            <td>
                              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                                {rep.aiFindings?.conditions?.join(', ') || 'No issues'}
                              </span>
                            </td>
                            <td style={{ textTransform: 'capitalize' }}>
                              <span className={`badge badge-${rep.aiFindings?.severity === 'severe' ? 'red' : rep.aiFindings?.severity === 'moderate' ? 'amber' : 'blue'}`}>
                                {rep.aiFindings?.severity || 'none'}
                              </span>
                            </td>
                            <td>
                              <span className={`badge badge-${rep.status === 'reviewed' ? 'green' : 'amber'}`}>
                                {rep.status}
                              </span>
                            </td>
                            <td>
                              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                <button 
                                  type="button" 
                                  className="btn btn-ghost btn-sm" 
                                  onClick={() => handleOpenReview(rep)}
                                >
                                  {rep.status === 'reviewed' ? 'View Review' : 'Submit Review'}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </section>
          )}

          {/* SECTION: Appointments */}
          {activeSection === 'appointments' && (
            <section className="section active">
              <div className="page-header">
                <h2>Scheduled Appointments</h2>
                <p>Upcoming clinical checkups booked by platform patients</p>
              </div>

              <div className="card">
                <div className="card-body">
                  {appointments.length === 0 ? (
                    <div className="empty-state-card-new" style={{ padding: '60px 24px' }}>
                      <Calendar size={36} className="text-muted" style={{ marginBottom: '12px' }} />
                      <h3>No appointments scheduled</h3>
                      <p>Patients have not booked any appointments at your clinic yet.</p>
                    </div>
                  ) : (
                    <div className="table-wrapper">
                      <table>
                        <thead>
                          <tr>
                            <th>Patient Name</th>
                            <th>Date</th>
                            <th>Time Slot</th>
                            <th>Booking Status</th>
                            <th style={{ textAlign: 'right' }}>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {appointments.map((appt) => (
                            <tr key={appt._id}>
                              <td style={{ fontWeight: '600' }}>{appt.patientName}</td>
                              <td>{new Date(appt.date).toLocaleDateString()}</td>
                              <td>{appt.time}</td>
                              <td>
                                <span className={`badge badge-${
                                  appt.status === 'confirmed' ? 'green' : 
                                  appt.status === 'pending' ? 'amber' : 
                                  appt.status === 'completed' ? 'blue' : 'red'
                                }`}>
                                  {appt.status}
                                </span>
                              </td>
                              <td>
                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                  <button 
                                    type="button" 
                                    className="btn btn-outline btn-sm" 
                                    onClick={() => setViewingAppointment(appt)}
                                    style={{ borderColor: 'var(--border)', color: '#334155' }}
                                  >
                                    View Details
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* SECTION: Profile */}
          {activeSection === 'profile' && (
            <section className="section active">
              <div className="page-header">
                <h2>My Profile</h2>
                <p>Manage and update your clinic details and credentials</p>
              </div>

              {/* Hidden file input */}
              <input
                id="profilePhotoInput"
                type="file"
                accept="image/jpeg,image/png"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (!file) return;
                  setPhotoFile(file);
                  const reader = new FileReader();
                  reader.onloadend = () => setPhotoPreview(reader.result);
                  reader.readAsDataURL(file);
                }}
              />

              {/* Unified profile card */}
              <form onSubmit={handleUpdateProfile} noValidate>
                <div className="profile-unified-card">

                  {/* ── Header row ── */}
                  <div className="profile-unified-header">
                    {/* Circular avatar */}
                    <div className="profile-unified-avatar">
                      {(photoPreview || profilePhoto) ? (
                        <img src={photoPreview || getImageUrl(profilePhoto)} alt="Profile" />
                      ) : (
                        user?.name ? user.name.slice(0, 2).toUpperCase() : 'DR'
                      )}
                    </div>

                    {/* Name + subtitle */}
                    <div className="profile-unified-identity">
                      <h2>{user?.name || 'Doctor Name'}</h2>
                      <p>{profileSpecialization || 'General Dentistry'}{user?.email ? ` · ${user.email}` : ''}</p>
                    </div>

                    {/* Change photo button */}
                    <button
                      type="button"
                      className="profile-unified-change-photo-btn"
                      onClick={() => document.getElementById('profilePhotoInput').click()}
                    >
                      <Camera size={14} />
                      {profilePhoto ? 'Change photo' : 'Upload photo'}
                    </button>
                    {photoFile && (
                      <span style={{ fontSize: '12px', color: '#64748b' }}>{photoFile.name}</span>
                    )}
                  </div>

                  {/* ── 2-column form grid ── */}
                  <div className="profile-unified-form">

                    <div className="profile-unified-field">
                      <label className="profile-unified-label">Dental Specialization</label>
                      <select
                        className="profile-input-field"
                        value={profileSpecialization}
                        onChange={(e) => setProfileSpecialization(e.target.value)}
                      >
                        {SPECIALIZATIONS.map(spec => (
                          <option key={spec} value={spec}>{spec}</option>
                        ))}
                      </select>
                    </div>

                    <div className="profile-unified-field">
                      <label className="profile-unified-label">Clinic Contact Phone</label>
                      <input
                        type="tel"
                        className="profile-input-field"
                        value={profilePhone}
                        onChange={(e) => setProfilePhone(e.target.value)}
                      />
                    </div>

                    <div className="profile-unified-field">
                      <label className="profile-unified-label">Clinic Name</label>
                      <input
                        type="text"
                        className="profile-input-field"
                        value={profileClinicName}
                        onChange={(e) => setProfileClinicName(e.target.value)}
                      />
                    </div>

                    <div className="profile-unified-field">
                      <label className="profile-unified-label">Professional Experience (years)</label>
                      <input
                        type="number"
                        className="profile-input-field"
                        min="0"
                        value={profileExperience}
                        onChange={(e) => setProfileExperience(e.target.value)}
                      />
                    </div>

                    <div className="profile-unified-field full-span">
                      <label className="profile-unified-label">Clinic Address</label>
                      <input
                        type="text"
                        className="profile-input-field"
                        value={profileClinicAddress}
                        onChange={(e) => setProfileClinicAddress(e.target.value)}
                      />
                    </div>

                    <div className="profile-unified-field full-span" style={{ position: 'relative' }}>
                      <label className="profile-unified-label">Serving City</label>
                      <input
                        type="text"
                        className="profile-input-field"
                        placeholder="Search city..."
                        value={profileCitySearch}
                        onChange={(e) => {
                          setProfileCitySearch(e.target.value);
                          setProfileCity('');
                          setShowCityDropdown(true);
                        }}
                        onFocus={() => setShowCityDropdown(true)}
                      />
                      {showCityDropdown && filteredCities.length > 0 && (
                        <div className="city-dropdown-list open" style={{ position: 'absolute', width: '100%', zIndex: 10 }}>
                          {filteredCities.map((item) => (
                            <div
                              key={item}
                              className="city-option"
                              onClick={() => {
                                setProfileCitySearch(item.charAt(0).toUpperCase() + item.slice(1));
                                setProfileCity(item);
                                setShowCityDropdown(false);
                              }}
                            >
                              {item.charAt(0).toUpperCase() + item.slice(1)}
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="alert alert-warning" style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <AlertCircle size={16} />
                        <span>Changing your city updates your location queue. You will only receive dental scans uploaded from the new city.</span>
                      </div>
                    </div>

                  </div>

                  {/* ── Footer row ── */}
                  <div className="profile-unified-footer">
                    <button type="submit" className="btn btn-primary profile-submit-button">
                      Save changes
                    </button>
                  </div>

                </div>
              </form>
            </section>
          )}

        </div>
      </main>

      {/* Review Modal */}
      {selectedReport && (
        <div className="modal-overlay open" onClick={() => setSelectedReport(null)}>
          <div className="modal" style={{ maxWidth: '640px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">
                {selectedReport.status === 'reviewed' ? 'Patient Scan Review Details' : 'Submit Clinical Feedback'}
              </span>
              <button className="modal-close" onClick={() => setSelectedReport(null)}>
                <X size={16} />
              </button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '20px', marginBottom: '20px' }}>
                <div>
                  <img 
                    src={getImageUrl(selectedReport?.imagePath || selectedReport?.image || selectedReport?.imageUrl) || DENTAL_FALLBACK_SCAN} 
                    alt="Dental Scan" 
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = DENTAL_FALLBACK_SCAN;
                    }}
                    style={{ width: '100%', borderRadius: '12px', border: '1px solid var(--border)', objectFit: 'cover', height: '140px' }} 
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '14px' }}>
                  <h4 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', marginBottom: '4px' }}>Patient: {selectedReport.patientName}</h4>
                  <p><strong>City location:</strong> <span style={{ textTransform: 'capitalize' }}>{selectedReport.patientCity}</span></p>
                  <p><strong>AI scan findings:</strong> {selectedReport.aiFindings?.conditions?.join(', ') || 'No issues detected'}</p>
                  <p><strong>Severity:</strong> <span style={{ textTransform: 'capitalize' }}>{selectedReport.aiFindings?.severity}</span></p>
                  <p><strong>Model confidence:</strong> {selectedReport.aiFindings?.confidence || '—'}%</p>
                </div>
              </div>

              {selectedReport.status === 'reviewed' ? (
                <div className="card" style={{ padding: '20px', backgroundColor: '#f8fafc', border: '1px solid var(--border)' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '10px' }}>Submitted Feedback Details</h4>
                  <p style={{ fontSize: '13px', marginBottom: '10px' }}><strong>Recommendation:</strong> {selectedReport.doctorFeedback?.recommendation || 'None'}</p>
                  <p style={{ fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Clinical Observation Notes:</p>
                  <p style={{ whiteSpace: 'pre-wrap', padding: '12px', backgroundColor: 'white', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '13px', color: '#334155' }}>
                    {selectedReport.doctorFeedback?.notes || '—'}
                  </p>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '12px', textAlign: 'right' }}>
                    Reviewed on: {new Date(selectedReport.doctorFeedback?.reviewedAt).toLocaleString()}
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmitReview} noValidate>
                  <div className="form-group">
                    <label className="form-label">Doctor Recommendation <span>*</span></label>
                    <select 
                      className="form-control select-control" 
                      value={recommendation} 
                      onChange={(e) => setRecommendation(e.target.value)}
                    >
                      <option value="">Select recommendation</option>
                      {RECOMMENDATIONS.map(rec => (
                        <option key={rec} value={rec}>{rec}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Clinical Observation Notes <span>*</span></label>
                    <textarea 
                      className="form-control" 
                      rows="4" 
                      placeholder="Add clinical observation notes, gum details, cavity treatment suggestions..." 
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>Submit Feedback Report</button>
                </form>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setSelectedReport(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Appointment Details Modal */}
      {viewingAppointment && (
        <div className="modal-overlay open" onClick={() => setViewingAppointment(null)}>
          <div className="modal" style={{ maxWidth: '540px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Appointment Details</span>
              <button className="modal-close" onClick={() => setViewingAppointment(null)}>
                <X size={16} />
              </button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* Patient Info Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', paddingBottom: '16px', borderBottom: '1px solid #f1f5f9' }}>
                <div style={{ 
                  width: '54px', 
                  height: '54px', 
                  borderRadius: '50%', 
                  background: '#eff6ff', 
                  color: '#2563eb', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  fontSize: '20px',
                  fontWeight: '700'
                }}>
                  {viewingAppointment.patientName ? viewingAppointment.patientName.slice(0, 2).toUpperCase() : 'PT'}
                </div>
                <div>
                  <h4 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', margin: '0 0 2px 0' }}>
                    {viewingAppointment.patientName}
                  </h4>
                  <p style={{ fontSize: '13px', color: '#64748b', fontWeight: '500', margin: 0 }}>
                    Patient ID: #{viewingAppointment.patientId?.slice(-6) || '—'}
                  </p>
                </div>
              </div>

              {/* Schedule Details */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <div style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.05em' }}>Date</div>
                  <div style={{ fontSize: '15px', fontWeight: '600', color: '#334155', marginTop: '4px' }}>
                    {new Date(viewingAppointment.date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.05em' }}>Time Slot</div>
                  <div style={{ fontSize: '15px', fontWeight: '600', color: '#334155', marginTop: '4px' }}>
                    {viewingAppointment.time}
                  </div>
                </div>
              </div>

              {/* Clinic & Location */}
              <div>
                <div style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.05em' }}>Clinic Location</div>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#334155', marginTop: '4px' }}>
                  {viewingAppointment.doctorClinicName || user?.clinicName || 'AI Dental Clinic'}
                </div>
                <div style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
                  {viewingAppointment.doctorClinicAddress || user?.clinicAddress || 'Clinic Address'}
                </div>
              </div>

              {/* Patient Profile Highlights (if available) */}
              {viewingAppointment.patientDetails && (
                <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', fontWeight: '700', marginBottom: '6px' }}>Patient Info</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', fontSize: '13px', color: '#334155' }}>
                    <div><strong>City:</strong> <span style={{ textTransform: 'capitalize' }}>{viewingAppointment.patientDetails.city || '—'}</span></div>
                    <div><strong>Age:</strong> {viewingAppointment.patientDetails.age || '—'}</div>
                    <div><strong>Gender:</strong> <span style={{ textTransform: 'capitalize' }}>{viewingAppointment.patientDetails.gender || '—'}</span></div>
                  </div>
                  {viewingAppointment.patientDetails.phone && (
                    <div style={{ fontSize: '13px', color: '#334155', marginTop: '6px' }}>
                      <strong>Phone:</strong> {viewingAppointment.patientDetails.phone}
                    </div>
                  )}
                  {viewingAppointment.patientDetails.medicalHistory && (
                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '6px' }}>
                      <strong>Medical History:</strong> {viewingAppointment.patientDetails.medicalHistory}
                    </div>
                  )}
                </div>
              )}

              {/* Status Section */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#f8fafc', borderRadius: '10px' }}>
                <span style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>Check-up Status:</span>
                <span 
                  style={{
                    display: 'inline-block',
                    padding: '4px 14px',
                    borderRadius: '99px',
                    fontSize: '12px',
                    fontWeight: '700',
                    textTransform: 'capitalize',
                    background: viewingAppointment.status === 'confirmed' ? '#dcfce7' : 
                                viewingAppointment.status === 'pending' ? '#fef3c7' : 
                                viewingAppointment.status === 'completed' ? '#dbeafe' : '#fee2e2',
                    color: viewingAppointment.status === 'confirmed' ? '#15803d' : 
                           viewingAppointment.status === 'pending' ? '#b45309' : 
                           viewingAppointment.status === 'completed' ? '#1d4ed8' : '#b91c1c',
                  }}
                >
                  {viewingAppointment.status}
                </span>
              </div>

            </div>

            {/* Modal Footer with Actions */}
            <div className="modal-footer" style={{ padding: '16px 20px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: '10px', flexWrap: 'wrap' }}>
              
              {/* PENDING State: Doctor can Confirm or Decline */}
              {viewingAppointment.status === 'pending' && (
                <>
                  <button
                    type="button"
                    disabled={actionLoading}
                    className="btn btn-outline btn-sm btn-danger-hover"
                    onClick={() => handleRejectAppointment(viewingAppointment._id)}
                    style={{ borderRadius: '8px' }}
                  >
                    Decline Request
                  </button>
                  <button
                    type="button"
                    disabled={actionLoading}
                    className="btn btn-primary btn-sm"
                    onClick={() => handleConfirmAppointment(viewingAppointment._id)}
                    style={{ borderRadius: '8px', background: '#16a34a', borderColor: '#16a34a' }}
                  >
                    <Check size={14} style={{ marginRight: '4px' }} />
                    Confirm Appointment
                  </button>
                </>
              )}

              {/* CONFIRMED State: Doctor can Mark as Completed or Cancel */}
              {viewingAppointment.status === 'confirmed' && (
                <>
                  <button
                    type="button"
                    disabled={actionLoading}
                    className="btn btn-outline btn-sm btn-danger-hover"
                    onClick={() => handleCancelAppointment(viewingAppointment._id)}
                    style={{ borderRadius: '8px' }}
                  >
                    Cancel Appointment
                  </button>
                  <button
                    type="button"
                    disabled={actionLoading}
                    className="btn btn-primary btn-sm"
                    onClick={() => handleCompleteAppointment(viewingAppointment._id)}
                    style={{ borderRadius: '8px', background: '#2563eb', borderColor: '#2563eb' }}
                  >
                    <CheckCircle size={14} style={{ marginRight: '4px' }} />
                    Mark Check-up Completed
                  </button>
                </>
              )}

              {/* COMPLETED State: Inspection badge */}
              {viewingAppointment.status === 'completed' && (
                <div style={{ color: '#16a34a', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle size={16} /> Check-up finished and completed
                </div>
              )}

              <button 
                type="button" 
                className="btn btn-ghost btn-sm" 
                onClick={() => setViewingAppointment(null)} 
                style={{ borderRadius: '8px' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
