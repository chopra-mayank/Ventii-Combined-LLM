// frontend/src/components/ItineraryForm.js
import React, { useState, useEffect } from 'react';
import './ItineraryForm.css';

const ItineraryForm = ({ onGenerate, loading }) => {
  const [prompt, setPrompt] = useState('');
  const [selectedExample, setSelectedExample] = useState('');
  const [activeTab, setActiveTab] = useState('corporate');
  const [charCount, setCharCount] = useState(0);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [formData, setFormData] = useState({
    participants: '',
    budget: '',
    duration: '',
    location: '',
    eventType: '',
    specialRequirements: ''
  });

  const maxChars = 500;

  const examplePrompts = {
    corporate: {
      title: '🏢 Corporate Events',
      icon: '🏢',
      color: '#3498db',
      examples: [
        {
          title: "Team Training Workshop",
          prompt: "Corporate training for 50 people in Bangalore on June 10th. Budget ₹1.5 lakhs. Need projector, lunch, and parking facilities.",
          tags: ['Training', 'Large Group', 'Tech Hub'],
          participants: '50',
          budget: '1.5 lakhs'
        },
        {
          title: "Luxury Team Offsite",
          prompt: "Premium team offsite for 30 people in Goa next Friday. Budget 2 lakhs. Need vegetarian catering, team building activities, and beachfront resort.",
          tags: ['Offsite', 'Beach', 'Premium'],
          participants: '30',
          budget: '2 lakhs'
        },
        {
          title: "Leadership Summit",
          prompt: "Executive leadership seminar for 25 executives in Mumbai on December 15th. Budget ₹3 lakhs. Five-star venue, gourmet catering, and networking spaces.",
          tags: ['Executive', 'Premium', 'Leadership'],
          participants: '25',
          budget: '3 lakhs'
        },
        {
          title: "Annual Conference",
          prompt: "Annual company conference for 100 people in Delhi on March 20th. Budget ₹5 lakhs. Need main stage, breakout rooms, A/V equipment, and networking areas.",
          tags: ['Conference', 'Large Scale', 'Multi-room'],
          participants: '100',
          budget: '5 lakhs'
        }
      ]
    },
    travel: {
      title: '✈️ Travel & Experiences',
      icon: '✈️',
      color: '#27ae60',
      examples: [
        {
          title: "Cultural Heritage Tour",
          prompt: "Creative team retreat for 50 people for 3 days in Udaipur, Rajasthan. Focus on cultural immersion, heritage sites, and collaborative workshops.",
          tags: ['Culture', 'Heritage', 'Multi-day'],
          participants: '50',
          budget: '2.5 lakhs'
        },
        {
          title: "Urban Adventure",
          prompt: "Fun team activities for 25 employees, lasting 4 hours in Mumbai. Include escape rooms, food tours, and interactive experiences.",
          tags: ['Urban', 'Short Duration', 'Interactive'],
          participants: '25',
          budget: '75k'
        },
        {
          title: "Family Getaway",
          prompt: "Family vacation for 6 people in Kerala for 5 days. Budget ₹80,000. Kid-friendly activities, backwater cruise, and Ayurvedic spa.",
          tags: ['Family', 'Nature', 'Wellness'],
          participants: '6',
          budget: '80k'
        },
        {
          title: "Adventure Expedition",
          prompt: "Team building retreat for 40 people in Manali for 3 days. Budget ₹1.2 lakhs. Adventure sports, mountain trekking, and bonfire nights.",
          tags: ['Adventure', 'Mountains', 'Outdoor'],
          participants: '40',
          budget: '1.2 lakhs'
        }
      ]
    },
    wellness: {
      title: '🧘 Wellness & Retreat',
      icon: '🧘',
      color: '#9b59b6',
      examples: [
        {
          title: "Mindfulness Workshop",
          prompt: "Corporate wellness workshop for 35 people in Rishikesh for 2 days. Budget ₹1.8 lakhs. Yoga sessions, meditation, healthy meals, and stress management.",
          tags: ['Wellness', 'Mindfulness', 'Spiritual'],
          participants: '35',
          budget: '1.8 lakhs'
        },
        {
          title: "Spa & Relaxation",
          prompt: "Executive wellness retreat for 20 senior staff in Goa for 3 days. Budget ₹2.5 lakhs. Luxury spa, wellness consultations, and beach activities.",
          tags: ['Luxury', 'Spa', 'Executive'],
          participants: '20',
          budget: '2.5 lakhs'
        }
      ]
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (prompt.trim()) {
      onGenerate(prompt.trim());
    }
  };

  const handlePromptChange = (e) => {
    const value = e.target.value;
    if (value.length <= maxChars) {
      setPrompt(value);
      setCharCount(value.length);
    }
  };

  const handleExampleSelect = (example) => {
    setPrompt(example.prompt);
    setSelectedExample(example.prompt);
    
    // Auto-fill form data if available
    if (example.participants) {
      setFormData(prev => ({
        ...prev,
        participants: example.participants,
        budget: example.budget || ''
      }));
    }
  };

  const clearForm = () => {
    setPrompt('');
    setSelectedExample('');
    setCharCount(0);
    setFormData({
      participants: '',
      budget: '',
      duration: '',
      location: '',
      eventType: '',
      specialRequirements: ''
    });
  };

  const buildPromptFromForm = () => {
    const { participants, budget, duration, location, eventType, specialRequirements } = formData;
    
    let generatedPrompt = '';
    if (eventType) generatedPrompt += `${eventType} `;
    if (participants) generatedPrompt += `for ${participants} people `;
    if (location) generatedPrompt += `in ${location} `;
    if (duration) generatedPrompt += `for ${duration} `;
    if (budget) generatedPrompt += `Budget ₹${budget}. `;
    if (specialRequirements) generatedPrompt += `${specialRequirements}`;
    
    if (generatedPrompt.trim()) {
      setPrompt(generatedPrompt.trim());
      setCharCount(generatedPrompt.trim().length);
    }
  };

  const getProgressWidth = () => {
    return Math.min((charCount / maxChars) * 100, 100);
  };

  return (
    <div className="itinerary-form-container">
      {/* Hero Header */}
      <div className="form-hero">
        <div className="hero-content">
          <h1 className="hero-title">
            <span className="title-gradient">Create Your Perfect</span>
            <br />
            <span className="title-highlight">Itinerary</span>
          </h1>
          <p className="hero-subtitle">
            Describe your event and we'll craft a detailed, personalized itinerary with venues, activities, and budget breakdown.
          </p>
          <div className="hero-stats">
            <div className="stat-item">
              <span className="stat-number">1000+</span>
              <span className="stat-label">Events Planned</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">50+</span>
              <span className="stat-label">Cities Covered</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">4.9★</span>
              <span className="stat-label">User Rating</span>
            </div>
          </div>
        </div>
      </div>

      <div className="form-container">
        {/* Main Form */}
        <div className="form-card">
          <div className="form-header">
            <h2>🎯 Describe Your Event</h2>
            <div className="form-toggle">
              <button 
                className={`toggle-btn ${!showAdvanced ? 'active' : ''}`}
                onClick={() => setShowAdvanced(false)}
              >
                📝 Quick Description
              </button>
              <button 
                className={`toggle-btn ${showAdvanced ? 'active' : ''}`}
                onClick={() => setShowAdvanced(true)}
              >
                ⚙️ Detailed Form
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="form">
            {!showAdvanced ? (
              /* Quick Description Mode */
              <div className="input-section">
                <label htmlFor="prompt" className="input-label">
                  <span className="label-icon">📝</span>
                  Event Description
                  <span className="label-required">*</span>
                </label>
                
                <div className="textarea-container">
                  <textarea
                    id="prompt"
                    value={prompt}
                    onChange={handlePromptChange}
                    placeholder="e.g., Corporate team building for 30 people in Goa from March 15-17. Budget ₹2 lakhs. Need vegetarian catering, outdoor activities, and beachfront accommodation..."
                    className="prompt-textarea"
                    rows={5}
                    required
                  />
                  
                  <div className="char-counter">
                    <div className="progress-bar">
                      <div 
                        className="progress-fill" 
                        style={{ width: `${getProgressWidth()}%` }}
                      ></div>
                    </div>
                    <span className={charCount > maxChars * 0.8 ? 'counter-warning' : 'counter-normal'}>
                      {charCount}/{maxChars}
                    </span>
                  </div>
                </div>

                <div className="input-help">
                  <div className="help-grid">
                    <div className="help-item">
                      <span className="help-icon">👥</span>
                      <span>Number of people</span>
                    </div>
                    <div className="help-item">
                      <span className="help-icon">📍</span>
                      <span>Location & venue type</span>
                    </div>
                    <div className="help-item">
                      <span className="help-icon">💰</span>
                      <span>Budget range</span>
                    </div>
                    <div className="help-item">
                      <span className="help-icon">📅</span>
                      <span>Dates & duration</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Advanced Form Mode */
              <div className="advanced-form">
                <div className="form-grid">
                  <div className="form-group">
                    <label>Event Type</label>
                    <select 
                      value={formData.eventType}
                      onChange={(e) => setFormData({...formData, eventType: e.target.value})}
                    >
                      <option value="">Select event type</option>
                      <option value="Corporate training">Corporate Training</option>
                      <option value="Team offsite">Team Offsite</option>
                      <option value="Conference">Conference</option>
                      <option value="Workshop">Workshop</option>
                      <option value="Team building">Team Building</option>
                      <option value="Leadership seminar">Leadership Seminar</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Number of Participants</label>
                    <input 
                      type="number"
                      value={formData.participants}
                      onChange={(e) => setFormData({...formData, participants: e.target.value})}
                      placeholder="e.g., 50"
                    />
                  </div>

                  <div className="form-group">
                    <label>Location</label>
                    <input 
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({...formData, location: e.target.value})}
                      placeholder="e.g., Mumbai, Bangalore"
                    />
                  </div>

                  <div className="form-group">
                    <label>Budget</label>
                    <input 
                      type="text"
                      value={formData.budget}
                      onChange={(e) => setFormData({...formData, budget: e.target.value})}
                      placeholder="e.g., 2 lakhs"
                    />
                  </div>

                  <div className="form-group">
                    <label>Duration</label>
                    <input 
                      type="text"
                      value={formData.duration}
                      onChange={(e) => setFormData({...formData, duration: e.target.value})}
                      placeholder="e.g., 2 days, 4 hours"
                    />
                  </div>

                  <div className="form-group full-width">
                    <label>Special Requirements</label>
                    <textarea 
                      value={formData.specialRequirements}
                      onChange={(e) => setFormData({...formData, specialRequirements: e.target.value})}
                      placeholder="e.g., Vegetarian catering, accessibility needs, specific themes"
                      rows={3}
                    />
                  </div>
                </div>

                <button 
                  type="button" 
                  className="btn btn-outline"
                  onClick={buildPromptFromForm}
                >
                  🔄 Generate Description from Form
                </button>

                <div className="generated-prompt">
                  <label>Generated Description</label>
                  <textarea
                    value={prompt}
                    onChange={handlePromptChange}
                    placeholder="Your generated description will appear here..."
                    rows={4}
                  />
                </div>
              </div>
            )}

            <div className="form-actions">
              <button 
                type="submit" 
                className={`btn btn-primary btn-large ${loading ? 'loading' : ''}`}
                disabled={loading || !prompt.trim()}
              >
                {loading ? (
                  <>
                    <span className="spinner"></span>
                    Generating Your Itinerary...
                  </>
                ) : (
                  <>
                    <span className="btn-icon">🚀</span>
                    Generate Itinerary
                  </>
                )}
              </button>
              
              {prompt && (
                <button 
                  type="button" 
                  className="btn btn-outline"
                  onClick={clearForm}
                >
                  <span className="btn-icon">🗑️</span>
                  Clear Form
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Example Prompts */}
        <div className="examples-section">
          <div className="section-header">
            <h3>💡 Example Prompts</h3>
            <p>Get inspired by these sample event descriptions</p>
          </div>
          
          <div className="examples-tabs">
            {Object.entries(examplePrompts).map(([key, category]) => (
              <button
                key={key}
                className={`tab-btn ${activeTab === key ? 'active' : ''}`}
                onClick={() => setActiveTab(key)}
                style={{ '--tab-color': category.color }}
              >
                <span className="tab-icon">{category.icon}</span>
                {category.title}
              </button>
            ))}
          </div>

          <div className="examples-grid">
            {examplePrompts[activeTab].examples.map((example, index) => (
              <div 
                key={index}
                className={`example-card ${selectedExample === example.prompt ? 'selected' : ''}`}
                onClick={() => handleExampleSelect(example)}
              >
                <div className="example-header">
                  <h4 className="example-title">{example.title}</h4>
                  <div className="example-meta">
                    {example.participants && (
                      <span className="meta-item">👥 {example.participants}</span>
                    )}
                    {example.budget && (
                      <span className="meta-item">💰 ₹{example.budget}</span>
                    )}
                  </div>
                </div>
                
                <p className="example-text">{example.prompt}</p>
                
                <div className="example-tags">
                  {example.tags.map((tag, tagIndex) => (
                    <span key={tagIndex} className="tag">{tag}</span>
                  ))}
                </div>
                
                <div className="example-action">
                  <span className="action-icon">👆</span>
                  Click to use this example
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Tips */}
        <div className="tips-section">
          <h4>🎯 Pro Tips for Better Results</h4>
          <div className="tips-grid">
            <div className="tip-card">
              <span className="tip-icon">👥</span>
              <div className="tip-content">
                <h5>Be Specific with Numbers</h5>
                <p>Mention exact participant count for accurate venue and catering recommendations</p>
              </div>
            </div>
            <div className="tip-card">
              <span className="tip-icon">💰</span>
              <div className="tip-content">
                <h5>Include Realistic Budget</h5>
                <p>Specify budget in ₹ (thousands/lakhs/crores) for tailored suggestions</p>
              </div>
            </div>
            <div className="tip-card">
              <span className="tip-icon">📍</span>
              <div className="tip-content">
                <h5>Mention Location Details</h5>
                <p>Include city, preferred area, or venue type (hotel, resort, office)</p>
              </div>
            </div>
            <div className="tip-card">
              <span className="tip-icon">📅</span>
              <div className="tip-content">
                <h5>Add Time Constraints</h5>
                <p>Specify dates, duration, and any time-sensitive requirements</p>
              </div>
            </div>
            <div className="tip-card">
              <span className="tip-icon">🍽️</span>
              <div className="tip-content">
                <h5>Special Requirements</h5>
                <p>Mention dietary restrictions, accessibility needs, or cultural preferences</p>
              </div>
            </div>
            <div className="tip-card">
              <span className="tip-icon">🎯</span>
              <div className="tip-content">
                <h5>Define Event Goals</h5>
                <p>Specify if it's for networking, training, celebration, or team building</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItineraryForm;