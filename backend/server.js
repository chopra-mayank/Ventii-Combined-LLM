// backend/server.js - Express backend with your working LLM integration
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Groq from 'groq-sdk';
import axios from 'axios';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Initialize Groq client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

console.log('🔧 Initializing Itinerary LLM Backend...');

// Your working LLM implementation
class ItineraryLLMBackend {
  async parseInput(userInput) {
    console.log('📝 Parsing input:', userInput.substring(0, 50) + '...');
    
    const prompt = `Parse this itinerary request and respond with JSON only:
"${userInput}"

{
  "type": "corporate or travel",
  "location": "city",
  "participants": number,
  "budget": number,
  "duration": number,
  "eventType": "training/conference/etc",
  "preferences": [],
  "dietary": []
}`;

    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama3-70b-8192',
      max_tokens: 500,
    });

    const response = completion.choices[0]?.message?.content || '{}';
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      // Convert lakhs to numbers
      if (typeof parsed.budget === 'string' && parsed.budget.toLowerCase().includes('lakh')) {
        const amount = parseFloat(parsed.budget.replace(/[^\d.]/g, ''));
        parsed.budget = amount * 100000;
      }
      return parsed;
    }
    throw new Error('Parse failed');
  }

  async searchContent(parsed) {
    if (!process.env.TAVILY_API_KEY) {
      console.warn('No Tavily API key, skipping search');
      return [];
    }

    const query = `${parsed.eventType || parsed.type} venues activities ${parsed.location}`;
    
    try {
      console.log('🔍 Searching:', query);
      const response = await axios.post('https://api.tavily.com/search', {
        api_key: process.env.TAVILY_API_KEY,
        query: query,
        max_results: 5
      });
      return response.data.results || [];
    } catch (error) {
      console.warn('Search failed:', error.message);
      return [];
    }
  }

  async generateItinerary(userInput) {
    console.log(`🎯 Starting generation for: "${userInput}"`);
    
    const parsed = await this.parseInput(userInput);
    console.log(`✅ Parsed: ${parsed.type} in ${parsed.location} for ${parsed.participants} people`);
    
    // Search for content
    const searchResults = await this.searchContent(parsed);
    console.log(`✅ Research: Found ${searchResults.length} sources`);
    
    // Generate detailed itinerary
    const itinerary = await this.createDetailedItinerary(parsed, searchResults);
    console.log(`✅ Generated: ${itinerary.title}`);
    
    return {
      ...itinerary,
      id: `itinerary_${Date.now()}`,
      generatedAt: new Date().toISOString(),
      originalInput: userInput
    };
  }

  async createDetailedItinerary(parsed, searchResults) {
    const researchSummary = searchResults.length > 0 
      ? searchResults.map(r => `${r.title}: ${r.content?.substring(0, 100)}...`).join('\n')
      : 'Local venue and activity options available';

    const prompt = `Create a comprehensive ${parsed.type} itinerary:

Details:
- Type: ${parsed.eventType || parsed.type}
- Location: ${parsed.location}
- Participants: ${parsed.participants}
- Budget: ₹${parsed.budget}
- Duration: ${parsed.duration || 1} days

Research Context: ${researchSummary}

Create a detailed, professional itinerary with specific timings, venues, and costs.

Respond with JSON:
{
  "title": "Professional Event Title",
  "summary": "Brief engaging description",
  "type": "${parsed.type}",
  "totalBudget": ${parsed.budget},
  "location": "${parsed.location}",
  "participants": ${parsed.participants},
  "duration": ${parsed.duration || 1},
  "days": [
    {
      "day": 1,
      "date": "flexible",
      "theme": "Day Theme",
      "activities": [
        {
          "id": "activity_1",
          "timeSlot": "9:00 AM - 10:30 AM",
          "title": "Activity Name",
          "description": "Detailed description with objectives and outcomes",
          "category": "networking/training/cultural/etc",
          "cost": 5000,
          "location": "Specific venue name",
          "address": "Full address if available",
          "requirements": ["requirement 1", "requirement 2"],
          "duration": "1.5 hours"
        }
      ],
      "totalCost": 50000,
      "meals": {
        "breakfast": "Breakfast details and cost",
        "lunch": "Lunch details and cost", 
        "dinner": "Dinner details and cost"
      },
      "notes": "Day-specific notes and logistics"
    }
  ],
  "budgetBreakdown": {
    "venue": 30000,
    "catering": 25000,
    "activities": 40000,
    "transport": 10000,
    "miscellaneous": 5000
  },
  "practicalInfo": {
    "transportation": "Transport recommendations",
    "accommodation": "Hotel suggestions if needed",
    "contact": "Emergency contact information",
    "tips": ["practical tip 1", "practical tip 2"]
  }
}`;

    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama3-70b-8192',
      max_tokens: 3500,
      temperature: 0.4,
    });

    const response = completion.choices[0]?.message?.content || '{}';
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error('Generation failed');
  }

  async refineItinerary(itinerary, refinementPrompt, refinementType = 'entire') {
    console.log(`🔄 Refining ${refinementType}: "${refinementPrompt}"`);
    
    const prompt = `Refine this itinerary based on: "${refinementPrompt}"

Original Itinerary: ${JSON.stringify(itinerary, null, 2)}

Apply the refinement while maintaining budget constraints and logical flow.
Respond with the complete updated itinerary in the same JSON format.`;

    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama3-70b-8192',
      max_tokens: 3500,
      temperature: 0.5,
    });

    const response = completion.choices[0]?.message?.content || '{}';
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const refined = JSON.parse(jsonMatch[0]);
      return {
        ...refined,
        refinedAt: new Date().toISOString(),
        refinementHistory: [
          ...(itinerary.refinementHistory || []),
          {
            prompt: refinementPrompt,
            type: refinementType,
            timestamp: new Date().toISOString()
          }
        ]
      };
    }
    throw new Error('Refinement failed');
  }
}

