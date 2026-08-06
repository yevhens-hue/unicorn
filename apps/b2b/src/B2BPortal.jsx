import React, { useState, useEffect } from 'react';
import { Inbox, Target, CreditCard, RotateCcw, BarChart2, LogOut, Plus, X } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import './B2BPortal.css';
import ExportDropdown from './ExportDropdown';

const API = import.meta.env.VITE_API_URL || 'https://unicorn-pro-api-backend.vercel.app';

// ─── Login Screen ───
function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState('demo@hvacmasters.com');
  const [password, setPassword] = useState('demo1234');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      localStorage.setItem('unicorn_token', data.token);
      localStorage.setItem('unicorn_buyer', JSON.stringify(data.buyer));
      onLogin(data.token, data.buyer);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-screen">
      <div className="login-card glass-card">
        <div className="login-logo">⚡ Unicorn Pro</div>
        <h2>Contractor Portal</h2>
        <p className="login-sub">Sign in to manage your leads and campaigns</p>
        <form onSubmit={handleLogin} className="login-form">
          <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required/>
          <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required/>
          {error && <div className="login-error">{error}</div>}
          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In →'}
          </button>
        </form>
        <p className="login-demo">Demo: demo@hvacmasters.com / demo1234</p>
      </div>
    </div>
  );
}

