import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { doctorService } from '../../services/api/doctorService';
import { Check, Home } from 'lucide-react';

export default function DoctorPending() {
  const { user } = useAuthStore();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await doctorService.getProfile();
        if (data?.doctor) {
          setProfile(data.doctor);
        }
      } catch (err) {
        console.error('Failed to load profile details:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const submissionDate = profile?.createdAt || user?.createdAt || Date.now();
  const formattedDate = new Date(submissionDate).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  if (loading) {
    return (
      <div className="pending-page-wrapper" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#f8fafc' }}>
        <div className="spinner" style={{ width: '40px', height: '40px', border: '3px solid #e2e8f0', borderTopColor: '#2563eb', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        <p style={{ marginTop: '16px', color: '#64748b', fontWeight: '500', fontSize: '14px' }}>Loading verification status...</p>
      </div>
    );
  }

  return (
    <div className="pending-page-wrapper">
      <div className="pending-main-card">
        {/* Header Title */}
        <h1 className="pending-card-title">Registration Pending Verification</h1>

        {/* Status Box */}
        <div className="pending-status-box">
          <div className="pending-progress-circle">
            <div className="pending-progress-value">85%</div>
          </div>
          
          <div className="pending-status-details">
            <div className="pending-status-pill">STATUS: Pending Verification</div>
            <p className="pending-status-description">
              Your professional profile is currently being reviewed by our verification team.
            </p>
            <div className="pending-meta-grid">
              <div className="pending-meta-item">
                <span className="pending-meta-label">Application submitted:</span>
                <span className="pending-meta-value">{formattedDate}</span>
              </div>
              <div className="pending-meta-item">
                <span className="pending-meta-label">Estimated review:</span>
                <span className="pending-meta-value">2-3 business days</span>
              </div>
            </div>
          </div>
        </div>

        {/* Welcome Message */}
        <div className="pending-welcome-block">
          <h2 className="pending-welcome-title">
            Welcome, Dr. {profile?.name || user?.name || 'Sarah Johnson'}!
          </h2>
          <p className="pending-welcome-text">
            We are carefully reviewing your credentials (License ID: <strong style={{ color: '#0f172a' }}>{profile?.doctorDetails?.licenseNumber || 'CA98765'}</strong>, Specialization: <strong style={{ color: '#0f172a' }}>{profile?.specialization || 'General Dentistry'}</strong>). You will receive an email confirmation once the process is complete.
          </p>
        </div>

        {/* Timeline Progress */}
        <div className="pending-timeline-card">
          <h3 className="pending-timeline-title">Application Process Status</h3>
          
          <div className="pending-timeline-container">
            <div className="pending-timeline-line"></div>
            <div className="pending-timeline-steps">
              {/* Step 1 */}
              <div className="pending-timeline-step completed">
                <div className="pending-step-circle">
                  <Check size={14} strokeWidth={3} />
                </div>
                <div className="pending-step-label">Account Created</div>
                <div className="pending-step-subtext">{formattedDate}</div>
              </div>

              {/* Step 2 */}
              <div className="pending-timeline-step completed">
                <div className="pending-step-circle">
                  <Check size={14} strokeWidth={3} />
                </div>
                <div className="pending-step-label">Profile &amp; Documentation Submitted</div>
              </div>

              {/* Step 3 */}
              <div className="pending-timeline-step active">
                <div className="pending-step-circle">3</div>
                <div className="pending-step-label">Verification Team Review</div>
                <div className="pending-step-subtext orange">Current Step</div>
              </div>

              {/* Step 4 */}
              <div className="pending-timeline-step">
                <div className="pending-step-circle">4</div>
                <div className="pending-step-label">Background Check &amp; License Approval</div>
              </div>

              {/* Step 5 */}
              <div className="pending-timeline-step">
                <div className="pending-step-circle">5</div>
                <div className="pending-step-label">Onboarding &amp; Access</div>
              </div>
            </div>
          </div>
        </div>

        {/* Button Wrapper */}
        <div className="pending-actions-wrapper">
          <Link to="/" className="pending-home-btn">
            <Home size={16} />
            <span>Return to Home Page</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
