import { NextRequest, NextResponse } from 'next/server';
import { getChainGPTService, ReportReviewRequest } from '@/lib/chaingpt';

export async function POST(request: NextRequest) {
  try {
    // Parse FormData to handle file uploads
    const formData = await request.formData();
    
    // Extract text fields
    const reportType = formData.get('reportType') as string;
    const walletAddress = formData.get('walletAddress') as string;
    const transactionHash = formData.get('transactionHash') as string;
    const description = formData.get('description') as string;
    const evidenceImagesCount = parseInt(formData.get('evidenceImages') as string || '0');

    // Extract image files
    const imageFiles: File[] = [];
    for (let i = 0; i < evidenceImagesCount; i++) {
      const file = formData.get(`imageFile_${i}`) as File;
      if (file) {
        imageFiles.push(file);
      }
    }

    // Create request body
    const reportData: ReportReviewRequest = {
      reportType,
      walletAddress,
      transactionHash,
      description,
      evidenceImages: evidenceImagesCount,
      imageFiles
    };

    // Validate required fields
    if (!reportData.reportType || !reportData.walletAddress || !reportData.description) {
      return NextResponse.json(
        { error: 'Missing required fields: reportType, walletAddress, description' },
        { status: 400 }
      );
    }

    // Validate wallet address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(reportData.walletAddress)) {
      return NextResponse.json(
        { error: 'Invalid wallet address format' },
        { status: 400 }
      );
    }

    // Validate transaction hash if provided
    if (reportData.transactionHash && !/^0x[a-fA-F0-9]{64}$/.test(reportData.transactionHash)) {
      return NextResponse.json(
        { error: 'Invalid transaction hash format' },
        { status: 400 }
      );
    }

    // Get ChainGPT service instance
    const chainGPT = getChainGPTService();

    // Perform automated analysis and enforcement
    const result = await chainGPT.analyzeAndEnforce(reportData);

    // Return comprehensive result
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      reportData: {
        reportType: reportData.reportType,
        walletAddress: reportData.walletAddress,
        transactionHash: reportData.transactionHash,
        description: reportData.description,
        evidenceCount: evidenceImagesCount
      },
      analysis: result.analysis,
      actionExecuted: result.actionExecuted,
      message: result.message,
      nextSteps: result.analysis.requiresHumanReview 
        ? ['Manual review required', 'Security team will investigate within 24 hours']
        : result.actionExecuted 
        ? ['Security measures implemented', 'Wallet monitoring active', 'Report logged for audit']
        : ['Analysis completed', 'Manual intervention may be required']
    });

  } catch (error) {
    console.error('Analyze and Enforce API Error:', error);

    // Handle specific errors
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
      { 
        error: 'Failed to analyze and enforce security measures. Please try again later.',
        success: false
      },
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
      service: 'Automated Analysis and Enforcement',
      capabilities: [
        'Report legitimacy verification',
        'Automated security analysis',
        'Wallet blocking/restriction',
        'Image evidence processing',
        'Risk assessment and scoring'
      ],
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json(
      { 
        status: 'error', 
        message: 'Service health check failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}