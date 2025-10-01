'use client';

import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Mic, MicOff, Volume2, VolumeX, Minimize2, Maximize2, Sparkles, Copy } from 'lucide-react';
import chainGPTService from '../lib/chaingpt-service';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isTyping?: boolean;
}

interface SuggestedAction {
  id: string;
  text: string;
  action: string;
  icon?: string;
}

interface AIAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  isModal?: boolean;
  className?: string;
}

const AIAssistant: React.FC<AIAssistantProps> = ({ 
  isOpen, 
  onClose, 
  isModal = true, 
  className = '' 
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [isClient, setIsClient] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  // Suggested actions based on context
  const [suggestedActions, setSuggestedActions] = useState<SuggestedAction[]>([
    { id: '1', text: 'Check my wallet balance', action: 'balance', icon: '💰' },
    { id: '2', text: 'Show recent transactions', action: 'transactions', icon: '📊' },
    { id: '3', text: 'How to send tokens?', action: 'help-send', icon: '📤' },
    { id: '4', text: 'Explain TOPAY tokenomics', action: 'tokenomics', icon: '📈' }
  ]);

  // Initialize client-side state
  useEffect(() => {
    setIsClient(true);
    setMessages([]);
  }, []);

  // Initialize speech recognition and synthesis
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Speech Recognition
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;
        recognitionRef.current.lang = 'en-US';
        
        recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
          const transcript = event.results[0][0].transcript;
          setInputValue(transcript);
          setIsListening(false);
        };
        
        recognitionRef.current.onerror = () => {
          setIsListening(false);
        };
        
        recognitionRef.current.onend = () => {
          setIsListening(false);
        };
      }
      
      // Speech Synthesis
      if (window.speechSynthesis) {
        synthRef.current = window.speechSynthesis;
      }
      
      setVoiceEnabled(!!SpeechRecognition && !!window.speechSynthesis);
    }
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, isMinimized]);

  const handleSendMessage = async (content?: string) => {
    const messageContent = content || inputValue.trim();
    if (!messageContent) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: messageContent,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    try {
      // Use ChainGPT service for AI response
      const response = await chainGPTService.generateResponse(messageContent);
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: response.content,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
      setSuggestedActions(response.suggestions);

      // Speak response if voice is enabled
      if (voiceEnabled && isSpeaking) {
        speakText(response.content);
      }
    } catch (error) {
      console.error('Error generating AI response:', error);
      
      // Fallback error message
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: 'I apologize, but I\'m experiencing technical difficulties. Please try again in a moment, or contact support if the issue persists.',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
      setSuggestedActions([]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleVoiceInput = () => {
    if (!voiceEnabled || !recognitionRef.current) return;
    
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const speakText = (text: string) => {
    if (!synthRef.current) return;
    
    synthRef.current.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 0.8;
    
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    synthRef.current.speak(utterance);
  };

  const toggleSpeech = () => {
    setIsSpeaking(!isSpeaking);
    if (isSpeaking && synthRef.current) {
      synthRef.current.cancel();
    }
  };

  const handleSuggestedAction = (action: SuggestedAction) => {
    handleSendMessage(action.text);
  };

  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  if (!isOpen) return null;

  const containerClasses = isModal 
    ? `ai-assistant ${className}`
    : `w-full h-full ${className}`;

  const contentClasses = isModal
    ? `ai-assistant-content ${isMinimized ? 'minimized' : ''}`
    : 'w-full h-full ai-assistant-content';

  return (
    <div className={containerClasses}>
      <div className={contentClasses}>
        {/* Header */}
        <div className="ai-assistant-header">
          <div className="ai-assistant-header-left">
            <div className="ai-assistant-icon">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="ai-assistant-title-container">
              <h3 className="ai-assistant-title">TOPAY AI Assistant</h3>
              <p className="ai-assistant-subtitle">Powered by ChainGPT</p>
            </div>
          </div>
          <div className="ai-assistant-header-right">
            {voiceEnabled && (
              <button
                onClick={toggleSpeech}
                className="ai-header-button"
                title={isSpeaking ? "Disable voice output" : "Enable voice output"}
              >
                {isSpeaking ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </button>
            )}
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="ai-header-button"
              title={isMinimized ? "Maximize" : "Minimize"}
            >
              {isMinimized ? <Maximize2 className="w-5 h-5" /> : <Minimize2 className="w-5 h-5" />}
            </button>
            <button
              onClick={onClose}
              className="ai-header-button close"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* Messages Area */}
            <div className="ai-assistant-messages">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`ai-message ${message.type === 'user' ? 'ai-message-user' : 'ai-message-assistant'}`}
                >
                  <div
                    className={`ai-message-bubble ${
                      message.type === 'user'
                        ? 'ai-message-bubble-user'
                        : 'ai-message-bubble-assistant'
                    }`}
                  >
                    <div className="ai-message-content">{message.content}</div>
                    <div className="ai-message-meta">
                      <div className="ai-message-time">
                        {isClient ? message.timestamp.toLocaleTimeString() : ''}
                      </div>
                      {message.type === 'assistant' && (
                        <div className="ai-message-actions">
                          <button
                            onClick={() => copyMessage(message.content)}
                            className="ai-message-action"
                            title="Copy message"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => speakText(message.content)}
                            className="ai-message-action"
                            title="Read aloud"
                          >
                            <Volume2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {isTyping && (
                <div className="ai-typing-indicator">
                  <div className="ai-typing-bubble">
                    <div className="ai-typing-dots">
                      <div className="ai-typing-dot"></div>
                      <div className="ai-typing-dot"></div>
                      <div className="ai-typing-dot"></div>
                      <span className="text-sm text-gray-500 ml-2">AI is crafting a response...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Suggested Actions */}
            {suggestedActions.length > 0 && (
              <div className="ai-suggestions">
                <div className="ai-suggestions-title">Quick Actions</div>
                <div className="ai-suggestions-list">
                  {suggestedActions.map((action) => (
                    <button
                      key={action.id}
                      onClick={() => handleSuggestedAction(action)}
                      className="ai-suggestion-button"
                    >
                      <span className="text-sm">{action.icon}</span>
                      <span>{action.text}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input Area */}
            <div className="ai-assistant-input">
              <div className="ai-input-container">
                <div className="ai-input-wrapper">
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Ask me anything about TOPAY, your wallet, or blockchain..."
                    className="ai-input-field"
                    disabled={isTyping}
                  />
                  <div className="ai-input-buttons">
                    {voiceEnabled && (
                      <button
                        onClick={handleVoiceInput}
                        className={`ai-voice-button ${isListening ? 'listening' : ''}`}
                        title={isListening ? "Stop listening" : "Voice input"}
                      >
                        {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                      </button>
                    )}
                    <button
                      onClick={() => handleSendMessage()}
                      disabled={!inputValue.trim() || isTyping}
                      className="ai-send-button"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
              <div className="ai-disclaimer">
                 🤖 Powered by ChainGPT. {chainGPTService.isConfigured() ? 'Connected to live AI service.' : 'Using fallback responses.'} Always verify important information.
               </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AIAssistant;