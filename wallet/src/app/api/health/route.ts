import { NextResponse } from 'next/server';

/**
 * Health check endpoint for the wallet application
 * Used by monitoring systems and test scripts
 */
export async function GET() {
  try {
    const healthStatus = {
      status: 'healthy',
      service: 'topay-wallet',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      port: process.env.PORT || 3000,
      checks: {
        database: 'healthy', // Could be extended to check actual DB connection
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
          unit: 'MB'
        },
        api: 'healthy'
      }
    };

    return NextResponse.json(healthStatus, { status: 200 });
  } catch (error) {
    console.error('Health check failed:', error);
    
    return NextResponse.json(
      {
        status: 'unhealthy',
        service: 'topay-wallet',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 503 }
    );
  }
}