import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import tamaSymbol from '../assets/tamaTree.jpeg';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  function handleSubmit(e) {
    e.preventDefault();
    setError('');
    const user = login(email.trim().toLowerCase(), password);
    if (!user) {
      setError('Invalid email or password.');
      return;
    }
    navigate(user.role === 'pm' ? '/admin' : '/time');
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--color-surface)',
    }}>
      <div style={{ width: '100%', maxWidth: '380px', padding: '0 16px' }}>
        <div style={{
          background: 'var(--color-nav)',
          borderRadius: 'var(--radius) var(--radius) 0 0',
          padding: '24px',
          textAlign: 'center',
        }}>
          <img src={tamaSymbol} alt="Tamarack Environmental" style={{ width: '80px', marginBottom: '12px', borderRadius: '6px' }} />
          <div style={{ fontSize: '20px', fontWeight: 700, color: '#fff', letterSpacing: '0.01em' }}>
            Tamarack Environmental
          </div>
          <div style={{ fontSize: '13px', color: '#a8c4a8', marginTop: '4px' }}>
            Time & Expense Tracker
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="card"
          style={{ borderRadius: '0 0 var(--radius) var(--radius)', borderTop: 'none' }}
        >
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@tamarack.ca"
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <div style={{ color: 'var(--color-error)', fontSize: '13px', marginBottom: '12px' }}>
              {error}
            </div>
          )}

          <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
            Sign In
          </button>

        </form>
      </div>
    </div>
  );
}
