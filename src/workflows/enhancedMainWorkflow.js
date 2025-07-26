// src/workflows/enhancedMainWorkflow.js
import { createMachine, interpret } from 'xstate';
import { UnifiedInputParserAgent } from '../agents/unifiedInputParser.js';
import { ActivitySuggestorAgent } from '../agents/activitySuggestor.js';
import { EnhancedSearchAgent } from '../agents/enhancedSearchAgent.js';
import { EnhancedScraperAgent } from '../agents/enhancedScraperAgent.js';
import { EnhancedSummarizerAgent } from '../agents/enhancedSummarizerAgent.js';
import { EnhancedEventPlannerAgent } from '../agents/enhancedEventPlanner.js';
import { CombinedItineraryAgent } from '../agents/combinedItinerary.js';
import { ItineraryType } from '../types/index.js';

// Initialize enhanced agents
const inputParser = new UnifiedInputParserAgent();
const activitySuggestor = new ActivitySuggestorAgent();
const enhancedSearchAgent = new EnhancedSearchAgent();
const enhancedScraperAgent = new EnhancedScraperAgent();
const enhancedSummarizerAgent = new EnhancedSummarizerAgent();
const enhancedEventPlanner = new EnhancedEventPlannerAgent();
const combinedItinerary = new CombinedItineraryAgent();

