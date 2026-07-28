import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { patientService } from '../../services/api/patientService';
import { appointmentService } from '../../services/api/appointmentService';
import io from 'socket.io-client';
import { 
  Camera, 
  AlertTriangle, 
  Stethoscope, 
  Clock, 
  FileText, 
  Calendar, 
  User, 
  LogOut, 
  Menu, 
  Search, 
  X, 
  Check, 
  UploadCloud,
  MapPin,
  AlertCircle,
  TrendingUp,
  Sliders,
  Sparkles
} from 'lucide-react';

const CITIES = ['mumbai', 'delhi', 'bangalore', 'hyderabad', 'ahmedabad', 'chennai', 'kolkata', 'surat', 'pune', 'jaipur'];

export default function PatientDashboard() {
  const { user, logout } = useAuthStore();
  const [activeSection, setActiveSection] = useState('overview');
  
  // Responsive sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // States
  const [reports, setReports] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [patientProfile, setPatientProfile] = useState(null);
  const [stats, setStats] = useState({ scans: 0, issues: 0, reviews: 0 });
  const [loading, setLoading] = useState(false);
  
  // Modals
  const [selectedReport, setSelectedReport] = useState(null);
  const [bookingDoctor, setBookingDoctor] = useState(null);
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('09:00 AM');

  // Profile Form
  const [profileAge, setProfileAge] = useState('');
  const [profileGender, setProfileGender] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileMedicalHistory, setProfileMedicalHistory] = useState('');
  const [profileCitySearch, setProfileCitySearch] = useState('');
  const [profileCity, setProfileCity] = useState('');
  const [filteredCities, setFilteredCities] = useState([]);
  const [showCityDropdown, setShowCityDropdown] = useState(false);

  // Scan Upload states
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadPreview, setUploadPreview] = useState('');
  const [uploadPhase, setUploadPhase] = useState('idle'); // idle, loading, complete
  const [analysisStep, setAnalysisStep] = useState(1);
  const [aiResult, setAiResult] = useState(null);

  // Toasts
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Get reports
      const repData = await patientService.getReports();
      const userReports = repData.reports || [];
      setReports(userReports);

      // 2. Get appointments
      const apptsData = await appointmentService.getMyAppointments();
      setAppointments(apptsData.appointments || []);

      // 3. Get profile
      const profData = await patientService.getProfile();
      if (profData.patient) {
        const p = profData.patient;
        setPatientProfile(p);
        setProfileAge(p.age || '');
        setProfileGender(p.gender || '');
        setProfilePhone(p.phone || '');
        setProfileMedicalHistory(p.medicalHistory || '');
        setProfileCity(p.city || '');
        setProfileCitySearch(p.city ? p.city.charAt(0).toUpperCase() + p.city.slice(1) : '');

        // 4. Get doctors in city
        if (p.city) {
          const docData = await patientService.getDoctors(p.city);
          setDoctors(docData.doctors || []);
        }
      }

      // Calculate stats
      const totalScans = userReports.length;
      let issuesCount = 0;
      let reviewsCount = 0;
      userReports.forEach((r) => {
        if (r.aiFindings?.issueDetected) issuesCount++;
        if (r.doctorFeedback?.reviewed) reviewsCount++;
      });
      setStats({ scans: totalScans, issues: issuesCount, reviews: reviewsCount });

    } catch (err) {
      console.error('Error fetching patient dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Socket.io Notification Listener
  useEffect(() => {
    if (!user) return;
    const socket = io();
    const userId = user.id || user._id;
    
    socket.emit('join', userId);
    
    socket.on('notification', (data) => {
      addToast(data.message, 'info');
      // Reload data
      loadData();
    });

    return () => {
      socket.disconnect();
    };
  }, [user]);

  useEffect(() => {
    if (profileCitySearch.trim()) {
      const match = CITIES.filter(c => c.includes(profileCitySearch.toLowerCase()));
      setFilteredCities(match);
    } else {
      setFilteredCities([]);
    }
  }, [profileCitySearch]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File size exceeds 5MB limit');
        return;
      }
      setUploadFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      if (!file.type.match('image.*')) {
        alert('Only images are allowed');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert('File size exceeds 5MB limit');
        return;
      }
      setUploadFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!uploadFile) return;
    setUploadPhase('loading');
    setAnalysisStep(1);

    const formData = new FormData();
    formData.append('image', uploadFile);

    // Simulate progress steps
    const stepInterval = setInterval(() => {
      setAnalysisStep((step) => {
        if (step < 3) return step + 1;
        return step;
      });
    }, 1500);

    try {
      const data = await patientService.uploadDentalScan(formData);
      clearInterval(stepInterval);
      setAnalysisStep(4);
      setTimeout(() => {
        setAiResult(data.report);
        setUploadPhase('complete');
        addToast('AI Analysis finished! Report generated.', 'success');
        loadData();
      }, 1000);
    } catch (err) {
      clearInterval(stepInterval);
      console.error(err);
      alert(err.response?.data?.message || 'Scan processing failed');
      setUploadPhase('idle');
    }
  };

  const resetScan = () => {
    setUploadFile(null);
    setUploadPreview('');
    setUploadPhase('idle');
    setAnalysisStep(1);
    setAiResult(null);
  };

  const handleCancelAppointment = async (id) => {
    if (!window.confirm('Cancel appointment?')) return;
    try {
      await appointmentService.cancelAppointment(id);
      addToast('Appointment cancelled successfully', 'warning');
      const apptsData = await appointmentService.getMyAppointments();
      setAppointments(apptsData.appointments || []);
    } catch (err) {
      console.error(err);
      alert('Failed to cancel appointment');
    }
  };

  const handleOpenBooking = (doc) => {
    setBookingDoctor(doc);
    setBookingDate('');
    setBookingTime('09:00 AM');
  };

  const handleConfirmBooking = async () => {
    if (!bookingDate) {
      alert('Date is required');
      return;
    }
    try {
      await appointmentService.bookAppointment({
        doctorId: bookingDoctor._id,
        date: bookingDate,
        time: bookingTime
      });
      addToast('Appointment booked successfully!', 'success');
      setBookingDoctor(null);
      const apptsData = await appointmentService.getMyAppointments();
      setAppointments(apptsData.appointments || []);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Booking failed');
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!profileCity) {
      alert('City is required');
      return;
    }
    try {
      const payload = {
        age: profileAge ? parseInt(profileAge) : undefined,
        gender: profileGender,
        phone: profilePhone,
        city: profileCity,
        medicalHistory: profileMedicalHistory
      };
      await patientService.updateProfile(payload);
      addToast('Profile updated!', 'success');
      loadData();
    } catch (err) {
      console.error(err);
      alert('Failed to save profile');
    }
  };

  return (
    <div className={`dashboard-layout ${sidebarOpen ? 'sidebar-open' : ''}`}>
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <img src="/logo.png" alt="AI Dental Care Logo" className="sidebar-logo-img" />
          <div>
            <div className="sidebar-logo-text">AI Dental Care</div>
            <div className="sidebar-logo-sub">Patient Portal</div>
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
            className={`nav-item ${activeSection === 'scan' ? 'active' : ''}`}
            onClick={() => { setActiveSection('scan'); setSidebarOpen(false); }}
          >
            <span>Upload Scan</span>
          </button>
          <button 
            type="button"
            className={`nav-item ${activeSection === 'reports' ? 'active' : ''}`}
            onClick={() => { setActiveSection('reports'); setSidebarOpen(false); }}
          >
            <span>My Reports</span>
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
            className={`nav-item ${activeSection === 'doctors' ? 'active' : ''}`}
            onClick={() => { setActiveSection('doctors'); setSidebarOpen(false); }}
          >
            <span>Find Doctors</span>
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
          <div className="sidebar-user">
            <div className="sidebar-avatar-new">
              <span className="sidebar-avatar-text">PA</span>
            </div>
            <div className="sidebar-user-details">
              <div className="sidebar-user-name" style={{ textTransform: 'capitalize' }}>{user?.name}</div>
              <div className="sidebar-user-role" style={{ textTransform: 'capitalize' }}>{user?.city || '—'}</div>
            </div>
          </div>
          <button type="button" className="btn-signout-new" onClick={logout}>
            <LogOut size={14} />
            <span>Sign Out</span>
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
              {activeSection === 'scan' && 'Upload Dental Scan'}
              {activeSection === 'reports' && 'My Diagnostics Sheets'}
              {activeSection === 'appointments' && 'My Appointments'}
              {activeSection === 'doctors' && 'Find Same-City Dentists'}
              {activeSection === 'profile' && 'My Profile'}
            </span>
          </div>
          <div className="topbar-right">
            <span className="topbar-badge-role" style={{ textTransform: 'capitalize' }}>City: {user?.city || '—'}</span>
          </div>
        </div>

        <div className="page-content">
          {loading && (
            <div className="loading-indicator-new">
              <div className="spinner-sm"></div>
              <span>Syncing diagnostics profile...</span>
            </div>
          )}

          {/* SECTION: Overview */}
          {activeSection === 'overview' && (
            <section className="section active">
              <div className="page-header">
                <h2>Welcome back, {user?.name}!</h2>
                <p>Dental diagnostics and checkup overview</p>
              </div>

              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon-wrapper-new blue">
                    <Camera size={20} />
                  </div>
                  <div>
                    <div className="stat-value">{stats.scans}</div>
                    <div className="stat-label">Total Scans</div>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon-wrapper-new amber">
                    <AlertTriangle size={20} />
                  </div>
                  <div>
                    <div className="stat-value">{stats.issues}</div>
                    <div className="stat-label">Issues Detected</div>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon-wrapper-new green">
                    <Stethoscope size={20} />
                  </div>
                  <div>
                    <div className="stat-value">{stats.reviews}</div>
                    <div className="stat-label">Doctor Reviews</div>
                  </div>
                </div>
              </div>

              <div className="dashboard-double-column-new">
                <div className="card">
                  <div className="card-header">
                    <span className="card-title">Quick Actions</span>
                  </div>
                  <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <button type="button" className="btn btn-primary" style={{ justifyContent: 'center' }} onClick={() => setActiveSection('scan')}>
                      Upload New Scan
                    </button>
                    <button type="button" className="btn btn-outline" style={{ justifyContent: 'center' }} onClick={() => setActiveSection('reports')}>
                      View My Reports
                    </button>
                    <button type="button" className="btn btn-ghost" style={{ justifyContent: 'center' }} onClick={() => setActiveSection('doctors')}>
                      Find Same-City Clinicians
                    </button>
                  </div>
                </div>
                
                <div className="card">
                  <div className="card-header">
                    <span className="card-title">Latest Scan Status</span>
                  </div>
                  <div className="card-body">
                    {reports.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '14px' }}>
                        <p><strong>Upload Date:</strong> {new Date(reports[0].createdAt).toLocaleDateString()}</p>
                        <p><strong>AI Findings:</strong> {reports[0].aiFindings?.conditions?.join(', ') || 'No issues detected'}</p>
                        <p>
                          <strong>Doctor Review:</strong> 
                          <span className={`badge badge-${reports[0].status === 'reviewed' ? 'green' : 'amber'}`} style={{ marginLeft: '8px' }}>
                            {reports[0].status}
                          </span>
                        </p>
                        <button type="button" className="btn btn-ghost btn-sm" style={{ marginTop: '8px', alignSelf: 'flex-start' }} onClick={() => setSelectedReport(reports[0])}>
                          View Full Details
                        </button>
                      </div>
                    ) : (
                      <div className="empty-state-card-new">
                        <FileText size={24} className="text-muted" style={{ marginBottom: '8px' }} />
                        <p>No dental scans uploaded yet</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* SECTION: Upload Scan */}
          {activeSection === 'scan' && (
            <section className="section active">
              <div className="page-header">
                <h2>Upload Dental Scan</h2>
                <p>Upload a high-quality photo of your teeth for digital AI analysis</p>
              </div>

              <div className="alert alert-info" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MapPin size={16} />
                <span>Reports containing structural dental issues are automatically queued for verified dentists in your city (<span style={{ textTransform: 'capitalize' }}>{user?.city}</span>).</span>
              </div>

              <div className="card" style={{ marginTop: '16px' }}>
                <div className="card-body">
                  {uploadPhase === 'idle' && (
                    <div 
                      className="upload-zone"
                      onDragOver={handleDragOver}
                      onDrop={handleDrop}
                      onClick={() => document.getElementById('scanFileInput').click()}
                    >
                      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
                        <UploadCloud size={40} className="text-muted" />
                      </div>
                      {uploadFile ? (
                        <div>
                          <h3 style={{ fontSize: '15px' }}>{uploadFile.name}</h3>
                          <p>Ready to upload. Click below to analyze with AI.</p>
                        </div>
                      ) : (
                        <div>
                          <h3>Drag &amp; Drop your teeth photo here</h3>
                          <p>or click to browse &mdash; JPG, PNG up to 5MB</p>
                        </div>
                      )}
                    </div>
                  )}

                  {uploadPhase === 'idle' && uploadPreview && (
                    <div className="upload-preview" style={{ display: 'block', marginTop: '16px', textAlign: 'center' }}>
                      <img src={uploadPreview} alt="Preview" style={{ maxWidth: '320px', borderRadius: '12px', border: '1px solid var(--border)' }} />
                    </div>
                  )}

                  <input 
                    type="file" 
                    id="scanFileInput" 
                    accept=".jpg,.jpeg,.png" 
                    style={{ display: 'none' }} 
                    onChange={handleFileChange}
                  />

                  {uploadPhase === 'idle' && uploadFile && (
                    <div style={{ marginTop: '16px', display: 'flex', gap: '10px' }}>
                      <button type="button" className="btn btn-ghost btn-sm" onClick={resetScan}>Change Image</button>
                      <button type="button" className="btn btn-primary" onClick={handleAnalyze}>Analyze with AI</button>
                    </div>
                  )}

                  {uploadPhase === 'loading' && (
                    <div className="analysis-phase">
                      <h3 style={{ marginBottom: '4px', fontSize: '16px', fontWeight: '700' }}>AI Analysis in Progress</h3>
                      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>Please wait while the AI examines your image</p>
                      
                      <div className="analysis-steps">
                        <div className={`analysis-step ${analysisStep >= 1 ? 'active' : ''}`}>
                          <div className={`step-dot ${analysisStep > 1 ? 'done' : 'active'}`}>
                            {analysisStep > 1 ? <Check size={12} strokeWidth={3} /> : '1'}
                          </div>
                          <span>Image uploaded successfully</span>
                        </div>
                        <div className={`analysis-step ${analysisStep >= 2 ? 'active' : ''}`}>
                          <div className={`step-dot ${analysisStep > 2 ? 'done' : analysisStep === 2 ? 'active' : ''}`}>
                            {analysisStep > 2 ? <Check size={12} strokeWidth={3} /> : '2'}
                          </div>
                          <span>AI analyzing your dental image...</span>
                        </div>
                        <div className={`analysis-step ${analysisStep >= 3 ? 'active' : ''}`}>
                          <div className={`step-dot ${analysisStep > 3 ? 'done' : analysisStep === 3 ? 'active' : ''}`}>
                            {analysisStep > 3 ? <Check size={12} strokeWidth={3} /> : '3'}
                          </div>
                          <span>Generating report...</span>
                        </div>
                        <div className={`analysis-step ${analysisStep >= 4 ? 'active' : ''}`}>
                          <div className={`step-dot ${analysisStep >= 4 ? 'done' : ''}`}>
                            {analysisStep >= 4 ? <Check size={12} strokeWidth={3} /> : '4'}
                          </div>
                          <span>Finding dentist in your city...</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {uploadPhase === 'complete' && aiResult && (
                    <div className="results-phase">
                      <h3 style={{ color: 'var(--success)', marginBottom: '16px', fontSize: '18px', fontWeight: '700' }}>AI Dental Analysis Completed!</h3>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px', marginBottom: '20px' }}>
                        <div>
                          <img src={aiResult.imagePath} alt="Scan Result" style={{ width: '100%', borderRadius: '12px', border: '1px solid var(--border)', objectFit: 'cover', height: '140px' }} />
                        </div>
                        <div style={{ fontSize: '14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <p><strong>Health Score:</strong> {aiResult.aiFindings?.confidence || '—'}%</p>
                          <p><strong>Severity:</strong> <span style={{ textTransform: 'capitalize' }}>{aiResult.aiFindings?.severity}</span></p>
                          <p><strong>Detected Conditions:</strong> {aiResult.aiFindings?.conditions?.join(', ') || 'No issues found!'}</p>
                          <p><strong>Assigned Doctor:</strong> {aiResult.doctorName ? `Dr. ${aiResult.doctorName} (${aiResult.doctorCity})` : 'Pending Auto-Assignment (No doctor available in your city)'}</p>
                          <p style={{ marginTop: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                            {aiResult.aiFindings?.description}
                          </p>
                        </div>
                      </div>
                      <button type="button" className="btn btn-outline" onClick={resetScan}>Scan Another Image</button>
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* SECTION: Reports */}
          {activeSection === 'reports' && (
            <section className="section active">
              <div className="page-header">
                <h2>My Diagnostics Sheets</h2>
                <p>AI scans and clinical reviews of your uploaded teeth images</p>
              </div>

              {reports.length === 0 ? (
                <div className="empty-state-new">
                  <div className="empty-icon-wrapper-new warning">
                    <FileText size={32} />
                  </div>
                  <h3>No reports yet</h3>
                  <p>Upload your first dental scan image in "Upload Scan" to generate report details.</p>
                </div>
              ) : (
                <div className="card">
                  <div className="table-wrapper">
                    <table>
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Detected Conditions</th>
                          <th>Confidence</th>
                          <th>Status</th>
                          <th style={{ textAlign: 'right' }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reports.map((rep) => (
                          <tr key={rep._id}>
                            <td>{new Date(rep.createdAt).toLocaleDateString()}</td>
                            <td style={{ fontWeight: '600' }}>{rep.aiFindings?.conditions?.join(', ') || 'No issues found'}</td>
                            <td>{rep.aiFindings?.confidence || '—'}%</td>
                            <td>
                              <span className={`badge badge-${rep.status === 'reviewed' ? 'green' : 'amber'}`}>{rep.status}</span>
                            </td>
                            <td>
                              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setSelectedReport(rep)}>View Details</button>
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

          {/* SECTION: Find Doctors */}
          {activeSection === 'doctors' && (
            <section className="section active">
              <div className="page-header">
                <h2>Verified Dentists in <span style={{ textTransform: 'capitalize' }}>{user?.city}</span></h2>
                <p>Book same-city appointments for in-person dental care</p>
              </div>

              {doctors.length === 0 ? (
                <div className="empty-state-new">
                  <div className="empty-icon-wrapper-new warning">
                    <Stethoscope size={32} />
                  </div>
                  <h3>No dentists in your city yet</h3>
                  <p>Verified clinics are currently registering in your city. Check back later or update your city in profile to see other locations.</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                  {doctors.map((doc) => (
                    <div key={doc._id} className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
                      <div>
                        <h4 style={{ color: 'var(--primary)', marginBottom: '12px', fontSize: '16px', fontWeight: '700' }}>Dr. {doc.name}</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                          <p><strong>Specialization:</strong> {doc.doctorDetails?.specialization}</p>
                          <p><strong>Experience:</strong> {doc.doctorDetails?.experienceYears} years</p>
                          <p><strong>Clinic:</strong> {doc.doctorDetails?.clinicName}</p>
                          <p style={{ fontSize: '12px', marginTop: '4px', lineHeight: 1.4 }}>{doc.doctorDetails?.clinicAddress}</p>
                        </div>
                      </div>
                      <button 
                        type="button" 
                        className="btn btn-primary btn-sm btn-full" 
                        onClick={() => handleOpenBooking(doc)}
                      >
                        Book Appointment
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* SECTION: Appointments */}
          {activeSection === 'appointments' && (
            <section className="section active">
              <div className="page-header">
                <h2>My Appointments</h2>
                <p>Track scheduled dental checkups and clinical status</p>
              </div>

              <div className="card">
                <div className="card-body">
                  {appointments.length === 0 ? (
                    <div className="empty-state-card-new" style={{ padding: '60px 24px' }}>
                      <Calendar size={36} className="text-muted" style={{ marginBottom: '12px' }} />
                      <h3>No scheduled appointments</h3>
                      <p>You can find verified dentists in your city to book an appointment.</p>
                    </div>
                  ) : (
                    <div className="table-wrapper">
                      <table>
                        <thead>
                          <tr>
                            <th>Doctor</th>
                            <th>Clinic Details</th>
                            <th>Date</th>
                            <th>Time Slot</th>
                            <th>Booking Status</th>
                            <th style={{ textAlign: 'right' }}>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {appointments.map((appt) => (
                            <tr key={appt._id}>
                              <td style={{ fontWeight: '600' }}>Dr. {appt.doctorName}</td>
                              <td>
                                <div style={{ fontWeight: 600 }}>{appt.doctorClinicName}</div>
                                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{appt.doctorClinicAddress}</div>
                              </td>
                              <td>{new Date(appt.date).toLocaleDateString()}</td>
                              <td>{appt.time}</td>
                              <td>
                                <span className={`badge badge-${appt.status === 'confirmed' ? 'green' : appt.status === 'canceled' ? 'red' : 'amber'}`}>
                                  {appt.status}
                                </span>
                              </td>
                              <td>
                                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                  {appt.status !== 'canceled' && (
                                    <button type="button" className="btn btn-outline btn-sm btn-danger-hover" onClick={() => handleCancelAppointment(appt._id)}>
                                      <X size={12} /> Cancel
                                    </button>
                                  )}
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
                <p>Manage and update your personal and location details</p>
              </div>

              <div className="card">
                <div className="card-body">
                  <form onSubmit={handleSaveProfile} noValidate>
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Full Name</label>
                        <input type="text" className="form-control" value={user?.name || ''} disabled style={{ backgroundColor: '#f8fafc', cursor: 'not-allowed' }} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Registered Email</label>
                        <input type="email" className="form-control" value={user?.email || ''} disabled style={{ backgroundColor: '#f8fafc', cursor: 'not-allowed' }} />
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Age</label>
                        <input 
                          type="number" 
                          className="form-control" 
                          min="1" 
                          max="120" 
                          value={profileAge}
                          onChange={(e) => setProfileAge(e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Gender</label>
                        <select 
                          className="form-control select-control" 
                          value={profileGender}
                          onChange={(e) => setProfileGender(e.target.value)}
                        >
                          <option value="">Select gender</option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Contact Phone</label>
                      <input 
                        type="tel" 
                        className="form-control" 
                        value={profilePhone}
                        onChange={(e) => setProfilePhone(e.target.value)}
                      />
                    </div>

                    <div className="form-group" style={{ position: 'relative' }}>
                      <label className="form-label">City</label>
                      <input 
                        type="text" 
                        className="form-control" 
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
                        <span>Changing your city changes your diagnostic queue location. Scans will be matched to dentists in the new city.</span>
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Medical History</label>
                      <textarea 
                        className="form-control" 
                        placeholder="Existing medical conditions, gum concerns, drug allergies..."
                        value={profileMedicalHistory}
                        onChange={(e) => setProfileMedicalHistory(e.target.value)}
                      />
                    </div>

                    <button type="submit" className="btn btn-primary">Save Profile Changes</button>
                  </form>
                </div>
              </div>
            </section>
          )}

        </div>
      </main>

      {/* Booking Modal */}
      {bookingDoctor && (
        <div className="modal-overlay open" onClick={() => setBookingDoctor(null)}>
          <div className="modal" style={{ maxWidth: '440px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Book Appointment</span>
              <button className="modal-close" onClick={() => setBookingDoctor(null)}>
                <X size={16} />
              </button>
            </div>
            <div className="modal-body">
              <p style={{ fontWeight: '700', marginBottom: '16px', color: 'var(--primary)', fontSize: '15px' }}>Dr. {bookingDoctor.name}</p>
              <div className="form-group">
                <label className="form-label">Select Date</label>
                <input 
                  type="date" 
                  className="form-control" 
                  value={bookingDate} 
                  onChange={(e) => setBookingDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Select Time Slot</label>
                <select 
                  className="form-control select-control" 
                  value={bookingTime} 
                  onChange={(e) => setBookingTime(e.target.value)}
                >
                  <option>09:00 AM</option>
                  <option>10:00 AM</option>
                  <option>11:00 AM</option>
                  <option>12:00 PM</option>
                  <option>02:00 PM</option>
                  <option>03:00 PM</option>
                  <option>04:00 PM</option>
                  <option>05:00 PM</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setBookingDoctor(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleConfirmBooking}>Confirm Booking</button>
            </div>
          </div>
        </div>
      )}

      {/* Report Details Modal */}
      {selectedReport && (
        <div className="modal-overlay open" onClick={() => setSelectedReport(null)}>
          <div className="modal" style={{ maxWidth: '640px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Report Details</span>
              <button className="modal-close" onClick={() => setSelectedReport(null)}>
                <X size={16} />
              </button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '20px', marginBottom: '20px' }}>
                <div>
                  <img 
                    src={selectedReport.imagePath} 
                    alt="Dental Scan" 
                    style={{ width: '100%', borderRadius: '12px', border: '1px solid var(--border)', objectFit: 'cover', height: '140px' }} 
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '14px' }}>
                  <h4 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', marginBottom: '4px' }}>Dental Scan Report</h4>
                  <p><strong>Health Score:</strong> {selectedReport.aiFindings?.confidence || '—'}%</p>
                  <p><strong>Findings:</strong> {selectedReport.aiFindings?.conditions?.join(', ') || 'No issues detected'}</p>
                  <p><strong>Severity:</strong> <span style={{ textTransform: 'capitalize' }}>{selectedReport.aiFindings?.severity}</span></p>
                  <p>
                    <strong>Status:</strong> 
                    <span className={`badge badge-${selectedReport.status === 'reviewed' ? 'green' : 'amber'}`} style={{ marginLeft: '8px' }}>
                      {selectedReport.status}
                    </span>
                  </p>
                </div>
              </div>
              
              <div style={{ padding: '20px', border: '1px solid var(--border)', borderRadius: '12px', backgroundColor: '#f8fafc' }}>
                <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '10px' }}>Clinical Dentist Feedback</h4>
                {selectedReport.status === 'reviewed' ? (
                  <div style={{ fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <p><strong>Assigned Doctor:</strong> Dr. {selectedReport.doctorName}</p>
                    <p><strong>Recommendation:</strong> {selectedReport.doctorFeedback?.recommendation || 'No recommendation specified'}</p>
                    <p style={{ fontWeight: '600', marginTop: '4px' }}>Feedback Observation Notes:</p>
                    <p style={{ whiteSpace: 'pre-wrap', padding: '12px', backgroundColor: 'white', border: '1px solid var(--border)', borderRadius: '8px', color: '#334155', lineHeight: 1.5 }}>
                      {selectedReport.doctorFeedback?.notes || '—'}
                    </p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                    <Clock size={16} />
                    <span>Pending clinical observation review by your same-city dentist: {selectedReport.doctorName ? `Dr. ${selectedReport.doctorName}` : 'No doctor assigned'}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setSelectedReport(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notifications */}
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
