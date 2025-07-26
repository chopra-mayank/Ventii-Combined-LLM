// src/utils/helpers.js
export class ItineraryHelpers {
  static formatCurrency(amount, currency = 'INR') {
    if (typeof amount !== 'number') return '0';
    
    const formatMap = {
      'INR': (amt) => `₹${amt.toLocaleString('en-IN')}`,
      'USD': (amt) => `$${amt.toLocaleString('en-US')}`,
      'EUR': (amt) => `€${amt.toLocaleString('en-EU')}`
    };

    const formatter = formatMap[currency] || formatMap['INR'];
    return formatter(amount);
  }

  static parseTimeSlot(timeSlot) {
    if (!timeSlot) return null;
    
    const regex = /(\d{1,2}):?(\d{0,2})\s*(AM|PM)?\s*-\s*(\d{1,2}):?(\d{0,2})\s*(AM|PM)?/i;
    const match = timeSlot.match(regex);
    
    if (!match) return null;

    return {
      startHour: parseInt(match[1]),
      startMinute: parseInt(match[2]) || 0,
      startPeriod: match[3] || '',
      endHour: parseInt(match[4]),
      endMinute: parseInt(match[5]) || 0,
      endPeriod: match[6] || '',
      duration: this.calculateDuration(match[1], match[2] || '0', match[3] || '', match[4], match[5] || '0', match[6] || '')
    };
  }

  static calculateDuration(startHour, startMin, startPeriod, endHour, endMin, endPeriod) {
    const start = this.timeToMinutes(startHour, startMin, startPeriod);
    const end = this.timeToMinutes(endHour, endMin, endPeriod);
    
    let duration = end - start;
    if (duration < 0) duration += 24 * 60; // Handle overnight duration
    
    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;
    
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  }

  static timeToMinutes(hour, minute, period) {
    let h = parseInt(hour);
    const m = parseInt(minute);
    
    if (period && period.toUpperCase() === 'PM' && h !== 12) {
      h += 12;
    } else if (period && period.toUpperCase() === 'AM' && h === 12) {
      h = 0;
    }
    
    return h * 60 + m;
  }

  static validateBudget(budget, currency = 'INR') {
    if (typeof budget !== 'number' || budget <= 0) {
      return { isValid: false, message: 'Budget must be a positive number' };
    }

    const minimumBudgets = {
      'INR': 1000,
      'USD': 50,
      'EUR': 45
    };

    const minimum = minimumBudgets[currency] || minimumBudgets['INR'];
    
    if (budget < minimum) {
      return { 
        isValid: false, 
        message: `Budget too low. Minimum ${currency} ${minimum} required` 
      };
    }

    return { isValid: true, message: 'Budget is valid' };
  }

  static validateParticipants(participants) {
    if (!Number.isInteger(participants) || participants < 1) {
      return { isValid: false, message: 'Participants must be a positive integer' };
    }

    if (participants > 1000) {
      return { isValid: false, message: 'Maximum 1000 participants supported' };
    }

    return { isValid: true, message: 'Participant count is valid' };
  }

  static validateDuration(duration) {
    if (!Number.isInteger(duration) || duration < 1) {
      return { isValid: false, message: 'Duration must be at least 1 day' };
    }

    if (duration > 30) {
      return { isValid: false, message: 'Maximum 30 days supported' };
    }

    return { isValid: true, message: 'Duration is valid' };
  }

