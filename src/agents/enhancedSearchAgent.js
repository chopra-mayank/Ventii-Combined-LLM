// src/agents/enhancedSearchAgent.js
import { tavilyClient } from '../tools/tavilyClient.js';
import { ItineraryType } from '../types/index.js';

export class EnhancedSearchAgent {
  constructor() {
    this.name = 'EnhancedSearchAgent';
  }

  async searchRelevantContent(parsedInput) {
    console.log('🔍 Starting enhanced search with targeted queries...');
    
    const searches = [];
    
    if (parsedInput.type === ItineraryType.CORPORATE) {
      searches.push(...await this.getEnhancedCorporateQueries(parsedInput));
    } else {
      searches.push(...await this.getEnhancedTravelQueries(parsedInput));
    }

    console.log(`📊 Generated ${searches.length} targeted search queries`);

    const searchResults = [];
    
    // Execute searches with intelligent batching
    for (let i = 0; i < searches.length; i++) {
      const query = searches[i];
      
      try {
        console.log(`🔍 Search ${i + 1}/${searches.length}: ${query.description}`);
        
        const result = await tavilyClient.search(query.query, {
          maxResults: query.maxResults || 6,
          searchDepth: query.priority === 'high' ? 'advanced' : 'basic'
        });
        
        // Enhance results with metadata
        const enhancedResult = {
          ...result,
          query: query.query,
          description: query.description,
          category: query.category,
          priority: query.priority,
          searchedAt: new Date().toISOString(),
          resultsCount: result.results?.length || 0
        };
        
        searchResults.push(enhancedResult);

        // Adaptive delay based on priority
        const delay = query.priority === 'high' ? 300 : 200;
        await new Promise(resolve => setTimeout(resolve, delay));
        
      } catch (error) {
        console.warn(`❌ Search failed for: ${query.description}`, error.message);
        searchResults.push({
          query: query.query,
          description: query.description,
          category: query.category,
          results: [],
          error: error.message,
          searchedAt: new Date().toISOString()
        });
      }
    }

    // Post-process and validate results
    const validatedResults = this.validateAndEnhanceResults(searchResults, parsedInput);
    
    console.log(`✅ Search completed: ${validatedResults.length} successful searches`);
    return validatedResults;
  }

  async getEnhancedCorporateQueries(input) {
    const queries = [];
    const location = input.location;
    const eventType = input.eventType;
    const participants = input.participants;
    const focus = input.focus;

    // High-priority venue searches with specific terms
    queries.push({
      query: `"${eventType}" venues "${location}" conference halls meeting rooms capacity ${participants}`,
      description: `Corporate venues for ${eventType} in ${location}`,
      category: 'venues',
      priority: 'high',
      maxResults: 8
    });

    queries.push({
      query: `business hotels "${location}" group booking ${participants} conference facilities`,
      description: `Business hotels with meeting facilities in ${location}`,
      category: 'accommodation',
      priority: 'high',
      maxResults: 6
    });

    // Team building and activity searches
    if (focus && focus.toLowerCase().includes('team')) {
      queries.push({
        query: `team building activities "${location}" corporate groups ${participants} people indoor outdoor`,
        description: `Team building activities in ${location}`,
        category: 'activities',
        priority: 'high',
        maxResults: 8
      });

      queries.push({
        query: `adventure team building "${location}" corporate retreat activities`,
        description: `Adventure team building in ${location}`,
        category: 'activities',
        priority: 'medium',
        maxResults: 6
      });
    }

    // Specific corporate dining options
    queries.push({
      query: `corporate catering "${location}" business lunch group dining ${participants}`,
      description: `Corporate catering and group dining in ${location}`,
      category: 'catering',
      priority: 'high',
      maxResults: 7
    });

    queries.push({
      query: `banquet halls "${location}" corporate events group dining capacity ${participants}`,
      description: `Banquet facilities for corporate groups in ${location}`,
      category: 'catering',
      priority: 'medium',
      maxResults: 5
    });

    // Transportation for groups
    if (participants > 15) {
      queries.push({
        query: `group transportation "${location}" bus rental corporate travel ${participants} passengers`,
        description: `Group transportation options in ${location}`,
        category: 'transport',
        priority: 'medium',
        maxResults: 5
      });
    }

    // Event planning services and suppliers
    queries.push({
      query: `corporate event planners "${location}" ${eventType} planning services`,
      description: `Professional event planning services in ${location}`,
      category: 'services',
      priority: 'medium',
      maxResults: 4
    });

    // Local attractions suitable for corporate groups
    queries.push({
      query: `corporate group visits "${location}" attractions museums cultural sites`,
      description: `Corporate-friendly attractions in ${location}`,
      category: 'attractions',
      priority: 'medium',
      maxResults: 6
    });

    // Meeting room rentals and facilities
    queries.push({
      query: `meeting room rental "${location}" AV equipment projector capacity ${participants}`,
      description: `Meeting room rentals with facilities in ${location}`,
      category: 'venues',
      priority: 'high',
      maxResults: 6
    });

    return queries;
  }

