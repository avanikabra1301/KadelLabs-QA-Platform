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
  const [markedForReview, setMarkedForReview] = useState(new Set());
  const [hasStarted, setHasStarted] = useState(false);
  const [showReview, setShowReview] = useState(false);

  const toggleMarkForReview = () => {
    const currentQId = questions[currentQuestionIndex]._id;
    const newSet = new Set(markedForReview);
    if (newSet.has(currentQId)) {
      newSet.delete(currentQId);
    } else {
      newSet.add(currentQId);
    }
    setMarkedForReview(newSet);
  };

  const getQuestionStatusColor = (index, qId) => {
    if (index === currentQuestionIndex && !markedForReview.has(qId)) return 'var(--primary)';
    if (markedForReview.has(qId)) return '#EAB308'; // Bright yellow
    if (answers[qId] && answers[qId].length > 0) return 'var(--success)';
    return 'var(--surface-color)';
  };

  const timerRef = useRef(null);
  const isSubmittingRef = useRef(false);
  const submissionRef = useRef(null);
  const violationCountsRef = useRef({ tabSwitches: 0, copyPaste: 0 });
  const lastViolationTimeRef = useRef(0);

  useEffect(() => {
    fetchTestDetails();
  }, [id]);

  useEffect(() => {
    if (!submission) return;

    const handleViolation = async (type, reasonMsg) => {
      if (!hasStarted) return;
      
      const now = Date.now();
      // Generous 3s throttle protects against blur/resize/visibility cascading duplicates
      if (now - lastViolationTimeRef.current < 3000) return;
      lastViolationTimeRef.current = now;

      // Optimistically increment locally
      if (type === 'tab_switch') {
        violationCountsRef.current.tabSwitches += 1;
      } else {
        violationCountsRef.current.copyPaste += 1;
      }

      let currentCount = type === 'tab_switch' ? violationCountsRef.current.tabSwitches : violationCountsRef.current.copyPaste;

      try {
        const { data } = await api.put(`/submissions/${submission._id}/violation`, { type });
        if (type === 'tab_switch' && data.tabSwitches !== undefined) {
          violationCountsRef.current.tabSwitches = data.tabSwitches;
          currentCount = data.tabSwitches;
        } else if (type === 'copy_paste' && data.copyPasteAttempts !== undefined) {
          violationCountsRef.current.copyPaste = data.copyPasteAttempts;
          currentCount = data.copyPasteAttempts;
        }
      } catch (err) { console.error(err); }

      if (currentCount >= 3) {
        handleAutoSubmit(`Maximum warnings exceeded (${reasonMsg}).`);
      } else {
        alert(`Warning: ${reasonMsg} is not allowed. Attempt ${currentCount}/3. Your test will submit automatically after 3 warnings.`);
      }
    };

    const handleFullscreenChange = () => {
      if (hasStarted && !document.fullscreenElement && !document.webkitIsFullScreen && !document.mozFullScreen && !document.msFullscreenElement) {
        handleViolation('tab_switch', 'Exiting fullscreen');
      }
    };

    const handleCopyPaste = (e) => {
      e.preventDefault();
      handleViolation('copy_paste', 'Copy/Paste');
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        handleViolation('tab_switch', 'Switching tabs');
      }
    };

    const handleBlur = () => {
      handleViolation('tab_switch', 'Leaving the test window (Focus loss)');
    };

    const handleResize = () => {
      if (window.innerWidth < window.screen.width * 0.9 || window.innerHeight < window.screen.height * 0.9) {
        handleViolation('tab_switch', 'Window resizing or split-screening');
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('copy', handleCopyPaste);
    document.addEventListener('paste', handleCopyPaste);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('resize', handleResize);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('copy', handleCopyPaste);
      document.removeEventListener('paste', handleCopyPaste);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('resize', handleResize);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [submission, hasStarted]);

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
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(err => console.log(err));
      }
      alert(`${reason} Test submitted automatically.`);
      navigate(`/candidate/results/${activeSub._id}`);
    } catch (err) {
      console.error(err);
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  const triggerReview = () => {
    setShowReview(true);
  };

  const confirmSubmit = async () => {
    if (isSubmittingRef.current) return;
    if (!window.confirm("Are you absolutely sure you want to finish the test? This cannot be undone.")) return;
    isSubmittingRef.current = true;
    setIsSubmitting(true);
    try {
      await api.post(`/submissions/${submission._id}/submit`, { isAutoSubmit: false });
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(err => console.log(err));
      }
      navigate(`/candidate/results/${submission._id}`);
    } catch (err) {
      alert('Failed to submit: ' + (err.response?.data?.message || err.message));
      isSubmittingRef.current = false;
      setIsSubmitting(false);
      setShowReview(false);
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

  const enterFullscreen = async () => {
    const elem = document.documentElement;
    try {
      if (elem.requestFullscreen) {
        await elem.requestFullscreen();
      } else if (elem.webkitRequestFullscreen) { /* Safari */
        await elem.webkitRequestFullscreen();
      } else if (elem.msRequestFullscreen) { /* IE11 */
        await elem.msRequestFullscreen();
      }
    } catch (err) {
      alert("Please allow fullscreen to take the test.");
    }
    setHasStarted(true);
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (questions.length === 0 || !test) return <div style={{ textAlign: 'center', marginTop: '4rem' }}>Loading Test...</div>;

  if (!hasStarted) {
    return (
      <div style={{ maxWidth: '800px', margin: '4rem auto', textAlign: 'center' }}>
        <div className="card">
          <h2 style={{ marginBottom: '1.5rem', fontSize: '2rem' }}>Welcome to {test.title}</h2>
          <div style={{ padding: '1.5rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--danger)', borderRadius: '0.75rem', marginBottom: '2rem', textAlign: 'left' }}>
             <h3 style={{ color: 'var(--danger)', marginTop: 0 }}>🚨 Strict Exam Environment</h3>
             <ul style={{ color: 'var(--text-main)', lineHeight: '1.6', margin: '0' }}>
               <li>This test will execute in <strong>Fullscreen Mode</strong>.</li>
               <li>Do not exit fullscreen, switch tabs, or minimize the window.</li>
               <li>Suspicious activity will be logged and may lead to automatic disqualification.</li>
             </ul>
          </div>
          <button className="btn" onClick={enterFullscreen} style={{ fontSize: '1.1rem', padding: '1rem 2rem' }}>Start Exam Securely in Fullscreen</button>
        </div>
      </div>
    );
  }

  // The actual number of questions the candidate sees is questions.length (since we slice in backend).
  const currentQ = questions[currentQuestionIndex];
  const progressPercent = ((currentQuestionIndex + 1) / questions.length) * 100;
  
  const answeredCount = Object.keys(answers).filter(k => answers[k] && answers[k].length > 0 && !markedForReview.has(k)).length;
  const markedCount = markedForReview.size;
  const unansweredCount = questions.length - answeredCount - markedCount;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {showReview && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(15, 23, 42, 0.95)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="card" style={{ maxWidth: '600px', width: '100%', textAlign: 'center' }}>
            <h2 style={{ marginBottom: '1.5rem', fontSize: '1.75rem' }}>Review Before Submission</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
              <div style={{ padding: '1.5rem 1rem', backgroundColor: 'rgba(16, 185, 129, 0.1)', borderRadius: '0.75rem', color: 'var(--success)', border: '1px solid var(--success)' }}>
                 <h3 style={{ fontSize: '2rem', margin: '0 0 0.5rem 0' }}>{answeredCount}</h3>
                 <div style={{ fontSize: '0.875rem', fontWeight: 'bold' }}>Answered</div>
              </div>
              <div style={{ padding: '1.5rem 1rem', backgroundColor: 'rgba(234, 179, 8, 0.1)', borderRadius: '0.75rem', color: 'var(--warning)', border: '1px solid var(--warning)' }}>
                 <h3 style={{ fontSize: '2rem', margin: '0 0 0.5rem 0' }}>{markedCount}</h3>
                 <div style={{ fontSize: '0.875rem', fontWeight: 'bold' }}>Marked for Review</div>
              </div>
              <div style={{ padding: '1.5rem 1rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: '0.75rem', color: 'var(--danger)', border: '1px solid var(--danger)' }}>
                 <h3 style={{ fontSize: '2rem', margin: '0 0 0.5rem 0' }}>{unansweredCount}</h3>
                 <div style={{ fontSize: '0.875rem', fontWeight: 'bold' }}>Unanswered</div>
              </div>
            </div>
            <p style={{ marginBottom: '2rem', color: 'var(--text-muted)', fontSize: '1.1rem' }}>Are you absolutely sure you want to finish the test? You cannot change your answers after submission.</p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button className="btn btn-secondary" onClick={() => setShowReview(false)} disabled={isSubmitting} style={{ padding: '1rem 2rem', fontSize: '1.1rem' }}>Return to Test</button>
              <button className="btn" onClick={confirmSubmit} disabled={isSubmitting} style={{ backgroundColor: 'var(--success)', padding: '1rem 2rem', fontSize: '1.1rem' }}>
                {isSubmitting ? 'Submitting...' : 'Confirm Submission'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2>{test.title}</h2>
        <div style={{ 
          fontSize: '1.25rem', 
          fontWeight: 'bold', 
          color: timeLeft <= 60 ? 'var(--danger)' : (timeLeft <= 300 ? 'var(--warning)' : 'var(--primary)'),
          backgroundColor: timeLeft <= 60 ? 'rgba(239, 68, 68, 0.1)' : (timeLeft <= 300 ? 'rgba(234, 179, 8, 0.1)' : 'var(--surface-color)'),
          padding: '0.5rem 1rem',
          borderRadius: '0.5rem',
          border: `1px solid ${timeLeft <= 60 ? 'var(--danger)' : (timeLeft <= 300 ? 'var(--warning)' : 'var(--border-color)')}`,
          transition: 'all 0.3s ease',
          animation: timeLeft <= 300 && timeLeft > 0 ? 'pulse 1s infinite' : 'none'
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

      <div style={{ display: 'flex', gap: '2rem', flexDirection: 'row', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div className="card" style={{ flex: '1 1 600px', minHeight: '300px', display: 'flex', flexDirection: 'column' }}>
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

        <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)', flexWrap: 'wrap', gap: '1rem' }}>
          <button 
            className="btn btn-secondary" 
            disabled={currentQuestionIndex === 0 || isSubmitting}
            onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
            style={{ padding: '0.75rem 1.5rem', fontWeight: 'bold' }}
          >
            ← Previous
          </button>
          
            <button 
              className="btn btn-secondary" 
              onClick={toggleMarkForReview}
              style={{ 
                padding: '0.75rem 1.5rem', 
                fontWeight: 'bold', 
                backgroundColor: markedForReview.has(currentQ._id) ? '#EAB308' : 'var(--surface-color-light)', 
                color: markedForReview.has(currentQ._id) ? '#000' : 'var(--text-main)' 
              }}
            >
              {markedForReview.has(currentQ._id) ? '🟡 Unmark Review' : 'Mark for Review'}
            </button>
            
            <button 
              className="btn btn-secondary" 
              disabled={currentQuestionIndex === questions.length - 1 || isSubmitting}
              onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
              style={{ padding: '0.75rem 1.5rem', fontWeight: 'bold' }}
            >
              Next →
            </button>
  
            <button 
              className="btn" 
              style={{ backgroundColor: 'var(--success)', padding: '0.75rem 1.5rem', fontWeight: 'bold' }} 
              onClick={triggerReview}
              disabled={isSubmitting}
            >
              Submit Test
            </button>
          </div>
          </div>
  
          {/* Sidebar Navigation */}
          <div className="card" style={{ flex: '0 0 300px', padding: '1.5rem' }}>
            <h3 style={{ marginBottom: '1.5rem' }}>Question Navigation</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.75rem' }}>
              {questions.map((q, idx) => {
                const statusColor = getQuestionStatusColor(idx, q._id);
                const isCurrent = idx === currentQuestionIndex;
                return (
                  <button
                    key={q._id}
                    onClick={() => setCurrentQuestionIndex(idx)}
                    style={{
                      width: '100%',
                      aspectRatio: '1/1',
                      borderRadius: '50%',
                      border: `2px solid ${isCurrent ? 'var(--primary)' : 'var(--border-color)'}`,
                      backgroundColor: statusColor,
                      color: (statusColor === 'var(--surface-color)' && !isCurrent) ? 'var(--text-main)' : 'white',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: 0,
                      transition: 'all 0.2s',
                      boxShadow: isCurrent ? '0 0 0 2px rgba(79,70,229,0.3)' : 'none'
                    }}
                  >
                  {idx + 1}
                </button>
              );
            })}
          </div>
          
          <div style={{ marginTop: '2.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: 'var(--success)' }}></div> Answered
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: 'var(--warning)' }}></div> Marked for Review
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: '2px solid var(--primary)', backgroundColor: 'transparent' }}></div> Current
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)' }}></div> Not Answered
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TakeTest;
