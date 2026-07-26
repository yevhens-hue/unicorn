import React, { useState } from 'react';
import { Star, ArrowRight, ShieldCheck, Zap, Fan, Flame, Settings, Wind, Sun, Home } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import PhoneInput from './components/PhoneInput';
import './B2CFunnel.css';

const API = import.meta.env.VITE_API_URL || 'https://unicorn-pro-api-backend.vercel.app';

const VERTICALS = [
  { id: 'HVAC', label: 'HVAC', icon: Fan, desc: 'AC, Heating, Furnace', color: '#3b82f6' },
  { id: 'Roofing', label: 'Roofing', icon: Home, desc: 'Repair, Replace, Inspect', color: '#f59e0b' },
  { id: 'Windows', label: 'Windows', icon: Wind, desc: 'Install, Replace, Seal', color: '#10b981' },
  { id: 'Solar', label: 'Solar', icon: Sun, desc: 'Panels, Battery, Install', color: '#f97316' },
];

const SERVICES = {
  HVAC: [
    { id: 'AC Repair', label: 'AC Repair', icon: Fan },
    { id: 'Heating Install', label: 'Heating Install', icon: Flame },
    { id: 'Maintenance', label: 'Maintenance', icon: Settings },
    { id: 'Heat Pump', label: 'Heat Pump', icon: Zap },
  ],
  Roofing: [
    { id: 'Roof Repair', label: 'Roof Repair', icon: Home },
    { id: 'Roof Replace', label: 'Full Replace', icon: Home },
    { id: 'Roof Inspect', label: 'Inspection', icon: ShieldCheck },
    { id: 'Gutter Install', label: 'Gutters', icon: Wind },
  ],
  Windows: [
    { id: 'Window Replace', label: 'Replacement', icon: Wind },
    { id: 'Window Repair', label: 'Repair', icon: Settings },
    { id: 'Window Seal', label: 'Sealing', icon: ShieldCheck },
    { id: 'Window Install', label: 'New Install', icon: Zap },
  ],
  Solar: [
    { id: 'Solar Install', label: 'Panel Install', icon: Sun },
    { id: 'Solar Repair', label: 'Repair', icon: Settings },
    { id: 'Battery Install', label: 'Battery Storage', icon: Zap },
    { id: 'Solar Inspect', label: 'Inspection', icon: ShieldCheck },
  ],
};

const pageVariants = {
  initial: { opacity: 0, x: 40 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -40 },
};

