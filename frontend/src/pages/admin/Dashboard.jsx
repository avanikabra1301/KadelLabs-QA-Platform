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
    <div style={{ paddingBottom: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ marginBottom: '0.25rem' }}>Management Dashboard</h2>
          <p style={{ color: 'var(--text-muted)' }}>Overview of your assessments, candidate submissions, and platform activity.</p>
        </div>
      </div>

      {stats && (
        <div style={{ 
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
          gap: '1.5rem', marginBottom: '2.5rem' 
        }}>
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '1.5rem' }}>
            <h4 style={{ color: 'var(--text-muted)', margin: 0, fontWeight: 500 }}>Active Tests</h4>
            <div style={{ fontSize: '2.25rem', fontWeight: 'bold', color: 'var(--success)' }}>{stats.activeTests}</div>
          </div>
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '1.5rem' }}>
            <h4 style={{ color: 'var(--text-muted)', margin: 0, fontWeight: 500 }}>Total Tests</h4>
            <div style={{ fontSize: '2.25rem', fontWeight: 'bold', color: 'var(--primary)' }}>{stats.totalTests}</div>
          </div>
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '1.5rem' }}>
            <h4 style={{ color: 'var(--text-muted)', margin: 0, fontWeight: 500 }}>Global Candidates</h4>
            <div style={{ fontSize: '2.25rem', fontWeight: 'bold', color: 'var(--primary)' }}>{stats.totalCandidates}</div>
          </div>
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '1.5rem' }}>
            <h4 style={{ color: 'var(--text-muted)', margin: 0, fontWeight: 500 }}>Completed Submissions</h4>
            <div style={{ fontSize: '2.25rem', fontWeight: 'bold', color: 'var(--primary)' }}>{stats.totalSubmissions}</div>
          </div>
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '1.5rem' }}>
            <h4 style={{ color: 'var(--text-muted)', margin: 0, fontWeight: 500 }}>Average Platform Score</h4>
            <div style={{ fontSize: '2.25rem', fontWeight: 'bold', color: 'var(--primary)' }}>{stats.averageScore}%</div>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '2rem', alignItems: 'start' }}>
        
        {/* Left Column - Main Content */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ margin: 0 }}>Active Test Catalog</h3>
          </div>
          
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--surface-color-light)', textAlign: 'left' }}>
                  <th style={{ padding: '1rem' }}>Test Information</th>
                  <th style={{ padding: '1rem' }}>Config</th>
                  <th style={{ padding: '1rem' }}>Status</th>
                  <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tests.map(test => (
                  <tr key={test._id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background-color 0.2s', ':hover': { backgroundColor: 'var(--surface-color-light)' } }}>
                    <td style={{ padding: '1.25rem 1rem' }}>
                      <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>{test.title}</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{test.course} • {test.domain}</div>
                    </td>
                    <td style={{ padding: '1.25rem 1rem' }}>
                      <span style={{ fontSize: '0.875rem' }}>⏱ {test.duration} mins</span>
                    </td>
                    <td style={{ padding: '1.25rem 1rem' }}>
                      <span style={{ 
                        padding: '0.25rem 0.6rem', 
                        borderRadius: '0.5rem', 
                        fontSize: '0.75rem',
                        fontWeight: 'bold',
                        backgroundColor: test.isActive !== false ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                        color: test.isActive !== false ? 'var(--success)' : 'var(--danger)'
                      }}>
                        {test.isActive !== false ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </td>
                    <td style={{ padding: '1.25rem 1rem', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <Link to={`/admin/test/${test._id}/questions`} className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '0.4rem 0.8rem' }}>Edit Details</Link>
                        <Link to={`/admin/test/${test._id}/submissions`} className="btn" style={{ fontSize: '0.75rem', padding: '0.4rem 0.8rem' }}>Submissions</Link>
                        <button 
                          onClick={() => toggleActive(test._id, test.isActive !== false)}
                          style={{ 
                            fontSize: '0.75rem', padding: '0.4rem 0.8rem', cursor: 'pointer', fontWeight: 'bold',
                            backgroundColor: test.isActive !== false ? 'transparent' : 'var(--success)', 
                            color: test.isActive !== false ? 'var(--danger)' : 'white', 
                            border: test.isActive !== false ? '1px solid var(--danger)' : '1px solid var(--success)', 
                            borderRadius: '0.375rem' 
                          }}
                        >
                          {test.isActive !== false ? 'Suspend' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {tests.length === 0 && (
                  <tr>
                    <td colSpan="4" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>No tests deployed yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column - Sidebar Widgets */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Quick Actions */}
          <div className="card">
            <h4 style={{ margin: '0 0 1rem 0' }}>Quick Actions</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <Link to="/admin/test/create" className="btn" style={{ display: 'block', textAlign: 'center', padding: '0.8rem', fontSize: '0.9rem' }}>
                ➕ Deploy New Test
              </Link>
              <Link to="/admin/course-domain" className="btn btn-secondary" style={{ display: 'block', textAlign: 'center', padding: '0.8rem', fontSize: '0.9rem' }}>
                📂 View Candidates by L&D Programs
              </Link>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="card">
            <h4 style={{ margin: '0 0 1.25rem 0' }}>Recent Activity</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {stats?.recentSubmissions?.length > 0 ? stats.recentSubmissions.map((sub, idx) => (
                <div key={`sub-${sub._id}-${idx}`} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                  <div style={{ padding: '0.5rem', backgroundColor: 'rgba(16, 185, 129, 0.1)', borderRadius: '50%', color: 'var(--success)' }}>
                    ✓
                  </div>
                  <div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 'bold' }}>{sub.candidateId?.name || 'Candidate'} completed</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--primary)' }}>{sub.testId?.title}</div>
                  </div>
                </div>
              )) : (
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No recent submissions.</div>
              )}
              
              <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)' }} />
              
              {stats?.recentTests?.length > 0 ? stats.recentTests.map((t, idx) => (
                <div key={`test-${t._id}-${idx}`} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                  <div style={{ padding: '0.5rem', backgroundColor: 'rgba(139, 92, 246, 0.1)', borderRadius: '50%', color: 'var(--primary)' }}>
                    ✦
                  </div>
                  <div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 'bold' }}>New Test Created</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t.title} ({t.course} / {t.domain})</div>
                  </div>
                </div>
              )) : null}
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
