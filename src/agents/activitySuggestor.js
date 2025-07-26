// src/agents/activitySuggestor.js
import { groqClient } from '../tools/groqClient.js';
import { ActivityCategory, ItineraryType } from '../types/index.js';

export class ActivitySuggestorAgent {
  constructor() {
    this.name = 'ActivitySuggestor';
  }

  async suggestActivities(parsedInput) {
    if (parsedInput.type === ItineraryType.CORPORATE) {
      return this.suggestCorporateActivities(parsedInput);
    } else {
      return this.suggestTravelActivities(parsedInput);
    }
  }

  async suggestCorporateActivities(input) {
    const systemPrompt = `You are an expert corporate event planner. Generate engaging, practical activities 
for corporate events based on the input parameters. Consider team size, budget, duration, and event focus.

Key considerations:
- Participant engagement and interaction
- Budget appropriateness 
- Time management and flow
- Professional yet engaging atmosphere
- Measurable outcomes where applicable

Output activities with specific details including duration, estimated costs, and requirements.`;

    const schema = {
      activities: [
        {
          title: "string",
          description: "string",
          category: "networking | presentation | team_building | break | dining",
          duration: "string (e.g., '2 hours')",
          estimatedCost: "number",
          participants: "number",
          requirements: "array of strings",
          timeSlot: "string (e.g., '9:00 AM - 11:00 AM')",
          alternatives: "array of alternative options"
        }
      ],
      totalEstimatedCost: "number",
      notes: "string"
    };

    const prompt = `Generate corporate activities for:
- Event Type: ${input.eventType}
- Location: ${input.location}
- Participants: ${input.participants}
- Duration: ${input.duration} days
- Budget: ${input.currency} ${input.budget}
- Focus: ${input.focus}
- Dietary Requirements: ${input.dietary.join(', ')}
- Special Requests: ${input.specialRequests}

Suggest 8-12 activities that would work well for this corporate event.`;

    try {
      return await groqClient.parseStructuredResponse(prompt, systemPrompt, schema);
    } catch (error) {
      console.error('Corporate activity suggestion failed:', error);
      throw new Error(`Failed to suggest corporate activities: ${error.message}`);
    }
  }

  async suggestTravelActivities(input) {
    const systemPrompt = `You are an expert travel guide and activity planner. Suggest diverse, engaging 
activities for tourists based on location, group size, duration, and preferences.

Consider:
- Local culture and attractions
- Budget constraints
- Group dynamics
- Seasonal factors
- Travel logistics
- Mix of activity types (cultural, adventure, leisure, dining)

Provide practical, actionable suggestions with realistic timing and costs.`;

    const schema = {
      activities: [
        {
          title: "string",
          description: "string", 
          category: "cultural | adventure | leisure | dining | shopping",
          duration: "string",
          estimatedCost: "number",
          participants: "number",
          location: "string",
          timeSlot: "string",
          requirements: "array of strings",
          alternatives: "array of strings"
        }
      ],
      totalEstimatedCost: "number",
      notes: "string"
    };

    const prompt = `Generate travel activities for:
- Destination: ${input.location}
- Participants: ${input.participants}
- Duration: ${input.duration} days
- Budget: ${input.currency} ${input.budget}
- Preferences: ${input.preferences.join(', ')}
- Dietary Requirements: ${input.dietary.join(', ')}
- Special Requests: ${input.specialRequests}

Suggest 10-15 diverse activities covering different categories and time slots.`;

    try {
      return await groqClient.parseStructuredResponse(prompt, systemPrompt, schema);
    } catch (error) {
      console.error('Travel activity suggestion failed:', error);
      throw new Error(`Failed to suggest travel activities: ${error.message}`);
    }
  }

  async refineActivities(originalActivities, refinementPrompt, context) {
    const systemPrompt = `You are refining activity suggestions based on user feedback. 
Modify the existing activities list according to the refinement request while maintaining 
overall coherence and budget constraints.`;

    const schema = {
      activities: "array of activity objects",
      totalEstimatedCost: "number",
      notes: "string",
      changes: "array of strings describing what was changed"
    };

    const prompt = `Original activities: ${JSON.stringify(originalActivities, null, 2)}

Refinement request: "${refinementPrompt}"

Context: ${JSON.stringify(context, null, 2)}

Please refine the activities according to the request:`;

    try {
      return await groqClient.parseStructuredResponse(prompt, systemPrompt, schema);
    } catch (error) {
      console.error('Activity refinement failed:', error);
      throw new Error(`Failed to refine activities: ${error.message}`);
    }
  }

  async suggestAlternatives(activity, constraints) {
    const systemPrompt = `Suggest alternative activities that are similar in nature but 
different in execution, considering the given constraints.`;

    const prompt = `For this activity: ${JSON.stringify(activity, null, 2)}

With constraints: ${JSON.stringify(constraints, null, 2)}

Suggest 3-5 alternative activities that serve similar purposes but offer variety.`;

    try {
      const response = await groqClient.generateResponse(prompt, systemPrompt);
      return response.split('\n').filter(line => line.trim().length > 0);
    } catch (error) {
      console.error('Alternative suggestion failed:', error);
      return [];
    }
  }
}