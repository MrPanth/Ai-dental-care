import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { adminService } from '../../services/api/adminService';
import { 
  Stethoscope, 
  Clock, 
  Users, 
  FileText, 
  Search, 
  Building2, 
  LogOut, 
  Activity,
  Check,
  X,
  Menu,
  Eye
} from 'lucide-react';

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

const formatDoctorName = (name) => {
  if (!name) return 'Dr. Doctor';
  let clean = name.trim();
  if (clean.toLowerCase().startsWith('dr.') || clean.toLowerCase().startsWith('dr ')) {
    clean = clean.replace(/^dr\.?\s*/i, '');
  }
  const formatted = clean
    .split(' ')
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
  return `Dr. ${formatted}`;
};

const capitalizeText = (text) => {
  if (!text) return 'N/A';
  return text
    .split(' ')
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
};

const getReportStatusBadge = (status) => {
  const s = (status || '').toLowerCase();
  if (s === 'completed' || s === 'reviewed') {
    return {
      label: 'Completed',
      bg: '#dcfce7',
      color: '#15803d',
      border: '#bbf7d0'
    };
  }
  if (s === 'no_issue') {
    return {
      label: 'No Issue',
      bg: '#f0fdf4',
      color: '#166534',
      border: '#bbf7d0'
    };
  }
  if (s === 'processing' || s === 'assigned' || s === 'pending_no_doctor') {
    return {
      label: s === 'pending_no_doctor' ? 'Unassigned' : s.charAt(0).toUpperCase() + s.slice(1),
      bg: '#fef3c7',
      color: '#b45309',
      border: '#fde68a'
    };
  }
  if (s === 'failed') {
    return {
      label: 'Failed',
      bg: '#fee2e2',
      color: '#dc2626',
      border: '#fecaca'
    };
  }
  return {
    label: status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Unknown',
    bg: '#f1f5f9',
    color: '#475569',
    border: '#e2e8f0'
  };
};