// Enhanced state machine with better data flow
export const enhancedItineraryMachine = createMachine({
  id: 'enhancedItineraryGenerator',
  initial: 'idle',
  context: {
    userInput: '',
    parsedInput: null,
    suggestedActivities: null,
    searchResults: null,
    extractedContent: null,
    structuredContent: null,
    researchSummaries: null,
    generatedItinerary: null,
    finalItinerary: null,
    error: null,
    processingStep: '',
    dataQuality: {
      searchQuality: 0,
      extractionQuality: 0,
      integrationScore: 0
    }
  },
  states: {
    idle: {
      on: {
        GENERATE: {
          target: 'parsingInput',
          actions: 'setUserInput'
        },
        REFINE: {
          target: 'refining',
          actions: 'setRefinementData'
        }
      }
    },

    parsingInput: {
      invoke: {
        id: 'parseInput',
        src: 'parseUserInput',
        onDone: {
          target: 'suggestingActivities',
          actions: 'setParsedInput'
        },
        onError: {
          target: 'error',
          actions: 'setError'
        }
      }
    },

    suggestingActivities: {
      invoke: {
        id: 'suggestActivities',
        src: 'suggestActivities',
        onDone: {
          target: 'enhancedSearching',
          actions: 'setSuggestedActivities'
        },
        onError: {
          target: 'error',
          actions: 'setError'
        }
      }
    },

    enhancedSearching: {
      invoke: {
        id: 'enhancedSearch',
        src: 'performEnhancedSearch',
        onDone: {
          target: 'enhancedExtracting',
          actions: 'setSearchResults'
        },
        onError: {
          target: 'error',
          actions: 'setError'
        }
      }
    },

    enhancedExtracting: {
      invoke: {
        id: 'enhancedExtraction',
        src: 'performEnhancedExtraction',
        onDone: {
          target: 'enhancedSummarizing',
          actions: 'setExtractedContent'
        },
        onError: {
          target: 'error',
          actions: 'setError'
        }
      }
    },

    enhancedSummarizing: {
      invoke: {
        id: 'enhancedSummarization',
        src: 'performEnhancedSummarization',
        onDone: {
          target: 'enhancedPlanning',
          actions: 'setResearchSummaries'
        },
        onError: {
          target: 'error',
          actions: 'setError'
        }
      }
    },

    enhancedPlanning: {
      invoke: {
        id: 'enhancedPlanning',
        src: 'generateEnhancedItinerary',
        onDone: {
          target: 'finalizingItinerary',
          actions: 'setGeneratedItinerary'
        },
        onError: {
          target: 'error',
          actions: 'setError'
        }
      }
    },

    finalizingItinerary: {
      invoke: {
        id: 'finalizeItinerary',
        src: 'finalizeItinerary',
        onDone: {
          target: 'completed',
          actions: 'setFinalItinerary'
        },
        onError: {
          target: 'error',
          actions: 'setError'
        }
      }
    },

    refining: {
      initial: 'determiningRefinementType',
      states: {
        determiningRefinementType: {
          always: [
            {
              target: 'refiningWithResearch',
              guard: 'hasResearchData'
            },
            {
              target: 'basicRefinement'
            }
          ]
        },

        refiningWithResearch: {
          invoke: {
            id: 'refineWithResearch',
            src: 'refineItineraryWithResearch',
            onDone: {
              target: '#enhancedItineraryGenerator.completed',
              actions: 'setFinalItinerary'
            },
            onError: {
              target: '#enhancedItineraryGenerator.error',
              actions: 'setError'
            }
          }
        },

        basicRefinement: {
          invoke: {
            id: 'basicRefinement',
            src: 'performBasicRefinement',
            onDone: {
              target: '#enhancedItineraryGenerator.completed',
              actions: 'setFinalItinerary'
            },
            onError: {
              target: '#enhancedItineraryGenerator.error',
              actions: 'setError'
            }
          }
        }
      }
    },

    completed: {
      on: {
        GENERATE: {
          target: 'parsingInput',
          actions: 'resetContext'
        },
        REFINE: {
          target: 'refining',
          actions: 'setRefinementData'
        },
        RESET: {
          target: 'idle',
          actions: 'resetContext'
        }
      }
    },

    error: {
      on: {
        RETRY: {
          target: 'idle',
          actions: 'resetContext'
        },
        RESET: {
          target: 'idle',
          actions: 'resetContext'
        }
      }
    }
  }
}, {
  actions: {
    setUserInput: (context, event) => {
      context.userInput = event.input;
      context.processingStep = 'Parsing user input...';
    },

    setParsedInput: (context, event) => {
      context.parsedInput = event.data;
      context.processingStep = 'Input parsed, suggesting activities...';
    },

    setSuggestedActivities: (context, event) => {
      context.suggestedActivities = event.data;
      context.processingStep = 'Activities suggested, performing enhanced search...';
    },

    setSearchResults: (context, event) => {
      context.searchResults = event.data;
      context.dataQuality.searchQuality = event.data.length > 0 ? 
        event.data.filter(s => !s.error).length / event.data.length * 100 : 0;
      context.processingStep = 'Enhanced search completed, extracting content...';
    },

    setExtractedContent: (context, event) => {
      context.extractedContent = event.data.rawContent;
      context.structuredContent = event.data.structuredContent;
      context.dataQuality.extractionQuality = event.data.quality || 0;
      context.processingStep = 'Content extracted and structured, creating comprehensive summaries...';
    },

    setResearchSummaries: (context, event) => {
      context.researchSummaries = event.data;
      context.processingStep = 'Research summarized, generating enhanced itinerary...';
    },

    setGeneratedItinerary: (context, event) => {
      context.generatedItinerary = event.data;
      context.dataQuality.integrationScore = event.data.metadata?.dataIntegrationScore || 0;
      context.processingStep = 'Enhanced itinerary generated, finalizing...';
    },

    setFinalItinerary: (context, event) => {
      context.finalItinerary = event.data;
      context.processingStep = 'Completed successfully with enhanced data integration!';
    },

    setError: (context, event) => {
      context.error = event.data;
      context.processingStep = `Error: ${event.data.message || event.data}`;
    },

    setRefinementData: (context, event) => {
      context.refinementData = event.refinement;
      context.processingStep = 'Refining itinerary with research data...';
    },

    resetContext: (context) => {
      Object.keys(context).forEach(key => {
        if (key !== 'userInput') {
          context[key] = null;
        }
      });
      context.dataQuality = { searchQuality: 0, extractionQuality: 0, integrationScore: 0 };
      context.processingStep = '';
    }
  },

  guards: {
    hasResearchData: (context) => {
      return context.researchSummaries && context.researchSummaries.consolidatedContent;
    }
  },

  services: {
    parseUserInput: async (context) => {
      return await inputParser.parse(context.userInput);
    },

    suggestActivities: async (context) => {
      return await activitySuggestor.suggestActivities(context.parsedInput);
    },

    performEnhancedSearch: async (context) => {
      const searchResults = await enhancedSearchAgent.searchRelevantContent(context.parsedInput);
      
      // Log search quality metrics
      const searchSummary = enhancedSearchAgent.getSearchSummary(searchResults);
      console.log('🔍 Search Summary:', searchSummary);
      
      return searchResults;
    },

    performEnhancedExtraction: async (context) => {
      const rawExtractedContent = await enhancedScraperAgent.extractContent(
        context.searchResults, 
        context.parsedInput
      );
      
      // Get extraction quality metrics
      const extractionSummary = enhancedScraperAgent.getExtractionSummary(rawExtractedContent);
      console.log('📄 Extraction Summary:', extractionSummary);
      
      return {
        rawContent: rawExtractedContent,
        structuredContent: rawExtractedContent, // EnhancedScraper already structures content
        quality: extractionSummary.successfulExtractions / extractionSummary.totalUrls * 100
      };
    },

    performEnhancedSummarization: async (context) => {
      const summaries = await enhancedSummarizerAgent.summarizeExtractedContent(
        context.structuredContent,
        context.parsedInput
      );
      
      // Validate summary quality
      const validation = enhancedSummarizerAgent.validateSummaryQuality 
        ? enhancedSummarizerAgent.validateSummaryQuality(summaries)
        : { isValid: true, warnings: [] };
      
      if (validation.warnings.length > 0) {
        console.warn('⚠️ Summary Quality Warnings:', validation.warnings);
      }
      
      return summaries;
    },

    generateEnhancedItinerary: async (context) => {
      const itinerary = await enhancedEventPlanner.generateItinerary(
        context.parsedInput,
        context.suggestedActivities,
        context.researchSummaries
      );
      
      // Validate data integration
      const validation = enhancedEventPlanner.validateItineraryDataIntegration(
        itinerary,
        context.researchSummaries
      );
      
      if (validation.warnings.length > 0) {
        console.warn('⚠️ Data Integration Warnings:', validation.warnings);
      }
      
      console.log(`📊 Data Integration Score: ${validation.dataIntegrationScore}%`);
      
      return itinerary;
    },

    finalizeItinerary: async (context) => {
      return await combinedItinerary.combineAndFinalize(
        context.generatedItinerary,
        context.researchSummaries,
        context.parsedInput
      );
    },

    refineItineraryWithResearch: async (context) => {
      return await enhancedEventPlanner.refineItineraryWithResearch(
        context.finalItinerary,
        context.refinementData.prompt,
        context.parsedInput,
        context.researchSummaries
      );
    },

    performBasicRefinement: async (context) => {
      return await enhancedEventPlanner.refineItinerary(
        context.finalItinerary,
        context.refinementData.prompt,
        context.parsedInput
      );
    }
  }
});

