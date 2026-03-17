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
  const [isSubmitting, setIsSubmitting] = useState(false);

  const timerRef = useRef(null);
  const isSubmittingRef = useRef(false);
  const submissionRef = useRef(null);
  const violationCountsRef = useRef({ tabSwitches: 0, copyPaste: 0 });

  useEffect(() => {
    fetchTestDetails();
  }, [id]);

  useEffect(() => {
    if (!submission) return;

    // Anti-cheat: disable copy-paste
    const handleCopyPaste = async (e) => {
      e.preventDefault();
      violationCountsRef.current.copyPaste += 1;
      const count = violationCountsRef.current.copyPaste;
      
      try {
        await api.put(`/submissions/${submission._id}/violation`, { type: 'copy_paste' });
      } catch (err) { console.error(err); }

      if (count >= 3) {
        handleAutoSubmit("Maximum copy/paste attempts exceeded.");
      } else {
        alert(`Warning: Copy/Paste is disabled. Attempt ${count}/3. Your test will submit automatically after 3 attempts.`);
      }
    };
    
    // Anti-cheat: tab switching
    const handleVisibilityChange = async () => {
      if (document.hidden) {
        violationCountsRef.current.tabSwitches += 1;
        const count = violationCountsRef.current.tabSwitches;

        try {
          await api.put(`/submissions/${submission._id}/violation`, { type: 'tab_switch' });
        } catch (err) { console.error(err); }

        if (count >= 3) {
          handleAutoSubmit("Maximum tab switches exceeded.");
        } else {
          alert(`Warning: Switching tabs is not allowed. Attempt ${count}/3. Your test will submit automatically after 3 attempts.`);
        }
      }
    };

    document.addEventListener('copy', handleCopyPaste);
    document.addEventListener('paste', handleCopyPaste);
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
      submissionRef.current = currentSub;
      setTest(currentSub.testId);
      
      // Initialize violation counts from DB in case of page refresh
      violationCountsRef.current = {
        tabSwitches: currentSub.tabSwitches || 0,
        copyPaste: currentSub.copyPasteAttempts || 0
      };

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
          handleAutoSubmit("Time is up!");
        }
      };
      
      updateTimer();
      timerRef.current = setInterval(updateTimer, 1000);

    } catch (err) {
      console.error(err);
      navigate('/candidate');
    }
  };

  const handleAutoSubmit = async (reason = "Time is up!") => {
    const activeSub = submissionRef.current;
    if (!activeSub || isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setIsSubmitting(true);
    try {
      await api.post(`/submissions/${activeSub._id}/submit`, { isAutoSubmit: true });
      alert(`${reason} Test submitted automatically.`);
      navigate(`/candidate/results/${activeSub._id}`);
    } catch (err) {
      console.error(err);
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  const submitTestManual = async () => {
    if (isSubmittingRef.current) return;
    if (window.confirm("Are you sure you want to submit your test?")) {
      isSubmittingRef.current = true;
      setIsSubmitting(true);
      try {
        await api.post(`/submissions/${submission._id}/submit`, { isAutoSubmit: false });
        navigate(`/candidate/results/${submission._id}`);
      } catch (err) {
        alert('Failed to submit: ' + (err.response?.data?.message || err.message));
        isSubmittingRef.current = false;
        setIsSubmitting(false);
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

  // The actual number of questions the candidate sees is questions.length (since we slice in backend).
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
          backgroundColor: timeLeft < 60 ? 'rgba(239, 68, 68, 0.1)' : 'var(--surface-color)',
          padding: '0.5rem 1rem',
          borderRadius: '0.5rem',
          border: `1px solid ${timeLeft < 60 ? 'var(--danger)' : 'var(--border-color)'}`,
          transition: 'all 0.3s ease',
          animation: timeLeft < 60 && timeLeft > 0 ? 'pulse 1s infinite' : 'none'
        }}>
          ⏱ {formatTime(timeLeft)}
        </div>
      </div>

      {/* Adding a global keyframes style specifically for the dangerous timer pulse if it doesn't exist */}
      <style>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
      `}</style>

      <div style={{ height: '4px', backgroundColor: 'var(--surface-color)', borderRadius: '2px', marginBottom: '2rem', overflow: 'hidden' }}>
        <div style={{ width: `${progressPercent}%`, height: '100%', backgroundColor: 'var(--primary)', transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)' }}></div>
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
                  gap: '1rem', 
                  padding: '1.25rem', 
                  backgroundColor: checked ? 'rgba(79, 70, 229, 0.1)' : 'var(--surface-color)', 
                  border: `2px solid ${checked ? 'var(--primary)' : 'var(--border-color)'}`,
                  borderRadius: '0.75rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  transform: checked ? 'scale(1.01)' : 'scale(1)',
                  boxShadow: checked ? '0 4px 6px -1px rgba(79, 70, 229, 0.1)' : 'none',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseEnter={(e) => {
                  if (!checked) e.currentTarget.style.borderColor = 'var(--text-muted)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  if (!checked) e.currentTarget.style.borderColor = 'var(--border-color)';
                  e.currentTarget.style.transform = checked ? 'scale(1.01)' : 'scale(1)';
                }}
                >
                  <input 
                    type={currentQ.type === 'mcq' ? 'radio' : 'checkbox'} 
                    name={`q-${currentQ._id}`}
                    value={opt}
                    checked={checked}
                    onChange={(e) => handleOptionChange(currentQ._id, opt, currentQ.type, e.target.checked)}
                    style={{ 
                      width: '1.5rem', 
                      height: '1.5rem', 
                      margin: 0, 
                      cursor: 'pointer', 
                      accentColor: 'var(--primary)',
                      flexShrink: 0
                    }}
                  />
                  <span style={{ fontSize: '1.05rem', lineHeight: '1.5', fontWeight: checked ? '500' : '400' }}>{opt}</span>
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
            disabled={currentQuestionIndex === 0 || isSubmitting}
            onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
            style={{ padding: '0.75rem 1.5rem', fontWeight: 'bold' }}
          >
            ← Previous
          </button>
          
          {currentQuestionIndex === questions.length - 1 ? (
             <button 
                className="btn" 
                style={{ backgroundColor: 'var(--success)', padding: '0.75rem 1.5rem', fontWeight: 'bold' }} 
                onClick={submitTestManual}
                disabled={isSubmitting}
              >
               {isSubmitting ? 'Submitting...' : 'Submit Final Test'}
             </button>
          ) : (
            <button 
              className="btn" 
              disabled={isSubmitting}
              onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
              style={{ padding: '0.75rem 1.5rem', fontWeight: 'bold' }}
            >
              Next →
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TakeTest;
