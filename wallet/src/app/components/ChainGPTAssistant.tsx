'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, Clock } from 'lucide-react';
import styles from '../page.module.css';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

interface ChainGPTAssistantProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ChainGPTAssistant({ isOpen, onClose }: ChainGPTAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hello! I\'m your ChainGPT assistant for TOPAY wallet. I can help you with blockchain questions, wallet operations, quantum-safe technology, and more. How can I assist you today?',
      isUser: false,
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputMessage,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Simulate ChainGPT API call
      const response = await simulateChainGPTResponse(inputMessage);
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response,
        isUser: false,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Sorry, I encountered an error. Please try again later.',
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const quickQuestions = [
    "How do I create a secure wallet?",
    "What is quantum-safe encryption?",
    "How do I send a transaction?",
    "What are the benefits of TOPAY?",
    "How to backup my private key?"
  ];

  const handleQuickQuestion = (question: string) => {
    setInputMessage(question);
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.chainGptModal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.chainGptHeader}>
          <div className={styles.chainGptTitle}>
            <div className={styles.chainGptIcon}>
              <Bot size={24} color="#007bff" />
            </div>
            <div>
              <h3>ChainGPT Assistant</h3>
              <p>AI-powered blockchain & wallet support</p>
            </div>
          </div>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </div>

        <div className={styles.chainGptContent}>
          <div className={styles.messagesContainer}>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`${styles.message} ${message.isUser ? styles.userMessage : styles.assistantMessage}`}
              >
                <div className={styles.messageContent}>
                  <div className={styles.messageText}>{message.text}</div>
                  <div className={styles.messageTime}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className={`${styles.message} ${styles.assistantMessage}`}>
                <div className={styles.messageContent}>
                  <div className={styles.typingIndicator}>
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {messages.length === 1 && (
            <div className={styles.quickQuestions}>
              <h4>Quick Questions:</h4>
              <div className={styles.quickQuestionsList}>
                {quickQuestions.map((question, index) => (
                  <button
                    key={index}
                    className={styles.quickQuestionButton}
                    onClick={() => handleQuickQuestion(question)}
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className={styles.inputContainer}>
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything about blockchain, wallets, or TOPAY..."
              className={styles.messageInput}
              rows={2}
              disabled={isLoading}
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading}
              className={styles.sendButton}
            >
              {isLoading ? <Clock size={16} /> : <Send size={16} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Simulate ChainGPT API response
async function simulateChainGPTResponse(userMessage: string): Promise<string> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

  const message = userMessage.toLowerCase();

  // Blockchain and wallet-specific responses
  if (message.includes('wallet') && message.includes('create')) {
    return `To create a secure TOPAY wallet:

1. **Generate Keys**: Click "Generate New Wallet" to create quantum-safe key pairs
2. **Secure Storage**: Your private key is stored locally and never transmitted
3. **Backup**: Save your private key securely - it's your only way to access funds
4. **Verification**: Your wallet address is derived from your public key using TOPAY-Z512 encryption

TOPAY uses quantum-resistant cryptography to protect against future quantum computer attacks.`;
  }

  if (message.includes('quantum')) {
    return `TOPAY's Quantum-Safe Technology:

**TOPAY-Z512 Encryption**: Our proprietary quantum-resistant algorithm
**Post-Quantum Security**: Protected against quantum computer attacks
**KEM (Key Encapsulation)**: Advanced key exchange mechanism
**Future-Proof**: Designed to withstand quantum computing advances

Unlike traditional blockchains that use RSA or ECDSA (vulnerable to quantum attacks), TOPAY uses lattice-based cryptography that remains secure even against quantum computers.`;
  }

  if (message.includes('transaction') || message.includes('send')) {
    return `Sending TOPAY Transactions:

1. **Enter Details**: Recipient address, amount, and optional memo
2. **Private Key**: Enter your private key for signing
3. **Quantum Signature**: Transaction is signed with TOPAY-Z512
4. **Broadcast**: Transaction is added to the mempool
5. **Mining**: Miners include your transaction in the next block

**Tips**:
- Double-check recipient address
- Keep transaction fees reasonable
- Your private key never leaves your device
- Transactions are irreversible once confirmed`;
  }

  if (message.includes('private key') || message.includes('backup')) {
    return `Private Key Security Best Practices:

**Never Share**: Your private key is like your bank account password
**Multiple Backups**: Store in different secure locations
**Write Down**: Physical copies are safer than digital storage
**Avoid Screenshots**: Don't save as images on your device
**Encrypt Storage**: If storing digitally, use strong encryption

**Warning**: If you lose your private key, your funds are permanently lost. TOPAY cannot recover lost keys due to our decentralized, quantum-safe design.`;
  }

  if (message.includes('topay') || message.includes('benefit')) {
    return `TOPAY Foundation Benefits:

**Quantum-Safe**: First blockchain with built-in quantum resistance
**Fast Transactions**: Optimized consensus mechanism
**Low Fees**: Efficient network design keeps costs minimal
**Decentralized**: No central authority or control
**Privacy**: Enhanced privacy features with quantum encryption
**Sustainable**: Energy-efficient mining algorithm

TOPAY is designed for the post-quantum era, ensuring your digital assets remain secure as technology advances.`;
  }

  if (message.includes('mining') || message.includes('mine')) {
    return `TOPAY Mining Process:

**Proof of Work**: Secure consensus mechanism
**Quantum-Resistant**: Mining algorithm designed for post-quantum era
**Block Rewards**: Miners earn TOPAY tokens for securing the network
**Block Time**: Optimized for fast confirmation times
**Decentralized**: Anyone can participate in mining

Mining helps secure the TOPAY network while earning rewards. The quantum-safe design ensures long-term security.`;
  }

  if (message.includes('balance') || message.includes('check')) {
    return `Checking Your TOPAY Balance:

1. **Wallet Address**: Your balance is tied to your wallet address
2. **Blockchain Query**: Balance is calculated from all transactions
3. **Real-Time**: Updates automatically when new blocks are mined
4. **Transparency**: All transactions are publicly verifiable
5. **Security**: Only you can spend with your private key

Your balance represents confirmed transactions on the TOPAY blockchain. Pending transactions in the mempool are not included until mined.`;
  }

  if (message.includes('error') || message.includes('problem')) {
    return `Common TOPAY Wallet Issues & Solutions:

🔧 **Transaction Failed**:
- Check recipient address format
- Ensure sufficient balance
- Verify private key is correct

🔧 **Balance Not Updating**:
- Wait for block confirmation
- Refresh the application
- Check network connectivity

🔧 **Private Key Issues**:
- Ensure correct format (64 characters)
- Check for extra spaces
- Verify key corresponds to your wallet

Need more specific help? Describe your exact issue and I'll provide targeted assistance.`;
  }

  // Default response for general questions
  return `I'm here to help with TOPAY blockchain and wallet questions! I can assist with:

**Wallet Operations**: Creating, importing, and managing wallets
**Transactions**: Sending and receiving TOPAY tokens
**Security**: Quantum-safe features and best practices
**Mining**: Understanding the TOPAY mining process
**Blockchain**: Exploring blocks, transactions, and network stats

Feel free to ask specific questions about any of these topics, or try one of the quick questions above!`;
}