// frontend/src/components/ItineraryDisplay.js
import React, { useState } from 'react';

const ItineraryDisplay = ({ itinerary, onRefineActivity, onRefineDay }) => {
  const [expandedDays, setExpandedDays] = useState(new Set([1])); // First day expanded by default
  const [showBudgetBreakdown, setShowBudgetBreakdown] = useState(false);

  const toggleDay = (dayNumber) => {
    const newExpanded = new Set(expandedDays);
    if (newExpanded.has(dayNumber)) {
      newExpanded.delete(dayNumber);
    } else {
      newExpanded.add(dayNumber);
    }
    setExpandedDays(newExpanded);
  };

  const formatCurrency = (amount) => {
    if (!amount) return '₹0';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getTypeIcon = (type) => {
    return type === 'corporate' ? '🏢' : '✈️';
  };

  const getCategoryIcon = (category) => {
    const icons = {
      'networking': '🤝',
      'training': '📚',
      'presentation': '🎤',
      'team_building': '🎯',
      'break': '☕',
      'dining': '🍽️',
      'cultural': '🏛️',
      'adventure': '🏔️',
      'leisure': '🏖️',
      'shopping': '🛍️',
      'transport': '🚗',
      'accommodation': '🏨'
    };
    return icons[category?.toLowerCase()] || '📋';
  };

  if (!itinerary) return null;

  return (
    <div className="itinerary-display">
      {/* Header */}
      <div className="itinerary-header">
        <div className="header-content">
          <div className="title-section">
            <h1 className="itinerary-title">
              {getTypeIcon(itinerary.type)} {itinerary.title}
            </h1>
            {itinerary.summary && (
              <p className="itinerary-summary">{itinerary.summary}</p>
            )}
          </div>
          
          <div className="meta-info">
            <div className="meta-item">
              <span className="meta-label">📍 Location</span>
              <span className="meta-value">{itinerary.location}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">👥 Participants</span>
              <span className="meta-value">{itinerary.participants}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">💰 Total Budget</span>
              <span className="meta-value">{formatCurrency(itinerary.totalBudget)}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">📅 Duration</span>
              <span className="meta-value">{itinerary.duration || itinerary.days?.length} day(s)</span>
            </div>
          </div>
        </div>

        {/* Budget Breakdown Toggle */}
        <div className="budget-section">
          <button 
            className="budget-toggle"
            onClick={() => setShowBudgetBreakdown(!showBudgetBreakdown)}
          >
            💰 Budget Breakdown {showBudgetBreakdown ? '▲' : '▼'}
          </button>
          
          {showBudgetBreakdown && itinerary.budgetBreakdown && (
            <div className="budget-breakdown">
              {Object.entries(itinerary.budgetBreakdown).map(([category, amount]) => (
                <div key={category} className="budget-item">
                  <span className="budget-category">{category.charAt(0).toUpperCase() + category.slice(1)}</span>
                  <span className="budget-amount">{formatCurrency(amount)}</span>
                  <div className="budget-bar">
                    <div 
                      className="budget-fill"
                      style={{ 
                        width: `${(amount / itinerary.totalBudget) * 100}%` 
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Days */}
      <div className="days-container">
        {itinerary.days?.map((day) => (
          <div key={day.day} className="day-card">
            <div 
              className="day-header"
              onClick={() => toggleDay(day.day)}
            >
              <div className="day-title">
                <h3>📅 Day {day.day}: {day.theme}</h3>
                {day.date && day.date !== 'flexible' && (
                  <span className="day-date">{day.date}</span>
                )}
              </div>
              
              <div className="day-meta">
                <span className="day-cost">{formatCurrency(day.totalCost || 0)}</span>
                <button className="expand-btn">
                  {expandedDays.has(day.day) ? '▲' : '▼'}
                </button>
              </div>
            </div>

            {expandedDays.has(day.day) && (
              <div className="day-content">
                {/* Day Actions */}
                <div className="day-actions">
                  <button 
                    className="btn btn-small btn-outline"
                    onClick={() => {
                      const prompt = window.prompt(
                        `Refine Day ${day.day} (${day.theme}):\n\nWhat would you like to change about this day?`,
                        "Add more outdoor activities during breaks"
                      );
                      if (prompt) onRefineDay(day.day, prompt);
                    }}
                  >
                    🔄 Refine This Day
                  </button>
                </div>

                {/* Activities */}
                <div className="activities-list">
                  {day.activities?.map((activity, index) => (
                    <div key={activity.id || index} className="activity-card">
                      <div className="activity-header">
                        <div className="activity-time">
                          <span className="time-slot">{activity.timeSlot}</span>
                          {activity.duration && (
                            <span className="duration">({activity.duration})</span>
                          )}
                        </div>
                        
                        <div className="activity-cost">
                          {formatCurrency(activity.cost || 0)}
                        </div>
                      </div>

                      <div className="activity-content">
                        <div className="activity-title">
                          {getCategoryIcon(activity.category)} {activity.title}
                        </div>
                        
                        <div className="activity-description">
                          {activity.description}
                        </div>

                        {activity.location && (
                          <div className="activity-location">
                            📍 {activity.location}
                            {activity.address && (
                              <span className="activity-address"> - {activity.address}</span>
                            )}
                          </div>
                        )}

                        {activity.requirements && activity.requirements.length > 0 && (
                          <div className="activity-requirements">
                            <strong>Requirements:</strong>
                            <ul>
                              {activity.requirements.map((req, i) => (
                                <li key={i}>{req}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>

                      <div className="activity-actions">
                        <button 
                          className="btn btn-small btn-outline"
                          onClick={() => {
                            const prompt = window.prompt(
                              `Refine Activity: "${activity.title}"\n\nWhat would you like to change about this activity?`,
                              "Make this activity more engaging and interactive"
                            );
                            if (prompt) onRefineActivity(day.day, activity.id || index, prompt);
                          }}
                        >
                          🔄 Refine
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Day Notes */}
                {day.notes && (
                  <div className="day-notes">
                    <h4>📝 Day Notes</h4>
                    <p>{day.notes}</p>
                  </div>
                )}

                {/* Meals Info */}
                {day.meals && (
                  <div className="meals-info">
                    <h4>🍽️ Meals</h4>
                    <div className="meals-grid">
                      {day.meals.breakfast && (
                        <div className="meal-item">
                          <strong>Breakfast:</strong> {day.meals.breakfast}
                        </div>
                      )}
                      {day.meals.lunch && (
                        <div className="meal-item">
                          <strong>Lunch:</strong> {day.meals.lunch}
                        </div>
                      )}
                      {day.meals.dinner && (
                        <div className="meal-item">
                          <strong>Dinner:</strong> {day.meals.dinner}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Practical Information */}
      {itinerary.practicalInfo && (
        <div className="practical-info">
          <h3>📋 Practical Information</h3>
          
          <div className="info-grid">
            {itinerary.practicalInfo.transportation && (
              <div className="info-item">
                <h4>🚗 Transportation</h4>
                <p>{itinerary.practicalInfo.transportation}</p>
              </div>
            )}
            
            {itinerary.practicalInfo.accommodation && (
              <div className="info-item">
                <h4>🏨 Accommodation</h4>
                <p>{itinerary.practicalInfo.accommodation}</p>
              </div>
            )}
            
            {itinerary.practicalInfo.contact && (
              <div className="info-item">
                <h4>📞 Emergency Contact</h4>
                <p>{itinerary.practicalInfo.contact}</p>
              </div>
            )}
            
            {itinerary.practicalInfo.tips && itinerary.practicalInfo.tips.length > 0 && (
              <div className="info-item">
                <h4>💡 Tips</h4>
                <ul>
                  {itinerary.practicalInfo.tips.map((tip, index) => (
                    <li key={index}>{tip}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Refinement History */}
      {itinerary.refinementHistory && itinerary.refinementHistory.length > 0 && (
        <div className="refinement-history">
          <h3>🔄 Refinement History</h3>
          <div className="history-list">
            {itinerary.refinementHistory.map((refinement, index) => (
              <div key={index} className="history-item">
                <span className="history-prompt">"{refinement.prompt}"</span>
                <span className="history-meta">
                  {refinement.type} • {new Date(refinement.timestamp).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ItineraryDisplay;