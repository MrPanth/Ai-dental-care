import React, { useState, useEffect, useRef } from 'react';
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
  Sparkles,
  Activity,
  Building2,
  Plus
} from 'lucide-react';

const CITIES = ['mumbai', 'delhi', 'bangalore', 'hyderabad', 'ahmedabad', 'chennai', 'kolkata', 'surat', 'pune', 'jaipur'];

const getImageUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
    return path;
  }
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const baseUrl = backendUrl.replace(/\/api$/, '');
  return `${baseUrl}${cleanPath}`;
};

const DOCTOR_AVATARS = [
  'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=150', // Female doctor 1
  'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=150', // Male doctor 1
  'https://images.unsplash.com/photo-1594824813573-246434de83fb?auto=format&fit=crop&q=80&w=150', // Female doctor 2
  'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=150', // Male doctor 2
  'https://images.unsplash.com/photo-1591604021695-0c69b7c05981?auto=format&fit=crop&q=80&w=150', // Female doctor 3
  'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=150'  // Male doctor 3
];

const getDoctorAvatar = (doctorName = '', doctorId = '') => {
  const hashString = String(doctorName) + String(doctorId);
  let hash = 0;
  for (let i = 0; i < hashString.length; i++) {
    hash = hashString.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % DOCTOR_AVATARS.length;
  return DOCTOR_AVATARS[index];
};

const getVisitType = (specialty = '') => {
  switch (specialty) {
    case 'Orthodontics': return 'Braces Adjustment';
    case 'Periodontics': return 'Gum Check';
    case 'General Dentistry': return 'Cleaning';
    case 'Endodontics': return 'Root Canal Consult';
    case 'Oral Surgery': return 'Tooth Extraction';
    case 'Pediatric Dentistry': return 'Routine Checkup';
    case 'Prosthodontics': return 'Crown Fitting';
    case 'Cosmetic Dentistry': return 'Teeth Whitening';
    default: return 'Consultation';
  }
};

const getDoctorRating = (doctorName = '', doctorId = '') => {
  const hashString = String(doctorName) + String(doctorId);
  let hash = 0;
  for (let i = 0; i < hashString.length; i++) {
    hash = hashString.charCodeAt(i) + ((hash << 5) - hash);
  }
  const rating = 4.6 + (Math.abs(hash) % 4) * 0.1;
  const reviewsCount = 50 + (Math.abs(hash) % 131);
  return { rating: rating.toFixed(1), reviewsCount };
};

const getPatientAvatar = (gender = '') => {
  if (String(gender).toLowerCase() === 'female') {
    return 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=250';
  }
  return 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=250';
};

export default function PatientDashboard() {
  const { user, logout } = useAuthStore();
  const [activeSection, setActiveSection] = useState('overview');
  
  // Responsive sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Search states for Overview & Reports & Appointments
  const [reportSearch, setReportSearch] = useState('');
  const [doctorSearch, setDoctorSearch] = useState('');
  const [doctorSpecialtyFilter, setDoctorSpecialtyFilter] = useState('All');
  const [reportsFilter, setReportsFilter] = useState('all'); // 'all', 'reviewed', 'pending'
  const [appointmentSearch, setAppointmentSearch] = useState('');
  const [appointmentFilter, setAppointmentFilter] = useState('all'); // 'all', 'upcoming', 'completed'

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
  const [bookingTime, setBookingTime] = useState('10:00 AM');
  const [reschedulingAppointment, setReschedulingAppointment] = useState(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('10:00 AM');
  const [viewingAppointment, setViewingAppointment] = useState(null);
  const [showBookNewVisitModal, setShowBookNewVisitModal] = useState(false);

  // Profile Form
  const [profileAge, setProfileAge] = useState('');
  const [profileGender, setProfileGender] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileMedicalHistory, setProfileMedicalHistory] = useState('');
  const [profileCitySearch, setProfileCitySearch] = useState('');
  const [profileCity, setProfileCity] = useState('');
  const [filteredCities, setFilteredCities] = useState([]);
  const [showCityDropdown, setShowCityDropdown] = useState(false);

  // Profile picture states & ref
  const fileInputRef = useRef(null);
  const [uploadedAvatar, setUploadedAvatar] = useState(() => {
    return localStorage.getItem(`profile_avatar_${user?._id || 'guest'}`) || null;
  });

  // Scan Upload states
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadPreview, setUploadPreview] = useState('');
  const [uploadPhase, setUploadPhase] = useState('idle'); // idle, loading, complete
  const [analysisStep, setAnalysisStep] = useState(1);
  const [aiResult, setAiResult] = useState(null);
  
  const pendingReportIdRef = useRef(null);
  const stepIntervalRef = useRef(null);

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
    // Connect to backend server (port 5000) explicitly
    const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const socketUrl = backendUrl.replace(/\/api$/, '');
    const socket = io(socketUrl);
    const userId = user.id || user._id;
    
    socket.emit('join', userId);

    const handleNotification = async (data) => {
      // FIX: backend emits 'AI_ANALYSIS_COMPLETED' (with D), not 'AI_ANALYSIS_COMPLETE'
      if (
        (data.type === 'AI_ANALYSIS_COMPLETED' || data.type === 'AI_ANALYSIS_COMPLETE') &&
        data.reportId === pendingReportIdRef.current
      ) {
        try {
          const reportData = await patientService.getReportDetails(data.reportId);
          clearInterval(stepIntervalRef.current);
          setAnalysisStep(4);
          setAiResult(reportData.report);
          setUploadPhase('complete');
          addToast('AI Analysis finished! Report generated.', 'success');
          pendingReportIdRef.current = null;
          loadData();
        } catch(err) {
          console.error('Failed to load completed report', err);
        }
      } else if (
        (data.type === 'AI_ANALYSIS_FAILED') &&
        data.reportId === pendingReportIdRef.current
      ) {
        clearInterval(stepIntervalRef.current);
        addToast('AI analysis failed. Please try again with a clear dental image.', 'error');
        setUploadPhase('idle');
        pendingReportIdRef.current = null;
      }
    };

    socket.on('notification', handleNotification);

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

    stepIntervalRef.current = setInterval(() => {
      setAnalysisStep((step) => {
        if (step < 3) return step + 1;
        return step;
      });
    }, 1500);

    try {
      const data = await patientService.uploadDentalScan(formData);
      pendingReportIdRef.current = data.reportId;

      // Polling fallback: if socket events are missed, poll after 25s
      const pollTimeout = setTimeout(async () => {
        if (!pendingReportIdRef.current) return; // already handled by socket
        try {
          const reportData = await patientService.getReportDetails(data.reportId);
          const report = reportData.report;
          if (report && report.status !== 'processing') {
            clearInterval(stepIntervalRef.current);
            if (report.status === 'completed' || report.status === 'no_issue' || report.status === 'assigned') {
              setAnalysisStep(4);
              setAiResult(report);
              setUploadPhase('complete');
              addToast('AI Analysis finished! Report generated.', 'success');
            } else if (report.status === 'failed') {
              addToast(report.errorMessage || 'AI analysis failed. Please try again.', 'error');
              setUploadPhase('idle');
            }
            pendingReportIdRef.current = null;
            loadData();
          }
        } catch (pollErr) {
          console.error('Polling fallback error:', pollErr);
        }
      }, 25000);

      // Clear poll timeout if component unmounts
      return () => clearTimeout(pollTimeout);
    } catch (err) {
      clearInterval(stepIntervalRef.current);
      console.error(err);
      addToast(err.response?.data?.message || 'Scan processing failed. Please try again.', 'error');
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

  const handleBookAppointment = async (e) => {
    e.preventDefault();
    if (!bookingDoctor || !bookingDate || !bookingTime) {
      alert('Please select a doctor, date, and time');
      return;
    }
    try {
      await appointmentService.bookAppointment({
        doctorId: bookingDoctor._id,
        date: bookingDate,
        time: bookingTime,
      });
      addToast('Appointment booked successfully!', 'success');
      setBookingDoctor(null);
      setBookingDate('');
      setBookingTime('10:00 AM');
      loadData();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to book appointment');
    }
  };

  const handleRescheduleAppointment = async (e) => {
    e.preventDefault();
    if (!reschedulingAppointment || !rescheduleDate || !rescheduleTime) {
      alert('Please select date and time');
      return;
    }
    try {
      await appointmentService.rescheduleAppointment(reschedulingAppointment._id, {
        date: rescheduleDate,
        time: rescheduleTime,
      });
      addToast('Appointment rescheduled successfully!', 'success');
      setReschedulingAppointment(null);
      setRescheduleDate('');
      setRescheduleTime('10:00 AM');
      loadData();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to reschedule appointment');
    }
  };

  const handleAvatarClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result;
        setUploadedAvatar(base64String);
        localStorage.setItem(`profile_avatar_${user?._id || 'guest'}`, base64String);
        addToast('Profile picture updated successfully!', 'success');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    try {
      await patientService.updateProfile({
        age: Number(profileAge),
        gender: profileGender,
        phone: profilePhone,
        medicalHistory: profileMedicalHistory,
        city: profileCity,
      });
      addToast('Profile updated successfully!', 'success');
      loadData();
    } catch (err) {
      console.error(err);
      alert('Failed to update profile');
    }
  };

  // Filter strictly REAL user database reports
  const displayReports = React.useMemo(() => {
    return reports.filter(rep => {
      const qRep = reportSearch.toLowerCase().trim();
      return !qRep || 
        rep.patientName?.toLowerCase().includes(qRep) || 
        rep.doctorName?.toLowerCase().includes(qRep) ||
        rep.aiFindings?.conditions?.some(c => c.toLowerCase().includes(qRep));
    });
  }, [reports, reportSearch]);

  const filteredDiagnosticsSheets = React.useMemo(() => {
    return reports.filter(rep => {
      const q = reportSearch.toLowerCase().trim();
      const matchesSearch = !q || 
        rep.doctorName?.toLowerCase().includes(q) ||
        rep.aiFindings?.conditions?.some(c => c.toLowerCase().includes(q));

      if (!matchesSearch) return false;

      if (reportsFilter === 'reviewed') return rep.status === 'reviewed';
      if (reportsFilter === 'pending') return rep.status !== 'reviewed';
      return true;
    });
  }, [reports, reportSearch, reportsFilter]);

  const getDoctorSpecialty = React.useCallback((doctorName, doctorId) => {
    const doc = doctors.find(d => d._id === doctorId || d.name === doctorName);
    return doc?.specialization || doc?.doctorDetails?.specialization || 'General Dentist';
  }, [doctors]);

  const filteredBookedAppointments = React.useMemo(() => {
    return appointments.filter(appt => {
      const q = appointmentSearch.toLowerCase().trim();
      const specialty = getDoctorSpecialty(appt.doctorName, appt.doctorId);
      
      const matchesSearch = !q || 
        appt.doctorName?.toLowerCase().includes(q) ||
        specialty.toLowerCase().includes(q) ||
        appt.doctorClinicName?.toLowerCase().includes(q) ||
        appt.doctorClinicAddress?.toLowerCase().includes(q);

      if (!matchesSearch) return false;

      if (appointmentFilter === 'upcoming') return appt.status === 'confirmed' || appt.status === 'pending';
      if (appointmentFilter === 'completed') return appt.status === 'completed';
      return true;
    });
  }, [appointments, appointmentSearch, appointmentFilter, doctors, getDoctorSpecialty]);

  const filteredDoctors = React.useMemo(() => {
    return doctors.filter(doc => {
      const spec = doc.specialization || doc.doctorDetails?.specialization || 'General Dentistry';
      const matchesSpecialty = doctorSpecialtyFilter === 'All' || spec.toLowerCase() === doctorSpecialtyFilter.toLowerCase();
      
      const q = doctorSearch.toLowerCase().trim();
      const matchesSearch = !q || 
        doc.name?.toLowerCase().includes(q) ||
        (doc.clinicName || doc.doctorDetails?.clinicName || '').toLowerCase().includes(q) ||
        spec.toLowerCase().includes(q);

      return matchesSpecialty && matchesSearch;
    });
  }, [doctors, doctorSearch, doctorSpecialtyFilter]);

  const getSectionTitle = () => {
    switch (activeSection) {
      case 'overview': return 'Dashboard';
      case 'scan': return 'Upload Dental Scan';
      case 'reports': return 'My Diagnostics Sheets';
      case 'appointments': return 'My Appointments';
      case 'doctors': return 'Find Same-City Dentists';
      case 'profile': return 'My Profile';
      default: return 'Dashboard';
    }
  };

  return (
    <div className={`admin-dashboard-wrapper theme-teal ${sidebarOpen ? 'sidebar-open' : ''}`}>
      {/* Toast notifications */}
      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.type}`}>
            {t.message}
          </div>
        ))}
      </div>

      {/* Sidebar */}
      <aside className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div>
          <div className="admin-sidebar-logo">
            <div className="admin-logo-icon" style={{ background: '#ffffff', padding: '4px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '44px', height: '44px', flexShrink: 0 }}>
              <img src="/logo.png" alt="AI Dental Care Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            <div>
              <div className="admin-logo-text">AI Dental Care</div>
              <div className="admin-logo-sub">Patient Portal</div>
            </div>
          </div>

          <nav className="admin-sidebar-nav">
            <button 
              type="button" 
              className={`admin-nav-item ${activeSection === 'overview' ? 'active' : ''}`}
              onClick={() => { setActiveSection('overview'); setSidebarOpen(false); }}
            >
              <span>Dashboard</span>
            </button>

            <button 
              type="button" 
              className={`admin-nav-item ${activeSection === 'scan' ? 'active' : ''}`}
              onClick={() => { setActiveSection('scan'); setSidebarOpen(false); }}
            >
              <span>Upload Scan</span>
            </button>

            <button 
              type="button" 
              className={`admin-nav-item ${activeSection === 'reports' ? 'active' : ''}`}
              onClick={() => { setActiveSection('reports'); setSidebarOpen(false); }}
            >
              <span>My Reports</span>
            </button>

            <button 
              type="button" 
              className={`admin-nav-item ${activeSection === 'appointments' ? 'active' : ''}`}
              onClick={() => { setActiveSection('appointments'); setSidebarOpen(false); }}
            >
              <span>Appointments</span>
            </button>

            <button 
              type="button" 
              className={`admin-nav-item ${activeSection === 'doctors' ? 'active' : ''}`}
              onClick={() => { setActiveSection('doctors'); setSidebarOpen(false); }}
            >
              <span>Find Doctors</span>
            </button>

            <button 
              type="button" 
              className={`admin-nav-item ${activeSection === 'profile' ? 'active' : ''}`}
              onClick={() => { setActiveSection('profile'); setSidebarOpen(false); }}
            >
              <span>My Profile</span>
            </button>
          </nav>
        </div>

        <div className="admin-sidebar-footer">
          <button type="button" className="admin-signout-btn" onClick={logout}>
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Sidebar Overlay */}
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)}></div>}

      {/* Main Container */}
      <main className="admin-main">
        {/* Header Topbar */}
        <header className="admin-topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button type="button" className="hamburger" onClick={() => setSidebarOpen(true)} aria-label="Toggle Menu">
              <Menu size={20} />
            </button>
            <h1 className="admin-topbar-title">{getSectionTitle()}</h1>
          </div>
          <div className="admin-header-profile" onClick={() => setActiveSection('profile')} title="View profile settings">
            <div className="admin-user-avatar">
              {uploadedAvatar ? (
                <img src={uploadedAvatar} alt={user?.name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
              ) : (
                (user?.name ? user.name.slice(0, 2).toUpperCase() : 'PA')
              )}
            </div>
            <div className="admin-user-info">
              <span className="admin-user-name" style={{ textTransform: 'capitalize' }}>{user?.name || 'Alex'}</span>
              <span className="admin-user-city" style={{ textTransform: 'capitalize' }}>{user?.city || 'Mumbai'}</span>
            </div>
          </div>
        </header>

        {/* Content Body */}
        <div className="admin-content">
          {/* SECTION: Overview */}
          {activeSection === 'overview' && (
            <>
              <div style={{ marginBottom: '4px' }}>
                <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#0f172a' }}>
                  Welcome back, {user?.name || 'Alex'}!
                </h2>
              </div>

              {/* Top 3 Stat Cards */}
              <div className="admin-stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                {/* Total Scans Card */}
                <div className="admin-stat-card">
                  <div className="admin-stat-left">
                    <div className="admin-stat-icon-box blue">
                      <Camera size={20} />
                    </div>
                    <div>
                      <div className="admin-stat-number">{stats.scans}</div>
                      <div className="admin-stat-label">Total Scans</div>
                    </div>
                  </div>
                  <svg className="admin-sparkline" viewBox="0 0 70 28" fill="none">
                    <path d="M2 20 Q 20 15, 35 24 T 68 8" stroke="#3b82f6" strokeWidth="2" fill="none" strokeLinecap="round" />
                  </svg>
                </div>

                {/* Issues Detected Card */}
                <div className="admin-stat-card">
                  <div className="admin-stat-left">
                    <div className="admin-stat-icon-box gold">
                      <AlertTriangle size={20} />
                    </div>
                    <div>
                      <div className="admin-stat-number">{stats.issues}</div>
                      <div className="admin-stat-label">Issues Detected</div>
                    </div>
                  </div>
                  <svg className="admin-sparkline" viewBox="0 0 70 28" fill="none">
                    <path d="M2 22 Q 25 18, 45 25 T 68 12" stroke="#d97706" strokeWidth="2" fill="none" strokeLinecap="round" />
                  </svg>
                </div>

                {/* Doctor Reviews Card */}
                <div className="admin-stat-card">
                  <div className="admin-stat-left">
                    <div className="admin-stat-icon-box green">
                      <Stethoscope size={20} />
                    </div>
                    <div>
                      <div className="admin-stat-number">{stats.reviews}</div>
                      <div className="admin-stat-label">Doctor Reviews</div>
                    </div>
                  </div>
                  <svg className="admin-sparkline" viewBox="0 0 70 28" fill="none">
                    <path d="M2 24 Q 30 24, 48 20 T 68 6" stroke="#16a34a" strokeWidth="2" fill="none" strokeLinecap="round" />
                  </svg>
                </div>
              </div>

              {/* Search Input Row */}
              <div className="admin-search-row" style={{ gridTemplateColumns: '1fr' }}>
                <div className="admin-search-box" style={{ maxWidth: '480px' }}>
                  <Search className="admin-search-icon" size={18} />
                  <input 
                    type="text" 
                    className="admin-search-input" 
                    placeholder="Search My Reports or Scans" 
                    value={reportSearch}
                    onChange={(e) => setReportSearch(e.target.value)}
                  />
                </div>
              </div>

              {/* Table: Recent Dental Scans & Reports */}
              <div className="admin-table-card">
                <h2 className="admin-table-title">Recent Dental Scans &amp; Reports</h2>
                <div className="admin-table-wrapper">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Scan Date</th>
                        <th>Findings</th>
                        <th>Reviewing Doctor</th>
                        <th>City</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayReports.length === 0 ? (
                        <tr>
                          <td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                            No dental scans uploaded yet.
                          </td>
                        </tr>
                      ) : (
                        displayReports.map((rep) => (
                          <tr key={rep._id} style={{ cursor: 'pointer' }} onClick={() => setSelectedReport(rep)}>
                            <td>{new Date(rep.createdAt).toLocaleDateString()}</td>
                            <td style={{ fontWeight: '500', color: '#0f172a' }}>
                              {rep.aiFindings?.conditions?.join(', ') || (rep.aiFindings?.issueDetected ? 'Issue Detected' : 'No issue found')}
                            </td>
                            <td>{rep.doctorName ? `Dr. ${rep.doctorName}` : '—'}</td>
                            <td style={{ textTransform: 'capitalize' }}>{rep.patientCity || user?.city || '—'}</td>
                            <td>
                              <span className={`admin-badge-status ${rep.status === 'reviewed' ? 'active' : 'inactive'}`}>
                                {rep.status === 'reviewed' ? 'Completed' : 'Unreviewed'}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* SECTION: Upload Scan */}
          {activeSection === 'scan' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', alignItems: 'stretch', minHeight: 'calc(100vh - 160px)' }}>
              {/* Left Card: Upload Zone */}
              <div className="admin-table-card" style={{ padding: '32px 28px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a', marginBottom: '2px' }}>Upload Zone</h2>
                  <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '24px' }}>Upload Your Scan</p>

                  <div 
                    className="upload-zone" 
                    onClick={() => document.getElementById('scanFileInput').click()} 
                    style={{ 
                      margin: '0 0 24px 0', 
                      background: '#eff6ff', 
                      border: '2px dashed #93c5fd', 
                      borderRadius: '20px', 
                      padding: '40px 24px',
                      minHeight: '320px',
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      alignItems: 'center',
                      textAlign: 'center',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '18px' }}>
                      <UploadCloud size={64} style={{ color: '#3b82f6' }} />
                    </div>
                    {uploadFile ? (
                      <div>
                        <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', marginBottom: '6px' }}>{uploadFile.name}</h3>
                        <p style={{ fontSize: '14px', color: '#64748b' }}>File selected &mdash; ready for AI analysis</p>
                      </div>
                    ) : (
                      <div>
                        <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', marginBottom: '8px' }}>
                          Drag &amp; Drop teeth photo<br />or scan here
                        </h3>
                        <p style={{ fontSize: '14px', color: '#64748b' }}>or browse files</p>
                      </div>
                    )}
                  </div>

                  <input type="file" id="scanFileInput" accept=".jpg,.jpeg,.png" style={{ display: 'none' }} onChange={handleFileChange} />
                </div>

                <div>
                  <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                    <span style={{ 
                      background: '#f1f5f9', 
                      color: '#475569', 
                      fontSize: '12px', 
                      fontWeight: '500', 
                      padding: '8px 18px', 
                      borderRadius: '20px',
                      border: '1px solid #e2e8f0'
                    }}>
                      Supported formats: JPG, PNG | Up to 5MB
                    </span>
                  </div>

                  {uploadFile ? (
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button type="button" className="btn btn-ghost btn-full" onClick={resetScan}>Change Image</button>
                      <button type="button" className="btn btn-primary btn-full" onClick={handleAnalyze} style={{ padding: '14px', fontSize: '15px' }}>
                        {uploadPhase === 'loading' ? 'Analyzing...' : 'Analyze with AI'}
                      </button>
                    </div>
                  ) : (
                    <button 
                      type="button" 
                      className="btn btn-primary btn-full" 
                      onClick={() => document.getElementById('scanFileInput').click()}
                      style={{ padding: '14px', fontSize: '15px', borderRadius: '12px' }}
                    >
                      Analyze with AI
                    </button>
                  )}
                </div>
              </div>

              {/* Right Card: AI Scan Guidelines & Real-Time Processing */}
              <div className="admin-table-card" style={{ padding: '32px 28px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
                <div>
                  <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a', marginBottom: '24px' }}>
                    AI Scan Guidelines &amp; Real-Time Processing
                  </h2>

                  {/* Visual Tips */}
                  <div style={{ marginBottom: '28px' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', marginBottom: '14px' }}>Visual Tips</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a', marginBottom: '8px' }}>1. Good Lighting</div>
                        <img src="/tip-lighting.png" alt="Good Lighting" style={{ width: '100%', height: '110px', objectFit: 'cover', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'block' }} />
                      </div>

                      <div>
                        <div style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a', marginBottom: '8px' }}>2. Close-up Focus</div>
                        <img src="/tip-focus.png" alt="Close-up Focus" style={{ width: '100%', height: '110px', objectFit: 'cover', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'block' }} />
                      </div>

                      <div>
                        <div style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a', marginBottom: '8px' }}>3. Dry Teeth</div>
                        <img src="/tip-dry.png" alt="Dry Teeth" style={{ width: '100%', height: '110px', objectFit: 'cover', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'block' }} />
                      </div>

                      <div>
                        <div style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a', marginBottom: '8px' }}>4. Angle</div>
                        <img src="/tip-angle.png" alt="Angle" style={{ width: '100%', height: '110px', objectFit: 'cover', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'block' }} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* AI Analysis Progress */}
                <div>
                  <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', marginBottom: '2px' }}>AI Analysis Progress</h3>
                  <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '14px' }}>Real-Time processing indicator</p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {/* Step 1: Uploading file */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px' }}>
                      <span style={{ color: '#334155', fontWeight: '500' }}>1. Uploading file</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: (uploadPhase === 'loading' || uploadPhase === 'complete') ? '#16a34a' : '#64748b', fontWeight: '600', fontSize: '12px' }}>
                        <span>{(uploadPhase === 'loading' || uploadPhase === 'complete') ? 'Completed' : 'Pending'}</span>
                        {(uploadPhase === 'loading' || uploadPhase === 'complete') ? (
                          <Check size={16} strokeWidth={2.5} style={{ background: '#dcfce7', color: '#16a34a', borderRadius: '50%', padding: '2px' }} />
                        ) : (
                          <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#cbd5e1' }}></div>
                        )}
                      </div>
                    </div>

                    {/* Step 2: Verifying image quality */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px' }}>
                      <span style={{ color: '#334155', fontWeight: '500' }}>2. Verifying image quality</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: (analysisStep > 1 || uploadPhase === 'complete') ? '#16a34a' : (uploadPhase === 'loading' && analysisStep === 1) ? '#2563eb' : '#64748b', fontWeight: '600', fontSize: '12px' }}>
                        <span>
                          {(analysisStep > 1 || uploadPhase === 'complete') ? 'Completed' : (uploadPhase === 'loading' && analysisStep === 1) ? 'Active processing...' : 'Pending'}
                        </span>
                        {(analysisStep > 1 || uploadPhase === 'complete') ? (
                          <Check size={16} strokeWidth={2.5} style={{ background: '#dcfce7', color: '#16a34a', borderRadius: '50%', padding: '2px' }} />
                        ) : (uploadPhase === 'loading' && analysisStep === 1) ? (
                          <div className="spinner-sm" style={{ color: '#2563eb' }}></div>
                        ) : (
                          <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#cbd5e1' }}></div>
                        )}
                      </div>
                    </div>

                    {/* Step 3: AI analyzing scan */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px' }}>
                      <span style={{ color: '#334155', fontWeight: '500' }}>3. AI analyzing scan</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: (analysisStep > 2 || uploadPhase === 'complete') ? '#16a34a' : (uploadPhase === 'loading' && analysisStep === 2) ? '#2563eb' : '#64748b', fontWeight: '600', fontSize: '12px' }}>
                        <span>
                          {(analysisStep > 2 || uploadPhase === 'complete') ? 'Completed' : (uploadPhase === 'loading' && analysisStep === 2) ? 'Active processing...' : 'Pending'}
                        </span>
                        {(analysisStep > 2 || uploadPhase === 'complete') ? (
                          <Check size={16} strokeWidth={2.5} style={{ background: '#dcfce7', color: '#16a34a', borderRadius: '50%', padding: '2px' }} />
                        ) : (uploadPhase === 'loading' && analysisStep === 2) ? (
                          <div className="spinner-sm" style={{ color: '#2563eb' }}></div>
                        ) : (
                          <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#cbd5e1' }}></div>
                        )}
                      </div>
                    </div>

                    {/* Step 4: Generating results */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px' }}>
                      <span style={{ color: '#334155', fontWeight: '500' }}>4. Generating results</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: (uploadPhase === 'complete' || analysisStep >= 4) ? '#16a34a' : (uploadPhase === 'loading' && analysisStep === 3) ? '#2563eb' : '#64748b', fontWeight: '600', fontSize: '12px' }}>
                        <span>
                          {(uploadPhase === 'complete' || analysisStep >= 4) ? 'Completed' : (uploadPhase === 'loading' && analysisStep === 3) ? 'Active processing...' : 'Pending'}
                        </span>
                        {(uploadPhase === 'complete' || analysisStep >= 4) ? (
                          <Check size={16} strokeWidth={2.5} style={{ background: '#dcfce7', color: '#16a34a', borderRadius: '50%', padding: '2px' }} />
                        ) : (uploadPhase === 'loading' && analysisStep === 3) ? (
                          <div className="spinner-sm" style={{ color: '#2563eb' }}></div>
                        ) : (
                          <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#cbd5e1' }}></div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION: My Reports */}
          {activeSection === 'reports' && (
            <>
              {/* Top Control Bar: Search & Filter Pills */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
                <div className="admin-search-box" style={{ maxWidth: '360px', width: '100%' }}>
                  <Search className="admin-search-icon" size={18} />
                  <input 
                    type="text" 
                    className="admin-search-input" 
                    placeholder="Search My Diagnostic Sheets" 
                    value={reportSearch}
                    onChange={(e) => setReportSearch(e.target.value)}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <button 
                    type="button" 
                    onClick={() => setReportsFilter('all')}
                    style={{ 
                      padding: '8px 22px', 
                      borderRadius: '20px', 
                      fontSize: '13px', 
                      fontWeight: '600', 
                      cursor: 'pointer',
                      border: reportsFilter === 'all' ? '2px solid #2563eb' : '1px solid #e2e8f0',
                      background: reportsFilter === 'all' ? '#eff6ff' : '#e2e8f0',
                      color: reportsFilter === 'all' ? '#2563eb' : '#475569'
                    }}
                  >
                    All
                  </button>

                  <button 
                    type="button" 
                    onClick={() => setReportsFilter('reviewed')}
                    style={{ 
                      padding: '8px 22px', 
                      borderRadius: '20px', 
                      fontSize: '13px', 
                      fontWeight: '600', 
                      cursor: 'pointer',
                      border: reportsFilter === 'reviewed' ? '2px solid #2563eb' : '1px solid #e2e8f0',
                      background: reportsFilter === 'reviewed' ? '#eff6ff' : '#e2e8f0',
                      color: reportsFilter === 'reviewed' ? '#2563eb' : '#475569'
                    }}
                  >
                    Reviewed
                  </button>

                  <button 
                    type="button" 
                    onClick={() => setReportsFilter('pending')}
                    style={{ 
                      padding: '8px 22px', 
                      borderRadius: '20px', 
                      fontSize: '13px', 
                      fontWeight: '600', 
                      cursor: 'pointer',
                      border: reportsFilter === 'pending' ? '2px solid #2563eb' : '1px solid #e2e8f0',
                      background: reportsFilter === 'pending' ? '#eff6ff' : '#e2e8f0',
                      color: reportsFilter === 'pending' ? '#2563eb' : '#475569'
                    }}
                  >
                    Pending
                  </button>
                </div>
              </div>

              {/* Main Table Card */}
              <div className="admin-table-card">
                <div style={{ marginBottom: '18px' }}>
                  <h2 className="admin-table-title" style={{ marginBottom: '4px' }}>My Diagnostics Sheets</h2>
                  <div style={{ fontSize: '13px', color: '#64748b', fontWeight: '500' }}>
                    {filteredDiagnosticsSheets.length} {filteredDiagnosticsSheets.length === 1 ? 'report total' : 'reports total'}
                  </div>
                </div>

                <div className="admin-table-wrapper">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Scan Date</th>
                        <th>AI Findings</th>
                        <th>Reviewing Doctor</th>
                        <th>City</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredDiagnosticsSheets.length === 0 ? (
                        <tr>
                          <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                            No diagnostics reports available.
                          </td>
                        </tr>
                      ) : (
                        filteredDiagnosticsSheets.map((rep) => (
                          <tr key={rep._id}>
                            <td style={{ whiteSpace: 'nowrap' }}>
                              {new Date(rep.createdAt).toLocaleDateString(undefined, { month: 'short', day: '2-digit', year: 'numeric' })}
                            </td>
                            <td style={{ fontWeight: '600', color: '#0f172a' }}>
                              {rep.aiFindings?.conditions?.join(', ') || (rep.aiFindings?.issueDetected ? 'Issue Detected' : 'Normal Checkup')}
                            </td>
                            <td>{rep.doctorName ? `Dr. ${rep.doctorName}` : '—'}</td>
                            <td style={{ textTransform: 'capitalize' }}>{rep.patientCity || user?.city || '—'}</td>
                            <td>
                              <span className={`admin-badge-status ${rep.status === 'reviewed' ? 'active' : 'inactive'}`}>
                                {rep.status === 'reviewed' ? 'Completed' : 'Pending Review'}
                              </span>
                            </td>
                            <td>
                              <button 
                                type="button" 
                                className="btn btn-primary btn-sm" 
                                onClick={() => setSelectedReport(rep)}
                                style={{ padding: '6px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '600' }}
                              >
                                [View Report]
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* SECTION: Appointments */}
          {activeSection === 'appointments' && (
            <>
              {/* Search and Filters Controls */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
                <div className="admin-search-box" style={{ maxWidth: '380px', width: '100%', position: 'relative' }}>
                  <Search className="admin-search-icon" size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                  <input 
                    type="text" 
                    className="admin-search-input" 
                    placeholder="Search Booked Appointments" 
                    value={appointmentSearch}
                    onChange={(e) => setAppointmentSearch(e.target.value)}
                    style={{ paddingLeft: '44px', width: '100%', height: '46px', borderRadius: '12px', border: '1.5px solid #e2e8f0' }}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div className="filter-chips-container" style={{ display: 'flex', background: '#f8fafc', padding: '4px', borderRadius: '25px', border: '1px solid #e2e8f0' }}>
                    {['all', 'upcoming', 'completed'].map((filterVal) => (
                      <button
                        key={filterVal}
                        type="button"
                        onClick={() => setAppointmentFilter(filterVal)}
                        className={`filter-chip ${appointmentFilter === filterVal ? 'active' : ''}`}
                        style={{
                          padding: '8px 20px',
                          borderRadius: '20px',
                          fontSize: '13px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          border: 'none',
                          background: appointmentFilter === filterVal ? '#0f172a' : 'transparent',
                          color: appointmentFilter === filterVal ? '#ffffff' : '#64748b',
                          transition: 'all 0.15s ease',
                          textTransform: 'capitalize'
                        }}
                      >
                        {filterVal}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowBookNewVisitModal(true)}
                    className="btn btn-primary"
                    style={{ padding: '12px 22px', borderRadius: '12px', display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '600' }}
                  >
                    <Plus size={16} />
                    Book New Visit
                  </button>
                </div>
              </div>

              {/* Main Booked Appointments Card */}
              <div className="admin-table-card" style={{ padding: '24px', background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                <h3 className="admin-table-title" style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', marginBottom: '20px' }}>
                  My Booked Appointments
                </h3>

                <div className="admin-table-wrapper">
                  <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        <th style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Doctor Name & Specialty</th>
                        <th style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Appointment Date & Time</th>
                        <th style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Clinic Location</th>
                        <th style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Visit Type</th>
                        <th style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
                        <th style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', padding: '14px 16px', textAlign: 'center', fontSize: '12px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBookedAppointments.length === 0 ? (
                        <tr>
                          <td colSpan="6" style={{ textAlign: 'center', padding: '48px', color: '#94a3b8', fontSize: '15px' }}>
                            No scheduled appointments found matching search criteria.
                          </td>
                        </tr>
                      ) : (
                        filteredBookedAppointments.map((appt) => {
                          const specialty = getDoctorSpecialty(appt.doctorName, appt.doctorId);
                          const visitType = getVisitType(specialty);
                          const avatar = getImageUrl(appt.doctorProfilePhoto) || getDoctorAvatar(appt.doctorName, appt.doctorId);
                          const formattedDate = new Date(appt.date || appt.appointmentDate).toLocaleDateString('en-US', {
                            month: 'short',
                            day: '2-digit',
                            year: 'numeric'
                          });

                          return (
                            <tr key={appt._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                              <td style={{ padding: '16px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                  <img 
                                    src={avatar} 
                                    alt={`Dr. ${appt.doctorName}`} 
                                    style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover', border: '1px solid #e2e8f0' }}
                                  />
                                  <div>
                                    <div style={{ fontWeight: '700', color: '#0f172a', fontSize: '15px' }}>Dr. {appt.doctorName}</div>
                                    <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '500' }}>{specialty}</div>
                                  </div>
                                </div>
                              </td>

                              <td style={{ padding: '16px', fontSize: '14px', color: '#334155', fontWeight: '500' }}>
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                  {formattedDate} <span style={{ color: '#94a3b8', margin: '0 4px' }}>|</span> {appt.time}
                                </span>
                              </td>

                              <td style={{ padding: '16px', fontSize: '13px', color: '#64748b', lineHeight: '1.4' }}>
                                <div style={{ fontWeight: '600', color: '#334155' }}>{appt.doctorClinicName || 'AI Dental Clinic'}</div>
                                <div style={{ fontSize: '12px' }}>{appt.doctorClinicAddress || '123 Care St, City'}</div>
                              </td>

                              <td style={{ padding: '16px', fontSize: '14px', color: '#334155', fontWeight: '500' }}>
                                {visitType}
                              </td>

                              <td style={{ padding: '16px' }}>
                                <span 
                                  className={`status-badge status-${appt.status}`}
                                  style={{
                                    display: 'inline-block',
                                    padding: '4px 12px',
                                    borderRadius: '99px',
                                    fontSize: '12px',
                                    fontWeight: '700',
                                    textTransform: 'capitalize',
                                    background: appt.status === 'confirmed' ? '#dcfce7' : 
                                                appt.status === 'pending' ? '#fef3c7' : 
                                                appt.status === 'completed' ? '#dbeafe' : '#fee2e2',
                                    color: appt.status === 'confirmed' ? '#15803d' : 
                                           appt.status === 'pending' ? '#b45309' : 
                                           appt.status === 'completed' ? '#1d4ed8' : '#b91c1c',
                                  }}
                                >
                                  {appt.status}
                                </span>
                              </td>

                              <td style={{ padding: '16px', textAlign: 'center' }}>
                                <div style={{ display: 'inline-flex', gap: '8px' }}>
                                  <button
                                    type="button"
                                    onClick={() => setViewingAppointment(appt)}
                                    className="btn btn-ghost"
                                    style={{ padding: '6px 14px', borderRadius: '8px', fontSize: '13px', border: '1.5px solid #e2e8f0', color: '#475569', background: '#ffffff' }}
                                  >
                                    View Details
                                  </button>

                                  {(appt.status === 'pending' || appt.status === 'confirmed') && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setReschedulingAppointment(appt);
                                        setRescheduleDate(new Date(appt.date || appt.appointmentDate).toISOString().split('T')[0]);
                                        setRescheduleTime(appt.time);
                                      }}
                                      className="btn btn-primary"
                                      style={{ padding: '6px 14px', borderRadius: '8px', fontSize: '13px', background: '#2563eb', color: '#ffffff' }}
                                    >
                                      Reschedule
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* SECTION: Find Doctors */}
          {activeSection === 'doctors' && (
            <>
              {/* Search Bar Row */}
              <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', alignItems: 'stretch' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input
                    type="text"
                    placeholder="Search by dentist name or clinic..."
                    value={doctorSearch}
                    onChange={(e) => setDoctorSearch(e.target.value)}
                    style={{
                      width: '100%',
                      height: '48px',
                      paddingLeft: '48px',
                      paddingRight: '16px',
                      border: '1.5px solid #cbd5e1',
                      borderRadius: '12px',
                      fontSize: '14px',
                      outline: 'none',
                      background: '#ffffff',
                      boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)'
                    }}
                  />
                </div>
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ padding: '0 28px', borderRadius: '12px', fontSize: '15px', fontWeight: '700', height: '48px', background: '#2563eb' }}
                >
                  Search
                </button>
              </div>

              {/* Filter Chips */}
              <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '8px', marginBottom: '24px', scrollbarWidth: 'none' }}>
                {['All', 'General Dentistry', 'Orthodontics', 'Periodontics', 'Endodontics', 'Pediatric Dentistry'].map((spec) => (
                  <button
                    key={spec}
                    type="button"
                    onClick={() => setDoctorSpecialtyFilter(spec)}
                    style={{
                      padding: '8px 20px',
                      borderRadius: '20px',
                      fontSize: '13px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      border: 'none',
                      whiteSpace: 'nowrap',
                      background: doctorSpecialtyFilter === spec ? '#2563eb' : '#e2e8f0',
                      color: doctorSpecialtyFilter === spec ? '#ffffff' : '#475569',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {spec}
                  </button>
                ))}
              </div>

              {/* Results Heading */}
              <div style={{ marginBottom: '20px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>
                  Dentists in {user?.city ? user.city.charAt(0).toUpperCase() + user.city.slice(1) : 'Seattle'} ({filteredDoctors.length} {filteredDoctors.length === 1 ? 'Result' : 'Results'})
                </h2>
              </div>

              {/* Grid Layout of Dentist Cards */}
              {filteredDoctors.length === 0 ? (
                <div className="admin-table-card" style={{ textAlign: 'center', padding: '48px', color: '#94a3b8', fontSize: '15px' }}>
                  No verified dentists found matching your search. Try changing the filter or search text.
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '20px', marginBottom: '40px' }}>
                  {filteredDoctors.map((doc) => {
                    const ratingData = getDoctorRating(doc.name, doc._id);
                    const specialty = doc.specialization || doc.doctorDetails?.specialization || 'General Dentistry';
                    const avatar = getImageUrl(doc.profilePhoto) || getDoctorAvatar(doc.name, doc._id);
                    const exp = doc.experience || 5;

                    return (
                      <div key={doc._id} className="dentist-card-grid-item" style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '18px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', gap: '12px', aspectRatio: '1 / 1', transition: 'transform 0.2s, box-shadow 0.2s' }}>

                        {/* Avatar + Name/Specialty header */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <img
                            src={avatar}
                            alt={`Dr. ${doc.name}`}
                            style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '2px solid #e2e8f0' }}
                          />
                          <div style={{ minWidth: 0 }}>
                            <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', margin: '0 0 2px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Dr. {doc.name}</h3>
                            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>{specialty}</span>
                          </div>
                        </div>

                        {/* Info Row 1: Rating & Experience */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#334155', fontWeight: '600', alignItems: 'center' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                            <span style={{ color: '#f59e0b', fontSize: '13px' }}>★</span>
                            <span>{ratingData.rating} ({ratingData.reviewsCount})</span>
                          </span>
                          <span style={{ color: '#64748b', fontWeight: '500' }}>{exp}+ Yrs</span>
                        </div>

                        {/* Info Row 2: Clinic Group */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#475569', fontWeight: '500' }}>
                          <Building2 size={13} style={{ color: '#94a3b8', flexShrink: 0 }} />
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {doc.clinicName || doc.doctorDetails?.clinicName || 'Urban Dental Group'}
                          </span>
                        </div>

                        {/* Info Row 3: Clinic Location Address */}
                        <div style={{ display: 'flex', alignItems: 'start', gap: '6px', fontSize: '12px', color: '#64748b', lineHeight: '1.4' }}>
                          <MapPin size={13} style={{ color: '#94a3b8', flexShrink: 0, marginTop: '2px' }} />
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {doc.clinicAddress || doc.doctorDetails?.clinicAddress || '411 University St, Seattle, WA'}
                          </span>
                        </div>

                        {/* Action: Book Visit Button */}
                        <button
                          type="button"
                          onClick={() => setBookingDoctor(doc)}
                          className="btn btn-primary"
                          style={{
                            width: '100%',
                            height: '38px',
                            justifyContent: 'center',
                            borderRadius: '10px',
                            background: '#2563eb',
                            color: '#ffffff',
                            fontWeight: '700',
                            fontSize: '13px',
                            border: 'none',
                            marginTop: 'auto'
                          }}
                        >
                          Book Visit
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* SECTION: Profile */}
          {activeSection === 'profile' && (
            <>
              {/* Page heading */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#0f172a', margin: '0 0 4px 0' }}>
                    My Profile Settings
                  </h1>
                  <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>
                    View and manage your personal details.
                  </p>
                </div>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#64748b', paddingTop: '6px' }}>
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
              </div>

              {/* Hidden file input */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleAvatarChange}
                accept="image/*"
                style={{ display: 'none' }}
              />

              {/* Unified profile card */}
              <form onSubmit={handleProfileSave}>
                <div className="profile-unified-card">

                  {/* ── Header row ── */}
                  <div className="profile-unified-header">
                    {/* Circular avatar (still clickable) */}
                    <div
                      className="profile-avatar-wrapper clickable"
                      onClick={handleAvatarClick}
                      title="Click to upload profile photo"
                    >
                      {uploadedAvatar ? (
                        <img src={uploadedAvatar} alt={user?.name} className="profile-avatar-img" />
                      ) : (
                        <div className="profile-avatar-blank">
                          <User size={24} style={{ color: '#94a3b8' }} />
                        </div>
                      )}
                      <div className="profile-avatar-overlay">
                        <Camera size={14} style={{ color: '#ffffff' }} />
                      </div>
                      <span className="profile-status-dot-active"></span>
                    </div>

                    {/* Name + subtitle */}
                    <div className="profile-unified-identity">
                      <h2>{user?.name || 'Your Name'}</h2>
                      <p>{user?.email || ''}{profileCity ? ` · ${profileCity}` : ''}</p>
                    </div>

                    {/* Visible change-photo button */}
                    <button
                      type="button"
                      className="profile-unified-change-photo-btn"
                      onClick={handleAvatarClick}
                    >
                      <Camera size={14} />
                      Change photo
                    </button>
                  </div>

                  {/* ── 2-column form grid ── */}
                  <div className="profile-unified-form">
                    <div className="profile-unified-field">
                      <label className="profile-unified-label">Age</label>
                      <input
                        type="number"
                        required
                        value={profileAge}
                        onChange={(e) => setProfileAge(e.target.value)}
                        className="profile-input-field"
                        placeholder="e.g. 29"
                      />
                    </div>

                    <div className="profile-unified-field">
                      <label className="profile-unified-label">Gender</label>
                      <select
                        required
                        value={profileGender}
                        onChange={(e) => setProfileGender(e.target.value)}
                        className="profile-input-field"
                      >
                        <option value="">Select Gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div className="profile-unified-field">
                      <label className="profile-unified-label">Phone Number</label>
                      <input
                        type="text"
                        required
                        value={profilePhone}
                        onChange={(e) => setProfilePhone(e.target.value)}
                        className="profile-input-field"
                        placeholder="(555) 123-4567"
                      />
                    </div>

                    <div className="profile-unified-field">
                      <label className="profile-unified-label">City</label>
                      <input
                        type="text"
                        required
                        value={profileCity}
                        onChange={(e) => setProfileCity(e.target.value)}
                        className="profile-input-field"
                        placeholder="e.g. Seattle, WA"
                      />
                    </div>
                  </div>

                  {/* ── Footer row ── */}
                  <div className="profile-unified-footer">
                    <button type="submit" className="btn btn-primary profile-submit-button">
                      <Check size={16} />
                      <span>Save changes</span>
                    </button>
                  </div>

                </div>
              </form>
            </>
          )}
        </div>

        {/* ================= MODALS ================= */}

        {/* 1. Dental Diagnostic Report Details Modal */}
        {selectedReport && (
          <div className="modal-overlay open" onClick={() => setSelectedReport(null)}>
            <div className="modal" style={{ maxWidth: '640px' }} onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <span className="modal-title">Dental Diagnostic Report Details</span>
                <button className="modal-close" onClick={() => setSelectedReport(null)}>
                  <X size={16} />
                </button>
              </div>
              <div className="modal-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '20px', marginBottom: '20px' }}>
                  <div>
                    <img 
                      src={getImageUrl(selectedReport.imagePath)} 
                      alt="Dental Scan" 
                      style={{ width: '100%', borderRadius: '12px', border: '1px solid var(--border)', objectFit: 'cover', height: '160px' }} 
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px' }}>
                    <h4 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', marginBottom: '4px' }}>AI Findings</h4>
                    <p><strong>Scan Date:</strong> {new Date(selectedReport.createdAt).toLocaleDateString()}</p>
                    <p>
                      <strong>Conditions Detected:</strong>{' '}
                      <span style={{ fontWeight: '600', color: '#ef4444' }}>
                        {selectedReport.aiFindings?.conditions?.join(', ') || 'None'}
                      </span>
                    </p>
                    <p>
                      <strong>Severity:</strong>{' '}
                      <span className={`status-badge`} style={{
                        display: 'inline-block',
                        padding: '2px 10px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: '700',
                        textTransform: 'capitalize',
                        background: selectedReport.aiFindings?.severity === 'high' ? '#fee2e2' : '#fef3c7',
                        color: selectedReport.aiFindings?.severity === 'high' ? '#ef4444' : '#b45309',
                      }}>
                        {selectedReport.aiFindings?.severity || 'Low'}
                      </span>
                    </p>
                    <p><strong>Model Confidence:</strong> {selectedReport.aiFindings?.confidence || '0'}%</p>
                  </div>
                </div>

                {selectedReport.status === 'reviewed' ? (
                  <div style={{ padding: '20px', backgroundColor: '#f0fdf4', borderRadius: '12px', border: '1px solid #bbf7d0', marginTop: '16px' }}>
                    <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#166534', marginBottom: '10px' }}>Doctor's Feedback</h4>
                    <p style={{ fontSize: '14px', marginBottom: '10px' }}>
                      <strong>Reviewing Doctor:</strong> Dr. {selectedReport.doctorName}
                    </p>
                    <p style={{ fontSize: '14px', marginBottom: '10px' }}>
                      <strong>Recommendation:</strong> {selectedReport.doctorFeedback?.recommendation || 'None'}
                    </p>
                    <p style={{ fontSize: '13px', fontWeight: '600', color: '#166534', marginBottom: '6px' }}>Observation Notes:</p>
                    <p style={{ whiteSpace: 'pre-wrap', padding: '12px', backgroundColor: 'white', borderRadius: '8px', border: '1px solid #dcfce7', fontSize: '13px', color: '#1e293b' }}>
                      {selectedReport.doctorFeedback?.notes || '—'}
                    </p>
                  </div>
                ) : (
                  <div style={{ padding: '16px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', marginTop: '16px', color: '#64748b', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Clock size={16} />
                    <span>This report is currently pending review by an assigned doctor in your city.</span>
                  </div>
                )}
              </div>
              <div className="modal-footer" style={{ padding: '16px 20px', borderTop: '1px solid var(--border)', textAlign: 'right' }}>
                <button className="btn btn-ghost" onClick={() => setSelectedReport(null)}>Close</button>
              </div>
            </div>
          </div>
        )}

        {/* 2. Viewing Appointment Modal */}
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', paddingBottom: '16px', borderBottom: '1px solid #f1f5f9' }}>
                  <img 
                    src={getImageUrl(viewingAppointment.doctorProfilePhoto) || getDoctorAvatar(viewingAppointment.doctorName, viewingAppointment.doctorId)} 
                    alt={`Dr. ${viewingAppointment.doctorName}`} 
                    style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover' }}
                  />
                  <div>
                    <h4 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>Dr. {viewingAppointment.doctorName}</h4>
                    <p style={{ fontSize: '13px', color: '#64748b', fontWeight: '500' }}>
                      {getDoctorSpecialty(viewingAppointment.doctorName, viewingAppointment.doctorId)}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <div style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.05em' }}>Date</div>
                    <div style={{ fontSize: '15px', fontWeight: '600', color: '#334155', marginTop: '4px' }}>
                      {new Date(viewingAppointment.date || viewingAppointment.appointmentDate).toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.05em' }}>Time</div>
                    <div style={{ fontSize: '15px', fontWeight: '600', color: '#334155', marginTop: '4px' }}>
                      {viewingAppointment.time}
                    </div>
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.05em' }}>Clinic Location</div>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#334155', marginTop: '4px' }}>{viewingAppointment.doctorClinicName || 'AI Dental Clinic'}</div>
                  <div style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>{viewingAppointment.doctorClinicAddress || '123 Care Ave, City'}</div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <div style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.05em' }}>Visit Type</div>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#334155', marginTop: '4px' }}>
                      {getVisitType(getDoctorSpecialty(viewingAppointment.doctorName, viewingAppointment.doctorId))}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.05em' }}>Status</div>
                    <div style={{ marginTop: '4px' }}>
                      <span 
                        style={{
                          display: 'inline-block',
                          padding: '4px 12px',
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
                </div>
              </div>
              <div className="modal-footer" style={{ padding: '16px 20px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                {(viewingAppointment.status === 'pending' || viewingAppointment.status === 'confirmed') && (
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={async () => {
                      if (window.confirm('Are you sure you want to cancel this appointment?')) {
                        try {
                          await appointmentService.cancelAppointment(viewingAppointment._id);
                          addToast('Appointment cancelled successfully', 'info');
                          setViewingAppointment(null);
                          loadData();
                        } catch (err) {
                          alert('Failed to cancel appointment');
                        }
                      }
                    }}
                    style={{ borderRadius: '8px' }}
                  >
                    Cancel Appointment
                  </button>
                )}
                <button className="btn btn-ghost btn-sm" onClick={() => setViewingAppointment(null)} style={{ borderRadius: '8px' }}>Close</button>
              </div>
            </div>
          </div>
        )}

        {/* 3. Reschedule Appointment Modal */}
        {reschedulingAppointment && (
          <div className="modal-overlay open" onClick={() => setReschedulingAppointment(null)}>
            <div className="modal" style={{ maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <span className="modal-title">Reschedule Appointment</span>
                <button className="modal-close" onClick={() => setReschedulingAppointment(null)}>
                  <X size={16} />
                </button>
              </div>
              <form onSubmit={handleRescheduleAppointment}>
                <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <p style={{ fontSize: '14px', color: '#64748b' }}>
                    Select a new date and time for your appointment with <strong>Dr. {reschedulingAppointment.doctorName}</strong>.
                  </p>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontWeight: '600' }}>Choose New Date</label>
                    <input
                      type="date"
                      required
                      min={new Date().toISOString().split('T')[0]}
                      value={rescheduleDate}
                      onChange={(e) => setRescheduleDate(e.target.value)}
                      className="admin-search-input"
                      style={{ paddingLeft: '16px', border: '1.5px solid #e2e8f0', borderRadius: '8px', height: '42px', width: '100%' }}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontWeight: '600' }}>Choose New Time Slot</label>
                    <select
                      value={rescheduleTime}
                      onChange={(e) => setRescheduleTime(e.target.value)}
                      className="admin-search-input"
                      style={{ paddingLeft: '16px', border: '1.5px solid #e2e8f0', borderRadius: '8px', height: '42px', width: '100%' }}
                    >
                      <option value="09:00 AM">09:00 AM</option>
                      <option value="09:30 AM">09:30 AM</option>
                      <option value="10:00 AM">10:00 AM</option>
                      <option value="10:30 AM">10:30 AM</option>
                      <option value="11:00 AM">11:00 AM</option>
                      <option value="11:30 AM">11:30 AM</option>
                      <option value="12:00 PM">12:00 PM</option>
                      <option value="01:30 PM">01:30 PM</option>
                      <option value="02:00 PM">02:00 PM</option>
                      <option value="02:30 PM">02:30 PM</option>
                      <option value="03:00 PM">03:00 PM</option>
                      <option value="03:30 PM">03:30 PM</option>
                      <option value="04:00 PM">04:00 PM</option>
                    </select>
                  </div>
                </div>
                <div className="modal-footer" style={{ padding: '16px 20px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button type="button" className="btn btn-ghost" onClick={() => setReschedulingAppointment(null)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" style={{ background: '#2563eb' }}>Confirm Reschedule</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 4. Book New Visit Modal */}
        {(bookingDoctor || showBookNewVisitModal) && (
          <div className="modal-overlay open" onClick={() => { setBookingDoctor(null); setShowBookNewVisitModal(false); }}>
            <div className="modal" style={{ maxWidth: '520px' }} onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <span className="modal-title">Book New Dental Visit</span>
                <button className="modal-close" onClick={() => { setBookingDoctor(null); setShowBookNewVisitModal(false); }}>
                  <X size={16} />
                </button>
              </div>
              <form onSubmit={async (e) => {
                e.preventDefault();
                let doc = bookingDoctor;
                if (!doc) {
                  const docId = document.getElementById('modalSelectDoctor').value;
                  doc = doctors.find(d => d._id === docId);
                }
                if (!doc || !bookingDate || !bookingTime) {
                  alert('Please select a doctor, date, and time');
                  return;
                }
                try {
                  await appointmentService.bookAppointment({
                    doctorId: doc._id,
                    date: bookingDate,
                    time: bookingTime,
                  });
                  addToast('Appointment booked successfully!', 'success');
                  setBookingDoctor(null);
                  setShowBookNewVisitModal(false);
                  setBookingDate('');
                  setBookingTime('10:00 AM');
                  loadData();
                } catch (err) {
                  console.error(err);
                  alert(err.response?.data?.message || 'Failed to book appointment');
                }
              }}>
                <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  
                  {bookingDoctor ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <img 
                        src={getImageUrl(bookingDoctor.profilePhoto) || getDoctorAvatar(bookingDoctor.name, bookingDoctor._id)} 
                        alt={`Dr. ${bookingDoctor.name}`} 
                        style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover' }}
                      />
                      <div>
                        <div style={{ fontWeight: '700', color: '#0f172a' }}>Dr. {bookingDoctor.name}</div>
                        <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '500' }}>
                          {bookingDoctor.specialization || bookingDoctor.doctorDetails?.specialization || 'General Dentist'}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" style={{ fontWeight: '600' }}>Select Dentist</label>
                      {doctors.length === 0 ? (
                        <div style={{ fontSize: '13px', color: '#ef4444', fontWeight: '500' }}>
                          No doctors available in your city ({user?.city || 'Your City'}) yet. Please update your profile city first.
                        </div>
                      ) : (
                        <select
                          id="modalSelectDoctor"
                          required
                          className="admin-search-input"
                          style={{ paddingLeft: '16px', border: '1.5px solid #e2e8f0', borderRadius: '8px', height: '42px', width: '100%' }}
                        >
                          {doctors.map(d => (
                            <option key={d._id} value={d._id}>
                              Dr. {d.name} ({d.specialization || d.doctorDetails?.specialization || 'General Dentistry'})
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  )}

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontWeight: '600' }}>Preferred Date</label>
                    <input
                      type="date"
                      required
                      min={new Date().toISOString().split('T')[0]}
                      value={bookingDate}
                      onChange={(e) => setBookingDate(e.target.value)}
                      className="admin-search-input"
                      style={{ paddingLeft: '16px', border: '1.5px solid #e2e8f0', borderRadius: '8px', height: '42px', width: '100%' }}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontWeight: '600' }}>Preferred Time Slot</label>
                    <select
                      value={bookingTime}
                      onChange={(e) => setBookingTime(e.target.value)}
                      className="admin-search-input"
                      style={{ paddingLeft: '16px', border: '1.5px solid #e2e8f0', borderRadius: '8px', height: '42px', width: '100%' }}
                    >
                      <option value="09:00 AM">09:00 AM</option>
                      <option value="09:30 AM">09:30 AM</option>
                      <option value="10:00 AM">10:00 AM</option>
                      <option value="10:30 AM">10:30 AM</option>
                      <option value="11:00 AM">11:00 AM</option>
                      <option value="11:30 AM">11:30 AM</option>
                      <option value="12:00 PM">12:00 PM</option>
                      <option value="01:30 PM">01:30 PM</option>
                      <option value="02:00 PM">02:00 PM</option>
                      <option value="02:30 PM">02:30 PM</option>
                      <option value="03:00 PM">03:00 PM</option>
                      <option value="03:30 PM">03:30 PM</option>
                      <option value="04:00 PM">04:00 PM</option>
                    </select>
                  </div>

                </div>
                <div className="modal-footer" style={{ padding: '16px 20px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button type="button" className="btn btn-ghost" onClick={() => { setBookingDoctor(null); setShowBookNewVisitModal(false); }}>Cancel</button>
                  <button type="submit" disabled={doctors.length === 0 && !bookingDoctor} className="btn btn-primary" style={{ background: '#2563eb' }}>Book Appointment</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