// Enhanced workflow manager with better monitoring
export class EnhancedItineraryWorkflowManager {
  constructor() {
    this.service = null;
    this.callbacks = {
      onStateChange: () => {},
      onCompleted: () => {},
      onError: () => {},
      onProgress: () => {},
      onQualityUpdate: () => {}
    };
    this.qualityMetrics = {
      searchQuality: 0,
      extractionQuality: 0,
      integrationScore: 0,
      overallScore: 0
    };
  }

  initialize(callbacks = {}) {
    this.callbacks = { ...this.callbacks, ...callbacks };
    this.service = interpret(enhancedItineraryMachine);
    
    this.service.onTransition((state, event) => {
      console.log(`🔄 State: ${this.getStateString(state.value)}, Event: ${event.type}`);
      this.callbacks.onStateChange(state, event);
      
      if (state.context.processingStep) {
        this.callbacks.onProgress(state.context.processingStep);
      }
      
      // Update quality metrics
      if (state.context.dataQuality) {
        this.qualityMetrics = { ...state.context.dataQuality };
        this.qualityMetrics.overallScore = this.calculateOverallScore(this.qualityMetrics);
        this.callbacks.onQualityUpdate(this.qualityMetrics);
      }
      
      if (state.matches('completed')) {
        this.callbacks.onCompleted(state.context.finalItinerary);
      }
      
      if (state.matches('error')) {
        this.callbacks.onError(state.context.error);
      }
    });

    this.service.start();
    return this;
  }

