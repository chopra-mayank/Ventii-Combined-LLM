// src/types/index.js

export const ItineraryType = {
  TRAVEL: 'travel',
  CORPORATE: 'corporate'
};

export const EventType = {
  TRAINING: 'training',
  CONFERENCE: 'conference',
  TEAM_BUILDING: 'team_building',
  OFFSITE: 'offsite',
  SEMINAR: 'seminar'
};

export const ActivityCategory = {
  CULTURAL: 'cultural',
  ADVENTURE: 'adventure',
  LEISURE: 'leisure',
  DINING: 'dining',
  SHOPPING: 'shopping',
  NETWORKING: 'networking',
  PRESENTATION: 'presentation',
  BREAK: 'break'
};

export const createInputSchema = () => ({
  type: '', // ItineraryType
  location: '',
  participants: 0,
  duration: 0, // in days
  budget: 0,
  currency: 'INR',
  date: '',
  preferences: [],
  dietary: [],
  eventType: '', // EventType (for corporate)
  focus: '', // main focus/theme
  specialRequests: ''
});

export const createActivitySchema = () => ({
  id: '',
  title: '',
  description: '',
  category: '', // ActivityCategory
  duration: '', // e.g., "2 hours"
  cost: 0,
  location: '',
  timeSlot: '',
  requirements: [],
  alternatives: []
});

export const createItinerarySchema = () => ({
  id: '',
  type: '', // ItineraryType
  title: '',
  summary: '',
  totalBudget: 0,
  currency: 'INR',
  location: '',
  participants: 0,
  days: [], // Array of day objects
  generatedAt: new Date().toISOString(),
  metadata: {}
});

export const createDaySchema = () => ({
  day: 0,
  date: '',
  theme: '',
  activities: [], // Array of activities
  totalCost: 0,
  notes: ''
});