// src/index-working.js - Fixed main application
import dotenv from 'dotenv';
import Groq from 'groq-sdk';
import axios from 'axios';

dotenv.config();

console.log('🚀 Starting Itinerary LLM Application...');

// Validate environment
if (!process.env.GROQ_API_KEY || !process.env.TAVILY_API_KEY) {
  console.error('❌ Missing API keys in environment variables');
  process.exit(1);
}

// Initialize clients
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// Enhanced Input Parser
class InputParser {
  async parse(userInput) {
    console.log('📝 Parsing user input...');
    
    const systemPrompt = `You are an expert input parser for itinerary generation. 
Extract structured information from user requests for travel or corporate events.
Determine if this is TRAVEL or CORPORATE, extract location, participants, budget, dates, preferences.
Convert budget amounts to numbers (remove currency symbols, convert lakhs to actual numbers).`;

    const prompt = `Parse this itinerary request: "${userInput}"

Respond with valid JSON only:
{
  "type": "corporate or travel",
  "location": "string",
  "participants": "number",
  "duration": "number in days",
  "budget": "number (convert lakhs to actual amount)",
  "currency": "INR",
  "eventType": "training/conference/team_building/offsite/seminar for corporate",
  "focus": "main theme or focus",
  "preferences": "array of preferences",
  "dietary": "array of dietary restrictions"
}`;

    try {
      const completion = await groq.chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        model: 'llama3-70b-8192',
        max_tokens: 1000,
        temperature: 0.3,
      });

      const response = completion.choices[0]?.message?.content || '{}';
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        
        // Convert lakhs to actual numbers
        if (typeof parsed.budget === 'string') {
          let budget = parseFloat(parsed.budget.replace(/[^\d.]/g, ''));
          if (parsed.budget.toLowerCase().includes('lakh')) {
            budget *= 100000;
          }
          parsed.budget = budget;
        }
        
        return parsed;
      }
      throw new Error('No valid JSON in response');
      
    } catch (error) {
      console.error('❌ Input parsing failed:', error.message);
      throw error;
    }
  }
}

// Activity Suggester
class ActivitySuggestor {
  async suggestActivities(parsedInput) {
    console.log('💡 Suggesting activities...');
    
    const prompt = `Generate ${parsedInput.type} activities for:
- Location: ${parsedInput.location}
- Participants: ${parsedInput.participants}
- Budget: ${parsedInput.currency} ${parsedInput.budget}
- Duration: ${parsedInput.duration} days
- Event Type: ${parsedInput.eventType}
- Focus: ${parsedInput.focus}

Suggest 8-12 diverse activities with estimated costs, duration, and descriptions.

Respond with JSON:
{
  "activities": [
    {
      "title": "Activity Name",
      "description": "Detailed description",
      "category": "category type",
      "duration": "2 hours",
      "estimatedCost": 5000,
      "timeSlot": "suggested time slot",
      "requirements": ["list of requirements"]
    }
  ],
  "totalEstimatedCost": 75000,
  "notes": "Additional planning notes"
}`;

    try {
      const completion = await groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'llama3-70b-8192',
        max_tokens: 2000,
        temperature: 0.2,
      });

      const response = completion.choices[0]?.message?.content || '{}';
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error('No valid JSON in response');
      
    } catch (error) {
      console.error('❌ Activity suggestion failed:', error.message);
      throw error;
    }
  }
}

// Search Agent
class SearchAgent {
  async searchContent(parsedInput) {
    console.log('🔍 Searching for relevant content...');
    
    const searches = this.generateSearchQueries(parsedInput);
    const allResults = [];
    
    for (const query of searches) {
      try {
        console.log(`   Searching: ${query.description}`);
        const response = await axios.post('https://api.tavily.com/search', {
          api_key: process.env.TAVILY_API_KEY,
          query: query.query,
          max_results: query.maxResults || 5
        });
        
        allResults.push({
          query: query.query,
          description: query.description,
          category: query.category,
          results: response.data.results || []
        });
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));
        
      } catch (error) {
        console.warn(`   Search failed for: ${query.description}`);
        allResults.push({
          query: query.query,
          description: query.description,
          category: query.category,
          results: [],
          error: error.message
        });
      }
    }
    
    return allResults;
  }
  
  generateSearchQueries(input) {
    const queries = [];
    const location = input.location;
    
    if (input.type === 'corporate') {
      queries.push(
        {
          query: `${input.eventType} venues ${location} capacity ${input.participants} conference halls`,
          description: `Venues for ${input.eventType} in ${location}`,
          category: 'venues',
          maxResults: 5
        },
        {
          query: `corporate catering ${location} business lunch options`,
          description: `Catering options in ${location}`,
          category: 'catering',
          maxResults: 4
        },
        {
          query: `team building activities ${location} corporate groups`,
          description: `Team building activities in ${location}`,
          category: 'activities',
          maxResults: 6
        }
      );
    } else {
      queries.push(
        {
          query: `tourist attractions ${location} must visit places`,
          description: `Main attractions in ${location}`,
          category: 'attractions',
          maxResults: 6
        },
        {
          query: `restaurants ${location} local cuisine dining`,
          description: `Dining options in ${location}`,
          category: 'dining',
          maxResults: 5
        },
        {
          query: `hotels accommodation ${location}`,
          description: `Hotels in ${location}`,
          category: 'accommodation',
          maxResults: 4
        }
      );
    }
    
    return queries;
  }
}

