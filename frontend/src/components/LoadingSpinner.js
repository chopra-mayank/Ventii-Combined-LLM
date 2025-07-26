// frontend/src/components/LoadingSpinner.js
import React from 'react';

const LoadingSpinner = () => {
  return (
    <div className="loading-spinner">
      <div className="spinner-container">
        <div className="spinner"></div>
        <div className="loading-dots">
          <span>Generating</span>
          <span className="dot">.</span>
          <span className="dot">.</span>
          <span className="dot">.</span>
        </div>
      </div>
      
      <div className="loading-steps">
        <div className="step">📝 Analyzing your requirements</div>
        <div className="step">🔍 Researching venues and activities</div>
        <div className="step">🎯 Creating personalized itinerary</div>
        <div className="step">✨ Adding final touches</div>
      </div>
    </div>
  );
};

export default LoadingSpinner;