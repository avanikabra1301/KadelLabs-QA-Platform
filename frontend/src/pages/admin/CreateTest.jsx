import React, { useState } from 'react';
import api from '../../utils/axios';
import { useNavigate } from 'react-router-dom';

const CreateTest = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState(60);
  const [course, setCourse] = useState('');
  const [domain, setDomain] = useState('');
  const [randomQuestionsCount, setRandomQuestionsCount] = useState(0);
  const [randomizeQuestions, setRandomizeQuestions] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/tests', { title, description, duration, course, domain, randomQuestionsCount, randomizeQuestions, isActive });
      navigate(`/admin/test/${data._id}/questions`);
    } catch (err) {
      alert('Failed to create test: ' + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <div className="card">
        <h2>Create New Test</h2>
        <form onSubmit={handleSubmit} style={{ marginTop: '1.5rem' }}>
          <div>
            <label>Test Title</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} required />
          </div>
          <div>
            <label>Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows="4" />
          </div>
          <div>
            <label>Duration (minutes)</label>
            <input type="number" min="1" value={duration} onChange={e => setDuration(Number(e.target.value))} required />
          </div>
          <div>
            <label>Program Requirement</label>
            <select value={course} onChange={(e) => setCourse(e.target.value)} required>
              <option value="">Select Program</option>
              <option value="Prarambh">Prarambh</option>
              <option value="Navpath">Navpath</option>
              <option value="Utkarsh">Utkarsh</option>
            </select>
          </div>
          <div>
            <label>Domain Requirement</label>
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
            </select>
          </div>
          <div>
            <label>Random Questions Count (0 for all)</label>
            <input type="number" min="0" value={randomQuestionsCount} onChange={e => setRandomQuestionsCount(Number(e.target.value))} />
            <small style={{ display: 'block', color: 'var(--text-muted)' }}>If greater than 0, candidates will get a random subset of this size from the total question pool.</small>
          </div>
          <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input type="checkbox" id="randomizeQuestions" checked={randomizeQuestions} onChange={e => setRandomizeQuestions(e.target.checked)} style={{ width: 'auto', accentColor: 'var(--primary)' }} />
            <label htmlFor="randomizeQuestions" style={{ margin: 0 }}>Randomize Questions Order Per Candidate</label>
          </div>
          <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input type="checkbox" id="isActive" checked={isActive} onChange={e => setIsActive(e.target.checked)} style={{ width: 'auto', accentColor: 'var(--primary)' }} />
            <label htmlFor="isActive" style={{ margin: 0 }}>Test is Active</label>
          </div>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
            <button type="submit" className="btn">Create Test & Add Questions</button>
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/admin')}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTest;