// Itinerary Generator
class ItineraryGenerator {
  async generateItinerary(parsedInput, activities, searchResults) {
    console.log('🗓️ Generating detailed itinerary...');
    
    const researchSummary = this.summarizeSearchResults(searchResults);
    
    const systemPrompt = `You are an expert ${parsedInput.type} event planner. 
Create a detailed, time-specific itinerary that maximizes engagement and stays within budget.
Include specific times, costs, locations, and practical details.`;

    const prompt = `Create a comprehensive ${parsedInput.type} itinerary:

Event Details:
- Type: ${parsedInput.eventType || parsedInput.type}
- Location: ${parsedInput.location}
- Participants: ${parsedInput.participants}
- Duration: ${parsedInput.duration} days
- Budget: ${parsedInput.currency} ${parsedInput.budget}
- Focus: ${parsedInput.focus}

Suggested Activities: ${JSON.stringify(activities, null, 2)}

Research Summary: ${researchSummary}

Create a detailed day-by-day schedule with specific timings and costs.

Respond with JSON:
{
  "title": "Event Title",
  "summary": "Brief description",
  "totalBudget": ${parsedInput.budget},
  "location": "${parsedInput.location}",
  "participants": ${parsedInput.participants},
  "days": [
    {
      "day": 1,
      "date": "flexible",
      "theme": "Day theme",
      "activities": [
        {
          "timeSlot": "9:00 AM - 10:30 AM",
          "title": "Activity Name",
          "description": "Detailed description",
          "category": "category",
          "cost": 5000,
          "location": "Specific venue",
          "requirements": ["requirement list"]
        }
      ],
      "totalCost": 50000,
      "notes": "Day notes"
    }
  ],
  "budgetBreakdown": {
    "venue": 50000,
    "catering": 40000,
    "activities": 35000,
    "transport": 15000,
    "miscellaneous": 10000
  }
}`;

    try {
      const completion = await groq.chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        model: 'llama3-70b-8192',
        max_tokens: 3000,
        temperature: 0.2,
      });

      const response = completion.choices[0]?.message?.content || '{}';
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        const itinerary = JSON.parse(jsonMatch[0]);
        itinerary.generatedAt = new Date().toISOString();
        itinerary.id = `itinerary_${Date.now()}`;
        return itinerary;
      }
      throw new Error('No valid JSON in response');
      
    } catch (error) {
      console.error('❌ Itinerary generation failed:', error.message);
      throw error;
    }
  }
  
  summarizeSearchResults(searchResults) {
    const summary = searchResults
      .filter(search => search.results && search.results.length > 0)
      .map(search => `${search.category}: ${search.results.length} options found`)
      .join(', ');
    
    return summary || 'Limited research data available';
  }
}

// Main Application Class
class ItineraryLLMApp {
  constructor() {
    this.inputParser = new InputParser();
    this.activitySuggestor = new ActivitySuggestor();
    this.searchAgent = new SearchAgent();
    this.itineraryGenerator = new ItineraryGenerator();
  }

  async generateItinerary(userInput) {
    try {
      console.log(`\n🎯 Starting generation for: "${userInput}"\n`);
      
      // Step 1: Parse input
      const parsedInput = await this.inputParser.parse(userInput);
      console.log('✅ Input parsed successfully');
      console.log(`   Type: ${parsedInput.type}, Location: ${parsedInput.location}, Participants: ${parsedInput.participants}`);
      
      // Step 2: Suggest activities
      const activities = await this.activitySuggestor.suggestActivities(parsedInput);
      console.log(`✅ Generated ${activities.activities?.length || 0} activity suggestions`);
      
      // Step 3: Search for content
      const searchResults = await this.searchAgent.searchContent(parsedInput);
      const successfulSearches = searchResults.filter(s => s.results.length > 0).length;
      console.log(`✅ Completed ${successfulSearches}/${searchResults.length} searches`);
      
      // Step 4: Generate itinerary
      const itinerary = await this.itineraryGenerator.generateItinerary(
        parsedInput, 
        activities, 
        searchResults
      );
      console.log('✅ Itinerary generated successfully');
      
      return itinerary;
      
    } catch (error) {
      console.error('💥 Generation failed:', error.message);
      throw error;
    }
  }

  async refineItinerary(originalItinerary, refinementPrompt) {
    console.log(`\n🔄 Refining itinerary: "${refinementPrompt}"`);
    
    const prompt = `Refine this itinerary based on the request:

Original Itinerary: ${JSON.stringify(originalItinerary, null, 2)}

Refinement Request: "${refinementPrompt}"

Modify the itinerary according to the request while maintaining budget and coherence.
Respond with the complete refined itinerary in the same JSON format.`;

    try {
      const completion = await groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'llama3-70b-8192',
        max_tokens: 3000,
        temperature: 0.2,
      });

      const response = completion.choices[0]?.message?.content || '{}';
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        const refined = JSON.parse(jsonMatch[0]);
        refined.refinedAt = new Date().toISOString();
        refined.refinementPrompt = refinementPrompt;
        console.log('✅ Refinement completed successfully');
        return refined;
      }
      throw new Error('No valid JSON in response');
      
    } catch (error) {
      console.error('❌ Refinement failed:', error.message);
      throw error;
    }
  }

  displayItinerary(itinerary) {
    console.log('\n🎉 GENERATED ITINERARY');
    console.log('='.repeat(60));
    console.log(`📋 ${itinerary.title}`);
    console.log(`📍 Location: ${itinerary.location}`);
    console.log(`👥 Participants: ${itinerary.participants}`);
    console.log(`💰 Total Budget: ₹${itinerary.totalBudget?.toLocaleString()}`);
    console.log(`📅 Duration: ${itinerary.days?.length || 0} day(s)`);
    
    if (itinerary.summary) {
      console.log(`📝 Summary: ${itinerary.summary}`);
    }
    
    if (itinerary.days) {
      itinerary.days.forEach(day => {
        console.log(`\n📆 Day ${day.day}: ${day.theme}`);
        console.log(`💵 Daily Budget: ₹${day.totalCost?.toLocaleString()}`);
        
        if (day.activities) {
          day.activities.forEach(activity => {
            console.log(`  ⏰ ${activity.timeSlot}: ${activity.title}`);
            console.log(`     ${activity.description}`);
            console.log(`     💰 Cost: ₹${activity.cost?.toLocaleString()}`);
            if (activity.location) {
              console.log(`     📍 ${activity.location}`);
            }
          });
        }
      });
    }
    
    if (itinerary.budgetBreakdown) {
      console.log('\n💰 Budget Breakdown:');
      Object.entries(itinerary.budgetBreakdown).forEach(([category, amount]) => {
        console.log(`  ${category}: ₹${amount?.toLocaleString()}`);
      });
    }
    
    console.log('\n' + '='.repeat(60));
  }
}

// Example execution
async function runExamples() {
  const app = new ItineraryLLMApp();
  
  try {
    // Example 1: Corporate Event
    console.log('🏢 EXAMPLE 1: Corporate Training Event');
    const corporate = await app.generateItinerary(
      "Corporate training for 50 people in Bangalore on June 10th. Budget ₹1.5 lakhs."
    );
    app.displayItinerary(corporate);
    
    // Example 2: Refinement
    console.log('\n🔄 EXAMPLE 2: Refining the Corporate Event');
    const refined = await app.refineItinerary(
      corporate,
      "Make it more interactive with team building activities"
    );
    app.displayItinerary(refined);
    
    // Example 3: Travel Event
    console.log('\n✈️ EXAMPLE 3: Travel Itinerary');
    const travel = await app.generateItinerary(
      "Team offsite for 30 people in Goa next Friday. Budget 2 lakhs. Need vegetarian food."
    );
    app.displayItinerary(travel);
    
    console.log('\n🎊 All examples completed successfully!');
    
  } catch (error) {
    console.error('💥 Example execution failed:', error);
  }
}

// Export for module usage
export { ItineraryLLMApp };

// Run examples if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runExamples().catch(console.error);
}