  async getEnhancedTravelQueries(input) {
    const queries = [];
    const location = input.location;
    const participants = input.participants;
    const preferences = input.preferences || [];

    // Core attraction searches
    queries.push({
      query: `"${location}" top attractions must visit places tourist guide`,
      description: `Top tourist attractions in ${location}`,
      category: 'attractions',
      priority: 'high',
      maxResults: 10
    });

    queries.push({
      query: `"${location}" hidden gems off beaten path local attractions`,
      description: `Hidden gems and local attractions in ${location}`,
      category: 'attractions',
      priority: 'medium',
      maxResults: 6
    });

    // Accommodation searches with group focus
    if (participants > 4) {
      queries.push({
        query: `group accommodation "${location}" hotels ${participants} people multiple rooms`,
        description: `Group accommodation in ${location}`,
        category: 'accommodation',
        priority: 'high',
        maxResults: 7
      });
    } else {
      queries.push({
        query: `best hotels "${location}" accommodation booking tourist`,
        description: `Quality accommodation in ${location}`,
        category: 'accommodation',
        priority: 'high',
        maxResults: 7
      });
    }

    // Preference-based activity searches
    preferences.forEach(preference => {
      const lowerPref = preference.toLowerCase();
      
      if (lowerPref.includes('adventure') || lowerPref.includes('outdoor')) {
        queries.push({
          query: `adventure activities "${location}" outdoor sports trekking water sports`,
          description: `Adventure activities in ${location}`,
          category: 'adventure',
          priority: 'high',
          maxResults: 8
        });
      }
      
      if (lowerPref.includes('cultural') || lowerPref.includes('heritage')) {
        queries.push({
          query: `cultural attractions "${location}" heritage sites museums temples historical`,
          description: `Cultural and heritage sites in ${location}`,
          category: 'cultural',
          priority: 'high',
          maxResults: 8
        });
      }
      
      if (lowerPref.includes('food') || lowerPref.includes('culinary')) {
        queries.push({
          query: `food tours "${location}" culinary experiences local cuisine restaurants`,
          description: `Culinary experiences in ${location}`,
          category: 'dining',
          priority: 'high',
          maxResults: 7
        });
      }
    });

    // General dining searches
    queries.push({
      query: `best restaurants "${location}" local cuisine dining recommendations`,
      description: `Restaurant recommendations in ${location}`,
      category: 'dining',
      priority: 'high',
      maxResults: 8
    });

    queries.push({
      query: `street food "${location}" local markets food stalls authentic cuisine`,
      description: `Street food and local markets in ${location}`,
      category: 'dining',
      priority: 'medium',
      maxResults: 6
    });

    // Transportation and logistics
    queries.push({
      query: `transportation "${location}" local transport taxi bus metro airport transfer`,
      description: `Transportation options in ${location}`,
      category: 'transport',
      priority: 'medium',
      maxResults: 5
    });

    // Shopping and entertainment
    queries.push({
      query: `shopping "${location}" markets malls handicrafts souvenirs local crafts`,
      description: `Shopping options in ${location}`,
      category: 'shopping',
      priority: 'low',
      maxResults: 5
    });

    queries.push({
      query: `nightlife "${location}" entertainment bars clubs live music`,
      description: `Nightlife and entertainment in ${location}`,
      category: 'entertainment',
      priority: 'low',
      maxResults: 4
    });

    // Practical information
    queries.push({
      query: `"${location}" travel guide tips weather best time visit practical information`,
      description: `Travel tips and practical information for ${location}`,
      category: 'practical',
      priority: 'medium',
      maxResults: 4
    });

    // Day trip and excursion options
    queries.push({
      query: `day trips from "${location}" nearby attractions excursions tours`,
      description: `Day trip options from ${location}`,
      category: 'excursions',
      priority: 'medium',
      maxResults: 6
    });

    return queries;
  }

  validateAndEnhanceResults(searchResults, context) {
    const validResults = [];
    
    searchResults.forEach(search => {
      // Skip failed searches
      if (search.error || !search.results || search.results.length === 0) {
        console.warn(`⚠️ Skipping failed/empty search: ${search.description}`);
        return;
      }

      // Enhance each result with relevance scoring
      const enhancedResults = search.results.map(result => ({
        ...result,
        relevanceScore: this.calculateRelevanceScore(result, context),
        searchCategory: search.category,
        searchPriority: search.priority
      }));

      // Filter and sort by relevance
      const filteredResults = enhancedResults
        .filter(result => result.relevanceScore > 0.3) // Minimum relevance threshold
        .sort((a, b) => b.relevanceScore - a.relevanceScore);

      if (filteredResults.length > 0) {
        validResults.push({
          ...search,
          results: filteredResults,
          validResultsCount: filteredResults.length,
          averageRelevance: filteredResults.reduce((sum, r) => sum + r.relevanceScore, 0) / filteredResults.length
        });
      }
    });

    return validResults;
  }

