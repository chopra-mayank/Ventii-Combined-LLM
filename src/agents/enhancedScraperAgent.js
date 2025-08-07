// src/agents/enhancedScraperAgent.js
import { tavilyClient } from '../tools/tavilyClient.js';
import { groqClient } from '../tools/groqClient.js';

export class EnhancedScraperAgent {
  constructor() {
    this.name = 'EnhancedScraperAgent';
    this.maxConcurrentExtractions = 5;
  }

  async extractContent(searchResults, context) {
    console.log('🔗 Starting enhanced content extraction...');
    
    // Get top URLs from search results with better filtering
    const topUrls = this.selectHighQualityUrls(searchResults, context);
    console.log('High-quality URLs selected:', topUrls.map(u => u.url));
    
    if (topUrls.length === 0) {
      console.warn('No high-quality URLs available for extraction');
      return [];
    }

    console.log(`📄 Extracting content from ${topUrls.length} high-quality URLs`);
    
    // Extract content in batches
    const batches = this.createBatches(topUrls, this.maxConcurrentExtractions);
    const extractedContent = [];

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      console.log(`Processing batch ${i + 1}/${batches.length} (${batch.length} URLs)`);
      
      try {
        const batchResults = await this.extractBatch(batch);
        extractedContent.push(...batchResults);
        
        // Small delay between batches to avoid rate limiting
        if (i < batches.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error) {
        console.error(`Batch ${i + 1} extraction failed:`, error.message);
      }
    }

    // Filter and enhance extracted content
    const filteredContent = this.filterRelevantContent(extractedContent, context);
    console.log('Content remaining after filtering:', filteredContent.length, 'items');
    console.log('First filtered item:', filteredContent[0]);
    
    // Extract structured information using LLM
    const structuredContent = await this.extractStructuredInformation(filteredContent, context);

    return structuredContent;
  }

  selectHighQualityUrls(searchResults, context) {
    const urls = [];
    
    // Quality scoring based on domain reputation
    const highQualityDomains = [
      'tourism.gov.in',
      'incredibleindia.org',
      'tripadvisor.com',
      'makemytrip.com',
      'goibibo.com',
      'cleartrip.com',
      'yatra.com',
      'thrillophilia.com',
      'holidayiq.com',
      'travelogyindia.com'
    ];

    const mediumQualityDomains = [
      'wikipedia.org',
      'lonelyplanet.com',
      'timesofindia.com',
    ];

    // Extract URLs from all search results
    for (const search of searchResults) {
      if (!search.results || search.results.length === 0) continue;

      search.results.forEach(result => {
        const domain = this.extractDomain(result.url);
        let qualityScore = 1;

        // Assign quality scores
        if (highQualityDomains.some(d => domain.includes(d))) {
          qualityScore = 3;
        } else if (mediumQualityDomains.some(d => domain.includes(d))) {
          qualityScore = 2;
        }

        // Additional scoring based on relevance to context
        let relevanceScore = this.calculateRelevanceScore(result, context);

        urls.push({
          url: result.url,
          title: result.title,
          content: result.content || '',
          category: search.category,
          qualityScore: qualityScore,
          relevanceScore: relevanceScore,
          totalScore: qualityScore * relevanceScore
        });
      });
    }

    // Sort by total score and return top URLs
    return urls
      .sort((a, b) => b.totalScore - a.totalScore)
      .slice(0, 15); // Limit to top 15 URLs
  }

  extractDomain(url) {
    try {
      return new URL(url).hostname.toLowerCase();
    } catch {
      return '';
    }
  }

  calculateRelevanceScore(result, context) {
    let score = 1;
    const text = (result.title + ' ' + (result.content || '')).toLowerCase();
    const location = context.location.toLowerCase();

    // Location relevance
    if (text.includes(location)) score += 2;
    
    // Event type relevance
    if (context.type === 'corporate') {
      if (text.includes('corporate') || text.includes('conference') || 
          text.includes('meeting') || text.includes('team building')) {
        score += 1.5;
      }
    }

    // Activity relevance
    if (context.preferences) {
      context.preferences.forEach(pref => {
        if (text.includes(pref.toLowerCase())) {
          score += 1;
        }
      });
    }

    return score;
  }

