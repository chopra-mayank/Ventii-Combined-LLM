// src/agents/enhancedEventPlanner.js
import { groqClient } from '../tools/groqClient.js';
import { ItineraryType } from '../types/index.js';

export class EnhancedEventPlannerAgent {
  constructor() {
    this.name = 'EnhancedEventPlanner';
  }

  async generateItinerary(context, suggestedActivities, researchSummaries) {
    console.log('🗓️ Generating enhanced itinerary with integrated research data...');
    
    // Format research data for itinerary generation
    const formattedResearch = researchSummaries.formatForItineraryGeneration 
      ? researchSummaries.formatForItineraryGeneration(researchSummaries)
      : this.formatResearchData(researchSummaries);

    if (context.type === ItineraryType.CORPORATE) {
      return this.generateCorporateItinerary(context, suggestedActivities, formattedResearch);
    } else {
      return this.generateTravelItinerary(context, suggestedActivities, formattedResearch);
    }
  }

  formatResearchData(researchSummaries) {
    // Fallback formatting if the summarizer doesn't have the format method
    return {
      venues: {
        accommodations: researchSummaries.consolidatedContent?.venues?.filter(v => v.type === 'hotel') || [],
        meetingVenues: researchSummaries.consolidatedContent?.venues?.filter(v => v.type === 'venue') || [],
        restaurants: researchSummaries.consolidatedContent?.venues?.filter(v => v.type === 'restaurant') || [],
        attractions: researchSummaries.consolidatedContent?.venues?.filter(v => v.type === 'attraction') || []
      },
      activities: {
        teamBuilding: researchSummaries.consolidatedContent?.activities?.filter(a => a.type === 'team_building') || [],
        cultural: researchSummaries.consolidatedContent?.activities?.filter(a => a.type === 'cultural') || [],
        adventure: researchSummaries.consolidatedContent?.activities?.filter(a => a.type === 'adventure') || []
      },
      budget: researchSummaries.budgetAnalysis || {},
      logistics: researchSummaries.logisticsSummary || {}
    };
  }

  async generateCorporateItinerary(context, suggestedActivities, formattedResearch) {
    const systemPrompt = `You are an expert corporate event planner creating detailed itineraries.
Use the provided research data to create specific, actionable day-by-day schedules with real venues and activities.

CRITICAL INSTRUCTIONS:
1. Use ONLY the venues and activities from the research data
2. Include specific venue names, addresses, and contact information when available
3. Provide realistic timing and costs based on research data
4. Create logical flow between activities considering location and logistics
5. Ensure activities match the corporate event objectives
6. Include buffer time for transitions and meals
7. Provide detailed booking instructions and requirements

Output a comprehensive itinerary with specific details that can be immediately implemented.`;

    const schema = {
      title: "string",
      summary: "string",
      totalBudget: "number",
      currency: "string",
      days: [
        {
          day: "number",
          date: "string",
          theme: "string",
          activities: [
            {
              timeSlot: "string (e.g., '9:00 AM - 10:30 AM')",
              title: "string",
              description: "string",
              category: "string",
              venue: {
                name: "string",
                address: "string",
                contact: "string",
                capacity: "string"
              },
              cost: "number",
              requirements: "array of strings",
              bookingInstructions: "string",
              logisticalNotes: "string"
            }
          ],
          totalCost: "number",
          meals: {
            breakfast: "object with venue and cost",
            lunch: "object with venue and cost", 
            dinner: "object with venue and cost"
          },
          transportation: "string",
          notes: "string"
        }
      ],
      budgetBreakdown: {
        accommodation: "number",
        activities: "number",
        meals: "number",
        transportation: "number",
        miscellaneous: "number"
      },
      bookingTimeline: "array of booking deadlines and instructions",
      emergencyPlan: "object with contingency arrangements",
      requirementsList: "array of items needed for successful execution"
    };

    const prompt = `Generate a comprehensive corporate itinerary for ${context.eventType} in ${context.location}:

EVENT CONTEXT:
- Type: ${context.eventType}
- Location: ${context.location}
- Participants: ${context.participants}
- Duration: ${context.duration} days
- Budget: ${context.currency} ${context.budget}
- Focus: ${context.focus}
- Dietary Requirements: ${context.dietary?.join(', ') || 'None specified'}
- Special Requests: ${context.specialRequests || 'None'}

SUGGESTED ACTIVITIES (integrate these with research data):
${JSON.stringify(suggestedActivities, null, 2)}

RESEARCH DATA TO USE:
Available Venues:
- Meeting Venues: ${JSON.stringify(formattedResearch.venues.meetingVenues, null, 2)}
- Accommodations: ${JSON.stringify(formattedResearch.venues.accommodations, null, 2)}
- Restaurants: ${JSON.stringify(formattedResearch.venues.restaurants, null, 2)}
- Attractions: ${JSON.stringify(formattedResearch.venues.attractions, null, 2)}

Available Activities:
- Team Building: ${JSON.stringify(formattedResearch.activities.teamBuilding, null, 2)}
- Cultural: ${JSON.stringify(formattedResearch.activities.cultural, null, 2)}
- Adventure: ${JSON.stringify(formattedResearch.activities.adventure, null, 2)}

Budget Guidelines:
${JSON.stringify(formattedResearch.budget, null, 2)}

Logistics Information:
${JSON.stringify(formattedResearch.logistics, null, 2)}

REQUIREMENTS:
1. Use ONLY venues and activities from the research data above
2. Include specific venue names, addresses, contacts from research
3. Create realistic timing based on venue operating hours
4. Provide exact costs when available from research
5. Ensure logical geographical flow between activities
6. Include detailed booking and logistics instructions
7. Create contingency plans for weather/availability issues

Generate a detailed, implementable itinerary that maximizes the use of researched information.`;

    try {
      const itinerary = await groqClient.parseStructuredResponse(prompt, systemPrompt, schema);
      return this.enrichItinerary(itinerary, context, formattedResearch);
    } catch (error) {
      console.error('Corporate itinerary generation failed:', error);
      return this.generateFallbackItinerary(context, suggestedActivities, formattedResearch);
    }
  }

