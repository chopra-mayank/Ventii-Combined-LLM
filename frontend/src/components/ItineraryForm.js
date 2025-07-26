// frontend/src/components/ItineraryForm.js
import React, { useState } from 'react';

const ItineraryForm = ({ onGenerate, loading }) => {
  const [prompt, setPrompt] = useState('');
  const [selectedExample, setSelectedExample] = useState('');

  const examplePrompts = {
    corporate: [
      "Corporate training for 50 people in Bangalore on June 10th. Budget ₹1.5 lakhs.",
      "Team offsite for 30 people in Goa next Friday. Budget 2 lakhs. Need vegetarian food.",
      "Leadership seminar for 25 executives in Mumbai on December 15th. Budget ₹3 lakhs.",
      "Annual conference for 100 people in Delhi on March 20th. Budget ₹5 lakhs. Premium setup."
    ],
    travel: [
      "We need activities for a creative team of 50 people for 3 days in Udaipur, Rajasthan",
      "Looking for fun activities for 25 employees, lasting about 4 hours in Mumbai",
      "Family vacation for 6 people in Kerala for 5 days. Budget ₹80,000",
      "Team building retreat for 40 people in Manali for 3 days. Budget ₹1.2 lakhs"
    ]
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (prompt.trim()) {
      onGenerate(prompt.trim());
    }
  };

  const handleExampleSelect = (example) => {
    setPrompt(example);
    setSelectedExample(example);
  };

  const clearForm = () => {
    setPrompt('');
    setSelectedExample('');
  };

  return (
    <div className="itinerary-form">
      <div className="form-container">
        <div className="form-header">
          <h2>🎯 Describe Your Event</h2>
          <p>Tell us about your corporate event or travel plans, and we'll create a detailed itinerary for you.</p>
        </div>

        <form onSubmit={handleSubmit} className="form">
          <div className="input-section">
            <label htmlFor="prompt" className="input-label">
              Event Description
            </label>
            <textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., Corporate training for 50 people in Bangalore. Budget ₹1.5 lakhs..."
              className="prompt-textarea"
              rows={4}
              required
            />
            <div className="input-help">
              <span>💡 Include: Event type, number of people, location, budget, dates, and any special requirements</span>
            </div>
          </div>

          <div className="form-actions">
            <button 
              type="submit" 
              className="btn btn-primary btn-large"
              disabled={loading || !prompt.trim()}
            >
              {loading ? '🔄 Generating...' : '🚀 Generate Itinerary'}
            </button>
            
            {prompt && (
              <button 
                type="button" 
                className="btn btn-outline"
                onClick={clearForm}
              >
                🗑️ Clear
              </button>
            )}
          </div>
        </form>

        {/* Example Prompts */}
        <div className="examples-section">
          <h3>💡 Example Prompts</h3>
          
          <div className="examples-tabs">
            <div className="tab-header">
              <span className="tab-title">🏢 Corporate Events</span>
            </div>
            <div className="examples-grid">
              {examplePrompts.corporate.map((example, index) => (
                <div 
                  key={index}
                  className={`example-card ${selectedExample === example ? 'selected' : ''}`}
                  onClick={() => handleExampleSelect(example)}
                >
                  <div className="example-text">{example}</div>
                  <div className="example-action">Click to use</div>
                </div>
              ))}
            </div>
          </div>

          <div className="examples-tabs">
            <div className="tab-header">
              <span className="tab-title">✈️ Travel & Team Building</span>
            </div>
            <div className="examples-grid">
              {examplePrompts.travel.map((example, index) => (
                <div 
                  key={index}
                  className={`example-card ${selectedExample === example ? 'selected' : ''}`}
                  onClick={() => handleExampleSelect(example)}
                >
                  <div className="example-text">{example}</div>
                  <div className="example-action">Click to use</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Tips */}
        <div className="tips-section">
          <h4>🎯 Tips for Better Results</h4>
          <div className="tips-grid">
            <div className="tip">
              <span className="tip-icon">👥</span>
              <span className="tip-text">Specify exact number of participants</span>
            </div>
            <div className="tip">
              <span className="tip-icon">💰</span>
              <span className="tip-text">Include budget in ₹ (lakhs/crores)</span>
            </div>
            <div className="tip">
              <span className="tip-icon">📍</span>
              <span className="tip-text">Mention specific city/location</span>
            </div>
            <div className="tip">
              <span className="tip-icon">📅</span>
              <span className="tip-text">Add dates and duration if known</span>
            </div>
            <div className="tip">
              <span className="tip-icon">🍽️</span>
              <span className="tip-text">Mention dietary restrictions</span>
            </div>
            <div className="tip">
              <span className="tip-icon">🎯</span>
              <span className="tip-text">Specify event focus/theme</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItineraryForm;