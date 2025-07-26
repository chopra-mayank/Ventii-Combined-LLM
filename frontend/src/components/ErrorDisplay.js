// frontend/src/components/ErrorDisplay.js
import React from 'react';

const ErrorDisplay = ({ error, onRetry }) => {
  const getErrorIcon = (error) => {
    if (error.includes('Network') || error.includes('backend')) return '🌐';
    if (error.includes('API') || error.includes('key')) return '🔑';
    if (error.includes('timeout')) return '⏱️';
    return '⚠️';
  };

  const getErrorSuggestion = (error) => {
    if (error.includes('Network') || error.includes('backend')) {
      return 'Check if the backend server is running on port 5001';
    }
    if (error.includes('API') || error.includes('key')) {
      return 'Verify your API keys are properly configured in the backend';
    }
    if (error.includes('timeout')) {
      return 'The request took too long. Try with a simpler prompt';
    }
    if (error.includes('Prompt is required')) {
      return 'Please provide a valid event description';
    }
    return 'Try refreshing the page or simplifying your request';
  };

  return (
    <div className="error-display">
      <div className="error-container">
        <div className="error-icon">
          {getErrorIcon(error)}
        </div>
        
        <div className="error-content">
          <h3 className="error-title">Oops! Something went wrong</h3>
          <p className="error-message">{error}</p>
          <p className="error-suggestion">{getErrorSuggestion(error)}</p>
        </div>
        
        <div className="error-actions">
          <button className="btn btn-primary" onClick={onRetry}>
            🔄 Try Again
          </button>
        </div>
      </div>

      {/* Troubleshooting Tips */}
      <div className="troubleshooting">
        <h4>🔧 Troubleshooting Tips</h4>
        <div className="tips-grid">
          <div className="tip">
            <strong>Backend Issues:</strong>
            <span>Make sure the server is running: <code>npm start</code> in backend folder</span>
          </div>
          <div className="tip">
            <strong>API Keys:</strong>
            <span>Check your .env file has valid GROQ_API_KEY and TAVILY_API_KEY</span>
          </div>
          <div className="tip">
            <strong>Network:</strong>
            <span>Ensure frontend is connecting to http://localhost:5001</span>
          </div>
          <div className="tip">
            <strong>Input:</strong>
            <span>Try simpler prompts or include more details like budget and location</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ErrorDisplay;