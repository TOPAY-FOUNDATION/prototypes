/**
 * ChainGPT API Service
 * Handles all interactions with the ChainGPT LLM API for the AI Assistant
 */

import axios from 'axios';

interface ChainGPTMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface SuggestedAction {
  id: string;
  text: string;
  action: string;
  icon?: string;
}

interface AIResponse {
  content: string;
  suggestions: SuggestedAction[];
}

class ChainGPTService {
  private apiKey: string;
  private apiUrl: string;
  private conversationHistory: ChainGPTMessage[] = [];

  constructor() {
    this.apiKey = process.env.NEXT_PUBLIC_CHAINGPT_API_KEY || '';
    this.apiUrl = process.env.NEXT_PUBLIC_CHAINGPT_API_URL || 'https://api.chaingpt.org';
    
    if (!this.apiKey) {
      console.warn('ChainGPT API key not found. AI Assistant will use fallback responses.');
    }

    // Initialize with system context
    this.conversationHistory = [{
      role: 'system',
      content: `You are TOPAY AI Assistant, an expert blockchain and cryptocurrency assistant specialized in the TOPAY ecosystem. 

TOPAY is a quantum-safe blockchain featuring:
- Native TPY tokens with 512-bit hashing (TOPAY-Z512)
- Fast transactions with minimal fees
- Quantum-resistant security
- Staking and governance capabilities
- New wallets receive 1000 TPY tokens automatically

Your capabilities include:
- Wallet operations and balance inquiries
- Transaction analysis and blockchain queries
- TOPAY ecosystem education and tokenomics
- Security best practices and guidance
- Technical support for blockchain interactions

Always provide accurate, helpful responses about blockchain technology, cryptocurrency, and the TOPAY ecosystem. Be concise but informative, and suggest relevant follow-up actions when appropriate.`
    }];
  }

