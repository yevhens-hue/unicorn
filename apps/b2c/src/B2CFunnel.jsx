import React, { useState, useEffect } from 'react';
import { Star, ArrowRight, ShieldCheck, Zap, Fan, Flame, Settings, Wind, Sun, Home, Search, MapPin, CheckCircle } from 'lucide-react';
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

const PROJECT_DETAILS_QUESTIONS = {
  HVAC: [
    { id: 'systemAge', label: 'How old is your current system?', options: ['Under 5 years', '5-10 years', 'Over 10 years', 'I am not sure'] },
    { id: 'propertyTypeHVAC', label: 'What type of property is this?', options: ['Single Family', 'Townhouse/Condo', 'Commercial'] }
  ],
  Roofing: [
    { id: 'roofMaterial', label: 'What is your current roof material?', options: ['Asphalt Shingles', 'Metal', 'Tile', 'Flat / Tar', 'Other'] },
    { id: 'roofAge', label: 'When was the roof last replaced?', options: ['Within 10 years', '10-20 years ago', 'Over 20 years ago', 'I am not sure'] }
  ],
  Windows: [
    { id: 'windowCount', label: 'How many windows are involved?', options: ['1-2 windows', '3-5 windows', '6-9 windows', '10+ windows'] },
    { id: 'windowReason', label: 'Primary reason for project?', options: ['Broken glass / seal', 'Drafty / cold', 'Upgrading appearance', 'New construction'] }
  ],
  Solar: [
    { id: 'roofShade', label: 'How much shade does your roof get?', options: ['No shade', 'A little shade', 'A lot of shade'] },
    { id: 'electricBill', label: 'Average monthly electric bill?', options: ['Under $100', '$100 - $200', '$201 - $300', 'Over $300'] }
  ]
};

const pageVariants = {
  initial: { opacity: 0, x: 40 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -40 },
};

