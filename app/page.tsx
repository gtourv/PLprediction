"use client";

import React, { useEffect, useMemo, useState } from 'react';

type ScoreDetail = { team: string; predicted: number; actual: number; score: number };

type Submission = {
  id: string;
  name: string;
  prediction: string[];
  created_at: string;
  score: { total: number; details: ScoreDetail[] };
  showAll?: boolean;
};

const initialTeams: string[] = [
  'Arsenal', 'Aston Villa', 'Bournemouth', 'Brentford', 'Brighton and Hove Albion',
  'Burnley', 'Chelsea', 'Crystal Palace', 'Everton', 'Fulham',
  'Leeds United', 'Liverpool', 'Manchester City', 'Manchester United', 'Newcastle United',
  'Nottingham Forest', 'Sunderland', 'Tottenham Hotspur', 'West Ham United', 'Wolverhampton Wanderers'
];

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<'submit' | 'leaderboard'>('submit');
  const [playerName, setPlayerName] = useState('');
  const [draggableTeams, setDraggableTeams] = useState<string[]>(initialTeams);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [alerts, setAlerts] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (activeTab === 'leaderboard') {
      refreshSubmissions();
    }
  }, [activeTab]);

  function pushAlert(message: string) {
    setAlerts((prev) => [...prev, message]);
    setTimeout(() => setAlerts((prev) => prev.slice(1)), 3000);
  }

  async function refreshSubmissions() {
    const res = await fetch('/api/submissions');
    if (res.ok) {
      const data = await res.json();
      setSubmissions(data.submissions);
    }
  }

  function onDragStart(e: React.DragEvent<HTMLLIElement>, index: number) {
    e.dataTransfer.setData('text/plain', String(index));
  }

  function onDragOver(e: React.DragEvent<HTMLUListElement>) {
    e.preventDefault();
  }

  function onDrop(e: React.DragEvent<HTMLUListElement>, index: number) {
    e.preventDefault();
    const fromIndex = Number(e.dataTransfer.getData('text/plain'));
    if (Number.isNaN(fromIndex)) return;
    if (fromIndex === index) return;
    setDraggableTeams((prev) => {
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(index, 0, moved);
      return next;
    });
  }

  async function submitPrediction() {
    if (!playerName.trim()) {
      pushAlert('Please enter your name!');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: playerName.trim(), prediction: draggableTeams }),
      });
      if (res.status === 409) {
        pushAlert('You have already submitted a prediction!');
      } else if (!res.ok) {
        pushAlert('Submission failed');
      } else {
        pushAlert('Prediction submitted successfully!');
        setPlayerName('');
        setDraggableTeams(initialTeams);
        setActiveTab('leaderboard');
        await refreshSubmissions();
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function updateStandings() {
    setIsUpdating(true);
    pushAlert('Searching for live standings...');
    try {
      const res = await fetch('/api/update-standings', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        pushAlert('Standings updated successfully!');
        if (Array.isArray(data.snippets) && data.snippets.length) {
          // Show a small snippet so the user sees it worked
          pushAlert(`Search snippet: ${data.snippets[0].slice(0, 120)}...`);
        }
        await refreshSubmissions();
      } else {
        pushAlert(data.error || 'Failed to update standings');
      }
    } finally {
      setIsUpdating(false);
    }
  }

  return (
    <div>
      <div className="floating-shapes">
        <div className="shape" style={{ width: 200, height: 200, top: '10%', left: '10%', animationDelay: '0s', position: 'absolute' } as any} />
        <div className="shape" style={{ width: 150, height: 150, top: '60%', right: '10%', animationDelay: '5s', position: 'absolute' } as any} />
        <div className="shape" style={{ width: 100, height: 100, bottom: '10%', left: '50%', animationDelay: '10s', position: 'absolute' } as any} />
      </div>

      <div className="container">
        <div className="header">
          <div className="logo">⚽</div>
          <h1>Premier League Prediction Game</h1>
          <p style={{ color: 'rgba(255, 255, 255, 0.7)' }}>2025-26 Season</p>
        </div>

        <div className="nav-tabs">
          <button className={`tab-btn ${activeTab === 'submit' ? 'active' : ''}`} onClick={() => setActiveTab('submit')}>Submit Prediction</button>
          <button className={`tab-btn ${activeTab === 'leaderboard' ? 'active' : ''}`} onClick={() => setActiveTab('leaderboard')}>Leaderboard</button>
        </div>

        {activeTab === 'submit' && (
          <div id="submit" className="content active">
            <div className="submit-form">
              <div className="form-group">
                <label htmlFor="playerName">Your Name</label>
                <input id="playerName" type="text" placeholder="Enter your name" value={playerName} onChange={(e) => setPlayerName(e.target.value)} />
              </div>

              <div className="form-group">
                <label>Drag to reorder teams (1st to 20th)</label>
                <ul className="teams-list" onDragOver={onDragOver}>
                  {draggableTeams.map((team, index) => (
                    <li key={team}
                        className="team-item"
                        draggable
                        onDragStart={(e) => onDragStart(e, index)}
                        onDrop={(e) => onDrop(e, index)}>
                      <span className="position-number">{index + 1}</span>
                      <span className="team-logo" />
                      <span>{team}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button className="submit-btn" onClick={submitPrediction} disabled={isSubmitting}>Submit Prediction</button>
            </div>
          </div>
        )}

        {activeTab === 'leaderboard' && (
          <div id="leaderboard" className="content active">
            <div className="leaderboard">
              <h2 style={{ marginBottom: 20, textAlign: 'center' as const }}>Current Standings</h2>
              <button className="update-btn" onClick={updateStandings} disabled={isUpdating}>Update Live Standings</button>

              <div id="submissions">
                {submissions.length === 0 ? (
                  <div className="empty-state">
                    <h3>No predictions yet</h3>
                    <p>Be the first to submit your prediction!</p>
                  </div>
                ) : (
                  submissions.map((sub, index) => {
                    const displayCount = sub.showAll ? 20 : 4;
                    return (
                      <div key={sub.id} className="submission-card">
                        <div className="submission-header">
                          <div>
                            <span style={{ fontSize: '2em', marginRight: 10 }}>{index === 0 ? '🏆' : index === 1 ? '🥈' : index === 2 ? '🥉' : ''}</span>
                            <span className="player-name">{sub.name}</span>
                          </div>
                          <div className="score-badge">Score: {sub.score.total}</div>
                        </div>
                        <div className="team-predictions">
                          {sub.score.details.slice(0, displayCount).map((detail) => (
                            <div key={`${sub.id}-${detail.team}`} className="prediction-item">
                              <span className="predicted-pos">{detail.predicted}</span>
                              <span>{detail.team}</span>
                              <span className={`prediction-score ${detail.score === 0 ? 'correct' : ''}`}>{detail.score === 0 ? '✓' : `+${detail.score}`}</span>
                            </div>
                          ))}
                        </div>
                        {sub.score.details.length > 4 && (
                          <button className="see-all-btn" onClick={() => {
                            setSubmissions((prev) => prev.map((s) => s.id === sub.id ? { ...s, showAll: !s.showAll } : s));
                          }}>
                            {sub.showAll ? 'Show Less' : 'See All 20 Teams'}
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="alerts" id="alerts">
        {alerts.map((msg, i) => (
          <div key={i} className="alert">{msg}</div>
        ))}
      </div>
    </div>
  );
}