  static generateDateRange(startDate, duration) {
    const dates = [];
    const start = new Date(startDate);
    
    for (let i = 0; i < duration; i++) {
      const date = new Date(start);
      date.setDate(date.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }
    
    return dates;
  }

  static formatDateRange(dates) {
    if (!dates || dates.length === 0) return 'Flexible dates';
    if (dates.length === 1) return dates[0];
    
    return `${dates[0]} to ${dates[dates.length - 1]}`;
  }

  static calculateTotalBudget(days) {
    if (!Array.isArray(days)) return 0;
    
    return days.reduce((total, day) => {
      return total + (day.totalCost || 0);
    }, 0);
  }

  static getBudgetBreakdown(itinerary) {
    const breakdown = {
      accommodation: 0,
      dining: 0,
      activities: 0,
      transport: 0,
      miscellaneous: 0
    };

    if (!itinerary.days) return breakdown;

    itinerary.days.forEach(day => {
      if (!day.activities) return;
      
      day.activities.forEach(activity => {
        const cost = activity.cost || 0;
        const category = activity.category?.toLowerCase() || 'miscellaneous';
        
        if (category.includes('dining') || category.includes('meal')) {
          breakdown.dining += cost;
        } else if (category.includes('transport') || category.includes('travel')) {
          breakdown.transport += cost;
        } else if (category.includes('accommodation') || category.includes('hotel')) {
          breakdown.accommodation += cost;
        } else if (category.includes('activity') || category.includes('cultural') || category.includes('adventure')) {
          breakdown.activities += cost;
        } else {
          breakdown.miscellaneous += cost;
        }
      });
    });

    return breakdown;
  }

  static optimizeBudgetDistribution(totalBudget, duration, participantCount, itineraryType) {
    const distribution = {};
    
    if (itineraryType === 'corporate') {
      distribution.venue = totalBudget * 0.35;
      distribution.catering = totalBudget * 0.30;
      distribution.activities = totalBudget * 0.20;
      distribution.materials = totalBudget * 0.10;
      distribution.miscellaneous = totalBudget * 0.05;
    } else {
      distribution.accommodation = totalBudget * 0.35;
      distribution.dining = totalBudget * 0.25;
      distribution.activities = totalBudget * 0.25;
      distribution.transport = totalBudget * 0.10;
      distribution.miscellaneous = totalBudget * 0.05;
    }

    return distribution;
  }

  static findConflicts(itinerary) {
    const conflicts = [];

    if (!itinerary.days) return conflicts;

    itinerary.days.forEach((day, dayIndex) => {
      if (!day.activities) return;

      // Check for time conflicts within a day
      for (let i = 0; i < day.activities.length - 1; i++) {
        const current = day.activities[i];
        const next = day.activities[i + 1];

        const currentSlot = this.parseTimeSlot(current.timeSlot);
        const nextSlot = this.parseTimeSlot(next.timeSlot);

        if (currentSlot && nextSlot) {
          const currentEnd = this.timeToMinutes(currentSlot.endHour, currentSlot.endMinute, currentSlot.endPeriod);
          const nextStart = this.timeToMinutes(nextSlot.startHour, nextSlot.startMinute, nextSlot.startPeriod);

          if (currentEnd > nextStart) {
            conflicts.push({
              type: 'timeConflict',
              day: dayIndex + 1,
              activities: [current.title, next.title],
              message: `Time overlap between "${current.title}" and "${next.title}"`
            });
          }
        }
      }

      // Check for budget overflow
      if (day.totalCost > itinerary.totalBudget * 0.5) {
        conflicts.push({
          type: 'budgetConflict',
          day: dayIndex + 1,
          message: `Day ${dayIndex + 1} budget (${day.totalCost}) exceeds 50% of total budget`
        });
      }
    });

    return conflicts;
  }

  static suggestOptimizations(itinerary) {
    const suggestions = [];

    // Budget optimization
    const totalCost = this.calculateTotalBudget(itinerary.days);
    if (totalCost > itinerary.totalBudget * 1.1) {
      suggestions.push({
        type: 'budget',
        priority: 'high',
        message: 'Consider reducing activity costs or duration to meet budget constraints'
      });
    }

    // Time optimization
    itinerary.days?.forEach((day, index) => {
      if (day.activities && day.activities.length > 8) {
        suggestions.push({
          type: 'schedule',
          priority: 'medium',
          day: index + 1,
          message: `Day ${index + 1} has many activities (${day.activities.length}). Consider spreading them across multiple days.`
        });
      }
    });

    // Variety optimization
    const activityTypes = new Set();
    itinerary.days?.forEach(day => {
      day.activities?.forEach(activity => {
        activityTypes.add(activity.category);
      });
    });

    if (activityTypes.size < 3) {
      suggestions.push({
        type: 'variety',
        priority: 'low',
        message: 'Consider adding more variety in activity types for a better experience'
      });
    }

    return suggestions;
  }

  static exportToCalendar(itinerary, format = 'ics') {
    if (format !== 'ics') {
      throw new Error('Currently only ICS format is supported');
    }

    let ics = 'BEGIN:VCALENDAR\n';
    ics += 'VERSION:2.0\n';
    ics += 'PRODID:-//Itinerary LLM//Event//EN\n';
    ics += `X-WR-CALNAME:${itinerary.title}\n`;

    itinerary.days?.forEach(day => {
      day.activities?.forEach(activity => {
        const eventId = `${day.day}-${activity.id}-${Date.now()}`;
        const timeSlot = this.parseTimeSlot(activity.timeSlot);
        
        ics += 'BEGIN:VEVENT\n';
        ics += `UID:${eventId}\n`;
        ics += `SUMMARY:${activity.title}\n`;
        ics += `DESCRIPTION:${activity.description}\n`;
        
        if (activity.location) {
          ics += `LOCATION:${activity.location}\n`;
        }
        
        if (day.date && timeSlot) {
          const date = day.date.replace(/-/g, '');
          const startTime = this.formatTimeForICS(timeSlot.startHour, timeSlot.startMinute);
          const endTime = this.formatTimeForICS(timeSlot.endHour, timeSlot.endMinute);
          
          ics += `DTSTART:${date}T${startTime}00\n`;
          ics += `DTEND:${date}T${endTime}00\n`;
        }
        
        ics += 'END:VEVENT\n';
      });
    });

    ics += 'END:VCALENDAR\n';
    return ics;
  }

  static formatTimeForICS(hour, minute) {
    return `${hour.toString().padStart(2, '0')}${minute.toString().padStart(2, '0')}`;
  }

  static generateShareableLink(itinerary) {
    // In a real implementation, this would upload to a service and return a URL
    const compressed = this.compressItinerary(itinerary);
    const encoded = btoa(JSON.stringify(compressed));
    return `https://itinerary-share.com/view/${encoded}`;
  }

  static compressItinerary(itinerary) {
    // Remove unnecessary fields for sharing
    return {
      title: itinerary.title,
      summary: itinerary.summary,
      location: itinerary.location,
      duration: itinerary.days?.length || 0,
      totalBudget: itinerary.totalBudget,
      currency: itinerary.currency,
      days: itinerary.days?.map(day => ({
        day: day.day,
        theme: day.theme,
        activities: day.activities?.map(activity => ({
          timeSlot: activity.timeSlot,
          title: activity.title,
          description: activity.description,
          cost: activity.cost,
          location: activity.location
        }))
      }))
    };
  }
}

// src/utils/constants.js
export const CONSTANTS = {
  BUDGET_LIMITS: {
    MIN_INR: 1000,
    MIN_USD: 50,
    MIN_EUR: 45,
    MAX_INR: 10000000, // 1 crore
    MAX_USD: 500000,
    MAX_EUR: 450000
  },

  PARTICIPANT_LIMITS: {
    MIN: 1,
    MAX: 1000
  },

  DURATION_LIMITS: {
    MIN_DAYS: 1,
    MAX_DAYS: 30
  },

  ACTIVITY_CATEGORIES: {
    CORPORATE: [
      'networking',
      'presentation', 
      'training',
      'team_building',
      'break',
      'dining',
      'workshop'
    ],
    TRAVEL: [
      'cultural',
      'adventure',
      'leisure', 
      'dining',
      'shopping',
      'sightseeing',
      'entertainment'
    ]
  },

  TIME_SLOTS: {
    MORNING: ['6:00 AM', '7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM'],
    AFTERNOON: ['12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM'],
    EVENING: ['6:00 PM', '7:00 PM', '8:00 PM', '9:00 PM', '10:00 PM'],
    NIGHT: ['10:00 PM', '11:00 PM']
  },

  BUDGET_DISTRIBUTION: {
    CORPORATE: {
      venue: 0.35,
      catering: 0.30,
      activities: 0.20,
      materials: 0.10,
      miscellaneous: 0.05
    },
    TRAVEL: {
      accommodation: 0.35,
      dining: 0.25,
      activities: 0.25,
      transport: 0.10,
      miscellaneous: 0.05
    }
  },

  API_TIMEOUTS: {
    GROQ: 30000,
    TAVILY: 25000,
    DEFAULT: 20000
  },

  RETRY_LIMITS: {
    MAX_RETRIES: 3,
    DELAY_MS: 1000
  }
};

export const ERROR_MESSAGES = {
  INVALID_INPUT: 'Invalid input provided',
  BUDGET_TOO_LOW: 'Budget is too low for the requested itinerary',
  BUDGET_TOO_HIGH: 'Budget exceeds maximum limit',
  INVALID_PARTICIPANTS: 'Invalid number of participants',
  INVALID_DURATION: 'Invalid duration specified',
  INVALID_LOCATION: 'Location not specified or invalid',
  API_TIMEOUT: 'Request timed out. Please try again.',
  API_RATE_LIMIT: 'Rate limit exceeded. Please wait before trying again.',
  GENERATION_FAILED: 'Failed to generate itinerary',
  REFINEMENT_FAILED: 'Failed to refine itinerary',
  NETWORK_ERROR: 'Network error occurred'
};

export const SUCCESS_MESSAGES = {
  GENERATION_COMPLETE: 'Itinerary generated successfully',
  REFINEMENT_COMPLETE: 'Itinerary refined successfully',
  VALIDATION_PASSED: 'Input validation passed',
  EXPORT_COMPLETE: 'Export completed successfully'
};