import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [degree, setDegree] = useState('');
  const [college, setCollege] = useState('');
  const [course, setCourse] = useState('');
  const [domain, setDomain] = useState('');
  const [error, setError] = useState('');
  const { candidateLogin } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const nameRegex = /^[A-Za-z\s]+$/;
    if (!nameRegex.test(name) || !nameRegex.test(degree) || !nameRegex.test(college)) {
      setError('Name, Degree, and College must contain only alphabets and spaces');
      return;
    }
    if (!course || !domain) {
      setError('Please select both Course and Domain');
      return;
    }

    try {
      await candidateLogin(name, email, degree, college, course, domain);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div style={{ maxWidth: '500px', margin: '4rem auto' }}>
      <div className="card">
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          {/* SVG Placeholder Logo */}
          <svg width="60" height="60" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginBottom: '0.5rem' }}>
            <rect width="100" height="100" rx="20" fill="url(#paint0_linear)"/>
            <path d="M50 25L75 45V75H25V45L50 25Z" fill="white"/>
            <defs>
              <linearGradient id="paint0_linear" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
                <stop stopColor="#818CF8"/>
                <stop offset="1" stopColor="#C084FC"/>
              </linearGradient>
            </defs>
          </svg>
          <h2>KadelLabs L&D Portal</h2>
        </div>
        {error && <div style={{ color: 'var(--danger)', marginBottom: '1rem', textAlign: 'center', backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: '0.75rem', borderRadius: '0.5rem' }}>{error}</div>}
        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div style={{ gridColumn: 'span 2' }}>
            <label>Full Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required placeholder="E.g. John Doe" />
          </div>
          <div style={{ gridColumn: 'span 2' }}>
            <label>Email Address</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="john.doe@example.com" />
          </div>
          <div>
            <label>Degree / Specialization</label>
            <input type="text" value={degree} onChange={(e) => setDegree(e.target.value)} required placeholder="B.Tech CS" />
          </div>
          <div>
            <label>College Name</label>
            <input type="text" value={college} onChange={(e) => setCollege(e.target.value)} required placeholder="Enter college" />
          </div>
          <div>
            <label>Course</label>
            <select value={course} onChange={(e) => setCourse(e.target.value)} required>
              <option value="">Select Course</option>
              <option value="Prarambh">Prarambh</option>
              <option value="Navpath">Navpath</option>
              <option value="Utkarsh">Utkarsh</option>
            </select>
          </div>
          <div>
            <label>Domain</label>
            <select value={domain} onChange={(e) => setDomain(e.target.value)} required>
              <option value="">Select Domain</option>
              <option value="BA">BA</option>
              <option value="QA">QA</option>
              <option value="PHP">PHP</option>
              <option value="AIML">AIML</option>
              <option value="DE">DE</option>
            </select>
          </div>
          <div style={{ gridColumn: 'span 2' }}>
            <button type="submit" className="btn" style={{ width: '100%', marginTop: '0.5rem', padding: '0.75rem', fontSize: '1.1rem' }}>
              Start Test
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
