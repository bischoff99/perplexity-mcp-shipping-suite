import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Check MCP server health
    const easypostHealth = await fetch('http://localhost:3000/health').catch(() => null);
    const veeqoHealth = await fetch('http://localhost:3002/health').catch(() => null);

    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        easypost: {
          status: easypostHealth?.ok ? 'healthy' : 'unhealthy',
          port: 3000,
          tools: 15,
        },
        veeqo: {
          status: veeqoHealth?.ok ? 'healthy' : 'unhealthy',
          port: 3002,
          tools: 37,
        },
        web: {
          status: 'healthy',
          port: 3004,
          framework: 'Next.js 15',
        },
      },
    };

    return NextResponse.json(health);
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
