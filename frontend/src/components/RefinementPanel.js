// frontend/src/components/RefinementPanel.js
import React, { useState } from 'react';

const RefinementPanel = ({ onRefine, itinerary, loading }) => {
  const [refinementPrompt, setRefinementPrompt] = useState('');
  const [refinementType, setRefinementType] = useState('entire');
  const [selectedDay, setSelectedDay] = useState(1);
  const [selectedActivity, setSelectedActivity] = useState('');

  const commonRefinements = {
    corporate: [
      "Make it more interactive with team building activities",
      "Focus on technology training specifically", 
      "Add outdoor activities during breaks",
      "Include guest speakers from the industry",
      "Make it more budget-friendly",
      "Add more networking opportunities"
    ],
    travel: [
      "Make it a beach-themed event",
      "Add water sports activities",
      "Focus on cultural experiences",
      "Include more adventure activities",
      "Add local cuisine experiences",
      "Make it more relaxing and leisurely"
    ]
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!refinementPrompt.trim()) return;

    let dayNumber = null;
    let activityId = null;

    if (refinementType === 'day') {
      dayNumber = selectedDay;
    } else if (refinementType === 'activity') {
      dayNumber = selectedDay;
      activityId = selectedActivity;
    }

    onRefine(refinementPrompt.trim(), refinementType, dayNumber, activityId);
    setRefinementPrompt('');
  };

  const selectCommonRefinement = (prompt) => {
    setRefinementPrompt(prompt);
  };

  const getCurrentActivities = () => {
    if (!itinerary.days || !itinerary.days[selectedDay - 1]) return [];
    return itinerary.days[selectedDay - 1].activities || [];
  };

  const relevantRefinements = itinerary?.type === 'corporate' 
    ? commonRefinements.corporate 
    : commonRefinements.travel;

  return (
    <div className="refinement-panel">
      <div className="panel-header">
        <h3>🔄 Tweak Your Itinerary</h3>
        <p>Describe what you'd like to change, and we'll update your itinerary accordingly.</p>
      </div>

      <form onSubmit={handleSubmit} className="refinement-form">
        {/* Refinement Type Selection */}
        <div className="refinement-type-section">
          <label className="input-label">What would you like to refine?</label>
          
          <div className="type-options">
            <label className="type-option">
              <input
                type="radio"
                value="entire"
                checked={refinementType === 'entire'}
                onChange={(e) => setRefinementType(e.target.value)}
              />
              <span className="option-content">
                <span className="option-icon">🔄</span>
                <span className="option-text">
                  <strong>Entire Itinerary</strong>
                  <small>Change the overall theme or focus</small>
                </span>
              </span>
            </label>

            <label className="type-option">
              <input
                type="radio"
                value="day"
                checked={refinementType === 'day'}
                onChange={(e) => setRefinementType(e.target.value)}
              />
              <span className="option-content">
                <span className="option-icon">📅</span>
                <span className="option-text">
                  <strong>Specific Day</strong>
                  <small>Modify activities for one day</small>
                </span>
              </span>
            </label>

            <label className="type-option">
              <input
                type="radio"
                value="activity"
                checked={refinementType === 'activity'}
                onChange={(e) => setRefinementType(e.target.value)}
              />
              <span className="option-content">
                <span className="option-icon">🎯</span>
                <span className="option-text">
                  <strong>Single Activity</strong>
                  <small>Change one specific activity</small>
                </span>
              </span>
            </label>
          </div>
        </div>

        {/* Day/Activity Selection */}
        {(refinementType === 'day' || refinementType === 'activity') && (
          <div className="selection-section">
            <div className="day-selection">
              <label htmlFor="day-select" className="input-label">
                Select Day
              </label>
              <select
                id="day-select"
                value={selectedDay}
                onChange={(e) => setSelectedDay(parseInt(e.target.value))}
                className="select-input"
              >
                {itinerary.days?.map((day) => (
                  <option key={day.day} value={day.day}>
                    Day {day.day}: {day.theme}
                  </option>
                ))}
              </select>
            </div>

            {refinementType === 'activity' && (
              <div className="activity-selection">
                <label htmlFor="activity-select" className="input-label">
                  Select Activity
                </label>
                <select
                  id="activity-select"
                  value={selectedActivity}
                  onChange={(e) => setSelectedActivity(e.target.value)}
                  className="select-input"
                >
                  <option value="">Choose an activity...</option>
                  {getCurrentActivities().map((activity, index) => (
                    <option key={activity.id || index} value={activity.id || index}>
                      {activity.timeSlot}: {activity.title}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}

        {/* Refinement Input */}
        <div className="refinement-input-section">
          <label htmlFor="refinement-prompt" className="input-label">
            Describe your changes
          </label>
          <textarea
            id="refinement-prompt"
            value={refinementPrompt}
            onChange={(e) => setRefinementPrompt(e.target.value)}
            placeholder={
              refinementType === 'entire' 
                ? "e.g., Make it more interactive with team building activities"
                : refinementType === 'day'
                ? "e.g., Add outdoor activities during breaks"
                : "e.g., Make this activity more hands-on and practical"
            }
            className="refinement-textarea"
            rows={3}
            required
          />
        </div>

        {/* Common Refinements */}
        <div className="common-refinements">
          <h4>💡 Common Refinements</h4>
          <div className="refinement-suggestions">
            {relevantRefinements.map((suggestion, index) => (
              <button
                key={index}
                type="button"
                className="suggestion-btn"
                onClick={() => selectCommonRefinement(suggestion)}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <div className="form-actions">
          <button 
            type="submit" 
            className="btn btn-primary btn-large"
            disabled={loading || !refinementPrompt.trim() || 
              (refinementType === 'activity' && !selectedActivity)}
          >
            {loading ? '🔄 Applying Changes...' : '✨ Apply Refinement'}
          </button>
        </div>
      </form>

      {/* Refinement Tips */}
      <div className="refinement-tips">
        <h4>🎯 Refinement Tips</h4>
        <div className="tips-list">
          <div className="tip-item">
            <span className="tip-icon">🎨</span>
            <span>Be specific about what you want to change</span>
          </div>
          <div className="tip-item">
            <span className="tip-icon">💰</span>
            <span>Mention if you want to adjust the budget</span>
          </div>
          <div className="tip-item">
            <span className="tip-icon">⏰</span>
            <span>Specify timing preferences if relevant</span>
          </div>
          <div className="tip-item">
            <span className="tip-icon">👥</span>
            <span>Consider the group dynamics and preferences</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RefinementPanel;