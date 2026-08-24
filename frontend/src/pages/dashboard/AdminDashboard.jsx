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
  X
} from 'lucide-react';

export default function AdminDashboard() {
  const { user, logout } = useAuthStore();
  const [activeSection, setActiveSection] = useState('overview'); // Default tab: Dashboard

  // Data states
  const [stats, setStats] = useState(null);
  const [pendingDoctors, setPendingDoctors] = useState([]);
  const [approvedDoctors, setApprovedDoctors] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);

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
    const list = approvedDoctors.map((doc, idx) => ({
      _id: doc._id || `doc-${idx}`,
      name: doc.name?.toLowerCase().startsWith('dr') ? doc.name : `Dr. ${doc.name || 'Unknown'}`,
      code: `P21 #${doc._id ? doc._id.slice(-4) : '000'}`,
      specialization: doc.doctorDetails?.specialization || doc.specialization || 'Dental Specialist',
      city: doc.city || 'N/A',
      clinicName: doc.doctorDetails?.clinicName || 'Clinic Center',
      registeredDate: doc.createdAt ? new Date(doc.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recently',
      status: doc.isApproved !== false ? 'Active' : 'Inactive',
      avatar: doc.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(doc.name || 'Doctor')}&background=0f172a&color=fff`
    }));

    return list.filter(doc => {
      const qDoc = doctorSearch.toLowerCase().trim();
      const qCity = citySearch.toLowerCase().trim();

      const matchDoc = !qDoc || 
        doc.name.toLowerCase().includes(qDoc) || 
        doc.code.toLowerCase().includes(qDoc) || 
        doc.specialization.toLowerCase().includes(qDoc);

      const matchCity = !qCity || doc.city.toLowerCase().includes(qCity);

      return matchDoc && matchCity;
    });
  }, [approvedDoctors, doctorSearch, citySearch]);

  // Filter pending doctors
  const filteredPendingDoctors = React.useMemo(() => {
    return pendingDoctors.filter(doc => {
      const qDoc = doctorSearch.toLowerCase().trim();
      const qCity = citySearch.toLowerCase().trim();

      const matchDoc = !qDoc || 
        doc.name?.toLowerCase().includes(qDoc) || 
        doc.doctorDetails?.specialization?.toLowerCase().includes(qDoc) ||
        doc.doctorDetails?.licenseNumber?.toLowerCase().includes(qDoc);

      const matchCity = !qCity || doc.city?.toLowerCase().includes(qCity);

      return matchDoc && matchCity;
    });
  }, [pendingDoctors, doctorSearch, citySearch]);

  // Filter reports
  const filteredReports = React.useMemo(() => {
    return reports.filter(rep => {
      const qDoc = doctorSearch.toLowerCase().trim();
      const qCity = citySearch.toLowerCase().trim();

      const matchDoc = !qDoc || 
        rep.patientName?.toLowerCase().includes(qDoc) || 
        rep.doctorName?.toLowerCase().includes(qDoc) ||
        rep.aiFindings?.conditions?.some(c => c.toLowerCase().includes(qDoc));

      const matchCity = !qCity || 
        rep.patientCity?.toLowerCase().includes(qCity) ||
        rep.doctorCity?.toLowerCase().includes(qCity);

      return matchDoc && matchCity;
    });
  }, [reports, doctorSearch, citySearch]);

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
    <div className="admin-dashboard-wrapper theme-teal">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div>
          <div className="admin-sidebar-logo">
            <div className="admin-logo-icon" style={{ background: '#ffffff', padding: '4px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '44px', height: '44px', flexShrink: 0 }}>
              <img src="/logo.png" alt="AI Dental Care Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            <div>
              <div className="admin-logo-text">AI Dental Care</div>
              <div className="admin-logo-sub">Admin Panal</div>
            </div>
          </div>

          <nav className="admin-sidebar-nav">
            <button 
              type="button" 
              className={`admin-nav-item ${activeSection === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveSection('overview')}
            >
              <span>Dashboard</span>
            </button>

            <button 
              type="button" 
              className={`admin-nav-item ${activeSection === 'pending' ? 'active' : ''}`}
              onClick={() => setActiveSection('pending')}
            >
              <span>Pending Approvals</span>
              {pendingDoctors.length > 0 && (
                <span style={{ background: '#ef4444', color: '#fff', fontSize: '11px', padding: '2px 8px', borderRadius: '12px' }}>
                  {pendingDoctors.length}
                </span>
              )}
            </button>

            <button 
              type="button" 
              className={`admin-nav-item ${activeSection === 'approved' ? 'active' : ''}`}
              onClick={() => setActiveSection('approved')}
            >
              <span>Approved Doctors</span>
            </button>

            <button 
              type="button" 
              className={`admin-nav-item ${activeSection === 'reports' ? 'active' : ''}`}
              onClick={() => setActiveSection('reports')}
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

      {/* Main Container */}
      <main className="admin-main">
        {/* Header Topbar */}
        <header className="admin-topbar">
          <h1 className="admin-topbar-title">{getSectionTitle()}</h1>
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
                <svg className="admin-sparkline" viewBox="0 0 70 28" fill="none">
                  <path d="M2 20 Q 20 15, 35 24 T 68 8" stroke="#3b82f6" strokeWidth="2" fill="none" strokeLinecap="round" />
                </svg>
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
                <svg className="admin-sparkline" viewBox="0 0 70 28" fill="none">
                  <path d="M2 22 Q 25 18, 45 25 T 68 12" stroke="#d97706" strokeWidth="2" fill="none" strokeLinecap="round" />
                </svg>
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
                <svg className="admin-sparkline" viewBox="0 0 70 28" fill="none">
                  <path d="M2 24 Q 30 24, 48 20 T 68 6" stroke="#16a34a" strokeWidth="2" fill="none" strokeLinecap="round" />
                </svg>
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
                <svg className="admin-sparkline" viewBox="0 0 70 28" fill="none">
                  <path d="M2 20 Q 25 24, 45 18 T 68 8" stroke="#0284c7" strokeWidth="2" fill="none" strokeLinecap="round" />
                </svg>
              </div>
            </div>
          )}

          {/* DASHBOARD OR APPROVED DOCTORS TAB: BOTH SHOW SEARCH & DOCTOR LIST TABLE */}
          {(activeSection === 'overview' || activeSection === 'approved') && (
            <>
              {/* Dual Search Input Row */}
              <div className="admin-search-row">
                <div className="admin-search-box">
                  <Search className="admin-search-icon" size={18} />
                  <input 
                    type="text" 
                    className="admin-search-input" 
                    placeholder="Search Doctors by Name, ID, or Specialty" 
                    value={doctorSearch}
                    onChange={(e) => setDoctorSearch(e.target.value)}
                  />
                </div>

                <div className="admin-search-box">
                  <Building2 className="admin-search-icon" size={18} />
                  <input 
                    type="text" 
                    className="admin-search-input" 
                    placeholder="Search for Doctors in a Specific City" 
                    value={citySearch}
                    onChange={(e) => setCitySearch(e.target.value)}
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
                        <th>ID</th>
                        <th>Specialty</th>
                        <th>City</th>
                        <th>Clinic Name</th>
                        <th>Registered Date</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr>
                          <td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                            Loading registered doctors...
                          </td>
                        </tr>
                      ) : displayDoctorsList.length === 0 ? (
                        <tr>
                          <td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                            No registered doctors found.
                          </td>
                        </tr>
                      ) : (
                        displayDoctorsList.map((doc) => (
                          <tr key={doc._id}>
                            <td>
                              <div className="admin-doctor-cell">
                                <img src={doc.avatar} alt={doc.name} className="admin-doctor-avatar" />
                                <span className="admin-doctor-name">{doc.name}</span>
                              </div>
                            </td>
                            <td style={{ fontWeight: '500', color: '#475569' }}>{doc.code}</td>
                            <td>{doc.specialization}</td>
                            <td>{doc.city}</td>
                            <td>{doc.clinicName}</td>
                            <td>{doc.registeredDate}</td>
                            <td>
                              <span className={`admin-badge-status ${doc.status === 'Active' ? 'active' : 'inactive'}`}>
                                {doc.status}
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

          {/* TAB 3: PENDING APPROVALS */}
          {activeSection === 'pending' && (
            <>
              {/* Dual Search Input Row for Pending Approvals */}
              <div className="admin-search-row">
                <div className="admin-search-box">
                  <Search className="admin-search-icon" size={18} />
                  <input 
                    type="text" 
                    className="admin-search-input" 
                    placeholder="Search Doctors by Name, License, or Specialty" 
                    value={doctorSearch}
                    onChange={(e) => setDoctorSearch(e.target.value)}
                  />
                </div>

                <div className="admin-search-box">
                  <Building2 className="admin-search-icon" size={18} />
                  <input 
                    type="text" 
                    className="admin-search-input" 
                    placeholder="Search for Doctors in a Specific City" 
                    value={citySearch}
                    onChange={(e) => setCitySearch(e.target.value)}
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
                        filteredPendingDoctors.map((doc) => (
                          <tr key={doc._id}>
                            <td>
                              <div className="admin-doctor-name">Dr. {doc.name}</div>
                              <div style={{ fontSize: '12px', color: '#64748b' }}>City: {doc.city}</div>
                            </td>
                            <td>{doc.doctorDetails?.specialization}</td>
                            <td>{doc.doctorDetails?.clinicName}</td>
                            <td>{doc.doctorDetails?.licenseNumber}</td>
                            <td>
                              <div style={{ display: 'flex', gap: '8px' }}>
                                <button 
                                  className="btn btn-success btn-sm" 
                                  onClick={() => handleApprove(doc._id)}
                                >
                                  <Check size={14} /> Approve
                                </button>
                                <button 
                                  className="btn btn-ghost btn-sm" 
                                  onClick={() => handleReject(doc._id)}
                                >
                                  <X size={14} /> Reject
                                </button>
                              </div>
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

          {/* TAB 4: ALL REPORTS */}
          {activeSection === 'reports' && (
            <>
              {/* Dual Search Input Row for Reports */}
              <div className="admin-search-row">
                <div className="admin-search-box">
                  <Search className="admin-search-icon" size={18} />
                  <input 
                    type="text" 
                    className="admin-search-input" 
                    placeholder="Search Reports by Patient, Doctor, or Condition" 
                    value={doctorSearch}
                    onChange={(e) => setDoctorSearch(e.target.value)}
                  />
                </div>

                <div className="admin-search-box">
                  <Building2 className="admin-search-icon" size={18} />
                  <input 
                    type="text" 
                    className="admin-search-input" 
                    placeholder="Search Reports in a Specific City" 
                    value={citySearch}
                    onChange={(e) => setCitySearch(e.target.value)}
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
                        <th>Patient City</th>
                        <th>Doctor</th>
                        <th>Doctor City</th>
                        <th>AI Findings</th>
                        <th>Status</th>
                        <th>Date</th>
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
                        filteredReports.map((rep) => (
                          <tr key={rep._id}>
                            <td style={{ fontWeight: '600' }}>{rep.patientName}</td>
                            <td>{rep.patientCity}</td>
                            <td>{rep.doctorName ? `Dr. ${rep.doctorName}` : '—'}</td>
                            <td>{rep.doctorCity || '—'}</td>
                            <td>{rep.aiFindings?.conditions?.join(', ') || 'No issue'}</td>
                            <td>
                              <span className={`admin-badge-status ${rep.status === 'reviewed' ? 'active' : 'inactive'}`}>
                                {rep.status}
                              </span>
                            </td>
                            <td>{new Date(rep.createdAt).toLocaleDateString()}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
