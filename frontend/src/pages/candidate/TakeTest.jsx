import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../utils/axios';

const TakeTest = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [test, setTest] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [submission, setSubmission] = useState(null);
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [answers, setAnswers] = useState({}); // { questionId: [selectedOptions] }

  const timerRef = useRef(null);

  useEffect(() => {
    fetchTestDetails();
  }, [id]);

  useEffect(() => {
    if (!submission) return;

    // Anti-cheat: disable copy-paste
    const handleCopyPaste = async (e) => {
      e.preventDefault();
      alert("Copy/Paste is disabled during the test.");
      try {
        await api.put(`/submissions/${submission._id}/violation`, { type: 'copy_paste' });
      } catch (err) { console.error(err); }
    };
    document.addEventListener('copy', handleCopyPaste);
    document.addEventListener('paste', handleCopyPaste);

    // Anti-cheat: tab switching
    const handleVisibilityChange = async () => {
      if (document.hidden) {
        alert("Warning: Switching tabs during a test is not allowed and has been recorded.");
        try {
          await api.put(`/submissions/${submission._id}/violation`, { type: 'tab_switch' });
        } catch (err) { console.error(err); }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('copy', handleCopyPaste);
      document.removeEventListener('paste', handleCopyPaste);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [submission]);

  const fetchTestDetails = async () => {
    try {
      const [{ data: qData }, { data: subData }] = await Promise.all([
        api.get(`/questions/test/${id}`),
        api.get('/submissions/my')
      ]);
      
      const currentSub = subData.find(s => (s.testId?._id || s.testId) === id);
      if (!currentSub || currentSub.status !== 'in_progress') {
        navigate('/candidate');
        return;
      }

      setQuestions(qData);
      setSubmission(currentSub);
      setTest(currentSub.testId);

      // Load initial answers
      const loadedAnswers = {};
      currentSub.answers.forEach(ans => {
        loadedAnswers[ans.questionId] = ans.answers;
      });
      setAnswers(loadedAnswers);

      // Setup Timer
      // Assuming test duration is in minutes
      const durationMs = currentSub.testId.duration * 60 * 1000;
      const startTime = new Date(currentSub.startTime).getTime();
      const endTime = startTime + durationMs;
      
      const updateTimer = () => {
        const now = new Date().getTime();
        const remaining = Math.max(0, Math.floor((endTime - now) / 1000));
        setTimeLeft(remaining);
        
        if (remaining <= 0) {
          clearInterval(timerRef.current);
          handleAutoSubmit();
        }
      };
      
      updateTimer();
      timerRef.current = setInterval(updateTimer, 1000);

    } catch (err) {
      console.error(err);
      navigate('/candidate');
    }
  };

  const handleAutoSubmit = async () => {
    if (!submission) return;
    try {
      await api.post(`/submissions/${submission._id}/submit`, { isAutoSubmit: true });
      alert("Time is up! Test submitted automatically.");
      navigate(`/candidate/results/${submission._id}`);
    } catch (err) {
      console.error(err);
    }
  };

  const submitTestManual = async () => {
    if (window.confirm("Are you sure you want to submit your test?")) {
      try {
        await api.post(`/submissions/${submission._id}/submit`, { isAutoSubmit: false });
        navigate(`/candidate/results/${submission._id}`);
      } catch (err) {
        alert('Failed to submit: ' + (err.response?.data?.message || err.message));
      }
    }
  };

  const handleOptionChange = async (questionId, option, type, isChecked) => {
    const currentAns = answers[questionId] || [];
    let newAns;
    
    if (type === 'mcq' || type === 'short_answer') {
      newAns = [option];
    } else {
      // multiple select
      if (isChecked) {
        newAns = [...currentAns, option];
      } else {
        newAns = currentAns.filter(a => a !== option);
      }
    }

    setAnswers({ ...answers, [questionId]: newAns });

    // Auto-save to backend
    try {
      await api.put(`/submissions/${submission._id}/answer`, {
        questionId,
        answers: newAns
      });
    } catch (err) {
      console.error('Failed to autosave answer', err);
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (questions.length === 0 || !test) return <div style={{ textAlign: 'center', marginTop: '4rem' }}>Loading Test...</div>;

  const currentQ = questions[currentQuestionIndex];
  const progressPercent = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2>{test.title}</h2>
        <div style={{ 
          fontSize: '1.25rem', 
          fontWeight: 'bold', 
          color: timeLeft < 60 ? 'var(--danger)' : 'var(--primary)',
          backgroundColor: 'var(--surface-color)',
          padding: '0.5rem 1rem',
          borderRadius: '0.5rem',
          border: '1px solid var(--border-color)'
        }}>
          ⏱ {formatTime(timeLeft)}
        </div>
      </div>

      <div style={{ height: '6px', backgroundColor: 'var(--surface-color)', borderRadius: '3px', marginBottom: '2rem', overflow: 'hidden' }}>
        <div style={{ width: `${progressPercent}%`, height: '100%', backgroundColor: 'var(--primary)', transition: 'width 0.3s ease' }}></div>
      </div>

      <div className="card" style={{ minHeight: '300px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Question {currentQuestionIndex + 1} of {questions.length}</span>
          <h3 style={{ marginTop: '0.5rem' }}>{currentQ.text}</h3>
          
          <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {currentQ.type !== 'short_answer' ? currentQ.options.map((opt, idx) => {
              const checked = (answers[currentQ._id] || []).includes(opt);
              return (
                <label key={idx} style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.75rem', 
                  padding: '1rem', 
                  backgroundColor: checked ? 'rgba(79, 70, 229, 0.1)' : 'var(--bg-color)', 
                  border: `1px solid ${checked ? 'var(--primary)' : 'var(--border-color)'}`,
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}>
                  <input 
                    type={currentQ.type === 'mcq' ? 'radio' : 'checkbox'} 
                    name={`q-${currentQ._id}`}
                    value={opt}
                    checked={checked}
                    onChange={(e) => handleOptionChange(currentQ._id, opt, currentQ.type, e.target.checked)}
                  />
                  {opt}
                </label>
              );
            }) : (
              <textarea 
                rows="4"
                placeholder="Type your answer here..."
                value={(answers[currentQ._id] || [])[0] || ''}
                onChange={(e) => handleOptionChange(currentQ._id, e.target.value, currentQ.type, true)}
                style={{ width: '100%' }}
              />
            )}
          </div>
        </div>

        <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
          <button 
            className="btn btn-secondary" 
            disabled={currentQuestionIndex === 0}
            onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
          >
            Previous
          </button>
          
          {currentQuestionIndex === questions.length - 1 ? (
             <button className="btn" style={{ backgroundColor: 'var(--success)' }} onClick={submitTestManual}>Submit Final Test</button>
          ) : (
            <button className="btn" onClick={() => setCurrentQuestionIndex(prev => prev + 1)}>Next</button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TakeTest;
