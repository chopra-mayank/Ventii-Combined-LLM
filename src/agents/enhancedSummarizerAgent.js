// src/agents/enhancedSummarizerAgent.js
import { groqClient } from '../tools/groqClient.js';

export class EnhancedSummarizerAgent {
  constructor() {
    this.name = 'EnhancedSummarizerAgent';
  }

  async summarizeExtractedContent(structuredContent, context) {
    console.log('📝 Starting enhanced content summarization...');
    
    // Consolidate all structured content
    const consolidatedContent = this.consolidateStructuredContent(structuredContent);
    
    // Create comprehensive summaries by category
    const categorySummaries = await this.createCategorySummaries(consolidatedContent, context);
    
    // Generate actionable recommendations
    const recommendations = await this.generateActionableRecommendations(consolidatedContent, context);
    
    // Create budget analysis
    const budgetAnalysis = await this.analyzeBudgetImplications(consolidatedContent, context);
    
    // Generate practical logistics summary
    const logisticsSummary = await this.summarizeLogistics(consolidatedContent, context);
    
    return {
      categorySummaries,
      recommendations,
      budgetAnalysis,
      logisticsSummary,
      consolidatedContent,
      metadata: {
        totalVenues: consolidatedContent.venues.length,
        totalActivities: consolidatedContent.activities.length,
        summarizedAt: new Date().toISOString(),
        context: context
      }
    };
  }

  consolidateStructuredContent(structuredContentArray) {
    const consolidated = {
      venues: [],
      activities: [],
      practicalInfo: {
        transportation: [],
        budgetInsights: [],
        seasonalTips: [],
        localTips: []
      }
    };

    structuredContentArray.forEach(content => {
      if (content.venues) {
        consolidated.venues.push(...content.venues);
      }
      if (content.activities) {
        consolidated.activities.push(...content.activities);
      }
      if (content.practicalInfo) {
        Object.keys(content.practicalInfo).forEach(key => {
          if (Array.isArray(content.practicalInfo[key])) {
            consolidated.practicalInfo[key].push(...content.practicalInfo[key]);
          }
        });
      }
    });

    // Remove duplicates and sort by relevance
    consolidated.venues = this.removeDuplicateVenues(consolidated.venues);
    consolidated.activities = this.removeDuplicateActivities(consolidated.activities);
    
    // Remove duplicate practical info
    Object.keys(consolidated.practicalInfo).forEach(key => {
      consolidated.practicalInfo[key] = [...new Set(consolidated.practicalInfo[key])];
    });

    return consolidated;
  }

