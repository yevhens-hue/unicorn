import React, { useState } from 'react';
import { Search, Star, CheckCircle, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import PhoneInput from './components/PhoneInput';
import './B2CFunnel.css';

const API = import.meta.env.VITE_API_URL || 'https://unicorn-pro-api-backend.vercel.app';

const VERTICALS = [
  { id: 'HVAC', label: 'HVAC' },
  { id: 'Roofing', label: 'Roofing' },
  { id: 'Windows', label: 'Windows' },
  { id: 'Solar', label: 'Solar' },
];

const SERVICES = {
  HVAC: ['AC Repair', 'Heating Install', 'Maintenance', 'Heat Pump'],
  Roofing: ['Roof Repair', 'Full Replace', 'Inspection', 'Gutters'],
  Windows: ['Replacement', 'Repair', 'Sealing', 'New Install'],
  Solar: ['Panel Install', 'Repair', 'Battery Storage', 'Inspection'],
};

const pageVariants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
};

export default function B2CFunnel() {
  const [step, setStep] = useState(0); 
  const [loading, setLoading] = useState(false);
  const [winners, setWinners] = useState([]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchError, setSearchError] = useState('');

  
  const [formData, setFormData] = useState({
    zipCode: '',
    vertical: '',
    serviceType: '',
    timeframe: '',
    propertyType: 'Residential',
    isOwner: true,
    urgency: '',
    name: '',
    phone: '',
    email: '',
    tcpa: false,
    appointmentDate: '',
    appointmentTime: '',
    leadType: 'CPL'
  });

  const update = (fields) => setFormData(f => ({ ...f, ...fields }));

  const handleSearchSubmit = () => {
    setSearchError('');
    if (!searchQuery.trim()) return;

    const q = searchQuery.toLowerCase();
    
    // 1. Keyword mapping
    const keywords = {
      HVAC: ['air', 'ac ', 'ac', 'heating', 'cooling', 'furnace', 'hvac', 'vent', 'duct', 'thermostat', 'pump'],
      Roofing: ['roof', 'shingle', 'gutter', 'leak', 'tile'],
      Windows: ['window', 'glass', 'pane'],
      Solar: ['solar', 'panel', 'energy']
    };

    let matchedVertical = null;
    let matchedService = '';

    for (const [vert, words] of Object.entries(keywords)) {
      if (words.some(w => q.includes(w))) {
        matchedVertical = vert;
        break;
      }
    }

    if (!matchedVertical) {
      setSearchError("We couldn't match your request. Please select a popular category below.");
      return;
    }

    // 2. Try to exact-match a sub-service so we can skip Step 2
    const servicesForVertical = SERVICES[matchedVertical] || [];
    const exactMatch = servicesForVertical.find(s => q.includes(s.toLowerCase()));
    if (exactMatch) {
      matchedService = exactMatch;
    }

    update({ vertical: matchedVertical, serviceType: matchedService });
    setStep(1); // Go to ZIP step
  };

  const handlePopularClick = (vertical) => {
    update({ vertical, serviceType: '' });
    setStep(1);
  };

  const handleSubmit = async (overrideData = {}) => {
    setLoading(true);
    const finalData = { ...formData, ...overrideData };
    const apiPayload = {
      vertical: finalData.vertical,
      serviceType: finalData.serviceType,
      zipCode: finalData.zipCode,
      propertyType: finalData.propertyType,
      isOwner: finalData.isOwner,
      urgency: finalData.timeframe === 'ASAP' ? 'Emergency' : finalData.timeframe,
      timeframe: finalData.timeframe,
      projectScope: 'New Install/Replace',
      name: finalData.name,
      phone: finalData.phone,
      email: finalData.email,
      tcpa: finalData.tcpa,
      leadType: finalData.leadType || 'CPL',
      appointmentDate: finalData.appointmentDate || null,
      appointmentTime: finalData.appointmentTime || null,
      appointmentStatus: finalData.appointmentDate ? 'Confirmed' : 'Pending'
    };

    try {
      const res = await fetch(`${API}/api/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apiPayload),
      });
      const data = await res.json();
      
      if (!res.ok) {
        alert(`Request failed: ${data.error || 'Unknown error'}`);
        return;
      }
      
      setWinners(data.winners || []);
      setStep(7); // Thank You Step
    } catch (err) {
      console.error(err);
      alert('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  const Header = () => (
    <header className="b2c-header">
      <div 
        className="header-logo" 
        onClick={() => setStep(0)} 
        style={{ cursor: 'pointer' }}
      >
        <span className="logo-icon">🦄</span>
        Unicorn Pro
      </div>
      <nav className="header-nav">
        <a 
          href="#services" 
          onClick={(e) => { 
            e.preventDefault(); 
            setStep(0); 
            setTimeout(() => {
              document.querySelector('.popular-tags')?.scrollIntoView({ behavior: 'smooth' });
            }, 50);
          }}
        >
          Services
        </a>
        <a 
          href="#how-it-works" 
          onClick={(e) => { 
            e.preventDefault(); 
            setStep(0); 
            setTimeout(() => {
              document.querySelector('.how-it-works-section')?.scrollIntoView({ behavior: 'smooth' });
            }, 50);
          }}
        >
          How it Works
        </a>
        <a 
          href="https://unicorn-b2b.vercel.app/" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="login-link"
        >
          Contractor Login
        </a>
      </nav>
    </header>
  );

  // ----------------------------------------------------
  // HERO PAGE (Step 0) - Matches Screenshot EXACTLY
  // ----------------------------------------------------
  if (step === 0) {
    return (
      <>
      <Header />
      <div className="hero-page-wrapper">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="hero-section-new">
          
          <div className="social-avatars-row">
            <div className="avatar-group">
              <img src="https://i.pravatar.cc/100?img=11" alt="user" className="hero-avatar" />
              <img src="https://i.pravatar.cc/100?img=12" alt="user" className="hero-avatar" />
              <img src="https://i.pravatar.cc/100?img=13" alt="user" className="hero-avatar" />
            </div>
            <span className="social-text-new">Join 10+ million homeowners finding trusted pros</span>
          </div>

          <h1 className="hero-title-new">What project do you need help with?</h1>
          <p className="hero-sub-new">Get free estimates from highly-rated local professionals.</p>

          <div className="hero-search-card">
            <div className="search-input-wrapper">
              <Search className="search-icon-new" size={24} />
              <input
                type="text"
                className="search-input-new"
                placeholder="e.g. Roof Replacement, HVAC Repair, Solar..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit()}
              />
              <button className="btn-find-pros" onClick={handleSearchSubmit}>
                Find Pros
              </button>
            </div>
            {searchError && <div className="search-error-msg">{searchError}</div>}
            
            <div className="popular-tags">
              <span className="popular-label">Popular:</span>
              {VERTICALS.map(v => (
                <button key={v.id} className="tag-btn" onClick={() => handlePopularClick(v.id)}>
                  {v.label}
                </button>
              ))}
            </div>
          </div>

          <div className="trust-badges-new">
            <div className="trust-badge-item">
              <ShieldCheck size={20} className="badge-icon green-icon" />
              <span>100% Vetted Contractors</span>
            </div>
            <div className="trust-badge-item">
              <Star size={20} className="badge-icon yellow-icon" />
              <span>Verified Reviews</span>
            </div>
            <div className="trust-badge-item">
              <CheckCircle size={20} className="badge-icon blue-icon" />
              <span>Free, No-Obligation Quotes</span>
            </div>
          </div>
        </motion.div>
      </div>
      
      {/* HOW IT WORKS SECTION */}
      <div className="how-it-works-section">
        <h2>How It Works</h2>
        <div className="hiw-grid">
          <div className="hiw-step">
            <div className="hiw-icon">1</div>
            <h3>Tell us what you need</h3>
            <p>Answer a few quick questions about your project so we can match you with the right professionals.</p>
          </div>
          <div className="hiw-step">
            <div className="hiw-icon">2</div>
            <h3>Get matched instantly</h3>
            <p>We'll connect you with highly-rated, vetted contractors in your local area who are ready to help.</p>
          </div>
          <div className="hiw-step">
            <div className="hiw-icon">3</div>
            <h3>Compare & Hire</h3>
            <p>Receive free, no-obligation quotes. Compare prices, read reviews, and hire the best pro for the job.</p>
          </div>
        </div>
      </div>

      {/* WHY CHOOSE US / TRUST SECTION */}
      <div className="trust-section-expanded">
        <div className="trust-content">
          <h2>Why homeowners trust us</h2>
          <div className="trust-features">
            <div className="trust-feature">
              <ShieldCheck size={32} className="green-icon" />
              <div>
                <h4>Pre-screened Professionals</h4>
                <p>Every contractor goes through a rigorous background check and licensing verification.</p>
              </div>
            </div>
            <div className="trust-feature">
              <Star size={32} className="yellow-icon" />
              <div>
                <h4>Authentic Reviews</h4>
                <p>Read real feedback from homeowners just like you before making a decision.</p>
              </div>
            </div>
            <div className="trust-feature">
              <CheckCircle size={32} className="blue-icon" />
              <div>
                <h4>100% Free Service</h4>
                <p>Using our platform to find and compare quotes is completely free with zero hidden fees.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* TESTIMONIALS SECTION */}
      <div className="testimonials-section">
        <h2>Success Stories</h2>
        <div className="testimonials-grid">
          <div className="testimonial-card">
            <div className="stars">{[1,2,3,4,5].map(s => <Star key={s} fill="#f59e0b" color="#f59e0b" size={16}/>)}</div>
            <p>"I needed my roof replaced urgently after a storm. Found 3 amazing local roofers within minutes and saved $2,000 on the final quote!"</p>
            <div className="testimonial-author">
              <img src="https://i.pravatar.cc/150?img=47" alt="Sarah T." />
              <div>
                <strong>Sarah T.</strong>
                <span>Roofing Project</span>
              </div>
            </div>
          </div>
          <div className="testimonial-card">
            <div className="stars">{[1,2,3,4,5].map(s => <Star key={s} fill="#f59e0b" color="#f59e0b" size={16}/>)}</div>
            <p>"Super easy to use. The HVAC technicians that reached out were all licensed and very professional. Highly recommend this service."</p>
            <div className="testimonial-author">
              <img src="https://i.pravatar.cc/150?img=33" alt="Mike R." />
              <div>
                <strong>Mike R.</strong>
                <span>HVAC Repair</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="b2c-footer">
        <div className="footer-content">
          <div className="footer-logo">Unicorn Pro</div>
          <div className="footer-links">
            <a href="#" onClick={(e) => { e.preventDefault(); alert('Unicorn Pro - Privacy Policy (v1.0)'); }}>Privacy Policy</a>
            <a href="#" onClick={(e) => { e.preventDefault(); alert('Unicorn Pro - Terms of Service'); }}>Terms of Service</a>
            <a href="#" onClick={(e) => { e.preventDefault(); alert('Contact us at support@unicornpro.com'); }}>Contact Us</a>
            <a href="https://unicorn-b2b.vercel.app/" target="_blank" rel="noopener noreferrer">Contractor Login</a>
          </div>
        </div>
        <div className="footer-bottom">
          &copy; {new Date().getFullYear()} Unicorn Pro. All rights reserved.
        </div>
      </footer>
      </>
    );
  }

  // ----------------------------------------------------
  // THANK YOU PAGE (Step 7)
  // ----------------------------------------------------
  if (step === 7) {
    return (
      <>
      <Header />
      <div className="wizard-container">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="thank-you-section wizard-card glass-card">
          <div className="success-icon-big">✅</div>
          <h2>You're All Set, {formData.name.split(' ')[0]}!</h2>

          {winners.length > 0 ? (
            <>
              <div className="urgency-badge fire">🔥 {winners.length} Pro{winners.length > 1 ? 's' : ''} matched — expect a call soon!</div>
              <p className="ty-sub">These top-rated contractors are reviewing your request right now:</p>
              <div className="winners-list">
                {winners.map((w, i) => (
                  <div key={i} className="winner-card glass-card">
                    <div className="winner-avatar">{w.companyName?.[0] || 'P'}</div>
                    <div className="winner-info">
                      <strong>{w.companyName || 'Local Pro'}</strong>
                      <div className="winner-stars">{[1,2,3,4,5].map(s => <Star key={s} fill="#f59e0b" color="#f59e0b" size={13}/>)}</div>
                      <span className="winner-status">⏱ Reviewing your request…</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="urgency-badge amber">⏳ Finding the best pros near ZIP {formData.zipCode}</div>
              <p className="ty-sub">Our team is manually matching your request. You'll hear back within 2 hours.</p>
            </>
          )}
          <button className="btn-secondary" onClick={() => window.location.reload()}>Start New Request</button>
        </motion.div>
      </div>
    );
  }

  // ----------------------------------------------------
  // WIZARD STEPS (Steps 1 to 5)
  // ----------------------------------------------------
  const totalWizardSteps = 5;
  const currentProgress = (step / totalWizardSteps) * 100;

  return (
    <>
    <Header />
    <div className="wizard-container">
      <div className="wizard-header">
        <div className="wizard-progress-bar">
          <div className="wizard-progress-fill" style={{ width: `${currentProgress}%` }}/>
        </div>
        <div className="wizard-progress-text">Step {step} of {totalWizardSteps}</div>
      </div>

      <div className="wizard-card glass-card">
        <AnimatePresence mode="wait">
          
          {/* STEP 1: ZIP Code */}
          {step === 1 && (
            <motion.div key="step1" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="wizard-step">
              <h2>Where is the project located?</h2>
              <p className="step-desc">Enter your ZIP code so we can find local {formData.vertical} pros.</p>
              <div className="form-stack">
                <div className="input-wrap">
                  <input
                    type="text"
                    placeholder="Enter ZIP Code"
                    value={formData.zipCode}
                    onChange={e => update({ zipCode: e.target.value.replace(/\D/g,'').slice(0,5) })}
                    className="zip-input-large text-center"
                    style={{ fontSize: '24px', letterSpacing: '4px' }}
                  />
                </div>
              </div>
              <button className="btn-primary btn-submit-huge mt-4" onClick={() => {
                if (formData.serviceType) {
                  setStep(3); // Skip Step 2 because we mapped a service exactly
                } else {
                  setStep(2);
                }
              }} disabled={formData.zipCode.length < 5}>
                Next Step
              </button>
              <button className="btn-back" onClick={() => setStep(0)}>← Back</button>
            </motion.div>
          )}

          {/* STEP 2: Service Type */}
          {step === 2 && (
            <motion.div key="step2" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="wizard-step">
              <h2>What specific {formData.vertical} service do you need?</h2>
              <div className="wizard-list mt-4">
                {(SERVICES[formData.vertical] || SERVICES.HVAC).map(s => (
                  <button key={s} className="wizard-list-btn" onClick={() => { update({ serviceType: s }); nextStep(); }}>
                    <span>{s}</span>
                  </button>
                ))}
              </div>
              <button className="btn-back" onClick={prevStep}>← Back</button>
            </motion.div>
          )}

          {/* STEP 3: Timeframe */}
          {step === 3 && (
            <motion.div key="step3" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="wizard-step">
              <h2>When do you need this done?</h2>
              <div className="wizard-grid-1col mt-4">
                {[
                  { id: 'ASAP', title: 'Immediately', desc: 'Emergency or urgent service needed' },
                  { id: 'This Week', title: 'Within 1 Week', desc: 'Ready to hire' },
                  { id: 'Flexible', title: 'Flexible / Planning', desc: 'Just getting estimates' },
                ].map(t => (
                  <button key={t.id} className="wizard-row-btn" onClick={() => { update({ timeframe: t.id }); nextStep(); }}>
                    <div className="row-btn-content">
                      <strong>{t.title}</strong>
                      <span>{t.desc}</span>
                    </div>
                  </button>
                ))}
              </div>
              <button className="btn-back" onClick={() => {
                if (formData.serviceType && step === 3 && SERVICES[formData.vertical]?.includes(formData.serviceType)) {
                  setStep(2); // take them to step 2 anyway so they can change the prepopulated service
                } else {
                  prevStep();
                }
              }}>← Back</button>
            </motion.div>
          )}

          {/* STEP 4: Property */}
          {step === 4 && (
            <motion.div key="step4" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="wizard-step">
              <h2>Do you own the property?</h2>
              <div className="wizard-grid mt-4">
                <button className={`wizard-option-btn ${formData.isOwner === true ? 'selected' : ''}`} onClick={() => { update({ isOwner: true }); nextStep(); }}>
                  <strong>Yes, I own it</strong>
                </button>
                <button className={`wizard-option-btn ${formData.isOwner === false ? 'selected' : ''}`} onClick={() => { update({ isOwner: false }); nextStep(); }}>
                  <strong>No, I rent</strong>
                </button>
              </div>
              <button className="btn-back" onClick={prevStep}>← Back</button>
            </motion.div>
          )}

          {/* STEP 5: Contact Info */}
          {step === 5 && (
            <motion.div key="step5" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="wizard-step contact-step">
              <h2>Final Step: Where should we send your quotes?</h2>
              <div className="form-stack mt-4">
                <div className="input-wrap">
                  <input type="text" placeholder="Full Name" value={formData.name} onChange={e => update({ name: e.target.value })}/>
                </div>
                <div className="input-wrap">
                  <PhoneInput value={formData.phone} onChange={val => update({ phone: val })}/>
                </div>
                <div className="input-wrap">
                  <input type="email" placeholder="Email Address" value={formData.email} onChange={e => update({ email: e.target.value })}/>
                </div>
              </div>

              <div className="tcpa-consent mt-4">
                <input type="checkbox" id="tcpa" checked={formData.tcpa} onChange={e => update({ tcpa: e.target.checked })}/>
                <label htmlFor="tcpa">
                  By clicking submit, I agree to be contacted at the number provided. I understand that consent is not a condition of purchase.
                </label>
              </div>

              <button
                className="btn-primary btn-submit-huge"
                onClick={() => setStep(6)}
                disabled={!formData.name || !formData.phone || !formData.email || !formData.tcpa}
              >
                Next: Reserve Free Estimate Slot 📅
              </button>
              <button className="btn-back" onClick={prevStep}>← Back</button>
            </motion.div>
          )}

          {/* STEP 6: Phase 1 Instant Slot Booking (PPA) */}
          {step === 6 && (
            <motion.div key="step6" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="wizard-step">
              <div className="ppa-badge-header">⚡ Phase 1: Instant Appointment Booking</div>
              <h2>Select a date & time for your free in-home estimate:</h2>
              <p className="wizard-sub" style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '20px' }}>
                Skip the phone call queue! Homeowners who lock in a slot receive guaranteed $250 priority scheduling.
              </p>

              <div className="slot-selection-container">
                <label className="slot-label">Select Date:</label>
                <div className="wizard-grid-3col mb-4">
                  {[
                    { day: 'Tomorrow', date: 'Jul 28' },
                    { day: 'Wednesday', date: 'Jul 29' },
                    { day: 'Thursday', date: 'Jul 30' }
                  ].map(d => {
                    const dateStr = `${d.day}, ${d.date}`;
                    const isSelected = formData.appointmentDate === dateStr;
                    return (
                      <button
                        key={d.date}
                        className={`wizard-option-btn ${isSelected ? 'selected' : ''}`}
                        onClick={() => update({ appointmentDate: dateStr })}
                      >
                        <strong>{d.day}</strong>
                        <span>{d.date}</span>
                      </button>
                    );
                  })}
                </div>

                <label className="slot-label">Select Time Window:</label>
                <div className="wizard-grid-3col mb-4">
                  {['9:00 AM - 11:00 AM', '1:00 PM - 3:00 PM', '4:00 PM - 6:00 PM'].map(t => {
                    const isSelected = formData.appointmentTime === t;
                    return (
                      <button
                        key={t}
                        className={`wizard-option-btn ${isSelected ? 'selected' : ''}`}
                        onClick={() => update({ appointmentTime: t })}
                      >
                        <strong>{t}</strong>
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                className="btn-primary btn-submit-huge mt-4"
                onClick={() => handleSubmit({ leadType: 'PPA_ONLINE', appointmentStatus: 'Confirmed' })}
                disabled={loading || !formData.appointmentDate || !formData.appointmentTime}
              >
                {loading ? 'Confirming Slot...' : '📅 Confirm Priority Appointment Slot'}
              </button>

              <div className="or-divider mt-3 text-center" style={{ color: '#94a3b8', fontSize: '0.85rem' }}>or</div>

              <button
                className="btn-secondary btn-skip-ppa mt-2"
                onClick={() => handleSubmit({ leadType: 'CPL', appointmentDate: '', appointmentTime: '', appointmentStatus: 'Pending' })}
                disabled={loading}
                style={{ width: '100%', padding: '12px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '8px', color: '#475569', fontWeight: '600', cursor: 'pointer' }}
              >
                📞 Skip & Have a Pro Call Me to Schedule (CPL Flow)
              </button>

              <button className="btn-back mt-3" onClick={() => setStep(5)}>← Back</button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
    </>
  );
}
