import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../../store/useAuthStore';
import { 
  Shield, 
  Activity, 
  MapPin, 
  ClipboardList, 
  CheckCircle, 
  Zap, 
  Star, 
  ArrowRight,
  Sparkles,
  Users,
  Upload,
  Cpu,
  Calendar,
  Check,
  Menu,
  X
} from 'lucide-react';

export default function LandingPage() {
  const { user, logout } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const getDashboardPath = () => {
    if (!user) return '/login';
    if (user.role === 'admin') return '/admin-dashboard';
    if (user.role === 'doctor') return user.isApproved ? '/doctor-dashboard' : '/doctor-pending';
    return '/patient-dashboard';
  };

  const closeMobileMenu = () => setMobileMenuOpen(false);

  // Framer Motion animation variants
  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  return (
    <div className="landing" id="home">

      {/* Sticky Navbar */}
      <nav className="landing-nav">
        <a href="#home" className="landing-logo">
          <img src="/logo.png" alt="AI Dental Care Logo" className="landing-logo-img" />
          <span className="landing-logo-text">AI Dental Care</span>
        </a>
        <div className="landing-nav-links">
          <a href="#home" className="landing-nav-link">Home</a>
          <a href="#about" className="landing-nav-link">About</a>
          <a href="#services" className="landing-nav-link">Services</a>
          <a href="#how-it-works" className="landing-nav-link">How It Works</a>
          <a href="#testimonials" className="landing-nav-link">Testimonials</a>
        </div>
        <div className="landing-nav-actions">
          {user ? (
            <>
              <Link to={getDashboardPath()} className="btn btn-primary btn-sm">Dashboard</Link>
              <button onClick={logout} className="btn btn-ghost btn-sm" style={{ marginLeft: '8px' }}>Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost btn-sm">Log In</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Get Started</Link>
            </>
          )}
        </div>
        {/* Mobile Hamburger Toggle */}
        <button 
          className="landing-mobile-toggle" 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {/* Mobile Drawer Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div 
              className="landing-mobile-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeMobileMenu}
            />
            <motion.div 
              className="landing-mobile-menu"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              <a href="#home" className="landing-mobile-link" onClick={closeMobileMenu}>Home</a>
              <a href="#about" className="landing-mobile-link" onClick={closeMobileMenu}>About</a>
              <a href="#services" className="landing-mobile-link" onClick={closeMobileMenu}>Services</a>
              <a href="#how-it-works" className="landing-mobile-link" onClick={closeMobileMenu}>How It Works</a>
              <a href="#testimonials" className="landing-mobile-link" onClick={closeMobileMenu}>Testimonials</a>
              <div className="landing-mobile-actions">
                {user ? (
                  <>
                    <Link to={getDashboardPath()} className="btn btn-primary btn-full" onClick={closeMobileMenu}>Dashboard</Link>
                    <button onClick={() => { logout(); closeMobileMenu(); }} className="btn btn-ghost btn-full">Logout</button>
                  </>
                ) : (
                  <>
                    <Link to="/login" className="btn btn-ghost btn-full" onClick={closeMobileMenu}>Log In</Link>
                    <Link to="/register" className="btn btn-primary btn-full" onClick={closeMobileMenu}>Get Started</Link>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <section className="hero">
        <motion.div 
          className="hero-text"
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
        >

          <h1>AI-Powered Dental Care <br />For a <span>Healthier Smile</span></h1>
          <p>
            Experience the future of dentistry. Upload a photo of your teeth, receive instant automated AI findings, and get connected with verified same-city dental clinics for professional consultation and treatment plans.
          </p>
          <div className="hero-actions">
            {user ? (
              <Link to={getDashboardPath()} className="btn btn-primary btn-lg">
                Go to Dashboard <ArrowRight size={18} />
              </Link>
            ) : (
              <Link to="/register" className="btn btn-primary btn-lg">
                Get Started <ArrowRight size={18} />
              </Link>
            )}
            <a href="#about" className="btn btn-outline btn-lg">Learn More</a>
          </div>
        </motion.div>

        <div className="hero-visual-container">
          <motion.div 
            className="hero-illustration-wrapper"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <img 
              src="/dentist_illustration.png" 
              alt="AI Dental Care Illustration" 
              className="hero-illustration" 
            />
          </motion.div>
        </div>
      </section>


      {/* Services Section */}
      <section className="services-section-new" id="services">
        <div className="section-title">
          <h2>Why AI Dental Care</h2>
          <p>Built for accurate, local, in-person care</p>
        </div>
        <motion.div 
          className="services-grid-new"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
        >
          <motion.div className="service-card-new" variants={fadeInUp}>
            <div className="service-icon-wrapper">
              <Activity size={24} />
            </div>
            <h3>AI Image Detection</h3>
            <p>Powered by advanced image analysis to detect dental issues like cavities, plaque, and gingivitis with high accuracy and confidence scores.</p>
          </motion.div>

          <motion.div className="service-card-new" variants={fadeInUp}>
            <div className="service-icon-wrapper">
              <MapPin size={24} />
            </div>
            <h3>Same-City Matching</h3>
            <p>Reports are matched exclusively to verified dentists in your exact city, ensuring seamless transitions to in-person clinic visits.</p>
          </motion.div>

          <motion.div className="service-card-new" variants={fadeInUp}>
            <div className="service-icon-wrapper">
              <Shield size={24} />
            </div>
            <h3>Verified Doctors Only</h3>
            <p>Every dentist on our platform undergoes strict manual review and credential verification before receiving client diagnostics.</p>
          </motion.div>

          <motion.div className="service-card-new" variants={fadeInUp}>
            <div className="service-icon-wrapper">
              <ClipboardList size={24} />
            </div>
            <h3>Detailed Reports</h3>
            <p>Receive comprehensive, easy-to-read reports detailing detected conditions, severity indicators, and clear dentist advice.</p>
          </motion.div>

          <motion.div className="service-card-new" variants={fadeInUp}>
            <div className="service-icon-wrapper">
              <Zap size={24} />
            </div>
            <h3>Auto-Assignment</h3>
            <p>Get automatically assigned to certified local dental specialists as soon as your analysis is processed with zero lag.</p>
          </motion.div>

          <motion.div className="service-card-new" variants={fadeInUp}>
            <div className="service-icon-wrapper">
              <Shield size={24} />
            </div>
            <h3>Secure & Private</h3>
            <p>Your dental records, photos, and personal information are stored securely and only shared with your assigned doctor.</p>
          </motion.div>
        </motion.div>
      </section>

      {/* How It Works Section */}
      <section className="steps-section-new" id="how-it-works">
        <div className="section-title">
          <h2>How It Works</h2>
          <p>Three simple steps to better dental health</p>
        </div>
        
        <div className="timeline-container">
          <div className="timeline-line"></div>
          
          <motion.div 
            className="timeline-item timeline-left"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
          >
            <div className="timeline-badge">01</div>
            <div className="timeline-content">
              <div className="step-icon-wrapper">
                <Upload size={22} />
              </div>
              <h3>Upload Your Image</h3>
              <p>Take a clear photo of your teeth using your smartphone or camera and upload it securely to our web application.</p>
            </div>
          </motion.div>

          <motion.div 
            className="timeline-item timeline-right"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
          >
            <div className="timeline-badge">02</div>
            <div className="timeline-content">
              <div className="step-icon-wrapper">
                <Cpu size={22} />
              </div>
              <h3>AI Analyzes Instantly</h3>
              <p>Our deep learning dental model scans for cavities, tartar, gingivitis, and other structural dental conditions in seconds.</p>
            </div>
          </motion.div>

          <motion.div 
            className="timeline-item timeline-left"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
          >
            <div className="timeline-badge">03</div>
            <div className="timeline-content">
              <div className="step-icon-wrapper">
                <Calendar size={22} />
              </div>
              <h3>Meet Your Local Dentist</h3>
              <p>Review your AI diagnostic sheet. The report is instantly shared with a verified same-city clinic to book your final checkup.</p>
            </div>
          </motion.div>
        </div>
      </section>



      {/* Redesigned Footer */}
      <footer className="landing-footer">
        <div className="landing-footer-grid">
          <div className="footer-brand">
            <div className="footer-logo-container">
              <img src="/logo.png" alt="AI Dental Care Logo" className="footer-logo-img" />
              <h4>AI Dental Care</h4>
            </div>
            <p>Smart dental diagnostics powered by artificial intelligence. Book in-clinic appointments with verified professionals in your city.</p>
          </div>
          <div className="footer-links">
            <h5>Navigation</h5>
            <ul>
              <li><a href="#home">Home</a></li>
              <li><a href="#about">About</a></li>
              <li><a href="#services">Services</a></li>
              <li><a href="#how-it-works">How It Works</a></li>
            </ul>
          </div>
          <div className="footer-links">
            <h5>Legal</h5>
            <ul>
              <li><a href="#privacy">Privacy Policy</a></li>
              <li><a href="#terms">Terms of Service</a></li>
              <li><a href="#disclaimer">Medical Disclaimer</a></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <p>AI Dental Care &mdash; AI-Powered Dental Health Platform &copy; {new Date().getFullYear()}. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
