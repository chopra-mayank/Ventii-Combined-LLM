// src/tools/groqClient.js
import Groq from 'groq-sdk';
import { config } from '../../config/environment.js';

class GroqClient {
  constructor() {
    this.client = new Groq({
      apiKey: config.groq.apiKey,
    });
  }

  async generateResponse(prompt, systemPrompt = '', options = {}) {
    try {
      const messages = [
        ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
        { role: 'user', content: prompt }
      ];

      const completion = await this.client.chat.completions.create({
        messages,
        model: options.model || config.groq.model,
        max_tokens: options.maxTokens || config.groq.maxTokens,
        temperature: options.temperature || config.groq.temperature,
        stream: false,
      });

      return completion.choices[0]?.message?.content || '';
    } catch (error) {
      console.error('Groq API Error:', error);
      throw new Error(`Groq generation failed: ${error.message}`);
    }
  }

  async parseStructuredResponse(prompt, systemPrompt, schema) {
    const structuredPrompt = `${prompt}

Please respond in valid JSON format matching this schema:
${JSON.stringify(schema, null, 2)}

Response:`;

    const response = await this.generateResponse(structuredPrompt, systemPrompt);
    
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error('Could not parse structured response');
    } catch (error) {
      console.warn('Failed to parse JSON response, attempting cleanup...');
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error('Could not parse structured response even after cleanup');
    }
  }
}

export const groqClient = new GroqClient();