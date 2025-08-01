'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, Clock, FileText, Plus, Edit, CheckCircle } from 'lucide-react';
import styles from './CustomerSupport.module.css';

interface CustomerSupportProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  caseId?: string;
}

interface SupportCase {
  id: string;
  title: string;
  description: string;
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
  createdAt: Date;
  updatedAt: Date;
  messages: Message[];
  aiSuggestions?: string[];
}

interface CaseData {
  title: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

interface SavedCaseData {
  id: string;
  title: string;
  description: string;
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
  createdAt: string;
  updatedAt: string;
  messages: Array<{
    id: string;
    text: string;
    isUser: boolean;
    timestamp: string;
    caseId?: string;
  }>;
  aiSuggestions?: string[];
}

export default function CustomerSupport({ isOpen, onClose }: CustomerSupportProps) {
  const [activeTab, setActiveTab] = useState<'chat' | 'cases'>('chat');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hello! I\'m your enhanced AI support assistant for TOPAY wallet. I can help you with questions, create support cases, and manage your support tickets. How can I assist you today?',
      isUser: false,
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [supportCases, setSupportCases] = useState<SupportCase[]>([]);
  const [currentCase, setCurrentCase] = useState<SupportCase | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const savedCases = localStorage.getItem('topay-support-cases');
    if (savedCases) {
      try {
        const parsedData = JSON.parse(savedCases);
        if (Array.isArray(parsedData)) {
          const parsedCases = parsedData.map((caseData: SavedCaseData) => ({
            ...caseData,
            createdAt: new Date(caseData.createdAt),
            updatedAt: new Date(caseData.updatedAt),
            messages: Array.isArray(caseData.messages) 
              ? caseData.messages.map((msg) => ({
                  ...msg,
                  timestamp: new Date(msg.timestamp)
                }))
              : []
          }));
          setSupportCases(parsedCases);
        }
      } catch (err) {
        console.error('Error parsing support cases:', err);
        localStorage.removeItem('topay-support-cases');
      }
    }
  }, []);

  useEffect(() => {
    if (supportCases.length > 0) {
      localStorage.setItem('topay-support-cases', JSON.stringify(supportCases));
    }
  }, [supportCases]);

  const createSupportCase = (title: string, description: string, category: string, priority: 'low' | 'medium' | 'high' | 'urgent') => {
    const newCase: SupportCase = {
      id: `case-${Date.now()}`,
      title,
      description,
      status: 'open',
      priority,
      category,
      createdAt: new Date(),
      updatedAt: new Date(),
      messages: [],
      aiSuggestions: generateAISuggestions(category)
    };

    setSupportCases(prev => [newCase, ...prev]);
    setCurrentCase(newCase);
    return newCase;
  };

  const updateCaseStatus = (caseId: string, status: SupportCase['status']) => {
    setSupportCases(prev => prev.map(case_ => 
      case_.id === caseId 
        ? { ...case_, status, updatedAt: new Date() }
        : case_
    ));
  };

  const generateAISuggestions = (category: string): string[] => {
    const suggestions: Record<string, string[]> = {
      wallet: [
        "Check if your wallet is properly synced with the blockchain",
        "Verify your backup phrase is stored securely",
        "Ensure you're using the latest wallet version"
      ],
      transaction: [
        "Verify the recipient address is correct",
        "Check if you have sufficient balance for gas fees",
        "Monitor transaction status on the blockchain explorer"
      ],
      security: [
        "Enable two-factor authentication if available",
        "Never share your private keys or seed phrase",
        "Use hardware wallets for large amounts"
      ],
      technical: [
        "Clear your browser cache and cookies",
        "Try using a different browser or device",
        "Check your internet connection stability"
      ]
    };

    return suggestions[category] || suggestions.technical;
  };

  // Intelligent case creation logic
  const shouldCreateSupportCase = (lowerMessage: string): boolean => {
    // Simple questions that should NOT create cases (just provide tips)
    const simpleQuestions = [
      'how to create wallet', 'how to backup', 'what is seed phrase', 'how to send', 'how to receive',
      'what are fees', 'how does topay work', 'what is quantum security', 'how to import wallet',
      'what is blockchain', 'how to check balance', 'what is private key', 'how to restore wallet'
    ];
    
    // If it's a simple "how to" question, don't create a case
    if (simpleQuestions.some(q => lowerMessage.includes(q))) {
      return false;
    }
    
    // General help requests that should NOT create cases
    const generalHelp = ['help', 'support', 'assistance', 'guide', 'tutorial', 'explain', 'what is', 'how does', 'how to'];
    const isGeneralHelp = generalHelp.some(term => lowerMessage.includes(term)) && 
                         !lowerMessage.includes('problem') && 
                         !lowerMessage.includes('issue') && 
                         !lowerMessage.includes('error') &&
                         !lowerMessage.includes('not working') &&
                         !lowerMessage.includes('failed');
    
    if (isGeneralHelp) {
      return false;
    }
    
    // Actual problems that SHOULD create cases
    const problemIndicators = [
      'not working', 'failed', 'error', 'bug', 'broken', 'stuck', 'cant send', "can't send", 
      'cant receive', "can't receive", 'transaction failed', 'balance wrong', 'missing funds',
      'wallet locked', 'cant access', "can't access", 'lost wallet', 'forgot password',
      'hacked', 'stolen', 'compromised', 'unauthorized transaction', 'wrong amount',
      'transaction pending too long', 'app crashed', 'wont load', "won't load"
    ];
    
    // Security issues that definitely need cases
    const securityIssues = [
      'hacked', 'stolen', 'compromised', 'unauthorized', 'suspicious activity', 
      'unknown transaction', 'account breach', 'security concern'
    ];
    
    // Technical failures that need cases
    const technicalFailures = [
      'app crashed', 'wont start', "won't start", 'freezing', 'slow', 'unresponsive',
      'connection error', 'sync failed', 'backup failed', 'restore failed'
    ];
    
    return problemIndicators.some(indicator => lowerMessage.includes(indicator)) ||
           securityIssues.some(issue => lowerMessage.includes(issue)) ||
           technicalFailures.some(failure => lowerMessage.includes(failure));
  };

  const getEnhancedAIResponse = async (message: string): Promise<{ response: string; shouldCreateCase?: boolean; caseData?: CaseData }> => {
    const lowerMessage = message.toLowerCase();
    
    // More intelligent case creation logic
    const shouldCreateCase = shouldCreateSupportCase(lowerMessage);

    try {
      // Call the ChainGPT API for intelligent responses
      const response = await fetch('/api/chaingpt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: `As a TOPAY wallet support assistant, please help with: ${message}`,
          chatHistory: messages.slice(-5) // Include last 5 messages for context
        }),
      });

      const data = await response.json();
      
      if (data.fallback) {
        // If ChainGPT API fails, use fallback responses
        return { response: generateContextualResponse(message) };
      }

      let aiResponse = data.response || generateContextualResponse(message);

      if (shouldCreateCase) {
        let category = 'technical';
        let priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium';

        // Categorize based on content
        if (lowerMessage.includes('wallet') || lowerMessage.includes('balance') || lowerMessage.includes('address')) {
          category = 'wallet';
        } else if (lowerMessage.includes('transaction') || lowerMessage.includes('send') || lowerMessage.includes('receive') || lowerMessage.includes('transfer')) {
          category = 'transaction';
        } else if (lowerMessage.includes('security') || lowerMessage.includes('hack') || lowerMessage.includes('stolen') || lowerMessage.includes('compromised')) {
          category = 'security';
          priority = 'urgent';
        } else if (lowerMessage.includes('backup') || lowerMessage.includes('recovery') || lowerMessage.includes('seed')) {
          category = 'backup';
          priority = 'high';
        }

        // Adjust priority based on urgency indicators
        if (lowerMessage.includes('urgent') || lowerMessage.includes('emergency') || lowerMessage.includes('immediately')) {
          priority = 'urgent';
        } else if (lowerMessage.includes('important') || lowerMessage.includes('asap') || lowerMessage.includes('quickly')) {
          priority = 'high';
        } else if (lowerMessage.includes('when possible') || lowerMessage.includes('no rush')) {
          priority = 'low';
        }

        const title = extractCaseTitle(message);
        
        // Enhance AI response to mention case creation
        aiResponse = `I understand you're experiencing a technical issue that needs tracking. I've created support case "${title}" to ensure this gets properly resolved. ${aiResponse}`;
        
        return {
          response: aiResponse,
          shouldCreateCase: true,
          caseData: { title, description: message, category, priority }
        };
      }

      // For non-case messages, provide helpful tips without creating a case
      return { response: aiResponse };

    } catch (error) {
      console.error('AI Response Error:', error);
      
      // Fallback to local responses if API fails
      if (shouldCreateCase) {
        let category = 'technical';
        let priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium';

        if (lowerMessage.includes('wallet') || lowerMessage.includes('balance')) {
          category = 'wallet';
        } else if (lowerMessage.includes('transaction') || lowerMessage.includes('send') || lowerMessage.includes('receive')) {
          category = 'transaction';
        } else if (lowerMessage.includes('security') || lowerMessage.includes('hack') || lowerMessage.includes('stolen')) {
          category = 'security';
          priority = 'urgent';
        }

        if (lowerMessage.includes('urgent') || lowerMessage.includes('emergency')) {
          priority = 'urgent';
        } else if (lowerMessage.includes('important')) {
          priority = 'high';
        }

        const title = extractCaseTitle(message);
        
        return {
          response: `I understand you're experiencing a technical issue that needs tracking. I've created support case "${title}" to ensure this gets properly resolved. Let me help you step by step.`,
          shouldCreateCase: true,
          caseData: { title, description: message, category, priority }
        };
      }

      // For simple questions, just provide helpful responses without creating cases
      return { response: generateContextualResponse(message) };
    }
  };

  const extractCaseTitle = (message: string): string => {
    const words = message.split(' ').slice(0, 8);
    return words.join(' ') + (message.split(' ').length > 8 ? '...' : '');
  };

  const generateContextualResponse = (message: string): string => {
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('quantum') || lowerMessage.includes('security')) {
      return "TOPAY wallet uses quantum-safe encryption to protect your assets. Our advanced cryptographic protocols ensure your funds remain secure even against future quantum computing threats. This includes post-quantum cryptography algorithms that are resistant to both classical and quantum attacks.";
    }

    if (lowerMessage.includes('backup') || lowerMessage.includes('seed') || lowerMessage.includes('recovery')) {
      return "Your wallet backup is crucial for security. Always store your 12-24 word seed phrase in a secure, offline location. Never share it with anyone or store it digitally. Consider using a hardware wallet or writing it down on paper and storing it in a safe place. You can also create multiple copies stored in different secure locations.";
    }

    if (lowerMessage.includes('transaction') || lowerMessage.includes('send') || lowerMessage.includes('receive')) {
      return "TOPAY transactions are processed on our ethical blockchain with full transparency. You can track any transaction using our built-in explorer. Transaction fees are minimal and clearly displayed before confirmation. Is there a specific transaction you need help with?";
    }

    if (lowerMessage.includes('fee') || lowerMessage.includes('cost')) {
      return "TOPAY operates on an interest-free model with transparent, minimal fees. All costs are clearly displayed before any transaction. We believe in ethical finance with no hidden charges. Network fees help maintain blockchain security and are kept as low as possible.";
    }

    if (lowerMessage.includes('wallet') && (lowerMessage.includes('create') || lowerMessage.includes('new'))) {
      return "Creating a new TOPAY wallet is simple and secure. Click 'Generate New Wallet' in the main interface. Make sure to securely backup your seed phrase immediately after creation. Never share your private keys or seed phrase with anyone.";
    }

    if (lowerMessage.includes('balance') || lowerMessage.includes('funds')) {
      return "Your wallet balance shows all available TOPAY tokens. Balances are updated in real-time as transactions are confirmed on the blockchain. If you're experiencing balance display issues, try refreshing the wallet or checking your internet connection.";
    }

    if (lowerMessage.includes('import') || lowerMessage.includes('restore')) {
      return "You can import an existing wallet using your seed phrase or private key. Go to 'Import Wallet' and enter your credentials securely. Make sure you're on the official TOPAY wallet interface and never enter your seed phrase on suspicious websites.";
    }

    if (lowerMessage.includes('support') || lowerMessage.includes('help')) {
      return "I'm here to provide comprehensive support for your TOPAY wallet. I can help with transactions, security questions, backup procedures, technical issues, and general wallet management. Feel free to ask specific questions! 💡 **Tip**: I automatically create support cases only for actual technical problems that need tracking (like errors, failures, or security issues) - not for general questions.";
    }

    if (lowerMessage.includes('case') || lowerMessage.includes('ticket')) {
      return "Support cases are automatically created when you report actual technical problems, errors, or security issues that need tracking and resolution. For general questions and 'how-to' guidance, I provide immediate help without creating a case. This keeps your case list focused on real issues that need follow-up.";
    }

    return "I'm here to help with any TOPAY wallet questions. You can ask about transactions, security, backup procedures, wallet creation, importing wallets, fees, or any technical issues you're experiencing. For complex problems, I can create a support case to ensure proper tracking and resolution.";
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputMessage,
      isUser: true,
      timestamp: new Date(),
      caseId: currentCase?.id
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const aiResponse = await getEnhancedAIResponse(inputMessage);
      
      if (aiResponse.shouldCreateCase && aiResponse.caseData) {
        const newCase = createSupportCase(
          aiResponse.caseData.title,
          aiResponse.caseData.description,
          aiResponse.caseData.category,
          aiResponse.caseData.priority
        );
        
        userMessage.caseId = newCase.id;
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: aiResponse.response,
        isUser: false,
        timestamp: new Date(),
        caseId: currentCase?.id || (aiResponse.shouldCreateCase ? aiResponse.caseData?.title : undefined)
      };

      setMessages(prev => [...prev, assistantMessage]);

      if (currentCase) {
        setSupportCases(prev => prev.map(case_ => 
          case_.id === currentCase.id 
            ? { ...case_, messages: [...case_.messages, userMessage, assistantMessage], updatedAt: new Date() }
            : case_
        ));
      }

    } catch {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'I apologize, but I encountered an error. Please try again or contact our support team if the issue persists.',
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickQuestion = async (question: string) => {
    if (isLoading) return; // Prevent multiple clicks while processing

    const userMessage: Message = {
      id: Date.now().toString(),
      text: question,
      isUser: true,
      timestamp: new Date(),
      caseId: currentCase?.id
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const aiResponse = await getEnhancedAIResponse(question);
      
      if (aiResponse.shouldCreateCase && aiResponse.caseData) {
        const newCase = createSupportCase(
          aiResponse.caseData.title,
          aiResponse.caseData.description,
          aiResponse.caseData.category,
          aiResponse.caseData.priority
        );
        
        userMessage.caseId = newCase.id;
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: aiResponse.response,
        isUser: false,
        timestamp: new Date(),
        caseId: currentCase?.id || (aiResponse.shouldCreateCase ? aiResponse.caseData?.title : undefined)
      };

      setMessages(prev => [...prev, assistantMessage]);

      if (currentCase) {
        setSupportCases(prev => prev.map(case_ => 
          case_.id === currentCase.id 
            ? { ...case_, messages: [...case_.messages, userMessage, assistantMessage], updatedAt: new Date() }
            : case_
        ));
      }

    } catch {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'I apologize, but I encountered an error. Please try again or contact our support team if the issue persists.',
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return '#ff4757';
      case 'high': return '#ff6b35';
      case 'medium': return '#ffa502';
      case 'low': return '#26de81';
      default: return '#ffa502';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return '#3742fa';
      case 'in-progress': return '#ffa502';
      case 'resolved': return '#26de81';
      case 'closed': return '#747d8c';
      default: return '#3742fa';
    }
  };

  const quickQuestions = [
    "How do I create a new wallet?",
    "How do I send TOPAY tokens?",
    "How do I backup my seed phrase?",
    "What are the transaction fees?",
    "How do I import an existing wallet?",
    "How secure is quantum encryption?"
  ];

  if (!isOpen) return null;

  return (
    <div className={styles.supportOverlay} onClick={onClose}>
      <div className={styles.supportPopup} onClick={(e) => e.stopPropagation()}>
        <div className={styles.supportHeader}>
          <div>
            <h2 className={styles.supportTitle}>TOPAY Support</h2>
            <p className={styles.supportSubtitle}>AI-Powered Customer Assistance</p>
          </div>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </div>

        <div className={styles.supportNav}>
          <button 
            className={`${styles.supportNavButton} ${activeTab === 'chat' ? styles.active : ''}`}
            onClick={() => setActiveTab('chat')}
          >
            <Bot size={16} />
            Chat Support
          </button>
          <button 
            className={`${styles.supportNavButton} ${activeTab === 'cases' ? styles.active : ''}`}
            onClick={() => setActiveTab('cases')}
          >
            <FileText size={16} />
            Support Cases ({supportCases.length})
          </button>
        </div>

        <div className={styles.supportContent}>
          {currentCase && (
            <div className={styles.currentCaseIndicator}>
              <FileText size={14} />
              <span>Active Case: {currentCase.title}</span>
              <div className={styles.caseTag} style={{ backgroundColor: getPriorityColor(currentCase.priority) }}>
                {currentCase.priority}
              </div>
              <button 
                className={styles.closeCaseButton}
                onClick={() => setCurrentCase(null)}
                title="Close case view"
              >
                ×
              </button>
            </div>
          )}

          {activeTab === 'chat' && (
            <div className={styles.chatContainer}>
              <div className={styles.messagesContainer}>
                {messages.map((message) => (
                  <div key={message.id} className={`${styles.message} ${message.isUser ? styles.userMessage : styles.assistantMessage}`}>
                    <div className={styles.messageContent}>
                      <p>{message.text}</p>
                      <span className={styles.timestamp}>
                        {message.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className={`${styles.message} ${styles.assistantMessage}`}>
                    <div className={styles.messageContent}>
                      <div className={styles.loadingDots}>
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className={styles.quickActions}>
                {quickQuestions.map((question, index) => (
                  <button
                    key={index}
                    className={styles.quickActionButton}
                    onClick={() => handleQuickQuestion(question)}
                    disabled={isLoading}
                    style={{ 
                      opacity: isLoading ? 0.6 : 1,
                      cursor: isLoading ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {question}
                  </button>
                ))}
              </div>

              <div className={styles.inputContainer}>
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Type your message..."
                  className={styles.messageInput}
                  disabled={isLoading}
                />
                <button 
                  onClick={handleSendMessage} 
                  className={styles.sendButton}
                  disabled={isLoading || !inputMessage.trim()}
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          )}

          {activeTab === 'cases' && (
            <div className={styles.casesContainer}>
              <div className={styles.casesHeader}>
                <h3>Support Cases</h3>
                <button 
                  className={styles.newCaseButton}
                  onClick={() => {
                    const title = prompt('Enter case title:');
                    const description = prompt('Enter case description:');
                    if (title && description) {
                      createSupportCase(title, description, 'general', 'medium');
                    }
                  }}
                >
                  <Plus size={16} />
                  New Case
                </button>
              </div>

              {supportCases.length === 0 ? (
                <div className={styles.noCases}>
                  <FileText size={48} />
                  <h4>No Support Cases</h4>
                  <p>You haven&apos;t created any support cases yet.</p>
                  <button 
                    className={styles.createFirstCaseButton}
                    onClick={() => setActiveTab('chat')}
                  >
                    Start Chat to Create Case
                  </button>
                </div>
              ) : (
                <div className={styles.casesList}>
                  {supportCases.map((case_) => (
                    <div key={case_.id} className={styles.caseCard}>
                      <div className={styles.caseHeader}>
                        <div className={styles.caseTitle}>
                          <h4>{case_.title}</h4>
                          <div className={styles.caseActions}>
                            <button 
                              className={styles.caseActionButton}
                              onClick={() => {
                                setCurrentCase(case_);
                                setActiveTab('chat');
                              }}
                              title="Continue in chat"
                            >
                              <Edit size={14} />
                            </button>
                            <button 
                              className={styles.caseActionButton}
                              onClick={() => updateCaseStatus(case_.id, 'resolved')}
                              title="Mark as resolved"
                            >
                              <CheckCircle size={14} />
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className={styles.caseInfo}>
                        <div className={styles.caseMetadata}>
                          <span className={styles.caseId}>#{case_.id.slice(-6)}</span>
                          <div className={styles.casePriority} style={{ backgroundColor: getPriorityColor(case_.priority) }}>
                            {case_.priority}
                          </div>
                          <div className={styles.caseStatus} style={{ backgroundColor: getStatusColor(case_.status) }}>
                            {case_.status}
                          </div>
                        </div>
                        
                        <p className={styles.caseDescription}>{case_.description}</p>
                        
                        <div className={styles.caseDetails}>
                          <span><Clock size={12} /> Created: {case_.createdAt.toLocaleDateString()}</span>
                          <span>Category: {case_.category}</span>
                          <span>Messages: {case_.messages.length}</span>
                        </div>

                        {case_.aiSuggestions && case_.aiSuggestions.length > 0 && (
                          <div className={styles.aiSuggestions}>
                            <h5>AI Suggestions:</h5>
                            <ul>
                              {case_.aiSuggestions.map((suggestion, index) => (
                                <li key={index}>{suggestion}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className={styles.supportFooter}>
          <div className={styles.contactInfo}>
            <p><strong>24/7 Support Available</strong></p>
            <p>Powered by TOPAY AI Assistant</p>
          </div>
        </div>
      </div>
    </div>
  );
}
