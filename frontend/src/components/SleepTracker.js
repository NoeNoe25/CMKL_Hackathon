import React, { useState } from 'react';
import './SleepTracker.css'; // You'll need to create this CSS file

function SleepTracker() {
  const [sleepRecords, setSleepRecords] = useState([]);
  const [bedtime, setBedtime] = useState('');
  const [waketime, setWaketime] = useState('');
  const [sleepQuality, setSleepQuality] = useState(3); // Default medium quality
  const [notes, setNotes] = useState('');
  const [showAnalysis, setShowAnalysis] = useState(false);

  // Calculate sleep duration
  const calculateDuration = (start, end) => {
    if (!start || !end) return '0h 0m';
    
    const startTime = new Date(`2000-01-01T${start}`);
    const endTime = new Date(`2000-01-01T${end}`);
    
    // Handle overnight sleep (if wake time is earlier than bedtime)
    if (endTime < startTime) {
      endTime.setDate(endTime.getDate() + 1);
    }
    
    const diffMs = endTime - startTime;
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  };

  // Add new sleep record
  const addSleepRecord = () => {
    if (!bedtime || !waketime) {
      alert('Please enter both bedtime and wake time');
      return;
    }
    
    const newRecord = {
      id: Date.now(),
      date: new Date().toISOString().split('T')[0],
      bedtime,
      waketime,
      duration: calculateDuration(bedtime, waketime),
      quality: sleepQuality,
      notes
    };
    
    setSleepRecords([...sleepRecords, newRecord]);
    resetForm();
  };

  // Reset form
  const resetForm = () => {
    setBedtime('');
    setWaketime('');
    setSleepQuality(3);
    setNotes('');
  };

  // Remove sleep record
  const removeRecord = (id) => {
    setSleepRecords(sleepRecords.filter(record => record.id !== id));
  };

  // Calculate weekly average
  const calculateWeeklyAverage = () => {
    if (sleepRecords.length === 0) return '0h 0m';
    
    let totalMinutes = 0;
    
    sleepRecords.slice(-7).forEach(record => {
      const [hours, mins] = record.duration.split('h ').map(part => parseInt(part));
      totalMinutes += hours * 60 + (mins || 0);
    });
    
    const avgMinutes = totalMinutes / Math.min(sleepRecords.length, 7);
    const hours = Math.floor(avgMinutes / 60);
    const minutes = Math.round(avgMinutes % 60);
    
    return `${hours}h ${minutes}m`;
  };

  // Get sleep quality analysis
  const getQualityAnalysis = () => {
    if (sleepRecords.length === 0) return [];
    
    const qualityCounts = [0, 0, 0, 0, 0]; // For ratings 1-5
    
    sleepRecords.slice(-7).forEach(record => {
      qualityCounts[record.quality - 1]++;
    });
    
    return qualityCounts;
  };

  return (
    <div className="sleep-tracker">
      <h2 id="main"> Sleep Tracker</h2>
      <p className="description">
        Track your sleep patterns to improve sleep quality and overall health.
      </p>

      <div className="sleep-form">
        <div className="form-row">
          <div className="form-group">
            <label>Bedtime*</label>
            <input
              type="time"
              value={bedtime}
              onChange={(e) => setBedtime(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Wake Time*</label>
            <input
              type="time"
              value={waketime}
              onChange={(e) => setWaketime(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Sleep Duration</label>
            <div className="duration-display">
              {calculateDuration(bedtime, waketime)}
            </div>
          </div>
        </div>

 <div className="form-group">
  <label>Sleep Quality (1-5)</label>
  <div className="quality-rating">
    {[1, 2, 3, 4, 5].map((star) => (
      <button
        key={star}
        className={`quality-star ${sleepQuality >= star ? 'active' : ''}`}
        onClick={() => setSleepQuality(star)}
        type="button"
        aria-label={`Rate ${star} star`}
      >
        {star <= 2 ? '😞' : star === 3 ? '😐' : star === 4 ? '🙂' : '😊'}
      </button>
    ))}
  </div>
  <div className="quality-value">Selected: {sleepQuality}/5</div>
</div>

        <div className="form-group">
          <label>Notes (optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any dreams, disturbances, or observations..."
          />
        </div>

        <div className="form-actions">
          <button className="add-btn" onClick={addSleepRecord}>
            Add Sleep Record
          </button>
          <button className="reset-btn" onClick={resetForm}>
            Reset
          </button>
        </div>
      </div>

      {sleepRecords.length > 0 && (
        <div className="sleep-records">
          <div className="records-header">
            <h3>Your Sleep Records</h3>
            <button 
              className="analysis-btn"
              onClick={() => setShowAnalysis(!showAnalysis)}
            >
              {showAnalysis ? 'Hide Analysis' : 'Show Analysis'}
            </button>
          </div>

          {showAnalysis && (
            <div className="sleep-analysis">
              <div className="analysis-card">
                <h4>Weekly Average Sleep</h4>
                <div className="average-display">
                  {calculateWeeklyAverage()}
                </div>
              </div>
              
              <div className="analysis-card">
                <h4>Sleep Quality This Week</h4>
                <div className="quality-bars">
                  {getQualityAnalysis().map((count, index) => (
                    <div key={index} className="quality-bar">
                      <div 
                        className="bar-fill"
                        style={{ height: `${(count / 7) * 100}%` }}
                      ></div>
                      <span>{index + 1}</span>
                    </div>
                  ))}
                </div>
                <div className="quality-legend">
                  <span>1 (Poor)</span>
                  <span>5 (Excellent)</span>
                </div>
              </div>
            </div>
          )}

          <div className="records-list">
            {sleepRecords.slice().reverse().map(record => (
              <div key={record.id} className="record-item">
                <div className="record-date">
                  {new Date(record.date).toLocaleDateString()}
                </div>
                <div className="record-times">
                  <span>🛌 {record.bedtime}</span>
                  <span>☀️ {record.waketime}</span>
                  <span>⏱️ {record.duration}</span>
                </div>
                <div className="record-quality">
                  {Array.from({ length: record.quality }).map((_, i) => (
                    <span key={i}>★</span>
                  ))}
                </div>
                {record.notes && (
                  <div className="record-notes">
                    📝: {record.notes}
                  </div>
                )}
                <button
                  className="remove-btn"
                  onClick={() => removeRecord(record.id)}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="sleep-tips">
        <h4>Sleep Improvement Tips</h4>
        <ul>
          <li>Maintain a consistent sleep schedule</li>
          <li>Avoid caffeine and screens before bedtime</li>
          <li>Keep your bedroom cool and dark</li>
          <li>Consider relaxation techniques before bed</li>
        </ul>
      </div>
    </div>
  );
}

export default SleepTracker;