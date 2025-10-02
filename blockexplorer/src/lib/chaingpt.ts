/**
 * ChainGPT API Service for AI-powered report review
 * Based on ChainGPT Web3 AI Chatbot & LLM API documentation
 */

export interface ChainGPTConfig {
  apiKey: string;
  baseUrl?: string;
  openaiApiKey?: string;
  openaiBaseUrl?: string;
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
  imageFiles?: File[];
  imageUrls?: string[];
}

export interface SecurityAction {
  action: 'block' | 'restrict' | 'monitor' | 'none';
  severity: 'low' | 'medium' | 'high' | 'critical';
  reason: string;
  duration?: number; // in hours, undefined for permanent
  restrictions?: string[];
}

export interface AutomatedAnalysisResult {
  isLegitimate: boolean;
  confidence: number;
  riskScore: number;
  recommendedAction: SecurityAction;
  analysisDetails: string;
  flaggedElements: string[];
  requiresHumanReview: boolean;
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
  automatedAnalysis?: AutomatedAnalysisResult;
}

export class ChainGPTService {
  private config: ChainGPTConfig;
  private baseUrl: string;
  private openaiApiKey?: string;
  private openaiBaseUrl: string;

  constructor(config: ChainGPTConfig) {
    this.config = config;
    this.baseUrl = config.baseUrl || process.env.NEXT_PUBLIC_CHAINGPT_API_URL || 'https://api.chaingpt.org';
    this.openaiApiKey = config.openaiApiKey || process.env.OPENAI_API_KEY;
    this.openaiBaseUrl = config.openaiBaseUrl || 'https://api.openai.com/v1';
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
   * Analyze images using OpenAI Vision API
   */
  private async analyzeImages(imageUrls: string[]): Promise<string> {
    if (!this.openaiApiKey || imageUrls.length === 0) {
      return 'No images provided or OpenAI API key not configured.';
    }

    try {
      const messages = [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Analyze these images for potential fraud, scam, or security evidence. Look for suspicious elements, fake interfaces, phishing attempts, or any security-related concerns. Provide a detailed analysis of what you see.'
            },
            ...imageUrls.map(url => ({
              type: 'image_url',
              image_url: { url, detail: 'high' }
            }))
          ]
        }
      ];

