import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Home, LayoutDashboard, Shield, Zap } from 'lucide-react';
import B2CFunnel from './pages/B2CFunnel';
import B2BPortal from './pages/B2BPortal';
import AdminPortal from './pages/AdminPortal';
import './index.css';

function Navigation() {
  const location = useLocation();
  const isAdmin = location.pathname === '/admin';

  return (
    <header className="app-header">
      <div className="logo">
        <Zap size={24} color="var(--primary)" fill="var(--primary)" />
        Unicorn Pro
      </div>
      <nav className="nav-links">
        <Link to="/" className={location.pathname === '/' ? 'active' : ''}>
          <Home size={15}/> Get Quotes
        </Link>
        <Link to="/portal" className={location.pathname === '/portal' ? 'active' : ''}>
          <LayoutDashboard size={15}/> Contractor Portal
        </Link>
        {isAdmin && (
          <Link to="/admin" className="active admin-link">
            <Shield size={15}/> Admin
          </Link>
        )}
      </nav>
      {!isAdmin && (
        <Link to="/admin" className="admin-access-btn" title="Admin Dashboard">
          <Shield size={14}/> Admin
        </Link>
      )}
    </header>
  );
}

function App() {
  return (
    <BrowserRouter>
      <div className="app-wrapper">
        <Navigation />
        <main className="app-main">
          <Routes>
            <Route path="/" element={<B2CFunnel />} />
            <Route path="/portal" element={<B2BPortal />} />
            <Route path="/admin" element={<AdminPortal />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