// ─── New Campaign Modal ───
function CampaignModal({ onClose, onCreated, token }) {
  const [form, setForm] = useState({ name: '', vertical: 'HVAC', zipCodes: 'all', leadType: 'Both', productType: 'Leads', maxBid: 75, dailyLimit: 10 });
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/campaigns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onCreated(data);
      onClose();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const u = (f) => setForm(p => ({ ...p, ...f }));

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card glass-card" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>New Campaign</h3>
          <button className="modal-close" onClick={onClose}><X size={18}/></button>
        </div>
        <div className="modal-body">
          <label>Campaign Name</label>
          <input placeholder="e.g. Miami HVAC Emergency" value={form.name} onChange={e => u({ name: e.target.value })}/>

          <label>Vertical</label>
          <select value={form.vertical} onChange={e => u({ vertical: e.target.value })}>
            {['HVAC','Roofing','Windows','Solar'].map(v => <option key={v}>{v}</option>)}
          </select>

          <label>Target ZIP Codes (comma separated, or "all")</label>
          <input placeholder="all" value={form.zipCodes} onChange={e => u({ zipCodes: e.target.value })}/>

          <div className="modal-row">
            <div>
              <label>Product Type</label>
              <select value={form.productType} onChange={e => u({ productType: e.target.value })}>
                <option>Leads</option>
                <option>Live Calls</option>
                <option>Verified Clicks</option>
              </select>
            </div>
            <div>
              <label>Lead Type</label>
              <select value={form.leadType} onChange={e => u({ leadType: e.target.value })}>
                <option>Both</option><option>Exclusive</option><option>Shared</option>
              </select>
            </div>
          </div>



          <div className="modal-row">
            <div>
              <label>Max Bid ($)</label>
              <input type="number" value={form.maxBid} onChange={e => u({ maxBid: parseFloat(e.target.value) })} min={5} max={500}/>
            </div>
            <div>
              <label>Daily Limit</label>
              <input type="number" value={form.dailyLimit} onChange={e => u({ dailyLimit: parseInt(e.target.value) })} min={1} max={100}/>
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleCreate} disabled={loading || !form.name}>
            {loading ? 'Creating...' : 'Create Campaign'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Return Lead Modal ───
function ReturnModal({ purchase, onClose, onReturned, token }) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleReturn = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/leads/${purchase.purchaseId}/return`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ reason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onReturned(data.refunded);
      onClose();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card glass-card" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Return Lead: {purchase.name}</h3>
          <button className="modal-close" onClick={onClose}><X size={18}/></button>
        </div>
        <div className="modal-body">
          <p style={{color:'#888',marginBottom:16}}>You will receive a refund of <strong style={{color:'#10b981'}}>${purchase.price}</strong></p>
          <label>Reason for return</label>
          <select value={reason} onChange={e => setReason(e.target.value)}>
            <option value="">Select reason...</option>
            <option>Wrong contact info</option>
            <option>Already hired someone</option>
            <option>Outside service area</option>
            <option>Lead quality issue</option>
            <option>Duplicate lead</option>
          </select>
        </div>
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleReturn} disabled={loading || !reason}>
            {loading ? 'Processing...' : 'Confirm Return'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Portal ───
export default function B2BPortal() {
  const [token, setToken] = useState(() => localStorage.getItem('unicorn_token'));
  const [buyer, setBuyer] = useState(() => {
    const s = localStorage.getItem('unicorn_buyer');
    return s ? JSON.parse(s) : null;
  });

  const [activeTab, setActiveTab] = useState('inbox');
  const [leads, setLeads] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [balance, setBalance] = useState(0);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [returnTarget, setReturnTarget] = useState(null);
  const [billingCycle, setBillingCycle] = useState('Prepaid');

  const headers = { Authorization: `Bearer ${token}` };

  const fetchData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [leadsRes, campRes, balRes] = await Promise.all([
        fetch(`${API}/api/leads/inbox`, { headers }),
        fetch(`${API}/api/campaigns`, { headers }),
        fetch(`${API}/api/buyers/balance`, { headers }),
      ]);
      if (leadsRes.status === 401) { handleLogout(); return; }
      setLeads(await leadsRes.json());
      setCampaigns(await campRes.json());
      const b = await balRes.json();
      setBalance(b.balance ?? 0);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const fetchAnalytics = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API}/api/analytics`, { headers });
      setAnalytics(await res.json());
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchData(); }, [token]);
  useEffect(() => { if (activeTab === 'analytics') fetchAnalytics(); }, [activeTab]);

  const handleLogin = (t, b) => { setToken(t); setBuyer(b); };
  const handleLogout = () => {
    localStorage.removeItem('unicorn_token');
    localStorage.removeItem('unicorn_buyer');
    setToken(null); setBuyer(null);
  };

  const toggleCampaign = async (id) => {
    try {
      await fetch(`${API}/api/campaigns/${id}/toggle`, { method: 'POST', headers });
      fetchData();
    } catch (err) { console.error(err); }
  };

  const getB2bExportData = (targetLeads = leads) => {
    const csvHeaders = ['purchase_id', 'lead_id', 'name', 'phone', 'email', 'service', 'zip', 'urgency', 'status', 'cost', 'date'];
    const rows = targetLeads.map(l => [
      l.purchaseId || '',
      `L${String(l.id).padStart(6, '0')}`,
      l.name || '',
      l.phone || '',
      l.email || '',
      `${l.vertical ? l.vertical + ' - ' : ''}${l.type || ''}`,
      l.zip || '',
      l.urgency || 'Standard',
      l.status || 'Sold',
      Number(l.price || 0).toFixed(2),
      new Date(l.time || Date.now()).toISOString().replace('T', ' ').slice(0, 19)
    ]);
    return { csvHeaders, rows };
  };

  const handleB2bExportCsv = () => {
    if (leads.length === 0) return;
    const { csvHeaders, rows } = getB2bExportData(leads);
    const formattedRows = rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','));
    const csvString = '\uFEFF' + [csvHeaders.join(','), ...formattedRows].join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `b2b_inbox_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleB2bExportExcel = () => {
    if (leads.length === 0) return;
    const { csvHeaders, rows } = getB2bExportData(leads);
    const xmlHeader = `<?xml version="1.0" encoding="UTF-8"?>\n<?mso-application progid="Excel.Sheet"?>\n<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">\n<Worksheet ss:Name="B2B Leads"><Table>\n`;
    const xmlFooter = `</Table></Worksheet></Workbook>`;
    const escapeXml = (str) => String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    const headerRow = `<Row>` + csvHeaders.map(h => `<Cell><Data ss:Type="String">${escapeXml(h)}</Data></Cell>`).join('') + `</Row>`;
    const dataRows = rows.map(r => `<Row>` + r.map(c => `<Cell><Data ss:Type="String">${escapeXml(c)}</Data></Cell>`).join('') + `</Row>`).join('\n');

    const xmlContent = xmlHeader + headerRow + '\n' + dataRows + '\n' + xmlFooter;
    const blob = new Blob([xmlContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `b2b_inbox_excel_${Date.now()}.xlsx`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleB2bCopyGoogleSheets = () => {
    if (leads.length === 0) return;
    const { csvHeaders, rows } = getB2bExportData(leads);
    const tsvString = [csvHeaders.join('\t'), ...rows.map(r => r.join('\t'))].join('\n');
    navigator.clipboard.writeText(tsvString);
    if (window.confirm('✅ Скопировано в буфер обмена!\n\nОткрыть пустую таблицу Google Sheets для вставки (Cmd+V / Ctrl+V)?')) {
      window.open('https://sheets.new', '_blank');
    }
  };

  if (!token || !buyer) return <LoginScreen onLogin={handleLogin}/>;

  return (
    <div className="portal-layout">
      {showCampaignModal && (
        <CampaignModal
          token={token}
          onClose={() => setShowCampaignModal(false)}
          onCreated={() => fetchData()}
        />
      )}
      {returnTarget && (
        <ReturnModal
          purchase={returnTarget}
          token={token}
          onClose={() => setReturnTarget(null)}
          onReturned={(refunded) => { setBalance(b => b + refunded); fetchData(); }}
        />
      )}

      {/* Sidebar */}
      <aside className="portal-sidebar glass-card">
        <div className="contractor-profile">
          <div className="avatar">{buyer.name?.[0] || 'P'}</div>
          <div>
            <strong>{buyer.name}</strong>
            <div className="balance"><CreditCard size={12}/> ${Number(balance).toFixed(2)}</div>
          </div>
        </div>
        <nav className="portal-nav">
          {[
            { id: 'inbox', icon: Inbox, label: 'Lead Inbox', badge: leads.filter(l => l.returnStatus === 'active').length },
            { id: 'campaigns', icon: Target, label: 'Campaigns', badge: campaigns.filter(c => c.isActive).length },
            { id: 'analytics', icon: BarChart2, label: 'Analytics' },
            { id: 'billing', icon: CreditCard, label: 'Billing' },
          ].map(({ id, icon: Icon, label, badge }) => (
            <button key={id} className={activeTab === id ? 'active' : ''} onClick={() => setActiveTab(id)}>
              <Icon size={17}/> {label}
              {badge > 0 && <span className="badge">{badge}</span>}
            </button>
          ))}
        </nav>
        <button className="logout-btn" onClick={handleLogout}><LogOut size={14}/> Sign Out</button>
      </aside>

      {/* Main */}
      <main className="portal-main">
        {loading ? (
          <div className="portal-loading">
            <div className="spinner"/>
            <p>Loading data…</p>
          </div>
        ) : (
          <>
            {/* INBOX */}
            {activeTab === 'inbox' && (
              <div className="inbox-view">
                <div style={{ background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.2), rgba(59, 130, 246, 0.2))', border: '1px solid rgba(167, 139, 250, 0.4)', borderRadius: '12px', padding: '16px 20px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#a78bfa', marginBottom: '4px' }}>⚡ LIVE DALLAS & TEXAS STREAM</div>
                    <div style={{ fontSize: '15px', fontWeight: '700', color: '#fff' }}>30+ Exclusive PPA Leads ($150) Available Today in ZIP 75001</div>
                    <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>🎁 $300 Free Trial Credit Active (2 Verified Appointments On Us)</div>
                  </div>
                  <div style={{ background: '#10b981', color: '#fff', fontSize: '12px', fontWeight: '800', padding: '6px 14px', borderRadius: '20px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Active Trial: $300.00
                  </div>
                </div>

                <header className="view-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <h2>Lead Inbox</h2>
                    <div className="status-indicator"><span className="dot online"/>&nbsp;Receiving Leads</div>
                  </div>
                  {leads.length > 0 && (
                    <ExportDropdown
                      onExportCsv={handleB2bExportCsv}
                      onExportExcel={handleB2bExportExcel}
                      title="Export Inbox"
                      filteredCount={leads.length}
                    />
                  )}
                </header>
                {leads.length === 0 && (
                  <div className="empty-state">
                    <p>📭 No leads yet. Submit a lead through the B2C funnel to test the auction!</p>
                  </div>
                )}
                <div className="leads-list">
                  {leads.map(lead => (
                    <div key={lead.purchaseId} className={`lead-card glass-card ${lead.returnStatus === 'returned' ? 'returned' : ''}`}>
                      <div className="lead-header">
                        <div className="lead-tags">
                          <span className={`tag ${lead.status === 'Exclusive' ? 'tag-primary' : 'tag-secondary'}`}>
                            {lead.status === 'Exclusive' ? '🎯 Exclusive' : '👥 Shared'}
                          </span>
                          {lead.urgency === 'Emergency' && <span className="tag tag-danger">🚨 Emergency</span>}
                          {lead.returnStatus === 'returned' && <span className="tag tag-muted">↩ Returned</span>}
                        </div>
                        <div className="lead-time">{new Date(lead.time).toLocaleString()}</div>
                      </div>
                      <div className="lead-body">
                        <h3>{lead.name}</h3>
                        <div className="lead-details">
                          <span><strong>Service:</strong> {lead.vertical ? `${lead.vertical} - ` : ''}{lead.type}</span>
                          {lead.projectScope && <span><strong>Scope:</strong> {lead.projectScope}</span>}
                          {lead.timeframe && <span><strong>Timeframe:</strong> {lead.timeframe}</span>}
                          <span><strong>ZIP:</strong> {lead.zip}</span>
                          <span><strong>Cost:</strong> ${lead.price}</span>
                        </div>
                      </div>
                      <div className="lead-footer">
                        <div className="lead-contact">📞 {lead.phone} &nbsp;·&nbsp; ✉️ {lead.email}</div>
                        {lead.returnStatus !== 'returned' && (
                          <button className="btn-return" onClick={() => setReturnTarget(lead)}>
                            <RotateCcw size={13}/> Return
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CAMPAIGNS */}
            {activeTab === 'campaigns' && (
              <div className="campaigns-view">
                <header className="view-header">
                  <h2>Campaigns</h2>
                  <button className="btn-primary" onClick={() => setShowCampaignModal(true)}>
                    <Plus size={16}/> New Campaign
                  </button>
                </header>
                {campaigns.length === 0 && (
                  <div className="empty-state">📢 No campaigns yet. Create one to start receiving leads!</div>
                )}
                <div className="campaign-list glass-card">
                  {campaigns.map(c => (
                    <div key={c.id} className={`campaign-row ${!c.isActive ? 'paused' : ''}`}>
                      <div className="camp-status-dot" style={{ background: c.isActive ? '#10b981' : '#555' }}/>
                      <div className="camp-info">
                        <strong>{c.name}</strong>
                        <span>{c.vertical} · {c.zipCodes} · {c.productType || 'Leads'} ({c.leadType})</span>
                      </div>
                      <div className="camp-bid">
                        <strong>${c.maxBid}</strong>
                        <span>max bid</span>
                      </div>
                      <div className="camp-limit">
                        <strong>{c.dailyLimit}</strong>
                        <span>daily limit</span>
                      </div>
                      <button className={`btn-toggle ${c.isActive ? 'active' : ''}`} onClick={() => toggleCampaign(c.id)}>
                        {c.isActive ? 'Pause' : 'Activate'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ANALYTICS */}
            {activeTab === 'analytics' && (
              <div className="analytics-view">
                <header className="view-header"><h2>Analytics</h2></header>
                {!analytics ? (
                  <div className="empty-state">Loading analytics...</div>
                ) : (
                  <>
                    <div className="kpi-grid">
                      {[
                        { label: 'Total Leads', value: analytics.totalLeads },
                        { label: 'Total Spend', value: `$${analytics.totalSpend}` },
                        { label: 'Return Rate', value: `${analytics.returnRate}%` },
                      ].map(k => (
                        <div key={k.label} className="kpi-card glass-card">
                          <div className="kpi-value">{k.value}</div>
                          <div className="kpi-label">{k.label}</div>
                        </div>
                      ))}
                    </div>

                    {analytics.byDay.length > 0 && (
                      <div className="chart-card glass-card">
                        <h3>Leads by Day</h3>
                        <ResponsiveContainer width="100%" height={220}>
                          <LineChart data={analytics.byDay}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)"/>
                            <XAxis dataKey="date" stroke="#555" fontSize={11}/>
                            <YAxis stroke="#555" fontSize={11}/>
                            <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid #333', borderRadius: 8 }}/>
                            <Line type="monotone" dataKey="count" stroke="#7c3aed" strokeWidth={2} dot={{ fill: '#7c3aed' }}/>
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    )}

                    {analytics.byVertical.length > 0 && (
                      <div className="chart-card glass-card">
                        <h3>Spend by Service Type</h3>
                        <ResponsiveContainer width="100%" height={200}>
                          <BarChart data={analytics.byVertical}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)"/>
                            <XAxis dataKey="name" stroke="#555" fontSize={11}/>
                            <YAxis stroke="#555" fontSize={11}/>
                            <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid #333', borderRadius: 8 }} formatter={(v) => `$${v}`}/>
                            <Bar dataKey="spend" fill="#3b82f6" radius={[4,4,0,0]}/>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}

                    {analytics.byDay.length === 0 && (
                      <div className="empty-state">📊 No data yet. Submit leads through the B2C funnel to see analytics!</div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* BILLING */}
            {activeTab === 'billing' && (
              <div className="billing-view">
                <header className="view-header"><h2>Wallet & Billing</h2></header>
                <div className="wallet-card glass-card">
                  <div className="wallet-bal">
                    <span>Current Balance</span>
                    <strong>${Number(balance).toFixed(2)}</strong>
                  </div>
                  <div className="wallet-actions">
                    <button className="btn-primary" onClick={async () => {
                      const amount = prompt("Enter amount to add ($):", "100");
                      if (!amount || isNaN(amount)) return;
                      try {
                        const res = await fetch(`${API}/api/billing/topup`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                          body: JSON.stringify({ amount: parseFloat(amount) })
                        });
                        const data = await res.json();
                        if (res.ok && data.checkoutUrl) {
                          alert(`Mock Stripe Checkout URL:\n${data.checkoutUrl}\n\n(In production, you would be redirected here)`);
                          // Redirect: window.location.href = data.checkoutUrl;
                        } else {
                          alert(data.error || 'Failed to initialize top-up');
                        }
                      } catch (e) {
                        alert('Error connecting to billing service');
                      }
                    }}>
                      Add Funds
                    </button>
                  </div>
                </div>
                <div className="billing-info glass-card">
                  <h3>💡 How billing works</h3>
                  <ul>
                    <li>Leads are charged at auction close — you only pay when matched</li>
                    <li>Exclusive leads: your max bid. Shared leads: 60% of your max bid</li>
                    <li>Returns are refunded instantly to your balance within 24h of request</li>
                    <li>Auto-recharge kicks in when balance falls below $50</li>
                  </ul>
                </div>
                
                <div className="billing-cycle-card glass-card" style={{ marginTop: 24 }}>
                  <h3>⚙️ Billing Settings</h3>
                  <div style={{ marginTop: 16 }}>
                    <label style={{ display: 'block', fontSize: 12, color: '#aaa', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Current Billing Cycle</label>
                    <select 
                      value={billingCycle} 
                      onChange={(e) => setBillingCycle(e.target.value)}
                      style={{ background: '#1a1a2e', border: '1px solid #333', color: '#fff', padding: '10px 16px', borderRadius: 8, fontSize: 14, width: '100%', maxWidth: 300 }}
                    >
                      <option value="Prepaid">Prepaid (Auto-recharge)</option>
                      <option value="Net-7">Net-7 (Weekly Invoicing)</option>
                      <option value="Net-15">Net-15 (Semi-Monthly)</option>
                      <option value="Net-30">Net-30 (Monthly Invoicing)</option>
                    </select>
                    <p style={{ marginTop: 12, fontSize: 13, color: '#888', lineHeight: 1.5 }}>
                      {billingCycle === 'Prepaid' 
                        ? 'Your wallet will automatically be charged when funds fall below minimum threshold.' 
                        : `You will receive automated invoices generated by the platform ${billingCycle.includes('7') ? 'every week' : billingCycle.includes('15') ? 'twice a month' : 'once a month'}. Terms apply.`}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