  removeDuplicateVenues(venues) {
    const seen = new Set();
    return venues
      .filter(venue => {
        const key = venue.name.toLowerCase() + venue.location.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
  }

  removeDuplicateActivities(activities) {
    const seen = new Set();
    return activities
      .filter(activity => {
        const key = activity.name.toLowerCase() + activity.type;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
  }

  async createCategorySummaries(consolidatedContent, context) {
    const systemPrompt = `You are creating comprehensive category summaries for itinerary planning.
Organize and summarize the information in a way that's directly useful for creating detailed day-by-day itineraries.

Focus on:
1. Grouping similar items logically
2. Highlighting unique features and standout options
3. Providing cost ranges and budget insights
4. Including practical booking and logistics information
5. Noting group suitability and capacity constraints
6. Identifying must-visit vs optional items`;

    const schema = {
      accommodationSummary: {
        overview: "string",
        topOptions: [
          {
            name: "string",
            type: "string",
            priceRange: "string",
            capacity: "string",
            highlights: "array of strings",
            bookingNotes: "string"
          }
        ],
        budgetInsights: "string",
        recommendations: "string"
      },
      venuesSummary: {
        overview: "string",
        conferenceVenues: "array of venue objects",
        diningOptions: "array of venue objects",
        attractionVenues: "array of venue objects",
        recommendations: "string"
      },
      activitiesSummary: {
        overview: "string",
        teamBuildingActivities: "array of activity objects",
        culturalActivities: "array of activity objects",
        adventureActivities: "array of activity objects",
        recommendations: "string"
      },
      practicalSummary: {
        transportation: "string",
        budgetConsiderations: "string",
        seasonalFactors: "string",
        localInsights: "string"
      }
    };

    const prompt = `Create comprehensive category summaries for ${context.type} itinerary in ${context.location}:

Context:
- Location: ${context.location}
- Type: ${context.type}
- Participants: ${context.participants}
- Duration: ${context.duration} days
- Budget: ${context.currency} ${context.budget}

Available Data:
- Venues: ${JSON.stringify(consolidatedContent.venues.slice(0, 10), null, 2)}
- Activities: ${JSON.stringify(consolidatedContent.activities.slice(0, 10), null, 2)}
- Practical Info: ${JSON.stringify(consolidatedContent.practicalInfo, null, 2)}

Create detailed summaries that will help generate specific, actionable itinerary recommendations.`;

    try {
      const completion = await groqClient.chat.completions.create({
        messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: prompt }],
        model: 'llama3-70b-8192',
        temperature: 0.1,
        response_format: { type: "json_object" },
        max_tokens: 4000
      });

      const response = completion.choices[0]?.message?.content || '{}';
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error('No valid JSON in response');
    } catch (error) {
      console.error('Category summarization failed:', error.message);
      return this.createFallbackSummaries(consolidatedContent, context);
    }
  }

  async generateActionableRecommendations(consolidatedContent, context) {
    const systemPrompt = `Generate specific, actionable recommendations for itinerary planning.
Focus on creating recommendations that can be directly used in day-by-day planning with specific venues, activities, and logistics.`;

    const schema = {
      mustHaveItems: [
        {
          item: "string",
          type: "venue | activity | service",
          reasoning: "string",
          cost: "string",
          bookingAdvice: "string"
        }
      ],
      dayStructureRecommendations: [
        {
          dayType: "string (e.g., 'arrival day', 'main activity day')",
          structure: "string",
          recommendedActivities: "array of strings",
          budgetAllocation: "string"
        }
      ],
      logisticalRecommendations: [
        {
          category: "string (e.g., 'transportation', 'meals')",
          recommendation: "string",
          cost: "string",
          implementation: "string"
        }
      ],
      budgetOptimizationTips: "array of strings",
      riskMitigation: "array of strings"
    };

    const prompt = `Generate actionable recommendations for ${context.type} itinerary planning:

Context: ${JSON.stringify(context, null, 2)}

Available Options:
Top Venues: ${JSON.stringify(consolidatedContent.venues.slice(0, 5), null, 2)}
Top Activities: ${JSON.stringify(consolidatedContent.activities.slice(0, 5), null, 2)}

Provide specific, implementable recommendations that can guide detailed itinerary creation.`;

    try {
      const completion = await groqClient.chat.completions.create({
        messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: prompt }],
        model: 'llama3-70b-8192',
        temperature: 0.1,
        response_format: { type: "json_object" },
        max_tokens: 4000
      });

      const response = completion.choices[0]?.message?.content || '{}';
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error('No valid JSON in response');
    } catch (error) {
      console.error('Recommendations generation failed:', error.message);
      return this.createFallbackRecommendations(consolidatedContent, context);
    }
  }

  async analyzeBudgetImplications(consolidatedContent, context) {
    const systemPrompt = `Analyze budget implications and create detailed budget breakdowns for itinerary planning.
Provide realistic cost estimates and budget allocation recommendations.`;

    const schema = {
      totalBudgetAnalysis: {
        availableBudget: "number",
        perPersonBudget: "number",
        perDayBudget: "number",
        feasibilityAssessment: "string"
      },
      costBreakdown: {
        accommodation: {
          estimatedCost: "number",
          percentage: "number",
          options: "array of cost options"
        },
        activities: {
          estimatedCost: "number",
          percentage: "number",
          options: "array of cost options"
        },
        meals: {
          estimatedCost: "number",
          percentage: "number",
          options: "array of cost options"
        },
        transportation: {
          estimatedCost: "number",
          percentage: "number",
          options: "array of cost options"
        },
        miscellaneous: {
          estimatedCost: "number",
          percentage: "number",
          description: "string"
        }
      },
      budgetScenarios: [
        {
          scenario: "string (e.g., 'budget', 'standard', 'premium')",
          totalCost: "number",
          description: "string",
          tradeoffs: "string"
        }
      ],
      costOptimizationTips: "array of strings"
    };

    // Extract cost information from venues and activities
    const costData = this.extractCostInformation(consolidatedContent);

    const prompt = `Analyze budget implications for ${context.type} itinerary:

Context:
- Total Budget: ${context.currency} ${context.budget}
- Participants: ${context.participants}
- Duration: ${context.duration} days
- Location: ${context.location}

Available Cost Data:
${JSON.stringify(costData, null, 2)}

Provide detailed budget analysis and allocation recommendations.`;

    try {
      const completion = await groqClient.chat.completions.create({
        messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: prompt }],
        model: 'llama3-70b-8192',
        temperature: 0.1,
        response_format: { type: "json_object" },
        max_tokens: 4000
      });