  createBatches(urls, batchSize) {
    const batches = [];
    for (let i = 0; i < urls.length; i += batchSize) {
      batches.push(urls.slice(i, i + batchSize));
    }
    return batches;
  }

  async extractBatch(urlBatch) {
    try {
      const urlList = urlBatch.map(item => item.url);
      console.log(`Extracting batch: ${urlList.length} URLs`);
      
      const extractedData = await tavilyClient.extract(urlList);
      console.log('Raw data from Tavily API:', extractedData);
      
      // Merge with metadata and filter content
      return extractedData.map(extracted => {
        const metadata = urlBatch.find(item => item.url === extracted.url);
        
        // Filter and clean content
        const cleanContent = this.cleanExtractedContent(extracted.content || '');
        
        return {
          ...extracted,
          content: cleanContent,
          title: metadata?.title || '',
          category: metadata?.category || '',
          qualityScore: metadata?.qualityScore || 1,
          relevanceScore: metadata?.relevanceScore || 1,
          totalScore: metadata?.totalScore || 1,
          wordCount: cleanContent.split(' ').length,
          extractedAt: new Date().toISOString()
        };
      });
    } catch (error) {
      console.error('Batch extraction failed:', error.message);
      return urlBatch.map(item => ({
        url: item.url,
        content: '',
        title: item.title,
        category: item.category,
        error: error.message,
        extractedAt: new Date().toISOString()
      }));
    }
  }

  cleanExtractedContent(content) {
    if (!content) return '';
    
    // Remove excessive whitespace and clean up
    let cleaned = content
      .replace(/\s+/g, ' ')
      .replace(/\n+/g, '\n')
      .trim();
    
    // Remove common noise patterns
    cleaned = cleaned
      .replace(/cookie policy|privacy policy|terms of service/gi, '')
      .replace(/subscribe to newsletter|sign up/gi, '')
      .replace(/advertisement|ad space/gi, '');
    
    return cleaned;
  }

  filterRelevantContent(extractedContent, context) {
    return extractedContent.filter(content => {
      // Filter out failed extractions
      if (content.error) return false;
      
      // Filter by minimum word count
      if (content.wordCount < 100) return false;
      
      // Filter by relevance
      if (content.relevanceScore < 1.5) return false;
      
      return true;
    }).sort((a, b) => b.totalScore - a.totalScore);
  }

