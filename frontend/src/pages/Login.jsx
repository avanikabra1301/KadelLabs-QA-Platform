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
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedDegree = degree.trim();
    const trimmedCollege = college.trim();
    const trimmedCourse = course.trim();
    const trimmedDomain = domain.trim();

    if (!trimmedName || !trimmedEmail || !trimmedDegree || !trimmedCollege || !trimmedCourse || !trimmedDomain) {
      setError('All fields are required and cannot be empty or only spaces');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setError('Invalid email format. Must include @ and a valid domain.');
      return;
    }
    if (!course || !domain) {
      setError('Please select both Course and Domain');
      return;
    }

    try {
      await candidateLogin(trimmedName, trimmedEmail, trimmedDegree, trimmedCollege, trimmedCourse, trimmedDomain);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div style={{ maxWidth: '500px', margin: '4rem auto' }}>
      <div className="card">
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          {/* KadelLabs Logo */}
          <img 
            src="https://images.crunchbase.com/image/upload/c_pad,h_256,w_256,f_auto,q_auto:eco,dpr_1/qnxq7anrihqczhrlwoyk" 
            alt="KadelLabs Logo" 
            style={{ width: '80px', height: '80px', marginBottom: '0.5rem', borderRadius: '12px', objectFit: 'contain' }} 
          />
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
            <label>Organization / College Name</label>
            <input type="text" value={college} onChange={(e) => setCollege(e.target.value)} required placeholder="Enter Organization / College Name" />
          </div>
          <div>
            <label>Program</label>
            <select value={course} onChange={(e) => setCourse(e.target.value)} required>
              <option value="">Select Program</option>
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
              <option value="MERN">MERN</option>
              <option value="HR">HR</option>
              <option value="Agentic AI">Agentic AI</option>
              <option value="DevOps">DevOps</option>
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
