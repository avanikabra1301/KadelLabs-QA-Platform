import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../utils/axios';

const CandidateDashboard = () => {
  const [availableTests, setAvailableTests] = useState([]);
  const [mySubmissions, setMySubmissions] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [{ data: testsData }, { data: subsData }] = await Promise.all([
          api.get('/tests'),
          api.get('/submissions/my')
        ]);
        setAvailableTests(testsData);
        setMySubmissions(subsData);
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, []);

  const handleStartTest = async (testId) => {
    try {
      const { data } = await api.post('/submissions/start', { testId });
      navigate(`/candidate/test/${testId}`);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to start test');
    }
  };

  const getSubmissionStatus = (testId) => {
    return mySubmissions.find(sub => sub.testId?._id === testId || sub.testId === testId);
  };

  return (
    <div>
      <h2 style={{ marginBottom: '2rem' }}>Candidate Dashboard</h2>
      
      <h3>Available Tests</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem', marginTop: '1rem' }}>
        {availableTests.map(test => {
          const submission = getSubmissionStatus(test._id);
          const isCompleted = submission && (submission.status === 'completed' || submission.status === 'auto_submitted');
          const isInProgress = submission && submission.status === 'in_progress';

          return (
            <div key={test._id} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ margin: '0 0 0.5rem 0' }}>{test.title}</h3>
              <p style={{ color: 'var(--text-muted)', flex: 1 }}>{test.description}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem' }}>
                <span style={{ fontSize: '0.875rem', fontWeight: 'bold' }}>
                  {test.duration} mins
                  {test.randomQuestionsCount > 0 ? ` • ${test.randomQuestionsCount} Qs` : ''}
                </span>
                
                {isCompleted ? (
                  <Link to={`/candidate/results/${submission._id}`} className="btn btn-secondary">View Results</Link>
                ) : isInProgress ? (
                  <button onClick={() => navigate(`/candidate/test/${test._id}`)} className="btn" style={{ backgroundColor: '#EAB308' }}>Resume</button>
                ) : (
                  <button onClick={() => handleStartTest(test._id)} className="btn">Start Test</button>
                )}
              </div>
            </div>
          );
        })}
        {availableTests.length === 0 && (
          <p style={{ color: 'var(--text-muted)' }}>No tests are currently available.</p>
        )}
      </div>
    </div>
  );
};

export default CandidateDashboard;