  async extractStructuredInformation(extractedContent, context) {
    console.log('🏗️ Extracting structured information from content...');
    
    const structuredContent = [];
    
    // Process content in chunks to avoid token limits
    const chunks = this.chunkContent(extractedContent, 3);
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      console.log(`Processing chunk ${i + 1}/${chunks.length}`);
      
      try {
        const structured = await this.extractChunkInformation(chunk, context);
        structuredContent.push(...structured);
        
        // Delay between chunks
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`Failed to extract structured info from chunk ${i + 1}:`, error.message);
      }
    }
    
    return structuredContent;
  }

  chunkContent(content, chunkSize) {
    const chunks = [];
    for (let i = 0; i < content.length; i += chunkSize) {
      chunks.push(content.slice(i, i + chunkSize));
    }
    return chunks;
  }

  async extractChunkInformation(contentChunk, context) {
    const systemPrompt = `You are an expert information extractor for travel and event planning.
Extract specific, actionable information from web content that can be used for itinerary planning.

Focus on extracting:
1. Venue/attraction names with specific details
2. Costs and pricing information
3. Location addresses and contact details
4. Operating hours and availability
5. Special features or highlights
6. Booking requirements
7. Group accommodation capabilities
8. Activity descriptions and requirements

Be specific and factual. Avoid generic descriptions.`;

    const schema = {
      venues: [
        {
          name: "string",
          type: "hotel | restaurant | attraction | venue | activity",
          description: "string",
          location: "string",
          address: "string",
          contact: "string",
          cost: "string",
          capacity: "string",
          operatingHours: "string",
          highlights: "array of strings",
          requirements: "array of strings",
          bookingInfo: "string",
          sourceUrl: "string"
        }
      ],
      activities: [
        {
          name: "string",
          type: "adventure | cultural | leisure | team_building | dining",
          description: "string",
          duration: "string",
          cost: "string",
          groupSize: "string",
          location: "string",
          requirements: "array of strings",
          highlights: "array of strings",
          sourceUrl: "string"
        }
      ],
      practicalInfo: {
        transportation: "array of strings",
        budgetInsights: "array of strings",
        seasonalTips: "array of strings",
        localTips: "array of strings"
      }
    };

    const contentText = contentChunk.map(item => 
      `Source: ${item.title} (${item.url})
Content: ${item.content.substring(0, 1500)}...`
    ).join('\n\n---\n\n');

    const prompt = `Extract structured information for ${context.type} itinerary planning in ${context.location}:

Context:
- Location: ${context.location}
- Type: ${context.type}
- Participants: ${context.participants}
- Duration: ${context.duration} days
- Budget: ${context.currency} ${context.budget}
- Preferences: ${context.preferences?.join(', ') || 'None'}

Content to extract from:
${contentText}

Extract specific venues, activities, and practical information relevant to the context.`;

    try {
      const completion = await groqClient.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'llama3-70b-8192',
        response_format: { type: "json_object" }, // Crucial for reliable JSON output
        temperature: 0.1,
        max_tokens: 4000
      });

      const response = completion.choices[0]?.message?.content || '{}';
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      
      if (!jsonMatch) {
        throw new Error('No valid JSON found in LLM response.');
      }
      
      const result = JSON.parse(jsonMatch[0]);

      // Add metadata to extracted items
      result.venues = result.venues?.map(venue => ({
        ...venue,
        extractedAt: new Date().toISOString(),
        relevanceScore: this.calculateItemRelevance(venue, context)
      })) || [];
      
      result.activities = result.activities?.map(activity => ({
        ...activity,
        extractedAt: new Date().toISOString(),
        relevanceScore: this.calculateItemRelevance(activity, context)
      })) || [];
      
      return [result];
    } catch (error) {
      console.error('Structured extraction failed:', error.message);
      // Fallback in case of failure
      return [];
    }
  }

  calculateItemRelevance(item, context) {
    let score = 1;
    const text = (item.name + ' ' + item.description).toLowerCase();
    
    // Location relevance
    if (text.includes(context.location.toLowerCase())) score += 2;
    
    // Type relevance
    if (context.type === 'corporate' && 
        (text.includes('corporate') || text.includes('conference') || 
         text.includes('meeting') || text.includes('team'))) {
      score += 1.5;
    }
    
    // Preference relevance
    if (context.preferences) {
      context.preferences.forEach(pref => {
        if (text.includes(pref.toLowerCase())) score += 1;
      });
    }
    
    return score;
  }

  async retryFailedExtractions(failedUrls, context, maxRetries = 2) {
    console.log(`🔄 Retrying ${failedUrls.length} failed extractions...`);
    
    const retried = [];
    
    for (const url of failedUrls) {
      let attempts = 0;
      while (attempts < maxRetries) {
        try {
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempts + 1)));
          
          const result = await tavilyClient.extract([url.url]);
          if (result && result.length > 0 && result[0].content) {
            retried.push({
              ...result[0],
              title: url.title,
              category: url.category,
              retryAttempt: attempts + 1
            });
            break;
          }
        } catch (error) {
          console.warn(`Retry ${attempts + 1} failed for ${url.url}: ${error.message}`);
        }
        attempts++;
      }
    }
    
    console.log(`✅ Successfully retried ${retried.length}/${failedUrls.length} extractions`);
    return retried;
  }

  getExtractionSummary(extractedContent) {
    const summary = {
      totalUrls: extractedContent.length,
      successfulExtractions: extractedContent.filter(c => !c.error && c.content).length,
      failedExtractions: extractedContent.filter(c => c.error || !c.content).length,
      totalWordCount: extractedContent.reduce((sum, c) => sum + (c.wordCount || 0), 0),
      averageQuality: 0,
      categories: {}
    };

    // Calculate average quality
    const qualityScores = extractedContent
      .filter(c => c.qualityScore)
      .map(c => c.qualityScore);
    
    if (qualityScores.length > 0) {
      summary.averageQuality = qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length;
    }

    // Count by category
    extractedContent.forEach(content => {
      if (content.category) {
        summary.categories[content.category] = (summary.categories[content.category] || 0) + 1;
      }
    });

    return summary;
  }
}