      const response = completion.choices[0]?.message?.content || '{}';
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error('No valid JSON in response');
    } catch (error) {
      console.error('Budget analysis failed:', error.message);
      return this.createFallbackBudgetAnalysis(context);
    }
  }

  extractCostInformation(consolidatedContent) {
    const costData = {
      venues: [],
      activities: [],
      priceRanges: {
        low: [],
        medium: [],
        high: []
      }
    };

    // Extract venue costs
    consolidatedContent.venues.forEach(venue => {
      if (venue.cost) {
        costData.venues.push({
          name: venue.name,
          type: venue.type,
          cost: venue.cost,
          capacity: venue.capacity
        });
      }
    });

    // Extract activity costs  
    consolidatedContent.activities.forEach(activity => {
      if (activity.cost) {
        costData.activities.push({
          name: activity.name,
          type: activity.type,
          cost: activity.cost,
          groupSize: activity.groupSize
        });
      }
    });

    return costData;
  }

  async summarizeLogistics(consolidatedContent, context) {
    const systemPrompt = `Create a comprehensive logistics summary for itinerary planning.
Focus on practical implementation details that will be needed for day-by-day planning.`;

    const schema = {
      transportationPlan: {
        overview: "string",
        options: [
          {
            method: "string",
            cost: "string", 
            suitability: "string",
            bookingInfo: "string"
          }
        ],
        recommendations: "string"
      },
      timingConsiderations: {
        peakSeasons: "string",
        operatingHours: "string",
        bookingLeadTimes: "string",
        groupScheduling: "string"
      },
      groupLogistics: {
        coordinationNeeds: "string",
        communicationPlan: "string",
        contingencyPlanning: "string"
      },
      localFactors: {
        weather: "string",
        culturalConsiderations: "string",
        safetyNotes: "string",
        emergencyInfo: "string"
      }
    };

    const prompt = `Create logistics summary for ${context.type} itinerary in ${context.location}:

Context: ${JSON.stringify(context, null, 2)}

Transportation Info: ${JSON.stringify(consolidatedContent.practicalInfo.transportation, null, 2)}
Local Tips: ${JSON.stringify(consolidatedContent.practicalInfo.localTips, null, 2)}
Seasonal Tips: ${JSON.stringify(consolidatedContent.practicalInfo.seasonalTips, null, 2)}

Provide comprehensive logistics guidance for itinerary implementation.`;

    try {
      const completion = await groqClient.chat.completions.create({
        messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: prompt }],
        model: 'llama3-70b-8192',
        temperature: 0.1,
        response_format: { type: "json_object" },
        max_tokens: 4000
      });

      const response = completion.choices[0]?.message?.content || '{}';
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error('No valid JSON in response');
    } catch (error) {
      console.error('Logistics summarization failed:', error.message);
      return this.createFallbackLogistics(context);
    }
  }

  // Fallback methods for when LLM calls fail
  createFallbackSummaries(consolidatedContent, context) {
    return {
      accommodationSummary: {
        overview: `Found ${consolidatedContent.venues.filter(v => v.type === 'hotel').length} accommodation options in ${context.location}`,
        topOptions: consolidatedContent.venues.filter(v => v.type === 'hotel').slice(0, 3),
        budgetInsights: "Cost analysis unavailable",
        recommendations: "Manual review of accommodation options recommended"
      },
      venuesSummary: {
        overview: `Available venues in ${context.location}`,
        conferenceVenues: consolidatedContent.venues.filter(v => v.type === 'venue'),
        diningOptions: consolidatedContent.venues.filter(v => v.type === 'restaurant'),
        attractionVenues: consolidatedContent.venues.filter(v => v.type === 'attraction'),
        recommendations: "Review individual venue options"
      },
      activitiesSummary: {
        overview: `Found ${consolidatedContent.activities.length} activities`,
        teamBuildingActivities: consolidatedContent.activities.filter(a => a.type === 'team_building'),
        culturalActivities: consolidatedContent.activities.filter(a => a.type === 'cultural'),
        adventureActivities: consolidatedContent.activities.filter(a => a.type === 'adventure'),
        recommendations: "Manual activity selection recommended"
      },
      practicalSummary: {
        transportation: consolidatedContent.practicalInfo.transportation.join(', ') || 'Transportation info not available',
        budgetConsiderations: consolidatedContent.practicalInfo.budgetInsights.join(', ') || 'Budget analysis pending',
        seasonalFactors: consolidatedContent.practicalInfo.seasonalTips.join(', ') || 'Seasonal info not available',
        localInsights: consolidatedContent.practicalInfo.localTips.join(', ') || 'Local insights not available'
      }
    };
  }

  createFallbackRecommendations(consolidatedContent, context) {
    return {
      mustHaveItems: consolidatedContent.venues.slice(0, 3).map(venue => ({
        item: venue.name,
        type: venue.type,
        reasoning: `High-rated ${venue.type} in ${context.location}`,
        cost: venue.cost || 'Cost TBD',
        bookingAdvice: venue.bookingInfo || 'Contact venue directly'
      })),
      dayStructureRecommendations: [
        {
          dayType: 'Standard day',
          structure: 'Morning activity, lunch, afternoon activity, dinner',
          recommendedActivities: consolidatedContent.activities.slice(0, 3).map(a => a.name),
          budgetAllocation: `${Math.round(context.budget / context.duration)} per day`
        }
      ],
      logisticalRecommendations: [
        {
          category: 'transportation',
          recommendation: 'Arrange group transportation',
          cost: 'TBD',
          implementation: 'Book in advance'
        }
      ],
      budgetOptimizationTips: [
        'Book accommodations early for group discounts',
        'Consider off-season timing',
        'Look for group discounts',
        'Bundle activities for savings'
      ],
      riskMitigation: [
        'Have backup indoor activities for weather',
        'Confirm all bookings 48 hours before',
        'Keep emergency contact list'
      ]
    };
  }

  createFallbackBudgetAnalysis(context) {
    const perPersonBudget = Math.round(context.budget / context.participants);
    const perDayBudget = Math.round(context.budget / context.duration);

    return {
      totalBudgetAnalysis: {
        availableBudget: context.budget,
        perPersonBudget: perPersonBudget,
        perDayBudget: perDayBudget,
        feasibilityAssessment: `Budget of ${context.currency} ${context.budget} for ${context.participants} people over ${context.duration} days`
      },
      costBreakdown: {
        accommodation: {
          estimatedCost: Math.round(context.budget * 0.4),
          percentage: 40,
          options: ['Budget hotels', 'Mid-range hotels', 'Premium resorts']
        },
        activities: {
          estimatedCost: Math.round(context.budget * 0.3),
          percentage: 30,
          options: ['Group activities', 'Individual experiences', 'Premium tours']
        },
        meals: {
          estimatedCost: Math.round(context.budget * 0.2),
          percentage: 20,
          options: ['Local restaurants', 'Hotel dining', 'Catered meals']
        },
        transportation: {
          estimatedCost: Math.round(context.budget * 0.08),
          percentage: 8,
          options: ['Public transport', 'Private bus', 'Individual taxis']
        },
        miscellaneous: {
          estimatedCost: Math.round(context.budget * 0.02),
          percentage: 2,
          description: 'Tips, emergency fund, miscellaneous expenses'
        }
      },
      budgetScenarios: [
        {
          scenario: 'budget',
          totalCost: Math.round(context.budget * 0.8),
          description: 'Basic accommodations and activities',
          tradeoffs: 'Limited premium experiences'
        },
        {
          scenario: 'standard',
          totalCost: context.budget,
          description: 'Balanced mix of experiences',
          tradeoffs: 'Good value for money'
        },
        {
          scenario: 'premium',
          totalCost: Math.round(context.budget * 1.2),
          description: 'High-end accommodations and unique experiences',
          tradeoffs: 'Exceeds initial budget'
        }
      ],
      costOptimizationTips: [
        'Book accommodations early for group discounts',
        'Consider off-season timing',
        'Look for group discounts',
        'Bundle activities for savings'
      ],
      riskMitigation: [
        'Have backup indoor activities for weather',
        'Confirm all bookings 48 hours before',
        'Keep emergency contact list'
      ]
    };
  }

  createFallbackLogistics(context) {
    return {
      transportationPlan: {
        overview: `Transportation planning for ${context.participants} people in ${context.location}`,
        options: [
          {
            method: 'Private bus/coach',
            cost: 'TBD - depends on distance and duration',
            suitability: 'Best for large groups',
            bookingInfo: 'Book 2-3 weeks in advance'
          },
          {
            method: 'Multiple taxis/cabs',
            cost: 'Higher cost but more flexible',
            suitability: 'Good for smaller groups or split activities',
            bookingInfo: 'Can be arranged day-of'
          }
        ],
        recommendations: 'Private bus recommended for group cohesion and cost efficiency'
      },
      timingConsiderations: {
        peakSeasons: 'Check local peak tourist seasons',
        operatingHours: 'Verify venue and attraction operating hours',
        bookingLeadTimes: 'Book accommodations and major activities 2-4 weeks ahead',
        groupScheduling: 'Allow buffer time between activities for group movement'
      },
      groupLogistics: {
        coordinationNeeds: 'Designate group leaders and point persons',
        communicationPlan: 'Establish WhatsApp group or similar for coordination',
        contingencyPlanning: 'Have backup indoor activities and flexible scheduling'
      },
      localFactors: {
        weather: `Check ${context.location} weather patterns for travel dates`,
        culturalConsiderations: 'Research local customs and dress codes',
        safetyNotes: 'Keep emergency contacts and first aid readily available',
        emergencyInfo: 'Identify nearest hospitals and police stations'
      }
    };
  }

  // Helper method to format summaries for itinerary generation
  formatForItineraryGeneration(summaries) {
    return {
      venues: {
        accommodations: summaries.categorySummaries.accommodationSummary.topOptions,
        meetingVenues: summaries.categorySummaries.venuesSummary.conferenceVenues,
        restaurants: summaries.categorySummaries.venuesSummary.diningOptions,
        attractions: summaries.categorySummaries.venuesSummary.attractionVenues
      },
      activities: {
        teamBuilding: summaries.categorySummaries.activitiesSummary.teamBuildingActivities,
        cultural: summaries.categorySummaries.activitiesSummary.culturalActivities,
        adventure: summaries.categorySummaries.activitiesSummary.adventureActivities
      },
      recommendations: {
        mustHave: summaries.recommendations.mustHaveItems,
        dayStructures: summaries.recommendations.dayStructureRecommendations,
        logistics: summaries.recommendations.logisticalRecommendations
      },
      budget: {
        breakdown: summaries.budgetAnalysis.costBreakdown,
        scenarios: summaries.budgetAnalysis.budgetScenarios,
        optimizationTips: summaries.budgetAnalysis.costOptimizationTips
      },
      logistics: {
        transportation: summaries.logisticsSummary.transportationPlan,
        timing: summaries.logisticsSummary.timingConsiderations,
        groupCoordination: summaries.logisticsSummary.groupLogistics,
        localFactors: summaries.logisticsSummary.localFactors
      }
    };
  }

  // Validation and quality checks
  validateSummaryQuality(summaries) {
    const validation = {
      isValid: true,
      warnings: [],
      suggestions: []
    };

    // Check if we have sufficient venue data
    const totalVenues = summaries.consolidatedContent.venues.length;
    if (totalVenues < 3) {
      validation.warnings.push(`Only ${totalVenues} venues found. Consider broader search.`);
    }

    // Check if we have sufficient activity data
    const totalActivities = summaries.consolidatedContent.activities.length;
    if (totalActivities < 3) {
      validation.warnings.push(`Only ${totalActivities} activities found. Consider expanding search criteria.`);
    }

    // Check budget analysis completeness
    if (!summaries.budgetAnalysis.costBreakdown.accommodation.estimatedCost) {
      validation.warnings.push('Accommodation cost estimates missing.');
    }

    // Check logistics completeness
    if (!summaries.logisticsSummary.transportationPlan.options.length) {
      validation.warnings.push('Transportation options not identified.');
    }

    return validation;
  }
}