  getStateString(stateValue) {
    if (typeof stateValue === 'string') {
      return stateValue;
    }
    if (typeof stateValue === 'object') {
      const keys = Object.keys(stateValue);
      if (keys.length > 0) {
        return `${keys[0]}.${stateValue[keys[0]]}`;
      }
    }
    return 'unknown';
  }

  calculateOverallScore(metrics) {
    const weights = {
      searchQuality: 0.3,
      extractionQuality: 0.4,
      integrationScore: 0.3
    };
    
    return Math.round(
      (metrics.searchQuality || 0) * weights.searchQuality +
      (metrics.extractionQuality || 0) * weights.extractionQuality +
      (metrics.integrationScore || 0) * weights.integrationScore
    );
  }

  async generateItinerary(userInput) {
    if (!this.service) {
      throw new Error('Workflow not initialized. Call initialize() first.');
    }

    console.log('🚀 Starting enhanced itinerary generation workflow...');
    this.service.send({ type: 'GENERATE', input: userInput });
    
    return new Promise((resolve, reject) => {
      const originalOnCompleted = this.callbacks.onCompleted;
      const originalOnError = this.callbacks.onError;
      
      this.callbacks.onCompleted = (itinerary) => {
        originalOnCompleted(itinerary);
        resolve(itinerary);
      };
      
      this.callbacks.onError = (error) => {
        originalOnError(error);
        reject(error);
      };
    });
  }

  async refineItinerary(originalItinerary, refinementPrompt, refinementType = {}) {
    if (!this.service) {
      throw new Error('Workflow not initialized');
    }

    // Set the current itinerary in context
    this.service.state.context.finalItinerary = originalItinerary;
    
    const refinementData = {
      prompt: refinementPrompt,
      dayNumber: refinementType.dayNumber,
      activityId: refinementType.activityId
    };

    console.log('🔄 Starting enhanced itinerary refinement workflow...');
    this.service.send({ type: 'REFINE', refinement: refinementData });
    
    return new Promise((resolve, reject) => {
      const originalOnCompleted = this.callbacks.onCompleted;
      const originalOnError = this.callbacks.onError;
      
      this.callbacks.onCompleted = (itinerary) => {
        originalOnCompleted(itinerary);
        resolve(itinerary);
      };
      
      this.callbacks.onError = (error) => {
        originalOnError(error);
        reject(error);
      };
    });
  }

  getCurrentState() {
    return this.service?.state || null;
  }

  getCurrentContext() {
    return this.service?.state?.context || null;
  }

  getQualityMetrics() {
    return this.qualityMetrics;
  }

  getProgressPercentage() {
    const state = this.getCurrentState();
    if (!state) return 0;

    const progressMap = {
      'idle': 0,
      'parsingInput': 10,
      'suggestingActivities': 20,
      'enhancedSearching': 35,
      'enhancedExtracting': 55,
      'enhancedSummarizing': 75,
      'enhancedPlanning': 90,
      'finalizingItinerary': 95,
      'completed': 100,
      'refining.refiningWithResearch': 85,
      'refining.basicRefinement': 85,
      'error': 0
    };

    const stateKey = this.getStateString(state.value);
    return progressMap[stateKey] || 0;
  }

