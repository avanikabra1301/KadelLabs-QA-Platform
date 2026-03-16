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

const PrivateRoute = ({ children, roles }) => {
  const { user, loading } = useContext(AuthContext);
  
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/" />;
  if (roles && !roles.includes(user.role)) return <Navigate to={user.role === 'admin' ? "/admin" : "/candidate"} />;
  
  return children;
};

function App() {
  const { user, logout } = useContext(AuthContext);

  return (
    <Router>
      <div className="app-container">
        {user && (
          <nav className="navbar">
            <div className="nav-brand">KadelLabs L&D</div>
            <div className="nav-user">
              <span style={{ marginRight: '1rem' }}>{user.name} ({user.role})</span>
              <button onClick={() => { logout(); }} className="btn btn-secondary">Logout</button>
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
