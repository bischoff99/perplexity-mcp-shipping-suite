import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { server, method, params } = body;

    if (!server || !method) {
      return NextResponse.json(
        { error: 'Missing required fields: server, method' },
        { status: 400 }
      );
    }

    let mcpUrl: string;
    switch (server) {
      case 'easypost':
        mcpUrl = 'http://localhost:3000';
        break;
      case 'veeqo':
        mcpUrl = 'http://localhost:3002';
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid server. Must be "easypost" or "veeqo"' },
          { status: 400 }
        );
    }

    // Forward the MCP request to the appropriate server
    const response = await fetch(`${mcpUrl}/mcp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        method,
        params: params || {},
      }),
    });

    if (!response.ok) {
      throw new Error(`MCP server responded with status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      {
        error: 'MCP request failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'MCP Proxy API',
    endpoints: {
      'POST /api/mcp': 'Proxy MCP requests to EasyPost or Veeqo servers',
    },
    servers: {
      easypost: {
        url: 'http://localhost:3000',
        tools: 15,
      },
      veeqo: {
        url: 'http://localhost:3002',
        tools: 37,
      },
    },
  });
}