// Initialize the LLM backend
const llmBackend = new ItineraryLLMBackend();

// API Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    groqConnected: !!process.env.GROQ_API_KEY,
    tavilyConnected: !!process.env.TAVILY_API_KEY
  });
});

// Generate itinerary
app.post('/api/generate', async (req, res) => {
  try {
    const { prompt } = req.body;
    
    if (!prompt || prompt.trim().length === 0) {
      return res.status(400).json({ 
        error: 'Prompt is required',
        message: 'Please provide a valid itinerary request'
      });
    }

    console.log(`📝 API Request: "${prompt}"`);
    
    const itinerary = await llmBackend.generateItinerary(prompt);
    
    res.json({
      success: true,
      data: itinerary,
      message: 'Itinerary generated successfully'
    });

  } catch (error) {
    console.error('❌ Generation error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to generate itinerary'
    });
  }
});

// Refine itinerary
app.post('/api/refine', async (req, res) => {
  try {
    const { itinerary, refinementPrompt, refinementType = 'entire' } = req.body;
    
    if (!itinerary || !refinementPrompt) {
      return res.status(400).json({
        error: 'Itinerary and refinement prompt are required'
      });
    }

    console.log(`🔄 API Refinement: "${refinementPrompt}" (${refinementType})`);
    
    const refined = await llmBackend.refineItinerary(itinerary, refinementPrompt, refinementType);
    
    res.json({
      success: true,
      data: refined,
      message: 'Itinerary refined successfully'
    });

  } catch (error) {
    console.error('❌ Refinement error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to refine itinerary'
    });
  }
});

// Export itinerary
app.post('/api/export', (req, res) => {
  try {
    const { itinerary, format = 'json' } = req.body;
    
    if (format === 'json') {
      res.json({
        success: true,
        data: itinerary,
        filename: `itinerary_${Date.now()}.json`
      });
    } else if (format === 'text') {
      const textFormat = formatItineraryAsText(itinerary);
      res.json({
        success: true,
        data: textFormat,
        filename: `itinerary_${Date.now()}.txt`
      });
    } else {
      res.status(400).json({
        error: 'Unsupported format',
        supportedFormats: ['json', 'text']
      });
    }
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});

// Helper function
function formatItineraryAsText(itinerary) {
  let text = `${itinerary.title}\n${'='.repeat(itinerary.title.length)}\n\n`;
  text += `Location: ${itinerary.location}\n`;
  text += `Participants: ${itinerary.participants}\n`;
  text += `Total Budget: ₹${itinerary.totalBudget?.toLocaleString()}\n\n`;
  
  itinerary.days?.forEach(day => {
    text += `Day ${day.day}: ${day.theme}\n`;
    text += `Daily Budget: ₹${day.totalCost?.toLocaleString()}\n\n`;
    
    day.activities?.forEach(activity => {
      text += `${activity.timeSlot}: ${activity.title}\n`;
      text += `  ${activity.description}\n`;
      text += `  Cost: ₹${activity.cost?.toLocaleString()}\n\n`;
    });
  });
  
  return text;
}

// Error handling
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Itinerary LLM Backend running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🎯 Generate endpoint: http://localhost:${PORT}/api/generate`);
  console.log(`🔄 Refine endpoint: http://localhost:${PORT}/api/refine`);
  
  // Check environment
  if (!process.env.GROQ_API_KEY) {
    console.warn('⚠️ GROQ_API_KEY not found');
  } else {
    console.log('✅ GROQ_API_KEY configured');
  }
  if (!process.env.TAVILY_API_KEY) {
    console.warn('⚠️ TAVILY_API_KEY not found');
  } else {
    console.log('✅ TAVILY_API_KEY configured');
  }
});