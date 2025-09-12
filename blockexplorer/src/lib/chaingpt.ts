/**
 * ChainGPT API Service for AI-powered report review
 * Based on ChainGPT Web3 AI Chatbot & LLM API documentation
 */

export interface ChainGPTConfig {
  apiKey: string;
  baseUrl?: string;
}

export interface ChatRequest {
  model: string;
  question: string;
  chatHistory: 'on' | 'off';
  sdkUniqueId?: string;
  useCustomContext?: boolean;
  contextInjection?: {
    companyName?: string;
    companyDescription?: string;
    aiTone?: string;
    selectedTone?: string;
  };
}

export interface ChatResponse {
  status: boolean;
  data: {
    bot: string;
  };
}

export interface ReportReviewRequest {
  reportType: string;
  walletAddress: string;
  transactionHash?: string;
  description: string;
  evidenceImages?: number;
}

export interface ReportReviewResponse {
  severity: 'low' | 'medium' | 'high' | 'critical';
  riskScore: number;
  analysis: string;
  recommendations: string[];
  flaggedElements: string[];
  confidence: number;
  requiresManualReview: boolean;
  autoProcessingDecision: {
    canAutoProcess: boolean;
    reason: string;
    reviewerNotes?: string;
  };
}

export class ChainGPTService {
  private config: ChainGPTConfig;
  private baseUrl: string;

  constructor(config: ChainGPTConfig) {
    this.config = config;
    this.baseUrl = config.baseUrl || 'https://api.chaingpt.org';
  }

  /**
   * Send a chat request to ChainGPT API
   */
  private async sendChatRequest(request: ChatRequest): Promise<ChatResponse> {
    const response = await fetch(`${this.baseUrl}/chat/stream`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Invalid API key');
      }
      if (response.status === 402 || response.status === 403) {
        throw new Error('Insufficient credits');
      }
      throw new Error(`ChainGPT API error: ${response.status}`);
    }

    return await response.json();
  }

  /**
   * Analyze a report for potential fraud or suspicious activity
   */
  async reviewReport(reportData: ReportReviewRequest): Promise<ReportReviewResponse> {
    const contextPrompt = this.buildReportAnalysisPrompt(reportData);
    
    const chatRequest: ChatRequest = {
      model: 'general_assistant',
      question: contextPrompt,
      chatHistory: 'off',
      useCustomContext: true,
      contextInjection: {
        companyName: 'TOPAY Foundation',
        companyDescription: 'Blockchain security and fraud detection platform',
        aiTone: 'PRE_SET_TONE',
        selectedTone: 'PROFESSIONAL'
      }
    };

    try {
      const response = await this.sendChatRequest(chatRequest);
      return this.parseReviewResponse(response.data.bot);
    } catch (error) {
      console.error('ChainGPT review error:', error);
      throw new Error('Failed to analyze report with AI');
    }
  }

  /**
   * Build the analysis prompt for the report
   */
  private buildReportAnalysisPrompt(reportData: ReportReviewRequest): string {
    return `
As a Web3 security expert, analyze this fraud/scam report and provide a comprehensive security assessment, and determine if it requires manual review:

REPORT DETAILS:
- Type: ${reportData.reportType}
- Wallet Address: ${reportData.walletAddress}
- Transaction Hash: ${reportData.transactionHash || 'Not provided'}
- Description: ${reportData.description}
- Evidence Images: ${reportData.evidenceImages || 0} attached

Please provide your analysis in the following JSON format:
{
  "severity": "low|medium|high|critical",
  "riskScore": 0-100,
  "analysis": "Detailed analysis of the report",
  "recommendations": ["List of recommended actions"],
  "flaggedElements": ["Suspicious elements identified"],
  "confidence": 0-100,
  "requiresManualReview": true|false,
  "autoProcessingDecision": {
    "canAutoProcess": true|false,
    "reason": "explanation for decision",
    "reviewerNotes": "optional notes for human reviewers"
  }
}

Decision criteria for manual review:
- High severity (risk score >70) always requires manual review
- Low confidence (<60) requires manual review
- Complex fraud patterns or novel attack vectors require manual review
- Clear-cut cases with high confidence can be auto-processed
- Medium severity cases depend on confidence and evidence quality

Consider:
1. Wallet address patterns and known blacklists
2. Transaction behavior analysis
3. Report description credibility
4. Common fraud patterns in Web3
5. Evidence quality assessment

Provide only the JSON response without additional text.`;
  }

  /**
   * Parse the AI response into structured review data
   */
  private parseReviewResponse(aiResponse: string): ReportReviewResponse {
    try {
      // Extract JSON from the response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in AI response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      // Validate and sanitize the response
      return {
        severity: this.validateSeverity(parsed.severity),
        riskScore: Math.max(0, Math.min(100, parsed.riskScore || 0)),
        analysis: parsed.analysis || 'Analysis not available',
        recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
        flaggedElements: Array.isArray(parsed.flaggedElements) ? parsed.flaggedElements : [],
        confidence: Math.max(0, Math.min(100, parsed.confidence || 0)),
        requiresManualReview: parsed.requiresManualReview !== false,
        autoProcessingDecision: {
          canAutoProcess: parsed.autoProcessingDecision?.canAutoProcess || false,
          reason: parsed.autoProcessingDecision?.reason || 'Default manual review required',
          reviewerNotes: parsed.autoProcessingDecision?.reviewerNotes
        }
      };
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      // Return a fallback response
      return {
        severity: 'medium',
        riskScore: 50,
        analysis: 'Unable to parse AI analysis. Manual review recommended.',
        recommendations: ['Manual review required', 'Verify all provided information'],
        flaggedElements: ['AI parsing error'],
        confidence: 0,
        requiresManualReview: true,
        autoProcessingDecision: {
          canAutoProcess: false,
          reason: 'AI parsing error - manual review required for safety',
          reviewerNotes: 'AI response could not be parsed properly'
        }
      };
    }
  }

  /**
   * Validate severity level
   */
  private validateSeverity(severity: string): 'low' | 'medium' | 'high' | 'critical' {
    const validSeverities: ('low' | 'medium' | 'high' | 'critical')[] = ['low', 'medium', 'high', 'critical'];
    return validSeverities.includes(severity as 'low' | 'medium' | 'high' | 'critical') ? severity as 'low' | 'medium' | 'high' | 'critical' : 'medium';
  }

  /**
   * Check API health and credit balance
   */
  async checkHealth(): Promise<{ healthy: boolean; message: string }> {
    try {
      const testRequest: ChatRequest = {
        model: 'general_assistant',
        question: 'Hello, are you working?',
        chatHistory: 'off'
      };

      await this.sendChatRequest(testRequest);
      return { healthy: true, message: 'ChainGPT API is operational' };
    } catch (error) {
      return { 
        healthy: false, 
        message: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
}

// Export a singleton instance
let chainGPTInstance: ChainGPTService | null = null;

export function getChainGPTService(): ChainGPTService {
  if (!chainGPTInstance) {
    const apiKey = process.env.CHAINGPT_API_KEY;
    if (!apiKey) {
      throw new Error('CHAINGPT_API_KEY environment variable is required');
    }
    chainGPTInstance = new ChainGPTService({ apiKey });
  }
  return chainGPTInstance;
}

// Types are already exported above as interfaces