  async generateTravelItinerary(context, suggestedActivities, formattedResearch) {
    const systemPrompt = `You are an expert travel planner creating detailed itineraries.
Use the provided research data to create specific, actionable day-by-day travel schedules with real venues and activities.

CRITICAL INSTRUCTIONS:
1. Use ONLY the venues and activities from the research data
2. Include specific venue names, addresses, and practical information
3. Create logical geographical flow to minimize travel time
4. Balance different types of activities for engaging experience
5. Include cultural immersion opportunities using researched venues
6. Provide realistic timing and costs based on research data
7. Include practical tips from research (local insights, transportation, etc.)

Create an itinerary that feels authentic to the destination using real researched venues.`;

    const schema = {
      title: "string",
      summary: "string",
      totalBudget: "number",
      currency: "string",
      days: [
        {
          day: "number",
          date: "string",
          theme: "string",
          activities: [
            {
              timeSlot: "string",
              title: "string",
              description: "string",
              category: "string",
              venue: {
                name: "string",
                address: "string",
                highlights: "array of strings"
              },
              cost: "number",
              duration: "string",
              travelTime: "string",
              tips: "array of practical tips",
              alternatives: "array of backup options"
            }
          ],
          totalCost: "number",
          meals: {
            breakfast: "object with venue details",
            lunch: "object with venue details",
            dinner: "object with venue details"
          },
          transportation: "detailed transportation plan",
          accommodationNotes: "string",
          localTips: "array of location-specific tips"
        }
      ],
      accommodationPlan: {
        primaryOption: "object with detailed accommodation info",
        alternatives: "array of backup accommodation options"
      },
      budgetBreakdown: "detailed cost breakdown",
      travelTips: "array of practical travel tips from research",
      emergencyInfo: "object with local emergency information"
    };

    const prompt = `Generate a comprehensive travel itinerary for ${context.location}:

TRAVEL CONTEXT:
- Destination: ${context.location}
- Travelers: ${context.participants}
- Duration: ${context.duration} days
- Budget: ${context.currency} ${context.budget}
- Preferences: ${context.preferences?.join(', ') || 'General tourism'}
- Dietary Requirements: ${context.dietary?.join(', ') || 'None specified'}

SUGGESTED ACTIVITIES (integrate with research):
${JSON.stringify(suggestedActivities, null, 2)}

RESEARCH DATA TO USE:
Available Venues:
- Accommodations: ${JSON.stringify(formattedResearch.venues.accommodations, null, 2)}
- Restaurants: ${JSON.stringify(formattedResearch.venues.restaurants, null, 2)}
- Attractions: ${JSON.stringify(formattedResearch.venues.attractions, null, 2)}

Available Activities:
- Cultural: ${JSON.stringify(formattedResearch.activities.cultural, null, 2)}
- Adventure: ${JSON.stringify(formattedResearch.activities.adventure, null, 2)}

Budget Guidelines:
${JSON.stringify(formattedResearch.budget, null, 2)}

Local Information:
${JSON.stringify(formattedResearch.logistics, null, 2)}

REQUIREMENTS:
1. Use ONLY venues and activities from the research data
2. Include specific venue names and addresses from research
3. Create logical geographical flow between activities
4. Balance activity types for engaging experience
5. Include local cultural experiences using researched venues
6. Provide realistic costs and timing from research
7. Include practical local tips and insights from research

Generate a detailed, authentic itinerary using the researched venues and activities.`;

    try {
      const itinerary = await groqClient.parseStructuredResponse(prompt, systemPrompt, schema);
      return this.enrichItinerary(itinerary, context, formattedResearch);
    } catch (error) {
      console.error('Travel itinerary generation failed:', error);
      return this.generateFallbackItinerary(context, suggestedActivities, formattedResearch);
    }
  }

