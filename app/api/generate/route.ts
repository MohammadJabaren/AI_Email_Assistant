import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  console.log('Received POST request to /api/generate');
  
  try {
    const body = await request.json();
    
    console.log('Making request to Ollama service:', process.env.OLLAMA_SERVICE_IP);
    
    const response = await fetch(`${process.env.OLLAMA_SERVICE_IP}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
      body: JSON.stringify(body),
      cache: 'no-store',
    });

    if (!response.ok) {
      console.error('Ollama service error:', response.status, response.statusText);
      throw new Error(`Ollama service responded with status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Generate API error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to generate response',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// Log all GET requests to help debug
export async function GET(request: Request) {
  console.log('Received GET request to /api/generate');
  console.log('Request headers:', Object.fromEntries(request.headers.entries()));
  
  return NextResponse.json(
    { 
      error: 'Method not allowed',
      message: 'This endpoint only accepts POST requests',
      timestamp: new Date().toISOString(),
    },
    { 
      status: 405,
      headers: {
        'Allow': 'POST',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      }
    }
  );
} 