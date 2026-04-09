import React, { useEffect, useState } from 'react';
import api from '../../utils/axios';
import { Link } from 'react-router-dom';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [tests, setTests] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [{ data: statsData }, { data: testsData }] = await Promise.all([
          api.get('/analytics'),
          api.get('/tests')
        ]);
        setStats(statsData);
        setTests(testsData);
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, []);

  const toggleActive = async (id, currentIsActive) => {
    try {
      await api.put(`/tests/${id}`, { isActive: !currentIsActive });
      setTests(tests.map(t => t._id === id ? { ...t, isActive: !currentIsActive } : t));
    } catch (err) {
      alert('Failed to update test active status: ' + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2>Admin Dashboard</h2>
        <div>
          <Link to="/admin/course-domain" className="btn btn-secondary" style={{ marginRight: '1rem' }}>Course / Domain View</Link>
          <Link to="/admin/test/create" className="btn">Create New Test</Link>
        </div>
      </div>

      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
          <div className="card" style={{ textAlign: 'center' }}>
            <h3 style={{ color: 'var(--text-muted)' }}>Total Tests</h3>
            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--primary)' }}>{stats.totalTests}</div>
          </div>
          <div className="card" style={{ textAlign: 'center' }}>
            <h3 style={{ color: 'var(--text-muted)' }}>Candidates</h3>
            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--primary)' }}>{stats.totalCandidates}</div>
          </div>
          <div className="card" style={{ textAlign: 'center' }}>
            <h3 style={{ color: 'var(--text-muted)' }}>Submissions</h3>
            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--primary)' }}>{stats.totalSubmissions}</div>
          </div>
          <div className="card" style={{ textAlign: 'center' }}>
            <h3 style={{ color: 'var(--text-muted)' }}>Avg Score</h3>
            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--primary)' }}>{stats.averageScore}%</div>
          </div>
        </div>
      )}

      <h3>Manage Tests</h3>
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--surface-color-light)', textAlign: 'left' }}>
              <th style={{ padding: '1rem' }}>Title</th>
              <th style={{ padding: '1rem' }}>Status</th>
              <th style={{ padding: '1rem' }}>Active</th>
              <th style={{ padding: '1rem' }}>Duration</th>
              <th style={{ padding: '1rem' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {tests.map(test => (
              <tr key={test._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '1rem' }}>{test.title}</td>
                <td style={{ padding: '1rem' }}>
                  <span style={{ 
                    padding: '0.25rem 0.5rem', 
                    borderRadius: '1rem', 
                    fontSize: '0.875rem',
                    backgroundColor: test.status === 'published' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(148, 163, 184, 0.2)',
                    color: test.status === 'published' ? 'var(--success)' : 'var(--text-muted)'
                  }}>
                    {test.status}
                  </span>
                </td>
                <td style={{ padding: '1rem' }}>
                  <span style={{ 
                    padding: '0.25rem 0.5rem', 
                    borderRadius: '1rem', 
                    fontSize: '0.875rem',
                    backgroundColor: test.isActive !== false ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                    color: test.isActive !== false ? 'var(--success)' : 'var(--danger)'
                  }}>
                    {test.isActive !== false ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td style={{ padding: '1rem' }}>{test.duration} mins</td>
                <td style={{ padding: '1rem' }}>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Link to={`/admin/test/${test._id}/questions`} className="btn" style={{ fontSize: '0.875rem', padding: '0.25rem 0.75rem' }}>Questions</Link>
                    <Link to={`/admin/test/${test._id}/submissions`} className="btn btn-secondary" style={{ fontSize: '0.875rem', padding: '0.25rem 0.75rem' }}>Submissions</Link>
                    <button 
                      onClick={() => toggleActive(test._id, test.isActive !== false)}
                      style={{ 
                        fontSize: '0.875rem', 
                        padding: '0.25rem 0.75rem', 
                        cursor: 'pointer', 
                        backgroundColor: test.isActive !== false ? '#dc2626' : '#10b981', 
                        color: 'white', 
                        border: 'none', 
                        borderRadius: '0.375rem' 
                      }}
                    >
                      {test.isActive !== false ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {tests.length === 0 && (
              <tr>
                <td colSpan="4" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No tests created yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminDashboard;
