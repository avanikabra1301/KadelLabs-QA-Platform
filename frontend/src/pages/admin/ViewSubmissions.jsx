import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../utils/axios';

const ViewSubmissions = () => {
  const { id } = useParams();
  const [test, setTest] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [scoreFilter, setScoreFilter] = useState('all');

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        const [{ data: testData }, { data: subData }] = await Promise.all([
          api.get(`/tests/${id}`),
          api.get(`/submissions/test/${id}`)
        ]);
        setTest(testData);
        setSubmissions(subData);
      } catch (err) {
        console.error(err);
      }
    };
    fetchSubmissions();
  }, [id]);

  if (!test) return <div>Loading...</div>;

  let filteredSubmissions = submissions.filter(sub => {
    // Text search
    const term = searchTerm.toLowerCase();
    const name = (sub.candidateId?.name || '').toLowerCase();
    const degree = (sub.candidateId?.degree || '').toLowerCase();
    const college = (sub.candidateId?.college || '').toLowerCase();
    const matchesSearch = name.includes(term) || degree.includes(term) || college.includes(term);

    // Score filter
    if (!matchesSearch) return false;
    if (scoreFilter === 'all') return true;

    // Only apply score filter to completed tests
    if (sub.status === 'in_progress') return scoreFilter === 'all';

    const percentage = sub.maxScore > 0 ? (sub.score / sub.maxScore) * 100 : 0;
    if (scoreFilter === 'above_90') return percentage >= 90;
    if (scoreFilter === 'above_80') return percentage >= 80;
    if (scoreFilter === 'above_70') return percentage >= 70;
    if (scoreFilter === 'above_60') return percentage >= 60;
    if (scoreFilter === 'below_60') return percentage < 60;

    return true;
  });

  // Sort if a score filter is applied (highest first)
  if (scoreFilter !== 'all') {
    filteredSubmissions.sort((a, b) => {
      const pA = a.maxScore > 0 ? (a.score / a.maxScore) : 0;
      const pB = b.maxScore > 0 ? (b.score / b.maxScore) : 0;
      return pB - pA;
    });
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2>Submissions for {test.title}</h2>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <input 
            type="text" 
            placeholder="Search Name, Degree or College..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ margin: 0, minWidth: '220px' }}
          />
          <select 
            value={scoreFilter} 
            onChange={(e) => setScoreFilter(e.target.value)}
            style={{ margin: 0 }}
          >
            <option value="all">All Scores</option>
            <option value="above_90">Top Scorers (&gt; 90%)</option>
            <option value="above_80">Above 80%</option>
            <option value="above_70">Above 70%</option>
            <option value="above_60">Passed (&gt; 60%)</option>
            <option value="below_60">Failed (&lt; 60%)</option>
          </select>
          <Link to="/admin" className="btn btn-secondary">Back to Dashboard</Link>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--surface-color-light)', textAlign: 'left' }}>
              <th style={{ padding: '1rem' }}>Candidate Name</th>
              <th style={{ padding: '1rem' }}>Degree / College</th>
              <th style={{ padding: '1rem' }}>Status</th>
              <th style={{ padding: '1rem' }}>Score</th>
              <th style={{ padding: '1rem' }}>Date Taken</th>
            </tr>
          </thead>
          <tbody>
            {filteredSubmissions.map(sub => (
              <React.Fragment key={sub._id}>
                <tr 
                  style={{ borderBottom: '1px solid var(--border-color)', cursor: 'pointer', backgroundColor: expandedId === sub._id ? 'var(--surface-color-light)' : 'transparent' }}
                  onClick={() => setExpandedId(expandedId === sub._id ? null : sub._id)}
                >
                  <td style={{ padding: '1rem' }}>
                    <span style={{ marginRight: '0.5rem', display: 'inline-block', transform: expandedId === sub._id ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}>▶</span>
                    {sub.candidateId?.name || 'Unknown'}
                  </td>
                  <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>
                    <div>{sub.candidateId?.degree || 'N/A'}</div>
                    <div style={{ fontSize: '0.8rem' }}>{sub.candidateId?.college || ''}</div>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ 
                      padding: '0.25rem 0.5rem', 
                      borderRadius: '1rem', 
                      fontSize: '0.875rem',
                      backgroundColor: sub.status === 'in_progress' ? 'rgba(234, 179, 8, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                      color: sub.status === 'in_progress' ? '#EAB308' : 'var(--success)'
                    }}>
                      {sub.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', fontWeight: 'bold' }}>
                    {sub.status !== 'in_progress' ? `${sub.score} / ${sub.maxScore}` : 'Pending'}
                  </td>
                  <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>
                    {new Date(sub.startTime).toLocaleDateString()} {new Date(sub.startTime).toLocaleTimeString()}
                  </td>
                </tr>
                {expandedId === sub._id && (
                  <tr style={{ backgroundColor: 'rgba(0,0,0,0.1)' }}>
                    <td colSpan="5" style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                         <div className="card" style={{ padding: '1rem', backgroundColor: 'var(--surface-color)' }}>
                            <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Attempt Duration</div>
                            <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
                              {sub.endTime ? `${Math.round((new Date(sub.endTime) - new Date(sub.startTime)) / 60000)} mins` : 'In Progress'}
                            </div>
                         </div>
                         <div className="card" style={{ padding: '1rem', backgroundColor: sub.tabSwitches > 0 ? 'rgba(239, 68, 68, 0.1)' : 'var(--surface-color)', border: sub.tabSwitches > 0 ? '1px solid var(--danger)' : 'none' }}>
                            <div style={{ fontSize: '0.875rem', color: sub.tabSwitches > 0 ? 'var(--danger)' : 'var(--text-muted)' }}>Tab Switch Violations</div>
                            <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: sub.tabSwitches > 0 ? 'var(--danger)' : 'inherit' }}>
                              {sub.tabSwitches || 0}
                            </div>
                         </div>
                         <div className="card" style={{ padding: '1rem', backgroundColor: sub.copyPasteAttempts > 0 ? 'rgba(239, 68, 68, 0.1)' : 'var(--surface-color)', border: sub.copyPasteAttempts > 0 ? '1px solid var(--danger)' : 'none' }}>
                            <div style={{ fontSize: '0.875rem', color: sub.copyPasteAttempts > 0 ? 'var(--danger)' : 'var(--text-muted)' }}>Copy/Paste Attempts</div>
                            <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: sub.copyPasteAttempts > 0 ? 'var(--danger)' : 'inherit' }}>
                              {sub.copyPasteAttempts || 0}
                            </div>
                         </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
            {filteredSubmissions.length === 0 && (
              <tr>
                <td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No submissions found for this test.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ViewSubmissions;
