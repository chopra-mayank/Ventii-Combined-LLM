// frontend/src/components/ItineraryDisplay.js
import React, { useState, useEffect } from "react";
import "./ItineraryDisplay.css";

const ItineraryDisplay = ({ itinerary, onRefineActivity, onRefineDay, onSaveItinerary, onShareItinerary }) => {
  const [expandedDays, setExpandedDays] = useState(new Set([1]));
  const [showBudgetBreakdown, setShowBudgetBreakdown] = useState(false);
  const [viewMode, setViewMode] = useState('detailed'); // 'detailed', 'timeline', 'compact'
  const [selectedDay, setSelectedDay] = useState(null);
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);

  useEffect(() => {
    if (itinerary) {
      setAnimateIn(true);
      // Auto-expand first day
      setExpandedDays(new Set([1]));
    }
  }, [itinerary]);

  const toggleDay = (dayNumber) => {
    setExpandedDays((prev) => {
      const newExpanded = new Set(prev);
      newExpanded.has(dayNumber) ? newExpanded.delete(dayNumber) : newExpanded.add(dayNumber);
      return newExpanded;
    });
  };

  const expandAllDays = () => {
    setExpandedDays(new Set(itinerary.days?.map(day => day.day) || []));
  };

  const collapseAllDays = () => {
    setExpandedDays(new Set());
  };

  const formatCurrency = (amount) => {
    if (!amount) return "₹0";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getTypeIcon = (type) => {
    const icons = {
      corporate: "🏢",
      travel: "✈️",
      wellness: "🧘",
      conference: "🎪",
      training: "📚",
      team_building: "🎯"
    };
    return icons[type?.toLowerCase()] || "🎯";
  };

  const getCategoryIcon = (category) => {
    const icons = {
      networking: "🤝",
      training: "📚",
      presentation: "🎤",
      team_building: "🎯",
      break: "☕",
      dining: "🍽️",
      cultural: "🏛️",
      adventure: "🏔️",
      leisure: "🏖️",
      shopping: "🛍️",
      transport: "🚗",
      accommodation: "🏨",
      wellness: "🧘",
      workshop: "🔧",
      entertainment: "🎭",
      outdoor: "🌳",
      indoor: "🏠"
    };
    return icons[category?.toLowerCase()] || "📋";
  };

  const getTimeIcon = (timeSlot) => {
    if (!timeSlot) return "🕐";
    const hour = parseInt(timeSlot.split(':')[0]);
    if (hour < 6) return "🌙";
    if (hour < 12) return "🌅";
    if (hour < 16) return "☀️";
    if (hour < 20) return "🌆";
    return "🌙";
  };

  const calculateTotalDuration = () => {
    if (!itinerary?.days) return "0 days";
    return `${itinerary.days.length} day${itinerary.days.length > 1 ? 's' : ''}`;
  };

  const getBudgetUtilization = () => {
    if (!itinerary?.budgetBreakdown || !itinerary?.totalBudget) return 0;
    const used = Object.values(itinerary.budgetBreakdown).reduce((sum, amount) => sum + amount, 0);
    return Math.min((used / itinerary.totalBudget) * 100, 100);
  };

  const exportToCalendar = () => {
    // Implementation for calendar export
    alert("Calendar export feature would be implemented here");
  };

  const exportToPDF = () => {
    // Implementation for PDF export
    alert("PDF export feature would be implemented here");
  };

  const shareItinerary = () => {
    if (navigator.share) {
      navigator.share({
        title: itinerary.title,
        text: itinerary.summary,
        url: window.location.href
      });
    } else {
      // Fallback to copy link
      navigator.clipboard.writeText(window.location.href);
      alert("Link copied to clipboard!");
    }
  };

  if (!itinerary) return null;

  return (
    <div className={`itinerary-display ${animateIn ? 'animate-in' : ''}`}>
      {/* Enhanced Header */}
      <div className="itinerary-header">
        <div className="header-main">
          <div className="title-section">
            <h1 className="itinerary-title">
              {getTypeIcon(itinerary.type)} {itinerary.title}
            </h1>
            {itinerary.summary && (
              <p className="itinerary-summary">{itinerary.summary}</p>
            )}
            <div className="title-badges">
              <span className="badge badge-primary">{itinerary.type || 'Event'}</span>
              <span className="badge badge-success">{calculateTotalDuration()}</span>
              <span className="badge badge-info">{itinerary.participants} people</span>
            </div>
          </div>

          <div className="header-actions">
            <div className="view-toggle">
              <button 
                className={`view-btn ${viewMode === 'detailed' ? 'active' : ''}`}
                onClick={() => setViewMode('detailed')}
                title="Detailed View"
              >
                📋
              </button>
              <button 
                className={`view-btn ${viewMode === 'timeline' ? 'active' : ''}`}
                onClick={() => setViewMode('timeline')}
                title="Timeline View"
              >
                📅
              </button>
              <button 
                className={`view-btn ${viewMode === 'compact' ? 'active' : ''}`}
                onClick={() => setViewMode('compact')}
                title="Compact View"
              >
                📝
              </button>
            </div>

            <div className="action-buttons">
              <button className="btn btn-outline" onClick={expandAllDays}>
                📖 Expand All
              </button>
              <button className="btn btn-outline" onClick={collapseAllDays}>
                📕 Collapse All
              </button>
              <div className="export-dropdown">
                <button 
                  className="btn btn-primary"
                  onClick={() => setShowExportOptions(!showExportOptions)}
                >
                  📤 Export
                </button>
                {showExportOptions && (
                  <div className="export-menu">
                    <button onClick={exportToCalendar}>📅 Add to Calendar</button>
                    <button onClick={exportToPDF}>📄 Download PDF</button>
                    <button onClick={shareItinerary}>🔗 Share Link</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Meta Info */}
        <div className="meta-info-grid">
          <div className="meta-card">
            <span className="meta-icon">📍</span>
            <div className="meta-content">
              <span className="meta-label">Location</span>
              <span className="meta-value">{itinerary.location}</span>
            </div>
          </div>
          <div className="meta-card">
            <span className="meta-icon">👥</span>
            <div className="meta-content">
              <span className="meta-label">Participants</span>
              <span className="meta-value">{itinerary.participants}</span>
            </div>
          </div>
          <div className="meta-card">
            <span className="meta-icon">💰</span>
            <div className="meta-content">
              <span className="meta-label">Total Budget</span>
              <span className="meta-value">{formatCurrency(itinerary.totalBudget)}</span>
            </div>
          </div>
          <div className="meta-card">
            <span className="meta-icon">📅</span>
            <div className="meta-content">
              <span className="meta-label">Duration</span>
              <span className="meta-value">{calculateTotalDuration()}</span>
            </div>
          </div>
        </div>

        {/* Enhanced Budget Breakdown */}
        {itinerary.budgetBreakdown && (
          <div className="budget-section">
            <div className="budget-header">
              <button
                className="budget-toggle"
                onClick={() => setShowBudgetBreakdown(!showBudgetBreakdown)}
              >
                <span className="budget-icon">💰</span>
                <span>Budget Breakdown</span>
                <span className="budget-utilization">
                  {getBudgetUtilization().toFixed(1)}% utilized
                </span>
                <span className={`toggle-icon ${showBudgetBreakdown ? 'expanded' : ''}`}>
                  ▼
                </span>
              </button>
            </div>

            {showBudgetBreakdown && (
              <div className="budget-breakdown">
                <div className="budget-overview">
                  <div className="budget-circle">
                    <svg viewBox="0 0 36 36" className="budget-chart">
                      <path
                        className="circle-bg"
                        d="M18 2.0845
                          a 15.9155 15.9155 0 0 1 0 31.831
                          a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        className="circle"
                        strokeDasharray={`${getBudgetUtilization()}, 100`}
                        d="M18 2.0845
                          a 15.9155 15.9155 0 0 1 0 31.831
                          a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                    <div className="budget-percentage">
                      {getBudgetUtilization().toFixed(0)}%
                    </div>
                  </div>
                </div>

                <div className="budget-items">
                  {Object.entries(itinerary.budgetBreakdown).map(([category, amount]) => (
                    <div key={category} className="budget-item">
                      <div className="budget-item-header">
                        <span className="budget-category">
                          {getCategoryIcon(category)} {category.charAt(0).toUpperCase() + category.slice(1)}
                        </span>
                        <span className="budget-amount">{formatCurrency(amount)}</span>
                      </div>
                      <div className="budget-bar">
                        <div
                          className="budget-fill"
                          style={{
                            width: `${(amount / itinerary.totalBudget) * 100}%`,
                          }}
                        ></div>
                      </div>
                      <div className="budget-percentage-text">
                        {((amount / itinerary.totalBudget) * 100).toFixed(1)}% of total
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Enhanced Days Display */}
      <div className="days-container">
        {itinerary.days?.map((day, dayIndex) => (
          <div key={day.day} className={`day-card ${viewMode} ${expandedDays.has(day.day) ? 'expanded' : ''}`}>
            <div className="day-header" onClick={() => toggleDay(day.day)}>
              <div className="day-title-section">
                <div className="day-number">{day.day}</div>
                <div className="day-info">
                  <h3 className="day-title">📅 {day.theme}</h3>
                  <div className="day-meta">
                    <span className="activity-count">
                      {day.activities?.length || 0} activities
                    </span>
                    <span className="day-duration">
                      {day.activities?.length > 0 && day.activities[0]?.timeSlot && day.activities[day.activities.length - 1]?.timeSlot
                        ? `${day.activities[0].timeSlot} - ${day.activities[day.activities.length - 1].timeSlot}`
                        : 'Full day'
                      }
                    </span>
                  </div>
                </div>
              </div>
              <div className="day-summary">
                <span className="day-cost">{formatCurrency(day.totalCost || 0)}</span>
                <button className="expand-btn">
                  <span className={`expand-icon ${expandedDays.has(day.day) ? 'expanded' : ''}`}>
                    ▼
                  </span>
                </button>
              </div>
            </div>

            {expandedDays.has(day.day) && (
              <div className="day-content">
                <div className="day-actions">
                  <button
                    className="btn-refine"
                    onClick={() => {
                      const prompt = window.prompt(
                        `Refine Day ${day.day} (${day.theme}):`, 
                        "Add more engaging activities or modify the schedule"
                      );
                      if (prompt) onRefineDay(day.day, prompt);
                    }}
                  >
                    🔄 Refine This Day
                  </button>
                </div>

                {/* Timeline View for Activities */}
                <div className={`activities-container ${viewMode}`}>
                  {day.activities?.map((activity, index) => (
                    <div key={activity.id || index} className="activity-card">
                      <div className="activity-timeline">
                        <div className="timeline-dot">
                          {getTimeIcon(activity.timeSlot)}
                        </div>
                        {index < day.activities.length - 1 && (
                          <div className="timeline-line"></div>
                        )}
                      </div>

                      <div className="activity-content">
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

                        <h4 className="activity-title">
                          {getCategoryIcon(activity.category)} {activity.title}
                        </h4>

                        <div className="activity-description">
                          {typeof activity.description === "string" ? (
                            <p>{activity.description}</p>
                          ) : activity.description && typeof activity.description === "object" ? (
                            <div className="description-details">
                              {Object.entries(activity.description).map(([key, value]) => (
                                <div key={key} className="detail-item">
                                  <strong>{key}:</strong> {value}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="no-description">No description available</p>
                          )}
                        </div>

                        {activity.venue?.name && (
                          <div className="venue-info">
                            <span className="venue-icon">📍</span>
                            <span className="venue-name">{activity.venue.name}</span>
                            {activity.venue.address && (
                              <span className="venue-address"> - {activity.venue.address}</span>
                            )}
                            {activity.venue.rating && (
                              <span className="venue-rating">⭐ {activity.venue.rating}</span>
                            )}
                          </div>
                        )}

                        {activity.requirements?.length > 0 && (
                          <div className="requirements-section">
                            <h5>📋 Requirements:</h5>
                            <ul className="requirements-list">
                              {activity.requirements.map((req, i) => (
                                <li key={i}>{req}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {activity.highlights && (
                          <div className="highlights-section">
                            <h5>✨ Highlights:</h5>
                            <div className="highlights">
                              {Array.isArray(activity.highlights) 
                                ? activity.highlights.map((highlight, i) => (
                                    <span key={i} className="highlight-tag">{highlight}</span>
                                  ))
                                : <span className="highlight-tag">{activity.highlights}</span>
                              }
                            </div>
                          </div>
                        )}

                        <div className="activity-actions">
                          <button
                            className="btn-refine"
                            onClick={() => {
                              const prompt = window.prompt(
                                `Refine Activity: "${activity.title}"`, 
                                "Make this activity more engaging or suggest alternatives"
                              );
                              if (prompt) onRefineActivity(day.day, activity.id || index, prompt);
                            }}
                          >
                            🔄 Refine Activity
                          </button>
                          
                          <button
                            className="btn-secondary"
                            onClick={() => {
                              // Add to personal calendar functionality
                              alert("Add to calendar feature would be implemented here");
                            }}
                          >
                            📅 Add to Calendar
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Day Summary */}
                <div className="day-summary-section">
                  <div className="summary-stats">
                    <div className="stat">
                      <span className="stat-icon">⏱️</span>
                      <span className="stat-value">
                        {day.activities?.length || 0} activities
                      </span>
                    </div>
                    <div className="stat">
                      <span className="stat-icon">💰</span>
                      <span className="stat-value">
                        {formatCurrency(day.totalCost || 0)}
                      </span>
                    </div>
                    <div className="stat">
                      <span className="stat-icon">🎯</span>
                      <span className="stat-value">
                        {day.theme}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer Actions */}
      <div className="itinerary-footer">
        <div className="footer-actions">
          <button className="btn btn-outline btn-large" onClick={() => window.print()}>
            🖨️ Print Itinerary
          </button>
          <button className="btn btn-primary btn-large" onClick={shareItinerary}>
            📱 Share Itinerary
          </button>
          {onSaveItinerary && (
            <button className="btn btn-success btn-large" onClick={() => onSaveItinerary(itinerary)}>
              💾 Save Itinerary
            </button>
          )}
        </div>
        
        <div className="footer-summary">
          <div className="summary-item">
            <strong>Total Days:</strong> {itinerary.days?.length || 0}
          </div>
          <div className="summary-item">
            <strong>Total Activities:</strong> {
              itinerary.days?.reduce((total, day) => total + (day.activities?.length || 0), 0) || 0
            }
          </div>
          <div className="summary-item">
            <strong>Total Budget:</strong> {formatCurrency(itinerary.totalBudget)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItineraryDisplay;