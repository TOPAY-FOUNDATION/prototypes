import { NextRequest, NextResponse } from 'next/server';

// Type definition for chat message
interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

export async function POST(request: NextRequest) {
  try {
    const { message, chatHistory = [] } = await request.json();

    // Get API key and URL from environment variables
    const apiKey = process.env.NEXT_PUBLIC_CHAINGPT_API_KEY;
    const apiUrl = process.env.NEXT_PUBLIC_CHAINGPT_API_URL || 'https://api.chaingpt.org/chat/stream';
    
    if (!apiKey || apiKey === 'your_chaingpt_api_key_here') {
      return NextResponse.json(
        { 
          error: 'ChainGPT API key not configured. Please add your API key to .env.local file.',
          fallback: true
        },
        { status: 400 }
      );
    }

    // Prepare chat history for ChainGPT API
    const formattedHistory = chatHistory.length > 0 
      ? (chatHistory as ChatMessage[]).map((msg) => `${msg.isUser ? 'User' : 'Assistant'}: ${msg.text}`).join('\n')
      : 'off';

    // Call ChainGPT API
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'general_assistant',
        question: message,
        chatHistory: formattedHistory,
        context: {
          company: 'TOPAY Foundation',
          description: 'Quantum-safe blockchain wallet and payment platform',
          tone: 'helpful and professional'
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ChainGPT API Error:', response.status, errorText);
      
      return NextResponse.json(
        { 
          error: `ChainGPT API error: ${response.status}`,
          fallback: true
        },
        { status: response.status }
      );
    }

    // Handle streaming response
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let fullResponse = '';

    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        fullResponse += chunk;
      }
    }

    return NextResponse.json({
      response: fullResponse || 'I apologize, but I received an empty response. Please try again.',
      success: true
    });

  } catch (error) {
    console.error('ChainGPT API Error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to connect to ChainGPT API',
        fallback: true
      },
      { status: 500 }
    );
  }
}