  reset() {
    if (this.service) {
      this.service.send({ type: 'RESET' });
    }
    this.qualityMetrics = {
      searchQuality: 0,
      extractionQuality: 0,
      integrationScore: 0,
      overallScore: 0
    };
  }

  stop() {
    if (this.service) {
      this.service.stop();
      this.service = null;
    }
  }

  // Enhanced monitoring methods
  getDetailedStatus() {
    const state = this.getCurrentState();
    const context = this.getCurrentContext();
    
    return {
      currentState: this.getStateString(state?.value),
      processingStep: context?.processingStep || '',
      progress: this.getProgressPercentage(),
      qualityMetrics: this.qualityMetrics,
      hasError: !!context?.error,
      error: context?.error,
      dataStats: {
        searchResults: context?.searchResults?.length || 0,
        extractedContent: context?.extractedContent?.length || 0,
        hasResearchSummaries: !!context?.researchSummaries,
        hasFinalItinerary: !!context?.finalItinerary
      }
    };
  }

  // Quality assessment methods
  assessDataQuality() {
    const context = this.getCurrentContext();
    if (!context) return null;

    const assessment = {
      searchPhase: {
        score: this.qualityMetrics.searchQuality,
        status: this.getQualityStatus(this.qualityMetrics.searchQuality),
        details: context.searchResults ? {
          totalSearches: context.searchResults.length,
          successfulSearches: context.searchResults.filter(s => !s.error).length,
          avgRelevance: context.searchResults.reduce((sum, s) => sum + (s.averageRelevance || 0), 0) / context.searchResults.length
        } : null
      },
      extractionPhase: {
        score: this.qualityMetrics.extractionQuality,
        status: this.getQualityStatus(this.qualityMetrics.extractionQuality),
        details: context.extractedContent ? {
          totalUrls: context.extractedContent.length,
          successfulExtractions: context.extractedContent.filter(c => !c.error && c.content).length
        } : null
      },
      integrationPhase: {
        score: this.qualityMetrics.integrationScore,
        status: this.getQualityStatus(this.qualityMetrics.integrationScore),
        details: context.finalItinerary?.metadata ? {
          dataIntegrationScore: context.finalItinerary.metadata.dataIntegrationScore,
          researchDataUsed: context.finalItinerary.researchDataUsed
        } : null
      },
      overall: {
        score: this.qualityMetrics.overallScore,
        status: this.getQualityStatus(this.qualityMetrics.overallScore)
      }
    };

    return assessment;
  }

  getQualityStatus(score) {
    if (score >= 80) return 'excellent';
    if (score >= 65) return 'good';
    if (score >= 45) return 'fair';
    return 'poor';
  }

  // Diagnostic methods
  diagnoseIssues() {
    const assessment = this.assessDataQuality();
    if (!assessment) return [];

    const issues = [];

    if (assessment.searchPhase.score < 50) {
      issues.push({
        phase: 'search',
        severity: 'high',
        message: 'Low search quality detected. Consider broadening search terms or checking API connectivity.',
        suggestion: 'Review search queries and ensure location and preferences are specific enough.'
      });
    }

    if (assessment.extractionPhase.score < 60) {
      issues.push({
        phase: 'extraction',
        severity: 'high',
        message: 'Content extraction quality is low. Many URLs may be failing.',
        suggestion: 'Check URL accessibility and consider retrying failed extractions.'
      });
    }

    if (assessment.integrationPhase.score < 40) {
      issues.push({
        phase: 'integration',
        severity: 'medium',
        message: 'Low research data integration. Itinerary may lack specific venue details.',
        suggestion: 'Improve content summarization or enhance data extraction specificity.'
      });
    }

    return issues;
  }