export default function B2CFunnel() {
  const [step, setStep] = useState(0); // 0=hero, 1=vertical, 2=service, 3=location, 4=urgency, 5=contact, 6=thankyou
  const [loading, setLoading] = useState(false);
  const [winners, setWinners] = useState([]);
  const [formData, setFormData] = useState({
    vertical: 'HVAC',
    serviceType: '',
    zipCode: '',
    propertyType: 'Residential',
    isOwner: true,
    urgency: '',
    name: '',
    phone: '',
    email: '',
    tcpa: false,
  });

  const update = (fields) => setFormData(f => ({ ...f, ...fields }));

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      
      if (!res.ok) {
        alert(`Request failed: ${data.error || 'Unknown error'}`);
        return;
      }
      
      setWinners(data.winners || []);
      setStep(6);
    } catch (err) {
      console.error(err);
      alert('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // HERO
  if (step === 0) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="hero-section">
        <div className="social-proof">
          {[1,2,3,4,5].map(i => <Star key={i} fill="#00b67a" color="#00b67a" size={18}/>)}
          <span>Trustpilot 4.9 · 12,000+ Reviews</span>
        </div>

        <h1 className="hero-title">Find Top-Rated Home Pros<br/><span className="hero-highlight">In Minutes. For Free.</span></h1>
        <p className="hero-sub">Get free, no-obligation estimates from local certified contractors.</p>

        <div className="zip-hero-box glass-card">
          <div className="zip-input-row">
            <span className="zip-pin">📍</span>
            <input
              type="text"
              className="zip-hero-input"
              placeholder="Enter your ZIP code"
              value={formData.zipCode}
              onChange={e => update({ zipCode: e.target.value })}
              onKeyDown={e => e.key === 'Enter' && formData.zipCode.length >= 5 && setStep(1)}
              maxLength={5}
            />
            <button
              className="btn-primary"
              onClick={() => setStep(1)}
              disabled={formData.zipCode.length < 5}
            >
              Get Quotes <ArrowRight size={18}/>
            </button>
          </div>
          <div className="trust-badges">
            <span><ShieldCheck size={14}/> Vetted & Insured Pros</span>
            <span><Zap size={14}/> Fast Response</span>
            <span>🔒 No Spam Guarantee</span>
          </div>
        </div>

        <div className="vertical-quick-links">
          {VERTICALS.map(v => (
            <button key={v.id} className="vertical-quick" onClick={() => { update({ vertical: v.id }); setStep(1); }}>
              <v.icon size={18}/> {v.label}
            </button>
          ))}
        </div>
      </motion.div>
    );
  }

  // THANK YOU
  if (step === 6) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="thank-you-section">
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
                  <div className="winner-badge">Matched</div>
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

        <div className="ty-tips">
          <div className="ty-tip"><span>📞</span><span>Keep your phone nearby — pros may call soon</span></div>
          <div className="ty-tip"><span>✉️</span><span>Check <strong>{formData.email}</strong> for quote details</span></div>
        </div>

        <button className="btn-secondary" onClick={() => { setStep(0); setFormData({ vertical:'HVAC', serviceType:'', zipCode:'', propertyType:'Residential', isOwner:true, urgency:'', name:'', phone:'', email:'', tcpa:false }); }}>
          Start New Request
        </button>
      </motion.div>
    );
  }

  const totalSteps = 5;
  const currentStep = step - 1;
  const STEPS = ['Category', 'Service', 'Location', 'Urgency', 'Contact'];

  return (
    <div className="funnel-container">
      {/* Progress */}
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${(currentStep / totalSteps) * 100}%` }}/>
      </div>
      <div className="progress-labels">
        {STEPS.map((s, i) => (
          <span key={s} className={i < currentStep ? 'done' : i === currentStep ? 'active' : ''}>{s}</span>
        ))}
      </div>

      <div className="funnel-card glass-card">
        <AnimatePresence mode="wait">

          {/* STEP 1: Vertical */}
          {step === 1 && (
            <motion.div key="step1" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="step-content">
              <h2>What type of project is this?</h2>
              <p className="step-sub">Select a category to find the right pros</p>
              <div className="vertical-grid">
                {VERTICALS.map(v => (
                  <button key={v.id} className={`vertical-tile ${formData.vertical === v.id ? 'selected' : ''}`}
                    onClick={() => { update({ vertical: v.id }); setStep(2); }}>
                    <div className="vtile-icon" style={{ background: `${v.color}22`, color: v.color }}>
                      <v.icon size={28}/>
                    </div>
                    <strong>{v.label}</strong>
                    <span>{v.desc}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* STEP 2: Service Type */}
          {step === 2 && (
            <motion.div key="step2" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="step-content">
              <h2>What do you need help with?</h2>
              <div className="tiles-grid">
                {(SERVICES[formData.vertical] || SERVICES.HVAC).map(s => (
                  <button key={s.id} className="tile-btn" onClick={() => { update({ serviceType: s.id }); setStep(3); }}>
                    <s.icon size={28}/>
                    <span>{s.label}</span>
                  </button>
                ))}
              </div>
              <button className="btn-back" onClick={() => setStep(1)}>← Back</button>
            </motion.div>
          )}

          {/* STEP 3: Location + Ownership */}
          {step === 3 && (
            <motion.div key="step3" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="step-content">
              <h2>Where is the property?</h2>
              <input type="text" className="input-lg" placeholder="ZIP Code" value={formData.zipCode}
                onChange={e => update({ zipCode: e.target.value })} maxLength={5}/>
              <div className="ownership-cards" style={{ marginTop: 20 }}>
                <button className={`ownership-card ${formData.isOwner ? 'selected' : ''}`} onClick={() => update({ isOwner: true })}>
                  <span>🏠</span><strong>I own the home</strong>
                </button>
                <button className={`ownership-card ${!formData.isOwner ? 'selected' : ''}`} onClick={() => update({ isOwner: false })}>
                  <span>🔑</span><strong>I'm renting</strong>
                </button>
              </div>

              {/* Soft Exit for renters */}
              {!formData.isOwner && (
                <div className="soft-exit-banner">
                  ℹ️ Some pros require homeowner approval. You can still submit — we'll match you with renter-friendly contractors.
                </div>
              )}

              <button className="btn-primary mt-4" onClick={() => setStep(4)} disabled={formData.zipCode.length < 5}>
                Continue <ArrowRight size={16}/>
              </button>
              <button className="btn-back" onClick={() => setStep(2)}>← Back</button>
            </motion.div>
          )}

          {/* STEP 4: Urgency */}
          {step === 4 && (
            <motion.div key="step4" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="step-content">
              <h2>How urgent is this?</h2>
              <div className="tiles-list">
                {[
                  { id: 'Emergency', emoji: '🚨', title: 'Emergency (Today)', desc: 'Exclusive routing — highest priority' },
                  { id: 'This Week', emoji: '📅', title: 'This Week', desc: 'Standard shared routing' },
                  { id: 'Planning', emoji: '🗓️', title: 'Planning Ahead', desc: 'Get estimates now, start later' },
                ].map(u => (
                  <button key={u.id} className="tile-row" onClick={() => { update({ urgency: u.id }); setStep(5); }}>
                    <span className="emoji">{u.emoji}</span>
                    <div className="tile-text">
                      <strong>{u.title}</strong>
                      <span>{u.desc}</span>
                    </div>
                  </button>
                ))}
              </div>
              <button className="btn-back" onClick={() => setStep(3)}>← Back</button>
            </motion.div>
          )}

          {/* STEP 5: Contact */}
          {step === 5 && (
            <motion.div key="step5" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="step-content">
              <h2>Who should pros contact?</h2>
              <p className="step-sub">Your info is only shared with matched contractors</p>
              <div className="form-group">
                <input type="text" placeholder="Full Name" value={formData.name} onChange={e => update({ name: e.target.value })}/>
                <PhoneInput value={formData.phone} onChange={val => update({ phone: val })}/>
                <span className="form-hint">🔒 Phone validation active</span>
                <input type="email" placeholder="Email Address" value={formData.email} onChange={e => update({ email: e.target.value })}/>
              </div>
              <div className="tcpa-box">
                <input type="checkbox" id="tcpa" checked={formData.tcpa} onChange={e => update({ tcpa: e.target.checked })}/>
                <label htmlFor="tcpa">
                  I agree to be contacted by phone, email, or text by matched contractors.
                  <br/><small style={{opacity:0.6}}>TrustedForm Cert active · TCPA Compliant</small>
                </label>
              </div>
              <button
                className="btn-primary mt-4 w-full"
                onClick={handleSubmit}
                disabled={loading || !formData.name || !formData.phone || !formData.email || !formData.tcpa}
              >
                {loading ? '⏳ Finding Pros...' : '🚀 Get My Free Quotes'}
              </button>
              <button className="btn-back" onClick={() => setStep(4)}>← Back</button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