      const response = await fetch(`${this.openaiBaseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages,
          max_tokens: 1000,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0]?.message?.content || 'Unable to analyze images.';
    } catch (error) {
      console.error('Image analysis error:', error);
      return 'Error analyzing images. Manual review recommended.';
    }
  }

  /**
   * Convert File objects to base64 data URLs
   */
  private async convertFilesToDataUrls(files: File[]): Promise<string[]> {
    const dataUrls: string[] = [];
    
    for (const file of files) {
      try {
        const base64 = await this.fileToBase64(file);
        dataUrls.push(`data:${file.type};base64,${base64}`);
      } catch (error) {
        console.error('Error converting file to base64:', error);
      }
    }
    
    return dataUrls;
  }

  /**
   * Convert File to base64 string
   */
  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  }

  /**
   * Perform automated analysis and determine security actions
   */
  async performAutomatedAnalysis(reportData: ReportReviewRequest): Promise<AutomatedAnalysisResult> {
    try {
      // Get the standard review first
      const review = await this.reviewReport(reportData);
      
      // Determine if report is legitimate based on AI analysis
      const isLegitimate = this.assessReportLegitimacy(review, reportData);
      
      // Calculate confidence based on multiple factors
      const confidence = this.calculateAnalysisConfidence(review, reportData);
      
      // Determine recommended security action
      const recommendedAction = this.determineSecurityAction(review, isLegitimate, confidence);
      
      return {
        isLegitimate,
        confidence,
        riskScore: review.riskScore,
        recommendedAction,
        analysisDetails: review.analysis,
        flaggedElements: review.flaggedElements,
        requiresHumanReview: review.requiresManualReview || confidence < 80
      };
    } catch (error) {
      console.error('Automated analysis error:', error);
      // Return safe defaults on error
      return {
        isLegitimate: false,
        confidence: 0,
        riskScore: 100,
        recommendedAction: {
          action: 'monitor',
          severity: 'high',
          reason: 'Analysis failed - manual review required',
          restrictions: ['All transactions require manual approval']
        },
        analysisDetails: 'Automated analysis failed. Manual review required.',
        flaggedElements: ['Analysis system error'],
        requiresHumanReview: true
      };
    }
  }

  /**
   * Assess if a report appears legitimate based on AI analysis
   */
  private assessReportLegitimacy(review: ReportReviewResponse, reportData: ReportReviewRequest): boolean {
    // Check for indicators of false reports
    const falseReportIndicators = [
      review.confidence < 60,
      review.riskScore < 30 && reportData.description.length < 50,
      review.flaggedElements.length === 0 && review.riskScore > 70,
      // Add more sophisticated checks
    ];

    const legitimateIndicators = [
      review.confidence > 80,
      review.riskScore > 60,
      review.flaggedElements.length > 0,
      reportData.imageFiles && reportData.imageFiles.length > 0,
      reportData.description.length > 100
    ];

    const falseCount = falseReportIndicators.filter(Boolean).length;
    const legitimateCount = legitimateIndicators.filter(Boolean).length;

    return legitimateCount > falseCount && review.confidence > 70;
  }

  /**
   * Calculate confidence in the analysis
   */
  private calculateAnalysisConfidence(review: ReportReviewResponse, reportData: ReportReviewRequest): number {
    let confidence = review.confidence;

    // Boost confidence for reports with evidence
    if (reportData.imageFiles && reportData.imageFiles.length > 0) {
      confidence += 10;
    }

    // Boost confidence for detailed descriptions
    if (reportData.description.length > 200) {
      confidence += 5;
    }

    // Reduce confidence for inconsistencies
    if (review.riskScore > 80 && review.confidence < 70) {
      confidence -= 15;
    }

    return Math.min(100, Math.max(0, confidence));
  }

  /**
   * Determine appropriate security action based on analysis
   */
  private determineSecurityAction(
    review: ReportReviewResponse, 
    isLegitimate: boolean, 
    confidence: number
  ): SecurityAction {
    if (!isLegitimate || confidence < 60) {
      return {
        action: 'monitor',
        severity: 'low',
        reason: 'Report appears questionable or low confidence - monitoring only',
        duration: 24,
        restrictions: ['Enhanced monitoring enabled']
      };
    }

    // Determine action based on risk score and confidence
    if (review.riskScore >= 90 && confidence >= 90) {
      return {
        action: 'block',
        severity: 'critical',
        reason: 'High-confidence critical threat detected',
        restrictions: ['All transactions blocked', 'Account frozen']
      };
    }

    if (review.riskScore >= 70 && confidence >= 80) {
      return {
        action: 'restrict',
        severity: 'high',
        reason: 'High-risk activity detected with good confidence',
        duration: 72,
        restrictions: [
          'Transaction limits: max 0.1 TOPAY per hour',
          'Manual approval required for transactions > 0.01 TOPAY',
          'Enhanced KYC verification required'
        ]
      };
    }

    if (review.riskScore >= 50 && confidence >= 70) {
      return {
        action: 'restrict',
        severity: 'medium',
        reason: 'Moderate risk detected - implementing precautionary restrictions',
        duration: 48,
        restrictions: [
          'Transaction limits: max 1 TOPAY per hour',
          'Manual approval for large transactions'
        ]
      };
    }

    return {
      action: 'monitor',
      severity: 'low',
      reason: 'Low to moderate risk - enhanced monitoring enabled',
      duration: 24,
      restrictions: ['Enhanced transaction monitoring']
    };
  }

  /**
   * Execute security action on the blockchain
   */
  async executeSecurityAction(walletAddress: string, action: SecurityAction): Promise<boolean> {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BLOCKCHAIN_API_URL}/security/enforce`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`
        },
        body: JSON.stringify({
          walletAddress,
          action: action.action,
          severity: action.severity,
          reason: action.reason,
          duration: action.duration,
          restrictions: action.restrictions,
          timestamp: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error(`Security action failed: ${response.status}`);
      }

      const result = await response.json();
      return result.success === true;
    } catch (error) {
      console.error('Failed to execute security action:', error);
      return false;
    }
  }

  /**
   * Analyze report and execute security measures automatically
   */
  async analyzeAndEnforce(reportData: ReportReviewRequest): Promise<{
    analysis: AutomatedAnalysisResult;
    actionExecuted: boolean;
    message: string;
  }> {
    try {
      // Perform automated analysis
      const analysis = await this.performAutomatedAnalysis(reportData);
      
      // If report is questionable, return for user verification
      if (!analysis.isLegitimate || analysis.confidence < 70) {
        return {
          analysis,
          actionExecuted: false,
          message: `Report appears questionable (confidence: ${analysis.confidence}%). Please verify the accuracy of this report before proceeding with security measures.`
        };
      }

      // If legitimate and high confidence, execute security action
      const walletAddress = reportData.walletAddress;
      const actionExecuted = await this.executeSecurityAction(walletAddress, analysis.recommendedAction);

      if (actionExecuted) {
        return {
          analysis,
          actionExecuted: true,
          message: `Security measures implemented successfully. Wallet ${walletAddress} has been ${analysis.recommendedAction.action}ed based on ${analysis.recommendedAction.severity} severity threat detection.`
        };
      } else {
        return {
          analysis,
          actionExecuted: false,
          message: `Analysis completed but failed to execute security action. Manual intervention required for wallet ${walletAddress}.`
        };
      }
    } catch (error) {
      console.error('Analyze and enforce error:', error);
      return {
        analysis: {
          isLegitimate: false,
          confidence: 0,
          riskScore: 100,
          recommendedAction: {
            action: 'monitor',
            severity: 'high',
            reason: 'System error - manual review required'
          },
          analysisDetails: 'System error occurred during analysis',
          flaggedElements: ['System error'],
          requiresHumanReview: true
        },
        actionExecuted: false,
        message: 'System error occurred. Manual review and action required.'
      };
    }
  }
  async reviewReport(reportData: ReportReviewRequest): Promise<ReportReviewResponse> {
    // Analyze images if provided
    let imageAnalysis = '';
    if (reportData.imageFiles && reportData.imageFiles.length > 0) {
      const imageUrls = await this.convertFilesToDataUrls(reportData.imageFiles);
      imageAnalysis = await this.analyzeImages(imageUrls);
    } else if (reportData.imageUrls && reportData.imageUrls.length > 0) {
      imageAnalysis = await this.analyzeImages(reportData.imageUrls);
    }

    const contextPrompt = this.buildReportAnalysisPrompt(reportData, imageAnalysis);
    
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
  private buildReportAnalysisPrompt(reportData: ReportReviewRequest, imageAnalysis?: string): string {
    return `
As a Web3 security expert, analyze this fraud/scam report and provide a comprehensive security assessment, and determine if it requires manual review:

REPORT DETAILS:
- Type: ${reportData.reportType}
- Wallet Address: ${reportData.walletAddress}
- Transaction Hash: ${reportData.transactionHash || 'Not provided'}
- Description: ${reportData.description}
- Evidence Images: ${reportData.evidenceImages || 0} attached

${imageAnalysis ? `
IMAGE ANALYSIS RESULTS:
${imageAnalysis}

Please incorporate the image analysis findings into your security assessment.
` : ''}

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