  // Performance optimization suggestions
  getOptimizationSuggestions() {
    const context = this.getCurrentContext();
    const suggestions = [];

    // Search optimization
    if (this.qualityMetrics.searchQuality < 70) {
      suggestions.push({
        category: 'search',
        suggestion: 'Add more specific search terms related to the location',
        impact: 'medium'
      });
    }

    // Extraction optimization
    if (this.qualityMetrics.extractionQuality < 70) {
      suggestions.push({
        category: 'extraction',
        suggestion: 'Implement retry mechanism for failed URL extractions',
        impact: 'high'
      });
    }

    // Integration optimization
    if (this.qualityMetrics.integrationScore < 50) {
      suggestions.push({
        category: 'integration',
        suggestion: 'Enhance structured data extraction from content',
        impact: 'high'
      });
    }

    return suggestions;
  }
}

// Usage example and best practices
export const workflowUsageExample = {
  // Basic usage
  async basicUsage() {
    const workflow = new EnhancedItineraryWorkflowManager();
    
    workflow.initialize({
      onProgress: (step) => console.log(`Progress: ${step}`),
      onQualityUpdate: (metrics) => console.log(`Quality: ${metrics.overallScore}%`),
      onCompleted: (itinerary) => console.log('Completed!', itinerary.title),
      onError: (error) => console.error('Error:', error)
    });

    try {
      const itinerary = await workflow.generateItinerary(
        "Team building retreat for 40 people in Manali for 3 days. Budget ₹1.2 lakhs"
      );
      
      console.log('Generated itinerary:', itinerary);
      
      // Check quality
      const quality = workflow.assessDataQuality();
      console.log('Quality assessment:', quality);
      
      // Get optimization suggestions
      const suggestions = workflow.getOptimizationSuggestions();
      console.log('Optimization suggestions:', suggestions);
      
    } catch (error) {
      console.error('Generation failed:', error);
      
      // Diagnose issues
      const issues = workflow.diagnoseIssues();
      console.log('Diagnosed issues:', issues);
    } finally {
      workflow.stop();
    }
  },

  // Advanced usage with monitoring
  async advancedUsage() {
    const workflow = new EnhancedItineraryWorkflowManager();
    
    // Set up comprehensive monitoring
    workflow.initialize({
      onStateChange: (state, event) => {
        console.log(`State transition: ${event.type} -> ${state.value}`);
      },
      onProgress: (step) => {
        console.log(`[${new Date().toISOString()}] ${step}`);
      },
      onQualityUpdate: (metrics) => {
        console.log(`Quality Metrics:`, {
          search: `${metrics.searchQuality}%`,
          extraction: `${metrics.extractionQuality}%`,
          integration: `${metrics.integrationScore}%`,
          overall: `${metrics.overallScore}%`
        });
      },
      onCompleted: (itinerary) => {
        console.log(`✅ Completed: ${itinerary.title}`);
        console.log(`📊 Final integration score: ${itinerary.metadata?.dataIntegrationScore}%`);
      },
      onError: (error) => {
        console.error(`❌ Error in workflow:`, error);
      }
    });

    try {
      const itinerary = await workflow.generateItinerary(
        "Corporate conference for 100 people in Goa for 2 days focusing on innovation"
      );

      // Detailed quality assessment
      const assessment = workflow.assessDataQuality();
      console.log('📈 Detailed Quality Assessment:', assessment);

      // Check for issues
      const issues = workflow.diagnoseIssues();
      if (issues.length > 0) {
        console.warn('⚠️ Issues detected:', issues);
      }

      // Refine if needed
      if (assessment.overall.score < 70) {
        console.log('🔧 Quality below threshold, attempting refinement...');
        const refined = await workflow.refineItinerary(
          itinerary,
          "Add more specific venue details and local cultural activities"
        );
        console.log('✨ Refined itinerary generated');
      }

      return itinerary;
      
    } catch (error) {
      console.error('Advanced workflow failed:', error);
      throw error;
    } finally {
      workflow.stop();
    }
  }
};

// Export for easy integration
export {
  EnhancedItineraryWorkflowManager as default,
  enhancedItineraryMachine
};