// src/agents/unifiedInputParser.js
import { groqClient } from '../tools/groqClient.js';
import { createInputSchema, ItineraryType, EventType } from '../types/index.js';

export class UnifiedInputParserAgent {
  constructor() {
    this.name = 'UnifiedInputParser';
  }

  async parse(userInput) {
    const systemPrompt = `You are an expert input parser for an itinerary generation system. 
Your task is to extract structured information from user requests for either travel or corporate event itineraries.

Key guidelines:
1. Determine if this is a TRAVEL or CORPORATE itinerary request
2. Extract all relevant details like location, participants, budget, dates, preferences
3. For corporate events, identify the event type (training, conference, team_building, offsite, seminar)
4. Convert budget amounts to numbers (remove currency symbols, convert lakhs/crores to actual numbers)
5. Parse dates into standard format
6. Extract dietary restrictions and special preferences

Be thorough and accurate in extraction.`;

    const schema = {
      type: "travel | corporate",
      location: "string",
      participants: "number",
      duration: "number (in days)",
      budget: "number",
      currency: "INR | USD | EUR",
      date: "YYYY-MM-DD format or 'flexible'",
      preferences: "array of strings",
      dietary: "array of dietary restrictions",
      eventType: "training | conference | team_building | offsite | seminar (for corporate only)",
      focus: "main theme or focus",
      specialRequests: "any special requirements"
    };

    try {
      const parsed = await groqClient.parseStructuredResponse(
        `Parse this itinerary request: "${userInput}"`,
        systemPrompt,
        schema
      );

      // Normalize and validate the parsed data
      return this.normalizeInput(parsed);
    } catch (error) {
      console.error('Input parsing failed:', error);
      throw new Error(`Failed to parse input: ${error.message}`);
    }
  }

  normalizeInput(parsed) {
    const normalized = createInputSchema();
    
    // Basic mappings
    normalized.type = this.mapToItineraryType(parsed.type);
    normalized.location = parsed.location || '';
    normalized.participants = parseInt(parsed.participants) || 1;
    normalized.duration = parseInt(parsed.duration) || 1;
    normalized.budget = this.parseBudget(parsed.budget);
    normalized.currency = parsed.currency || 'INR';
    normalized.date = this.parseDate(parsed.date);
    normalized.preferences = Array.isArray(parsed.preferences) ? parsed.preferences : [];
    normalized.dietary = Array.isArray(parsed.dietary) ? parsed.dietary : [];
    normalized.eventType = this.mapToEventType(parsed.eventType);
    normalized.focus = parsed.focus || '';
    normalized.specialRequests = parsed.specialRequests || '';

    return normalized;
  }

  mapToItineraryType(type) {
    const lowerType = type?.toLowerCase() || '';
    if (lowerType.includes('corporate') || lowerType.includes('business') || 
        lowerType.includes('training') || lowerType.includes('conference') ||
        lowerType.includes('seminar') || lowerType.includes('offsite')) {
      return ItineraryType.CORPORATE;
    }
    return ItineraryType.TRAVEL;
  }

  mapToEventType(eventType) {
    if (!eventType) return '';
    
    const lowerType = eventType.toLowerCase();
    const eventMap = {
      'training': EventType.TRAINING,
      'conference': EventType.CONFERENCE,
      'team_building': EventType.TEAM_BUILDING,
      'team building': EventType.TEAM_BUILDING,
      'offsite': EventType.OFFSITE,
      'seminar': EventType.SEMINAR
    };

    return eventMap[lowerType] || EventType.TRAINING;
  }

  parseBudget(budget) {
    if (typeof budget === 'number') return budget;
    if (!budget) return 0;

    const budgetStr = budget.toString().toLowerCase();
    let amount = parseFloat(budgetStr.replace(/[^\d.]/g, ''));
    
    if (budgetStr.includes('lakh')) {
      amount *= 100000;
    } else if (budgetStr.includes('crore')) {
      amount *= 10000000;
    } else if (budgetStr.includes('k')) {
      amount *= 1000;
    }

    return Math.round(amount);
  }

  parseDate(dateStr) {
    if (!dateStr) return 'flexible';
    
    const lowerDate = dateStr.toLowerCase();
    if (lowerDate.includes('flexible') || lowerDate.includes('any')) {
      return 'flexible';
    }

    // Try to parse various date formats
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }

    return 'flexible';
  }

  async refineInput(originalInput, refinementPrompt) {
    const systemPrompt = `You are refining an existing itinerary request based on additional user input.
Take the original parsed input and the refinement request, then output the updated structured data.
Keep all original details unless explicitly changed by the refinement.`;

    const schema = {
      type: "travel | corporate",
      location: "string",
      participants: "number",
      duration: "number",
      budget: "number",
      currency: "string",
      date: "string",
      preferences: "array",
      dietary: "array",
      eventType: "string",
      focus: "string",
      specialRequests: "string"
    };

    const prompt = `Original input: ${JSON.stringify(originalInput, null, 2)}

Refinement request: "${refinementPrompt}"

Please provide the updated input incorporating the refinement:`;

    try {
      const refined = await groqClient.parseStructuredResponse(
        prompt,
        systemPrompt,
        schema
      );

      return this.normalizeInput(refined);
    } catch (error) {
      console.error('Input refinement failed:', error);
      throw new Error(`Failed to refine input: ${error.message}`);
    }
  }
}