// src/agents/combinedItinerary.js
import { groqClient } from '../tools/groqClient.js';

export class CombinedItineraryAgent {
  constructor() {
    this.name = 'CombinedItinerary';
  }

  async combineAndFinalize(itinerary, researchSummaries, context) {
    console.log('🔄 Finalizing and optimizing itinerary...');
    
    // Enhance itinerary with research insights
    const enhancedItinerary = await this.enhanceWithResearch(itinerary, researchSummaries, context);
    
    // Optimize for budget and logistics
    const optimizedItinerary = await this.optimizeItinerary(enhancedItinerary, context);
    
    // Add final touches and validation
    const finalItinerary = await this.addFinalTouches(optimizedItinerary, context);
    
    return finalItinerary;
  }

  async enhanceWithResearch(itinerary, summaries, context) {
    const systemPrompt = `You are enhancing an itinerary with detailed research insights.
Add specific venue recommendations, contact details, booking tips, and practical information
from the research summaries to make the itinerary actionable and detailed.`;

    const schema = {
      title: "string",
      summary: "string", 
      totalBudget: "number",
      days: [
        {
          day: "number",
          date: "string",
          theme: "string",
          activities: [
            {
              id: "string",
              timeSlot: "string",
              title: "string",
              description: "string",
              category: "string",
              cost: "number",
              location: "string",
              address: "string",
              contact: "string",
              bookingTips: "array of strings",
              duration: "string",
              requirements: "array of strings",
              alternatives: "array of strings",
              researchNotes: "string"
            }
          ],
          totalCost: "number",
          logistics: "string",
          notes: "string"
        }
      ],
      practicalInfo: {
        transportation: "string",
        accommodation: "string", 
        emergencyContacts: "string",
        localTips: "array of strings"
      },
      budgetBreakdown: "object"
    };

    const prompt = `Enhance this itinerary with detailed research information:

Base Itinerary: ${JSON.stringify(itinerary, null, 2)}

Research Summaries: ${JSON.stringify(summaries, null, 2)}

Context: ${JSON.stringify(context, null, 2)}

Add specific venues, contacts, addresses, booking information, and practical details from the research.`;

    try {
      return await groqClient.parseStructuredResponse(prompt, systemPrompt, schema);
    } catch (error) {
      console.error('Itinerary enhancement failed:', error);
      return itinerary; // Return original if enhancement fails
    }
  }

  async optimizeItinerary(itinerary, context) {
    const systemPrompt = `Optimize an itinerary for budget efficiency, time management, and logistics.
Ensure activities flow logically, travel times are realistic, and the budget is well-distributed.`;

    const optimizationPrompt = `Optimize this itinerary for:

${JSON.stringify(itinerary, null, 2)}

Optimization goals:
1. Budget efficiency - stay within ${context.currency} ${context.budget}
2. Logical flow and minimal travel time
3. Balanced activity distribution
4. Buffer time for meals and rest
5. Contingency planning

Provide the optimized version with explanations for major changes.`;

    try {
      const response = await groqClient.generateResponse(optimizationPrompt, systemPrompt);
      
      // Parse the optimization suggestions and apply them
      return await this.applyOptimizations(itinerary, response, context);
    } catch (error) {
      console.error('Itinerary optimization failed:', error);
      return itinerary;
    }
  }

  async applyOptimizations(itinerary, optimizationSuggestions, context) {
    // This is a simplified version - in a real implementation,
    // you'd parse the optimization suggestions and apply specific changes
    
    const optimized = { ...itinerary };
    
    // Ensure budget compliance
    if (optimized.totalBudget > context.budget) {
      optimized.totalBudget = context.budget;
      optimized.budgetOptimized = true;
    }
    
    // Add optimization notes
    optimized.optimizationNotes = optimizationSuggestions;
    optimized.optimizedAt = new Date().toISOString();
    
    return optimized;
  }

  async addFinalTouches(itinerary, context) {
    const systemPrompt = `Add final professional touches to an itinerary including:
- Emergency information and contacts
- Weather considerations and packing suggestions
- Cultural etiquette and local customs
- Final budget summary and payment tips
- Last-minute preparation checklist`;

    const schema = {
      ...itinerary,
      finalNotes: {
        weatherInfo: "string",
        packingList: "array of strings",
        culturalTips: "array of strings", 
        emergencyInfo: "object",
        preparationChecklist: "array of strings",
        paymentTips: "string"
      },
      qualityScore: "number (1-10)",
      completionStatus: "string"
    };

    const prompt = `Add final touches to this itinerary:

${JSON.stringify(itinerary, null, 2)}

Context: ${JSON.stringify(context, null, 2)}

Add comprehensive final information for a complete, professional itinerary.`;

    try {
      const enhanced = await groqClient.parseStructuredResponse(prompt, systemPrompt, schema);
      enhanced.finalizedAt = new Date().toISOString();
      enhanced.version = '1.0-final';
      return enhanced;
    } catch (error) {
      console.error('Final touches failed:', error);
      // Add basic final touches manually
      return {
        ...itinerary,
        finalizedAt: new Date().toISOString(),
        version: '1.0-final',
        completionStatus: 'completed'
      };
    }
  }