  enrichItinerary(itinerary, context, researchData) {
    // Add metadata and validation
    const enriched = {
      ...itinerary,
      id: this.generateItineraryId(),
      type: context.type,
      location: context.location,
      participants: context.participants,
      generatedAt: new Date().toISOString(),
      researchDataUsed: {
        venuesCount: Object.values(researchData.venues).flat().length,
        activitiesCount: Object.values(researchData.activities).flat().length,
        hasLocalInsights: !!(researchData.logistics.localFactors)
      },
      metadata: {
        originalInput: context,
        version: '2.0-enhanced',
        generator: 'EnhancedEventPlannerAgent',
        dataIntegrationScore: this.calculateDataIntegrationScore(itinerary, researchData)
      }
    };

    // Add IDs to activities and validate venue usage
    enriched.days = enriched.days.map((day, dayIndex) => ({
      ...day,
      activities: day.activities.map((activity, actIndex) => ({
        ...activity,
        id: `day${dayIndex + 1}_activity${actIndex + 1}`,
        dataSource: this.identifyDataSource(activity, researchData)
      }))
    }));

    return enriched;
  }

  calculateDataIntegrationScore(itinerary, researchData) {
    let score = 0;
    let totalActivities = 0;
    
    // Count activities that use research data
    itinerary.days.forEach(day => {
      day.activities.forEach(activity => {
        totalActivities++;
        if (activity.venue && activity.venue.name) {
          // Check if venue comes from research data
          const isFromResearch = this.isVenueFromResearch(activity.venue, researchData);
          if (isFromResearch) score += 1;
        }
      });
    });

    return totalActivities > 0 ? Math.round((score / totalActivities) * 100) : 0;
  }

  isVenueFromResearch(venue, researchData) {
    const allVenues = Object.values(researchData.venues).flat();
    return allVenues.some(researchVenue => 
      researchVenue.name && venue.name &&
      researchVenue.name.toLowerCase().includes(venue.name.toLowerCase())
    );
  }

  identifyDataSource(activity, researchData) {
    if (activity.venue && this.isVenueFromResearch(activity.venue, researchData)) {
      return 'research_data';
    }
    return 'llm_generated';
  }

