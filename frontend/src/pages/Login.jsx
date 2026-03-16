import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [name, setName] = useState('');
  const [degree, setDegree] = useState('');
  const [college, setCollege] = useState('');
  const [error, setError] = useState('');
  const { candidateLogin } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await candidateLogin(name, degree, college);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '4rem auto' }}>
      <div className="card">
        <h2 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>KadelLabs L&D Portal</h2>
        {error && <div style={{ color: 'var(--danger)', marginBottom: '1rem', textAlign: 'center' }}>{error}</div>}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label>Full Name</label>
            <input 
              type="text" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              required 
              placeholder="E.g. John Doe"
            />
          </div>
          <div>
            <label>Degree / Specialization</label>
            <input 
              type="text" 
              value={degree} 
              onChange={(e) => setDegree(e.target.value)} 
              required 
              placeholder="E.g. B.Tech Computer Science"
            />
          </div>
          <div>
            <label>College Name</label>
            <input 
              type="text" 
              value={college} 
              onChange={(e) => setCollege(e.target.value)} 
              required 
              placeholder="Enter your college name"
            />
          </div>
          <button type="submit" className="btn" style={{ width: '100%', marginTop: '0.5rem' }}>
            Start Test
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
