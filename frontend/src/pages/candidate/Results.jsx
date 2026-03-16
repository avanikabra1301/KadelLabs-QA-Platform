import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../utils/axios';

const Results = () => {
  const { id } = useParams();
  const [submission, setSubmission] = useState(null);

  useEffect(() => {
    const fetchResult = async () => {
      try {
        const { data } = await api.get('/submissions/my');
        const currentSub = data.find(s => s._id === id);
        setSubmission(currentSub);
      } catch (err) {
        console.error(err);
      }
    };
    fetchResult();
  }, [id]);

  if (!submission) return <div style={{ textAlign: 'center', marginTop: '4rem' }}>Loading...</div>;

  return (
    <div style={{ maxWidth: '600px', margin: '4rem auto', textAlign: 'center' }}>
      <div className="card">
        <h2 style={{ color: 'var(--success)', marginBottom: '1rem', fontSize: '2rem' }}>Thank You!</h2>
        <p style={{ fontSize: '1.2rem', marginBottom: '2rem', color: 'var(--text-color)' }}>
          You have successfully completed the <strong>{submission.testId?.title}</strong> assessment.
        </p>
        <p style={{ color: 'var(--text-muted)', marginBottom: '3rem' }}>
          Your responses have been recorded and will be reviewed by the administrative team. 
          You may now close this tab or return to the dashboard.
        </p>
        
        <Link to="/candidate" className="btn btn-secondary">Return to Dashboard</Link>
      </div>
    </div>
  );
};

export default Results;
