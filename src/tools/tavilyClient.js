// src/tools/tavilyClient.js
import axios from 'axios';
import { config } from '../../config/environment.js';

class TavilyClient {
  constructor() {
    this.apiKey = config.tavily.apiKey;
    this.baseUrl = 'https://api.tavily.com';
  }

  async search(query, options = {}) {
    try {
      const response = await axios.post(`${this.baseUrl}/search`, {
        api_key: this.apiKey,
        query,
        search_depth: options.searchDepth || config.tavily.searchDepth,
        include_answer: true,
        include_images: false,
        include_raw_content: false,
        max_results: options.maxResults || config.tavily.maxResults,
        include_domains: options.includeDomains || [],
        exclude_domains: options.excludeDomains || []
      });

      return {
        answer: response.data.answer,
        results: response.data.results.map(result => ({
          title: result.title,
          url: result.url,
          content: result.content,
          score: result.score
        }))
      };
    } catch (error) {
      console.error('Tavily Search Error:', error);
      throw new Error(`Search failed: ${error.message}`);
    }
  }

  async extract(urls) {
    try {
      const response = await axios.post(`${this.baseUrl}/extract`, {
        api_key: this.apiKey,
        urls: Array.isArray(urls) ? urls : [urls]
      });

      return response.data.results.map(result => ({
        url: result.url,
        content: result.raw_content
      }));
    } catch (error) {
      console.error('Tavily Extract Error:', error);
      throw new Error(`Content extraction failed: ${error.message}`);
    }
  }

  async searchAndExtract(query, options = {}) {
    const searchResults = await this.search(query, options);
    
    // Get top URLs for extraction
    const topUrls = searchResults.results
      .slice(0, options.extractCount || 3)
      .map(result => result.url);

    if (topUrls.length === 0) {
      return { searchResults, extractedContent: [] };
    }

    const extractedContent = await this.extract(topUrls);
    
    return {
      searchResults,
      extractedContent
    };
  }

  async searchActivities(location, activityType = '', options = {}) {
    const query = `${activityType} activities things to do in ${location} tourist attractions`;
    return this.search(query, {
      ...options,
      maxResults: 8
    });
  }

  async searchVenues(location, eventType, capacity, options = {}) {
    const query = `${eventType} venues ${location} capacity ${capacity} event spaces conference halls`;
    return this.search(query, {
      ...options,
      maxResults: 5
    });
  }

  async searchRestaurants(location, cuisine = '', dietary = '', options = {}) {
    const query = `restaurants ${location} ${cuisine} ${dietary} dining options`;
    return this.search(query, {
      ...options,
      maxResults: 6
    });
  }
}

export const tavilyClient = new TavilyClient();