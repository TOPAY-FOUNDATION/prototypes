import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    const { address } = await params;

    if (!address) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    // In a real implementation, this would fetch from your blockchain API
    // For now, return empty array since we removed hardcoded data
    const securityEvents = {
      events: []
    };

    // You could integrate with your blockchain backend:
    // const response = await fetch(`${process.env.BLOCKCHAIN_API_URL}/wallet/${address}/security-events`);
    // const securityEvents = await response.json();

    return NextResponse.json(securityEvents);
  } catch (error) {
    console.error('Error fetching security events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch security events' },
      { status: 500 }
    );
  }
}