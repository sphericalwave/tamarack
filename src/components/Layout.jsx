import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

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

const navLinksStyle = {
  display: 'flex',
  gap: '4px',
  alignItems: 'center',
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
        <span style={logoStyle}>Tamarack Environmental</span>
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
        <nav style={sidebarStyle}>
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
        <main style={mainStyle}>
          {children}
        </main>
      </div>

      <footer style={footerStyle}>
        © {new Date().getFullYear()} Tamarack Environmental. Internal use only.
      </footer>
    </div>
  );
}