  /**
   * Generate AI response using ChainGPT API
   */
  async generateResponse(userInput: string): Promise<AIResponse> {
    try {
      // Add user message to conversation history
      this.conversationHistory.push({
        role: 'user',
        content: userInput
      });

      // If API key is not available, use fallback
      if (!this.apiKey) {
        return this.getFallbackResponse(userInput);
      }

      const requestPayload = {
        model: "general_assistant",
        question: userInput,
        chatHistory: "off"
      };

      const response = await axios.post(
        `${this.apiUrl}/chat/stream`,
        requestPayload,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      // ChainGPT API returns plain text response
      const aiContent = response.data;
      
      if (typeof aiContent === 'string' && aiContent.trim()) {
        // Add AI response to conversation history
        this.conversationHistory.push({
          role: 'assistant',
          content: aiContent
        });

        return {
           content: aiContent,
           suggestions: this.generateSuggestions(userInput)
         };
      } else {
        throw new Error('Invalid response format from ChainGPT API');
      }
    } catch (error) {
      console.error('ChainGPT API Error:', error);
      
      // Remove the user message from history if API call failed
      if (this.conversationHistory.length > 0 && 
          this.conversationHistory[this.conversationHistory.length - 1].role === 'user') {
        this.conversationHistory.pop();
      }
      
      return this.getFallbackResponse(userInput);
    }
  }

  /**
   * Generate contextual suggestions based on user input and AI response
   */
  private generateSuggestions(userInput: string): SuggestedAction[] {
    const suggestions: SuggestedAction[] = [];
    const input = userInput.toLowerCase();
    
    // Wallet-related suggestions
    if (input.includes('balance') || input.includes('wallet')) {
      suggestions.push({
        id: 'check-balance',
        text: 'Check my balance',
        action: 'balance',
        icon: '💰'
      });
    }
    
    // Transaction suggestions
    if (input.includes('send') || input.includes('transfer') || input.includes('transaction')) {
      suggestions.push({
        id: 'send-tokens',
        text: 'Send tokens',
        action: 'send',
        icon: '📤'
      });
    }
    
    // Security suggestions
    if (input.includes('security') || input.includes('safe') || input.includes('protect')) {
      suggestions.push({
        id: 'security-tips',
        text: 'Security best practices',
        action: 'security',
        icon: '🔒'
      });
    }
    
    // TOPAY ecosystem suggestions
    if (input.includes('topay') || input.includes('tpy') || input.includes('staking')) {
      suggestions.push({
        id: 'learn-topay',
        text: 'Learn about TOPAY',
        action: 'learn',
        icon: '📚'
      });
    }
    
    // Default suggestions if none match
    if (suggestions.length === 0) {
      suggestions.push(
        {
          id: 'wallet-help',
          text: 'Wallet help',
          action: 'help',
          icon: '❓'
        },
        {
          id: 'topay-info',
          text: 'About TOPAY',
          action: 'info',
          icon: 'ℹ️'
        }
      );
    }
    
    return suggestions.slice(0, 3); // Limit to 3 suggestions
  }

  /**
   * Provide fallback responses when ChainGPT API is unavailable
   */
  private getFallbackResponse(userInput: string): AIResponse {
    const input = userInput.toLowerCase();
    let content = '';
    let suggestions: SuggestedAction[] = [];

    if (input.includes('balance') || input.includes('wallet')) {
      content = "I can help you check your wallet balance. Your current balance and token information are displayed in the wallet interface above.";
      suggestions = [
        { id: 'refresh', text: 'Refresh balance', action: 'refresh', icon: '🔄' },
        { id: 'transactions', text: 'View transactions', action: 'transactions', icon: '📋' }
      ];
    } else if (input.includes('send') || input.includes('transfer')) {
      content = "To send tokens, you'll need to specify the recipient address and amount. Make sure you have sufficient balance for the transaction and network fees.";
      suggestions = [
        { id: 'send-form', text: 'Open send form', action: 'send', icon: '📤' },
        { id: 'check-balance', text: 'Check balance first', action: 'balance', icon: '💰' }
      ];
    } else if (input.includes('topay') || input.includes('tpy')) {
      content = "TOPAY is a quantum-safe blockchain with native TPY tokens. It features 512-bit hashing (TOPAY-Z512), fast transactions, and quantum-resistant security. New wallets automatically receive 1000 TPY tokens.";
      suggestions = [
        { id: 'staking', text: 'Learn about staking', action: 'staking', icon: '🏦' },
        { id: 'tokenomics', text: 'TOPAY tokenomics', action: 'tokenomics', icon: '📊' }
      ];
    } else if (input.includes('security') || input.includes('safe')) {
      content = "Security best practices: Never share your private keys, always verify transaction details, use secure networks, and keep your wallet software updated.";
      suggestions = [
        { id: 'backup', text: 'Backup wallet', action: 'backup', icon: '💾' },
        { id: 'security-guide', text: 'Security guide', action: 'security', icon: '🔒' }
      ];
    } else {
      content = "Hello! I'm your TOPAY AI Assistant. I can help you with wallet operations, blockchain queries, and TOPAY ecosystem information. What would you like to know?";
      suggestions = [
        { id: 'wallet-help', text: 'Wallet help', action: 'help', icon: '❓' },
        { id: 'topay-info', text: 'About TOPAY', action: 'info', icon: 'ℹ️' },
        { id: 'get-started', text: 'Getting started', action: 'start', icon: '🚀' }
      ];
    }

    return { content, suggestions };
  }

  /**
   * Clear conversation history
   */
  clearHistory(): void {
    this.conversationHistory = [this.conversationHistory[0]]; // Keep only system message
  }

  /**
   * Check if ChainGPT API is available
   */
  isApiAvailable(): boolean {
    return !!this.apiKey;
  }

  /**
   * Check if API is configured (alias for isApiAvailable for backward compatibility)
   */
  isConfigured(): boolean {
    return this.isApiAvailable();
  }
}

// Export singleton instance
export const chainGPTService = new ChainGPTService();
export default chainGPTService;