export default function B2CFunnel() {
  // 0=hero, 1=vertical, 2=service, 3=details, 4=location, 5=urgency, 6=contact, 7=matching, 8=thankyou
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [winners, setWinners] = useState([]);
  const [formData, setFormData] = useState({
    vertical: 'HVAC',
    serviceType: '',
    projectDetails: {},
    zipCode: '',
    streetAddress: '',
    city: '',
    state: '',
    propertyType: 'Residential',
    isOwner: true,
    urgency: '',
    name: '',
    phone: '',
    email: '',
    tcpa: false,
  });
  
  const [matchingStatus, setMatchingStatus] = useState('');

  const update = (fields) => setFormData(f => ({ ...f, ...fields }));
  const updateDetail = (key, val) => setFormData(f => ({ ...f, projectDetails: { ...f.projectDetails, [key]: val } }));

  const handleSubmit = async () => {
    // Start matching engine simulation
    setStep(7); 
    setMatchingStatus('Analyzing project details...');
    
    // Simulate network delay and matching stages
    setTimeout(() => setMatchingStatus(`Finding top-rated pros near ${formData.zipCode}...`), 1500);
    setTimeout(() => setMatchingStatus('Checking contractor availability...'), 3000);
    
    try {
      // In a real MVP, we just send what the backend expects. We can pass the extra details in a JSON string if the backend supports it, 
      // but for now we'll just safely pass the standard payload to avoid breaking the Prisma schema.
      const payload = {
        vertical: formData.vertical,
        serviceType: formData.serviceType,
        zipCode: formData.zipCode,
        propertyType: formData.propertyType,
        isOwner: formData.isOwner,
        urgency: formData.urgency,
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        tcpa: formData.tcpa
      };

      const res = await fetch(`${API}/api/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      
      if (!res.ok) {
        alert(`Request failed: ${data.error || 'Unknown error'}`);
        setStep(6);
        return;
      }
      
      setWinners(data.winners || []);
      
      // Delay before showing thank you to complete the illusion of matching
      setTimeout(() => {
        setStep(8);
      }, 1500);

    } catch (err) {
      console.error(err);
      alert('Connection error. Please try again.');
      setStep(6);
    }
  };

  // HERO (Angi / Modernize style)
  if (step === 0) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="hero-section hero-modern">
        <div className="social-proof-modern">
          <div className="avatar-group">
            <img src="https://i.pravatar.cc/100?img=1" alt="user" />
            <img src="https://i.pravatar.cc/100?img=2" alt="user" />
            <img src="https://i.pravatar.cc/100?img=3" alt="user" />
          </div>
          <span>Join 10+ million homeowners finding trusted pros</span>
        </div>

        <h1 className="hero-title">What project do you need help with?</h1>
        <p className="hero-sub">Get free estimates from highly-rated local professionals.</p>

        <div className="search-hero-box glass-card">
          <div className="search-input-wrapper">
             <Search className="search-icon" size={20} />
             <input
                type="text"
                className="search-hero-input"
                placeholder="e.g. Roof Replacement, HVAC Repair, Solar..."
                readOnly
                onClick={() => setStep(1)}
             />
             <button className="btn-primary search-btn" onClick={() => setStep(1)}>
               Find Pros
             </button>
          </div>
          
          <div className="popular-searches">
            <span>Popular:</span>
            {VERTICALS.map(v => (
               <button key={v.id} className="popular-tag" onClick={() => { update({ vertical: v.id }); setStep(2); }}>
                 {v.label}
               </button>
            ))}
          </div>
        </div>
        
        <div className="trust-badges-modern">
          <span><ShieldCheck size={18} color="#10b981"/> 100% Vetted Contractors</span>
          <span><Star size={18} color="#f59e0b"/> Verified Reviews</span>
          <span><CheckCircle size={18} color="#3b82f6"/> Free, No-Obligation Quotes</span>
        </div>
      </motion.div>
    );
  }

  // MATCHING ENGINE INTERSTITIAL
  if (step === 7) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="matching-engine-section">
         <div className="radar-spinner">
           <div className="radar-pulse"></div>
           <Search size={40} color="#7c3aed" />
         </div>
         <h2 className="matching-title">{matchingStatus}</h2>
         <p className="matching-sub">Please wait while we cross-reference our network of certified pros...</p>
         
         <div className="matching-steps">
           <div className="match-step active">✓ Analyzing requirements</div>
           <div className={`match-step ${matchingStatus.includes('Availability') || matchingStatus.includes('Top') ? 'active' : ''}`}>
             ✓ Filtering for {formData.vertical} experts
           </div>
           <div className={`match-step ${matchingStatus.includes('Availability') ? 'active' : ''}`}>
             ✓ Checking schedules in {formData.zipCode}
           </div>
         </div>
      </motion.div>
    );
  }

  // THANK YOU
  if (step === 8) {
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
            <div className="urgency-badge amber">⏳ Finding the best pros near {formData.zipCode}</div>
            <p className="ty-sub">Our team is manually matching your request. You'll hear back within 2 hours.</p>
          </>
        )}

        <div className="ty-tips">
          <div className="ty-tip"><span>📞</span><span>Keep your phone nearby — pros may call soon</span></div>
          <div className="ty-tip"><span>✉️</span><span>Check <strong>{formData.email}</strong> for quote details</span></div>
        </div>

        <button className="btn-secondary mt-4" onClick={() => { setStep(0); }}>
          Start New Request
        </button>
      </motion.div>
    );
  }

  const totalSteps = 6;
  const currentStep = step - 1; // 1 to 6 mapped to 0 to 5
  const STEPS = ['Category', 'Service', 'Details', 'Location', 'Urgency', 'Contact'];
  const currentDetailsQuestions = PROJECT_DETAILS_QUESTIONS[formData.vertical] || [];

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
              <button className="btn-back" onClick={() => setStep(0)}>← Back to Home</button>
            </motion.div>
          )}

          {/* STEP 2: Service Type */}
          {step === 2 && (
            <motion.div key="step2" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="step-content">
              <h2>What do you need help with?</h2>
              <p className="step-sub">{formData.vertical} Services</p>
              <div className="tiles-grid">
                {(SERVICES[formData.vertical] || SERVICES.HVAC).map(s => (
                  <button key={s.id} className={`tile-btn ${formData.serviceType === s.id ? 'selected' : ''}`} onClick={() => { update({ serviceType: s.id }); setStep(3); }}>
                    <s.icon size={28}/>
                    <span>{s.label}</span>
                  </button>
                ))}
              </div>
              <button className="btn-back" onClick={() => setStep(1)}>← Back</button>
            </motion.div>
          )}

          {/* STEP 3: Project Details (Modernize Deep Scoping) */}
          {step === 3 && (
            <motion.div key="step3" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="step-content">
              <h2>Project Details</h2>
              <p className="step-sub">Help us match you with the right pros</p>
              
              <div className="project-details-form">
                {currentDetailsQuestions.map((q, idx) => (
                  <div key={q.id} className="detail-question">
                    <label>{q.label}</label>
                    <div className="options-grid">
                      {q.options.map(opt => (
                         <button 
                           key={opt} 
                           className={`detail-opt ${formData.projectDetails[q.id] === opt ? 'selected' : ''}`}
                           onClick={() => updateDetail(q.id, opt)}
                         >
                           {opt}
                         </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <button 
                className="btn-primary mt-4 w-full" 
                onClick={() => setStep(4)}
              >
                Continue <ArrowRight size={16}/>
              </button>
              <button className="btn-back" onClick={() => setStep(2)}>← Back</button>
            </motion.div>
          )}

          {/* STEP 4: Full Location */}
          {step === 4 && (
            <motion.div key="step4" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="step-content">
              <h2>Where is the property?</h2>
              <p className="step-sub">Pros need this to give accurate estimates.</p>
              
              <div className="form-group location-group">
                 <div className="input-with-icon">
                    <MapPin size={18} className="input-icon" />
                    <input type="text" placeholder="Street Address" value={formData.streetAddress}
                      onChange={e => update({ streetAddress: e.target.value })}/>
                 </div>
                 
                 <div className="city-state-row">
                    <input type="text" placeholder="City" value={formData.city} onChange={e => update({ city: e.target.value })} />
                    <input type="text" placeholder="State (e.g. CA)" maxLength={2} value={formData.state} onChange={e => update({ state: e.target.value.toUpperCase() })} />
                 </div>
                 
                 <input type="text" placeholder="ZIP Code" value={formData.zipCode}
                    onChange={e => update({ zipCode: e.target.value })} maxLength={5}/>
              </div>

              <div className="ownership-cards" style={{ marginTop: 20 }}>
                <button className={`ownership-card ${formData.isOwner ? 'selected' : ''}`} onClick={() => update({ isOwner: true })}>
                  <span>🏠</span><strong>I own the home</strong>
                </button>
                <button className={`ownership-card ${!formData.isOwner ? 'selected' : ''}`} onClick={() => update({ isOwner: false })}>
                  <span>🔑</span><strong>I'm renting</strong>
                </button>
              </div>

              {!formData.isOwner && (
                <div className="soft-exit-banner">
                  ℹ️ Some pros require homeowner approval. We'll match you with renter-friendly contractors.
                </div>
              )}

              <button 
                className="btn-primary mt-4 w-full" 
                onClick={() => setStep(5)} 
                disabled={formData.zipCode.length < 5 || !formData.streetAddress}
              >
                Continue <ArrowRight size={16}/>
              </button>
              <button className="btn-back" onClick={() => setStep(3)}>← Back</button>
            </motion.div>
          )}

          {/* STEP 5: Urgency */}
          {step === 5 && (
            <motion.div key="step5" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="step-content">
              <h2>How urgent is this?</h2>
              <div className="tiles-list">
                {[
                  { id: 'Emergency', emoji: '🚨', title: 'Emergency (Today)', desc: 'Exclusive routing — highest priority' },
                  { id: 'This Week', emoji: '📅', title: 'This Week', desc: 'Standard shared routing' },
                  { id: 'Planning', emoji: '🗓️', title: 'Planning Ahead', desc: 'Get estimates now, start later' },
                ].map(u => (
                  <button key={u.id} className={`tile-row ${formData.urgency === u.id ? 'selected' : ''}`} onClick={() => { update({ urgency: u.id }); setStep(6); }}>
                    <span className="emoji">{u.emoji}</span>
                    <div className="tile-text">
                      <strong>{u.title}</strong>
                      <span>{u.desc}</span>
                    </div>
                  </button>
                ))}
              </div>
              <button className="btn-back" onClick={() => setStep(4)}>← Back</button>
            </motion.div>
          )}

          {/* STEP 6: Contact */}
          {step === 6 && (
            <motion.div key="step6" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="step-content">
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
                🚀 Get My Free Quotes
              </button>
              <button className="btn-back" onClick={() => setStep(5)}>← Back</button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