  calculateRelevanceScore(result, context) {
    let score = 0.5; // Base score
    
    const text = (result.title + ' ' + (result.content || '')).toLowerCase();
    const location = context.location.toLowerCase();
    
    // Location relevance (high weight)
    if (text.includes(location)) {
      score += 0.4;
    }
    
    // Exact location match bonus
    const locationWords = location.split(' ');
    if (locationWords.every(word => text.includes(word))) {
      score += 0.2;
    }
    
    // Type relevance
    if (context.type === ItineraryType.CORPORATE) {
      const corporateTerms = ['corporate', 'business', 'conference', 'meeting', 'seminar', 'team building'];
      if (corporateTerms.some(term => text.includes(term))) {
        score += 0.3;
      }
    }
    
    // Preferences relevance
    if (context.preferences) {
      context.preferences.forEach(pref => {
        if (text.includes(pref.toLowerCase())) {
          score += 0.15;
        }
      });
    }
    
    // Group size relevance
    if (context.participants > 10) {
      const groupTerms = ['group', 'groups', 'party', 'bulk', 'multiple'];
      if (groupTerms.some(term => text.includes(term))) {
        score += 0.1;
      }
    }
    
    // URL quality bonus
    const domain = this.extractDomain(result.url);
    const highQualityDomains = [
      'tourism.gov.in', 'incredibleindia.org', 'tripadvisor.com',
      'lonelyplanet.com', 'makemytrip.com', 'goibibo.com'
    ];
    
    if (highQualityDomains.some(d => domain.includes(d))) {
      score += 0.15;
    }
    
    // Content length bonus (indicates substantial content)
    if (result.content && result.content.length > 500) {
      score += 0.1;
    }
    
    return Math.min(score, 1.0); // Cap at 1.0
  }

  extractDomain(url) {
    try {
      return new URL(url).hostname.toLowerCase();
    } catch {
      return '';
    }
  }

  async searchSpecificCategory(location, category, additionalParams = {}) {
    const categoryQueries = this.getCategorySpecificQueries(location, category, additionalParams);
    
    const results = [];
    for (const query of categoryQueries) {
      try {
        const result = await tavilyClient.search(query.query, {
          maxResults: query.maxResults || 6
        });
        
        results.push({
          ...result,
          category: category,
          query: query.query,
          description: query.description
        });
      } catch (error) {
        console.error(`Category search failed for ${category}:`, error);
      }
    }
    
    return results;
  }

  getCategorySpecificQueries(location, category, params) {
    const queries = [];
    
    switch (category) {
      case 'venues':
        queries.push({
          query: `"${location}" ${params.eventType || 'meeting'} venues halls capacity ${params.capacity || ''}`,
          description: `Event venues in ${location}`,
          maxResults: 8
        });
        break;
        
      case 'restaurants':
        queries.push({
          query: `"${location}" restaurants ${params.cuisine || ''} ${params.dietary || ''} group dining`,
          description: `Restaurants in ${location}`,
          maxResults: 7
        });
        break;
        
      case 'activities':
        queries.push({
          query: `"${location}" activities ${params.activityType || ''} things to do ${params.groupSize || ''}`,
          description: `Activities in ${location}`,
          maxResults: 8
        });
        break;
        
      case 'accommodation':
        queries.push({
          query: `"${location}" hotels accommodation ${params.participants || ''} people booking`,
          description: `Accommodation in ${location}`,
          maxResults: 6
        });
        break;
        
      default:
        queries.push({
          query: `"${location}" ${category}`,
          description: `${category} in ${location}`,
          maxResults: 6
        });
    }
    
    return queries;
  }

  async performTargetedSearch(searchTerms, location, options = {}) {
    const enhancedQuery = `"${location}" ${searchTerms.join(' ')} ${options.additionalTerms || ''}`;
    
    try {
      return await tavilyClient.search(enhancedQuery, {
        maxResults: options.maxResults || 6,
        searchDepth: options.deep ? 'advanced' : 'basic'
      });
    } catch (error) {
      console.error('Targeted search failed:', error);
      throw error;
    }
  }

  getSearchSummary(searchResults) {
    const summary = {
      totalSearches: searchResults.length,
      successfulSearches: searchResults.filter(s => !s.error && s.results?.length > 0).length,
      failedSearches: searchResults.filter(s => s.error || !s.results?.length).length,
      totalResults: searchResults.reduce((sum, s) => sum + (s.results?.length || 0), 0),
      averageRelevance: 0,
      categories: {},
      priorities: {}
    };

    // Calculate category distribution
    searchResults.forEach(search => {
      if (search.category) {
        summary.categories[search.category] = (summary.categories[search.category] || 0) + 1;
      }
      if (search.priority) {
        summary.priorities[search.priority] = (summary.priorities[search.priority] || 0) + 1;
      }
    });

    // Calculate average relevance
    const relevanceScores = searchResults
      .filter(s => s.averageRelevance)
      .map(s => s.averageRelevance);
    
    if (relevanceScores.length > 0) {
      summary.averageRelevance = relevanceScores.reduce((a, b) => a + b, 0) / relevanceScores.length;
    }

    return summary;
  }
}