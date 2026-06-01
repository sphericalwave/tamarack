import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import PMRoute from './components/PMRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import TimeEntry from './pages/TimeEntry';
import ExpenseEntry from './pages/ExpenseEntry';
import Dashboard from './pages/Dashboard';
import Admin from './pages/Admin';
import Projects from './pages/Projects';
import { initSeedData } from './data/seed';

initSeedData();

function RootRedirect() {
  const { currentUser } = useAuth();
  if (!currentUser) return <Navigate to="/login" replace />;
  return <Navigate to={currentUser.role === 'pm' ? '/admin' : '/time'} replace />;
}

export default function App() {
  return (
    <BrowserRouter basename="/tamarack">
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<RootRedirect />} />
          <Route path="/time" element={
            <ProtectedRoute><Layout><TimeEntry /></Layout></ProtectedRoute>
          } />
          <Route path="/expenses" element={
            <ProtectedRoute><Layout><ExpenseEntry /></Layout></ProtectedRoute>
          } />
          <Route path="/dashboard" element={
            <ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>
          } />
          <Route path="/projects" element={
            <PMRoute><Layout><Projects /></Layout></PMRoute>
          } />
          <Route path="/admin" element={
            <PMRoute><Layout><Admin /></Layout></PMRoute>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
