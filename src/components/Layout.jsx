import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import tamaSymbol from '../assets/tamaSymbol.webp';

const navStyle = {
  display: 'flex',
  flexDirection: 'column',
  minHeight: '100vh',
};

const headerStyle = {
  background: 'var(--color-nav)',
  color: '#e7edee',
  padding: '0 24px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  height: '56px',
  flexShrink: 0,
};

const logoStyle = {
  fontWeight: 700,
  fontSize: '17px',
  color: '#fff',
  letterSpacing: '0.01em',
};

const contentStyle = {
  display: 'flex',
  flex: 1,
};

const sidebarStyle = {
  width: '200px',
  background: 'var(--color-surface)',
  borderRight: '1px solid var(--color-border)',
  padding: '16px 0',
  flexShrink: 0,
};

const mainStyle = {
  flex: 1,
  padding: '28px 32px',
  maxWidth: '900px',
};

const footerStyle = {
  background: 'var(--color-nav)',
  color: '#e7edee',
  fontSize: '12px',
  padding: '12px 24px',
  textAlign: 'center',
  marginTop: 'auto',
};

function SideLink({ to, children }) {
  return (
    <NavLink
      to={to}
      style={({ isActive }) => ({
        display: 'block',
        padding: '10px 20px',
        fontSize: '14px',
        fontWeight: isActive ? 700 : 500,
        color: isActive ? 'var(--color-primary)' : 'var(--color-text)',
        background: isActive ? '#e8f0dc' : 'transparent',
        borderLeft: isActive ? '3px solid var(--color-primary)' : '3px solid transparent',
        textDecoration: 'none',
        transition: 'all 0.1s',
      })}
    >
      {children}
    </NavLink>
  );
}

function BottomNavLink({ to, label, icon }) {
  return (
    <NavLink to={to} className={({ isActive }) => isActive ? 'active' : ''}>
      {icon}
      <span>{label}</span>
    </NavLink>
  );
}

const IconTime = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const IconExpense = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="9" y1="15" x2="15" y2="15" />
    <line x1="9" y1="11" x2="11" y2="11" />
  </svg>
);

const IconDashboard = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" />
    <rect x="14" y="3" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" />
  </svg>
);

const IconProjects = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
  </svg>
);

const IconAdmin = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

export default function Layout({ children }) {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div style={navStyle}>
      <header style={headerStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img src={tamaSymbol} alt="" style={{ width: '32px', height: '32px', borderRadius: '4px', objectFit: 'cover' }} />
          <span style={logoStyle}>Tamarack Environmental</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontSize: '13px', color: '#c6d8c6' }}>
            {currentUser?.name} {currentUser?.role === 'pm' && <span style={{ color: '#8fc08f', fontWeight: 700, fontSize: '11px', marginLeft: 4 }}>PM</span>}
          </span>
          <button
            onClick={handleLogout}
            style={{
              background: 'transparent',
              border: '1px solid #7a9a7a',
              color: '#e7edee',
              borderRadius: 'var(--radius)',
              padding: '5px 12px',
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            Sign Out
          </button>
        </div>
      </header>

      <div style={contentStyle}>
        <nav style={sidebarStyle} className="layout-sidebar">
          <div style={{ padding: '0 20px 10px', fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Tracking
          </div>
          <SideLink to="/time">Time Entry</SideLink>
          <SideLink to="/expenses">Expenses</SideLink>
          <SideLink to="/dashboard">Dashboard</SideLink>
          {currentUser?.role === 'pm' && (
            <>
              <div style={{ padding: '16px 20px 10px', fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Management
              </div>
              <SideLink to="/projects">Projects</SideLink>
              <SideLink to="/admin">Admin</SideLink>
            </>
          )}
        </nav>
        <main style={mainStyle} className="layout-main">
          {children}
        </main>
      </div>

      <footer style={footerStyle} className="layout-footer">
        © {new Date().getFullYear()} Tamarack Environmental. Internal use only.
      </footer>

      <nav className="layout-bottom-nav">
        <BottomNavLink to="/time" label="Time" icon={<IconTime />} />
        <BottomNavLink to="/expenses" label="Expenses" icon={<IconExpense />} />
        <BottomNavLink to="/dashboard" label="Dashboard" icon={<IconDashboard />} />
        {currentUser?.role === 'pm' && (
          <>
            <BottomNavLink to="/projects" label="Projects" icon={<IconProjects />} />
            <BottomNavLink to="/admin" label="Admin" icon={<IconAdmin />} />
          </>
        )}
      </nav>
    </div>
  );
}
