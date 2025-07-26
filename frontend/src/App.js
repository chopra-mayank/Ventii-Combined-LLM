// frontend/src/App.js - Main React application
import React, { useState } from 'react';
import './App.css';
import ItineraryForm from './components/ItineraryForm';
import ItineraryDisplay from './components/ItineraryDisplay';
import RefinementPanel from './components/RefinementPanel';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorDisplay from './components/ErrorDisplay';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

function App() {
  const [itinerary, setItinerary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showRefinement, setShowRefinement] = useState(false);

  const generateItinerary = async (prompt) => {
    setLoading(true);
    setError(null);
    setItinerary(null);

    try {
      console.log('🎯 Sending request to:', `${API_BASE_URL}/generate`);
      
      const response = await fetch(`${API_BASE_URL}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });

      const data = await response.json();
      console.log('📝 Response:', data);

      if (data.success) {
        setItinerary(data.data);
        setShowRefinement(false);
      } else {
        setError(data.message || 'Failed to generate itinerary');
      }
    } catch (error) {
      console.error('❌ Generation error:', error);
      setError('Network error. Please check if the backend server is running on port 5000.');
    } finally {
      setLoading(false);
    }
  };

  const refineItinerary = async (refinementPrompt, refinementType = 'entire', dayNumber = null, activityId = null) => {
    setLoading(true);
    setError(null);

    try {
      console.log('🔄 Refining:', refinementPrompt, refinementType);
      
      const response = await fetch(`${API_BASE_URL}/refine`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          itinerary,
          refinementPrompt,
          refinementType,
          dayNumber,
          activityId
        }),
      });

      const data = await response.json();

      if (data.success) {
        setItinerary(data.data);
        setShowRefinement(false);
      } else {
        setError(data.message || 'Failed to refine itinerary');
      }
    } catch (error) {
      console.error('❌ Refinement error:', error);
      setError('Network error during refinement.');
    } finally {
      setLoading(false);
    }
  };

  const exportItinerary = async (format = 'json') => {
    try {
      const response = await fetch(`${API_BASE_URL}/export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ itinerary, format }),
      });

      const data = await response.json();

      if (data.success) {
        // Create downloadable file
        const blob = new Blob([
          format === 'json' ? JSON.stringify(data.data, null, 2) : data.data
        ], { 
          type: format === 'json' ? 'application/json' : 'text/plain' 
        });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = data.filename || `itinerary.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('❌ Export error:', error);
      setError('Failed to export itinerary');
    }
  };

  const clearItinerary = () => {
    setItinerary(null);
    setError(null);
    setShowRefinement(false);
  };

  return (
    <div className="App">
      {/* Header */}
      <header className="app-header">
        <div className="container">
          <h1>🗓️ Itinerary LLM Generator</h1>
          <p>Create and customize travel & corporate event itineraries with AI</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content">
        <div className="container">
          
          {/* Input Form */}
          {!itinerary && !loading && (
            <div className="form-section">
              <ItineraryForm 
                onGenerate={generateItinerary}
                loading={loading}
              />
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="loading-section">
              <LoadingSpinner />
              <p>Generating your perfect itinerary...</p>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="error-section">
              <ErrorDisplay 
                error={error} 
                onRetry={() => setError(null)}
              />
            </div>
          )}

          {/* Itinerary Display */}
          {itinerary && !loading && (
            <div className="itinerary-section">
              <div className="itinerary-header">
                <div className="itinerary-actions">
                  <button 
                    className="btn btn-primary"
                    onClick={() => setShowRefinement(!showRefinement)}
                  >
                    {showRefinement ? '❌ Cancel' : '🔄 Tweak Itinerary'}
                  </button>
                  
                  <div className="export-buttons">
                    <button 
                      className="btn btn-secondary"
                      onClick={() => exportItinerary('json')}
                    >
                      📥 Export JSON
                    </button>
                    <button 
                      className="btn btn-secondary"
                      onClick={() => exportItinerary('text')}
                    >
                      📄 Export Text
                    </button>
                  </div>
                  
                  <button 
                    className="btn btn-outline"
                    onClick={clearItinerary}
                  >
                    🆕 New Itinerary
                  </button>
                </div>
              </div>

              <ItineraryDisplay 
                itinerary={itinerary}
                onRefineActivity={(dayNumber, activityId, prompt) => 
                  refineItinerary(prompt, 'activity', dayNumber, activityId)
                }
                onRefineDay={(dayNumber, prompt) => 
                  refineItinerary(prompt, 'day', dayNumber)
                }
              />

              {/* Refinement Panel */}
              {showRefinement && (
                <div className="refinement-section">
                  <RefinementPanel 
                    onRefine={(prompt, type, dayNumber, activityId) => 
                      refineItinerary(prompt, type, dayNumber, activityId)
                    }
                    itinerary={itinerary}
                    loading={loading}
                  />
                </div>
              )}
            </div>
          )}

        </div>
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <div className="container">
          <p>Powered by Groq LLM & Tavily Search API</p>
          <div className="footer-links">
            <span>🏢 Corporate Events</span>
            <span>✈️ Travel Planning</span>
            <span>🎯 AI-Powered</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;