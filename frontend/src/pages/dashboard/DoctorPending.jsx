import React from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { 
  CheckCircle2, 
  Clock, 
  User, 
  FileText, 
  Check, 
  HelpCircle, 
  LogOut, 
  Home, 
  ArrowRight,
  ShieldAlert
} from 'lucide-react';

export default function DoctorPending() {
  const logout = useAuthStore((state) => state.logout);

  return (
    <div className="pending-container" style={{ maxWidth: '600px', margin: '50px auto', padding: '24px' }}>
      {/* Top Logo Section */}
      <div className="pending-logo-section" style={{ textAlign: 'center', marginBottom: '32px' }}>
        <div style={{ marginBottom: '16px' }}>
          <img src="/logo.png" alt="AI Dental Care Logo" style={{ height: '80px', width: 'auto', objectFit: 'contain' }} />
        </div>
        <h1 className="pending-title" style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', margin: '0 0 8px 0', letterSpacing: '-0.02em' }}>
          Doctor Registration Submitted
        </h1>
        <p className="pending-subtitle" style={{ fontSize: '14px', color: '#64748b', margin: 0, lineHeight: 1.5 }}>
          Your credentials are created successfully and are currently undergoing verification.
        </p>
      </div>

      {/* Status Card */}
      <div className="card" style={{ textAlign: 'center', padding: '36px 32px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
          <div className="empty-icon-wrapper-new warning" style={{ width: '56px', height: '56px' }}>
            <Clock size={28} />
          </div>
        </div>
        <div className="status-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: '#fffbeb', color: '#d97706', fontSize: '12px', fontWeight: '700', padding: '6px 16px', borderRadius: '99px', textTransform: 'uppercase', letterSpacing: '0.05em', border: '1px solid rgba(245, 158, 11, 0.15)', marginBottom: '16px' }}>
          Pending Verification
        </div>
        <p style={{ textAlign: 'center', fontSize: '14px', color: '#475569', lineHeight: 1.6, margin: 0 }}>
          Our administrative panel team is currently reviewing your submitted clinic details and licensing credentials. 
          This verification process usually takes between <strong>24 and 48 hours</strong>. 
          You will receive an email notification once your profile is verified and approved.
        </p>
      </div>

      {/* Verification Steps Timeline */}
      <div className="card" style={{ padding: '32px', marginBottom: '24px' }}>
        <h4 style={{ fontSize: '12px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '20px', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
          Verification Steps Timeline
        </h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '26px', height: '26px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center', flexShrink: 0, backgroundColor: '#ecfdf5', color: '#059669', border: '1px solid rgba(16, 185, 129, 0.15)' }}>
              <Check size={14} strokeWidth={3} />
            </div>
            <span style={{ fontSize: '14px', fontWeight: '600', color: '#334155' }}>Registration Completed</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '26px', height: '26px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center', flexShrink: 0, backgroundColor: '#ecfdf5', color: '#059669', border: '1px solid rgba(16, 185, 129, 0.15)' }}>
              <Check size={14} strokeWidth={3} />
            </div>
            <span style={{ fontSize: '14px', fontWeight: '600', color: '#334155' }}>Documents & Clinic Details Submitted</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '26px', height: '26px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center', flexShrink: 0, backgroundColor: '#fffbeb', color: '#d97706', border: '1px solid rgba(245, 158, 11, 0.15)' }}>
              <Clock size={14} />
            </div>
            <span style={{ fontSize: '14px', fontWeight: '600', color: '#334155' }}>Admin Panel Credentials Check</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '26px', height: '26px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center', flexShrink: 0, backgroundColor: '#f8fafc', color: '#94a3b8', border: '1px dashed #cbd5e1' }}>
              <span style={{ fontSize: '11px', fontWeight: '700' }}>4</span>
            </div>
            <span style={{ fontSize: '14px', color: '#94a3b8', fontWeight: '500' }}>Account Activated & Verified</span>
          </div>
        </div>
      </div>

      {/* What Happens Next Section */}
      <div className="card" style={{ padding: '32px', marginBottom: '24px' }}>
        <h4 style={{ fontSize: '12px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '20px', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
          What Happens Next?
        </h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', backgroundColor: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
            <div style={{ color: '#2563eb', flexShrink: 0, marginTop: '2px' }}>
              <User size={16} />
            </div>
            <div>
              <h5 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: 700, color: '#1e293b' }}>Profile Review</h5>
              <p style={{ margin: 0, fontSize: '13px', color: '#64748b', lineHeight: 1.5 }}>We review your specialization, experience years, and clinical address details.</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', backgroundColor: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
            <div style={{ color: '#2563eb', flexShrink: 0, marginTop: '2px' }}>
              <FileText size={16} />
            </div>
            <div>
              <h5 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: 700, color: '#1e293b' }}>License Credentials Check</h5>
              <p style={{ margin: 0, fontSize: '13px', color: '#64748b', lineHeight: 1.5 }}>Your licensing registry credentials will be verified against authorized medical databases.</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', backgroundColor: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
            <div style={{ color: '#2563eb', flexShrink: 0, marginTop: '2px' }}>
              <CheckCircle2 size={16} />
            </div>
            <div>
              <h5 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: 700, color: '#1e293b' }}>Final Approval Email</h5>
              <p style={{ margin: 0, fontSize: '13px', color: '#64748b', lineHeight: 1.5 }}>Upon verification, your profile status activates, and scans from your city will instantly appear in your portal.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Reminders Card */}
      <div className="card" style={{ padding: '32px', marginBottom: '24px' }}>
        <h4 style={{ fontSize: '12px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '20px', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
          Reminders &amp; Guidelines
        </h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '13px', color: '#475569' }}>
            <span style={{ color: '#2563eb', fontWeight: 'bold' }}>&bull;</span>
            <span>Please keep your registered email inbox active to receive status updates.</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '13px', color: '#475569' }}>
            <span style={{ color: '#2563eb', fontWeight: 'bold' }}>&bull;</span>
            <span>Do not submit duplicate registration requests as it resets the verification queue.</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '13px', color: '#475569' }}>
            <span style={{ color: '#2563eb', fontWeight: 'bold' }}>&bull;</span>
            <span>You can safely close this browser page. The verification runs independently in the background.</span>
          </div>
        </div>
      </div>

      {/* Help & Support */}
      <div className="card" style={{ backgroundColor: '#f8fafc', borderStyle: 'dashed', textAlign: 'center', padding: '32px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
          <HelpCircle size={24} className="text-secondary" />
        </div>
        <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '700' }}>Need Assistance?</h4>
        <p style={{ margin: '0 0 20px 0', fontSize: '13px', color: '#64748b', lineHeight: 1.5 }}>
          If your verification takes longer than 48 hours or you need to update credentials, please contact support.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
          <a href="mailto:support@aidentalcare.com" className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            Contact Support
          </a>
          <button onClick={logout} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <LogOut size={14} style={{ marginRight: '6px' }} /> Sign Out &amp; Return to Login
          </button>
          <Link to="/" className="btn btn-ghost" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Home size={14} style={{ marginRight: '6px' }} /> Return to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
