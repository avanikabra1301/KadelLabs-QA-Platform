import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/axios';

const CourseDomainFlow = () => {
  const [step, setStep] = useState('course'); // 'course', 'domain', 'candidates'
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedDomain, setSelectedDomain] = useState(null);
  
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Constants
  const COURSES = ['Prarambh', 'Navpath', 'Utkarsh'];
  const DOMAINS = ['BA', 'QA', 'PHP', 'AIML', 'DE', 'MERN', 'HR', 'Agentic AI', 'DevOps'];

  useEffect(() => {
    const fetchAllSubmissions = async () => {
      try {
        const { data } = await api.get('/submissions/all');
        setSubmissions(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAllSubmissions();
  }, []);

  if (loading) return <div>Loading...</div>;

  // Filter Submissions
  const filteredSubmissions = submissions.filter(sub => {
    if (!sub.candidateId) return false;
    const isSameCourse = sub.candidateId.course === selectedCourse;
    const isSameDomain = sub.candidateId.domain === selectedDomain;
    return isSameCourse && isSameDomain;
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <h2>Candidate Program Flow</h2>
        <Link to="/admin" className="btn btn-secondary">Back to Dashboard</Link>
      </div>

      {step === 'course' && (
        <div>
          <h3>Step 1: Select Course</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginTop: '1.5rem' }}>
            {COURSES.map(course => (
              <div 
                key={course} 
                className="card" 
                style={{ cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s', padding: '3rem 1.5rem', border: '2px solid transparent' }}
                onClick={() => {
                  setSelectedCourse(course);
                  setStep('domain');
                }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = 'transparent'}
              >
                <h2 style={{ color: 'var(--primary)', margin: 0 }}>{course}</h2>
              </div>
            ))}
          </div>
        </div>
      )}

      {step === 'domain' && (
        <div>
          <button className="btn btn-secondary" onClick={() => setStep('course')} style={{ marginBottom: '1.5rem' }}>← Back to Courses</button>
          <h3>Step 2: Select Domain for <span style={{ color: 'var(--primary)' }}>{selectedCourse}</span></h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginTop: '1.5rem' }}>
            {DOMAINS.map(domain => (
              <div 
                key={domain} 
                className="card" 
                style={{ cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s', padding: '2rem 1rem', border: '2px solid transparent' }}
                onClick={() => {
                  setSelectedDomain(domain);
                  setStep('candidates');
                }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = 'transparent'}
              >
                <h3 style={{ margin: 0 }}>{domain}</h3>
              </div>
            ))}
          </div>
        </div>
      )}

      {step === 'candidates' && (
        <div>
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
            <button className="btn btn-secondary" onClick={() => setStep('domain')}>← Back to Domains</button>
          </div>
          <h3>Candidates mapping to <span style={{ color: 'var(--primary)' }}>{selectedCourse} / {selectedDomain}</span></h3>

          <div className="card" style={{ padding: 0, overflow: 'hidden', marginTop: '1.5rem' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--surface-color-light)', textAlign: 'left' }}>
                  <th style={{ padding: '1rem' }}>Candidate Info</th>
                  <th style={{ padding: '1rem' }}>Test Taken</th>
                  <th style={{ padding: '1rem' }}>Status</th>
                  <th style={{ padding: '1rem' }}>Score</th>
                  <th style={{ padding: '1rem' }}>Date Taken</th>
                </tr>
              </thead>
              <tbody>
                {filteredSubmissions.map(sub => (
                  <tr key={sub._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontWeight: 'bold' }}>{sub.candidateId.name}</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{sub.candidateId.email}</div>
                    </td>
                    <td style={{ padding: '1rem' }}>{sub.testId?.title || 'Unknown Test'}</td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{ 
                        padding: '0.25rem 0.5rem', 
                        borderRadius: '1rem', 
                        fontSize: '0.875rem',
                        backgroundColor: sub.status === 'in_progress' ? 'rgba(234, 179, 8, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                        color: sub.status === 'in_progress' ? '#EAB308' : 'var(--success)'
                      }}>
                        {sub.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', fontWeight: 'bold' }}>
                      {sub.status !== 'in_progress' ? `${sub.score} / ${sub.maxScore}` : 'Pending'}
                    </td>
                    <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>
                      {new Date(sub.startTime).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
                {filteredSubmissions.length === 0 && (
                  <tr>
                    <td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No submissions found for {selectedCourse} / {selectedDomain}.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseDomainFlow;