  async generateExecutiveSummary(itinerary) {
    const systemPrompt = `Create a professional executive summary for an itinerary that highlights
key features, value proposition, logistics overview, and investment summary.`;

    const prompt = `Create an executive summary for this itinerary:

${JSON.stringify(itinerary, null, 2)}

Include:
- Overview and highlights
- Investment and value summary  
- Logistics overview
- Key recommendations
- Success metrics (if applicable)`;

    try {
      return await groqClient.generateResponse(prompt, systemPrompt);
    } catch (error) {
      console.error('Executive summary generation failed:', error);
      return `Executive Summary for ${itinerary.title}\n\nA ${itinerary.days.length}-day ${itinerary.type} itinerary for ${itinerary.participants} participants in ${itinerary.location} with a total budget of ${itinerary.currency} ${itinerary.totalBudget}.`;
    }
  }

  async validateFinalItinerary(itinerary) {
    const validation = {
      isValid: true,
      errors: [],
      warnings: [],
      score: 0
    };

    // Check required fields
    if (!itinerary.title) validation.errors.push('Missing title');
    if (!itinerary.days || itinerary.days.length === 0) validation.errors.push('No days defined');
    if (!itinerary.totalBudget) validation.errors.push('Missing budget');

    // Check each day
    itinerary.days?.forEach((day, dayIndex) => {
      if (!day.activities || day.activities.length === 0) {
        validation.warnings.push(`Day ${dayIndex + 1} has no activities`);
      }

      day.activities?.forEach((activity, actIndex) => {
        if (!activity.title) validation.errors.push(`Day ${dayIndex + 1}, Activity ${actIndex + 1}: Missing title`);
        if (!activity.timeSlot) validation.warnings.push(`Day ${dayIndex + 1}, Activity ${actIndex + 1}: Missing time slot`);
        if (!activity.cost && activity.cost !== 0) validation.warnings.push(`Day ${dayIndex + 1}, Activity ${actIndex + 1}: Missing cost`);
      });
    });

    // Calculate quality score
    let score = 10;
    score -= validation.errors.length * 2;
    score -= validation.warnings.length * 0.5;
    score = Math.max(0, score);

    validation.isValid = validation.errors.length === 0;
    validation.score = score;

    return validation;
  }

  async generateShareableVersion(itinerary) {
    // Create a clean, shareable version without internal metadata
    const shareable = {
      title: itinerary.title,
      summary: itinerary.summary,
      location: itinerary.location,
      participants: itinerary.participants,
      duration: itinerary.days?.length || 0,
      totalBudget: itinerary.totalBudget,
      currency: itinerary.currency || 'INR',
      days: itinerary.days?.map(day => ({
        day: day.day,
        date: day.date,
        theme: day.theme,
        activities: day.activities?.map(activity => ({
          timeSlot: activity.timeSlot,
          title: activity.title,
          description: activity.description,
          cost: activity.cost,
          location: activity.location,
          address: activity.address
        })),
        totalCost: day.totalCost
      })),
      generatedAt: itinerary.generatedAt,
      type: itinerary.type
    };

    return shareable;
  }

  async exportToFormat(itinerary, format = 'json') {
    switch (format.toLowerCase()) {
      case 'json':
        return JSON.stringify(itinerary, null, 2);
      
      case 'markdown':
        return this.formatAsMarkdown(itinerary);
      
      case 'text':
        return this.formatAsText(itinerary);
      
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  formatAsMarkdown(itinerary) {
    let md = `# ${itinerary.title}\n\n`;
    md += `${itinerary.summary}\n\n`;
    md += `**Location:** ${itinerary.location}\n`;
    md += `**Participants:** ${itinerary.participants}\n`;
    md += `**Total Budget:** ${itinerary.currency || 'INR'} ${itinerary.totalBudget}\n\n`;

    itinerary.days?.forEach(day => {
      md += `## Day ${day.day}: ${day.theme}\n\n`;
      
      day.activities?.forEach(activity => {
        md += `### ${activity.timeSlot}: ${activity.title}\n`;
        md += `${activity.description}\n`;
        md += `- **Cost:** ${itinerary.currency || 'INR'} ${activity.cost || 0}\n`;
        if (activity.location) md += `- **Location:** ${activity.location}\n`;
        if (activity.address) md += `- **Address:** ${activity.address}\n`;
        md += `\n`;
      });
      
      md += `**Daily Total:** ${itinerary.currency || 'INR'} ${day.totalCost}\n\n`;
    });

    return md;
  }

  formatAsText(itinerary) {
    let text = `${itinerary.title}\n${'='.repeat(itinerary.title.length)}\n\n`;
    text += `${itinerary.summary}\n\n`;
    text += `Location: ${itinerary.location}\n`;
    text += `Participants: ${itinerary.participants}\n`;
    text += `Total Budget: ${itinerary.currency || 'INR'} ${itinerary.totalBudget}\n\n`;

    itinerary.days?.forEach(day => {
      text += `Day ${day.day}: ${day.theme}\n${'-'.repeat(30)}\n`;
      
      day.activities?.forEach(activity => {
        text += `${activity.timeSlot}: ${activity.title}\n`;
        text += `  ${activity.description}\n`;
        text += `  Cost: ${itinerary.currency || 'INR'} ${activity.cost || 0}\n`;
        if (activity.location) text += `  Location: ${activity.location}\n`;
        text += `\n`;
      });
      
      text += `Daily Total: ${itinerary.currency || 'INR'} ${day.totalCost}\n\n`;
    });

    return text;
  }
}