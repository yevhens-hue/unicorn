import React, { useState, useEffect } from 'react';
import { Users, FileText, BarChart2, List, AlertTriangle } from 'lucide-react';
import './AdminPortal.css';

const API = import.meta.env.VITE_API_URL || 'https://unicorn-pro-api-backend.vercel.app';
const ADMIN_KEY = 'unicorn-admin-2024';
const headers = { 'x-admin-key': ADMIN_KEY };

export default function AdminPortal() {
  const [activeTab, setActiveTab] = useState('kpi');
  const [kpi, setKpi] = useState(null);
  const [leads, setLeads] = useState([]);
  const [buyers, setBuyers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [leadsFilter, setLeadsFilter] = useState({ status: '', vertical: '' });
  const [balanceInputs, setBalanceInputs] = useState({});

  const fetchKpi = async () => {
    const res = await fetch(`${API}/api/admin/kpi`, { headers });
    setKpi(await res.json());
  };

  const fetchLeads = async () => {
    const params = new URLSearchParams();
    if (leadsFilter.status) params.append('status', leadsFilter.status);
    if (leadsFilter.vertical) params.append('vertical', leadsFilter.vertical);
    const res = await fetch(`${API}/api/admin/leads?${params}`, { headers });
    setLeads(await res.json());
  };

  const fetchBuyers = async () => {
    const res = await fetch(`${API}/api/admin/buyers`, { headers });
    setBuyers(await res.json());
  };

  const fetchLogs = async () => {
    const res = await fetch(`${API}/api/admin/auction-logs`, { headers });
    setLogs(await res.json());
  };

  const fetchAll = async () => {
    setLoading(true);
    try { await Promise.all([fetchKpi(), fetchLeads(), fetchBuyers(), fetchLogs()]); }
    catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);
  useEffect(() => { fetchLeads(); }, [leadsFilter]);

  const adjustBalance = async (buyerId, amount) => {
    await fetch(`${API}/api/admin/buyers/${buyerId}/balance`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: parseFloat(amount), note: 'Manual admin adjustment' })
    });
    fetchBuyers(); fetchKpi();
  };

  const freezeBuyer = async (buyerId) => {
    if (!window.confirm('Freeze all campaigns for this buyer?')) return;
    await fetch(`${API}/api/admin/buyers/${buyerId}/freeze`, { method: 'POST', headers });
    fetchBuyers();
  };

  return (
    <div className="admin-layout">
      <header className="admin-header glass-card">
        <div className="admin-brand">⚡ Unicorn Admin</div>
        <nav className="admin-tabs">
          {[
            { id: 'kpi', icon: BarChart2, label: 'KPI' },
            { id: 'leads', icon: FileText, label: 'Leads' },
            { id: 'buyers', icon: Users, label: 'Buyers' },
            { id: 'logs', icon: List, label: 'Auction Logs' },
            { id: 'billing', icon: FileText, label: 'Invoicing' },
          ].map(({ id, icon: Icon, label }) => (
            <button key={id} className={activeTab === id ? 'active' : ''} onClick={() => setActiveTab(id)}>
              <Icon size={15}/> {label}
            </button>
          ))}
        </nav>
        <button className="btn-refresh" onClick={fetchAll}>↻ Refresh</button>
      </header>

      <main className="admin-main">
        {loading && activeTab === 'kpi' && !kpi ? (
          <div className="admin-loading">Loading data...</div>
        ) : (
          <>
            {/* KPI DASHBOARD */}
            {activeTab === 'kpi' && kpi && (
              <div className="kpi-section">
                <h2>Platform Overview</h2>
                <div className="admin-kpi-grid">
                  {[
                    { label: 'Total Leads', value: kpi.totalLeads, color: '#7c3aed' },
                    { label: 'Platform Revenue', value: `$${kpi.totalRevenue}`, color: '#10b981' },
                    { label: 'Fill Rate', value: `${kpi.fillRate}%`, color: '#3b82f6' },
                    { label: 'Avg CPL', value: `$${kpi.avgCPL}`, color: '#f59e0b' },
                    { label: 'Unsold Leads', value: kpi.unsoldLeads, color: '#ef4444' },
                  ].map(k => (
                    <div key={k.label} className="admin-kpi-card glass-card">
                      <div className="akpi-val" style={{ color: k.color }}>{k.value}</div>
                      <div className="akpi-label">{k.label}</div>
                    </div>
                  ))}
                </div>

                <div className="admin-tip glass-card">
                  <AlertTriangle size={16} color="#f59e0b"/>
                  <span>Fill rate below 70%? Check if campaigns have enough ZIP coverage and bid amounts are competitive.</span>
                </div>
              </div>
            )}

            {/* LEADS */}
            {activeTab === 'leads' && (
              <div className="leads-section">
                <div className="section-header">
                  <h2>All Leads</h2>
                  <div className="filters">
                    <select value={leadsFilter.status} onChange={e => setLeadsFilter(f => ({ ...f, status: e.target.value }))}>
                      <option value="">All Statuses</option>
                      <option>Exclusive</option>
                      <option>Shared</option>
                      <option>Unsold</option>
                    </select>
                    <select value={leadsFilter.vertical} onChange={e => setLeadsFilter(f => ({ ...f, vertical: e.target.value }))}>
                      <option value="">All Verticals</option>
                      <option>HVAC</option><option>Roofing</option><option>Windows</option><option>Solar</option>
                    </select>
                  </div>
                </div>
                <div className="admin-table-wrapper glass-card">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>ID</th><th>Name</th><th>Service</th><th>ZIP</th>
                        <th>Status</th><th>Timeframe</th><th>Scope</th><th>Urgency</th><th>Buyers</th><th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leads.length === 0 && (
                        <tr><td colSpan={8} style={{textAlign:'center',color:'#666',padding:32}}>No leads yet</td></tr>
                      )}
                      {leads.map(l => (
                        <tr key={l.id}>
                          <td>#{l.id}</td>
                          <td><strong>{l.name}</strong></td>
                          <td>{l.vertical ? `${l.vertical} - ` : ''}{l.serviceType}</td>
                          <td>{l.zipCode}</td>
                          <td><span className={`status-pill status-${l.status.toLowerCase()}`}>{l.status}</span></td>
                          <td>{l.timeframe || '-'}</td>
                          <td>{l.projectScope || '-'}</td>
                          <td>{l.urgency}</td>
                          <td>{l.purchases?.length || 0}</td>
                          <td>{new Date(l.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* BUYERS */}
            {activeTab === 'buyers' && (
              <div className="buyers-section">
                <h2>Contractor Accounts</h2>
                <div className="admin-table-wrapper glass-card">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>ID</th><th>Name</th><th>Email</th><th>Balance</th>
                        <th>Leads</th><th>Active Camps</th><th>Adjust</th><th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {buyers.length === 0 && (
                        <tr><td colSpan={8} style={{textAlign:'center',color:'#666',padding:32}}>No buyers yet</td></tr>
                      )}
                      {buyers.map(b => (
                        <tr key={b.id}>
                          <td>#{b.id}</td>
                          <td><strong>{b.name}</strong></td>
                          <td style={{fontSize:12,color:'#888'}}>{b.email}</td>
                          <td><strong style={{color:'#10b981'}}>${Number(b.balance).toFixed(2)}</strong></td>
                          <td>{b._count?.purchases ?? 0}</td>
                          <td>{b.campaigns?.filter(c => c.isActive).length ?? 0}</td>
                          <td>
                            <div className="balance-adjust">
                              <input
                                type="number"
                                placeholder="±$"
                                value={balanceInputs[b.id] || ''}
                                onChange={e => setBalanceInputs(bi => ({ ...bi, [b.id]: e.target.value }))}
                              />
                              <button className="btn-sm" onClick={() => { adjustBalance(b.id, balanceInputs[b.id] || 0); setBalanceInputs(bi => ({ ...bi, [b.id]: '' })); }}>
                                Apply
                              </button>
                            </div>
                          </td>
                          <td>
                            <button className="btn-sm btn-danger" onClick={() => freezeBuyer(b.id)}>Freeze</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* AUCTION LOGS */}
            {activeTab === 'logs' && (
              <div className="logs-section">
                <h2>Auction Logs <span style={{fontSize:13,color:'#555',fontWeight:400}}>— last 100 transactions</span></h2>
                <div className="admin-table-wrapper glass-card">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Lead ID</th><th>Buyer</th><th>Service</th><th>ZIP</th>
                        <th>Lead Type</th><th>Price</th><th>Status</th><th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.length === 0 && (
                        <tr><td colSpan={8} style={{textAlign:'center',color:'#666',padding:32}}>No auction transactions yet</td></tr>
                      )}
                      {logs.map(log => (
                        <tr key={log.id}>
                          <td>#{log.lead?.id}</td>
                          <td><strong>{log.buyer?.name}</strong></td>
                          <td>{log.lead?.serviceType}</td>
                          <td>{log.lead?.zipCode}</td>
                          <td><span className={`status-pill status-${log.lead?.status?.toLowerCase()}`}>{log.lead?.status}</span></td>
                          <td><strong style={{color:'#10b981'}}>${log.price}</strong></td>
                          <td>
                            <span className={`status-pill ${log.status === 'returned' ? 'status-returned' : 'status-active'}`}>
                              {log.status}
                            </span>
                          </td>
                          <td>{new Date(log.createdAt).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* BILLING & INVOICING */}
            {activeTab === 'billing' && (
              <div className="invoicing-section">
                <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h2>Automated Invoicing</h2>
                  <button className="btn-primary" onClick={() => alert('Mock: Successfully synced 3 new invoices to QuickBooks Online!')}>
                    Sync with QuickBooks
                  </button>
                </div>
                
                <div className="admin-tip glass-card" style={{ marginBottom: 24, background: 'rgba(16, 185, 129, 0.1)', borderColor: 'rgba(16, 185, 129, 0.2)' }}>
                  <AlertTriangle size={16} color="#10b981"/>
                  <span style={{ color: '#10b981' }}>Replaces manual SQL queries. Invoices are auto-generated based on buyer terms (Net-7, Net-15, Net-30).</span>
                </div>

                <div className="admin-table-wrapper glass-card">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Invoice ID</th><th>Entity / Buyer</th><th>Term</th><th>Period</th>
                        <th>Amount</th><th>Status</th><th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>INV-2026-001</td>
                        <td><strong>Results Machine LLC</strong></td>
                        <td>Net-7</td>
                        <td>07/19/2026 - 07/25/2026</td>
                        <td><strong style={{color:'#10b981'}}>$1,450.00</strong></td>
                        <td><span className="status-pill status-unsold" style={{background: '#f59e0b20', color: '#f59e0b'}}>Pending</span></td>
                        <td><button className="btn-sm" style={{background: '#0b57d0'}}>Send</button></td>
                      </tr>
                      <tr>
                        <td>INV-2026-002</td>
                        <td><strong>Cash America Net Holdings LLC</strong></td>
                        <td>Net-30</td>
                        <td>07/01/2026 - 07/31/2026</td>
                        <td><strong style={{color:'#10b981'}}>$8,200.00</strong></td>
                        <td><span className="status-pill status-active" style={{background: '#10b98120', color: '#10b981'}}>Paid</span></td>
                        <td><button className="btn-sm">View</button></td>
                      </tr>
                      <tr>
                        <td>INV-2026-003</td>
                        <td><strong>HVAC Masters (Demo)</strong></td>
                        <td>Net-15</td>
                        <td>07/01/2026 - 07/15/2026</td>
                        <td><strong style={{color:'#10b981'}}>$350.00</strong></td>
                        <td><span className="status-pill status-active" style={{background: '#10b98120', color: '#10b981'}}>Paid</span></td>
                        <td><button className="btn-sm">View</button></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
