import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';
import Login from './pages/Login';
import AdminLogin from './pages/AdminLogin';
import Register from './pages/Register';
import AdminDashboard from './pages/admin/Dashboard';
import CreateTest from './pages/admin/CreateTest';
import ManageQuestions from './pages/admin/ManageQuestions';
import ViewSubmissions from './pages/admin/ViewSubmissions';
import CandidateDashboard from './pages/candidate/Dashboard';
import TakeTest from './pages/candidate/TakeTest';
import Results from './pages/candidate/Results';

import CourseDomainFlow from './pages/admin/CourseDomainFlow';

const PrivateRoute = ({ children, roles }) => {
  const { user, loading } = useContext(AuthContext);
  
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/" />;
  if (roles && !roles.includes(user.role)) return <Navigate to={user.role === 'admin' ? "/admin" : "/candidate"} />;
  
  return children;
};

function App() {
  const { user, logout } = useContext(AuthContext);
  const [theme, setTheme] = React.useState('dark');

  React.useEffect(() => {
    document.body.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  return (
    <Router>
      <div className="app-container">
        {user && (
          <nav className="navbar">
            <div className="nav-brand" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <svg width="30" height="30" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="100" height="100" rx="20" fill="url(#paint0_linear)"/>
                <path d="M50 25L75 45V75H25V45L50 25Z" fill="white"/>
                <defs>
                  <linearGradient id="paint0_linear" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#818CF8"/>
                    <stop offset="1" stopColor="#C084FC"/>
                  </linearGradient>
                </defs>
              </svg>
              KadelLabs L&D
            </div>
            <div className="nav-user" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <button 
                onClick={toggleTheme} 
                className="btn btn-secondary" 
                style={{ borderRadius: '50%', padding: '0.5rem', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                title="Toggle Theme"
              >
                {theme === 'dark' ? '☀️' : '🌙'}
              </button>
              <span>{user.name} ({user.role})</span>
              <button 
                onClick={() => { 
                  if(window.confirm('Are you sure you want to logout?')) logout(); 
                }} 
                className="btn btn-secondary"
              >
                Logout
              </button>
            </div>
          </nav>
        )}
        <main className="main-content">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={
              user ? (user.role === 'admin' ? <Navigate to="/admin" /> : <Navigate to="/candidate" />) : <Login />
            } />
            <Route path="/admin-login" element={user ? <Navigate to="/admin" /> : <AdminLogin />} />
            <Route path="/admin-register" element={user ? <Navigate to="/admin" /> : <Register />} />
            
            {/* Admin Routes */}
            <Route path="/admin" element={<PrivateRoute roles={['admin']}><AdminDashboard /></PrivateRoute>} />
            <Route path="/admin/test/create" element={<PrivateRoute roles={['admin']}><CreateTest /></PrivateRoute>} />
            <Route path="/admin/test/:id/questions" element={<PrivateRoute roles={['admin']}><ManageQuestions /></PrivateRoute>} />
            <Route path="/admin/test/:id/submissions" element={<PrivateRoute roles={['admin']}><ViewSubmissions /></PrivateRoute>} />
            <Route path="/admin/course-domain" element={<PrivateRoute roles={['admin']}><CourseDomainFlow /></PrivateRoute>} />

            {/* Candidate Routes */}
            <Route path="/candidate" element={<PrivateRoute roles={['candidate']}><CandidateDashboard /></PrivateRoute>} />
            <Route path="/candidate/test/:id" element={<PrivateRoute roles={['candidate']}><TakeTest /></PrivateRoute>} />
            <Route path="/candidate/results/:id" element={<PrivateRoute roles={['candidate']}><Results /></PrivateRoute>} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
