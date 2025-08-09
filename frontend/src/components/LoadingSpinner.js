// frontend/src/components/LoadingSpinner.js
import React, { useState, useEffect } from 'react';
import './LoadingSpinner.css';

const LoadingSpinner = ({ progress = 0, customMessage = null }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [animationPhase, setAnimationPhase] = useState(0);
  const [funFacts, setFunFacts] = useState([]);
  const [currentFactIndex, setCurrentFactIndex] = useState(0);

  const loadingSteps = [
    {
      icon: "📝",
      title: "Analyzing Requirements",
      description: "Understanding your event details and preferences",
      duration: 2000
    },
    {
      icon: "🔍",
      title: "Researching Venues",
      description: "Finding the perfect locations and activities",
      duration: 3000
    },
    {
      icon: "🎯",
      title: "Creating Itinerary",
      description: "Building your personalized schedule",
      duration: 2500
    },
    {
      icon: "✨",
      title: "Adding Final Touches",
      description: "Optimizing budget and timeline",
      duration: 1500
    }
  ];

  const eventFacts = [
    "💡 Did you know? Corporate team building activities can increase productivity by up to 25%!",
    "🌟 Fun fact: The average attention span during presentations is 18 minutes.",
    "🎯 Studies show that well-planned events have 40% higher satisfaction rates.",
    "🚀 Companies that invest in employee events see 31% lower voluntary turnover.",
    "💼 The global events industry is worth over $1.1 trillion annually.",
    "🎉 Team building activities can improve communication by up to 50%.",
    "📈 Events with interactive elements have 60% higher engagement rates.",
    "🌍 Virtual and hybrid events have grown by 300% in recent years."
  ];

  useEffect(() => {
    setFunFacts(eventFacts);
    
    // Cycle through loading steps
    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < loadingSteps.length - 1) {
          return prev + 1;
        }
        return 0; // Loop back to start
      });
    }, 3000);

    // Cycle through fun facts
    const factInterval = setInterval(() => {
      setCurrentFactIndex((prev) => (prev + 1) % eventFacts.length);
    }, 4000);

    // Animation phase for visual effects
    const animationInterval = setInterval(() => {
      setAnimationPhase((prev) => (prev + 1) % 4);
    }, 500);

    return () => {
      clearInterval(stepInterval);
      clearInterval(factInterval);
      clearInterval(animationInterval);
    };
  }, []);

  const getProgressPercentage = () => {
    if (progress > 0) return progress;
    // Auto-calculate progress based on current step
    return ((currentStep + 1) / loadingSteps.length) * 100;
  };

  return (
    <div className="loading-spinner-container">
      {/* Main Spinner Section */}
      <div className="spinner-section">
        <div className="spinner-wrapper">
          {/* Animated Rings */}
          <div className="spinner-rings">
            <div className="ring ring-1"></div>
            <div className="ring ring-2"></div>
            <div className="ring ring-3"></div>
          </div>
          
          {/* Center Icon */}
          <div className="spinner-center">
            <span className="center-icon">
              {loadingSteps[currentStep]?.icon || "🎯"}
            </span>
          </div>
          
          {/* Floating Particles */}
          <div className="particles">
            {[...Array(8)].map((_, i) => (
              <div 
                key={i} 
                className={`particle particle-${i} ${animationPhase === i % 4 ? 'active' : ''}`}
              >
                ✨
              </div>
            ))}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="progress-container">
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ width: `${getProgressPercentage()}%` }}
            ></div>
            <div className="progress-glow"></div>
          </div>
          <div className="progress-text">
            {getProgressPercentage().toFixed(0)}% Complete
          </div>
        </div>
      </div>

      {/* Loading Status */}
      <div className="loading-status">
        <div className="status-header">
          <h2 className="loading-title">
            {customMessage || "Creating Your Perfect Itinerary"}
          </h2>
          <div className="loading-dots">
            <span className="dot dot-1">.</span>
            <span className="dot dot-2">.</span>
            <span className="dot dot-3">.</span>
          </div>
        </div>

        {/* Current Step */}
        <div className="current-step">
          <div className="step-icon">{loadingSteps[currentStep]?.icon}</div>
          <div className="step-content">
            <h3 className="step-title">{loadingSteps[currentStep]?.title}</h3>
            <p className="step-description">{loadingSteps[currentStep]?.description}</p>
          </div>
        </div>
      </div>

      {/* Loading Steps Timeline */}
      <div className="loading-steps">
        <div className="steps-header">
          <h4>📋 Processing Steps</h4>
        </div>
        <div className="steps-timeline">
          {loadingSteps.map((step, index) => (
            <div 
              key={index} 
              className={`step-item ${index <= currentStep ? 'completed' : ''} ${index === currentStep ? 'active' : ''}`}
            >
              <div className="step-marker">
                <span className="step-icon">{step.icon}</span>
                {index <= currentStep && (
                  <div className="completion-check">✓</div>
                )}
              </div>
              <div className="step-info">
                <div className="step-title">{step.title}</div>
                <div className="step-description">{step.description}</div>
              </div>
              {index < loadingSteps.length - 1 && (
                <div className={`step-connector ${index < currentStep ? 'completed' : ''}`}></div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Fun Facts Section */}
      <div className="fun-facts-section">
        <div className="fact-container">
          <div className="fact-header">
            <span className="fact-icon">💭</span>
            <span className="fact-label">Did You Know?</span>
          </div>
          <div className="fact-content">
            <p className="fun-fact">
              {funFacts[currentFactIndex]}
            </p>
          </div>
          <div className="fact-navigation">
            {funFacts.map((_, index) => (
              <div 
                key={index}
                className={`fact-dot ${index === currentFactIndex ? 'active' : ''}`}
              ></div>
            ))}
          </div>
        </div>
      </div>

      {/* Estimated Time */}
      <div className="time-estimate">
        <div className="estimate-content">
          <span className="time-icon">⏱️</span>
          <span className="time-text">
            Estimated completion: 10-15 seconds
          </span>
        </div>
      </div>

      {/* Background Animation */}
      <div className="background-animation">
        <div className="floating-shapes">
          {[...Array(6)].map((_, i) => (
            <div 
              key={i}
              className={`floating-shape shape-${i}`}
              style={{
                animationDelay: `${i * 0.5}s`,
                left: `${10 + i * 15}%`
              }}
            >
              {['🎯', '✨', '📅', '🎪', '🎨', '🚀'][i]}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LoadingSpinner;