  generateFallbackItinerary(context, suggestedActivities, researchData) {
    // Create a basic itinerary when main generation fails
    const days = [];
    
    for (let i = 1; i <= context.duration; i++) {
      const day = {
        day: i,
        date: 'TBD',
        theme: `Day ${i} Activities`,
        activities: [],
        totalCost: Math.round(context.budget / context.duration),
        meals: {
          breakfast: { venue: 'Hotel/Local restaurant', cost: 500 },
          lunch: { venue: 'Local restaurant', cost: 800 },
          dinner: { venue: 'Local restaurant', cost: 1200 }
        },
        transportation: 'Local transport',
        notes: 'Detailed planning required'
      };

      // Add some basic activities from research data
      const availableActivities = Object.values(researchData.activities).flat();
      if (availableActivities.length > 0) {
        const selectedActivity = availableActivities[i % availableActivities.length];
        day.activities.push({
          timeSlot: '10:00 AM - 12:00 PM',
          title: selectedActivity.name || `Activity ${i}`,
          description: selectedActivity.description || 'Activity details to be confirmed',
          category: selectedActivity.type || 'general',
          venue: {
            name: selectedActivity.location || 'TBD',
            address: 'To be confirmed',
            contact: 'TBD'
          },
          cost: 2000,
          requirements: selectedActivity.requirements || [],
          bookingInstructions: 'Book in advance',
          logisticalNotes: 'Confirm availability'
        });
      }

      days.push(day);
    }

    return {
      title: `${context.type} Itinerary for ${context.location}`,
      summary: `A ${context.duration}-day itinerary for ${context.participants} participants`,
      totalBudget: context.budget,
      currency: context.currency,
      days: days,
      budgetBreakdown: {
        accommodation: Math.round(context.budget * 0.4),
        activities: Math.round(context.budget * 0.3),
        meals: Math.round(context.budget * 0.2),
        transportation: Math.round(context.budget * 0.08),
        miscellaneous: Math.round(context.budget * 0.02)
      },
      bookingTimeline: ['Book accommodation 2 weeks prior', 'Confirm activities 1 week prior'],
      emergencyPlan: { backup: 'Indoor alternatives for weather issues' },
      requirementsList: ['Transportation', 'Meal arrangements', 'Activity bookings'],
      metadata: {
        isFallback: true,
        generatedAt: new Date().toISOString()
      }
    };
  }

  generateItineraryId() {
    return `enhanced_itinerary_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Enhanced refinement methods that maintain research data integration
  async refineItineraryWithResearch(originalItinerary, refinementPrompt, context, researchData) {
    const systemPrompt = `You are refining an existing itinerary while maintaining integration with research data.
Keep all specific venue names and details from research unless explicitly asked to change them.
When making changes, prioritize using venues and activities from the available research data.`;

    const schema = {
      refinedItinerary: "complete itinerary object with all original structure",
      changesLog: "array of strings describing what was modified",
      dataIntegrityMaintained: "boolean indicating if research data integration was preserved"
    };

    const prompt = `Refine this itinerary based on the request while maintaining research data integration:

Original Itinerary: ${JSON.stringify(originalItinerary, null, 2)}

Refinement Request: "${refinementPrompt}"

Available Research Data: ${JSON.stringify(researchData, null, 2)}

Context: ${JSON.stringify(context, null, 2)}

Please modify the itinerary according to the request but prioritize keeping specific venue names and details from the research data. When adding new elements, use the available research data.`;

    try {
      const refined = await groqClient.parseStructuredResponse(prompt, systemPrompt, schema);
      return this.enrichItinerary(refined.refinedItinerary, context, researchData);
    } catch (error) {
      console.error('Enhanced itinerary refinement failed:', error);
      throw error;
    }
  }

  // Validation specific to research data integration
  validateItineraryDataIntegration(itinerary, researchData) {
    const validation = {
      isValid: true,
      warnings: [],
      suggestions: [],
      dataIntegrationScore: itinerary.metadata?.dataIntegrationScore || 0
    };

    // Check if venues are from research
    itinerary.days.forEach((day, dayIndex) => {
      day.activities.forEach((activity, actIndex) => {
        if (activity.venue && !this.isVenueFromResearch(activity.venue, researchData)) {
          validation.warnings.push(
            `Day ${dayIndex + 1}, Activity ${actIndex + 1}: Venue "${activity.venue.name}" not found in research data`
          );
        }
      });
    });

    // Check data integration score
    if (validation.dataIntegrationScore < 50) {
      validation.suggestions.push('Consider improving integration with research data for more authentic local experiences');
    }

    return validation;
  }
}