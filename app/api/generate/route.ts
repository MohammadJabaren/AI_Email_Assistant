import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  console.log('Received POST request to /api/generate');
  
  try {
    const body = await request.json();
    
    // Log the Ollama service URL (without sensitive parts)
    const ollamaUrl = process.env.OLLAMA_SERVICE_IP;
    console.log('Making request to Ollama service at:', ollamaUrl);
    
    const response = await fetch(`${ollamaUrl}/api/generate`, {
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

// Remove the GET handler since we're handling it in middleware
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
} 