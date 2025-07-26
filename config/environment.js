// config/environment.js
import dotenv from 'dotenv';

dotenv.config();

export const config = {
  groq: {
    apiKey: process.env.GROQ_API_KEY,
    model: 'llama3-70b-8192',
    maxTokens: 4096,
    temperature: 0.7
  },
  tavily: {
    apiKey: process.env.TAVILY_API_KEY,
    maxResults: 10,
    searchDepth: 'advanced'
  },
  app: {
    maxRetries: 3,
    timeoutMs: 30000,
    defaultBudgetCurrency: 'INR'
  }
};

export const validateConfig = () => {
  if (!config.groq.apiKey) {
    throw new Error('GROQ_API_KEY is required');
  }
  if (!config.tavily.apiKey) {
    throw new Error('TAVILY_API_KEY is required');
  }
  console.log('✅ Configuration validated successfully');
};