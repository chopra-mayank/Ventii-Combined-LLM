// backend/server.js - Express backend with your working LLM integration
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Groq from 'groq-sdk';
import axios from 'axios';

// Corrected import paths to point to the src/agents directory
import { EnhancedSearchAgent } from '../src/agents/enhancedSearchAgent.js';
import { EnhancedScraperAgent } from '../src/agents/enhancedScraperAgent.js';
import { EnhancedSummarizerAgent } from '../src/agents/enhancedSummarizerAgent.js';
import { EnhancedEventPlannerAgent } from '../src/agents/enhancedEventPlanner.js';
import { UnifiedInputParserAgent } from '../src/agents/unifiedInputParser.js';

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

class ItineraryLLMBackend {
  constructor() {
    this.inputParser = new UnifiedInputParserAgent();
    this.searchAgent = new EnhancedSearchAgent();
    this.scraperAgent = new EnhancedScraperAgent();
    this.summarizerAgent = new EnhancedSummarizerAgent();
    this.plannerAgent = new EnhancedEventPlannerAgent();
  }

  async generateItinerary(userInput) {
    console.log(`🎯 Starting generation for: "${userInput}"`);

    // Step 1: Parse user input using UnifiedInputParserAgent
    const parsedInput = await this.inputParser.parse(userInput);
    console.log('✅ Parsed Input:', JSON.stringify(parsedInput));

    // Step 2: Perform targeted searches using EnhancedSearchAgent
    const searchResults = await this.searchAgent.searchRelevantContent(parsedInput);
    
    // Step 3: Extract content using EnhancedScraperAgent
    const extractedContent = await this.scraperAgent.extractContent(searchResults, parsedInput);
    console.log(`✅ Extracted: Successfully pulled content from ${extractedContent.length} pages`);
    
    // Step 4: Summarize the extracted content using EnhancedSummarizerAgent
    const researchSummaries = await this.summarizerAgent.summarizeExtractedContent(extractedContent, parsedInput);
    console.log('✅ Summarized Research Data');

    // Step 5: Generate the itinerary using EnhancedEventPlannerAgent
    const itinerary = await this.plannerAgent.generateItinerary(parsedInput, [], researchSummaries);
    console.log(`✅ Generated: ${itinerary.title}`);

    return itinerary;
  }
}

// Initialize the LLM backend
const llmBackend = new ItineraryLLMBackend();

// API Routes
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    groqConnected: !!process.env.GROQ_API_KEY,
    tavilyConnected: !!process.env.TAVILY_API_KEY
  });
});

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

app.listen(PORT, () => {
  console.log(`🚀 Itinerary LLM Backend running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🎯 Generate endpoint: http://localhost:${PORT}/api/generate`);
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