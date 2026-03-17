import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../utils/axios';

const ManageQuestions = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [test, setTest] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [randomCount, setRandomCount] = useState(0);
  
  // Form state
  const [text, setText] = useState('');
  const [type, setType] = useState('mcq');
  const [options, setOptions] = useState(['', '', '', '']); // 4 default options
  const [correctAnswers, setCorrectAnswers] = useState(['']);
  const [points, setPoints] = useState(1);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchTestAndQuestions();
  }, [id]);

  const fetchTestAndQuestions = async () => {
    try {
      const [{ data: testData }, { data: qData }] = await Promise.all([
        api.get(`/tests/${id}`),
        api.get(`/questions/test/${id}`)
      ]);
      setTest(testData);
      setRandomCount(testData.randomQuestionsCount || 0);
      setQuestions(qData);
    } catch (err) {
      console.error(err);
    }
  };

  const handleOptionChange = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleAddQuestion = async (e) => {
    e.preventDefault();
    try {
      let finalOptions = type === 'short_answer' ? [] : options.filter(o => o.trim() !== '');
      let finalCorrectAnswers = type === 'short_answer' ? [correctAnswers[0]] : correctAnswers.filter(a => a.trim() !== '');

      await api.post('/questions', {
        testId: id,
        text,
        type,
        options: finalOptions,
        correctAnswers: finalCorrectAnswers,
        points
      });

      setText('');
      setOptions(['', '', '', '']);
      setCorrectAnswers(['']);
      fetchTestAndQuestions();
    } catch (err) {
      alert('Failed to add question: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleBulkImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    try {
      const { data } = await api.post(`/questions/test/${id}/import`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert(data.message);
      fetchTestAndQuestions();
    } catch (err) {
      alert('Failed to import questions: ' + (err.response?.data?.message || err.message));
    } finally {
      setUploading(false);
      e.target.value = ''; // Reset input
    }
  };

  const publishTest = async () => {
    try {
      await api.put(`/tests/${id}`, { status: 'published', randomQuestionsCount: randomCount });
      alert('Test published successfully!');
      navigate('/admin');
    } catch (err) {
      alert('Failed to publish');
    }
  };

  const handleUpdateRandomCount = async () => {
    try {
      await api.put(`/tests/${id}`, { randomQuestionsCount: randomCount });
      alert('Random questions count updated');
    } catch (err) {
      alert('Failed to update count');
    }
  };

  if (!test) return <div>Loading...</div>;

  return (
    <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
      <div style={{ flex: '1 1 400px' }}>
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2>Test: {test.title}</h2>
            {test.status !== 'published' && (
              <button onClick={publishTest} className="btn" style={{ backgroundColor: 'var(--success)' }}>Publish Test</button>
            )}
          </div>
          <p style={{ color: 'var(--text-muted)' }}>{test.description}</p>
          
          <div style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: 'var(--bg-color)', borderRadius: '0.5rem', border: '1px solid var(--border-color)', display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '0.875rem', fontWeight: 'bold' }}>Random Questions Count (0 for all)</label>
              <input 
                type="number" 
                min="0" 
                value={randomCount} 
                onChange={(e) => setRandomCount(Number(e.target.value))} 
                style={{ margin: '0.25rem 0 0', padding: '0.5rem' }}
              />
            </div>
            {test.status !== 'published' && (
              <button className="btn btn-secondary" onClick={handleUpdateRandomCount} style={{ alignSelf: 'flex-end', padding: '0.6rem 1rem' }}>Update</button>
            )}
          </div>

          <h3 style={{ marginTop: '2rem' }}>Questions added ({questions.length})</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
            {questions.map((q, idx) => (
              <div key={q._id} style={{ padding: '1rem', backgroundColor: 'var(--bg-color)', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }}>
                <strong>Q{idx + 1}: {q.text}</strong>
                <p style={{ margin: '0.5rem 0 0', fontSize: '0.875rem', color: 'var(--text-muted)' }}>Type: {q.type} | Points: {q.points}</p>
                {q.type !== 'short_answer' && (
                  <ul style={{ paddingLeft: '1.5rem', margin: '0.5rem 0', fontSize: '0.875rem' }}>
                    {q.options.map((opt, i) => (
                      <li key={i} style={{ color: q.correctAnswers.includes(opt) ? 'var(--success)' : 'inherit' }}>{opt}</li>
                    ))}
                  </ul>
                )}
                {q.type === 'short_answer' && (
                  <p style={{ fontSize: '0.875rem', color: 'var(--success)', marginTop: '0.5rem' }}>Answer: {q.correctAnswers[0]}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ flex: '1 1 400px', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <div className="card" style={{ backgroundColor: 'var(--surface-color-light)', border: '1px dashed var(--primary)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2>Bulk Import Questions</h2>
          </div>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            Upload an Excel (.xlsx) file to instantly import multiple questions. 
            Expected columns: <strong>Question Text, Type, Option 1, Option 2, Option 3, Option 4, Correct Answers, Points</strong>.
          </p>
          <div style={{ marginBottom: '1rem' }}>
            <a 
              href="http://localhost:5000/public/Question_Import_Template.xlsx" 
              download 
              className="btn btn-secondary" 
              style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem', display: 'inline-block' }}>
              ⬇ Download Example Template
            </a>
          </div>
          <div style={{ padding: '1.5rem', border: '2px dashed var(--border-color)', borderRadius: '0.5rem', textAlign: 'center', cursor: 'pointer', position: 'relative' }}>
            <input 
              type="file" 
              accept=".xlsx,.xls" 
              onChange={handleBulkImport} 
              disabled={uploading}
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
            />
            <div style={{ color: 'var(--primary)', fontWeight: 'bold' }}>
              {uploading ? 'Importing...' : 'Click or Drag Excel File Here'}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Formats accepted: .xlsx</div>
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2>Add Single Question</h2>
          </div>
          <form style={{ marginTop: '1.5rem' }} onSubmit={handleAddQuestion}>
            <div>
              <label>Question Type</label>
              <select value={type} onChange={e => setType(e.target.value)}>
                <option value="mcq">Single Choice (MCQ)</option>
                <option value="multiple_select">Multiple Select</option>
                <option value="short_answer">Short Answer (Text)</option>
              </select>
            </div>
            <div>
              <label>Question Text</label>
              <textarea value={text} onChange={e => setText(e.target.value)} required rows="3" />
            </div>
            
            {type !== 'short_answer' && (
              <div>
                <label>Options</label>
                {options.map((opt, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center' }}>
                    <input 
                      type="text" 
                      value={opt} 
                      onChange={e => handleOptionChange(idx, e.target.value)} 
                      placeholder={`Option ${idx + 1}`}
                      style={{ margin: 0 }}
                    />
                    <input 
                      type={type === 'mcq' ? 'radio' : 'checkbox'} 
                      name="correctAnswer"
                      checked={correctAnswers.includes(opt) && opt !== ''}
                      onChange={(e) => {
                        if (type === 'mcq') {
                          setCorrectAnswers([opt]);
                        } else {
                          if (e.target.checked) {
                            setCorrectAnswers([...correctAnswers, opt]);
                          } else {
                            setCorrectAnswers(correctAnswers.filter(a => a !== opt));
                          }
                        }
                      }}
                      style={{ width: 'auto' }}
                    />
                  </div>
                ))}
                <button type="button" className="btn btn-secondary" onClick={() => setOptions([...options, ''])} style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem' }}>+ Add Option</button>
              </div>
            )}

            {type === 'short_answer' && (
              <div>
                <label>Correct Answer Text</label>
                <input type="text" value={correctAnswers[0]} onChange={e => setCorrectAnswers([e.target.value])} required placeholder="Exact text expected" />
              </div>
            )}

            <div>
              <label>Points</label>
              <input type="number" min="1" value={points} onChange={e => setPoints(Number(e.target.value))} required />
            </div>

            <button type="submit" className="btn" style={{ width: '100%', marginTop: '1rem' }}>Add Question</button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ManageQuestions;