export default function AdminDashboard() {
  const { user, logout } = useAuthStore();
  const [activeSection, setActiveSection] = useState('overview'); // Default tab: Dashboard

  // Responsive sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Data states
  const [stats, setStats] = useState(null);
  const [pendingDoctors, setPendingDoctors] = useState([]);
  const [approvedDoctors, setApprovedDoctors] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);

  // Search states
  const [doctorSearch, setDoctorSearch] = useState('');
  const [citySearch, setCitySearch] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const statsData = await adminService.getStats();
      if (statsData) setStats(statsData);

      const pendingData = await adminService.getPendingDoctors();
      if (pendingData?.doctors) setPendingDoctors(pendingData.doctors);

      const approvedData = await adminService.getApprovedDoctors();
      if (approvedData?.doctors) setApprovedDoctors(approvedData.doctors);

      const reportsData = await adminService.getAllReports('');
      if (reportsData?.reports) setReports(reportsData.reports);
    } catch (err) {
      console.error('Error loading admin dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApprove = async (id) => {
    try {
      const res = await adminService.approveDoctor(id);
      alert(res.message || 'Doctor approved successfully!');
      loadData();
    } catch (err) {
      console.error(err);
      alert('Failed to approve doctor');
    }
  };

  const handleReject = async (id) => {
    if (!window.confirm('Are you sure you want to reject/remove this doctor?')) return;
    try {
      const res = await adminService.rejectDoctor(id);
      alert(res.message || 'Doctor rejected');
      loadData();
    } catch (err) {
      console.error(err);
      alert('Failed to reject doctor');
    }
  };

  // Process strictly REAL doctors registered in backend database
  const displayDoctorsList = React.useMemo(() => {
    const list = approvedDoctors.map((doc, idx) => {
      const formattedName = formatDoctorName(doc.name);
      return {
        ...doc,
        _id: doc._id || `doc-${idx}`,
        name: formattedName,
        licenseNumber: doc.licenseNumber || doc.doctorDetails?.licenseNumber || 'N/A',
        specialization: doc.specialization || doc.doctorDetails?.specialization || 'Dental Specialist',
        city: doc.city ? capitalizeText(doc.city) : 'N/A',
        clinicName: doc.clinicName || doc.doctorDetails?.clinicName || 'Dental Clinic',
        clinicAddress: doc.clinicAddress || doc.doctorDetails?.clinicAddress || '',
        registeredDate: doc.createdAt ? new Date(doc.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recently',
        status: doc.isApproved !== false ? 'Active' : 'Inactive',
        avatar: getImageUrl(doc.profilePhoto) || doc.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(doc.name || 'Doctor')}&background=0f172a&color=fff`
      };
    });

    return list.filter(doc => {
      const q = doctorSearch.toLowerCase().trim();
      if (!q) return true;

      const name = (doc.name || '').toLowerCase();
      const spec = (doc.specialization || '').toLowerCase();
      const license = (doc.licenseNumber || '').toLowerCase();
      const clinic = (doc.clinicName || '').toLowerCase();
      const city = (doc.city || '').toLowerCase();

      return name.includes(q) || spec.includes(q) || license.includes(q) || clinic.includes(q) || city.includes(q);
    });
  }, [approvedDoctors, doctorSearch]);

  // Filter pending doctors
  const filteredPendingDoctors = React.useMemo(() => {
    return pendingDoctors.filter(doc => {
      const q = doctorSearch.toLowerCase().trim();
      if (!q) return true;

      const name = (doc.name || '').toLowerCase();
      const spec = (doc.specialization || doc.doctorDetails?.specialization || '').toLowerCase();
      const license = (doc.licenseNumber || doc.doctorDetails?.licenseNumber || '').toLowerCase();
      const clinic = (doc.clinicName || doc.doctorDetails?.clinicName || '').toLowerCase();
      const city = (doc.city || '').toLowerCase();

      return name.includes(q) || spec.includes(q) || license.includes(q) || clinic.includes(q) || city.includes(q);
    });
  }, [pendingDoctors, doctorSearch]);

  // Filter reports
  const filteredReports = React.useMemo(() => {
    return reports.filter(rep => {
      const q = doctorSearch.toLowerCase().trim();
      if (!q) return true;

      const patientName = (rep.patientName || '').toLowerCase();
      const patientCity = (rep.patientCity || '').toLowerCase();
      const doctorName = (rep.doctorName || '').toLowerCase();
      const doctorCity = (rep.doctorCity || '').toLowerCase();
      const status = (rep.status || '').toLowerCase();
      const severity = (rep.aiFindings?.severity || '').toLowerCase();
      const hasCondition = rep.aiFindings?.conditions?.some(c => c.toLowerCase().includes(q));

      return patientName.includes(q) || 
        patientCity.includes(q) || 
        doctorName.includes(q) || 
        doctorCity.includes(q) || 
        status.includes(q) || 
        severity.includes(q) || 
        hasCondition;
    });
  }, [reports, doctorSearch]);

  const getSectionTitle = () => {
    switch (activeSection) {
      case 'overview': return 'Dashboard';
      case 'pending': return 'Pending Approvals';
      case 'approved': return 'Approved Doctors';
      case 'reports': return 'All Reports';
      default: return 'Dashboard';
    }
  };

  return (
    <div className={`admin-dashboard-wrapper theme-teal ${sidebarOpen ? 'sidebar-open' : ''}`}>
      {/* Sidebar */}
      <aside className={`admin-sidebar${sidebarOpen ? ' open' : ''}`}>
        <div>
          <div className="admin-sidebar-logo">
            <div className="admin-logo-icon" style={{ background: '#ffffff', padding: '4px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '44px', height: '44px', flexShrink: 0 }}>
              <img src="/logo.png" alt="AI Dental Care Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            <div>
              <div className="admin-logo-text">AI Dental Care</div>
              <div className="admin-logo-sub">Admin Panel</div>
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
              className={`admin-nav-item ${activeSection === 'pending' ? 'active' : ''}`}
              onClick={() => { setActiveSection('pending'); setSidebarOpen(false); }}
            >
              <span>Pending Approvals</span>
            </button>

            <button 
              type="button" 
              className={`admin-nav-item ${activeSection === 'approved' ? 'active' : ''}`}
              onClick={() => { setActiveSection('approved'); setSidebarOpen(false); }}
            >
              <span>Approved Doctors</span>
            </button>

            <button 
              type="button" 
              className={`admin-nav-item ${activeSection === 'reports' ? 'active' : ''}`}
              onClick={() => { setActiveSection('reports'); setSidebarOpen(false); }}
            >
              <span>All Reports</span>
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

      {/* Sidebar overlay – closes drawer when tapped */}
      <div
        className={`admin-sidebar-overlay${sidebarOpen ? ' show' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Main Container */}
      <main className="admin-main">
        {/* Header Topbar */}
        <header className="admin-topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Hamburger – visible only on mobile via CSS */}
            <button
              className="admin-hamburger"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open navigation menu"
            >
              <Menu size={22} />
            </button>
            <h1 className="admin-topbar-title">{getSectionTitle()}</h1>
          </div>
          <div className="admin-header-profile" style={{ cursor: 'default' }}>
            <div className="admin-user-avatar">AD</div>
            <div className="admin-user-info">
              <span className="admin-user-name">{user?.name || 'Administrator'}</span>
              <span className="admin-user-city">System Admin</span>
            </div>
          </div>
        </header>

        {/* Content Body */}
        <div className="admin-content">
          {/* STATS CARDS: SHOWN ON DASHBOARD (OVERVIEW) TAB */}
          {activeSection === 'overview' && (
            <div className="admin-stats-grid">
              {/* Approved Doctors Card */}
              <div className="admin-stat-card">
                <div className="admin-stat-left">
                  <div className="admin-stat-icon-box blue">
                    <Stethoscope size={20} />
                  </div>
                  <div>
                    <div className="admin-stat-number">{stats?.totalDoctors ?? approvedDoctors.length}</div>
                    <div className="admin-stat-label">Approved Doctors</div>
                  </div>
                </div>
              </div>

              {/* Pending Approvals Card */}
              <div className="admin-stat-card">
                <div className="admin-stat-left">
                  <div className="admin-stat-icon-box gold">
                    <Clock size={20} />
                  </div>
                  <div>
                    <div className="admin-stat-number">{stats?.pendingDoctors ?? pendingDoctors.length}</div>
                    <div className="admin-stat-label">Pending Approvals</div>
                  </div>
                </div>
              </div>

              {/* Total Patients Card */}
              <div className="admin-stat-card">
                <div className="admin-stat-left">
                  <div className="admin-stat-icon-box green">
                    <Users size={20} />
                  </div>
                  <div>
                    <div className="admin-stat-number">{stats?.totalPatients ?? 0}</div>
                    <div className="admin-stat-label">Total Patients</div>
                  </div>
                </div>
              </div>

              {/* Total Reports Card */}
              <div className="admin-stat-card">
                <div className="admin-stat-left">
                  <div className="admin-stat-icon-box teal">
                    <FileText size={20} />
                  </div>
                  <div>
                    <div className="admin-stat-number">{stats?.totalReports ?? reports.length}</div>
                    <div className="admin-stat-label">Total Reports</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* DASHBOARD OR APPROVED DOCTORS TAB: BOTH SHOW SEARCH & DOCTOR LIST TABLE */}
          {(activeSection === 'overview' || activeSection === 'approved') && (
            <>
              {/* Unified Search Input Row */}
              <div className="admin-search-row">
                <div className="admin-search-box" style={{ maxWidth: '640px', width: '100%' }}>
                  <Search className="admin-search-icon" size={18} />
                  <input 
                    type="text" 
                    className="admin-search-input" 
                    placeholder="Search Doctors by Name, License, Specialty, or City" 
                    value={doctorSearch}
                    onChange={(e) => setDoctorSearch(e.target.value)}
                  />
                </div>
              </div>

              {/* Table: Registered / Approved Doctor List */}
              <div className="admin-table-card">
                <h2 className="admin-table-title">
                  {activeSection === 'approved' ? 'Approved Doctors List' : 'Registered Doctor List'}
                </h2>
                <div className="admin-table-wrapper">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Doctor Name</th>
                        <th>License Number</th>
                        <th>Specialty</th>
                        <th>City</th>
                        <th>Clinic Name</th>
                        <th>Registered Date</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr>
                          <td colSpan="8" style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                            Loading registered doctors...
                          </td>
                        </tr>
                      ) : displayDoctorsList.length === 0 ? (
                        <tr>
                          <td colSpan="8" style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                            No registered doctors found.
                          </td>
                        </tr>
                      ) : (
                        displayDoctorsList.map((doc) => {
                          const fallbackAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(doc.name || 'Doctor')}&background=0f172a&color=fff`;

                          return (
                            <tr key={doc._id}>
                              <td>
                                <div className="admin-doctor-cell">
                                  <img 
                                    src={doc.avatar} 
                                    alt={doc.name} 
                                    className="admin-doctor-avatar"
                                    onError={(e) => {
                                      e.currentTarget.onerror = null;
                                      e.currentTarget.src = fallbackAvatar;
                                    }}
                                  />
                                  <span className="admin-doctor-name">{doc.name}</span>
                                </div>
                              </td>
                              <td>
                                <span style={{
                                  display: 'inline-block',
                                  padding: '4px 10px',
                                  background: '#f1f5f9',
                                  borderRadius: '6px',
                                  fontFamily: 'monospace',
                                  fontWeight: '700',
                                  fontSize: '13px',
                                  color: '#0f172a',
                                  border: '1px solid #cbd5e1'
                                }}>
                                  {doc.licenseNumber}
                                </span>
                              </td>
                              <td>{doc.specialization}</td>
                              <td>{doc.city}</td>
                              <td>{doc.clinicName}</td>
                              <td>{doc.registeredDate}</td>
                              <td>
                                <span className={`admin-badge-status ${doc.status === 'Active' ? 'active' : 'inactive'}`}>
                                  {doc.status}
                                </span>
                              </td>
                              <td>
                                <button 
                                  type="button"
                                  className="btn btn-outline btn-sm"
                                  style={{ 
                                    display: 'inline-flex', 
                                    alignItems: 'center', 
                                    gap: '6px',
                                    borderColor: '#0d9488',
                                    color: '#0d9488',
                                    backgroundColor: '#f0fdfa',
                                    fontWeight: '600',
                                    padding: '6px 14px',
                                    borderRadius: '8px'
                                  }}
                                  onClick={() => setSelectedDoctor(doc)}
                                >
                                  <Eye size={14} /> Details
                                </button>
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

          {/* TAB 3: PENDING APPROVALS */}
          {activeSection === 'pending' && (
            <>
              {/* Unified Search Input for Pending Approvals */}
              <div className="admin-search-row">
                <div className="admin-search-box" style={{ maxWidth: '640px', width: '100%' }}>
                  <Search className="admin-search-icon" size={18} />
                  <input 
                    type="text" 
                    className="admin-search-input" 
                    placeholder="Search Doctors by Name, License, Specialty, or City" 
                    value={doctorSearch}
                    onChange={(e) => setDoctorSearch(e.target.value)}
                  />
                </div>
              </div>

              <div className="admin-table-card">
                <h2 className="admin-table-title">Pending Doctor Approvals</h2>
                <div className="admin-table-wrapper">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Doctor</th>
                        <th>Specialization</th>
                        <th>Clinic Details</th>
                        <th>License Number</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPendingDoctors.length === 0 ? (
                        <tr>
                          <td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                            No pending doctor registrations found.
                          </td>
                        </tr>
                      ) : (
                        filteredPendingDoctors.map((doc) => {
                          const docName = formatDoctorName(doc.name);
                          const specialization = doc.specialization || doc.doctorDetails?.specialization || 'General Dentistry';
                          const clinicName = doc.clinicName || doc.doctorDetails?.clinicName || 'Dental Clinic';
                          const clinicAddress = doc.clinicAddress || doc.doctorDetails?.clinicAddress || '';
                          const city = doc.city ? capitalizeText(doc.city) : '';
                          const licenseNumber = doc.licenseNumber || doc.doctorDetails?.licenseNumber || 'N/A';
                          const avatar = getImageUrl(doc.profilePhoto) || doc.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(doc.name || 'Doctor')}&background=0d9488&color=fff`;

                          return (
                            <tr key={doc._id}>
                              <td>
                                <div className="admin-doctor-cell">
                                  <img src={avatar} alt={docName} className="admin-doctor-avatar" />
                                  <div>
                                    <div className="admin-doctor-name">{docName}</div>
                                    <div style={{ fontSize: '12px', color: '#64748b' }}>
                                      {city ? `City: ${city}` : (doc.email || '')}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td>
                                <span style={{ fontWeight: '600', color: '#1e293b' }}>
                                  {specialization}
                                </span>
                                {doc.experience ? (
                                  <div style={{ fontSize: '12px', color: '#64748b' }}>
                                    {doc.experience} yrs exp.
                                  </div>
                                ) : null}
                              </td>
                              <td>
                                <div style={{ fontWeight: '600', color: '#1e293b' }}>{clinicName}</div>
                                <div style={{ fontSize: '12px', color: '#64748b' }}>
                                  {[clinicAddress, city].filter(Boolean).join(', ')}
                                </div>
                              </td>
                              <td>
                                <span style={{
                                  display: 'inline-block',
                                  padding: '4px 10px',
                                  background: '#f1f5f9',
                                  borderRadius: '6px',
                                  fontFamily: 'monospace',
                                  fontWeight: '700',
                                  fontSize: '13px',
                                  color: '#0f172a',
                                  border: '1px solid #cbd5e1'
                                }}>
                                  {licenseNumber}
                                </span>
                              </td>
                              <td>
                                <button 
                                  type="button"
                                  className="btn btn-outline btn-sm"
                                  style={{ 
                                    display: 'inline-flex', 
                                    alignItems: 'center', 
                                    gap: '6px',
                                    borderColor: '#0d9488',
                                    color: '#0d9488',
                                    backgroundColor: '#f0fdfa',
                                    fontWeight: '600',
                                    padding: '6px 14px',
                                    borderRadius: '8px'
                                  }}
                                  onClick={() => setSelectedDoctor(doc)}
                                >
                                  <Eye size={14} /> Details
                                </button>
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

          {/* TAB 4: ALL REPORTS */}
          {activeSection === 'reports' && (
            <>
              {/* Unified Search Input Row for Reports */}
              <div className="admin-search-row">
                <div className="admin-search-box" style={{ maxWidth: '640px', width: '100%' }}>
                  <Search className="admin-search-icon" size={18} />
                  <input 
                    type="text" 
                    className="admin-search-input" 
                    placeholder="Search Reports by Patient, Doctor, Condition, City, or Status" 
                    value={doctorSearch}
                    onChange={(e) => setDoctorSearch(e.target.value)}
                  />
                </div>
              </div>

              <div className="admin-table-card">
                <h2 className="admin-table-title">All Patient Diagnostics Reports</h2>
                <div className="admin-table-wrapper">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Patient</th>
                        <th>Doctor</th>
                        <th>AI Findings</th>
                        <th>Severity</th>
                        <th>Date</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredReports.length === 0 ? (
                        <tr>
                          <td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                            No diagnostic reports found matching search criteria.
                          </td>
                        </tr>
                      ) : (
                        filteredReports.map((rep) => {
                          const statusBadge = getReportStatusBadge(rep.status);
                          const sev = (rep.aiFindings?.severity || 'none').toLowerCase();
                          let sevBg = '#f1f5f9', sevCol = '#475569', sevBrd = '#e2e8f0';
                          if (sev === 'severe' || sev === 'high') { sevBg = '#fee2e2'; sevCol = '#dc2626'; sevBrd = '#fecaca'; }
                          else if (sev === 'moderate') { sevBg = '#ffedd5'; sevCol = '#c2410c'; sevBrd = '#fed7aa'; }
                          else if (sev === 'mild') { sevBg = '#fef3c7'; sevCol = '#b45309'; sevBrd = '#fde68a'; }
                          else if (sev === 'none') { sevBg = '#f0fdf4'; sevCol = '#166534'; sevBrd = '#bbf7d0'; }

                          return (
                            <tr key={rep._id}>
                              <td>
                                <div style={{ fontWeight: '600', color: '#0f172a' }}>{capitalizeText(rep.patientName)}</div>
                                <div style={{ fontSize: '12px', color: '#64748b' }}>
                                  {rep.patientCity ? capitalizeText(rep.patientCity) : 'City: N/A'}
                                </div>
                              </td>
                              <td>
                                {rep.doctorName ? (
                                  <>
                                    <div style={{ fontWeight: '600', color: '#0f172a' }}>{formatDoctorName(rep.doctorName)}</div>
                                    <div style={{ fontSize: '12px', color: '#64748b' }}>
                                      {rep.doctorCity ? capitalizeText(rep.doctorCity) : ''}
                                    </div>
                                  </>
                                ) : (
                                  <span style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '13px' }}>Unassigned</span>
                                )}
                              </td>
                              <td>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', maxWidth: '300px' }}>
                                  {rep.aiFindings?.conditions && rep.aiFindings.conditions.length > 0 ? (
                                    rep.aiFindings.conditions.map((cond, idx) => (
                                      <span 
                                        key={idx} 
                                        style={{ 
                                          display: 'inline-block', 
                                          padding: '2px 8px', 
                                          borderRadius: '4px', 
                                          background: '#f8fafc', 
                                          color: '#334155', 
                                          fontSize: '11px', 
                                          fontWeight: '500',
                                          border: '1px solid #e2e8f0'
                                        }}
                                      >
                                        {cond}
                                      </span>
                                    ))
                                  ) : (
                                    <span style={{ color: '#166534', fontSize: '12px', fontWeight: '500' }}>No issue detected</span>
                                  )}
                                </div>
                              </td>
                              <td>
                                <span style={{
                                  display: 'inline-block',
                                  padding: '2px 8px',
                                  borderRadius: '10px',
                                  fontSize: '11px',
                                  fontWeight: '600',
                                  backgroundColor: sevBg,
                                  color: sevCol,
                                  border: `1px solid ${sevBrd}`,
                                  textTransform: 'capitalize'
                                }}>
                                  {sev}
                                </span>
                              </td>
                              <td style={{ fontSize: '13px', color: '#475569' }}>
                                {new Date(rep.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </td>
                              <td>
                                <span style={{
                                  display: 'inline-block',
                                  padding: '3px 10px',
                                  borderRadius: '12px',
                                  fontSize: '11px',
                                  fontWeight: '600',
                                  backgroundColor: statusBadge.bg,
                                  color: statusBadge.color,
                                  border: `1px solid ${statusBadge.border}`
                                }}>
                                  {statusBadge.label}
                                </span>
                              </td>
                              <td>
                                <button 
                                  type="button"
                                  className="btn btn-outline btn-sm"
                                  style={{ 
                                    display: 'inline-flex', 
                                    alignItems: 'center', 
                                    gap: '5px',
                                    borderColor: '#0d9488',
                                    color: '#0d9488',
                                    backgroundColor: '#f0fdfa',
                                    fontWeight: '600',
                                    padding: '5px 12px',
                                    borderRadius: '8px'
                                  }}
                                  onClick={() => setSelectedReport(rep)}
                                >
                                  <Eye size={13} /> View
                                </button>
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

          {/* DOCTOR VERIFICATION DETAILS MODAL */}
          {selectedDoctor && (
            <div className="modal-overlay open" onClick={() => setSelectedDoctor(null)}>
              <div 
                className="modal" 
                style={{ maxWidth: '640px', width: '92%', borderRadius: '16px', overflow: 'hidden' }} 
                onClick={(e) => e.stopPropagation()}
              >
                <div className="modal-header" style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="modal-title" style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>
                    Doctor Verification Details
                  </span>
                  <button 
                    type="button" 
                    className="modal-close" 
                    onClick={() => setSelectedDoctor(null)}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="modal-body" style={{ padding: '20px', maxHeight: '72vh', overflowY: 'auto' }}>
                  {/* Doctor Profile Banner */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', background: '#f8fafc', borderRadius: '12px', marginBottom: '18px', border: '1px solid #e2e8f0' }}>
                    <img 
                      src={getImageUrl(selectedDoctor.profilePhoto) || selectedDoctor.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedDoctor.name || 'Doctor')}&background=0d9488&color=fff`} 
                      alt={selectedDoctor.name} 
                      style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #0d9488' }} 
                    />
                    <div>
                      <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>
                        {formatDoctorName(selectedDoctor.name)}
                      </h3>
                      <div style={{ color: '#0d9488', fontWeight: '600', fontSize: '14px', marginTop: '2px' }}>
                        {selectedDoctor.specialization || selectedDoctor.doctorDetails?.specialization || 'General Dentistry'}
                      </div>
                      <div style={{ color: '#64748b', fontSize: '12px', marginTop: '3px' }}>
                        Experience: {selectedDoctor.experience || selectedDoctor.doctorDetails?.experience || 0} years
                      </div>
                    </div>
                  </div>

                  {/* Grid of Details */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px', marginBottom: '18px' }}>
                    <div style={{ padding: '12px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
                      <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: '700', marginBottom: '4px' }}>
                        License Number
                      </div>
                      <div style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', fontFamily: 'monospace' }}>
                        {selectedDoctor.licenseNumber || selectedDoctor.doctorDetails?.licenseNumber || 'Not provided'}
                      </div>
                    </div>

                    <div style={{ padding: '12px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
                      <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: '700', marginBottom: '4px' }}>
                        Email Address
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a', wordBreak: 'break-all' }}>
                        {selectedDoctor.email || 'Not provided'}
                      </div>
                    </div>

                    <div style={{ padding: '12px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
                      <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: '700', marginBottom: '4px' }}>
                        Phone Number
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a' }}>
                        {selectedDoctor.phone || 'Not provided'}
                      </div>
                    </div>

                    <div style={{ padding: '12px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
                      <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: '700', marginBottom: '4px' }}>
                        City / Region
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a' }}>
                        {capitalizeText(selectedDoctor.city)}
                      </div>
                    </div>
                  </div>

                  {/* Clinic Details */}
                  <div style={{ padding: '14px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', marginBottom: '18px' }}>
                    <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: '700', marginBottom: '4px' }}>
                      Clinic Information
                    </div>
                    <div style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>
                      {selectedDoctor.clinicName || selectedDoctor.doctorDetails?.clinicName || 'Not specified'}
                    </div>
                    <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
                      {selectedDoctor.clinicAddress || selectedDoctor.doctorDetails?.clinicAddress || 'Address not provided'}
                    </div>
                  </div>

                  {/* Uploaded Documents */}
                  <div style={{ padding: '14px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
                    <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: '700', marginBottom: '8px' }}>
                      Uploaded Verification Documents
                    </div>
                    {selectedDoctor.documents && selectedDoctor.documents.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {selectedDoctor.documents.map((docPath, idx) => (
                          <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                            <span style={{ fontSize: '13px', color: '#334155', fontWeight: '600' }}>
                              Certificate / Document #{idx + 1}
                            </span>
                            <a 
                              href={getImageUrl(docPath)} 
                              target="_blank" 
                              rel="noreferrer"
                              className="btn btn-outline btn-sm"
                              style={{ padding: '4px 12px', fontSize: '12px', borderColor: '#0d9488', color: '#0d9488' }}
                            >
                              Open Document
                            </a>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ fontSize: '13px', color: '#94a3b8', fontStyle: 'italic' }}>
                        No separate uploaded document attachments found.
                      </div>
                    )}
                  </div>
                </div>

                <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e2e8f0', padding: '16px 20px', background: '#fafafa' }}>
                  <button 
                    type="button" 
                    className="btn btn-ghost" 
                    onClick={() => setSelectedDoctor(null)}
                  >
                    Close
                  </button>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button 
                      type="button" 
                      className="btn btn-ghost" 
                      style={{ border: '1px solid #e2e8f0', color: selectedDoctor.isApproved ? '#ef4444' : '#64748b', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                      onClick={() => {
                        const id = selectedDoctor._id;
                        setSelectedDoctor(null);
                        handleReject(id);
                      }}
                    >
                      <X size={16} /> {selectedDoctor.isApproved ? 'Remove Doctor' : 'Reject'}
                    </button>
                    {!selectedDoctor.isApproved && (
                      <button 
                        type="button" 
                        className="btn btn-success" 
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                        onClick={() => {
                          const id = selectedDoctor._id;
                          setSelectedDoctor(null);
                          handleApprove(id);
                        }}
                      >
                        <Check size={16} /> Approve Doctor
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PATIENT DIAGNOSTIC REPORT MODAL */}
          {selectedReport && (
            <div className="modal-overlay open" onClick={() => setSelectedReport(null)}>
              <div 
                className="modal" 
                style={{ maxWidth: '680px', width: '92%', borderRadius: '16px', overflow: 'hidden' }} 
                onClick={(e) => e.stopPropagation()}
              >
                <div className="modal-header" style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="modal-title" style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>
                    Diagnostic Report Details
                  </span>
                  <button 
                    type="button" 
                    className="modal-close" 
                    onClick={() => setSelectedReport(null)}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="modal-body" style={{ padding: '20px', maxHeight: '72vh', overflowY: 'auto' }}>
                  {/* Top section: Scan image + quick meta */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'minmax(180px, 1fr) 1.5fr', gap: '16px', marginBottom: '20px', background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <div>
                      <img 
                        src={getImageUrl(selectedReport.imagePath) || 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?auto=format&fit=crop&w=400&q=80'} 
                        alt="Dental Scan"
                        style={{ width: '100%', height: '170px', objectFit: 'cover', borderRadius: '10px', border: '1px solid #cbd5e1' }}
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?auto=format&fit=crop&w=400&q=80';
                        }}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                      <div>
                        <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: '700' }}>Patient</span>
                        <div style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>{capitalizeText(selectedReport.patientName)}</div>
                        <div style={{ color: '#64748b', fontSize: '12px' }}>City: {selectedReport.patientCity ? capitalizeText(selectedReport.patientCity) : 'N/A'}</div>
                      </div>
                      <div style={{ marginTop: '4px' }}>
                        <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: '700' }}>Assigned Doctor</span>
                        <div style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a' }}>
                          {selectedReport.doctorName ? formatDoctorName(selectedReport.doctorName) : 'Unassigned'}
                        </div>
                        {selectedReport.doctorCity && (
                          <div style={{ color: '#64748b', fontSize: '12px' }}>City: {capitalizeText(selectedReport.doctorCity)}</div>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '6px' }}>
                        <div>
                          <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: '700', display: 'block' }}>Status</span>
                          {(() => {
                            const badge = getReportStatusBadge(selectedReport.status);
                            return (
                              <span style={{
                                display: 'inline-block',
                                padding: '2px 8px',
                                borderRadius: '10px',
                                fontSize: '11px',
                                fontWeight: '600',
                                backgroundColor: badge.bg,
                                color: badge.color,
                                border: `1px solid ${badge.border}`
                              }}>
                                {badge.label}
                              </span>
                            );
                          })()}
                        </div>
                        <div>
                          <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: '700', display: 'block' }}>Date</span>
                          <span style={{ fontSize: '12px', fontWeight: '600', color: '#334155' }}>
                            {new Date(selectedReport.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* AI Findings Card */}
                  <div style={{ padding: '16px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <span style={{ fontSize: '13px', color: '#0f172a', fontWeight: '700', textTransform: 'uppercase' }}>
                        AI Diagnostics
                      </span>
                      {selectedReport.aiFindings?.confidence !== undefined && (
                        <span style={{ fontSize: '12px', color: '#0d9488', fontWeight: '700', background: '#f0fdfa', padding: '2px 8px', borderRadius: '6px', border: '1px solid #ccfbf1' }}>
                          Confidence: {selectedReport.aiFindings.confidence}%
                        </span>
                      )}
                    </div>

                    <div style={{ marginBottom: '10px' }}>
                      <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600', display: 'block', marginBottom: '6px' }}>
                        Conditions Detected:
                      </span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {selectedReport.aiFindings?.conditions && selectedReport.aiFindings.conditions.length > 0 ? (
                          selectedReport.aiFindings.conditions.map((c, i) => (
                            <span key={i} style={{ padding: '4px 10px', background: '#f1f5f9', borderRadius: '6px', color: '#1e293b', fontSize: '12px', fontWeight: '600', border: '1px solid #e2e8f0' }}>
                              {c}
                            </span>
                          ))
                        ) : (
                          <span style={{ color: '#16a34a', fontWeight: '600', fontSize: '13px' }}>
                            No dental conditions detected (Clean Scan)
                          </span>
                        )}
                      </div>
                    </div>

                    {selectedReport.aiFindings?.severity && (
                      <div style={{ marginTop: '10px', fontSize: '13px' }}>
                        <span style={{ color: '#64748b', fontWeight: '600' }}>Severity Level: </span>
                        <span style={{ textTransform: 'capitalize', fontWeight: '700', color: '#0f172a' }}>
                          {selectedReport.aiFindings.severity}
                        </span>
                      </div>
                    )}

                    {selectedReport.aiFindings?.description && (
                      <div style={{ marginTop: '10px', fontSize: '13px', color: '#475569', background: '#f8fafc', padding: '10px', borderRadius: '8px' }}>
                        {selectedReport.aiFindings.description}
                      </div>
                    )}

                    {selectedReport.errorMessage && (
                      <div style={{ marginTop: '10px', fontSize: '13px', color: '#dc2626', background: '#fef2f2', padding: '10px', borderRadius: '8px', border: '1px solid #fecaca' }}>
                        <strong>Diagnostic Error: </strong>{selectedReport.errorMessage}
                      </div>
                    )}
                  </div>

                  {/* Doctor Feedback Card (if reviewed) */}
                  <div style={{ padding: '16px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
                    <span style={{ fontSize: '13px', color: '#0f172a', fontWeight: '700', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                      Doctor Clinical Review & Recommendation
                    </span>
                    {selectedReport.doctorFeedback?.reviewed ? (
                      <div>
                        {selectedReport.doctorFeedback.recommendation && (
                          <div style={{ marginBottom: '8px' }}>
                            <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Recommendation: </span>
                            <span style={{ fontWeight: '700', color: '#0d9488' }}>
                              {selectedReport.doctorFeedback.recommendation}
                            </span>
                          </div>
                        )}
                        {selectedReport.doctorFeedback.notes && (
                          <div style={{ fontSize: '13px', color: '#334155', background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                            <strong>Notes: </strong>{selectedReport.doctorFeedback.notes}
                          </div>
                        )}
                        {selectedReport.doctorFeedback.reviewedAt && (
                          <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '6px' }}>
                            Reviewed on {new Date(selectedReport.doctorFeedback.reviewedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div style={{ fontSize: '13px', color: '#94a3b8', fontStyle: 'italic' }}>
                        Doctor has not yet submitted clinical notes for this report.
                      </div>
                    )}
                  </div>
                </div>

                <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #e2e8f0', padding: '14px 20px', background: '#fafafa' }}>
                  <button 
                    type="button" 
                    className="btn btn-ghost" 
                    onClick={() => setSelectedReport(null)}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
