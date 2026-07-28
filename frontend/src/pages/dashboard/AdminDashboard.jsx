import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { adminService } from '../../services/api/adminService';
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
  AlertCircle
} from 'lucide-react';

export default function AdminDashboard() {
  const { user, logout } = useAuthStore();
  const [activeSection, setActiveSection] = useState('overview');
  
  // Responsive sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Data states
  const [stats, setStats] = useState(null);
  const [pendingDoctors, setPendingDoctors] = useState([]);
  const [approvedDoctors, setApprovedDoctors] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filter/Search states
  const [doctorSearch, setDoctorSearch] = useState('');
  const [reportStatusFilter, setReportStatusFilter] = useState('');

  // Selected doctor modal
  const [selectedDoctor, setSelectedDoctor] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const statsData = await adminService.getStats();
      setStats(statsData);

      const pendingData = await adminService.getPendingDoctors();
      setPendingDoctors(pendingData.doctors || []);

      const approvedData = await adminService.getApprovedDoctors();
      setApprovedDoctors(approvedData.doctors || []);

      const reportsData = await adminService.getAllReports(reportStatusFilter);
      setReports(reportsData.reports || []);
    } catch (err) {
      console.error('Error loading admin dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [reportStatusFilter]);

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
      alert(res.message || 'Doctor rejected and removed');
      loadData();
    } catch (err) {
      console.error(err);
      alert('Failed to reject doctor');
    }
  };

  const handleSuspend = async (id) => {
    if (!window.confirm('Suspend this doctor?')) return;
    try {
      const res = await adminService.rejectDoctor(id);
      alert(res.message || 'Doctor suspended');
      loadData();
    } catch (err) {
      console.error(err);
      alert('Failed to suspend doctor');
    }
  };

  // Filter approved doctors
  const filteredDoctors = approvedDoctors.filter((doc) => {
    const query = doctorSearch.toLowerCase().trim();
    return (
      doc.name?.toLowerCase().includes(query) ||
      doc.city?.toLowerCase().includes(query) ||
      doc.doctorDetails?.specialization?.toLowerCase().includes(query)
    );
  });

  return (
    <div className={`dashboard-layout ${sidebarOpen ? 'sidebar-open' : ''}`}>
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <img src="/logo.png" alt="AI Dental Care Logo" className="sidebar-logo-img" />
          <div>
            <div className="sidebar-logo-text">AI Dental Care</div>
            <div className="sidebar-logo-sub">Admin Panel</div>
          </div>
        </div>
        <nav className="sidebar-nav">
          <button 
            type="button"
            className={`nav-item ${activeSection === 'overview' ? 'active' : ''}`}
            onClick={() => { setActiveSection('overview'); setSidebarOpen(false); }}
          >
            <span>Dashboard</span>
          </button>
          <button 
            type="button"
            className={`nav-item ${activeSection === 'pending' ? 'active' : ''}`}
            onClick={() => { setActiveSection('pending'); setSidebarOpen(false); }}
          >
            <span>Pending Approvals</span>
            {pendingDoctors.length > 0 && (
              <span className="nav-badge">{pendingDoctors.length}</span>
            )}
          </button>
          <button 
            type="button"
            className={`nav-item ${activeSection === 'approved' ? 'active' : ''}`}
            onClick={() => { setActiveSection('approved'); setSidebarOpen(false); }}
          >
            <span>Approved Doctors</span>
          </button>
          <button 
            type="button"
            className={`nav-item ${activeSection === 'reports' ? 'active' : ''}`}
            onClick={() => { setActiveSection('reports'); setSidebarOpen(false); }}
          >
            <span>All Reports</span>
          </button>
        </nav>
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar-new">
              <span className="sidebar-avatar-text">AD</span>
            </div>
            <div className="sidebar-user-details">
              <div className="sidebar-user-name">Administrator</div>
              <div className="sidebar-user-role">{user?.email || 'admin@aidental.care'}</div>
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
              {activeSection === 'pending' && 'Pending Approvals'}
              {activeSection === 'approved' && 'Approved Doctors'}
              {activeSection === 'reports' && 'All Reports'}
            </span>
          </div>
          <div className="topbar-right">
            <div className="topbar-badge-role">Admin Control</div>
          </div>
        </div>

        <div className="page-content">
          {loading && (
            <div className="loading-indicator-new">
              <div className="spinner-sm"></div>
              <span>Syncing platform database...</span>
            </div>
          )}

          {/* SECTION: Overview */}
          {activeSection === 'overview' && stats && (
            <section className="section active">
              <div className="page-header">
                <h2>Dashboard Overview</h2>
                <p>Platform-wide statistics and activity</p>
              </div>

              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon-wrapper-new blue">
                    <Stethoscope size={20} />
                  </div>
                  <div>
                    <div className="stat-value">{stats.totalDoctors}</div>
                    <div className="stat-label">Approved Doctors</div>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon-wrapper-new amber">
                    <Clock size={20} />
                  </div>
                  <div>
                    <div className="stat-value">{stats.pendingDoctors}</div>
                    <div className="stat-label">Pending Approvals</div>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon-wrapper-new green">
                    <Users size={20} />
                  </div>
                  <div>
                    <div className="stat-value">{stats.totalPatients}</div>
                    <div className="stat-label">Total Patients</div>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon-wrapper-new primary">
                    <FileText size={20} />
                  </div>
                  <div>
                    <div className="stat-value">{stats.totalReports}</div>
                    <div className="stat-label">Total Reports</div>
                  </div>
                </div>
              </div>

              <div className="dashboard-double-column-new">
                <div className="card">
                  <div className="card-header">
                    <span className="card-title">Report Status Overview</span>
                  </div>
                  <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div className="report-status-item-new">
                      <div className="status-meta">
                        <div className="status-indicator warning"></div>
                        <span>Pending Doctor Assignment</span>
                      </div>
                      <strong className="status-count warning">{stats.pendingReports}</strong>
                    </div>
                    <div className="report-status-item-new">
                      <div className="status-meta">
                        <div className="status-indicator primary"></div>
                        <span>Assigned to Doctor</span>
                      </div>
                      <strong className="status-count primary">{stats.assignedReports}</strong>
                    </div>
                    <div className="report-status-item-new">
                      <div className="status-meta">
                        <div className="status-indicator success"></div>
                        <span>Reviewed Reports</span>
                      </div>
                      <strong className="status-count success">{stats.reviewedReports}</strong>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <div className="card-header">
                    <span className="card-title">Top Cities by Doctors</span>
                  </div>
                  <div className="card-body">
                    {stats.cityDistribution && stats.cityDistribution.length > 0 ? (
                      <div className="city-list-new">
                        {stats.cityDistribution.map((item) => (
                          <div key={item._id} className="city-row-new">
                            <div className="city-name-wrapper">
                              <MapPin size={14} className="city-pin-icon-new" />
                              <span className="city-name">{item._id}</span>
                            </div>
                            <span className="city-count-badge">{item.count} doctor{item.count !== 1 && 's'}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="empty-state-card-new">
                        <MapPin size={24} className="text-muted" style={{ marginBottom: '8px' }} />
                        <p>No distribution data available</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* SECTION: Pending Doctors */}
          {activeSection === 'pending' && (
            <section className="section active">
              <div className="page-header">
                <h2>Pending Doctor Approvals</h2>
                <p>Review and verify doctor credentials and license details</p>
              </div>

              {pendingDoctors.length === 0 ? (
                <div className="empty-state-new">
                  <div className="empty-icon-wrapper-new warning">
                    <Clock size={32} />
                  </div>
                  <h3>No pending registrations</h3>
                  <p>All submitted doctor registration profiles have been processed.</p>
                </div>
              ) : (
                <div className="card">
                  <div className="table-wrapper">
                    <table>
                      <thead>
                        <tr>
                          <th>Doctor</th>
                          <th>Specialization</th>
                          <th>Clinic Details</th>
                          <th>License Number</th>
                          <th>Unassigned City Scans</th>
                          <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pendingDoctors.map((doc) => (
                          <tr key={doc._id}>
                            <td>
                              <div className="td-bold-name">Dr. {doc.name}</div>
                              <div className="td-sub-city">City: {doc.city}</div>
                            </td>
                            <td>{doc.doctorDetails?.specialization}</td>
                            <td>{doc.doctorDetails?.clinicName}</td>
                            <td>
                              <span className="license-badge-flat">{doc.doctorDetails?.licenseNumber}</span>
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <span className="unassigned-scans-badge">{doc.pendingReportsInCity}</span>
                            </td>
                            <td>
                              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                <button type="button" className="btn btn-success btn-sm" onClick={() => handleApprove(doc._id)}>
                                  <Check size={14} /> Approve
                                </button>
                                <button type="button" className="btn btn-outline btn-sm btn-danger-hover" onClick={() => handleReject(doc._id)}>
                                  <X size={14} /> Reject
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

          {/* SECTION: Approved Doctors */}
          {activeSection === 'approved' && (
            <section className="section active">
              <div className="page-header">
                <h2>Approved Doctors</h2>
                <p>All verified and active doctors on the platform</p>
              </div>

              <div className="filter-bar-new">
                <div className="search-input-wrapper-new">
                  <Search size={16} className="search-icon-new" />
                  <input 
                    type="text" 
                    className="form-control-new" 
                    placeholder="Search by name, city, or specialization..." 
                    value={doctorSearch}
                    onChange={(e) => setDoctorSearch(e.target.value)}
                  />
                </div>
              </div>

              <div className="card">
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>Doctor</th>
                        <th>City</th>
                        <th>Specialization</th>
                        <th>Assigned Scans</th>
                        <th>License</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredDoctors.length === 0 ? (
                        <tr>
                          <td colSpan="6" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                            No approved doctors found matching criteria.
                          </td>
                        </tr>
                      ) : (
                        filteredDoctors.map((doc) => (
                          <tr key={doc._id}>
                            <td 
                              style={{ cursor: 'pointer', color: 'var(--primary)', fontWeight: '600' }}
                              onClick={() => setSelectedDoctor(doc)}
                            >
                              Dr. {doc.name}
                            </td>
                            <td style={{ textTransform: 'capitalize' }}>{doc.city}</td>
                            <td>{doc.doctorDetails?.specialization}</td>
                            <td style={{ textAlign: 'center', fontWeight: '600' }}>{doc.assignedReportsCount || 0}</td>
                            <td>
                              <span className="license-badge-flat">{doc.doctorDetails?.licenseNumber}</span>
                            </td>
                            <td>
                              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                <button type="button" className="btn btn-ghost btn-sm btn-danger-hover" onClick={() => handleSuspend(doc._id)}>
                                  <AlertCircle size={14} /> Suspend
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
            </section>
          )}

          {/* SECTION: All Reports */}
          {activeSection === 'reports' && (
            <section className="section active">
              <div className="page-header">
                <h2>All Reports</h2>
                <p>AI scans and diagnostics sheets from all registered patients</p>
              </div>

              <div className="filter-bar-new">
                <div className="select-wrapper-new">
                  <FileText size={16} className="select-icon-new" />
                  <select 
                    className="form-control-new select-control" 
                    value={reportStatusFilter} 
                    onChange={(e) => setReportStatusFilter(e.target.value)}
                  >
                    <option value="">All Statuses</option>
                    <option value="no_issue">No Issue</option>
                    <option value="assigned">Assigned</option>
                    <option value="pending_no_doctor">Pending (No Doctor)</option>
                    <option value="reviewed">Reviewed</option>
                  </select>
                </div>
              </div>

              <div className="card">
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>Patient</th>
                        <th>Patient City</th>
                        <th>Doctor</th>
                        <th>Doctor City</th>
                        <th>AI Findings</th>
                        <th>Location Match</th>
                        <th>Status</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reports.length === 0 ? (
                        <tr>
                          <td colSpan="8" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                            No diagnostics reports found.
                          </td>
                        </tr>
                      ) : (
                        reports.map((rep) => (
                          <tr key={rep._id}>
                            <td style={{ fontWeight: '600', color: 'var(--text)' }}>{rep.patientName}</td>
                            <td style={{ textTransform: 'capitalize' }}>{rep.patientCity}</td>
                            <td>{rep.doctorName ? `Dr. ${rep.doctorName}` : '—'}</td>
                            <td style={{ textTransform: 'capitalize' }}>{rep.doctorCity || '—'}</td>
                            <td>
                              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                                {rep.aiFindings?.conditions?.join(', ') || 'No issues found'}
                              </span>
                            </td>
                            <td>
                              <span className={`badge badge-${rep.locationMatched ? 'green' : 'amber'}`}>
                                {rep.locationMatched ? 'Matched' : 'Unassigned/Mismatch'}
                              </span>
                            </td>
                            <td>
                              <span className={`badge badge-${rep.status === 'reviewed' ? 'green' : rep.status === 'assigned' ? 'blue' : 'amber'}`}>
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
            </section>
          )}

        </div>
      </main>

      {/* Doctor Detail Modal */}
      {selectedDoctor && (
        <div className="modal-overlay open" onClick={() => setSelectedDoctor(null)}>
          <div className="modal" style={{ maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Doctor Profile Details</span>
              <button className="modal-close" onClick={() => setSelectedDoctor(null)}>
                <X size={16} />
              </button>
            </div>
            <div className="modal-body">
              <h3 style={{ color: 'var(--primary)', marginBottom: '16px', fontSize: '18px', fontWeight: '700' }}>Dr. {selectedDoctor.name}</h3>
              <div className="modal-profile-info-new">
                <p><strong>Email:</strong> {selectedDoctor.email}</p>
                <p><strong>Phone:</strong> {selectedDoctor.phone || '—'}</p>
                <p><strong>City:</strong> <span style={{ textTransform: 'capitalize' }}>{selectedDoctor.city}</span></p>
                <p><strong>Specialization:</strong> {selectedDoctor.doctorDetails?.specialization}</p>
                <p><strong>Experience:</strong> {selectedDoctor.doctorDetails?.experienceYears} years</p>
                <p><strong>Clinic Name:</strong> {selectedDoctor.doctorDetails?.clinicName}</p>
                <p><strong>Clinic Address:</strong> {selectedDoctor.doctorDetails?.clinicAddress}</p>
                <p><strong>License Number:</strong> {selectedDoctor.doctorDetails?.licenseNumber}</p>
                <p><strong>Status:</strong> {selectedDoctor.isApproved ? 'Approved & Active' : 'Pending Verification'}</p>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setSelectedDoctor(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
