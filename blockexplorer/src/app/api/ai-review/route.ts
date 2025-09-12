import { NextRequest, NextResponse } from 'next/server';
import { getChainGPTService, ReportReviewRequest } from '@/lib/chaingpt';

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body: ReportReviewRequest = await request.json();

    // Validate required fields
    if (!body.reportType || !body.walletAddress || !body.description) {
      return NextResponse.json(
        { error: 'Missing required fields: reportType, walletAddress, description' },
        { status: 400 }
      );
    }

    // Validate wallet address format (basic validation)
    if (!/^0x[a-fA-F0-9]{40}$/.test(body.walletAddress)) {
      return NextResponse.json(
        { error: 'Invalid wallet address format' },
        { status: 400 }
      );
    }

    // Validate transaction hash if provided
    if (body.transactionHash && !/^0x[a-fA-F0-9]{64}$/.test(body.transactionHash)) {
      return NextResponse.json(
        { error: 'Invalid transaction hash format' },
        { status: 400 }
      );
    }

    // Get ChainGPT service instance
    const chainGPT = getChainGPTService();

    // Perform AI review
    const reviewResult = await chainGPT.reviewReport(body);

    // Return the analysis
    return NextResponse.json({
      success: true,
      review: reviewResult,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('AI Review API Error:', error);

    // Handle specific ChainGPT errors
    if (error instanceof Error) {
      if (error.message.includes('Invalid API key')) {
        return NextResponse.json(
          { error: 'AI service configuration error' },
          { status: 500 }
        );
      }
      if (error.message.includes('Insufficient credits')) {
        return NextResponse.json(
          { error: 'AI service temporarily unavailable' },
          { status: 503 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to analyze report. Please try again later.' },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET() {
  try {
    const chainGPT = getChainGPTService();
    const health = await chainGPT.checkHealth();
    
    return NextResponse.json({
      status: health.healthy ? 'operational' : 'error',
      message: health.message,
      timestamp: new Date().toISOString()
    });
  } catch {
    return NextResponse.json(
      { 
        status: 'error', 
        message: 'AI service not configured',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}